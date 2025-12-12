#!/usr/bin/env python3
"""
Student Project Presentation Scheduler
Randomly assigns student projects to presentation dates with controlled distribution.
"""

import os
import random
import re
import argparse
from datetime import datetime
from dataclasses import dataclass
from typing import List, Dict, Optional, Tuple


@dataclass
class Project:
    """Represents a student project."""
    team_name: str
    students: List[str]
    project_title: str
    folder: str
    status: str
    description: str


def parse_project_list(file_path: str) -> List[Project]:
    """
    Parse the PROJECT_LIST.md file and extract project information.

    Args:
        file_path: Path to PROJECT_LIST.md

    Returns:
        List of Project objects

    Raises:
        FileNotFoundError: If the file doesn't exist
        ValueError: If no valid projects are found
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Project list file not found: {file_path}")

    projects = []

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find all project sections using regex
    # Match pattern: ### [Team Info] followed by bullet points
    project_pattern = r'### ([^\n]+?)\n(?:\* \*\*Project:\*\* ([^\n]+)\n)?(?:\* \*\*Projekt:\*\* ([^\n]+)\n)?(?:\* \*\*Folder:\*\* `?([^`\n]+)`?\n)?(?:\* \*\*Status:\*\* ([^\n]+)\n)?(?:\* \*\*Description:\*\* ([^\n]+)\n)?'

    matches = re.findall(project_pattern, content, re.MULTILINE)

    for match in matches:
        header = match[0].strip()
        project_title = match[1] if match[1] else match[2]  # Handle both Project and Projekt typo
        folder = match[3]
        status = match[4]
        description = match[5]

        # Skip only actual template entries (placeholders with generic names)
        # List of patterns that indicate template/placeholder entries
        template_patterns = [
            '[Team Name]',  # Generic team placeholder
            '[Student Name]', '[Student Names]',  # Generic student placeholders
            '[Project Name]', '[Project Title]',  # Generic project placeholders
            '[Folder Name]',  # Generic folder placeholder
            '[Status]',  # Generic status placeholder
            '[Description]'  # Generic description placeholder
        ]

        # Check if any template pattern is found
        is_template = False
        for pattern in template_patterns:
            if pattern in header or pattern in project_title or pattern in status or pattern in description:
                is_template = True
                break

        # Check if it's a template (all fields are brackets with generic placeholder names)
        # Only skip if it's clearly a template with generic placeholders
        if is_template:
            continue

        # Skip if no project title
        if not project_title:
            continue

        # Clean up bracketed content (remove brackets but keep content)
        header = header.replace('[', '').replace(']', '').strip()
        project_title = project_title.replace('[', '').replace(']', '').strip()
        if status:
            status = status.replace('[', '').replace(']', '').strip()
        if description:
            description = description.replace('[', '').replace(']', '').strip()

        # Parse team name and students
        if ' - ' in header:
            parts = header.split(' - ', 1)
            team_name = parts[0].strip()
            students_part = parts[1].strip()

            # Handle special cases
            if header == "Carla Bajić":
                team_name = "Carla"
                students = ["Carla Bajić"]
            elif header == "DDA - Domina Marić Banje,Domagoj Čaleta,Antonio Grubišić Ćabo":
                team_name = "DDA"
                students = ["Domina Marić Banje", "Domagoj Čaleta", "Antonio Grubišić Ćabo"]
            elif header == "1950 - Stipe Barišić & Luka Ćirković":
                team_name = "PC Builder"
                students = ["Stipe Barišić", "Luka Ćirković"]
            else:
                # Split by & or , for multiple students
                if '&' in students_part:
                    students = [s.strip() for s in students_part.split('&')]
                elif ',' in students_part:
                    students = [s.strip() for s in students_part.split(',')]
                else:
                    students = [students_part]
        else:
            team_name = header
            students = [header]

        # Create project object
        project = Project(
            team_name=team_name,
            students=students,
            project_title=project_title,
            folder=folder,
            status=status if status else "In Progress",
            description=description
        )

        projects.append(project)

    if not projects:
        raise ValueError("No valid projects found in the project list file")

    return projects


def assign_projects_to_dates(projects: List[Project], seed: Optional[int] = None) -> Dict[str, List[Project]]:
    """
    Assign projects to presentation dates with controlled distribution.

    Args:
        projects: List of projects to assign
        seed: Optional random seed for reproducibility

    Returns:
        Dictionary mapping dates to lists of assigned projects

    Raises:
        ValueError: If the number of projects doesn't match expected count
    """
    if seed is not None:
        random.seed(seed)

    # Validate project count
    expected_count = 22
    if len(projects) != expected_count:
        raise ValueError(f"Expected {expected_count} projects, found {len(projects)}")

    # Shuffle projects for random assignment
    shuffled_projects = projects.copy()
    random.shuffle(shuffled_projects)

    # Define distribution
    distribution = {
        'January 26, 2026': 8,
        'February 2, 2026': 7,
        'February 9, 2026': 7
    }

    # Assign projects
    assignments = {}
    start_idx = 0

    for date, count in distribution.items():
        end_idx = start_idx + count
        assignments[date] = shuffled_projects[start_idx:end_idx]
        start_idx = end_idx

    return assignments


def generate_schedule_markdown(assignments: Dict[str, List[Project]],
                            seed: Optional[int] = None) -> str:
    """
    Generate markdown content for the presentation schedule.

    Args:
        assignments: Dictionary of date to project assignments
        seed: Random seed used for assignment (if any)

    Returns:
        Formatted markdown string
    """
    lines = []
    lines.append("# Student Project Presentation Schedule")
    lines.append("")
    lines.append(f"*Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*")
    if seed is not None:
        lines.append(f"*Random seed: {seed}*")
    lines.append("")

    # Calculate statistics
    all_projects = []
    for projects in assignments.values():
        all_projects.extend(projects)

    unique_students = set()
    for project in all_projects:
        unique_students.update(project.students)

    # Generate schedule for each date
    for date, projects in assignments.items():
        lines.append(f"## {date} ({len(projects)} projects)")
        lines.append("")

        for i, project in enumerate(projects, 1):
            lines.append(f"### {i}. {project.project_title}")
            lines.append(f"* **Team:** {project.team_name} - {' & '.join(project.students)}")
            lines.append(f"* **Folder:** `{project.folder}`")
            lines.append(f"* **Status:** {project.status}")
            lines.append(f"* **Description:** {project.description}")
            lines.append("")

        lines.append("---")
        lines.append("")

    # Add statistics
    lines.append("## Statistics")
    lines.append("")
    lines.append(f"- Total projects: {len(all_projects)}")
    lines.append(f"- Projects per date: Jan 26 (8), Feb 2 (7), Feb 9 (7)")
    lines.append(f"- Unique students: {len(unique_students)}")
    lines.append(f"- Average team size: {len(all_projects) / len(unique_students):.1f}")
    lines.append("")

    return '\n'.join(lines)


def create_backup_file(content: str, output_dir: str) -> str:
    """
    Create a timestamped backup file for the schedule.

    Args:
        content: Markdown content to save
        output_dir: Directory to save the file

    Returns:
        Path to the created file

    Raises:
        OSError: If unable to create the output directory
    """
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)

    # Generate timestamped filename
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"presentation_schedule_{timestamp}.md"
    filepath = os.path.join(output_dir, filename)

    # Write content to file
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    return filepath


def main():
    """Main function to run the presentation scheduler."""
    parser = argparse.ArgumentParser(
        description='Assign student projects to presentation dates',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python assign_presentations.py --preview
  python assign_presentations.py --seed 42
  python assign_presentations.py --output-dir ../presentation-schedules
        """
    )

    parser.add_argument(
        '--preview',
        action='store_true',
        help='Preview assignment without saving to file'
    )

    parser.add_argument(
        '--seed',
        type=int,
        help='Random seed for reproducible assignments'
    )

    parser.add_argument(
        '--output-dir',
        default='schedules',
        help='Directory to save schedule files (default: schedules)'
    )

    parser.add_argument(
        '--project-list',
        default='../projects/PROJECT_LIST.md',
        help='Path to project list file (default: ../projects/PROJECT_LIST.md)'
    )

    args = parser.parse_args()

    try:
        # Parse projects from file
        print("📖 Reading project list...")
        projects = parse_project_list(args.project_list)
        print(f"✅ Found {len(projects)} projects")

        # Assign projects to dates
        print("🎲 Assigning projects to presentation dates...")
        assignments = assign_projects_to_dates(projects, args.seed)
        print("✅ Projects assigned successfully")

        # Generate schedule content
        print("📝 Generating schedule...")
        content = generate_schedule_markdown(assignments, args.seed)

        # Output or save the schedule
        if args.preview:
            print("\n" + "="*60)
            print("PREVIEW - Schedule not saved")
            print("="*60 + "\n")
            print(content)
        else:
            filepath = create_backup_file(content, args.output_dir)
            print(f"✅ Schedule saved to: {filepath}")
            print(f"\nYou can preview the file with: cat {filepath}")

        # Print summary
        print("\n📊 Assignment Summary:")
        for date, projects in assignments.items():
            print(f"  {date}: {len(projects)} projects")

    except FileNotFoundError as e:
        print(f"❌ Error: {e}")
        exit(1)
    except ValueError as e:
        print(f"❌ Error: {e}")
        exit(1)
    except OSError as e:
        print(f"❌ Error: Unable to save file: {e}")
        exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        exit(1)


if __name__ == "__main__":
    main()