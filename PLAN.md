# Plan for Grading System Implementation

## Overview
This document outlines the implementation plan for a comprehensive grading system for the SWE course, including automated tracking tools and evaluation systems.

## Grading Structure

### 1. Seminar (10%) - Prezentacija
- **Description**: Mid-term presentation or demo
- **Evaluation Criteria**:
  - Razumijevanje zahtjeva (Understanding requirements)
  - Prezentacijske vještine (Presentation skills)
  - Progress made
  - Documentation quality

### 2. Final Project (50%) - Završni projekt

#### a) Code Quality and Functionality (30%) - Kvaliteta i funkcionalnost koda
- Ispravna implementacija (Correct implementation)
- Čitak i dokumentiran kod (Clean and documented code)
- Error handling
- Technical implementation

#### b) Innovation and Complexity (10%) - Inovativnost i složenost
- Tehnički izazovi (Technical challenges)
- Kreativna rješenja (Creative solutions)
- Originality of the idea

#### c) Project Documentation (10%) - Dokumentacija projekta
- README file with setup instructions
- Technical documentation (SPECS)
- User guide (if applicable)

### 3. Attendance and Activity (10%) - Dolaznost i aktivnost
- Sudjelovanje na predavanjima (Lecture participation)
- Laboratoriji (Lab participation)
- Can be tracked via GitHub activity as proxy

### 4. Git Activity (10%) - Aktivnost na Git-u
- Redovitost i kvaliteta commitova (Regularity and quality of commits)
- Smisleni opisi (Meaningful descriptions)
- Suradnja u timu (Team collaboration)
- Activity distribution (avoids last-minute commits)

### 5. Peer Review (10%) - Peer review
- Međusobno ocjenjivanje timskih projekata (Mutual evaluation of team projects)
- Standardized rubric for consistency
- Evaluation by other teams

### 6. Git Quiz (10%) - Git kviz
- Kratki kviz o osnovama Gita i GitHuba (Short quiz on Git and GitHub basics)
- Topics covered:
  - Branching
  - Pull requests
  - Conflict resolution
  - Basic Git commands
- Interactive in-class format

## Implementation Components

### 1. Git Activity Analyzer (`scripts/git_activity_analyzer.py`)
**Purpose**: Track and evaluate student Git activity for the 10% Git Activity component

**Features**:
- Analyze commit frequency and distribution over time
- Evaluate commit message quality
- Track branch usage patterns
- Monitor team collaboration
- Generate activity reports with scores
- Identify "last-minute dumps" vs consistent work

**Metrics to Track**:
- Total commits per student/team
- Commit distribution timeline
- Average commits per day/week
- Branch creation and usage
- Merge patterns
- Commit message length and quality
- Collaboration patterns (for teams)

**Output**:
- Activity score (0-10) for each student
- Detailed activity report
- Visualizations (commit heatmaps, activity graphs)
- Flag unusual patterns (e.g., all commits in one day)

### 2. Grade Calculator (`scripts/grade_calculator.py`)
**Purpose**: Calculate final grades based on all components

**Features**:
- Input grades for each component
- Apply weightings according to grading structure
- Calculate final grade
- Generate grade reports per student
- Class statistics and distributions
- Export to various formats (CSV, JSON)

**Input Requirements**:
- Seminar scores
- Project scores (with sub-components)
- Attendance records
- Git activity scores (from analyzer)
- Peer review averages
- Git quiz scores

**Output**:
- Final grade for each student
- Breakdown of all components
- Class ranking and statistics
- Pass/fail status

### 3. Peer Review System (`scripts/peer_review_system.py`)
**Purpose**: Facilitate mutual evaluation of team projects

**Features**:
- Create review assignments
- Standardized evaluation rubric
- Collect and process reviews
- Calculate average scores
- Handle anomalous reviews (outliers)
- Generate feedback reports

**Rubric Criteria**:
1. Code Quality (0-10)
2. UI/UX (if applicable) (0-10)
3. Innovation (0-10)
4. Documentation (0-10)
5. Overall Impression (0-10)

**Process**:
1. Assign 3-4 reviewers per project
2. Reviewers evaluate based on rubric
3. System calculates average scores
4. Apply outlier removal if needed
5. Generate final peer review score

### 4. Git Quiz Generator (`scripts/git_quiz_generator.py`)
**Purpose**: Create interactive Git/GitHub quiz for in-class assessment

**Features**:
- Question bank management
- Multiple choice questions
- Practical "what command" questions
- Scenarios and best practices
- Generate quiz sheets
- Answer key
- Interactive version (optional)

**Question Categories**:
1. Basic Commands (clone, add, commit, push)
2. Branching and Merging
3. Pull Requests
4. Conflict Resolution
5. Collaboration Workflows
6. Best Practices

**Output Formats**:
- Printable quiz sheets
- Interactive HTML quiz
- JSON for LMS integration
- Answer key with explanations

## Implementation Timeline

### Phase 1: Git Activity Analyzer (Week 1)
- Create base script structure
- Implement Git repository parsing
- Add activity metrics calculation
- Test with sample repositories
- Generate initial reports

### Phase 2: Grade Calculator (Week 2)
- Implement grade calculation logic
- Add input validation
- Create report generation
- Test with sample data

### Phase 3: Peer Review System (Week 3)
- Design review rubric
- Implement assignment algorithm
- Create review collection interface
- Add scoring and outlier detection

### Phase 4: Git Quiz Generator (Week 4)
- Build question bank
- Implement quiz generation
- Create different output formats
- Test interactive features

### Phase 5: Integration and Testing (Week 5)
- Integrate all components
- Test with real course data
- Refine based on feedback
- Create documentation

## Data Flow

```
GitHub Repositories
       ↓
Git Activity Analyzer → Activity Scores
       ↓
Grade Calculator ← All Components
       ↓
Final Grades
```

## File Structure

```
scripts/
├── git_activity_analyzer.py      # Tracks Git activity
├── grade_calculator.py           # Calculates final grades
├── peer_review_system.py         # Manages peer reviews
├── git_quiz_generator.py         # Creates Git quizzes
└── utils/
    ├── git_utils.py              # Git-related utilities
    ├── grading_utils.py          # Grading calculations
    └── report_utils.py           # Report generation

data/
├── grades/                       # Grade data storage
├── peer_reviews/                 # Peer review data
├── quizzes/                      # Generated quizzes
└── reports/                      # Generated reports

docs/
├── grading_rubric.md             # Detailed rubric
├── peer_review_guidelines.md     # Review guidelines
└── git_quiz_questions.md         # Question bank
```

## Considerations

### Privacy and Data
- Store grades securely
- Follow GDPR requirements
- Anonymize data for analysis
- Backup regularly

### Fairness
- Standardize evaluation criteria
- Handle outliers appropriately
- Provide clear feedback
- Allow for appeals/reviews

### Automation vs Manual
- Automate where possible
- Keep human oversight
- Validate automated scores
- Adjust based on context

## Next Steps

1. Start with Git Activity Analyzer implementation
2. Test with existing student repositories
3. Gather feedback from teaching team
4. Iterate and improve based on usage
5. Create user documentation for each tool

## Success Metrics

- Reduced time spent on grade calculation
- More objective evaluation criteria
- Better student engagement tracking
- Improved feedback quality
- Higher student satisfaction with grading