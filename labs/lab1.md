# Lab 1: GitHub Fork, Branch, and Pull Request

**Duration:** 90 minutes
**Goal:** Every student demonstrates that they can:
- Fork the repo
- Create their own folder
- Add a simple Python file (AI-assisted allowed)
- Commit and push via Git
- Open a Pull Request (PR)

## Learning Objectives

By the end of this lab, you will be able to:
- Understand the Git and GitHub workflow
- Fork and clone repositories
- Create and manage branches
- Write clear commit messages
- Submit pull requests for code review

## Prerequisites

- GitHub account
- Git installed on your local machine
- Python 3.x installed
- Text editor or IDE

## Step-by-Step Instructions

### Step 1: Fork & Clone (15 min)

1. **Fork the Repository**
   - Go to the course repository on GitHub
   - Click the "Fork" button in the top-right corner
   - Select your GitHub account as the destination

2. **Clone Your Fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/2025-intro-swe.git
   cd 2025-intro-swe
   ```
   Replace `YOUR_USERNAME` with your actual GitHub username.

3. **Configure Git** (only if this is your first time using Git)
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

### Step 2: Create Personal Folder (10 min)

1. **Navigate to the students directory**
   ```bash
   cd students
   ```

2. **Create your personal folder**
   ```bash
   mkdir YOUR_USERNAME
   cd YOUR_USERNAME
   ```
   Replace `YOUR_USERNAME` with your GitHub username.

3. **Create a lab1 subfolder**
   ```bash
   mkdir lab1
   cd lab1
   ```

### Step 3: AI-Assisted Code (15 min)

1. **Generate Python code using your AI assistant**

   Use this prompt:
   ```
   Generate a simple Python class Student with name, year, and a method that prints a greeting.
   ```

   The expected output should look something like:
   ```python
   class Student:
       def __init__(self, name, year):
           self.name = name
           self.year = year

       def greet(self):
           print(f"Hello! I'm {self.name}, a {self.year} student.")

   # Example usage
   if __name__ == "__main__":
       student = Student("Alex", "sophomore")
       student.greet()
   ```

2. **Save the code**
   - Save the generated code as `intro.py` in your lab1 folder

3. **Test your code locally**
   ```bash
   python intro.py
   ```
   Ensure it runs without errors and produces the expected output.

### Step 4: Git Workflow (15 min)

1. **Check your current status**
   ```bash
   git status
   ```

2. **Add your changes**
   ```bash
   git add .
   ```

3. **Commit your changes**
   ```bash
   git commit -m "Add intro Student class for YOUR_USERNAME"
   ```
   Replace `YOUR_USERNAME` with your GitHub username.

4. **Push to your fork**
   ```bash
   git push origin main
   ```

### Step 5: Open Pull Request (15 min)

1. **Go to your fork on GitHub**
   - Navigate to `https://github.com/YOUR_USERNAME/2025-intro-swe`

2. **Create a Pull Request**
   - Click the "Contribute" button or "New Pull Request"
   - Ensure you're proposing changes from your fork's main branch to the original repository's main branch

3. **Fill in PR details**
   - **Title**: `"Add folder and intro.py for YOUR_USERNAME"`
   - **Description**: Briefly describe what you've accomplished in this lab
   - You can use AI to help generate the PR description, but review and personalize it

4. **Submit the Pull Request**
   - Click "Create Pull Request"

## Expected Directory Structure

After completing this lab, your submission should look like:

```
students/
└── YOUR_USERNAME/
    └── lab1/
        └── intro.py
```

## Evaluation Criteria

You will be evaluated on:

- **Repository Setup** (20%): Successfully forked and cloned the repository
- **Folder Structure** (20%): Created correct folder structure with your GitHub username
- **Code Functionality** (20%): Added working Python Student class
- **Git Workflow** (20%): Properly committed and pushed changes
- **Pull Request** (20%): Opened a properly formatted PR with clear description

## Common Issues and Solutions

### Issue: Permission Denied
```bash
Permission denied (publickey)
```
**Solution**: Set up SSH keys or use HTTPS with authentication.

### Issue: Branch Does Not Exist
```bash
error: src refspec main does not match any
```
**Solution**: Check your default branch name (`master` vs `main`) with `git branch`.

### Issue: Python Code Not Running
**Solution**:
- Verify Python is installed: `python --version`
- Check for syntax errors in your code
- Ensure you're in the correct directory

### Issue: Git Push Fails
**Solution**:
- Check your remote URL: `git remote -v`
- Update remote if needed: `git remote set-url origin https://github.com/YOUR_USERNAME/2025-intro-swe.git`

## Next Steps

After your pull request is reviewed and merged:
1. Keep your fork updated with the original repository
2. Delete your local lab files if needed (but keep them for reference)
3. Prepare for Lab 2

## Additional Resources

- [GitHub Docs: Forking a repository](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo)
- [Git Basics Documentation](https://git-scm.com/doc)
- [Python Official Tutorial](https://docs.python.org/3/tutorial/)

---

**Note**: This lab emphasizes fundamental Git and GitHub skills that will be essential for future assignments and collaborative software development. Take your time to understand each step thoroughly.
