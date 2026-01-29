"""Report generation utilities for the grading system."""

import json
import csv
import os
from datetime import datetime
from typing import Dict, List, Any, Optional
import matplotlib.pyplot as plt
import pandas as pd


def save_json_report(data: Dict[str, Any], filepath: str) -> None:
    """
    Save data as a JSON report.

    Args:
        data: Dictionary containing report data
        filepath: Path to save the JSON file
    """
    os.makedirs(os.path.dirname(filepath), exist_ok=True)

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False, default=str)


def save_csv_report(data: List[Dict[str, Any]], filepath: str) -> None:
    """
    Save data as a CSV report.

    Args:
        data: List of dictionaries containing report data
        filepath: Path to save the CSV file
    """
    os.makedirs(os.path.dirname(filepath), exist_ok=True)

    if not data:
        return

    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)


def generate_student_grade_report(
    student_data: Dict[str, Any],
    output_dir: str = 'data/reports'
) -> str:
    """
    Generate a detailed grade report for a single student.

    Args:
        student_data: Dictionary containing all student data and grades
        output_dir: Directory to save the report

    Returns:
        Path to the generated report file
    """
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"grade_report_{student_data['student_id']}_{timestamp}.json"
    filepath = os.path.join(output_dir, filename)

    report = {
        'student_info': {
            'student_id': student_data.get('student_id'),
            'full_name': student_data.get('full_name'),
            'github_username': student_data.get('github_username'),
            'email': student_data.get('email'),
            'project_team': student_data.get('project_team'),
            'project_title': student_data.get('project_title'),
            'project_role': student_data.get('project_role')
        },
        'grades': {
            'seminar': student_data.get('seminar_grade', 0),
            'project': {
                'code_quality': student_data.get('code_quality_grade', 0),
                'innovation': student_data.get('innovation_grade', 0),
                'documentation': student_data.get('documentation_grade', 0)
            },
            'attendance': student_data.get('attendance_grade', 0),
            'git_activity': {
                'grade': student_data.get('git_activity_grade', 0),
                'commits': student_data.get('git_commits', 0)
            },
            'peer_review': student_data.get('peer_review_grade', 0),
            'git_quiz': student_data.get('git_quiz_grade', 0)
        },
        'final_grade': {
            'numeric': student_data.get('final_grade', 0),
            'letter': student_data.get('final_grade_letter', 'F'),
            'status': student_data.get('status', 'Unknown')
        },
        'generated_at': datetime.now().isoformat()
    }

    save_json_report(report, filepath)
    return filepath


def generate_git_activity_report(
    repo_analysis: Dict[str, Any],
    student_info: Dict[str, str],
    output_dir: str = 'data/reports'
) -> str:
    """
    Generate a Git activity analysis report.

    Args:
        repo_analysis: Dictionary containing Git repository analysis
        student_info: Dictionary containing student information
        output_dir: Directory to save the report

    Returns:
        Path to the generated report file
    """
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"git_activity_{student_info['student_id']}_{timestamp}.json"
    filepath = os.path.join(output_dir, filename)

    report = {
        'student_info': student_info,
        'analysis': repo_analysis,
        'generated_at': datetime.now().isoformat()
    }

    save_json_report(report, filepath)
    return filepath


def create_commit_heatmap(
    commits_by_day: Dict[str, int],
    output_dir: str = 'data/reports'
) -> str:
    """
    Create a visualization of commit activity over time.

    Args:
        commits_by_day: Dictionary mapping dates to commit counts
        output_dir: Directory to save the visualization

    Returns:
        Path to the generated image file
    """
    if not commits_by_day:
        return ""

    # Convert to pandas DataFrame for easier plotting
    df = pd.DataFrame(list(commits_by_day.items()), columns=['date', 'commits'])
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date')

    # Create the plot
    plt.figure(figsize=(12, 6))
    plt.bar(df['date'], df['commits'], color='#2E86AB', alpha=0.7)
    plt.title('Commit Activity Over Time', fontsize=16)
    plt.xlabel('Date', fontsize=12)
    plt.ylabel('Number of Commits', fontsize=12)
    plt.xticks(rotation=45)
    plt.grid(True, alpha=0.3)
    plt.tight_layout()

    # Save the plot
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"commit_heatmap_{timestamp}.png"
    filepath = os.path.join(output_dir, filename)

    plt.savefig(filepath, dpi=150, bbox_inches='tight')
    plt.close()

    return filepath


def generate_class_summary_report(
    class_grades: List[Dict[str, Any]],
    statistics: Dict[str, Any],
    output_dir: str = 'data/reports'
) -> str:
    """
    Generate a class-wide summary report.

    Args:
        class_grades: List of all student grade data
        statistics: Dictionary containing class statistics
        output_dir: Directory to save the report

    Returns:
        Path to the generated report file
    """
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"class_summary_{timestamp}.json"
    filepath = os.path.join(output_dir, filename)

    # Count project teams
    teams = {}
    for student in class_grades:
        team = student.get('project_team', 'No Team')
        teams[team] = teams.get(team, 0) + 1

    # Component averages
    components = [
        'seminar_grade', 'code_quality_grade', 'innovation_grade',
        'documentation_grade', 'attendance_grade', 'git_activity_grade',
        'peer_review_grade', 'git_quiz_grade'
    ]

    component_stats = {}
    for comp in components:
        values = [s.get(comp, 0) for s in class_grades if s.get(comp) is not None]
        if values:
            component_stats[comp] = {
                'mean': round(sum(values) / len(values), 2),
                'min': min(values),
                'max': max(values)
            }

    report = {
        'summary': {
            'total_students': len(class_grades),
            'project_teams': teams,
            'generation_date': datetime.now().isoformat()
        },
        'statistics': statistics,
        'component_averages': component_stats,
        'grade_distribution': statistics.get('grade_distribution', {}),
        'top_performers': sorted(
            [(s.get('full_name', ''), s.get('final_grade', 0)) for s in class_grades],
            key=lambda x: x[1], reverse=True
        )[:5]
    }

    save_json_report(report, filepath)
    return filepath


def export_grades_to_csv(
    grades_data: List[Dict[str, Any]],
    filepath: str
) -> None:
    """
    Export grades data to CSV format compatible with the grading template.

    Args:
        grades_data: List of student grade dictionaries
        filepath: Path to save the CSV file
    """
    # Define column order matching the template
    columns = [
        'student_id', 'full_name', 'github_username', 'email',
        'project_team', 'project_title', 'project_folder', 'project_role',
        'seminar_grade', 'code_quality_grade', 'innovation_grade',
        'documentation_grade', 'attendance_grade', 'git_activity_grade',
        'git_commits', 'peer_review_grade', 'git_quiz_grade',
        'final_grade', 'final_grade_letter', 'status'
    ]

    # Prepare data with all columns
    export_data = []
    for student in grades_data:
        row = {}
        for col in columns:
            row[col] = student.get(col, '')
        export_data.append(row)

    save_csv_report(export_data, filepath)


def create_grade_distribution_chart(
    grade_distribution: Dict[str, int],
    output_dir: str = 'data/reports'
) -> str:
    """
    Create a pie chart showing grade distribution.

    Args:
        grade_distribution: Dictionary with grade counts (A, B, C, D, F)
        output_dir: Directory to save the chart

    Returns:
        Path to the generated image file
    """
    grades = list(grade_distribution.keys())
    counts = list(grade_distribution.values())
    colors = ['#4CAF50', '#8BC34A', '#FFEB3B', '#FF9800', '#F44336']

    plt.figure(figsize=(10, 8))
    plt.pie(counts, labels=grades, colors=colors, autopct='%1.1f%%', startangle=90)
    plt.title('Class Grade Distribution', fontsize=16)
    plt.axis('equal')

    # Save the chart
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"grade_distribution_{timestamp}.png"
    filepath = os.path.join(output_dir, filename)

    plt.savefig(filepath, dpi=150, bbox_inches='tight')
    plt.close()

    return filepath


def generate_peer_review_summary(
    reviews: List[Dict[str, Any]],
    project_info: Dict[str, str],
    output_dir: str = 'data/reports'
) -> str:
    """
    Generate a summary of peer reviews for a project.

    Args:
        reviews: List of peer review dictionaries
        project_info: Dictionary containing project information
        output_dir: Directory to save the report

    Returns:
        Path to the generated report file
    """
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"peer_review_summary_{project_info.get('project_team', 'unknown')}_{timestamp}.json"
    filepath = os.path.join(output_dir, filename)

    # Calculate component averages
    components = ['code_quality', 'ui_ux', 'innovation', 'documentation', 'overall']
    component_averages = {}

    for comp in components:
        values = [r.get(comp, 0) for r in reviews if r.get(comp) is not None]
        if values:
            component_averages[comp] = round(sum(values) / len(values), 2)

    # Extract qualitative feedback
    feedback = []
    for review in reviews:
        if 'comments' in review and review['comments'].strip():
            feedback.append({
                'reviewer': review.get('reviewer', 'Anonymous'),
                'comments': review['comments']
            })

    report = {
        'project_info': project_info,
        'summary': {
            'total_reviews': len(reviews),
            'average_score': component_averages.get('overall', 0),
            'component_averages': component_averages
        },
        'individual_reviews': reviews,
        'qualitative_feedback': feedback,
        'generated_at': datetime.now().isoformat()
    }

    save_json_report(report, filepath)
    return filepath