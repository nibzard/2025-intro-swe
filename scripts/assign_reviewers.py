#!/usr/bin/env python3
"""
Automated peer reviewer assignment script.
Assigns 2-3 peer reviewers to each student's pull request by reading
student usernames from the students/ directory.
"""

import os
import random
from typing import List, Dict

def get_student_roster() -> List[str]:
    """
    Get list of student usernames by reading the students/ directory.

    Returns:
        List of student usernames (directory names)
    """
    students_dir = "../students"

    if not os.path.exists(students_dir):
        print(f"Error: {students_dir} directory not found")
        return []

    # Get all directories in students/ folder
    student_names = []
    for item in os.listdir(students_dir):
        item_path = os.path.join(students_dir, item)
        if os.path.isdir(item_path) and item != ".git":
            student_names.append(item)

    return sorted(student_names)

def assign_reviewers(pr_author: str, exclude: List[str] = None) -> List[str]:
    """
    Assign 2-3 peer reviewers for a pull request.

    Args:
        pr_author: GitHub username of the PR author
        exclude: List of usernames to exclude from review pool

    Returns:
        List of assigned reviewer usernames
    """
    if exclude is None:
        exclude = []

    # Get current student roster
    available_reviewers = get_student_roster()

    if not available_reviewers:
        print("Warning: No students found in students/ directory")
        return []

    # Remove author and excluded users from pool
    review_pool = [
        student for student in available_reviewers
        if student != pr_author and student not in exclude
    ]

    if len(review_pool) < 2:
        print(f"Warning: Not enough available reviewers for {pr_author}")
        return review_pool

    # Assign 2-3 random reviewers
    num_reviewers = min(3, len(review_pool))
    selected_reviewers = random.sample(review_pool, num_reviewers)

    return selected_reviewers

def create_review_assignment(pr_author: str, pr_number: int):
    """Create a review assignment issue."""
    reviewers = assign_reviewers(pr_author)

    if not reviewers:
        print(f"Cannot assign reviewers for {pr_author} - no available students")
        return

    issue_content = f"""## Peer Review Assignment

**Pull Request**: #{pr_number} - Lab submission
**Author**: @{pr_author}
**Assigned Reviewers**: {', '.join([f'@{r}' for r in reviewers])}

## Review Requirements

### Code Review Checklist
- [ ] Code runs without errors
- [ ] Follows Python style guidelines
- [ ] Includes appropriate comments
- [ ] Implements all required features

### Review Timeline
**Review Due**: 7 days from assignment
**Estimated Time**: 30-45 minutes

## Review Instructions
1. **Test the code locally** by following setup instructions
2. **Leave detailed comments** using GitHub's review features
3. **Focus on constructive feedback** and learning

Reviewers, please edit this issue to complete the checklist when finished.
"""

    print(f"Issue created for PR #{pr_number}")
    print(f"Author: @{pr_author}")
    print(f"Assigned reviewers: {', '.join([f'@{r}' for r in reviewers])}")
    print(f"\nCopy this for your GitHub issue:")
    print("=" * 50)
    print(issue_content)

def list_students():
    """List all current students in the roster."""
    students = get_student_roster()
    if students:
        print(f"Current student roster ({len(students)} students):")
        for i, student in enumerate(students, 1):
            print(f"  {i:2d}. @{student}")
    else:
        print("No students found in students/ directory")

if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage:")
        print("  python assign_reviewers.py list                    # List all students")
        print("  python assign_reviewers.py assign <username> <pr_number>  # Assign reviewers")
        sys.exit(1)

    command = sys.argv[1]

    if command == "list":
        list_students()
    elif command == "assign" and len(sys.argv) == 4:
        username = sys.argv[2]
        pr_number = int(sys.argv[3])
        create_review_assignment(username, pr_number)
    else:
        print("Invalid command. Use 'list' or 'assign <username> <pr_number>'")