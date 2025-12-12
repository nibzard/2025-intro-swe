from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import yaml
import os
import sqlite3
import datetime

from llm_answer_watcher.storage.db import init_db_if_needed, insert_run, insert_answer_raw, insert_mention, get_run_summary
from llm_answer_watcher.utils.time import utc_timestamp

# Assuming these are available in the project structure
# from llm_answer_watcher.llm_runner.gemini_client import GeminiClient
# from llm_answer_watcher.extractor.mention_detector import MentionDetector
# from llm_answer_watcher.config.schema import WatcherConfig as WatcherConfigSchema # To validate config

app = FastAPI()

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ConfigData(BaseModel):
    api_key: str
    yaml_config: str

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.post("/run_watcher")
async def run_watcher(config_data: ConfigData):
    try:
        config = yaml.safe_load(config_data.yaml_config)
        # TODO: Add Pydantic validation for the config using WatcherConfigSchema
    except yaml.YAMLError as e:
        raise HTTPException(status_code=400, detail=f"Invalid YAML configuration: {e}")

    # Extract relevant parts of the configuration
    run_settings = config.get("run_settings")
    if not run_settings:
        raise HTTPException(status_code=400, detail="Configuration missing 'run_settings'.")
    
    models = run_settings.get("models")
    if not models or not isinstance(models, list) or not models:
        raise HTTPException(status_code=400, detail="Configuration 'run_settings' must contain a non-empty list of 'models'.")

    brands = config.get("brands")
    if not brands:
        raise HTTPException(status_code=400, detail="Configuration missing 'brands'.")
    
    my_brands = brands.get("mine")
    competitor_brands = brands.get("competitors")

    if not my_brands or not isinstance(my_brands, list) or not any(b.strip() for b in my_brands):
        raise HTTPException(status_code=400, detail="Configuration 'brands.mine' must contain at least one non-empty brand.")
    
    # Competitors can be empty
    if not competitor_brands or not isinstance(competitor_brands, list):
        competitor_brands = []

    intents = config.get("intents")
    if not intents or not isinstance(intents, list) or not any(i.get("id") and i.get("prompt") for i in intents):
        raise HTTPException(status_code=400, detail="Configuration 'intents' must contain at least one valid intent with 'id' and 'prompt'.")

    if not config_data.api_key:
        raise HTTPException(status_code=400, detail="Gemini API key is required.")
    
    # Set the API key as an environment variable for the Gemini client
    os.environ['GEMINI_API_KEY'] = config_data.api_key

    # Determine SQLite DB path
    sqlite_db_path = run_settings.get("sqlite_db_path", "./output/watcher.db")

    # Initialize DB and get connection
    try:
        init_db_if_needed(sqlite_db_path)
        with sqlite3.connect(sqlite_db_path) as conn:
            # Generate a run ID
            run_id = datetime.datetime.now().strftime("%Y-%m-%dT%H-%M-%SZ") # Simpler run_id for now

            # Insert run record
            insert_run(
                conn,
                run_id=run_id,
                timestamp_utc=utc_timestamp(),
                total_intents=len(intents),
                total_models=len(models)
            )

            results = []
            for intent in intents:
                intent_id = intent.get("id")
                prompt = intent.get("prompt")
                
                # Already validated that intents are valid, but defensive check
                if not intent_id or not prompt:
                    continue
                
                # Assume a single model for simplicity for now
                model_config = models[0]
                model_provider = model_config.get("provider")
                model_name = model_config.get("model_name")

                if not model_provider or not model_name:
                    raise HTTPException(status_code=400, detail="Model configuration requires 'provider' and 'model_name'.")

                # Simulate Gemini API call
                response_text = f"This is a simulated response for '{prompt}'. It mentions {my_brands[0] if my_brands else 'my_brand'} and {competitor_brands[0] if competitor_brands else 'competitor_brand'}."
                
                # Insert raw answer
                insert_answer_raw(
                    conn,
                    run_id=run_id,
                    intent_id=intent_id,
                    model_provider=model_provider,
                    model_name=model_name,
                    timestamp_utc=utc_timestamp(),
                    prompt=prompt,
                    answer_text=response_text,
                    estimated_cost_usd=0.001 # Simulated cost
                )

                # Simulate brand mention detection and insert
                simulated_mentions = []
                all_brands = my_brands + competitor_brands
                for brand in all_brands:
                    if brand.strip() and brand.lower() in response_text.lower():
                        normalized_brand = brand.lower().replace(" ", "-")
                        is_mine = brand in my_brands
                        insert_mention(
                            conn,
                            run_id=run_id,
                            timestamp_utc=utc_timestamp(),
                            intent_id=intent_id,
                            model_provider=model_provider,
                            model_name=model_name,
                            brand_name=brand,
                            normalized_name=normalized_brand,
                            is_mine=is_mine,
                            match_type="simulated"
                        )
                        simulated_mentions.append({"brand": brand, "is_mine": is_mine, "rank": 1, "context": response_text})

                # Append results for frontend response
                results.append({
                    "intent_id": intent_id,
                    "prompt": prompt,
                    "answer": response_text,
                    "mentions": simulated_mentions,
                    "model": model_name,
                    "tokens_used": 0, # Placeholder
                    "cost_usd": 0.0 # Placeholder
                })
            conn.commit() # Commit all changes for the run
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")
    
    return {"message": "Watcher logic executed and results stored", "run_id": run_id, "results": results}

@app.get("/results/{run_id}")
async def get_run_results(run_id: str):
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
                SELECT intent_id, prompt, answer_text, model_name, estimated_cost_usd
                FROM answers_raw
                WHERE run_id = ?
                """,
                (run_id,)
            )
            raw_answers = answers_cursor.fetchall()

            # Fetch mentions
            mentions_cursor = conn.execute(
                """
                SELECT intent_id, brand_name, normalized_name, is_mine, rank_position, sentiment, mention_context
                FROM mentions
                WHERE run_id = ?
                ORDER BY intent_id, is_mine DESC, rank_position ASC
                """,
                (run_id,)
            )
            mentions = mentions_cursor.fetchall()

            # Structure results
            intents_data = {}
            for answer in raw_answers:
                intent_id = answer['intent_id']
                if intent_id not in intents_data:
                    intents_data[intent_id] = {
                        "intent_id": intent_id,
                        "prompt": answer['prompt'],
                        "answer": answer['answer_text'],
                        "model": answer['model_name'],
                        "cost_usd": answer['estimated_cost_usd'],
                        "mentions": []
                    }
            
            for mention in mentions:
                intent_id = mention['intent_id']
                if intent_id in intents_data:
                    intents_data[intent_id]["mentions"].append({
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
