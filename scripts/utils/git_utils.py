"""Git-related utility functions for the grading system."""

import subprocess
import json
import os
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
import re


def run_git_command(repo_path: str, command: List[str]) -> Tuple[bool, str]:
    """
    Run a git command in the specified repository.

    Args:
        repo_path: Path to the git repository
        command: Git command to run (list of strings)

    Returns:
        Tuple of (success: bool, output: str)
    """
    try:
        result = subprocess.run(
            ['git'] + command,
            cwd=repo_path,
            capture_output=True,
            text=True,
            timeout=30
        )
        return result.returncode == 0, result.stdout
    except (subprocess.TimeoutExpired, subprocess.CalledProcessError) as e:
        return False, str(e)


def get_commit_history(repo_path: str, since_date: Optional[str] = None) -> List[Dict]:
    """
    Get commit history from a git repository.

    Args:
        repo_path: Path to the git repository
        since_date: Optional start date (ISO format)

    Returns:
        List of commit dictionaries
    """
    command = [
        'log',
        '--pretty=format:%H|%an|%ae|%ad|%s',
        '--date=iso',
        '--no-merges'
    ]

    if since_date:
        command.extend(['--since', since_date])

    success, output = run_git_command(repo_path, command)
    if not success:
        return []

    commits = []
    for line in output.strip().split('\n'):
        if line:
            parts = line.split('|', 4)
            if len(parts) == 5:
                commits.append({
                    'hash': parts[0],
                    'author': parts[1],
                    'email': parts[2],
                    'date': datetime.fromisoformat(parts[3]),
                    'message': parts[4]
                })

    return commits


def get_branch_info(repo_path: str) -> Dict[str, int]:
    """
    Get information about branches in a repository.

    Args:
        repo_path: Path to the git repository

    Returns:
        Dictionary with branch statistics
    """
    success, output = run_git_command(repo_path, ['branch', '-a'])
    if not success:
        return {}

    branches = []
    for line in output.strip().split('\n'):
        branch = line.strip().replace('* ', '').replace('remotes/origin/', '')
        if branch and not branch.startswith('HEAD ->'):
            branches.append(branch)

    # Get branch creation dates
    branch_dates = {}
    for branch in set(branches):
        success, output = run_git_command(
            repo_path,
            ['log', '--format=%ad', '-1', branch, '--date=iso']
        )
        if success and output.strip():
            branch_dates[branch] = output.strip()

    return {
        'total_branches': len(set(branches)),
        'local_branches': len([b for b in branches if '/' not in b]),
        'remote_branches': len(set(branches)) - len([b for b in branches if '/' not in b]),
        'branches': branch_dates
    }


def get_file_changes(repo_path: str, since_date: Optional[str] = None) -> Dict[str, int]:
    """
    Get statistics about file changes.

    Args:
        repo_path: Path to the git repository
        since_date: Optional start date (ISO format)

    Returns:
        Dictionary with file change statistics
    """
    command = ['log', '--name-only', '--pretty=format:', '--no-merges']
    if since_date:
        command.extend(['--since', since_date])

    success, output = run_git_command(repo_path, command)
    if not success:
        return {}

    files = []
    for line in output.strip().split('\n'):
        if line.strip() and not line.startswith(' '):
            files.append(line.strip())

    # Count file types
    file_types = {}
    for file_path in files:
        ext = os.path.splitext(file_path)[1].lower()
        if ext:
            file_types[ext] = file_types.get(ext, 0) + 1

    return {
        'total_files_changed': len(set(files)),
        'total_changes': len(files),
        'file_types': file_types,
        'unique_files': list(set(files))
    }


def analyze_commit_message_quality(commits: List[Dict]) -> Dict[str, float]:
    """
    Analyze the quality of commit messages.

    Args:
        commits: List of commit dictionaries

    Returns:
        Dictionary with quality metrics
    """
    if not commits:
        return {'avg_length': 0, 'quality_score': 0, 'descriptive_ratio': 0}

    total_length = 0
    descriptive_count = 0
    has_issue_reference = 0
    has_conventional_format = 0

    conventional_pattern = re.compile(r'^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?: .+')
    issue_pattern = re.compile(r'#\d+|close[sd]?|fix|resolve')

    for commit in commits:
        message = commit['message'].strip()
        total_length += len(message)

        # Check if message is descriptive (more than just "fix" or "update")
        if len(message) > 10 and ' ' in message:
            descriptive_count += 1

        # Check for issue references
        if issue_pattern.search(message, re.IGNORECASE):
            has_issue_reference += 1

        # Check for conventional commit format
        if conventional_pattern.match(message):
            has_conventional_format += 1

    total_commits = len(commits)

    return {
        'avg_length': total_length / total_commits,
        'quality_score': min(100, (
            (descriptive_count / total_commits) * 40 +
            (has_issue_reference / total_commits) * 30 +
            (has_conventional_format / total_commits) * 30
        )),
        'descriptive_ratio': descriptive_count / total_commits,
        'issue_reference_ratio': has_issue_reference / total_commits,
        'conventional_ratio': has_conventional_format / total_commits
    }


def calculate_collaboration_score(commits: List[Dict], team_size: int = 1) -> Dict[str, float]:
    """
    Calculate collaboration metrics for a repository.

    Args:
        commits: List of commit dictionaries
        team_size: Number of team members

    Returns:
        Dictionary with collaboration metrics
    """
    if not commits:
        return {'author_diversity': 0, 'commit_distribution': 0, 'collaboration_score': 0}

    # Count commits per author
    author_commits = {}
    for commit in commits:
        author = commit['author']
        author_commits[author] = author_commits.get(author, 0) + 1

    total_commits = len(commits)
    unique_authors = len(author_commits)

    # Calculate author diversity (how evenly distributed commits are)
    if unique_authors > 1:
        ideal_commits_per_author = total_commits / unique_authors
        variance = sum((count - ideal_commits_per_author) ** 2
                      for count in author_commits.values()) / unique_authors
        author_diversity = max(0, 1 - (variance / (ideal_commits_per_author ** 2)))
    else:
        author_diversity = 0.2 if team_size == 1 else 0  # Solo projects get some credit

    # Calculate team participation ratio
    participation_ratio = unique_authors / max(team_size, 1)

    # Overall collaboration score
    collaboration_score = (author_diversity * 0.6 + participation_ratio * 0.4)

    return {
        'author_diversity': author_diversity,
        'participation_ratio': participation_ratio,
        'commit_distribution': author_commits,
        'collaboration_score': min(100, collaboration_score * 100)
    }


def detect_commit_patterns(commits: List[Dict]) -> Dict[str, any]:
    """
    Detect patterns in commit activity.

    Args:
        commits: List of commit dictionaries

    Returns:
        Dictionary with detected patterns
    """
    if not commits:
        return {'is_last_minute': False, 'is_consistent': False, 'activity_pattern': 'none'}

    # Group commits by day
    commits_by_day = {}
    for commit in commits:
        day = commit['date'].date()
        commits_by_day[day] = commits_by_day.get(day, 0) + 1

    # Sort dates
    sorted_dates = sorted(commits_by_day.keys())

    if len(sorted_dates) < 2:
        return {'is_last_minute': False, 'is_consistent': False, 'activity_pattern': 'single_day'}

    # Check if most commits are in the last few days
    total_commits = len(commits)
    last_5_days = sum(commits_by_day.get(sorted_dates[-i], 0)
                     for i in range(min(5, len(sorted_dates))))

    is_last_minute = last_5_days > (total_commits * 0.7)

    # Check consistency (standard deviation of commits per active day)
    active_days = [commits_by_day[d] for d in sorted_dates if commits_by_day[d] > 0]
    if len(active_days) > 1:
        avg_commits = sum(active_days) / len(active_days)
        variance = sum((x - avg_commits) ** 2 for x in active_days) / len(active_days)
        std_dev = variance ** 0.5
        is_consistent = std_dev < (avg_commits * 0.8)
    else:
        is_consistent = False

    # Determine activity pattern
    if is_last_minute:
        activity_pattern = 'last_minute'
    elif is_consistent:
        activity_pattern = 'consistent'
    elif len(sorted_dates) > 10:
        activity_pattern = 'regular'
    else:
        activity_pattern = 'sporadic'

    return {
        'is_last_minute': is_last_minute,
        'is_consistent': is_consistent,
        'activity_pattern': activity_pattern,
        'active_days': len(sorted_dates),
        'total_days_span': (sorted_dates[-1] - sorted_dates[0]).days + 1,
        'commits_by_day': commits_by_day
    }