#!/usr/bin/env python3
"""
Peer Review System

This script manages the peer review process for team projects, including
assignment of reviewers, collection of reviews, and calculation of scores.
"""

import argparse
import json
import os
import sys
import random
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any

# Add utils to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'utils'))

from grading_utils import calculate_peer_review_score
from report_utils import generate_peer_review_summary, save_json_report


class PeerReviewSystem:
    """Manages the peer review process for team projects."""

    def __init__(self, data_dir: str = 'data/peer_reviews'):
        """
        Initialize the peer review system.

        Args:
            data_dir: Directory to store peer review data
        """
        self.data_dir = data_dir
        os.makedirs(data_dir, exist_ok=True)
        self.review_assignments = {}
        self.review_submissions = {}
        self.review_rubric = self._default_rubric()

    def _default_rubric(self) -> Dict[str, Dict[str, str]]:
        """
        Get the default peer review rubric.

        Returns:
            Dictionary defining the review criteria
        """
        return {
            'code_quality': {
                'name': 'Code Quality',
                'description': 'Cleanliness, readability, structure, and best practices',
                'max_score': 10,
                'criteria': [
                    'Code is well-organized and modular',
                    'Follows consistent naming conventions',
                    'Includes appropriate comments and documentation',
                    'Handles errors gracefully'
                ]
            },
            'ui_ux': {
                'name': 'User Interface/Experience',
                'description': 'Usability, design, and user interaction',
                'max_score': 10,
                'criteria': [
                    'Interface is intuitive and easy to use',
                    'Visual design is appealing and consistent',
                    'Provides clear feedback to users',
                    'Responsive and performs well'
                ]
            },
            'innovation': {
                'name': 'Innovation and Creativity',
                'description': 'Originality of idea and technical solutions',
                'max_score': 10,
                'criteria': [
                    'Addresses a real need or problem',
                    'Implements creative or novel features',
                    'Uses interesting technologies or approaches',
                    'Goes beyond basic requirements'
                ]
            },
            'documentation': {
                'name': 'Documentation',
                'description': 'Quality of project documentation',
                'max_score': 10,
                'criteria': [
                    'README is comprehensive and clear',
                    'Setup and installation instructions',
                    'API documentation (if applicable)',
                    'User guide or examples'
                ]
            },
            'overall': {
                'name': 'Overall Impression',
                'description': 'General assessment of the project',
                'max_score': 10,
                'criteria': [
                    'Project is complete and functional',
                    'Meets stated objectives',
                    'Shows effort and attention to detail',
                    'Would recommend to others'
                ]
            }
        }

    def load_student_teams(self, csv_path: str) -> Dict[str, List[Dict[str, str]]]:
        """
        Load student team information from CSV file.

        Args:
            csv_path: Path to the CSV file with student data

        Returns:
            Dictionary mapping team names to list of student dictionaries
        """
        try:
            import pandas as pd
            df = pd.read_csv(csv_path)

            teams = {}
            for _, row in df.iterrows():
                team = row.get('project_team', 'No Team')
                if team and pd.notna(team):
                    student = {
                        'student_id': row.get('student_id'),
                        'full_name': row.get('full_name'),
                        'github_username': row.get('github_username'),
                        'project_title': row.get('project_title'),
                        'project_folder': row.get('project_folder')
                    }
                    if team not in teams:
                        teams[team] = []
                    teams[team].append(student)

            # Remove empty teams
            teams = {k: v for k, v in teams.items() if v and k != 'No Team'}

            return teams

        except Exception as e:
            print(f"Error loading student teams: {e}")
            return {}

    def assign_reviewers(
        self,
        teams: Dict[str, List[Dict[str, str]]],
        reviews_per_team: int = 3,
        avoid_self_review: bool = True
    ) -> Dict[str, List[str]]:
        """
        Assign peer reviewers to each team.

        Args:
            teams: Dictionary of teams and their members
            reviews_per_team: Number of reviews each team should receive
            avoid_self_review: Whether to prevent teams from reviewing themselves

        Returns:
            Dictionary mapping teams to their assigned reviewers
        """
        team_names = list(teams.keys())
        random.shuffle(team_names)

        assignments = {team: [] for team in team_names}

        # Create a round-robin assignment
        for i, reviewing_team in enumerate(team_names):
            # Assign reviews for other teams
            for j in range(reviews_per_team):
                # Find a team to review (not themselves)
                offset = (i + j + 1) % len(team_names)
                reviewed_team = team_names[offset]

                if avoid_self_review and reviewing_team == reviewed_team:
                    # Find another team
                    offset = (i + j + 2) % len(team_names)
                    reviewed_team = team_names[offset]

                assignments[reviewed_team].append(reviewing_team)

        # Ensure each team gets the required number of reviews
        for team in team_names:
            while len(assignments[team]) < reviews_per_team:
                # Find teams that haven't been assigned to review this team yet
                available = [t for t in team_names if t != team and t not in assignments[team]]
                if available:
                    reviewer = random.choice(available)
                    assignments[team].append(reviewer)
                else:
                    break

        self.review_assignments = assignments
        return assignments

    def save_review_assignments(self, filename: Optional[str] = None) -> str:
        """
        Save review assignments to a file.

        Args:
            filename: Optional filename (auto-generated if None)

        Returns:
            Path to the saved file
        """
        if filename is None:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'review_assignments_{timestamp}.json'

        filepath = os.path.join(self.data_dir, filename)
        data = {
            'assignments': self.review_assignments,
            'rubric': self.review_rubric,
            'created_at': datetime.now().isoformat()
        }

        save_json_report(data, filepath)
        return filepath

    def load_review_assignments(self, filepath: str) -> None:
        """
        Load review assignments from a file.

        Args:
            filepath: Path to the assignments file
        """
        with open(filepath, 'r') as f:
            data = json.load(f)
            self.review_assignments = data.get('assignments', {})
            if 'rubric' in data:
                self.review_rubric = data['rubric']

    def create_review_forms(
        self,
        teams: Dict[str, List[Dict[str, str]]],
        output_dir: str = 'data/quizzes'
    ) -> Dict[str, str]:
        """
        Create individual review forms for each team.

        Args:
            teams: Dictionary of teams and their information
            output_dir: Directory to save review forms

        Returns:
            Dictionary mapping team names to file paths
        """
        os.makedirs(output_dir, exist_ok=True)
        form_files = {}

        for team, reviewers in self.review_assignments.items():
            if team not in teams:
                continue

            team_info = teams[team]
            project_title = team_info[0].get('project_title', team) if team_info else team

            # Create HTML review form
            form_content = self._generate_review_form_html(
                team, project_title, reviewers, team_info
            )

            # Save form
            filename = f'review_form_{team.lower().replace(" ", "_")}.html'
            filepath = os.path.join(output_dir, filename)

            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(form_content)

            form_files[team] = filepath

        return form_files

    def _generate_review_form_html(
        self,
        team: str,
        project_title: str,
        reviewers: List[str],
        team_members: List[Dict[str, str]]
    ) -> str:
        """Generate an HTML form for peer reviews."""
        html = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Peer Review Form: {project_title}</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
        }}
        .header {{
            background-color: #f4f4f4;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 20px;
        }}
        .rubric-item {{
            margin: 20px 0;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }}
        .criteria {{
            margin: 10px 0;
            font-size: 0.9em;
            color: #666;
        }}
        .score-buttons {{
            margin: 10px 0;
        }}
        .score-buttons button {{
            margin: 2px;
            padding: 5px 10px;
            cursor: pointer;
        }}
        .score-buttons button.selected {{
            background-color: #4CAF50;
            color: white;
        }}
        textarea {{
            width: 100%;
            height: 100px;
            margin: 10px 0;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }}
        .submit-btn {{
            background-color: #4CAF50;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin-top: 20px;
        }}
        .submit-btn:hover {{
            background-color: #45a049;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>Peer Review Form</h1>
        <h2>Project: {project_title}</h2>
        <p><strong>Team:</strong> {team}</p>
        <p><strong>Team Members:</strong></p>
        <ul>
"""

        for member in team_members:
            html += f'            <li>{member.get("full_name", "Unknown")} ({member.get("github_username", "No username")})</li>\n'

        html += f"""
        </ul>
        <p><strong>Your Team:</strong> <select id="reviewer-team" required>
            <option value="">-- Select Your Team --</option>
"""

        for reviewer in reviewers:
            html += f'            <option value="{reviewer}">{reviewer}</option>\n'

        html += f"""
        </select></p>
    </div>

    <form id="review-form" onsubmit="submitReview(event)">
"""

        # Add rubric items
        for key, rubric_item in self.review_rubric.items():
            html += f"""
        <div class="rubric-item">
            <h3>{rubric_item['name']} (0-{rubric_item['max_score']})</h3>
            <p>{rubric_item['description']}</p>
            <div class="criteria">
                <strong>Criteria:</strong>
                <ul>
"""
            for criterion in rubric_item['criteria']:
                html += f'                    <li>{criterion}</li>\n'

            html += f"""
                </ul>
            </div>
            <div class="score-buttons">
"""
            for score in range(rubric_item['max_score'] + 1):
                html += f'                <button type="button" onclick="selectScore(this, \'{key}\', {score})">{score}</button>\n'

            html += f"""
            </div>
            <input type="hidden" id="{key}-score" name="{key}" required>
        </div>
"""

        html += f"""
        <div class="rubric-item">
            <h3>Additional Comments</h3>
            <p>Please provide specific feedback on what you liked about this project and any suggestions for improvement:</p>
            <textarea id="comments" name="comments" placeholder="Enter your comments here..." required></textarea>
        </div>

        <button type="submit" class="submit-btn">Submit Review</button>
    </form>

    <script>
        function selectScore(button, category, score) {{
            // Clear previous selection
            const buttons = button.parentElement.querySelectorAll('button');
            buttons.forEach(btn => btn.classList.remove('selected'));

            // Mark selected button
            button.classList.add('selected');

            // Set hidden input value
            document.getElementById(category + '-score').value = score;
        }}

        function submitReview(event) {{
            event.preventDefault();

            // Collect form data
            const formData = {{
                reviewed_team: '{team}',
                reviewer_team: document.getElementById('reviewer-team').value,
                project_title: '{project_title}',
"""

            for key in self.review_rubric.keys():
                html += f'                {key}: parseInt(document.getElementById("{key}-score").value),\n'

            html += f"""
                comments: document.getElementById('comments').value,
                submitted_at: new Date().toISOString()
            }};

            // Validate all scores are selected
"""

            for key in self.review_rubric.keys():
                html += f'            if (isNaN(formData.{key})) {{ alert("Please select a score for {self.review_rubric[key]["name"]}"); return; }}\n'

            html += f"""
            // Save to localStorage (in a real system, this would be sent to a server)
            const reviews = JSON.parse(localStorage.getItem('peerReviews') || '[]');
            reviews.push(formData);
            localStorage.setItem('peerReviews', JSON.stringify(reviews));

            alert('Review submitted successfully! Thank you for your feedback.');

            // Optionally reset form
            document.getElementById('review-form').reset();

            // Clear score selections
            document.querySelectorAll('.score-buttons button').forEach(btn => {{
                btn.classList.remove('selected');
            }});
        }}
    </script>
</body>
</html>
"""
        return html

    def submit_review(
        self,
        review_data: Dict[str, Any]
    ) -> Tuple[bool, str]:
        """
        Submit a peer review.

        Args:
            review_data: Dictionary containing the review

        Returns:
            Tuple of (success: bool, message: str)
        """
        # Validate review data
        required_fields = ['reviewed_team', 'reviewer_team', 'comments']
        for field in required_fields:
            if field not in review_data:
                return False, f"Missing required field: {field}"

        # Validate scores
        for key in self.review_rubric.keys():
            if key not in review_data:
                return False, f"Missing score for {self.review_rubric[key]['name']}"
            max_score = self.review_rubric[key]['max_score']
            if not (0 <= review_data[key] <= max_score):
                return False, f"Invalid score for {key}: {review_data[key]}"

        # Check if reviewer is assigned to review this team
        reviewed_team = review_data['reviewed_team']
        reviewer_team = review_data['reviewer_team']

        if reviewed_team not in self.review_assignments:
            return False, "Team not found in assignments"

        if reviewer_team not in self.review_assignments[reviewed_team]:
            return False, "Your team is not assigned to review this project"

        # Check for duplicate reviews
        if reviewed_team not in self.review_submissions:
            self.review_submissions[reviewed_team] = []

        for existing in self.review_submissions[reviewed_team]:
            if existing.get('reviewer_team') == reviewer_team:
                return False, "Your team has already submitted a review for this project"

        # Add submission timestamp
        review_data['submitted_at'] = datetime.now().isoformat()

        # Save review
        self.review_submissions[reviewed_team].append(review_data)

        # Save to file
        self._save_reviews()

        return True, "Review submitted successfully"

    def _save_reviews(self) -> None:
        """Save all reviews to a JSON file."""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'peer_reviews_{timestamp}.json'
        filepath = os.path.join(self.data_dir, filename)

        data = {
            'reviews': self.review_submissions,
            'assignments': self.review_assignments,
            'rubric': self.review_rubric,
            'last_updated': datetime.now().isoformat()
        }

        save_json_report(data, filepath)

    def load_reviews(self, filepath: str) -> None:
        """
        Load reviews from a JSON file.

        Args:
            filepath: Path to the reviews file
        """
        with open(filepath, 'r') as f:
            data = json.load(f)
            self.review_submissions = data.get('reviews', {})
            if 'assignments' in data:
                self.review_assignments = data['assignments']

    def calculate_team_scores(
        self,
        outlier_threshold: float = 2.0
    ) -> Dict[str, Dict[str, Any]]:
        """
        Calculate final peer review scores for all teams.

        Args:
            outlier_threshold: Standard deviation threshold for outlier removal

        Returns:
            Dictionary mapping teams to their scores and breakdowns
        """
        team_scores = {}

        for team, reviews in self.review_submissions.items():
            if not reviews:
                team_scores[team] = {
                    'average_score': 0,
                    'component_scores': {},
                    'num_reviews': 0
                }
                continue

            # Calculate scores using the grading utility
            avg_score, component_scores = calculate_peer_review_score(
                reviews, outlier_threshold
            )

            team_scores[team] = {
                'average_score': avg_score,
                'component_scores': component_scores,
                'num_reviews': len(reviews),
                'individual_scores': reviews
            }

        return team_scores

    def generate_review_summary(
        self,
        team: str,
        output_dir: str = 'data/reports'
    ) -> Optional[str]:
        """
        Generate a summary report for a team's peer reviews.

        Args:
            team: Team name
            output_dir: Directory to save the report

        Returns:
            Path to the generated report or None if no reviews found
        """
        if team not in self.review_submissions:
            return None

        project_info = {
            'project_team': team,
            'reviews_received': len(self.review_submissions[team])
        }

        return generate_peer_review_summary(
            self.review_submissions[team],
            project_info,
            output_dir
        )


def main():
    """Main function for command line usage."""
    parser = argparse.ArgumentParser(
        description='Manage peer reviews for team projects'
    )
    parser.add_argument(
        '--csv-file', '-c',
        default='grading_template_20251212.csv',
        help='CSV file with student and team information'
    )
    parser.add_argument(
        '--data-dir', '-d',
        default='data/peer_reviews',
        help='Directory to store peer review data'
    )
    parser.add_argument(
        '--reviews-per-team', '-r',
        type=int,
        default=3,
        help='Number of reviews each team should receive (default: 3)'
    )
    parsercommand = parser.add_mutually_exclusive_group(required=True)
    parsercommand.add_argument(
        '--assign',
        action='store_true',
        help='Assign reviewers to teams'
    )
    parsercommand.add_argument(
        '--forms',
        action='store_true',
        help='Generate review forms'
    )
    parsercommand.add_argument(
        '--calculate',
        action='store_true',
        help='Calculate final scores from submitted reviews'
    )
    parsercommand.add_argument(
        '--summary',
        help='Generate summary for a specific team'
    )
    parser.add_argument(
        '--load-assignments',
        help='Load reviewer assignments from file'
    )
    parser.add_argument(
        '--output-dir', '-o',
        default='data/quizzes',
        help='Output directory for generated forms'
    )

    args = parser.parse_args()

    # Initialize the system
    prs = PeerReviewSystem(args.data_dir)

    # Load student teams
    teams = prs.load_student_teams(args.csv_file)
    if not teams:
        print("No teams found in the CSV file")
        sys.exit(1)

    print(f"Loaded {len(teams)} teams:")
    for team, members in teams.items():
        print(f"  {team}: {len(members)} members")

    # Load assignments if specified
    if args.load_assignments and os.path.exists(args.load_assignments):
        prs.load_review_assignments(args.load_assignments)
        print(f"\nLoaded assignments from {args.load_assignments}")

    # Assign reviewers
    if args.assign:
        print("\nAssigning reviewers...")
        assignments = prs.assign_reviewers(teams, args.reviews_per_team)

        for team, reviewers in assignments.items():
            print(f"  {team}: {', '.join(reviewers)}")

        # Save assignments
        saved_path = prs.save_review_assignments()
        print(f"\nAssignments saved to: {saved_path}")

    # Generate forms
    elif args.forms:
        if not prs.review_assignments:
            print("No reviewer assignments found. Run with --assign first.")
            sys.exit(1)

        print("\nGenerating review forms...")
        form_files = prs.create_review_forms(teams, args.output_dir)

        for team, filepath in form_files.items():
            print(f"  {team}: {filepath}")

    # Calculate scores
    elif args.calculate:
        print("\nCalculating team scores...")
        team_scores = prs.calculate_team_scores()

        for team, scores in team_scores.items():
            print(f"\n{team}:")
            print(f"  Average Score: {scores['average_score']}/10")
            print(f"  Reviews: {scores['num_reviews']}")
            if scores['component_scores']:
                print("  Component Scores:")
                for comp, score in scores['component_scores'].items():
                    comp_name = prs.review_rubric.get(comp, {}).get('name', comp)
                    print(f"    {comp_name}: {score}/10")

    # Generate summary
    elif args.summary:
        print(f"\nGenerating review summary for {args.summary}...")
        summary_path = prs.generate_review_summary(args.summary)

        if summary_path:
            print(f"Summary saved to: {summary_path}")
        else:
            print("No reviews found for this team")


if __name__ == '__main__':
    main()