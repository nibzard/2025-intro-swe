from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ValidationError
import yaml
import os
import sqlite3
import logging
import traceback

from llm_answer_watcher.storage.db import init_db_if_needed, get_run_summary
from llm_answer_watcher.config.schema import (
    WatcherConfig,
    RuntimeConfig,
    RuntimeModel,
    Brands,
    Intent,
    RunSettings,
    ModelConfig,
)
from llm_answer_watcher.llm_runner.runner import run_all
from llm_answer_watcher.system_prompts import get_provider_default
from llm_answer_watcher.auth.router import router as auth_router

logger = logging.getLogger(__name__)

app = FastAPI(title="LLM Answer Watcher API", version="0.2.0")

# CORS configuration - must be added BEFORE routers
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handler to ensure CORS headers on errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle all unhandled exceptions with proper CORS headers."""
    logger.error(f"Unhandled exception: {exc}\n{traceback.format_exc()}")
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
    )


# Include authentication router
app.include_router(auth_router)


class ConfigData(BaseModel):
    api_keys: dict[str, str]
    yaml_config: str


def build_runtime_config_from_dict(raw_config: dict, api_keys: dict[str, str]) -> RuntimeConfig:
    """
    Build a RuntimeConfig from a parsed YAML dict and API key.

    This is similar to load_config() but works from an in-memory dict
    instead of a file, and takes the API key directly.
    """
    # Validate with WatcherConfig first
    try:
        watcher_config = WatcherConfig.model_validate(raw_config)
    except ValidationError as e:
        error_messages = []
        for error in e.errors():
            loc = ".".join(str(x) for x in error["loc"])
            msg = error["msg"]
            error_messages.append(f"  - {loc}: {msg}")
        raise ValueError(
            "Configuration validation failed:\n" + "\n".join(error_messages)
        )

    # Build resolved models with the provided API key
    resolved_models = []
    for model_config in watcher_config.run_settings.models:
        # Get system prompt
        try:
            prompt_obj = get_provider_default(model_config.provider)
            system_prompt_text = prompt_obj.prompt
        except Exception:
            system_prompt_text = "You are a helpful AI assistant."
        
        api_key = api_keys.get(model_config.provider)
        if not api_key:
            raise ValueError(f"API key for provider '{model_config.provider}' not found.")

        runtime_model = RuntimeModel(
            provider=model_config.provider,
            model_name=model_config.model_name,
            api_key=api_key,
            system_prompt=system_prompt_text,
            tools=model_config.tools,
            tool_choice=model_config.tool_choice,
        )
        resolved_models.append(runtime_model)

    # Build RuntimeConfig
    return RuntimeConfig(
        run_settings=watcher_config.run_settings,
        extraction_settings=None,  # Simplified - no extraction settings for now
        brands=watcher_config.brands,
        intents=watcher_config.intents,
        models=resolved_models,
        operation_models=[],
        runner_configs=None,
        global_operations=[],
    )


@app.get("/")
def read_root():
    return {"message": "LLM Answer Watcher API", "version": "0.2.0"}


@app.post("/run_watcher")
async def run_watcher_endpoint(config_data: ConfigData):
    """
    Run the LLM Answer Watcher with the provided configuration.

    This endpoint:
    1. Parses the YAML configuration
    2. Builds a RuntimeConfig with the provided API key
    3. Calls the core run_all() function
    4. Returns the run results
    """
    # Parse YAML configuration
    try:
        raw_config = yaml.safe_load(config_data.yaml_config)
    except yaml.YAMLError as e:
        raise HTTPException(status_code=400, detail=f"Invalid YAML configuration: {e}")

    if not raw_config:
        raise HTTPException(status_code=400, detail="Configuration cannot be empty")

    if not config_data.api_keys:
        raise HTTPException(status_code=400, detail="API keys are required.")

    # Build RuntimeConfig from the parsed YAML
    try:
        runtime_config = build_runtime_config_from_dict(raw_config, config_data.api_keys)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to build runtime config: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Configuration error: {e}")

    # Ensure output directory exists and DB is initialized
    sqlite_db_path = runtime_config.run_settings.sqlite_db_path
    try:
        os.makedirs(os.path.dirname(sqlite_db_path) or ".", exist_ok=True)
        init_db_if_needed(sqlite_db_path)
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Database initialization error: {e}")

    # Run the watcher - call the actual run_all() function
    try:
        logger.info("Starting run_all() execution...")
        result = await run_all(runtime_config)
        logger.info(f"run_all() completed: run_id={result['run_id']}, success={result['success_count']}/{result['total_queries']}")
    except Exception as e:
        logger.error(f"run_all() failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Watcher execution error: {e}")

    # Return the result directly
    return {
        "message": "Watcher execution completed",
        "run_id": result["run_id"],
        "timestamp_utc": result["timestamp_utc"],
        "output_dir": result["output_dir"],
        "total_queries": result["total_queries"],
        "success_count": result["success_count"],
        "error_count": result["error_count"],
        "total_cost_usd": result["total_cost_usd"],
        "errors": result.get("errors", []),
    }

@app.get("/results/{run_id}")
async def get_run_results(run_id: str):
    import json
    # Determine SQLite DB path based on typical output location
    # In a real app, this might come from a config or be passed from the run_watcher call
    sqlite_db_path = "./output/watcher.db" 

    try:
        init_db_if_needed(sqlite_db_path) # Ensure DB is initialized
        with sqlite3.connect(sqlite_db_path) as conn:
            conn.row_factory = sqlite3.Row # To access columns by name

            run_summary = get_run_summary(conn, run_id)
            if not run_summary:
                raise HTTPException(status_code=404, detail=f"Run with ID '{run_id}' not found.")
            
            # Fetch raw answers
            answers_cursor = conn.execute(
                """
                SELECT intent_id, prompt, answer_text, model_name, estimated_cost_usd, usage_meta_json
                FROM answers_raw
                WHERE run_id = ?
                """,
                (run_id,)
            )
            raw_answers = answers_cursor.fetchall()

            # Fetch mentions
            mentions_cursor = conn.execute(
                """
                SELECT intent_id, model_name, brand_name, normalized_name, is_mine, rank_position, sentiment, mention_context
                FROM mentions
                WHERE run_id = ?
                ORDER BY intent_id, is_mine DESC, rank_position ASC
                """,
                (run_id,)
            )
            mentions = mentions_cursor.fetchall()

            # Structure results
            intents_data = {}
            answer_map = {}

            for answer in raw_answers:
                intent_id = answer['intent_id']
                if intent_id not in intents_data:
                    intents_data[intent_id] = {
                        "intent_id": intent_id,
                        "prompt": answer['prompt'],
                        "answers": [],
                    }
                
                usage_meta = {}
                if answer['usage_meta_json']:
                    try:
                        usage_meta = json.loads(answer['usage_meta_json'])
                    except (json.JSONDecodeError, TypeError):
                        pass # Keep usage_meta empty if parsing fails

                answer_obj = {
                    "answer": answer['answer_text'],
                    "model": answer['model_name'],
                    "cost_usd": answer['estimated_cost_usd'],
                    "mentions": [],
                    "usage": usage_meta
                }
                intents_data[intent_id]['answers'].append(answer_obj)
                answer_map[(intent_id, answer['model_name'])] = answer_obj
            
            for mention in mentions:
                intent_id = mention['intent_id']
                model_name = mention['model_name']
                
                if (intent_id, model_name) in answer_map:
                    answer_map[(intent_id, model_name)]["mentions"].append({
                        "brand": mention['brand_name'],
                        "normalized_name": mention['normalized_name'],
                        "is_mine": bool(mention['is_mine']),
                        "rank": mention['rank_position'],
                        "sentiment": mention['sentiment'],
                        "context": mention['mention_context']
                    })
            
            return {
                "run_summary": dict(run_summary),
                "intents_data": list(intents_data.values())
            }

    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")
