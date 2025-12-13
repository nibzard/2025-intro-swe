# 🆘 Dev Container Troubleshooting Guide

This guide helps you troubleshoot common issues with your Scientific Programming Dev Container.

## 🚀 Quick Fixes

### Container Won't Start
1. **Rebuild the container**: In VS Code, press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) and type "Dev Containers: Rebuild Container"
2. **Restart VS Code**: Close and reopen VS Code
3. **Check Docker**: Make sure Docker is running on your computer

### Setup Script Failed
Don't worry! Your container is still functional. You can:

1. **Continue with basic Python development** - Python, Jupyter, and basic packages are already installed
2. **Install packages manually**:
   ```bash
   # Using UV (if available)
   uv add package_name

   # Or using pip
   pip install package_name
   ```
3. **Ask your instructor for help** - they can assist with specific package installations

### Jupyter Not Working
1. **Start Jupyter manually**:
   ```bash
   jupyter lab --ip=0.0.0.0 --port=8888 --no-browser
   ```
2. **Check if port 8888 is available** - sometimes another service is using it
3. **Try a different port**:
   ```bash
   jupyter lab --ip=0.0.0.0 --port=8889 --no-browser
   ```

### Package Installation Errors
1. **Try alternative installation methods**:
   ```bash
   # Method 1: UV
   uv add numpy pandas matplotlib

   # Method 2: pip
   pip install numpy pandas matplotlib

   # Method 3: conda (if available)
   conda install numpy pandas matplotlib
   ```

### Extension Issues
If VS Code extensions aren't working:
1. **Reload VS Code**: Press `Ctrl+Shift+P` and type "Developer: Reload Window"
2. **Check extension list**: Go to the Extensions tab (Ctrl+Shift+X) and see which ones are installed
3. **Install missing extensions**: Search for and install required extensions manually

## 🔧 Common Error Messages

### "Permission denied"
- **Cause**: Trying to write to protected directories
- **Solution**: Use your home directory (`~/`) instead of `/workspaces/`

### "Command not found: uv"
- **Cause**: UV package manager not installed or not in PATH
- **Solution**: Use `pip` instead, or add UV to PATH:
  ```bash
  export PATH="$HOME/.local/bin:$PATH"
  ```

### "Port already in use"
- **Cause**: Another service is using the same port
- **Solution**: Use a different port number (8889, 8890, etc.)

### "ModuleNotFoundError"
- **Cause**: Package not installed
- **Solution**: Install the missing package:
  ```bash
  uv add package_name  # or pip install package_name
  ```

### "AI command not found: gemini/claude/codex"
- **Cause**: AI CLI tools not installed or not in PATH
- **Solution**: Use the built-in AI helper or set up API keys:
  ```bash
  # Use the built-in AI helper
  python ~/ai_helper.py "Explain neural networks"

  # Or set up API keys (see AI Tools section below)
  ```

### "API key not set" errors
- **Cause**: AI tools require API keys to function
- **Solution**: Set environment variables with your API keys:
  ```bash
  export OPENAI_API_KEY="your-openai-key"
  export ANTHROPIC_API_KEY="your-claude-key"
  export GOOGLE_API_KEY="your-gemini-key"
  ```

## 📋 Getting Help

### Self-Service
1. **Check this guide first** - most common issues are covered here
2. **Read terminal output** - error messages often tell you exactly what's wrong
3. **Try basic functionality** - Python scripts usually work even if some setup fails

### Ask for Help
If you're stuck:
1. **Take a screenshot** of the error message
2. **Note what you were trying to do**
3. **Ask your instructor** - they're here to help you learn!

## ✅ Things That Should Always Work

Even if setup fails, these should work:
- **Basic Python**: `python script.py`
- **Jupyter**: `jupyter lab` (if installed)
- **File editing**: VS Code file explorer and editor
- **Terminal access**: All terminal commands

## 🎯 Success Checklist

Your environment is working if you can:
- [ ] Open Python files in VS Code
- [ ] Run simple Python scripts
- [ ] Access the terminal
- [ ] See your project files in the file explorer

If you can do these things, you're ready to start coding! 🎉

## 🤖 AI Tools Setup

This container includes AI tools to help with learning and coding assistance.

### Built-in AI Helper

The easiest way to use AI assistance is with the built-in helper:

```bash
# Basic usage
python ~/ai_helper.py "Explain how decision trees work"

# Specify which AI to use
python ~/ai_helper.py "Help me debug this code" --model claude
python ~/ai_helper.py "Write a Python function" --model openai
```

### Setting Up API Keys

To use AI tools, you need API keys from the respective providers:

1. **OpenAI (for GPT models)**:
   - Get key from: https://platform.openai.com/api-keys
   - Set environment variable: `export OPENAI_API_KEY="your-key-here"`

2. **Anthropic (for Claude)**:
   - Get key from: https://console.anthropic.com/
   - Set environment variable: `export ANTHROPIC_API_KEY="your-key-here"`

3. **Google (for Gemini)**:
   - Get key from: https://makersuite.google.com/app/apikey
   - Set environment variable: `export GOOGLE_API_KEY="your-key-here"`

### Making API Keys Persistent

To save your API keys so you don't have to set them every time:

```bash
# Add to your shell profile
echo 'export OPENAI_API_KEY="your-key-here"' >> ~/.bashrc
echo 'export ANTHROPIC_API_KEY="your-key-here"' >> ~/.bashrc
echo 'export GOOGLE_API_KEY="your-key-here"' >> ~/.bashrc

# Reload your shell
source ~/.bashrc
```

### Alternative AI CLI Tools

If the built-in helper doesn't meet your needs, you can install additional CLI tools:

```bash
# Using npm (if available)
npm install -g @google/gemini-cli  # Official Google Gemini CLI
npm install -g @anthropic-ai/claude-code  # Claude Code CLI
npm install -g @openai/codex  # OpenAI Codex CLI
npm install -g opencode-ai  # OpenCode AI CLI

# Using pip
pip install llm  # LLM CLI tool
```

### Direct CLI Usage

Once installed and configured with API keys, you can use these tools directly:

```bash
# Google Gemini CLI
gemini "Explain quantum computing"

# Claude Code CLI
claude-code "Help me write a Python function"

# OpenAI Codex CLI
codex "Generate a data analysis script"

# OpenCode AI
opencode "Review my code for improvements"

# LLM CLI
llm "What's the difference between AI and machine learning?"
```

### AI Usage Examples

```bash
# Learning assistance
python ~/ai_helper.py "What is the difference between supervised and unsupervised learning?"

# Code help
python ~/ai_helper.py "How do I optimize this NumPy code for better performance?"

# Debugging help
python ~/ai_helper.py "I'm getting a TypeError in my pandas code, what should I check?"

# Explanation
python ~/ai_helper.py "Explain matplotlib subplots with a simple example"
```

---

**Remember**: Dev Containers are complex, and setup issues are normal. The goal is to get you coding as quickly as possible, not to have a "perfect" environment.
