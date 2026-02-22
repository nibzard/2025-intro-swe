"""FastAPI dependencies for authentication."""

import sqlite3

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from llm_answer_watcher.auth.security import decode_token
from llm_answer_watcher.storage.db import get_user_by_id, init_db_if_needed

# HTTP Bearer token security scheme
security = HTTPBearer()

# Default database path
DEFAULT_DB_PATH = "./output/watcher.db"


def get_db_path() -> str:
    """Get the database path. Can be overridden for testing."""
    return DEFAULT_DB_PATH


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db_path: str = Depends(get_db_path),
) -> dict:
    """
    FastAPI dependency to get the current authenticated user.

    Extracts and validates the JWT token from the Authorization header,
    then fetches the corresponding user from the database.

    Args:
        credentials: The HTTP Bearer credentials from the request header
        db_path: Database path (injectable for testing)

    Returns:
        User dict with id, username, email, is_active

    Raises:
        HTTPException 401: If token is missing, invalid, expired, or user not found
        HTTPException 401: If user account is disabled
    """
    token = credentials.credentials

    # Decode and validate the token
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check token type
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type. Use access token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Extract user ID from token
    try:
        user_id = int(payload["sub"])
    except (KeyError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Fetch user from database
    init_db_if_needed(db_path)

    with sqlite3.connect(db_path) as conn:
        user = get_user_by_id(conn, user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if account is active
    if not user["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is disabled",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Return user info (excluding sensitive fields like password_hash)
    return {
        "id": user["id"],
        "username": user["username"],
        "email": user["email"],
        "is_active": user["is_active"],
        "created_at": user["created_at"],
    }


async def get_current_active_user(
    current_user: dict = Depends(get_current_user),
) -> dict:
    """
    FastAPI dependency to get the current active user.

    This is a convenience wrapper that ensures the user is active.
    Use this for routes that require an active user account.

    Args:
        current_user: User from get_current_user dependency

    Returns:
        The current user dict

    Note:
        This is redundant since get_current_user already checks is_active,
        but it provides a more explicit dependency name for routes.
    """
    return current_user
