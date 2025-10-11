# Lab 0: Development Environment Setup

**Duration:** 30 minutes
**Goal:** Set up a consistent development environment for the course

## Learning Objectives

By the end of this lab, you will have:
- A working Python development environment
- Git properly configured for the course
- Access to the course repository
- Understanding of the development workflow

## Prerequisites

- Computer with internet access
- GitHub account (create at [github.com](https://github.com) if needed)

## Setup Options

Choose **ONE** of the following setup methods:

### Option A: GitHub Codespaces (Recommended for beginners)
**Pros:** No local setup needed, consistent environment
**Cons:** Requires internet connection, limited free hours

1. **Open in Codespaces**
   - Go to the course repository on GitHub
   - Click the green "Code" button
   - Select "Codespaces" tab
   - Click "Create codespace on main"

2. **Wait for environment setup** (2-3 minutes)
   - Codespaces will automatically install dependencies
   - You'll see a VS Code interface in your browser

3. **Verify setup**
   ```bash
   python --version  # Should show Python 3.11+
   git --version     # Should show Git version
   ```

### Option B: Local Development
**Pros:** Works offline, full control
**Cons:** More setup required, potential compatibility issues

#### Step 1: Install Python (15 min)

**Windows:**
```powershell
# Download and install Python from python.org
# OR use winget:
winget install Python.Python.3.11
```

**macOS:**
```bash
# Install Homebrew if needed, then:
brew install python@3.11
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install python3.11 python3.11-venv python3-pip
```

#### Step 2: Install Git
Follow instructions at [git-scm.com](https://git-scm.com/downloads)

#### Step 3: Configure Git
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

#### Step 4: Clone Repository
```bash
git clone https://github.com/YOUR_USERNAME/2025-intro-swe.git
cd 2025-intro-swe
```

#### Step 5: Set up Python Environment
```bash
# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

## Verification Tests

Run these commands to verify your setup:

### Test 1: Python Environment
```bash
python --version
pip list | grep pytest
```
**Expected:** Python 3.11+ and pytest listed

### Test 2: Create and Run Python File
```bash
# Create test file
cat > test_setup.py << 'EOF'
def greet(name):
    return f"Hello, {name}!"

if __name__ == "__main__":
    result = greet("World")
    print(result)
    assert result == "Hello, World!"
    print("✅ Setup verification passed!")
EOF

# Run it
python test_setup.py
```
**Expected:** "✅ Setup verification passed!"

### Test 3: Git Configuration
```bash
git config user.name
git config user.email
```
**Expected:** Your name and email

### Test 4: Development Tools
```bash
# Test code formatter
echo 'x=1+2' | black --code -
# Test linter
echo 'x=1+2' | flake8 --stdin-display-name=test.py -
```

## Development Workflow

Your typical workflow will be:
1. **Start environment** (Codespaces: open in browser, Local: activate venv)
2. **Pull latest changes** (`git pull origin main`)
3. **Create your work** in `students/YOUR_USERNAME/`
4. **Test your code** (`python your_file.py`)
5. **Commit and push** (`git add . && git commit -m "message" && git push`)

## Troubleshooting

### Common Issues

**Python not found:**
- Windows: Add Python to PATH during installation
- macOS: Use `python3` instead of `python`
- Linux: Install python3-dev package

**Permission denied:**
- Windows: Run terminal as administrator
- macOS/Linux: Check file permissions, avoid `sudo pip`

**Git authentication:**
- Set up GitHub personal access token
- Use HTTPS clone URL, not SSH (unless you have SSH keys)

**Virtual environment issues:**
- Make sure you activated it (`source venv/bin/activate`)
- Deactivate and recreate if corrupted (`deactivate`, `rm -rf venv`)

### Getting Help

1. **Check the error message** carefully
2. **Search online** for the specific error
3. **Ask in course forum** or office hours
4. **Try the other setup option** (Codespaces vs Local)

## Next Steps

After completing setup:
1. ✅ Mark this lab as complete
2. 📁 Create your student folder: `students/YOUR_USERNAME/`
3. 🚀 Move on to [Lab 1: Git and GitHub Basics](lab1.md)

## Success Criteria

You've successfully completed Lab 0 when:
- [ ] Python 3.11+ is working
- [ ] Git is configured with your name/email
- [ ] You can run the verification script
- [ ] You understand your chosen development workflow
- [ ] Repository is accessible and you can make changes

---

**Estimated time:** 30 minutes
**Need help?** Check troubleshooting section or ask in course forum
