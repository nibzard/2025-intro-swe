"""Grading calculation utilities for the SWE course."""

import math
from typing import Dict, List, Tuple, Optional
from datetime import datetime


# Grading weights as defined in PLAN.md
GRADING_WEIGHTS = {
    'seminar': 0.10,          # 10%
    'code_quality': 0.30,     # 30%
    'innovation': 0.10,       # 10%
    'documentation': 0.10,    # 10%
    'attendance': 0.10,       # 10%
    'git_activity': 0.10,     # 10%
    'peer_review': 0.10,      # 10%
    'git_quiz': 0.10          # 10%
}


def calculate_final_grade(grades: Dict[str, float]) -> Tuple[float, str]:
    """
    Calculate the final numeric and letter grade based on component grades.

    Args:
        grades: Dictionary containing grades for each component

    Returns:
        Tuple of (final_numeric_grade, final_letter_grade)
    """
    # Calculate weighted average
    final_grade = 0.0
    for component, weight in GRADING_WEIGHTS.items():
        grade = grades.get(component, 0)
        final_grade += grade * weight

    # Convert to letter grade
    letter_grade = numeric_to_letter(final_grade)

    return round(final_grade, 2), letter_grade


def numeric_to_letter(numeric_grade: float) -> str:
    """
    Convert numeric grade to letter grade.

    Args:
        numeric_grade: Numeric grade (0-100)

    Returns:
        Letter grade (A, B, C, D, F)
    """
    if numeric_grade >= 90:
        return 'A'
    elif numeric_grade >= 80:
        return 'B'
    elif numeric_grade >= 70:
        return 'C'
    elif numeric_grade >= 60:
        return 'D'
    else:
        return 'F'


def calculate_git_activity_score(
    commit_count: int,
    activity_span_days: int,
    consistency_score: float,
    collaboration_score: float,
    message_quality: float
) -> float:
    """
    Calculate Git activity score based on multiple factors.

    Args:
        commit_count: Total number of commits
        activity_span_days: Number of days between first and last commit
        consistency_score: Score for consistent commit patterns (0-100)
        collaboration_score: Score for team collaboration (0-100)
        message_quality: Score for commit message quality (0-100)

    Returns:
        Git activity score (0-10)
    """
    # Base score from commit count (expected minimum 20 commits)
    commit_score = min(100, (commit_count / 20) * 100)

    # Activity span score (prefer consistent work over time)
    if activity_span_days > 0:
        span_score = min(100, (activity_span_days / 30) * 100)  # Full score for 30+ days
    else:
        span_score = 0

    # Weighted average of all factors
    overall_score = (
        commit_score * 0.30 +
        consistency_score * 0.25 +
        collaboration_score * 0.25 +
        message_quality * 0.10 +
        span_score * 0.10
    )

    # Convert to 0-10 scale
    return round(min(10, overall_score / 10), 1)


def calculate_peer_review_score(
    reviews: List[Dict[str, float]],
    outlier_threshold: float = 2.0
) -> Tuple[float, Dict[str, float]]:
    """
    Calculate average peer review score with outlier detection.

    Args:
        reviews: List of review dictionaries with scores
        outlier_threshold: Standard deviation threshold for outlier detection

    Returns:
        Tuple of (average_score, component_averages)
    """
    if not reviews:
        return 0.0, {}

    # Extract component scores
    components = ['code_quality', 'ui_ux', 'innovation', 'documentation', 'overall']
    component_scores = {comp: [] for comp in components}

    for review in reviews:
        for comp in components:
            if comp in review:
                component_scores[comp].append(review[comp])

    # Calculate averages and detect outliers
    final_scores = {}
    for comp, scores in component_scores.items():
        if not scores:
            final_scores[comp] = 0.0
            continue

        # Remove outliers if enough reviews
        if len(scores) >= 3:
            mean = sum(scores) / len(scores)
            variance = sum((x - mean) ** 2 for x in scores) / len(scores)
            std_dev = math.sqrt(variance)

            filtered_scores = [
                s for s in scores
                if abs(s - mean) <= outlier_threshold * std_dev
            ]
            if filtered_scores:
                scores = filtered_scores

        final_scores[comp] = round(sum(scores) / len(scores), 1)

    # Calculate overall average
    if len(components) > 0:
        overall_average = sum(final_scores.values()) / len(components)
    else:
        overall_average = 0.0

    return round(overall_average, 1), final_scores


def calculate_project_score(
    code_quality: float,
    innovation: float,
    documentation: float,
    functionality_bonus: float = 0
) -> float:
    """
    Calculate overall project score from sub-components.

    Args:
        code_quality: Code quality score (0-30)
        innovation: Innovation score (0-10)
        documentation: Documentation score (0-10)
        functionality_bonus: Optional bonus for exceptional functionality

    Returns:
        Project score (0-50)
    """
    total = code_quality + innovation + documentation + functionality_bonus
    return min(50, total)


def validate_grades(grades: Dict[str, float]) -> List[str]:
    """
    Validate a dictionary of grades and return any issues found.

    Args:
        grades: Dictionary containing grades for components

    Returns:
        List of validation error messages
    """
    errors = []

    # Check required components
    required_components = set(GRADING_WEIGHTS.keys())
    missing_components = required_components - set(grades.keys())
    if missing_components:
        errors.append(f"Missing grade components: {', '.join(missing_components)}")

    # Check grade ranges
    for component, grade in grades.items():
        if component in GRADING_WEIGHTS:
            if not isinstance(grade, (int, float)):
                errors.append(f"Grade for {component} must be numeric")
            elif grade < 0 or grade > get_max_score(component):
                errors.append(
                    f"Grade for {component} ({grade}) is outside valid range (0-{get_max_score(component)})"
                )

    return errors


def get_max_score(component: str) -> float:
    """
    Get the maximum possible score for a grading component.

    Args:
        component: Component name

    Returns:
        Maximum score for the component
    """
    max_scores = {
        'seminar': 10,
        'code_quality': 30,
        'innovation': 10,
        'documentation': 10,
        'attendance': 10,
        'git_activity': 10,
        'peer_review': 10,
        'git_quiz': 10
    }
    return max_scores.get(component, 10)


def normalize_score(score: float, current_max: float, target_max: float) -> float:
    """
    Normalize a score from one scale to another.

    Args:
        score: The score to normalize
        current_max: Current maximum value
        target_max: Target maximum value

    Returns:
        Normalized score
    """
    if current_max == 0:
        return 0
    return (score / current_max) * target_max


def calculate_class_statistics(grades_list: List[Dict[str, float]]) -> Dict[str, float]:
    """
    Calculate class-wide statistics from a list of student grades.

    Args:
        grades_list: List of grade dictionaries for all students

    Returns:
        Dictionary with class statistics
    """
    if not grades_list:
        return {}

    # Extract final grades
    final_grades = []
    for grades in grades_list:
        final_grade, _ = calculate_final_grade(grades)
        final_grades.append(final_grade)

    # Calculate statistics
    n = len(final_grades)
    mean = sum(final_grades) / n
    variance = sum((x - mean) ** 2 for x in final_grades) / n
    std_dev = math.sqrt(variance)

    # Grade distribution
    grade_counts = {'A': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0}
    for grades in grades_list:
        _, letter = calculate_final_grade(grades)
        grade_counts[letter] += 1

    return {
        'mean': round(mean, 2),
        'median': round(sorted(final_grades)[n // 2], 2),
        'std_dev': round(std_dev, 2),
        'min': round(min(final_grades), 2),
        'max': round(max(final_grades), 2),
        'grade_distribution': grade_counts,
        'pass_rate': round(sum(grade_counts[g] for g in ['A', 'B', 'C', 'D']) / n * 100, 1)
    }