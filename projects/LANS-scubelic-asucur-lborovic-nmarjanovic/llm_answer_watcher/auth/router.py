"""FastAPI router for authentication endpoints."""

import hashlib
import logging
import sqlite3
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from llm_answer_watcher.auth.dependencies import get_current_user, get_db_path
from llm_answer_watcher.auth.encryption import decrypt_api_key, encrypt_api_key
from llm_answer_watcher.auth.schemas import (
    APIKeyCreate,
    APIKeyResponse,
    Token,
    TokenRefresh,
    UserCreate,
    UserLogin,
    UserResponse,
    UserUpdate,
)
from llm_answer_watcher.auth.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from llm_answer_watcher.storage.db import (
    create_user,
    create_user_api_key,
    delete_user_api_key,
    get_refresh_token,
    get_user_api_key_by_id,
    get_user_api_key_by_provider,
    get_user_api_keys,
    get_user_by_email,
    get_user_by_username,
    get_user_by_id,
    init_db_if_needed,
    revoke_all_user_refresh_tokens,
    revoke_refresh_token,
    store_refresh_token,
    update_user_api_key,
    update_user_last_login,
    update_user,
)
from llm_answer_watcher.utils.time import utc_timestamp

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["authentication"])


def _hash_token(token: str) -> str:
    """Hash a token for storage (refresh tokens are stored as hashes)."""
    return hashlib.sha256(token.encode()).hexdigest()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db_path: str = Depends(get_db_path),
):
    """
    Register a new user account.

    Creates a new user with the provided username, email, and password.
    Password is hashed using bcrypt before storage.

    Args:
        user_data: Registration data (username, email, password)

    Returns:
        Created user information

    Raises:
        HTTPException 400: If username or email already exists
    """
    init_db_if_needed(db_path)

    with sqlite3.connect(db_path) as conn:
        # Check if username already exists
        existing_user = get_user_by_username(conn, user_data.username)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered",
            )

        # Check if email already exists
        existing_email = get_user_by_email(conn, user_data.email)
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        # Hash password and create user
        password_hash = hash_password(user_data.password)
        user_id = create_user(conn, user_data.username, user_data.email, password_hash)

        # Fetch created user
        user = get_user_by_username(conn, user_data.username)

    logger.info(f"New user registered: {user_data.username}")

    return UserResponse(
        id=user["id"],
        username=user["username"],
        email=user["email"],
        created_at=user["created_at"],
        is_active=user["is_active"],
    )


@router.post("/login", response_model=Token)
async def login(
    credentials: UserLogin,
    db_path: str = Depends(get_db_path),
):
    """
    Authenticate user and return JWT tokens.

    Accepts username or email as the login identifier.
    Returns both access token (short-lived) and refresh token (long-lived).

    Args:
        credentials: Login credentials (username/email and password)

    Returns:
        Access token and refresh token

    Raises:
        HTTPException 401: If credentials are invalid
    """
    init_db_if_needed(db_path)

    with sqlite3.connect(db_path) as conn:
        # Try to find user by username or email
        user = get_user_by_username(conn, credentials.username)
        if user is None:
            user = get_user_by_email(conn, credentials.username)

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password",
            )

        # Verify password
        if not verify_password(credentials.password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password",
            )

        # Check if account is active
        if not user["is_active"]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is disabled",
            )

        # Update last login timestamp
        update_user_last_login(conn, user["id"])

        # Create tokens
        access_token = create_access_token(user["id"])
        refresh_token = create_refresh_token(user["id"])

        # Store refresh token hash
        refresh_token_hash = _hash_token(refresh_token)
        # Calculate expiration (7 days from now)
        from llm_answer_watcher.auth.security import REFRESH_TOKEN_EXPIRE_DAYS
        from datetime import timedelta

        expires_at = (
            datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        ).isoformat().replace("+00:00", "Z")

        store_refresh_token(conn, user["id"], refresh_token_hash, expires_at)

    logger.info(f"User logged in: {user['username']}")

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
    )


@router.post("/refresh", response_model=Token)
async def refresh_tokens(
    token_data: TokenRefresh,
    db_path: str = Depends(get_db_path),
):
    """
    Refresh access token using refresh token.

    Validates the refresh token, revokes it, and issues new tokens.
    This implements refresh token rotation for security.

    Args:
        token_data: Refresh token

    Returns:
        New access token and refresh token

    Raises:
        HTTPException 401: If refresh token is invalid, expired, or revoked
    """
    # Decode refresh token
    payload = decode_token(token_data.refresh_token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )

    user_id = int(payload["sub"])
    token_hash = _hash_token(token_data.refresh_token)

    init_db_if_needed(db_path)

    with sqlite3.connect(db_path) as conn:
        # Verify refresh token exists and is not revoked
        stored_token = get_refresh_token(conn, token_hash)
        if stored_token is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token not found",
            )

        if stored_token["revoked_at"] is not None:
            # Token was revoked - possible token theft, revoke all tokens for this user
            revoke_all_user_refresh_tokens(conn, user_id)
            logger.warning(f"Revoked refresh token reuse detected for user {user_id}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has been revoked",
            )

        # Check expiration
        expires_at = datetime.fromisoformat(stored_token["expires_at"].replace("Z", "+00:00"))
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has expired",
            )

        # Revoke old refresh token (rotation)
        revoke_refresh_token(conn, token_hash)

        # Create new tokens
        access_token = create_access_token(user_id)
        new_refresh_token = create_refresh_token(user_id)

        # Store new refresh token
        new_token_hash = _hash_token(new_refresh_token)
        from llm_answer_watcher.auth.security import REFRESH_TOKEN_EXPIRE_DAYS
        from datetime import timedelta

        new_expires_at = (
            datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        ).isoformat().replace("+00:00", "Z")

        store_refresh_token(conn, user_id, new_token_hash, new_expires_at)

    return Token(
        access_token=access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
    )


@router.post("/logout")
async def logout(
    current_user: dict = Depends(get_current_user),
    db_path: str = Depends(get_db_path),
):
    """
    Logout user by revoking all refresh tokens.

    This invalidates all sessions for the user.

    Args:
        current_user: Current authenticated user

    Returns:
        Success message
    """
    init_db_if_needed(db_path)

    with sqlite3.connect(db_path) as conn:
        revoked_count = revoke_all_user_refresh_tokens(conn, current_user["id"])

    logger.info(f"User logged out: {current_user['username']} (revoked {revoked_count} tokens)")

    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """
    Get current user profile.

    Args:
        current_user: Current authenticated user

    Returns:
        User profile information
    """
    return UserResponse(
        id=current_user["id"],
        username=current_user["username"],
        email=current_user["email"],
        created_at=current_user["created_at"],
        is_active=current_user["is_active"],
    )


@router.put("/me", response_model=UserResponse)
async def update_me(
    user_update: UserUpdate,
    current_user: dict = Depends(get_current_user),
    db_path: str = Depends(get_db_path),
):
    """
    Update current user profile.

    Args:
        user_update: New profile data
        current_user: Current authenticated user

    Returns:
        Updated user profile
    """
    init_db_if_needed(db_path)

    with sqlite3.connect(db_path) as conn:
        # Check if username exists if being updated
        if user_update.username and user_update.username != current_user["username"]:
            existing = get_user_by_username(conn, user_update.username)
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already taken",
                )

        # Check if email exists if being updated
        if user_update.email and user_update.email != current_user["email"]:
            existing = get_user_by_email(conn, user_update.email)
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already taken",
                )

        updated = update_user(
            conn,
            current_user["id"],
            username=user_update.username,
            email=user_update.email,
        )
        
        if not updated:
            raise HTTPException(status_code=404, detail="User not found")

        # Fetch updated user
        user = get_user_by_id(conn, current_user["id"])

    logger.info(f"User profile updated: {user['username']}")

    return UserResponse(
        id=user["id"],
        username=user["username"],
        email=user["email"],
        created_at=user["created_at"],
        is_active=user["is_active"],
    )


# ============================================================================
# API Key Management Endpoints
# ============================================================================


@router.post("/api-keys", response_model=APIKeyResponse, status_code=status.HTTP_201_CREATED)
async def add_api_key(
    key_data: APIKeyCreate,
    current_user: dict = Depends(get_current_user),
    db_path: str = Depends(get_db_path),
):
    """
    Store an encrypted API key for the current user.

    The API key is encrypted using Fernet (AES) before storage.

    Args:
        key_data: API key data (provider, api_key, optional key_name)
        current_user: Current authenticated user

    Returns:
        API key metadata (not the actual key)

    Raises:
        HTTPException 400: If key for this provider/name already exists
    """
    init_db_if_needed(db_path)

    with sqlite3.connect(db_path) as conn:
        # Check if key already exists for this provider/name
        existing = get_user_api_key_by_provider(
            conn, current_user["id"], key_data.provider, key_data.key_name
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"API key for {key_data.provider} already exists",
            )

        # Encrypt and store the key
        encrypted_key = encrypt_api_key(key_data.api_key)
        key_id = create_user_api_key(
            conn, current_user["id"], key_data.provider, encrypted_key, key_data.key_name
        )

        # Fetch created key metadata
        key_record = get_user_api_key_by_provider(
            conn, current_user["id"], key_data.provider, key_data.key_name
        )

    logger.info(f"API key added for user {current_user['username']}, provider {key_data.provider}")

    return APIKeyResponse(
        id=key_record["id"],
        provider=key_record["provider"],
        key_name=key_record["key_name"],
        created_at=key_record["created_at"],
        last_used_at=key_record["last_used_at"],
    )


@router.get("/api-keys", response_model=list[APIKeyResponse])
async def list_api_keys(
    current_user: dict = Depends(get_current_user),
    db_path: str = Depends(get_db_path),
):
    """
    List all API keys for the current user.

    Returns metadata only - never exposes actual API keys.

    Args:
        current_user: Current authenticated user

    Returns:
        List of API key metadata
    """
    init_db_if_needed(db_path)

    with sqlite3.connect(db_path) as conn:
        keys = get_user_api_keys(conn, current_user["id"])

    return [
        APIKeyResponse(
            id=key["id"],
            provider=key["provider"],
            key_name=key["key_name"],
            created_at=key["created_at"],
            last_used_at=key["last_used_at"],
        )
        for key in keys
    ]


@router.get("/api-keys/{key_id}")
async def get_api_key_details(
    key_id: int,
    current_user: dict = Depends(get_current_user),
    db_path: str = Depends(get_db_path),
):
    """
    Get details of a specific API key, including the decrypted key.
    """
    init_db_if_needed(db_path)

    with sqlite3.connect(db_path) as conn:
        key_record = get_user_api_key_by_id(conn, key_id, current_user["id"])

    if key_record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found",
        )

    # Decrypt
    try:
        api_key = decrypt_api_key(key_record["encrypted_key"])
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to decrypt API key",
        )

    return {
        "id": key_record["id"],
        "provider": key_record["provider"],
        "key_name": key_record["key_name"],
        "api_key": api_key,
        "created_at": key_record["created_at"]
    }


@router.put("/api-keys/{key_id}", response_model=APIKeyResponse)
async def update_api_key(
    key_id: int,
    key_data: APIKeyCreate,
    current_user: dict = Depends(get_current_user),
    db_path: str = Depends(get_db_path),
):
    """
    Update an API key.

    Args:
        key_id: API key record ID
        key_data: New API key data
        current_user: Current authenticated user

    Returns:
        Updated API key metadata

    Raises:
        HTTPException 404: If key not found or not owned by user
    """
    init_db_if_needed(db_path)

    with sqlite3.connect(db_path) as conn:
        # Encrypt new key
        encrypted_key = encrypt_api_key(key_data.api_key)

        # Update the key
        updated = update_user_api_key(
            conn, key_id, current_user["id"], encrypted_key, key_data.key_name
        )

        if not updated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API key not found",
            )

        # Fetch updated key metadata
        keys = get_user_api_keys(conn, current_user["id"])
        key_record = next((k for k in keys if k["id"] == key_id), None)

    if key_record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found after update",
        )

    return APIKeyResponse(
        id=key_record["id"],
        provider=key_record["provider"],
        key_name=key_record["key_name"],
        created_at=key_record["created_at"],
        last_used_at=key_record["last_used_at"],
    )


@router.delete("/api-keys/{key_id}")
async def remove_api_key(
    key_id: int,
    current_user: dict = Depends(get_current_user),
    db_path: str = Depends(get_db_path),
):
    """
    Delete an API key.

    Args:
        key_id: API key record ID
        current_user: Current authenticated user

    Returns:
        Success message

    Raises:
        HTTPException 404: If key not found or not owned by user
    """
    init_db_if_needed(db_path)

    with sqlite3.connect(db_path) as conn:
        deleted = delete_user_api_key(conn, key_id, current_user["id"])

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found",
        )

    logger.info(f"API key {key_id} deleted by user {current_user['username']}")

    return {"message": "API key deleted"}


@router.get("/api-keys/{provider}/key")
async def get_decrypted_api_key(
    provider: str,
    current_user: dict = Depends(get_current_user),
    db_path: str = Depends(get_db_path),
    key_name: str | None = None,
):
    """
    Get decrypted API key for a provider.

    This endpoint is for internal use by the watcher when running queries.
    It returns the actual decrypted API key.

    Args:
        provider: Provider name
        current_user: Current authenticated user
        key_name: Optional key name

    Returns:
        Decrypted API key

    Raises:
        HTTPException 404: If key not found
    """
    init_db_if_needed(db_path)

    with sqlite3.connect(db_path) as conn:
        key_record = get_user_api_key_by_provider(
            conn, current_user["id"], provider, key_name
        )

    if key_record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No API key found for provider: {provider}",
        )

    # Decrypt the key
    api_key = decrypt_api_key(key_record["encrypted_key"])

    return {"api_key": api_key, "provider": provider}
