"""
Custom validators for configuration models.

This module is reserved for future cross-field validation logic that cannot
be expressed through Pydantic's field_validator decorators.

Currently, all validation is handled through Pydantic field validators in
config.schema module. If complex cross-model validation is needed in the
future (e.g., validating relationships between intents and brands that span
multiple fields), add custom validator functions here.

Example future use cases:
    - Validate that competitor brands don't overlap with "mine" brands
    - Validate that intent IDs don't conflict with reserved keywords
    - Validate that API key environment variables follow naming conventions

Note:
    Keep validation logic in Pydantic models where possible for better
    integration with error reporting and IDE support.
"""

# No custom validators needed yet - all validation handled by Pydantic field_validator
# in config.schema module.
