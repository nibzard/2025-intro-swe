# Introduction to Software Engineering Labs

This repository contains all lab assignments for the Introduction to Software Engineering course. Students will work through various programming exercises to develop fundamental software engineering skills.

## Course Overview

This course covers essential software engineering concepts including:
- Version control with Git and GitHub
- Object-oriented programming in Python
- Software design patterns and principles
- Testing and debugging
- Collaborative development workflows
- Project management and documentation

## Getting Started

### Prerequisites
- Python 3.x
- Git
- GitHub account
- Text editor or IDE (VS Code, PyCharm, etc.)

### ⚠️ Important: Academic Integrity
All work submitted must follow academic integrity guidelines outlined in [CONTRIBUTING.md](CONTRIBUTING.md). By submitting work, you confirm it is your own and properly cites any sources used.

### Quick Start

1. **Complete [Lab 0: Development Environment Setup](labs/lab0.md)** first
2. **Fork this repository** to your GitHub account  
3. **Open in GitHub Codespaces** (recommended) or clone locally
4. **Start with Lab 1** after environment is ready

### Working on Labs

For each lab:
1. Create a folder with your GitHub username in `/students/` (e.g., `/students/jdoe`)
2. Complete the lab exercises in your folder
3. Commit and push your changes
4. Open a pull request following the lab-specific instructions

## Lab Structure

```
intro-se-2025-labs/
├── README.md                 # This file - general course info
├── requirements.txt          # Python dependencies
├── .devcontainer/           # Codespaces configuration
├── .github/workflows/       # Automated testing
├── labs/
│   ├── lab0.md              # Lab 0: Environment Setup
│   ├── lab1.md              # Lab 1: Git and GitHub Basics
│   └── lab2.md              # Lab 2: [To be added]
└── students/
    ├── README.md            # Instructions for students folder
    ├── jdoe/                # Student work folders (GitHub username)
    │   ├── lab1/
    │   │   └── intro.py
    │   └── lab2/
    │       └── [lab files]
    └── student2/
        └── ...
```

## Lab Schedule

- **Lab 0**: Development Environment Setup (30 min)
- **Lab 1**: GitHub Fork, Branch, and Pull Request (45 min)
- **Lab 2**: [Coming soon]
- **Lab 3**: [Coming soon]
- *[Additional labs will be added throughout the course]*

## Submission Guidelines

1. **Folder Structure**: Use your GitHub username as the folder name
2. **Commit Messages**: Use clear, descriptive commit messages
3. **Pull Requests**: Follow the specific PR format for each lab
4. **Code Quality**: Ensure your code runs without errors
5. **Documentation**: Include necessary comments and documentation

## Evaluation Criteria

- **Functionality**: Code works as expected
- **Code Quality**: Clean, readable, well-structured code
- **Git Usage**: Proper version control practices
- **Documentation**: Clear explanations and comments
- **Collaboration**: Proper use of GitHub workflows

## Getting Help

If you encounter issues:
1. Check the specific lab instructions
2. Verify your Git configuration
3. Ensure you're working in the correct branch
4. Test your code locally before pushing
5. Review error messages carefully

## Development Environment

This repository includes:
- **GitHub Codespaces support** for consistent cloud development
- **Automated testing** via GitHub Actions
- **Code quality tools** (black, flake8, mypy)
- **Pre-commit hooks** for code formatting

## License

This repository is licensed under the [Apache License 2.0](LICENSE).

## Instructor Resources

Instructors can find additional materials and solutions in the instructor-only branches or repositories.

---

**Ready to start?** Begin with [Lab 0: Development Environment Setup](labs/lab0.md)