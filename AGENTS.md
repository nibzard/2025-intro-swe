# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a software engineering course repository containing lab assignments for students learning Git, GitHub, Python, and collaborative development workflows.

## Development Environment

This repository supports two development approaches:

### GitHub Codespaces (Recommended)
- Fully configured cloud development environment
- Automatic dependency installation via `.devcontainer/devcontainer.json`
- AI tools pre-configured (Claude Code, OpenAI, Google Gemini)
- Port forwarding for web applications (8888, 8000, 3000, 5000, 8050, 7860, 2818)

### Local Development
- Python 3.11+ required
- Docker Desktop optional (for container support)
- UV package manager recommended for fast dependency management

## Common Commands

### Environment Setup
```bash
# Install dependencies
pip install -r requirements.txt

# Or using UV (faster)
uv pip install -r requirements.txt

# Install pre-commit hooks
pre-commit install

# Start Jupyter Lab (Codespaces)
jupyter lab --ip=0.0.0.0 --port=8888 --no-browser

# Start Marimo (reactive notebooks)
marimo edit
```

### Code Quality
```bash
# Format code (Black)
black students/*.py

# Lint code (Flake8)
flake8 students/*.py --max-line-length=88 --extend-ignore=E203,W503

# Type checking
mypy students/*.py

# Run all quality checks via pre-commit
pre-commit run --all-files
```

### Testing
```bash
# Run tests
pytest

# Run tests with coverage
pytest --cov=students
```

### Git Workflow
```bash
# Add changes and commit
git add .
git commit -m "Descriptive commit message"

# Push to fork
git push origin main

# Create pull request via GitHub CLI
gh pr create --title "Your PR title" --body "Description of changes"
```

## Repository Structure

```
2025-intro-swe/
├── labs/                   # Lab documentation and materials
│   ├── lab0.md            # Development environment setup
│   ├── lab1.md            # Git and GitHub basics (in Croatian)
│   └── lab2.md            # GitHub workflow (fork, branch, PR)
├── students/              # Student submissions
│   └── [username]/        # Individual student folders
│       └── lab1/
│           └── intro.py   # Student's Python submission
├── scripts/               # Utility scripts
│   └── assign_reviewers.py # Automated peer reviewer assignment
├── .devcontainer/         # Codespaces configuration
├── .github/workflows/     # CI/CD automation
├── requirements.txt       # Python dependencies
└── .pre-commit-config.yaml # Code quality hooks
```

## Code Quality Standards

### Pre-commit Hooks
- **Black**: Code formatting (88 character line length)
- **Flake8**: Linting with extended ignores for E203 and W503
- **Trailing whitespace**: Automatic removal
- **YAML validation**: Structure verification
- **Large file detection**: Prevents committing large files

### Python Standards
- Follow PEP 8 style guidelines
- Use descriptive variable and function names
- Include docstrings for classes and functions
- Add comments explaining complex logic

## Student Workflow

1. **Create personal folder** in `students/[username]/`
2. **Complete lab assignments** in appropriate subfolder
3. **Test code locally** before committing
4. **Follow Git workflow** with clear commit messages
5. **Submit pull request** for review

## Academic Integrity

- All submitted work must be student's own
- Proper attribution required for external sources
- AI assistance allowed for code generation, but must be reviewed and understood
- Follow institution's academic integrity policies

## Automated Tools

### Peer Review System
Use `scripts/assign_reviewers.py` to automate peer reviewer assignment:
```bash
python scripts/assign_reviewers.py list                    # List students
python scripts/assign_reviewers.py assign <username> <pr_number>  # Assign reviewers
```

### CI/CD Pipeline
- Automated testing on pull requests
- Code quality checks via pre-commit hooks
- Formatting and style verification

## AI Coding Tools

This repository is configured for AI-assisted development:
- **Claude Code**: Primary AI assistant
- **OpenAI Codex**: Alternative AI assistant
- **Google Gemini**: Additional AI support
- **Marimo**: Reactive notebooks with AI integration

API keys should be configured in GitHub Codespaces secrets for AI tool functionality.

## Key Contacts

- Course instructor: Repository maintainer
- Teaching assistants: Available via GitHub Issues
- Student support: Course discussion forum

## Notes for Claude Instances

- When working with student submissions, maintain educational tone
- Provide clear explanations for code changes
- Focus on learning objectives rather than just fixing issues
- Encourage best practices while understanding skill level progression
- Never modify other students' work without explicit permission
