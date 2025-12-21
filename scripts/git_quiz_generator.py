#!/usr/bin/env python3
"""
Git Quiz Generator

This script creates interactive Git/GitHub quizzes for in-class assessment
with multiple choice questions, practical scenarios, and best practices.
"""

import argparse
import json
import os
import sys
import random
from datetime import datetime
from typing import Dict, List, Optional, Any

# Add utils to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'utils'))

from report_utils import save_json_report


class GitQuizGenerator:
    """Generates Git/GitHub quizzes for student assessment."""

    def __init__(self, data_dir: str = 'data/quizzes'):
        """
        Initialize the quiz generator.

        Args:
            data_dir: Directory to store quiz data
        """
        self.data_dir = data_dir
        os.makedirs(data_dir, exist_ok=True)
        self.question_bank = self._load_default_questions()

    def _load_default_questions(self) -> Dict[str, List[Dict[str, Any]]]:
        """
        Load the default question bank.

        Returns:
            Dictionary of questions organized by category
        """
        return {
            'basic_commands': [
                {
                    'question': 'Which command creates a new local repository?',
                    'type': 'multiple_choice',
                    'options': [
                        'git init',
                        'git clone',
                        'git create',
                        'git new'
                    ],
                    'correct': 0,
                    'explanation': 'git init initializes a new Git repository in the current directory.'
                },
                {
                    'question': 'What does the command git add do?',
                    'type': 'multiple_choice',
                    'options': [
                        'Commits the changes',
                        'Stages changes for commit',
                        'Pushes changes to remote',
                        'Creates a new branch'
                    ],
                    'correct': 1,
                    'explanation': 'git add stages changes in the working directory for the next commit.'
                },
                {
                    'question': 'Which command shows the commit history?',
                    'type': 'multiple_choice',
                    'options': [
                        'git status',
                        'git history',
                        'git log',
                        'git commits'
                    ],
                    'correct': 2,
                    'explanation': 'git log displays the commit history for the current branch.'
                },
                {
                    'question': 'What does git commit -m "message" do?',
                    'type': 'multiple_choice',
                    'options': [
                        'Creates a commit with the message "message"',
                        'Adds all files and commits with message',
                        'Pushes commit with message to remote',
                        'Creates a new branch with message'
                    ],
                    'correct': 0,
                    'explanation': 'git commit -m creates a new commit with the specified commit message.'
                },
                {
                    'question': 'Which command uploads local repository content to a remote repository?',
                    'type': 'multiple_choice',
                    'options': [
                        'git upload',
                        'git send',
                        'git push',
                        'git sync'
                    ],
                    'correct': 2,
                    'explanation': 'git push uploads local commits to the remote repository.'
                }
            ],
            'branching_merging': [
                {
                    'question': 'How do you create a new branch?',
                    'type': 'multiple_choice',
                    'options': [
                        'git branch new-branch',
                        'git checkout -b new-branch',
                        'git create-branch new-branch',
                        'Both A and B'
                    ],
                    'correct': 3,
                    'explanation': 'Both git branch new-branch (creates) and git checkout -b new-branch (creates and switches) can be used.'
                },
                {
                    'question': 'What does git merge feature-branch do?',
                    'type': 'multiple_choice',
                    'options': [
                        'Switches to feature-branch',
                        'Combines feature-branch into current branch',
                        'Deletes feature-branch',
                        'Copies feature-branch'
                    ],
                    'correct': 1,
                    'explanation': 'git merge incorporates changes from the named branch into the current branch.'
                },
                {
                    'question': 'Which command lists all branches?',
                    'type': 'multiple_choice',
                    'options': [
                        'git show-branches',
                        'git branch',
                        'git list-branches',
                        'git branches'
                    ],
                    'correct': 1,
                    'explanation': 'git branch lists all local branches in the repository.'
                },
                {
                    'question': 'What is a fast-forward merge?',
                    'type': 'multiple_choice',
                    'options': [
                        'A merge that always conflicts',
                        'A merge where the current branch is simply moved forward',
                        'A merge that creates a merge commit',
                        'A merge that requires manual resolution'
                    ],
                    'correct': 1,
                    'explanation': 'A fast-forward merge moves the branch pointer forward without creating a merge commit.'
                }
            ],
            'pull_requests': [
                {
                    'question': 'What is a pull request?',
                    'type': 'multiple_choice',
                    'options': [
                        'A request to pull changes from remote',
                        'A mechanism to propose and review changes',
                        'A command to merge branches',
                        'A way to download code'
                    ],
                    'correct': 1,
                    'explanation': 'A pull request is a mechanism to propose changes and request review before merging.'
                },
                {
                    'question': 'Where can you create pull requests?',
                    'type': 'multiple_choice',
                    'options': [
                        'Only in GitLab',
                        'Only in GitHub',
                        'In GitHub, GitLab, and Bitbucket',
                        'Pull requests dont exist'
                    ],
                    'correct': 2,
                    'explanation': 'Pull requests (or merge requests) are available in most Git hosting platforms.'
                }
            ],
            'conflict_resolution': [
                {
                    'question': 'What causes a merge conflict?',
                    'type': 'multiple_choice',
                    'options': [
                        'Two branches have different commit histories',
                        'Changes overlap in the same file at the same location',
                        'Network connection issues',
                        'Too many branches'
                    ],
                    'correct': 1,
                    'explanation': 'Conflicts occur when Git cannot automatically resolve changes to the same part of a file.'
                },
                {
                    'question': 'How do you continue after resolving conflicts?',
                    'type': 'multiple_choice',
                    'options': [
                        'git continue',
                        'git resolved',
                        'git add and git commit',
                        'git done'
                    ],
                    'correct': 2,
                    'explanation': 'After resolving conflicts, you must stage the resolved files (git add) and complete the merge (git commit).'
                },
                {
                    'question': 'What does git merge --abort do?',
                    'type': 'multiple_choice',
                    'options': [
                        'Deletes the branch',
                        'Cancels the merge and returns to previous state',
                        'Aborts Git completely',
                        'Deletes all conflicts'
                    ],
                    'correct': 1,
                    'explanation': 'git merge --abort cancels the merge operation and restores the repository to its pre-merge state.'
                }
            ],
            'scenarios': [
                {
                    'question': 'You made changes but forgot to create a new branch. What should you do?',
                    'type': 'scenario',
                    'options': [
                        'Delete all changes and start over',
                        'git stash; git checkout -b new-branch; git stash pop',
                        'Just commit to main branch',
                        'git reset --hard HEAD'
                    ],
                    'correct': 1,
                    'explanation': 'Use git stash to save changes, create and checkout new branch, then git stash pop to apply changes.'
                },
                {
                    'question': 'You want to undo the last commit but keep the changes. Which command?',
                    'type': 'scenario',
                    'options': [
                        'git reset --hard HEAD~1',
                        'git reset --soft HEAD~1',
                        'git revert HEAD',
                        'git delete-commit'
                    ],
                    'correct': 1,
                    'explanation': 'git reset --soft HEAD~1 undoes the last commit but keeps changes staged.'
                },
                {
                    'question': 'Your local branch is behind remote. How do you update it?',
                    'type': 'scenario',
                    'options': [
                        'git pull',
                        'git fetch followed by git merge',
                        'git rebase origin/main',
                        'All of the above'
                    ],
                    'correct': 3,
                    'explanation': 'All three methods can update your local branch, but they work differently.'
                }
            ],
            'best_practices': [
                {
                    'question': 'What makes a good commit message?',
                    'type': 'multiple_choice',
                    'options': [
                        'Single word like "fix"',
                        'Descriptive with what and why',
                        'Very long with all details',
                        'No message needed'
                    ],
                    'correct': 1,
                    'explanation': 'A good commit message explains what changed and why, in a clear and concise manner.'
                },
                {
                    'question': 'How often should you commit?',
                    'type': 'multiple_choice',
                    'options': [
                        'Once at the end of the project',
                        'After each logical change or milestone',
                        'After every single line change',
                        'Never, just use stash'
                    ],
                    'correct': 1,
                    'explanation': 'Commit after completing logical units of work, maintaining a balance between too frequent and too sparse commits.'
                },
                {
                    'question': 'What is .gitignore used for?',
                    'type': 'multiple_choice',
                    'options': [
                        'Ignoring developers',
                        'Specifying files/folders Git should not track',
                        'Ignoring merge conflicts',
                        'Skipping tests'
                    ],
                    'correct': 1,
                    'explanation': '.gitignore specifies files and patterns that Git should ignore and not track.'
                }
            ]
        }

    def generate_quiz(
        self,
        num_questions: int = 10,
        categories: Optional[List[str]] = None,
        difficulty: str = 'mixed',
        seed: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Generate a quiz with specified parameters.

        Args:
            num_questions: Number of questions to include
            categories: List of categories to include (None for all)
            difficulty: Difficulty level (easy, medium, hard, mixed)
            seed: Random seed for reproducibility

        Returns:
            Dictionary containing the quiz
        """
        if seed:
            random.seed(seed)

        # Determine which categories to use
        if categories is None:
            categories = list(self.question_bank.keys())

        # Collect all eligible questions
        eligible_questions = []
        for category in categories:
            if category in self.question_bank:
                eligible_questions.extend(self.question_bank[category])

        # Shuffle questions
        random.shuffle(eligible_questions)

        # Select questions
        selected_questions = eligible_questions[:num_questions]

        # Create quiz
        quiz = {
            'title': 'Git and GitHub Knowledge Quiz',
            'instructions': 'Select the best answer for each question.',
            'time_limit': 20,  # minutes
            'total_questions': len(selected_questions),
            'points_per_question': round(10 / len(selected_questions), 1),
            'generated_at': datetime.now().isoformat(),
            'questions': selected_questions
        }

        return quiz

    def generate_quiz_html(self, quiz: Dict[str, Any]) -> str:
        """
        Generate an HTML version of the quiz.

        Args:
            quiz: Quiz dictionary

        Returns:
            HTML string for the quiz
        """
        html = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{quiz['title']}</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }}
        .quiz-container {{
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        .quiz-header {{
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e0e0e0;
        }}
        .question {{
            margin: 20px 0;
            padding: 20px;
            background-color: #f9f9f9;
            border-radius: 8px;
            border-left: 4px solid #2196F3;
        }}
        .question-text {{
            font-weight: bold;
            margin-bottom: 15px;
            font-size: 16px;
        }}
        .options {{
            margin-left: 20px;
        }}
        .option {{
            margin: 10px 0;
            padding: 10px;
            background-color: white;
            border: 1px solid #ddd;
            border-radius: 5px;
            cursor: pointer;
            transition: background-color 0.2s;
        }}
        .option:hover {{
            background-color: #e3f2fd;
        }}
        .option.selected {{
            background-color: #bbdefb;
            border-color: #2196F3;
        }}
        .submit-btn {{
            background-color: #4CAF50;
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 18px;
            display: block;
            margin: 30px auto;
        }}
        .submit-btn:hover {{
            background-color: #45a049;
        }}
        .timer {{
            text-align: center;
            font-size: 18px;
            color: #666;
            margin: 20px 0;
        }}
        .results {{
            display: none;
            margin-top: 20px;
            padding: 20px;
            background-color: #e8f5e9;
            border-radius: 8px;
        }}
        .score {{
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
        }}
        .answer-review {{
            margin: 20px 0;
        }}
        .correct {{
            color: #4CAF50;
        }}
        .incorrect {{
            color: #f44336;
        }}
        .explanation {{
            margin-top: 5px;
            color: #666;
            font-style: italic;
        }}
    </style>
</head>
<body>
    <div class="quiz-container">
        <div class="quiz-header">
            <h1>{quiz['title']}</h1>
            <p>{quiz['instructions']}</p>
            <p><strong>Time Limit:</strong> {quiz['time_limit']} minutes</p>
            <p><strong>Total Questions:</strong> {quiz['total_questions']}</p>
            <p><strong>Points per Question:</strong> {quiz['points_per_question']}</p>
        </div>

        <div class="timer" id="timer">
            Time remaining: <span id="time-left">{quiz['time_limit']}:00</span>
        </div>

        <form id="quiz-form">
"""

        # Add questions
        for i, question in enumerate(quiz['questions']):
            html += f"""
            <div class="question">
                <div class="question-text">
                    {i + 1}. {question['question']}
                </div>
                <div class="options">
"""

            for j, option in enumerate(question['options']):
                html += f"""
                    <div class="option" onclick="selectOption({i}, {j}, this)">
                        <input type="radio" name="q{i}" value="{j}" style="display: none;">
                        {chr(65 + j)}) {option}
                    </div>
"""

            html += f"""
                </div>
            </div>
"""

        html += f"""
        </form>

        <button class="submit-btn" onclick="submitQuiz()">Submit Quiz</button>

        <div class="results" id="results">
            <h2>Quiz Results</h2>
            <div class="score" id="score"></div>
            <div class="answer-review" id="review"></div>
        </div>
    </div>

    <script>
        const quizData = {json.dumps(quiz)};
        const userAnswers = {{}};
        let timeRemaining = {quiz['time_limit']} * 60; // seconds

        // Timer functionality
        function updateTimer() {{
            const minutes = Math.floor(timeRemaining / 60);
            const seconds = timeRemaining % 60;
            document.getElementById('time-left').textContent =
                `${{minutes}}:${{seconds.toString().padStart(2, '0')}}`;

            if (timeRemaining <= 0) {{
                submitQuiz();
            }} else {{
                timeRemaining--;
            }}
        }}

        setInterval(updateTimer, 1000);

        function selectOption(questionIndex, optionIndex, element) {{
            // Clear previous selection
            const options = element.parentElement.querySelectorAll('.option');
            options.forEach(opt => opt.classList.remove('selected'));

            // Mark selected option
            element.classList.add('selected');

            // Store answer
            userAnswers[questionIndex] = optionIndex;

            // Check radio button
            const radio = element.querySelector('input[type="radio"]');
            radio.checked = true;
        }}

        function submitQuiz() {{
            // Calculate score
            let correct = 0;
            let reviewHTML = '';

            for (let i = 0; i < quizData.questions.length; i++) {{
                const question = quizData.questions[i];
                const userAnswer = userAnswers[i];
                const correctAnswer = question.correct;

                const isCorrect = userAnswer === correctAnswer;
                if (isCorrect) correct++;

                // Generate review
                reviewHTML += `
                    <div style="margin: 15px 0; padding: 15px; border-radius: 5px;
                         background-color: ${{isCorrect ? '#e8f5e9' : '#ffebee'}};">
                        <p><strong>Question ${{i + 1}}:</strong> ${{question.question}}</p>
                        <p><strong>Your answer:</strong>
                            <span class="${{isCorrect ? 'correct' : 'incorrect'}}">
                                ${{userAnswer !== undefined ? question.options[userAnswer] : 'Not answered'}}
                            </span>
                        </p>
                        ${{!isCorrect ? `
                            <p><strong>Correct answer:</strong>
                                <span class="correct">${{question.options[correctAnswer]}}</span>
                            </p>
                        ` : ''}}
                        <p class="explanation"><strong>Explanation:</strong> ${{question.explanation}}</p>
                    </div>
                `;
            }}

            // Display results
            const score = (correct / quizData.questions.length) * 10;
            document.getElementById('score').innerHTML =
                `Your Score: ${{score.toFixed(1)}}/10 (${{correct}}/${{quizData.questions.length}} correct)`;
            document.getElementById('review').innerHTML = reviewHTML;
            document.getElementById('results').style.display = 'block';

            // Scroll to results
            document.getElementById('results').scrollIntoView({{ behavior: 'smooth' }});

            // Disable quiz
            const options = document.querySelectorAll('.option');
            options.forEach(opt => opt.style.pointerEvents = 'none');
        }}
    </script>
</body>
</html>
"""
        return html

    def generate_answer_key(self, quiz: Dict[str, Any]) -> str:
        """
        Generate an answer key for the quiz.

        Args:
            quiz: Quiz dictionary

        Returns:
            HTML string for the answer key
        """
        html = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Answer Key - {quiz['title']}</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }}
        .header {{
            text-align: center;
            margin-bottom: 30px;
        }}
        .question {{
            margin: 20px 0;
            padding: 15px;
            border-left: 4px solid #4CAF50;
            background-color: #f9f9f9;
        }}
        .correct-answer {{
            color: #4CAF50;
            font-weight: bold;
        }}
        .explanation {{
            margin-top: 10px;
            color: #666;
            font-style: italic;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>Answer Key</h1>
        <h2>{quiz['title']}</h2>
        <p>Generated on: {quiz['generated_at']}</p>
    </div>
"""

        for i, question in enumerate(quiz['questions']):
            correct_letter = chr(65 + question['correct'])
            html += f"""
    <div class="question">
        <p><strong>{i + 1}.</strong> {question['question']}</p>
        <p class="correct-answer">
            Correct Answer: {correct_letter}) {question['options'][question['correct']]}
        </p>
        <p class="explanation">
            <strong>Explanation:</strong> {question['explanation']}
        </p>
    </div>
"""

        html += """
</body>
</html>
"""
        return html

    def save_quiz(
        self,
        quiz: Dict[str, Any],
        filename: Optional[str] = None,
        include_html: bool = True,
        include_answer_key: bool = True
    ) -> Dict[str, str]:
        """
        Save the quiz to files.

        Args:
            quiz: Quiz dictionary
            filename: Optional base filename
            include_html: Whether to generate HTML version
            include_answer_key: Whether to generate answer key

        Returns:
            Dictionary with paths to saved files
        """
        if filename is None:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'git_quiz_{timestamp}'

        saved_files = {}

        # Save JSON version
        json_path = os.path.join(self.data_dir, f'{filename}.json')
        save_json_report(quiz, json_path)
        saved_files['json'] = json_path

        # Save HTML version
        if include_html:
            html_path = os.path.join(self.data_dir, f'{filename}.html')
            with open(html_path, 'w', encoding='utf-8') as f:
                f.write(self.generate_quiz_html(quiz))
            saved_files['html'] = html_path

        # Save answer key
        if include_answer_key:
            answer_path = os.path.join(self.data_dir, f'{filename}_answer_key.html')
            with open(answer_path, 'w', encoding='utf-8') as f:
                f.write(self.generate_answer_key(quiz))
            saved_files['answer_key'] = answer_path

        return saved_files

    def add_custom_question(
        self,
        question: str,
        options: List[str],
        correct: int,
        explanation: str,
        category: str = 'custom'
    ) -> None:
        """
        Add a custom question to the question bank.

        Args:
            question: Question text
            options: List of answer options
            correct: Index of correct answer
            explanation: Explanation for the answer
            category: Category to add the question to
        """
        new_question = {
            'question': question,
            'type': 'multiple_choice',
            'options': options,
            'correct': correct,
            'explanation': explanation
        }

        if category not in self.question_bank:
            self.question_bank[category] = []

        self.question_bank[category].append(new_question)

    def export_question_bank(self, filepath: str) -> None:
        """
        Export the question bank to a file.

        Args:
            filepath: Path to save the question bank
        """
        save_json_report(self.question_bank, filepath)

    def import_question_bank(self, filepath: str) -> None:
        """
        Import questions from a file.

        Args:
            filepath: Path to the question bank file
        """
        with open(filepath, 'r') as f:
            imported = json.load(f)

        # Merge with existing questions
        for category, questions in imported.items():
            if category not in self.question_bank:
                self.question_bank[category] = []
            self.question_bank[category].extend(questions)


def main():
    """Main function for command line usage."""
    parser = argparse.ArgumentParser(
        description='Generate Git/GitHub quizzes'
    )
    parser.add_argument(
        '--questions', '-q',
        type=int,
        default=10,
        help='Number of questions in the quiz (default: 10)'
    )
    parser.add_argument(
        '--categories', '-c',
        nargs='+',
        choices=['basic_commands', 'branching_merging', 'pull_requests',
                'conflict_resolution', 'scenarios', 'best_practices'],
        help='Categories to include (default: all)'
    )
    parser.add_argument(
        '--output', '-o',
        help='Base filename for generated files'
    )
    parser.add_argument(
        '--data-dir', '-d',
        default='data/quizzes',
        help='Output directory (default: data/quizzes)'
    )
    parser.add_argument(
        '--no-html',
        action='store_true',
        help='Skip HTML generation'
    )
    parser.add_argument(
        '--no-answer-key',
        action='store_true',
        help='Skip answer key generation'
    )
    parser.add_argument(
        '--seed', '-s',
        type=int,
        help='Random seed for reproducibility'
    )
    parser.add_argument(
        '--export-bank',
        help='Export question bank to file'
    )
    parser.add_argument(
        '--add-question',
        nargs=6,
        metavar=('QUESTION', 'OPT1', 'OPT2', 'OPT3', 'CORRECT', 'EXPLANATION'),
        help='Add a custom question (format: "Q" "Opt1" "Opt2" "Opt3" "0/1/2" "Explanation")'
    )

    args = parser.parse_args()

    # Initialize generator
    generator = GitQuizGenerator(args.data_dir)

    # Export question bank
    if args.export_bank:
        generator.export_question_bank(args.export_bank)
        print(f"Question bank exported to: {args.export_bank}")
        return

    # Add custom question
    if args.add_question:
        question, opt1, opt2, opt3, correct_idx, explanation = args.add_question
        try:
            correct_idx = int(correct_idx)
            if not 0 <= correct_idx <= 2:
                raise ValueError
        except ValueError:
            print("Error: Correct answer index must be 0, 1, or 2")
            sys.exit(1)

        generator.add_custom_question(
            question,
            [opt1, opt2, opt3],
            correct_idx,
            explanation
        )
        print("Custom question added successfully")
        return

    # Generate quiz
    print("Generating quiz...")
    quiz = generator.generate_quiz(
        num_questions=args.questions,
        categories=args.categories,
        seed=args.seed
    )

    print(f"Quiz generated with {quiz['total_questions']} questions")

    # Display question distribution
    category_count = {}
    for question in quiz['questions']:
        # Find which category this question belongs to
        for cat, questions in generator.question_bank.items():
            if question in questions:
                category_count[cat] = category_count.get(cat, 0) + 1
                break

    if category_count:
        print("\nQuestion distribution:")
        for cat, count in category_count.items():
            print(f"  {cat}: {count}")

    # Save quiz
    saved_files = generator.save_quiz(
        quiz,
        args.output,
        not args.no_html,
        not args.no_answer_key
    )

    print("\nGenerated files:")
    for file_type, filepath in saved_files.items():
        print(f"  {file_type}: {filepath}")


if __name__ == '__main__':
    main()