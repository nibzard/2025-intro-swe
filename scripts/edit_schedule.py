#!/usr/bin/env python3
"""
Schedule Editor - Move teams between presentation dates
Reads an existing schedule markdown file and moves a team to a different date.
"""

import os
import re
import argparse
from datetime import datetime
from dataclasses import dataclass
from typing import Dict, List, Tuple, Optional


@dataclass
class ProjectBlock:
    """Represents a single project entry in the schedule."""
    number: int
    title: str
    content: str  # All the bullet points and description


def parse_schedule(file_path: str) -> Tuple[Dict[str, List[ProjectBlock]], str, List[str]]:
    """
    Parse a schedule markdown file into a structured format.

    Args:
        file_path: Path to the schedule markdown file

    Returns:
        Tuple of (date_to_projects dict, header_lines list, footer_lines list)

    Raises:
        FileNotFoundError: If file doesn't exist
        ValueError: If file format is invalid
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Schedule file not found: {file_path}")

    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Find all date sections
    date_pattern = re.compile(r'^## (January \d{1,2}, 2026|February \d{1,2}, 2026)')

    # Split into sections
    header_lines = []
    footer_lines = []
    date_sections = {}  # date -> list of lines

    current_section = 'header'
    current_date = None
    current_lines = []

    for line in lines:
        date_match = date_pattern.match(line)

        if date_match:
            # Save previous section (trim trailing whitespace/blank lines)
            if current_date:
                # Trim trailing blank lines and separators
                while current_lines and current_lines[-1].strip() in ('', '---'):
                    current_lines.pop()
                date_sections[current_date] = current_lines

            current_date = date_match.group(1)
            current_lines = []
            current_section = 'dates'
        elif current_section == 'header':
            header_lines.append(line)
        elif line.strip() == '## Statistics':
            # Reached the footer
            if current_date:
                # Trim trailing blank lines and separators
                while current_lines and current_lines[-1].strip() in ('', '---'):
                    current_lines.pop()
                date_sections[current_date] = current_lines
            # Add this line and everything after to footer
            footer_lines.append(line)
            idx = lines.index(line) + 1
            while idx < len(lines):
                footer_lines.append(lines[idx])
                idx += 1
            break
        elif current_section == 'dates':
            current_lines.append(line)

    return date_sections, header_lines, footer_lines


def extract_project_blocks(project_lines: List[str]) -> List[ProjectBlock]:
    """
    Extract individual project blocks from a date section's lines.

    Args:
        project_lines: Lines from a date section

    Returns:
        List of ProjectBlock objects
    """
    projects = []
    project_pattern = re.compile(r'^### (\d+)\.\s*(.+)$')

    current_number = None
    current_title = None
    current_content = []

    for line in project_lines:
        match = project_pattern.match(line)
        if match:
            # Save previous project
            if current_number is not None:
                projects.append(ProjectBlock(
                    number=current_number,
                    title=current_title,
                    content=''.join(current_content)
                ))

            current_number = int(match.group(1))
            current_title = match.group(2)
            current_content = []
        else:
            current_content.append(line)

    # Don't forget the last project
    if current_number is not None:
        projects.append(ProjectBlock(
            number=current_number,
            title=current_title,
            content=''.join(current_content)
        ))

    return projects


def build_project_blocks(projects: List[ProjectBlock]) -> List[str]:
    """
    Convert ProjectBlock objects back to markdown lines.

    Args:
        projects: List of ProjectBlock objects

    Returns:
        List of markdown lines
    """
    lines = []
    for i, project in enumerate(projects, 1):
        lines.append(f"### {i}. {project.title}\n")
        lines.append(project.content)
        # Ensure blank line after each project
        if not project.content.endswith('\n\n'):
            lines.append('\n')
    return lines


def move_team(projects_by_date: Dict[str, List[ProjectBlock]],
             team_title: str,
             target_date: str) -> Dict[str, List[ProjectBlock]]:
    """
    Move a team from its current date to a target date.

    Args:
        projects_by_date: Dictionary mapping dates to project lists
        team_title: Title of the team/project to move
        target_date: Date to move the team to

    Returns:
        Updated projects_by_date dictionary

    Raises:
        ValueError: If team not found or target date invalid
    """
    valid_dates = set(projects_by_date.keys())
    if target_date not in valid_dates:
        raise ValueError(f"Invalid target date '{target_date}'. Valid dates: {valid_dates}")

    # Find the team
    source_date = None
    project_to_move = None

    for date, project_lines in projects_by_date.items():
        projects = extract_project_blocks(project_lines)
        for project in projects:
            if project.title == team_title:
                source_date = date
                project_to_move = project
                break
        if project_to_move:
            break

    if not project_to_move:
        raise ValueError(f"Team '{team_title}' not found in schedule")

    if source_date == target_date:
        raise ValueError(f"Team '{team_title}' is already on {target_date}")

    # Remove from source date
    source_projects = extract_project_blocks(projects_by_date[source_date])
    source_projects = [p for p in source_projects if p.title != team_title]
    projects_by_date[source_date] = build_project_blocks(source_projects)

    # Add to target date
    target_projects = extract_project_blocks(projects_by_date[target_date])
    target_projects.append(project_to_move)
    projects_by_date[target_date] = build_project_blocks(target_projects)

    return projects_by_date


def generate_output(projects_by_date: Dict[str, List[ProjectBlock]],
                   header_lines: List[str],
                   footer_lines: List[str]) -> str:
    """
    Generate the complete output markdown.

    Args:
        projects_by_date: Dictionary mapping dates to project lists
        header_lines: Header lines from original file
        footer_lines: Footer lines from original file

    Returns:
        Complete markdown content
    """
    lines = []

    # Add header (update timestamp)
    for line in header_lines:
        if line.startswith('*Generated:'):
            lines.append(f"*Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*\n")
        elif '*Random seed:' in line:
            # Remove seed line since this is an edit
            lines.append('*Edited: Team moved to new date*\n')
        else:
            lines.append(line)

    # Define date order
    date_order = ['January 26, 2026', 'February 2, 2026', 'February 9, 2026']

    # Add each date section in order
    for date in date_order:
        if date not in projects_by_date:
            continue
        project_lines = projects_by_date[date]
        projects = extract_project_blocks(project_lines)
        lines.append(f"## {date} ({len(projects)} projects)\n")
        lines.append('\n')
        lines.extend(build_project_blocks(projects))
        lines.append('\n')
        lines.append('---\n')
        lines.append('\n')

    # Add footer (update statistics)
    for line in footer_lines:
        if 'Projects per date:' in line:
            # Update the distribution line with cleaner format
            counts = []
            for date in date_order:
                if date in projects_by_date:
                    projects = extract_project_blocks(projects_by_date[date])
                    # Extract just "Jan 26" or "Feb 2" from the full date
                    parts = date.split()
                    short_date = f"{parts[0][:3]} {parts[1].rstrip(',')}"
                    counts.append(f"{short_date} ({len(projects)})")
            lines.append(f"- Projects per date: {', '.join(counts)}\n")
        else:
            lines.append(line)

    return ''.join(lines)


def main():
    """Main function to run the schedule editor."""
    parser = argparse.ArgumentParser(
        description='Edit presentation schedule by moving teams between dates',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python edit_schedule.py --input schedule.md --move-team "MateSfera" --to-date "February 2, 2026"
  python edit_schedule.py --input schedule.md --move-team "MateSfera" --to-date "February 2, 2026" --preview
        """
    )

    parser.add_argument(
        '--input',
        required=True,
        help='Path to existing schedule file'
    )

    parser.add_argument(
        '--move-team',
        required=True,
        help='Title of the team/project to move (e.g., "MateSfera")'
    )

    parser.add_argument(
        '--to-date',
        required=True,
        help='Target date (e.g., "February 2, 2026")'
    )

    parser.add_argument(
        '--output-dir',
        help='Directory for output file (default: same as input file)'
    )

    parser.add_argument(
        '--preview',
        action='store_true',
        help='Preview output without saving to file'
    )

    args = parser.parse_args()

    try:
        print(f"📖 Reading schedule from {args.input}...")
        projects_by_date, header_lines, footer_lines = parse_schedule(args.input)

        print(f"🔄 Moving '{args.move_team}' to {args.to_date}...")
        projects_by_date = move_team(projects_by_date, args.move_team, args.to_date)

        print("📝 Generating new schedule...")
        output = generate_output(projects_by_date, header_lines, footer_lines)

        # Print summary
        print("\n📊 Updated Schedule Summary:")
        for date, project_lines in projects_by_date.items():
            projects = extract_project_blocks(project_lines)
            print(f"  {date}: {len(projects)} projects")
            for p in projects:
                marker = " 📌" if p.title == args.move_team else ""
                print(f"    {p.number}. {p.title}{marker}")

        if args.preview:
            print("\n" + "="*60)
            print("PREVIEW - Changes not saved")
            print("="*60 + "\n")
            print(output)
        else:
            # Determine output directory
            if args.output_dir:
                output_dir = args.output_dir
            else:
                output_dir = os.path.dirname(args.input)

            # Generate output filename
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            input_basename = os.path.basename(args.input)
            # Remove old timestamp if present
            base_name = re.sub(r'_\d{8}_\d{6}\.md$', '_edited.md', input_basename)
            output_filename = f"presentation_schedule_edited_{timestamp}.md"
            output_path = os.path.join(output_dir, output_filename)

            # Write output
            os.makedirs(output_dir, exist_ok=True)
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(output)

            print(f"\n✅ Schedule saved to: {output_path}")

    except FileNotFoundError as e:
        print(f"❌ Error: {e}")
        exit(1)
    except ValueError as e:
        print(f"❌ Error: {e}")
        exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        exit(1)


if __name__ == "__main__":
    main()
