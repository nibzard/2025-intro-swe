#!/bin/bash
# ABOUTME: Optimized setup script for scientific programming environment
# This script creates a robust, student-friendly development environment
# Author: Scientific Programming Team
# Version: 2.0 - Student Optimized

set -e

# Color codes for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Error handling function
handle_error() {
    log_error "Setup failed at line $1: $2"
    log_info "Don't worry! Your container is still functional. You can:"
    echo "   1. Continue with basic Python development"
    echo "   2. Install packages manually with: uv add package_name"
    echo "   3. Ask your instructor for help if needed"
    exit 1
}

# Set up error handling
trap 'handle_error $LINENO "$BASH_COMMAND"' ERR

# Start setup
log_info "🚀 Setting up Scientific Programming Environment..."

# Create essential directories with better error handling
log_info "📁 Creating project directories..."
mkdir -p ~/data ~/notebooks ~/reports ~/figures ~/models ~/templates

# Try to create directories in /workspaces if possible
if [ -w "/workspaces" ]; then
    mkdir -p /workspaces/reports /workspaces/figures /workspaces/models 2>/dev/null || true
    log_success "Created directories in /workspaces/"
else
    log_warning "Cannot write to /workspaces, using home directory instead"
    log_info "Home directories created: ~/data, ~/notebooks, ~/reports, ~/figures, ~/models"
fi

# Upgrade pip and install UV package manager
log_info "📦 Upgrading pip and installing UV..."
python -m pip install --upgrade pip --quiet || log_warning "Pip upgrade failed, continuing..."

# Install UV with better error handling
log_info "⚡ Installing UV package manager..."
if command -v uv >/dev/null 2>&1; then
    log_success "UV is already installed"
else
    if curl -LsSf https://astral.sh/uv/install.sh | sh; then
        export PATH="$HOME/.local/bin:$PATH"
        echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
        echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc 2>/dev/null || true
        log_success "UV installed successfully"
    else
        log_error "Failed to install UV"
        log_info "You can still use pip for package management"
        UV_AVAILABLE=false
    fi
fi

# Skip project configuration - use direct package installation
log_info "⚙️ Skipping project configuration - using direct package installation..."

# Install packages with error handling
install_packages() {
    local packages=("$@")
    log_info "🔬 Installing packages: ${packages[*]}"

    if [ "$UV_AVAILABLE" = true ]; then
        # Use UV to install packages globally without project context
        if uv pip install "${packages[@]}" --quiet; then
            log_success "Installed: ${packages[*]}"
        else
            log_warning "UV installation failed for some packages, trying pip..."
            python -m pip install "${packages[@]}" --quiet || log_warning "Some packages failed to install"
        fi
    else
        if python -m pip install "${packages[@]}" --quiet; then
            log_success "Installed: ${packages[*]}"
        else
            log_warning "Pip installation failed for some packages"
        fi
    fi
}

# Install core scientific packages
log_info "🔬 Installing core scientific packages..."
install_packages numpy scipy pandas matplotlib seaborn scikit-learn
install_packages jupyter jupyterlab ipywidgets
install_packages plotly requests beautifulsoup4

# Install development tools
log_info "🛠️ Installing development tools..."
install_packages pytest black flake8 mypy

# Install AI and modern tools (marimo is now in pyproject.toml)
log_info "🤖 Installing AI and modern tools..."
# Note: marimo is installed via uv sync from pyproject.toml dependencies
log_info "📝 Marimo will be installed via project dependencies"

# Install AI assistant CLI tools
log_info "🤖 Installing AI assistant CLI tools..."

# Set up API keys from Codespaces secrets if available
setup_api_keys() {
    log_info "🔑 Setting up API keys..."

    # Check for Codespaces secrets and set them up
    if [ -n "$OPENAI_API_KEY" ]; then
        echo "export OPENAI_API_KEY=\"$OPENAI_API_KEY\"" >> ~/.bashrc
        echo "export OPENAI_API_KEY=\"$OPENAI_API_KEY\"" >> ~/.zshrc 2>/dev/null || true
        log_success "OpenAI API key configured"
    else
        log_warning "OPENAI_API_KEY not found - AI features will be limited"
    fi

    if [ -n "$ANTHROPIC_API_KEY" ]; then
        echo "export ANTHROPIC_API_KEY=\"$ANTHROPIC_API_KEY\"" >> ~/.bashrc
        echo "export ANTHROPIC_API_KEY=\"$ANTHROPIC_API_KEY\"" >> ~/.zshrc 2>/dev/null || true
        log_success "Anthropic API key configured"
    else
        log_warning "ANTHROPIC_API_KEY not found - Claude features will be limited"
    fi

    if [ -n "$GOOGLE_API_KEY" ]; then
        echo "export GOOGLE_API_KEY=\"$GOOGLE_API_KEY\"" >> ~/.bashrc
        echo "export GOOGLE_API_KEY=\"$GOOGLE_API_KEY\"" >> ~/.zshrc 2>/dev/null || true
        log_success "Google API key configured"
    else
        log_warning "GOOGLE_API_KEY not found - Gemini features will be limited"
    fi

    # Create .env file for applications that need it
    cat > ~/.env << EOF
# API Keys (auto-generated from Codespaces secrets)
OPENAI_API_KEY=${OPENAI_API_KEY:-}
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY:-}
GOOGLE_API_KEY=${GOOGLE_API_KEY:-}
EOF

    log_success "API keys setup complete"
    log_info "💡 To add API keys: GitHub repo → Settings → Secrets → Codespaces"
}

setup_api_keys

# Install Python-based AI SDKs for programmatic access
install_packages openai anthropic google-generativeai llm 2>/dev/null || log_warning "Some AI SDKs failed to install"

# Try to install common AI CLI tools (if npm available)
if command -v npm >/dev/null 2>&1; then
    # Install Google Gemini CLI
    npm install -g @google/gemini-cli 2>/dev/null || log_warning "Gemini CLI installation failed"

    # Install Claude Code CLI
    npm install -g @anthropic-ai/claude-code 2>/dev/null || log_warning "Claude Code CLI installation failed"

    # Install OpenAI Codex CLI
    npm install -g @openai/codex 2>/dev/null || log_warning "OpenAI Codex CLI installation failed"

    # Install OpenCode AI
    npm install -g opencode-ai 2>/dev/null || log_warning "OpenCode AI installation failed"
else
    log_warning "npm not available, installing fewer AI CLI tools"
fi

# Create simple AI helper scripts
log_info "📜 Creating AI helper scripts..."

# Create a simple AI helper script using Python SDKs
cat > ~/ai_helper.py << 'EOF'
#!/usr/bin/env python3
"""
Simple AI helper script for students to interact with various AI models
Requires API keys to be set as environment variables
"""
import os
import sys
import argparse

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

try:
    import anthropic
except ImportError:
    anthropic = None

def get_openai_response(prompt, model="gpt-3.5-turbo"):
    """Get response from OpenAI"""
    if not OpenAI:
        return "OpenAI SDK not installed"

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return "OPENAI_API_KEY environment variable not set"

    try:
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"OpenAI API error: {e}"

def get_claude_response(prompt, model="claude-3-sonnet-20240229"):
    """Get response from Claude"""
    if not anthropic:
        return "Anthropic SDK not installed"

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return "ANTHROPIC_API_KEY environment variable not set"

    try:
        client = anthropic.Anthropic(api_key=api_key)
        response = client.messages.create(
            model=model,
            max_tokens=1000,
            messages=[{"role": "user", "content": prompt}]
        )
        return response.content[0].text
    except Exception as e:
        return f"Claude API error: {e}"

def main():
    parser = argparse.ArgumentParser(description="AI Helper - Interact with AI models")
    parser.add_argument("prompt", help="Your prompt/question")
    parser.add_argument("--model", choices=["openai", "claude", "both"], default="both", help="Which AI to use")

    args = parser.parse_args()

    print(f"🤖 AI Helper - Processing: {args.prompt}")
    print("-" * 50)

    if args.model in ["openai", "both"]:
        print("📘 OpenAI Response:")
        print(get_openai_response(args.prompt))
        print()

    if args.model in ["claude", "both"]:
        print("🟣 Claude Response:")
        print(get_claude_response(args.prompt))
        print()

if __name__ == "__main__":
    main()
EOF

chmod +x ~/ai_helper.py

# Install visualization packages
log_info "📊 Installing visualization packages..."
install_packages altair bokeh graphviz

# Install web development packages
log_info "🌐 Installing web development packages..."
install_packages fastapi streamlit gradio dash flask

# Configure Jupyter
log_info "📓 Configuring Jupyter..."
mkdir -p ~/.jupyter
cat > ~/.jupyter/jupyter_lab_config.py << 'EOF'
c.ServerApp.ip = '0.0.0.0'
c.ServerApp.port = 8888
c.ServerApp.open_browser = False
c.ServerApp.allow_root = True
c.ServerApp.allow_remote_access = True
c.LabApp.default_url = '/lab'
EOF

# Create simple educational templates
log_info "📚 Creating educational templates..."
mkdir -p templates

# Create a simple Python script template
cat > templates/python_template.py << 'EOF'
#!/usr/bin/env python3
"""
ABOUTME: Scientific Programming Python Script
Author: [Your Name]
Course: Scientific Programming 2025/26
Date: [Date]

Description: [Script description here]

Learning Objectives:
- [ ] Objective 1
- [ ] Objective 2
- [ ] Objective 3
"""

import sys
import argparse
from pathlib import Path

# Add scientific imports as needed
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns


def main():
    """Main function for the script."""
    parser = argparse.ArgumentParser(description="Scientific Programming Script")
    parser.add_argument("--input", type=str, help="Input file path")
    parser.add_argument("--output", type=str, help="Output file path")
    parser.add_argument("--verbose", action="store_true", help="Verbose output")

    args = parser.parse_args()

    # Your code here
    print("Scientific Programming Script")
    print(f"Arguments: {args}")


if __name__ == "__main__":
    main()
EOF

# Create a simple sample data script
cat > create_sample_data.py << 'EOF'
#!/usr/bin/env python3
"""
ABOUTME: Create sample datasets for scientific programming exercises
Author: Teaching Assistant
Course: Scientific Programming 2025/26
"""

import numpy as np
import pandas as pd
import pathlib

def create_student_grades():
    """Create sample student grades dataset."""
    np.random.seed(42)
    n_students = 100

    data = {
        'student_id': range(1, n_students + 1),
        'name': [f'Student_{i}' for i in range(1, n_students + 1)],
        'assignment_1': np.random.normal(75, 15, n_students),
        'assignment_2': np.random.normal(80, 12, n_students),
        'midterm': np.random.normal(78, 18, n_students),
        'final_exam': np.random.normal(82, 14, n_students),
        'participation': np.random.uniform(60, 100, n_students)
    }

    df = pd.DataFrame(data)
    return df

def main():
    """Create and save sample datasets."""
    # Try to create data directory
    data_dirs = ["~/data", "/workspaces/data", "data"]
    data_dir = None

    for dir_path in data_dirs:
        expanded_path = pathlib.Path(dir_path).expanduser()
        if expanded_path.exists() or expanded_path.mkdir(parents=True, exist_ok=True):
            data_dir = expanded_path
            break

    if data_dir is None:
        print("Could not create data directory")
        return

    # Create datasets
    print("Creating student grades dataset...")
    grades_df = create_student_grades()
    grades_df.to_csv(data_dir / 'student_grades.csv', index=False)
    print(f"Saved {len(grades_df)} student records to {data_dir / 'student_grades.csv'}")

    print("Sample datasets created successfully!")

if __name__ == "__main__":
    main()
EOF

# Make Python scripts executable
chmod +x create_sample_data.py templates/python_template.py

# Generate sample data
log_info "📊 Generating sample datasets..."
python create_sample_data.py || log_warning "Sample data generation failed"

# Create a simple README
cat > README_devcontainer.md << 'EOF'
# Scientific Programming Development Environment

Welcome to your scientific programming development environment! This container provides everything you need for data analysis, visualization, and machine learning.

## 🚀 Quick Start

1. **Start Jupyter Lab:**
   ```bash
   jupyter lab --ip=0.0.0.0 --port=8888 --no-browser
   ```

2. **Use Marimo for reactive notebooks:**
   ```bash
   marimo edit
   ```

3. **Run Python scripts:**
   ```bash
   python your_script.py
   ```

## 📦 Available Tools

- **Jupyter Lab**: Interactive notebooks
- **Marimo**: Reactive notebooks with AI integration
- **Python**: Full scientific stack (NumPy, Pandas, Matplotlib, etc.)
- **Development Tools**: Black, Flake8, MyPy, pytest

## 📁 Directory Structure

- `~/data/`: Your datasets and data files
- `~/notebooks/`: Jupyter and Marimo notebooks
- `~/templates/`: Code templates to get you started

## 🆘 Need Help?

If something doesn't work:
1. Check the terminal output for error messages
2. Try rebuilding the container
3. Ask your instructor for assistance

Happy coding! 🎉
EOF

log_success "✅ Scientific Programming Environment setup complete!"
log_info ""
log_info "🎓 Next steps:"
echo "1. Start Jupyter Lab: jupyter lab --ip=0.0.0.0 --port=8888 --no-browser"
echo "2. Try Marimo: marimo edit"
echo "3. Check the templates in ~/templates/"
echo "4. Read README_devcontainer.md for more info"
echo "5. Set up AI tools: Check TROUBLESHOOTING.md for API key setup"
echo "6. Try AI helper: python ~/ai_helper.py 'Explain machine learning'"
echo ""
log_success "🔬 Happy scientific programming!"
