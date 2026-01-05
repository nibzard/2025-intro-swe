# Installation

This guide covers all installation methods for LLM Answer Watcher.

## System Requirements

### Python Version

LLM Answer Watcher requires **Python 3.12 or 3.13**. It uses modern Python features including:

- Native union type syntax (`|` instead of `Union`)
- Improved type hints
- Performance optimizations

Check your Python version:

```bash
python3 --version
# Should output: Python 3.12.x or Python 3.13.x
```

### Installing Python 3.12+

=== "macOS"

    ```bash
    # Using Homebrew
    brew install python@3.12

    # Verify installation
    python3.12 --version
    ```

=== "Ubuntu/Debian"

    ```bash
    # Add deadsnakes PPA
    sudo add-apt-repository ppa:deadsnakes/ppa
    sudo apt update

    # Install Python 3.12
    sudo apt install python3.12 python3.12-venv python3.12-dev

    # Verify installation
    python3.12 --version
    ```

=== "Windows"

    Download Python 3.12 from [python.org](https://www.python.org/downloads/)

    During installation:

    - ✅ Check "Add Python to PATH"
    - ✅ Check "Install pip"

    Verify installation:
    ```cmd
    python --version
    ```

## Installation Methods

### Method 1: uv (Recommended)

[uv](https://github.com/astral-sh/uv) is a fast, modern Python package installer written in Rust. It's significantly faster than pip and handles virtual environments automatically.

#### Install uv

=== "macOS/Linux"

    ```bash
    curl -LsSf https://astral.sh/uv/install.sh | sh
    ```

=== "Windows"

    ```powershell
    powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
    ```

=== "With pip"

    ```bash
    pip install uv
    ```

#### Install LLM Answer Watcher

```bash
# Clone the repository
git clone https://github.com/nibzard/llm-answer-watcher.git
cd llm-answer-watcher

# Install all dependencies (creates .venv automatically)
uv sync

# For development with extra dependencies
uv sync --dev
```

#### Activate Virtual Environment

uv creates a `.venv` directory automatically. You can optionally activate it:

```bash
# macOS/Linux
source .venv/bin/activate

# Windows
.venv\Scripts\activate
```

!!! tip "uv handles activation automatically"
    When you run `uv run llm-answer-watcher`, uv automatically uses the virtual environment.
    Explicit activation is optional.

### Method 2: pip

Traditional pip installation with manual virtual environment management.

```bash
# Clone the repository
git clone https://github.com/nibzard/llm-answer-watcher.git
cd llm-answer-watcher

# Create virtual environment
python3.12 -m venv .venv

# Activate virtual environment
source .venv/bin/activate  # macOS/Linux
# or
.venv\Scripts\activate     # Windows

# Install package in editable mode
pip install -e .

# For development with extra dependencies
pip install -e ".[dev]"
```

### Method 3: PyPI (Coming Soon)

Once published to PyPI, you'll be able to install directly:

```bash
# Future installation method
pip install llm-answer-watcher
```

## Verify Installation

Check that the installation was successful:

```bash
llm-answer-watcher --version
```

You should see output like:

```
llm-answer-watcher version 0.1.0
```

Test the CLI help:

```bash
llm-answer-watcher --help
```

## API Keys Setup

LLM Answer Watcher requires API keys from LLM providers. You need at least one provider configured.

### Supported Providers

| Provider | Environment Variable | Get API Key |
|----------|---------------------|-------------|
| **OpenAI** | `OPENAI_API_KEY` | [platform.openai.com](https://platform.openai.com/api-keys) |
| **Anthropic** | `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com/) |
| **Mistral** | `MISTRAL_API_KEY` | [console.mistral.ai](https://console.mistral.ai/) |
| **X.AI (Grok)** | `XAI_API_KEY` | [x.ai/api](https://x.ai/api) |
| **Google (Gemini)** | `GOOGLE_API_KEY` | [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| **Perplexity** | `PERPLEXITY_API_KEY` | [www.perplexity.ai/settings/api](https://www.perplexity.ai/settings/api) |

### Setting API Keys

#### Temporary (Current Session)

```bash
export OPENAI_API_KEY=sk-your-key-here
export ANTHROPIC_API_KEY=sk-ant-your-key-here
```

#### Persistent (`.env` file)

Create a `.env` file in your project directory:

```bash
# .env file
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
MISTRAL_API_KEY=mistral-your-key
XAI_API_KEY=xai-your-grok-key
GOOGLE_API_KEY=AIza-your-google-key
PERPLEXITY_API_KEY=pplx-your-perplexity-key
```

Load the file before running:

```bash
source .env
```

!!! warning "Security: Never commit API keys"
    Add `.env` to `.gitignore`:
    ```bash
    echo ".env" >> .gitignore
    ```

#### Using direnv (Recommended for Development)

[direnv](https://direnv.net/) automatically loads `.env` when you enter the directory:

```bash
# Install direnv
brew install direnv  # macOS
# or
sudo apt install direnv  # Ubuntu/Debian

# Create .envrc file
echo 'source .env' > .envrc

# Allow direnv to load it
direnv allow
```

Now your keys load automatically when you `cd` into the directory.

## Development Dependencies

If you're contributing or want to run tests:

```bash
# With uv
uv sync --dev

# With pip
pip install -e ".[dev]"
```

This installs additional tools:

- **pytest** - Test runner
- **pytest-httpx** - HTTP mocking for tests
- **pytest-cov** - Coverage reporting
- **pytest-mock** - Advanced mocking
- **freezegun** - Time mocking
- **ruff** - Fast Python linter and formatter
- **mkdocs** - Documentation builder
- **mkdocs-material** - Material theme for MkDocs

## Docker Installation (Optional)

For containerized deployment:

```dockerfile
# Dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install uv
RUN pip install uv

# Copy project files
COPY . .

# Install dependencies
RUN uv sync

# Set entrypoint
ENTRYPOINT ["uv", "run", "llm-answer-watcher"]
```

Build and run:

```bash
docker build -t llm-answer-watcher .
docker run -e OPENAI_API_KEY=$OPENAI_API_KEY \
           -v $(pwd)/output:/app/output \
           llm-answer-watcher run --config config.yaml
```

## Troubleshooting

### Python Version Issues

If you have multiple Python versions:

```bash
# Use specific Python version
python3.12 -m venv .venv
source .venv/bin/activate
python --version  # Verify it's 3.12.x
```

### Permission Errors

If you get permission errors during installation:

```bash
# Don't use sudo with pip in virtual environments
# Instead, ensure your virtual environment is activated
source .venv/bin/activate
pip install -e .
```

### SSL Certificate Errors

On macOS, you might need to install certificates:

```bash
/Applications/Python\ 3.12/Install\ Certificates.command
```

### Module Not Found Errors

If you get `ModuleNotFoundError` after installation:

```bash
# Ensure you're in the virtual environment
which python  # Should point to .venv/bin/python

# Re-install the package
pip install -e .
```

### uv Installation Issues

If `uv sync` fails:

```bash
# Try updating uv
pip install --upgrade uv

# Or fall back to pip
pip install -e .
```

## Next Steps

Now that LLM Answer Watcher is installed:

1. [Run your first monitoring job](first-run.md)
2. [Learn about configuration](basic-configuration.md)
3. [Explore supported providers](../providers/overview.md)

## Uninstallation

To remove LLM Answer Watcher:

```bash
# Remove the package
pip uninstall llm-answer-watcher

# Remove the virtual environment
rm -rf .venv

# Remove output data (optional)
rm -rf output/
```
