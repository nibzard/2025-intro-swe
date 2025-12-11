# Code Standards

Coding standards and best practices.

## Python Style

### Modern Type Hints (Python 3.12+)

```python
# ✅ Good - use | for unions
def process(data: dict | None = None) -> str | None:
    pass

# ❌ Bad - old style
from typing import Union, Optional
def process(data: Optional[dict] = None) -> Union[str, None]:
    pass
```

### Docstrings

```python
def detect_mentions(text: str, brands: list[str]) -> list[Mention]:
    """
    Detect brand mentions in text.

    Args:
        text: Text to search
        brands: List of brand names

    Returns:
        List of detected mentions
    """
```

### Word Boundaries

```python
# ✅ Good - word boundary matching
pattern = r'\b' + re.escape(brand) + r'\b'

# ❌ Bad - substring matching
if brand.lower() in text.lower():
    ...
```

## Testing

### Coverage Requirements

- Core modules: 80%+ coverage
- Critical paths: 100% coverage

### Test Structure

```python
def test_feature():
    # Arrange
    config = create_test_config()

    # Act
    result = run_feature(config)

    # Assert
    assert result.status == "success"
```

## Commits

Use Conventional Commits:

```
feat: add new provider
fix: correct rank extraction
docs: update README
test: add coverage for extractor
chore: update dependencies
```

See [Testing](testing.md) for testing guidelines.
