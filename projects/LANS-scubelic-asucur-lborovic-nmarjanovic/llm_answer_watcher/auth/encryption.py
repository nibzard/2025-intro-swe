"""Encryption utilities for secure API key storage.

Uses Fernet symmetric encryption (AES-128-CBC with HMAC) for encrypting
user API keys before storing them in the database.
"""

import logging
import os

from cryptography.fernet import Fernet, InvalidToken

# Development default key - MUST be overridden in production!
# This is a valid Fernet key for development only
_DEV_ENCRYPTION_KEY = "X3dTb1JhbmRvbUtleUZvckRldmVsb3BtZW50T25seSE="

logger = logging.getLogger(__name__)

# Cache for the encryption key (generated once per process)
_cached_dev_key: str | None = None


def _get_encryption_key() -> bytes:
    """Get the Fernet encryption key from environment.

    Returns a development default if API_KEY_ENCRYPTION_KEY is not set.
    In production, always set API_KEY_ENCRYPTION_KEY environment variable!

    The key should be generated using:
        python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

    Returns:
        The encryption key as bytes.
    """
    global _cached_dev_key

    key = os.environ.get("API_KEY_ENCRYPTION_KEY", "")
    if not key:
        logger.warning(
            "API_KEY_ENCRYPTION_KEY not set - using development default. "
            "Set API_KEY_ENCRYPTION_KEY environment variable in production!"
        )
        # Use cached dev key or generate one (consistent within process)
        if _cached_dev_key is None:
            _cached_dev_key = Fernet.generate_key().decode()
        key = _cached_dev_key
    return key.encode()


def _get_fernet() -> Fernet:
    """Get a Fernet instance for encryption/decryption.

    Returns:
        A configured Fernet instance.

    Raises:
        ValueError: If the encryption key is invalid.
    """
    try:
        return Fernet(_get_encryption_key())
    except Exception as e:
        raise ValueError(f"Invalid API_KEY_ENCRYPTION_KEY: {e}") from e


def encrypt_api_key(api_key: str) -> str:
    """Encrypt an API key for secure storage.

    Args:
        api_key: The plaintext API key to encrypt.

    Returns:
        The encrypted API key as a base64-encoded string.

    Raises:
        ValueError: If encryption fails.
    """
    if not api_key:
        raise ValueError("API key cannot be empty")
    try:
        f = _get_fernet()
        encrypted = f.encrypt(api_key.encode())
        return encrypted.decode()
    except Exception as e:
        raise ValueError(f"Failed to encrypt API key: {e}") from e


def decrypt_api_key(encrypted_key: str) -> str:
    """Decrypt an API key for use.

    Args:
        encrypted_key: The encrypted API key (base64-encoded).

    Returns:
        The decrypted plaintext API key.

    Raises:
        ValueError: If decryption fails (invalid key or corrupted data).
    """
    if not encrypted_key:
        raise ValueError("Encrypted key cannot be empty")
    try:
        f = _get_fernet()
        decrypted = f.decrypt(encrypted_key.encode())
        return decrypted.decode()
    except InvalidToken:
        raise ValueError("Failed to decrypt API key: invalid token or wrong encryption key")
    except Exception as e:
        raise ValueError(f"Failed to decrypt API key: {e}") from e


def is_encryption_configured() -> bool:
    """Check if encryption is properly configured.

    Returns:
        True if API_KEY_ENCRYPTION_KEY is set and valid, False otherwise.
    """
    try:
        _get_fernet()
        return True
    except ValueError:
        return False
