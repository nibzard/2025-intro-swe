#!/usr/bin/env python3
"""
Student Activity Report Generation Script

This script reads STUDENT_ACTIVITY_DATA.json and generates a comprehensive
markdown report (STUDENT_ACTIVITY_ANALYSIS.md) with:
- Overview statistics
- Student activity table (all students)
- Project teams table
- Recommendations

Output: STUDENT_ACTIVITY_ANALYSIS.md
"""

import json
import subprocess
from datetime import datetime
from typing import List, Dict

# Get repository root dynamically
REPO_ROOT = subprocess.run(
    ["git", "rev-parse", "--show-toplevel"],
    capture_output=True,
    text=True
).stdout.strip()


def format_date(date_str: str) -> str:
    """Format ISO date string to readable format."""
    if not date_str:
        return "N/A"
    try:
        dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        return dt.strftime("%Y-%m-%d")
    except:
        return date_str


def get_status_emoji(status: str) -> str:
    """Get emoji for status."""
    emoji_map = {
        "Very Active": "🔥",
        "Active": "✅",
        "Low Activity": "⚠️",
        "Minimal Activity": "⚡",
        "No Git Activity": "❌",
        "Lead Only - Verify": "🔍"
    }
    return emoji_map.get(status, "")


def get_project_status(total_commits: int, in_roster: bool) -> str:
    """Determine project status based on commits and roster presence."""
    if not in_roster:
        return "Unknown Team"
    elif total_commits == 0:
        return "Inactive"
    elif total_commits <= 3:
        return "Minimal Activity"
    elif total_commits <= 10:
        return "Active"
    else:
        return "Very Active"


def generate_student_table(students: List[Dict]) -> str:
    """Generate markdown table for student activity."""
    # Sort students by commit count (descending), then by name
    sorted_students = sorted(
        students,
        key=lambda s: (-s['total_commits'], s['name'])
    )

    # Build table header
    table = "| Name | GitHub | Commits | Status | Lab01 | Lab03 | Project Role |\n"
    table += "|------|--------|---------|--------|-------|-------|-------------|\n"

    # Build table rows
    for student in sorted_students:
        name = student['name']
        github = student['github_username']
        commits = student['total_commits']
        status = student['status']
        status_emoji = get_status_emoji(status)

        # Lab completion markers
        lab01 = "✓" if student['lab01_complete'] else "—"
        lab03 = "✓" if student['lab03_folder'] else "—"

        # Project role
        if student['is_project_lead']:
            role = f"Lead ({student.get('project_folder', 'Unknown')})"
        elif student.get('project_folder'):
            role = f"Member ({student['project_folder']})"
        else:
            role = "—"

        table += f"| {name} | {github} | {commits} | {status_emoji} {status} | {lab01} | {lab03} | {role} |\n"

    return table


def generate_project_table(projects: Dict) -> str:
    """Generate markdown table for project teams."""
    # Sort projects by commit count (descending)
    sorted_projects = sorted(
        projects.items(),
        key=lambda p: -p[1]['total_commits']
    )

    # Build table header
    table = "| Project | Total Commits | Contributors | Team Lead | Status |\n"
    table += "|---------|---------------|--------------|-----------|--------|\n"

    # Build table rows
    for project_name, data in sorted_projects:
        commits = data['total_commits']
        contrib_count = data['contributor_count']
        lead = data['team_lead']
        status = get_project_status(commits, data['in_roster'])

        table += f"| {project_name} | {commits} | {contrib_count} | {lead} | {status} |\n"

    return table


def generate_recommendations(students: List[Dict], summary: Dict) -> str:
    """Generate recommendations section."""
    recommendations = []

    # Students needing attention (no activity)
    no_activity = [s for s in students if s['total_commits'] == 0]
    if no_activity:
        recommendations.append("### 🚨 Students Needing Immediate Attention\n")
        recommendations.append(f"**{len(no_activity)} students have no git activity:**\n")
        for student in no_activity[:10]:  # Show first 10
            recommendations.append(f"- {student['name']} ({student['github_username']})")
        if len(no_activity) > 10:
            recommendations.append(f"- ... and {len(no_activity) - 10} more")
        recommendations.append("")

    # Very active students (positive highlights)
    very_active = [s for s in students if s['status'] == 'Very Active']
    if very_active:
        recommendations.append("### 🌟 Top Performers\n")
        recommendations.append(f"**{len(very_active)} students are very active (15+ commits):**\n")
        # Sort by commits descending
        very_active.sort(key=lambda s: -s['total_commits'])
        for student in very_active[:5]:  # Top 5
            recommendations.append(
                f"- {student['name']} ({student['github_username']}) - {student['total_commits']} commits"
            )
        if len(very_active) > 5:
            recommendations.append(f"- ... and {len(very_active) - 5} more")
        recommendations.append("")

    # Lab01 completion
    lab01_incomplete = summary['total_students'] - summary['lab01_completion_count']
    if lab01_incomplete > 0:
        recommendations.append("### 📝 Lab01 Status\n")
        recommendations.append(
            f"**{lab01_incomplete} students ({round(lab01_incomplete/summary['total_students']*100, 1)}%) "
            f"have not completed Lab01 (intro.py)**\n"
        )

    # Lab03 folders
    lab03_missing = summary['total_students'] - summary['lab03_folder_count']
    if lab03_missing > 0:
        recommendations.append("### 📂 Lab03 Status\n")
        recommendations.append(
            f"**{lab03_missing} students ({round(lab03_missing/summary['total_students']*100, 1)}%) "
            f"do not have a Lab03 folder**\n"
        )

    # Orphaned projects
    if summary['orphaned_projects'] > 0:
        recommendations.append("### ⚠️ Orphaned Projects\n")
        recommendations.append(
            f"**{summary['orphaned_projects']} project folders are not linked to any team in the roster.** "
            f"These may be demo projects or need manual review.\n"
        )

    return "\n".join(recommendations)


def generate_report(data: Dict) -> str:
    """Generate complete markdown report."""
    summary = data['summary']
    students = data['students']
    projects = data['projects']
    generated_at = format_date(data['generated_at'])

    # Build report sections
    report = []

    # Title and metadata
    report.append("# Student Activity Analysis - 2025 Intro SWE\n")
    report.append(f"**Last Updated:** {generated_at}\n")
    report.append("---\n")

    # Overview statistics
    report.append("## 📊 Overview Statistics\n")
    report.append(f"- **Total Enrolled Students:** {summary['total_students']}")
    report.append(
        f"- **Students with Git Activity:** {summary['students_with_activity']} "
        f"({summary['activity_percentage']}%)"
    )
    report.append(
        f"- **Students with No Activity:** {summary['students_no_activity']} "
        f"({round(100 - summary['activity_percentage'], 1)}%)"
    )
    report.append(
        f"- **Lab01 Completion:** {summary['lab01_completion_count']} "
        f"({summary['lab01_completion_percentage']}%)"
    )
    report.append(
        f"- **Lab03 Folders:** {summary['lab03_folder_count']} "
        f"({summary['lab03_folder_percentage']}%)"
    )
    report.append(f"- **Total Projects:** {summary['total_projects']}")
    report.append(f"- **Projects in Roster:** {summary['projects_in_roster']}")
    if summary['orphaned_projects'] > 0:
        report.append(f"- **Orphaned Projects:** {summary['orphaned_projects']}")
    report.append("")

    # Status legend
    report.append("### Status Legend\n")
    report.append("- 🔥 **Very Active:** 15+ commits")
    report.append("- ✅ **Active:** 5-14 commits")
    report.append("- ⚠️ **Low Activity:** 2-4 commits")
    report.append("- ⚡ **Minimal Activity:** 1 commit")
    report.append("- ❌ **No Git Activity:** 0 commits")
    report.append("- 🔍 **Lead Only - Verify:** Listed as lead but 0 commits")
    report.append("")

    # Student activity table
    report.append("## 👥 Student Activity Table\n")
    report.append("All enrolled students sorted by activity level (most active first).\n")
    report.append(generate_student_table(students))
    report.append("")

    # Project teams table
    report.append("## 🚀 Project Teams Table\n")
    report.append("All project folders with commit activity and team information.\n")
    report.append(generate_project_table(projects))
    report.append("")

    # Recommendations
    report.append("## 💡 Recommendations\n")
    report.append(generate_recommendations(students, summary))
    report.append("")

    # Footer
    report.append("---\n")
    report.append("*This report is automatically generated from OFFICIAL_STUDENT_ROSTER.json and git history.*\n")
    report.append("*To update: Run `python3 .claude/skills/student-activity-analysis/collect_data.py` ")
    report.append("followed by `python3 .claude/skills/student-activity-analysis/generate_report.py`*\n")

    return "\n".join(report)


def main():
    """Main report generation logic."""
    print("=" * 60)
    print("Student Activity Report Generation")
    print("=" * 60)

    # Load activity data
    data_path = f"{REPO_ROOT}/STUDENT_ACTIVITY_DATA.json"
    print(f"\n1. Loading activity data from {data_path}")

    try:
        with open(data_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        print(f"   ✓ Loaded data for {data['summary']['total_students']} students")
    except FileNotFoundError:
        print(f"   ✗ ERROR: {data_path} not found!")
        print("   Run collect_data.py first to generate activity data.")
        return
    except json.JSONDecodeError as e:
        print(f"   ✗ ERROR: Invalid JSON in {data_path}: {e}")
        return

    # Generate report
    print("\n2. Generating markdown report...")
    report_content = generate_report(data)
    print(f"   ✓ Report generated ({len(report_content)} characters)")

    # Write to file
    output_path = f"{REPO_ROOT}/STUDENT_ACTIVITY_ANALYSIS.md"
    print(f"\n3. Writing report to {output_path}")

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(report_content)

    print("   ✓ Report generation complete!")

    # Print summary
    print("\n" + "=" * 60)
    print("Report Summary")
    print("=" * 60)
    print(f"Students analyzed: {data['summary']['total_students']}")
    print(f"Projects analyzed: {data['summary']['total_projects']}")
    print(f"Output file: {output_path}")
    print("=" * 60)


if __name__ == "__main__":
    main()
