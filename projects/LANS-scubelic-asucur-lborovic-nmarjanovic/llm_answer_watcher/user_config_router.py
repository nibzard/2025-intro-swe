"""FastAPI router for user configuration endpoints (brands, intents)."""

import logging
import sqlite3
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from llm_answer_watcher.auth.dependencies import get_current_user, get_db_path
from llm_answer_watcher.storage.db import (
    create_user_brand,
    create_user_intent,
    delete_user_brand,
    delete_user_intent,
    get_user_brands,
    get_user_intents,
    init_db_if_needed,
    get_user_api_keys,
    delete_all_runs_for_user,
    get_user_settings,
    upsert_user_settings,
    get_all_runs,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/user", tags=["user-config"])

# ----------------------------------------------------------------------------
# Pydantic Models
# ----------------------------------------------------------------------------

class BrandCreate(BaseModel):
    brand_name: str
    is_mine: bool

class BrandResponse(BaseModel):
    id: int
    brand_name: str
    is_mine: bool
    created_at: str

class IntentCreate(BaseModel):
    intent_alias: str
    prompt: str

class IntentResponse(BaseModel):
    id: int
    intent_alias: str
    prompt: str
    created_at: str

# ----------------------------------------------------------------------------
# Brand Endpoints
# ----------------------------------------------------------------------------

@router.get("/brands", response_model=List[BrandResponse])
async def list_brands(
    current_user: dict = Depends(get_current_user),
    db_path: str = Depends(get_db_path),
):
    """
    List all brands configured for the current user.
    """
    init_db_if_needed(db_path)
    with sqlite3.connect(db_path) as conn:
        brands = get_user_brands(conn, current_user["id"])
    return brands

@router.post("/brands", response_model=BrandResponse, status_code=status.HTTP_201_CREATED)
async def add_brand(
    brand: BrandCreate,
    current_user: dict = Depends(get_current_user),
    db_path: str = Depends(get_db_path),
):
    """
    Add a new brand (mine or competitor) for the current user.
    """
    init_db_if_needed(db_path)
    with sqlite3.connect(db_path) as conn:
        try:
            brand_id = create_user_brand(
                conn, current_user["id"], brand.brand_name, brand.is_mine
            )
            # Fetch back to get created_at
            # Optimization: could return full object from db function, but re-fetching is safer
            brands = get_user_brands(conn, current_user["id"])
            created_brand = next((b for b in brands if b["id"] == brand_id), None)
            if not created_brand:
                 raise HTTPException(status_code=500, detail="Failed to retrieve created brand")
            return created_brand
        except sqlite3.IntegrityError:
             raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Brand '{brand.brand_name}' already exists",
            )

@router.delete("/brands/{brand_id}")
async def remove_brand(
    brand_id: int,
    current_user: dict = Depends(get_current_user),
    db_path: str = Depends(get_db_path),
):
    """
    Delete a brand.
    """
    init_db_if_needed(db_path)
    with sqlite3.connect(db_path) as conn:
        deleted = delete_user_brand(conn, brand_id, current_user["id"])
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brand not found",
        )
    return {"message": "Brand deleted"}

# ----------------------------------------------------------------------------
# Intent Endpoints
# ----------------------------------------------------------------------------

@router.get("/intents", response_model=List[IntentResponse])
async def list_intents(
    current_user: dict = Depends(get_current_user),
    db_path: str = Depends(get_db_path),
):
    """
    List all intents configured for the current user.
    """
    init_db_if_needed(db_path)
    with sqlite3.connect(db_path) as conn:
        intents = get_user_intents(conn, current_user["id"])
    return intents

@router.post("/intents", response_model=IntentResponse, status_code=status.HTTP_201_CREATED)
async def add_intent(
    intent: IntentCreate,
    current_user: dict = Depends(get_current_user),
    db_path: str = Depends(get_db_path),
):
    """
    Add a new intent for the current user.
    """
    init_db_if_needed(db_path)
    with sqlite3.connect(db_path) as conn:
        try:
            intent_id = create_user_intent(
                conn, current_user["id"], intent.intent_alias, intent.prompt
            )
            intents = get_user_intents(conn, current_user["id"])
            created_intent = next((i for i in intents if i["id"] == intent_id), None)
            if not created_intent:
                 raise HTTPException(status_code=500, detail="Failed to retrieve created intent")
            return created_intent
        except sqlite3.IntegrityError:
             raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Intent alias '{intent.intent_alias}' already exists",
            )

@router.delete("/intents/{intent_id}")
async def remove_intent(
    intent_id: int,
    current_user: dict = Depends(get_current_user),
    db_path: str = Depends(get_db_path),
):
    """
    Delete an intent.
    """
    init_db_if_needed(db_path)
    with sqlite3.connect(db_path) as conn:
        deleted = delete_user_intent(conn, intent_id, current_user["id"])
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Intent not found",
        )
    return {"message": "Intent deleted"}


# ----------------------------------------------------------------------------
# Settings & Data Management Endpoints
# ----------------------------------------------------------------------------

class SettingsUpdate(BaseModel):
    settings: dict

class ExportResponse(BaseModel):
    user: dict
    brands: list[BrandResponse]
    intents: list[IntentResponse]
    api_keys: list[dict]
    settings: dict
    runs_summary: list[dict]
    export_date: str

@router.get("/settings")
async def get_settings(
    current_user: dict = Depends(get_current_user),
    db_path: str = Depends(get_db_path),
):
    """Get user settings."""
    init_db_if_needed(db_path)
    with sqlite3.connect(db_path) as conn:
        settings = get_user_settings(conn, current_user["id"])
    return settings or {}

@router.put("/settings")
async def update_settings(
    settings_data: SettingsUpdate,
    current_user: dict = Depends(get_current_user),
    db_path: str = Depends(get_db_path),
):
    """Update user settings."""
    init_db_if_needed(db_path)
    import json
    with sqlite3.connect(db_path) as conn:
        upsert_user_settings(conn, current_user["id"], json.dumps(settings_data.settings))
    return {"message": "Settings updated"}

@router.delete("/history")
async def clear_history(
    current_user: dict = Depends(get_current_user),
    db_path: str = Depends(get_db_path),
):
    """Delete all search history (runs) for the current user."""
    init_db_if_needed(db_path)
    with sqlite3.connect(db_path) as conn:
        count = delete_all_runs_for_user(conn, current_user["id"])
    return {"message": f"Deleted {count} runs"}

@router.get("/export", response_model=ExportResponse)
async def export_data(
    current_user: dict = Depends(get_current_user),
    db_path: str = Depends(get_db_path),
):
    """Export all user data."""
    from datetime import datetime
    
    init_db_if_needed(db_path)
    with sqlite3.connect(db_path) as conn:
        brands = get_user_brands(conn, current_user["id"])
        intents = get_user_intents(conn, current_user["id"])
        keys = get_user_api_keys(conn, current_user["id"])
        settings = get_user_settings(conn, current_user["id"])
        runs = get_all_runs(conn, current_user["id"])

    # Sanitize user info
    user_info = {
        "username": current_user["username"],
        "email": current_user["email"],
        "created_at": current_user["created_at"],
    }
    
    # Format keys (metadata only)
    formatted_keys = [
        {"provider": k["provider"], "key_name": k["key_name"], "created_at": k["created_at"]}
        for k in keys
    ]

    return ExportResponse(
        user=user_info,
        brands=[BrandResponse(**b) for b in brands],
        intents=[IntentResponse(**i) for i in intents],
        api_keys=formatted_keys,
        settings=settings or {},
        runs_summary=runs,
        export_date=datetime.now().isoformat()
    )
