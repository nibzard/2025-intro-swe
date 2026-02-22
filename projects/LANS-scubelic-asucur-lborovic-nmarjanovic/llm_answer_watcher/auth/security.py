"""Security utilities for password hashing and JWT token management."""

import os
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

# Password hashing configuration
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# JWT configuration - loaded from environment variables
# Default key for development only - MUST be overridden in production!
_DEV_SECRET_KEY = "dev-secret-key-change-in-production-min-32-chars"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7


def _get_secret_key() -> str:
    """Get the JWT secret key from environment.

    Returns a development default if SECRET_KEY is not set.
    In production, always set SECRET_KEY environment variable!
    """
    key = os.environ.get("SECRET_KEY", "")
    if not key:
        # Use development default - logs a warning
        import logging
        logging.getLogger(__name__).warning(
            "SECRET_KEY not set - using development default. "
            "Set SECRET_KEY environment variable in production!"
        )
        return _DEV_SECRET_KEY
    if len(key) < 32:
        raise ValueError("SECRET_KEY must be at least 32 characters long")
    return key


def hash_password(password: str) -> str:
    """Hash a password using Argon2.

    Args:
        password: The plaintext password to hash.

    Returns:
        The hashed password string.
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash.

    Args:
        plain_password: The plaintext password to verify.
        hashed_password: The hashed password to compare against.

    Returns:
        True if the password matches, False otherwise.
    """
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(user_id: int) -> str:
    """Create a JWT access token.

    Args:
        user_id: The user's database ID.

    Returns:
        The encoded JWT access token.
    """
    secret_key = _get_secret_key()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(user_id),
        "exp": expire,
        "type": "access",
    }
    return jwt.encode(payload, secret_key, algorithm=ALGORITHM)


def create_refresh_token(user_id: int) -> str:
    """Create a JWT refresh token.

    Args:
        user_id: The user's database ID.

    Returns:
        The encoded JWT refresh token.
    """
    secret_key = _get_secret_key()
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": str(user_id),
        "exp": expire,
        "type": "refresh",
    }
    return jwt.encode(payload, secret_key, algorithm=ALGORITHM)


def decode_token(token: str) -> dict | None:
    """Decode and validate a JWT token.

    Args:
        token: The JWT token to decode.

    Returns:
        The decoded payload dict if valid, None if invalid or expired.
    """
    try:
        secret_key = _get_secret_key()
        payload = jwt.decode(token, secret_key, algorithms=[ALGORITHM])
        return payload
    except (JWTError, ValueError):
        return None


def get_token_user_id(token: str) -> int | None:
    """Extract user ID from a valid token.

    Args:
        token: The JWT token.

    Returns:
        The user ID if token is valid, None otherwise.
    """
    payload = decode_token(token)
    if payload is None:
        return None
    try:
        return int(payload["sub"])
    except (KeyError, ValueError):
        return None
