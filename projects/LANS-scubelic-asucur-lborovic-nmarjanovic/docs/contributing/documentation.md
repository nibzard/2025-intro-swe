# Documentation Guidelines

Contributing to documentation.

## Documentation Structure

```
docs/
├── index.md
├── getting-started/
├── user-guide/
├── providers/
├── examples/
├── data-analytics/
├── evaluation/
├── advanced/
├── reference/
└── contributing/
```

## Writing Guidelines

### Style

- Use clear, concise language
- Write in active voice
- Include code examples
- Add links to related pages

### Formatting

```markdown
# Page Title

Brief introduction paragraph.

## Section Heading

Content with examples:

\`\`\`python
# Code example
config = load_config("config.yaml")
\`\`\`

### Subsection

More detailed content.
```

### Material for MkDocs Features

```markdown
!!! tip "Pro Tip"
    Use this feature for better results.

!!! warning
    This operation costs money.

=== "Python"
    \`\`\`python
    import module
    \`\`\`

=== "Bash"
    \`\`\`bash
    command --flag
    \`\`\`
```

## Building Docs

```bash
# Install dependencies
uv sync --dev

# Build docs
mkdocs build

# Serve locally
mkdocs serve

# Open browser to http://localhost:8000
```

## Previewing Changes

```bash
mkdocs serve --watch docs/
```

See [Development Setup](development-setup.md) for environment setup.
