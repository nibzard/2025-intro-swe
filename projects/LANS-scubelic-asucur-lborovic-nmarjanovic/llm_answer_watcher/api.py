from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ValidationError
import yaml
import os
import sqlite3
import logging
import traceback

from llm_answer_watcher.auth.dependencies import get_current_user
from llm_answer_watcher.storage.db import init_db_if_needed, get_run_summary, get_all_runs
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
from llm_answer_watcher.user_config_router import router as user_config_router

from llm_answer_watcher.llm_runner.gemini_client import GeminiClient
from llm_answer_watcher.llm_runner.groq_client import GroqClient

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
    allow_origin_regex="https?://.*",
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
# Include user configuration router
app.include_router(user_config_router)


class ConfigData(BaseModel):
    api_keys: dict[str, str]
    yaml_config: str

class OptimizePromptRequest(BaseModel):
    prompt: str
    provider: str
    api_key: str
    model_name: str
    competitors: list[str] = []
    my_brands: list[str] = []

PROMPT_ENGINEER_SYSTEM_PROMPT_TEMPLATE = """ACT AS: A Professional Prompt Engineer for AI Brand Analysis.

TASK: Transform the user's simple description into a high-quality, 
analytical search query (Intent) for an LLM.

RULES FOR GENERATING THE PROMPT:
1. TARGET: The generated prompt must be addressed to another AI (like Gemini or Llama).
2. STRUCTURE: Tell the AI to use bullet points and bold brand names (**Brand**).
3. TONE: The generated prompt must demand an objective, unbiased comparison.
4. CONTEXT:
   - User's Brand(s): {my_brands_list}
   - Known Competitors: {competitors_list}
   
INSTRUCTION FOR BRAND NAMES:
You MUST inject the actual brand names from the lists above into the generated prompt. 
- Replace references to "my brand" or "our brand" with: {my_brands_list}
- Replace references to "competitors" with: {competitors_list}
- DO NOT use placeholders like "[MyBrand]" or "[Competitors]". Use the REAL NAMES.

EXAMPLE:
User Input: "Compare our prices"
Context: MyBrand: "Apple", Competitors: "Samsung, Google"
Generated Output: "Analyze the pricing model of **Apple** vs **Samsung** and **Google**. Provide a clear comparison in bullet points. Bold all brand names."

STRICT: Output ONLY the generated prompt text. No introduction."""

@app.post("/optimize_prompt")
async def optimize_prompt(request: OptimizePromptRequest):
    """
    Optimize a simple user prompt using the 'Professional Prompt Engineer' persona.
    """
    if not request.api_key:
        raise HTTPException(status_code=400, detail="API key is required")

    competitors_list = ", ".join([c for c in request.competitors if c.strip()]) or "None provided"
    my_brands_list = ", ".join([b for b in request.my_brands if b.strip()]) or "None provided"
    
    system_prompt = PROMPT_ENGINEER_SYSTEM_PROMPT_TEMPLATE.format(
        competitors_list=competitors_list,
        my_brands_list=my_brands_list
    )
    
    logger.info(f"Optimize Prompt Request - My Brands: {my_brands_list}, Competitors: {competitors_list}")
    logger.debug(f"System Prompt: {system_prompt}")

    user_message = f"User Description: {request.prompt}"

    try:
        if request.provider == "google":
            client = GeminiClient(request.model_name, request.api_key, system_prompt)
        elif request.provider == "groq":
            client = GroqClient(request.model_name, request.api_key, system_prompt)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported provider: {request.provider}")

        response = await client.generate_answer(user_message)
        
        # Clean up response (remove potential quotes or markdown blocks if the LLM adds them)
        optimized_prompt = response.answer_text.strip()
        if optimized_prompt.startswith('"') and optimized_prompt.endswith('"'):
            optimized_prompt = optimized_prompt[1:-1]
        
        return {"optimized_prompt": optimized_prompt}

    except Exception as e:
        logger.error(f"Prompt optimization failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))



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
async def run_watcher_endpoint(
    config_data: ConfigData,
    current_user: dict = Depends(get_current_user),
):
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
        logger.info(f"Starting run_all() execution for user {current_user['username']} (id={current_user['id']})...")
        result = await run_all(runtime_config, user_id=current_user['id'])
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

@app.get("/runs")
async def list_runs(current_user: dict = Depends(get_current_user)):
    """List all historical runs for the current user."""
    sqlite_db_path = "./output/watcher.db"
    try:
        init_db_if_needed(sqlite_db_path)
        with sqlite3.connect(sqlite_db_path) as conn:
            runs = get_all_runs(conn, user_id=current_user["id"])
            return runs
    except Exception as e:
        logger.error(f"Failed to list runs: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

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
