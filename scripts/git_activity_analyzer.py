#!/usr/bin/env python3
"""
Git Activity Analyzer

This script analyzes Git repository activity to evaluate student work patterns,
commit quality, collaboration, and consistency over time.
"""

import argparse
import json
import os
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple

# Add utils to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'utils'))

from git_utils import (
    get_commit_history,
    get_branch_info,
    get_file_changes,
    analyze_commit_message_quality,
    calculate_collaboration_score,
    detect_commit_patterns,
    run_git_command
)
from grading_utils import calculate_git_activity_score
from report_utils import (
    generate_git_activity_report,
    create_commit_heatmap,
    save_json_report
)


class GitActivityAnalyzer:
    """Analyzes Git repository activity for grading purposes."""

    def __init__(self, repo_path: str, since_date: Optional[str] = None):
        """
        Initialize the analyzer.

        Args:
            repo_path: Path to the Git repository to analyze
            since_date: Optional start date for analysis (ISO format)
        """
        self.repo_path = repo_path
        self.since_date = since_date
        self.analysis_result = {}

    def analyze_repository(self, team_size: int = 1) -> Dict[str, any]:
        """
        Perform complete repository analysis.

        Args:
            team_size: Number of team members (for collaboration scoring)

        Returns:
            Dictionary containing all analysis results
        """
        # Verify it's a git repository
        if not self._is_git_repo():
            return {'error': 'Not a valid Git repository'}

        # Get commit history
        commits = get_commit_history(self.repo_path, self.since_date)
        if not commits:
            return {'error': 'No commits found', 'commits': []}

        # Perform various analyses
        branch_info = get_branch_info(self.repo_path)
        file_changes = get_file_changes(self.repo_path, self.since_date)
        message_quality = analyze_commit_message_quality(commits)
        collaboration = calculate_collaboration_score(commits, team_size)
        patterns = detect_commit_patterns(commits)

        # Calculate overall git activity score
        activity_span = patterns.get('total_days_span', 1)
        git_score = calculate_git_activity_score(
            commit_count=len(commits),
            activity_span_days=activity_span,
            consistency_score=100 if patterns.get('is_consistent') else 50,
            collaboration_score=collaboration.get('collaboration_score', 0),
            message_quality=message_quality.get('quality_score', 0)
        )

        # Compile results
        self.analysis_result = {
            'repository_path': self.repo_path,
            'analysis_date': datetime.now().isoformat(),
            'since_date': self.since_date,
            'summary': {
                'total_commits': len(commits),
                'git_activity_score': git_score,
                'team_size': team_size,
                'active_days': patterns.get('active_days', 0),
                'activity_span_days': patterns.get('total_days_span', 0)
            },
            'commits': {
                'total': len(commits),
                'first_commit': commits[0]['date'].isoformat() if commits else None,
                'last_commit': commits[-1]['date'].isoformat() if commits else None,
                'commit_frequency': self._calculate_commit_frequency(commits)
            },
            'branches': branch_info,
            'files': file_changes,
            'commit_patterns': patterns,
            'message_quality': message_quality,
            'collaboration': collaboration,
            'daily_activity': patterns.get('commits_by_day', {})
        }

        return self.analysis_result

    def _is_git_repo(self) -> bool:
        """Check if the path is a valid Git repository."""
        success, _ = run_git_command(self.repo_path, ['rev-parse', '--git-dir'])
        return success

    def _calculate_commit_frequency(self, commits: List[Dict]) -> Dict[str, float]:
        """Calculate commit frequency statistics."""
        if not commits:
            return {'commits_per_day': 0, 'commits_per_week': 0}

        first_date = commits[0]['date']
        last_date = commits[-1]['date']
        days = max(1, (last_date - first_date).days + 1)

        return {
            'commits_per_day': len(commits) / days,
            'commits_per_week': (len(commits) / days) * 7
        }

    def save_report(
        self,
        student_info: Dict[str, str],
        output_dir: str = 'data/reports',
        include_visualization: bool = True
    ) -> Tuple[str, Optional[str]]:
        """
        Save the analysis report.

        Args:
            student_info: Student information dictionary
            output_dir: Directory to save reports
            include_visualization: Whether to generate commit heatmap

        Returns:
            Tuple of (report_path, visualization_path)
        """
        # Generate JSON report
        report_path = generate_git_activity_report(
            self.analysis_result,
            student_info,
            output_dir
        )

        # Generate visualization if requested
        viz_path = None
        if include_visualization and 'daily_activity' in self.analysis_result:
            viz_path = create_commit_heatmap(
                self.analysis_result['daily_activity'],
                output_dir
            )

        return report_path, viz_path


def analyze_batch_repositories(
    repo_list: List[Dict[str, str]],
    base_repo_path: str = 'projects',
    output_dir: str = 'data/reports'
) -> List[Dict[str, any]]:
    """
    Analyze multiple repositories in batch.

    Args:
        repo_list: List of dictionaries with student and repo information
        base_repo_path: Base path where repositories are located
        output_dir: Directory to save reports

    Returns:
        List of analysis results
    """
    results = []

    for entry in repo_list:
        student_id = entry.get('student_id')
        repo_folder = entry.get('project_folder', '')
        github_username = entry.get('github_username', '')

        # Determine repo path
        repo_path = os.path.join(base_repo_path, repo_folder)

        # Skip if repository doesn't exist
        if not os.path.exists(repo_path):
            print(f"Warning: Repository not found for student {student_id}: {repo_path}")
            results.append({
                'student_id': student_id,
                'error': 'Repository not found',
                'repo_path': repo_path
            })
            continue

        # Analyze repository
        analyzer = GitActivityAnalyzer(repo_path)
        result = analyzer.analyze_repository()

        # Add student information
        result['student_info'] = {
            'student_id': entry.get('student_id'),
            'full_name': entry.get('full_name'),
            'github_username': github_username,
            'project_team': entry.get('project_team'),
            'project_title': entry.get('project_title')
        }

        results.append(result)

        # Save individual report
        student_info = {
            'student_id': entry.get('student_id'),
            'github_username': github_username
        }
        analyzer.save_report(student_info, output_dir)

    # Save batch summary
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    summary_path = os.path.join(output_dir, f'git_analysis_batch_{timestamp}.json')
    save_json_report({'analyses': results}, summary_path)

    return results


def main():
    """Main function for command line usage."""
    parser = argparse.ArgumentParser(
        description='Analyze Git repository activity for grading'
    )
    parser.add_argument(
        'repo_path',
        help='Path to the Git repository to analyze'
    )
    parser.add_argument(
        '--since', '-s',
        help='Start date for analysis (ISO format, e.g., 2024-01-01)'
    )
    parser.add_argument(
        '--team-size', '-t',
        type=int,
        default=1,
        help='Number of team members (default: 1)'
    )
    parser.add_argument(
        '--output', '-o',
        default='data/reports',
        help='Output directory for reports (default: data/reports)'
    )
    parser.add_argument(
        '--student-id',
        help='Student ID for report naming'
    )
    parser.add_argument(
        '--csv-file',
        help='CSV file with student and repository information for batch processing'
    )
    parser.add_argument(
        '--base-path',
        default='projects',
        help='Base path for repositories in batch mode (default: projects)'
    )
    parser.add_argument(
        '--no-viz',
        action='store_true',
        help='Skip visualization generation'
    )

    args = parser.parse_args()

    # Batch mode
    if args.csv_file:
        try:
            import pandas as pd
            df = pd.read_csv(args.csv_file)
            repo_list = df.to_dict('records')

            results = analyze_batch_repositories(
                repo_list,
                args.base_path,
                args.output
            )

            print(f"Analyzed {len(results)} repositories")
            for result in results:
                if 'error' in result:
                    print(f"  Error {result['student_id']}: {result['error']}")
                else:
                    score = result.get('summary', {}).get('git_activity_score', 0)
                    commits = result.get('summary', {}).get('total_commits', 0)
                    print(f"  {result['student_id']}: Score={score}, Commits={commits}")

        except Exception as e:
            print(f"Error in batch processing: {e}")
            sys.exit(1)

    # Single repository mode
    else:
        analyzer = GitActivityAnalyzer(args.repo_path, args.since)
        result = analyzer.analyze_repository(args.team_size)

        if 'error' in result:
            print(f"Error: {result['error']}")
            sys.exit(1)

        # Display results
        print("\nGit Activity Analysis Results")
        print("=" * 50)
        print(f"Repository: {args.repo_path}")
        print(f"Total Commits: {result['summary']['total_commits']}")
        print(f"Git Activity Score: {result['summary']['git_activity_score']}/10")
        print(f"Active Days: {result['summary']['active_days']}")
        print(f"Activity Span: {result['summary']['activity_span_days']} days")

        if 'message_quality' in result:
            quality = result['message_quality']
            print(f"\nCommit Message Quality: {quality['quality_score']:.1f}/100")
            print(f"  Average Length: {quality['avg_length']:.1f} characters")
            print(f"  Descriptive Messages: {quality['descriptive_ratio']:.1%}")

        if 'collaboration' in result:
            collab = result['collaboration']
            print(f"\nCollaboration Score: {collab['collaboration_score']:.1f}/100")
            print(f"  Author Diversity: {collab['author_diversity']:.2f}")
            print(f"  Team Participation: {collab['participation_ratio']:.2f}")

        if 'commit_patterns' in result:
            patterns = result['commit_patterns']
            print(f"\nActivity Pattern: {patterns['activity_pattern']}")
            print(f"  Consistent: {patterns['is_consistent']}")
            print(f"  Last-minute: {patterns['is_last_minute']}")

        # Save report
        student_info = {'student_id': args.student_id or 'unknown'}
        report_path, viz_path = analyzer.save_report(
            student_info,
            args.output,
            not args.no_viz
        )

        print(f"\nReport saved to: {report_path}")
        if viz_path:
            print(f"Visualization saved to: {viz_path}")


if __name__ == '__main__':
    main()