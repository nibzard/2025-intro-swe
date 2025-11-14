#!/usr/bin/env python3
"""
Student Activity Data Collection Script

This script queries git history and the filesystem to collect comprehensive
activity data for all enrolled students. It handles edge cases like multiple
GitHub usernames, name variations, and misplaced files.

Output: STUDENT_ACTIVITY_DATA.json
"""

import json
import subprocess
import os
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# Get repository root dynamically
REPO_ROOT = subprocess.run(
    ["git", "rev-parse", "--show-toplevel"],
    capture_output=True,
    text=True
).stdout.strip()


def run_command(cmd: str) -> str:
    """Run a shell command and return output."""
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            cwd=REPO_ROOT
        )
        return result.stdout.strip()
    except Exception as e:
        print(f"Error running command '{cmd}': {e}")
        return ""


def normalize_name(name: str) -> str:
    """Normalize name for fuzzy matching (lowercase, remove diacritics)."""
    # Simple diacritic removal for common Croatian characters
    replacements = {
        'č': 'c', 'ć': 'c', 'š': 's', 'ž': 'z', 'đ': 'd',
        'Č': 'C', 'Ć': 'C', 'Š': 'S', 'Ž': 'Z', 'Đ': 'D'
    }
    normalized = name.lower()
    for old, new in replacements.items():
        normalized = normalized.replace(old, new)
    return normalized


def get_student_commits(usernames: List[str], project_folder: Optional[str] = None) -> Dict:
    """
    Get commit count and date range for student.

    Args:
        usernames: List of GitHub usernames to search for
        project_folder: Optional project folder to limit search to

    Returns:
        Dict with commits, first_date, last_date
    """
    # Build author pattern: "user1\|user2\|user3"
    author_pattern = "\\|".join(usernames)

    # Build git log command
    if project_folder:
        path_spec = f"projects/{project_folder}/"
    else:
        path_spec = ""

    # Get commit count
    cmd = f"git log --all --author=\"{author_pattern}\" --oneline {path_spec}| wc -l"
    commits = int(run_command(cmd) or "0")

    if commits == 0:
        return {"commits": 0, "first_date": None, "last_date": None}

    # Get date range
    cmd_dates = f"git log --all --author=\"{author_pattern}\" --format=\"%ai\" {path_spec}| sort"
    dates_output = run_command(cmd_dates)

    if dates_output:
        dates = [line.split()[0] for line in dates_output.split('\n') if line]
        first_date = dates[0] if dates else None
        last_date = dates[-1] if dates else None
    else:
        first_date = last_date = None

    return {
        "commits": commits,
        "first_date": first_date,
        "last_date": last_date
    }


def check_lab01(student_name: str, github_username: str) -> bool:
    """
    Check if student completed Lab01 (intro.py file exists).

    Searches entire students/ directory to handle misplaced files.
    """
    # First try expected location
    expected_path = f"students/{github_username}/intro.py"
    if os.path.exists(f"{REPO_ROOT}/{expected_path}"):
        return True

    # Search entire students/ directory
    cmd = "find students/ -name 'intro.py' -type f 2>/dev/null"
    all_intro_files = run_command(cmd).split('\n')

    # Check if any path contains the username or normalized name
    normalized_name = normalize_name(student_name.replace(' ', '').lower())
    for file_path in all_intro_files:
        if not file_path:
            continue
        path_lower = file_path.lower()
        if github_username.lower() in path_lower or normalized_name in path_lower:
            return True

    return False


def check_lab03(github_username: str, student_name: str) -> bool:
    """
    Check if student has Lab03 folder.

    Uses fuzzy matching on folder names to handle diacritics and variations.
    """
    # List all lab03 folders
    lab03_dir = f"{REPO_ROOT}/students/lab03/"
    if not os.path.exists(lab03_dir):
        return False

    folders = [f for f in os.listdir(lab03_dir) if os.path.isdir(os.path.join(lab03_dir, f))]

    # Normalize username and name for comparison
    username_norm = normalize_name(github_username)
    name_norm = normalize_name(student_name.replace(' ', ''))

    # Extract first and last name for common patterns like "kmihaljevic"
    name_parts = student_name.split()
    if len(name_parts) >= 2:
        first_name = normalize_name(name_parts[0])
        last_name = normalize_name(name_parts[-1])
        first_initial_last = first_name[0] + last_name if first_name and last_name else ""
    else:
        first_initial_last = ""

    for folder in folders:
        folder_norm = normalize_name(folder)
        # Check for exact match or partial match (bidirectional)
        if folder_norm == username_norm or folder_norm in username_norm or username_norm in folder_norm:
            return True
        if folder_norm == name_norm or name_norm in folder_norm or folder_norm in name_norm:
            return True
        # Check for first initial + last name pattern (e.g., "kmihaljevic")
        if first_initial_last and folder_norm == first_initial_last:
            return True

    return False


def classify_status(commits: int, is_lead: bool, has_lab03: bool) -> str:
    """
    Classify student activity level.

    Returns: Very Active, Active, Low Activity, Minimal Activity, or No Git Activity
    """
    if commits == 0:
        if is_lead:
            return "Lead Only - Verify"
        return "No Git Activity"
    elif commits == 1:
        return "Minimal Activity"
    elif commits <= 4:
        return "Low Activity"
    elif commits <= 14:
        return "Active"
    else:
        return "Very Active"


def get_project_stats(project_folder: str) -> Dict:
    """Get statistics for a specific project folder."""
    cmd = f"git log --all --oneline projects/{project_folder}/ 2>/dev/null | wc -l"
    commits = int(run_command(cmd) or "0")

    # Get list of contributors
    cmd_authors = f"git log --all --format=\"%an\" projects/{project_folder}/ 2>/dev/null | sort -u"
    authors = run_command(cmd_authors).split('\n')
    authors = [a for a in authors if a]

    return {
        "total_commits": commits,
        "contributors": authors,
        "contributor_count": len(authors)
    }


def find_all_project_folders() -> List[str]:
    """Find all project folders in the repository."""
    projects_dir = f"{REPO_ROOT}/projects/"
    if not os.path.exists(projects_dir):
        return []

    folders = [
        f for f in os.listdir(projects_dir)
        if os.path.isdir(os.path.join(projects_dir, f)) and not f.startswith('.')
    ]
    return sorted(folders)


def main():
    """Main data collection logic."""
    print("=" * 60)
    print("Student Activity Data Collection")
    print("=" * 60)

    # Load official roster
    roster_path = f"{REPO_ROOT}/OFFICIAL_STUDENT_ROSTER.json"
    print(f"\n1. Loading roster from {roster_path}")

    with open(roster_path, 'r', encoding='utf-8') as f:
        roster = json.load(f)

    students = roster['students']
    teams = roster['teams']
    print(f"   ✓ Loaded {len(students)} students and {len(teams)} teams")

    # Collect student activity
    print("\n2. Collecting student activity data...")
    student_activity = []

    for idx, student in enumerate(students, 1):
        name = student['full_name']
        github = student.get('github_username')

        # Skip students without GitHub username
        if not github:
            print(f"   [{idx}/{len(students)}] {name} (no GitHub username) - SKIPPED")
            student_data = {
                "name": name,
                "email": student.get('email', ''),
                "github_username": None,
                "total_commits": 0,
                "first_commit_date": None,
                "last_commit_date": None,
                "lab01_complete": False,
                "lab03_folder": False,
                "project_folder": None,
                "project_commits": 0,
                "is_project_lead": False,
                "status": "No Git Activity"
            }
            student_activity.append(student_data)
            continue

        # Handle multiple usernames (e.g., "user1/user2")
        usernames = [u.strip() for u in github.split('/')]

        print(f"   [{idx}/{len(students)}] {name} ({github})")

        # Get overall commit stats
        overall_stats = get_student_commits(usernames)

        # Check lab completion
        lab01_complete = check_lab01(name, usernames[0])
        lab03_folder = check_lab03(usernames[0], name)

        # Check if student is a project lead
        # Teams is a dict: {team_name: {members: [...], lead: "Full Name", folder: "..."}}
        is_lead = any(
            team_data.get('lead') == name
            for team_data in teams.values()
        )

        # Get project-specific stats if student is in a team
        project_folder = None
        project_commits = 0
        for team_name, team_data in teams.items():
            # Check if student's full name is in the team members list
            if name in team_data.get('members', []):
                project_folder = team_data.get('folder')
                if project_folder:
                    project_stats = get_student_commits(usernames, project_folder)
                    project_commits = project_stats['commits']
                break

        # Classify status
        status = classify_status(overall_stats['commits'], is_lead, lab03_folder)

        student_data = {
            "name": name,
            "email": student['email'],
            "github_username": github,
            "total_commits": overall_stats['commits'],
            "first_commit_date": overall_stats['first_date'],
            "last_commit_date": overall_stats['last_date'],
            "lab01_complete": lab01_complete,
            "lab03_folder": lab03_folder,
            "project_folder": project_folder,
            "project_commits": project_commits,
            "is_project_lead": is_lead,
            "status": status
        }

        student_activity.append(student_data)

    # Collect project folder stats
    print("\n3. Collecting project folder statistics...")
    all_project_folders = find_all_project_folders()
    project_stats = {}

    for project in all_project_folders:
        print(f"   - {project}")
        stats = get_project_stats(project)

        # Find matching team from roster
        # Teams is a dict: {team_name: {members: [...], lead: "Full Name", folder: "..."}}
        team_info = None
        team_name_matched = None
        for team_name, team_data in teams.items():
            if team_data.get('folder') == project:
                team_info = team_data
                team_name_matched = team_name
                break

        if team_info:
            # Find GitHub username for the lead
            lead_github = "Unknown"
            lead_name = team_info.get('lead', '')
            for student in students:
                if student['full_name'] == lead_name:
                    lead_github = student['github_username']
                    break

            project_stats[project] = {
                **stats,
                "team_name": team_name_matched,
                "team_lead": lead_github,
                "team_members": team_info.get('members', []),
                "in_roster": True
            }
        else:
            # Orphaned project
            project_stats[project] = {
                **stats,
                "team_name": "Unknown",
                "team_lead": "Unknown",
                "team_members": [],
                "in_roster": False
            }

    # Calculate summary statistics
    total_students = len(students)
    students_with_activity = sum(1 for s in student_activity if s['total_commits'] > 0)
    activity_percentage = (students_with_activity / total_students * 100) if total_students > 0 else 0

    lab01_complete = sum(1 for s in student_activity if s['lab01_complete'])
    lab03_folders = sum(1 for s in student_activity if s['lab03_folder'])

    summary = {
        "total_students": total_students,
        "students_with_activity": students_with_activity,
        "students_no_activity": total_students - students_with_activity,
        "activity_percentage": round(activity_percentage, 1),
        "lab01_completion_count": lab01_complete,
        "lab01_completion_percentage": round(lab01_complete / total_students * 100, 1),
        "lab03_folder_count": lab03_folders,
        "lab03_folder_percentage": round(lab03_folders / total_students * 100, 1),
        "total_projects": len(all_project_folders),
        "projects_in_roster": sum(1 for p in project_stats.values() if p['in_roster']),
        "orphaned_projects": sum(1 for p in project_stats.values() if not p['in_roster'])
    }

    # Build output data
    output = {
        "generated_at": datetime.now().isoformat(),
        "summary": summary,
        "students": student_activity,
        "projects": project_stats
    }

    # Write to JSON file
    output_path = f"{REPO_ROOT}/STUDENT_ACTIVITY_DATA.json"
    print(f"\n4. Writing data to {output_path}")

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print("   ✓ Data collection complete!")

    # Print summary
    print("\n" + "=" * 60)
    print("Summary Statistics")
    print("=" * 60)
    print(f"Total students: {summary['total_students']}")
    print(f"Students with activity: {summary['students_with_activity']} ({summary['activity_percentage']}%)")
    print(f"Students with no activity: {summary['students_no_activity']}")
    print(f"Lab01 completion: {summary['lab01_completion_count']} ({summary['lab01_completion_percentage']}%)")
    print(f"Lab03 folders: {summary['lab03_folder_count']} ({summary['lab03_folder_percentage']}%)")
    print(f"Total projects: {summary['total_projects']}")
    print(f"Orphaned projects: {summary['orphaned_projects']}")
    print("=" * 60)


if __name__ == "__main__":
    main()
