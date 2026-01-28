"""Authentication module for LLM Answer Watcher.

Provides user authentication, JWT token management, and secure API key storage.
"""

from llm_answer_watcher.auth.schemas import (
    UserCreate,
    UserLogin,
    UserResponse,
    Token,
    TokenPayload,
    APIKeyCreate,
    APIKeyResponse,
)
from llm_answer_watcher.auth.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from llm_answer_watcher.auth.encryption import (
    encrypt_api_key,
    decrypt_api_key,
)
from llm_answer_watcher.auth.dependencies import (
    get_current_user,
    get_current_active_user,
)
from llm_answer_watcher.auth.router import router as auth_router

__all__ = [
    # Schemas
    "UserCreate",
    "UserLogin",
    "UserResponse",
    "Token",
    "TokenPayload",
    "APIKeyCreate",
    "APIKeyResponse",
    # Security
    "hash_password",
    "verify_password",
    "create_access_token",
    "create_refresh_token",
    "decode_token",
    # Encryption
    "encrypt_api_key",
    "decrypt_api_key",
    # Dependencies
    "get_current_user",
    "get_current_active_user",
    # Router
    "auth_router",
]
