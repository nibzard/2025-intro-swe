# 🎤 Old School Hip Hop Recommendations API - Josip Ćužić, Augustin Olujić, Lana Peričić, Mirta Đogaš

**Project:** 🎤 Old School Hip Hop Recommendations API
**Team:** KSKS
**Status:** In Progress

## 🎯 Project Overview

Old School Hip Hop Recommendations API je RESTful web servis razvijen pomoću FastAPI frameworka.
Služi kao platforma za istraživanje, evaluaciju i preporuku klasične hip hop glazbe iz zlatnog doba (1980–2000).
Cilj je stvoriti centralizirani API koji korisnicima omogućuje:

-pretraživanje albuma, izvođača i regija(WestCoast-EastCoast ili South),

-dobivanje personaliziranih preporuka,

-ocjenjivanje i izradu playlisti.

## 👥 Team Information

- **Josip Ćužić** - GitHub: [@jcuzic](https://github.com/Zlicone)
- **Augustin Olujić** - GitHub: [@aolujic](https://github.com/augistin97)
- **Lana Peričić** - GitHub: [@lpericic](https://github.com/lanapericic810)
- **Mirta Đogaš** - GitHub: [@mdogas](https://github.com/Mirtaaa565)
- **Team Name**: KSKS

## 🛠 Technologies Used

- Python 3.11+

- FastAPI

- SQLAlchemy & Alembic

- PostgreSQL / SQLite

- JWT autentifikacija

- Pytest za testiranje

## 🚀 Getting Started

### For Team Members

1. **Clone the repository**:
   ```bash
   git clone [https://github.com/Zlicone/2025-intro-swe]
   cd 2025-intro-swe/projects/KSKS-jcuzic-aolujic-lpericic-mdogas
   ```

2. **Set up your environment**:
   Use Codespaces or Devcontainer with local VS Code.

3. **Create your feature branch**:
   ```bash
   git checkout -b feature/[feature-name]
   ```

### For Instructors/Reviewers

1. View our project documentation below
2. Check our GitHub Issues for project planning
3. Review our Pull Requests for collaboration process

## 🔄 Pair Programming Workflow

### Daily Routine

1. **Start of Day (5 minutes)**
   - Sync with partner: Discuss goals and who's driving/navigating
   - Pull latest changes: `git pull origin main`
   - Create feature branch: `git checkout -b feature/[feature-name]`

2. **During Development**
   - **Driver**: Writes the code (types)
   - **Navigator**: Reviews code, thinks ahead, catches issues
   - **Switch roles** every 25-30 minutes (Pomodoro technique)
   - **Commit frequently** with descriptive messages

3. **End of Day (10 minutes)**
   - **Push your branch**: `git push origin feature/[feature-name]`
   - **Create Pull Request** to main branch
   - **Partner reviews** the PR (must be approved by both team members)
   - **Merge to main** after both approve

### Branch Strategy

- `main`: Protected branch for final, working code
- `feature/[feature-name]`: Individual feature branches
- All work happens on feature branches, never directly on main

### Pull Request Process

1. **Create PR** from feature branch to main
2. **Both team members must review** and approve
3. **Use the PR template** (see below)
4. **Merge only after** both approvals and CI passes

## 📝 Pull Request Template

```markdown
## What We Did
- [ ] Feature 1 implemented
- [ ] Feature 2 implemented
- [ ] Tests added and passing
- [ ] Documentation updated

## How to Test
1. Run `python main.py`
2. Expected output: ...

## What We Learned
- Brief reflection on what you learned today

## Next Steps
- What you plan to work on next
```

## 🛠 Development Best Practices

### Communication
- **Think aloud** when you're the driver
- **Ask questions** when you're the navigator
- **Take breaks** together every hour
- **Be patient** and respectful of different coding styles

### Code Quality
- **Test your code** before committing
- **Write clear commit messages** following conventional commits
- **Review each other's code** carefully and constructively
- **Refactor together** when needed

### Problem Solving
- **Google together** - don't waste time being stuck
- **Draw diagrams** on paper or virtual whiteboard
- **Explain concepts** to each other
- **Ask for help** from instructors when needed

## 📊 Project Requirements

### Technical Requirements ✅
- [ ] Use Python (or language approved by instructor)
- [ ] Include proper error handling
- [ ] Add comments and documentation
- [ ] Create tests for major functionality
- [ ] Use Git appropriately (commits, branches, PRs)

### Collaboration Requirements ✅
- [ ] Both team members contribute code
- [ ] Use GitHub Issues for project planning
- [ ] Create Pull Requests for all features
- [ ] Both members must approve PRs
- [ ] Document learning process

## 📈 Project Progress

### Completed Tasks
- [x] Project setup and repository structure
- [x] Environment configuration
- [x] Initial data exploration

### In Progress
- [ ] Data cleaning and preprocessing
- [ ] Statistical analysis implementation

### Next Steps
- [ ] Visualization development
- [ ] Report generation
- [ ] Final presentation preparation

## 🐛 Issues & Challenges

### Current Challenges
- Data format inconsistencies
- Missing temperature readings for certain time periods

### Solutions Tried
- Data interpolation for missing values
- Cross-referencing with other climate datasets

## 📚 Resources Used

- [Python Data Science Handbook](https://jakevdp.github.io/PythonDataScienceHandbook/)
- [Climate Data APIs](https://climate.data.gov/)
- [matplotlib documentation](https://matplotlib.org/stable/contents.html)

## 🤝 How to Use This Template

1. **Copy this folder** and rename it: `team_name-student1-student2/`
2. **Update this README** with your team information
3. **Replace project details** with your specific project
4. **Customize the technologies** and requirements as needed
5. **Start collaborating** using the workflow above!

---

## ❓ Need Help?

- **Create a GitHub Issue** in the main repository
- **Ask during class** or office hours
- **Review GitHub documentation** for workflow questions
- **Check other team folders** for examples

**Remember**: The goal is to learn both technical skills AND collaboration skills. Communication and teamwork are just as important as the code you write!