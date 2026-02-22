"""Pydantic schemas for authentication requests and responses."""

from pydantic import BaseModel, EmailStr, field_validator


class UserCreate(BaseModel):
    """Schema for user registration request."""

    username: str
    email: EmailStr
    password: str

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        """Validate username format."""
        if not v or len(v) < 3:
            raise ValueError("Username must be at least 3 characters")
        if len(v) > 50:
            raise ValueError("Username must be at most 50 characters")
        # Allow alphanumeric and underscores
        if not all(c.isalnum() or c == "_" for c in v):
            raise ValueError("Username must contain only letters, numbers, and underscores")
        return v.lower()

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength."""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if len(v) > 128:
            raise ValueError("Password must be at most 128 characters")
        return v


class UserLogin(BaseModel):
    """Schema for user login request."""

    username: str  # Can be username or email
    password: str


class UserUpdate(BaseModel):
    """Schema for updating user profile."""
    username: str | None = None
    email: EmailStr | None = None

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str | None) -> str | None:
        if v is None:
            return None
        if not v or len(v) < 3:
            raise ValueError("Username must be at least 3 characters")
        if len(v) > 50:
            raise ValueError("Username must be at most 50 characters")
        if not all(c.isalnum() or c == "_" for c in v):
            raise ValueError("Username must contain only letters, numbers, and underscores")
        return v.lower()


class Token(BaseModel):
    """Schema for JWT token response."""

    access_token: str
    refresh_token: str | None = None
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """Schema for JWT token payload."""

    sub: int  # user_id
    exp: int  # expiration timestamp
    type: str  # "access" or "refresh"


class TokenRefresh(BaseModel):
    """Schema for token refresh request."""

    refresh_token: str


class UserResponse(BaseModel):
    """Schema for user profile response."""

    id: int
    username: str
    email: str
    created_at: str
    is_active: bool


class APIKeyCreate(BaseModel):
    """Schema for creating a new API key."""

    provider: str  # "google", "groq", "openai", etc.
    api_key: str
    key_name: str | None = None

    @field_validator("provider")
    @classmethod
    def validate_provider(cls, v: str) -> str:
        """Validate provider is supported."""
        allowed = {"google", "groq", "openai", "anthropic", "mistral", "perplexity", "grok"}
        v_lower = v.lower()
        if v_lower not in allowed:
            raise ValueError(f"Provider must be one of: {', '.join(sorted(allowed))}")
        return v_lower

    @field_validator("api_key")
    @classmethod
    def validate_api_key(cls, v: str) -> str:
        """Validate API key is not empty."""
        if not v or not v.strip():
            raise ValueError("API key cannot be empty")
        return v.strip()


class APIKeyResponse(BaseModel):
    """Schema for API key response (metadata only, never the actual key)."""

    id: int
    provider: str
    key_name: str | None
    created_at: str
    last_used_at: str | None
    # Note: Never expose the actual key in responses


class APIKeyUpdate(BaseModel):
    """Schema for updating an API key."""

    api_key: str | None = None
    key_name: str | None = None
