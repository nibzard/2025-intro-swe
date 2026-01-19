#!/usr/bin/env python3
"""
Grade Calculator

This script calculates final grades for students based on all grading components
including seminar, project work, attendance, Git activity, peer reviews, and quiz.
"""

import argparse
import json
import os
import sys
from datetime import datetime
from typing import Dict, List, Optional, Any

# Add utils to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'utils'))

from grading_utils import (
    calculate_final_grade,
    validate_grades,
    calculate_class_statistics,
    get_max_score,
    GRADING_WEIGHTS
)
from report_utils import (
    generate_student_grade_report,
    generate_class_summary_report,
    export_grades_to_csv,
    create_grade_distribution_chart
)


class GradeCalculator:
    """Calculates and manages student grades for the SWE course."""

    def __init__(self, grading_data: Optional[List[Dict[str, Any]]] = None):
        """
        Initialize the grade calculator.

        Args:
            grading_data: Optional list of student grade dictionaries
        """
        self.grading_data = grading_data or []
        self.class_statistics = {}

    def load_grades_from_csv(self, csv_path: str) -> None:
        """
        Load grades from a CSV file.

        Args:
            csv_path: Path to the CSV file containing grades
        """
        try:
            import pandas as pd
            df = pd.read_csv(csv_path)
            self.grading_data = df.to_dict('records')
            print(f"Loaded {len(self.grading_data)} student records from {csv_path}")
        except Exception as e:
            print(f"Error loading CSV file: {e}")
            sys.exit(1)

    def calculate_student_grade(self, student_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate final grade for a single student.

        Args:
            student_data: Dictionary containing student information and component grades

        Returns:
            Updated dictionary with calculated final grade
        """
        # Extract component grades
        grades = {
            'seminar': student_data.get('seminar_grade', 0),
            'code_quality': student_data.get('code_quality_grade', 0),
            'innovation': student_data.get('innovation_grade', 0),
            'documentation': student_data.get('documentation_grade', 0),
            'attendance': student_data.get('attendance_grade', 0),
            'git_activity': student_data.get('git_activity_grade', 0),
            'peer_review': student_data.get('peer_review_grade', 0),
            'git_quiz': student_data.get('git_quiz_grade', 0)
        }

        # Validate grades
        errors = validate_grades(grades)
        if errors:
            print(f"Warning for student {student_data.get('student_id', 'Unknown')}:")
            for error in errors:
                print(f"  - {error}")

        # Calculate final grade
        final_numeric, final_letter = calculate_final_grade(grades)

        # Determine status
        status = 'Pass' if final_numeric >= 60 else 'Fail'
        if final_numeric >= 90:
            status = 'Excellent'
        elif final_numeric >= 80:
            status = 'Good'

        # Update student data
        student_data.update({
            'final_grade': final_numeric,
            'final_grade_letter': final_letter,
            'status': status
        })

        # Add grade breakdown for reporting
        student_data['grade_breakdown'] = {
            'components': grades,
            'weights': GRADING_WEIGHTS,
            'weighted_scores': {
                comp: round(grade * GRADING_WEIGHTS[comp], 2)
                for comp, grade in grades.items()
            }
        }

        return student_data

    def calculate_all_grades(self) -> List[Dict[str, Any]]:
        """
        Calculate final grades for all students.

        Returns:
            List of student dictionaries with calculated final grades
        """
        calculated_grades = []

        for student in self.grading_data:
            # Skip empty rows
            if not student.get('student_id'):
                continue

            calculated = self.calculate_student_grade(student.copy())
            calculated_grades.append(calculated)

        # Calculate class statistics
        self.class_statistics = calculate_class_statistics(calculated_grades)

        return calculated_grades

    def get_grade_statistics(self) -> Dict[str, Any]:
        """
        Get comprehensive class grade statistics.

        Returns:
            Dictionary containing class statistics
        """
        if not self.class_statistics:
            self.calculate_all_grades()

        return self.class_statistics

    def get_student_ranking(self) -> List[Tuple[str, float, str]]:
        """
        Get students ranked by final grade.

        Returns:
            List of tuples (student_name, final_grade, final_letter)
        """
        if not self.grading_data:
            return []

        # Sort by final grade descending
        sorted_students = sorted(
            self.grading_data,
            key=lambda x: x.get('final_grade', 0),
            reverse=True
        )

        return [
            (
                s.get('full_name', 'Unknown'),
                s.get('final_grade', 0),
                s.get('final_grade_letter', 'F')
            )
            for s in sorted_students
        ]

    def get_failing_students(self, passing_grade: float = 60) -> List[Dict[str, Any]]:
        """
        Get list of students who are failing.

        Args:
            passing_grade: Minimum grade to pass (default: 60)

        Returns:
            List of failing student dictionaries
        """
        return [
            student for student in self.grading_data
            if student.get('final_grade', 0) < passing_grade
        ]

    def get_component_averages(self) -> Dict[str, float]:
        """
        Calculate average scores for each grading component.

        Returns:
            Dictionary with component averages
        """
        if not self.grading_data:
            return {}

        components = [
            'seminar_grade', 'code_quality_grade', 'innovation_grade',
            'documentation_grade', 'attendance_grade', 'git_activity_grade',
            'peer_review_grade', 'git_quiz_grade'
        ]

        averages = {}
        for comp in components:
            values = [
                s.get(comp, 0) for s in self.grading_data
                if s.get(comp) is not None and s.get(comp) != ''
            ]
            if values:
                averages[comp] = round(sum(values) / len(values), 2)
            else:
                averages[comp] = 0

        return averages

    def generate_reports(
        self,
        output_dir: str = 'data/reports',
        include_individual: bool = True,
        include_visualization: bool = True
    ) -> Dict[str, List[str]]:
        """
        Generate all grade reports.

        Args:
            output_dir: Directory to save reports
            include_individual: Whether to generate individual student reports
            include_visualization: Whether to generate charts

        Returns:
            Dictionary with lists of generated report paths
        """
        generated_files = {
            'individual_reports': [],
            'summary_reports': [],
            'visualizations': []
        }

        # Ensure grades are calculated
        if not self.class_statistics:
            self.calculate_all_grades()

        # Generate individual reports
        if include_individual:
            for student in self.grading_data:
                if student.get('student_id'):
                    report_path = generate_student_grade_report(
                        student,
                        output_dir
                    )
                    generated_files['individual_reports'].append(report_path)

        # Generate class summary report
        summary_path = generate_class_summary_report(
            self.grading_data,
            self.class_statistics,
            output_dir
        )
        generated_files['summary_reports'].append(summary_path)

        # Generate visualizations
        if include_visualization and self.class_statistics:
            # Grade distribution chart
            chart_path = create_grade_distribution_chart(
                self.class_statistics.get('grade_distribution', {}),
                output_dir
            )
            if chart_path:
                generated_files['visualizations'].append(chart_path)

        # Export updated CSV
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        csv_path = os.path.join(output_dir, f'calculated_grades_{timestamp}.csv')
        export_grades_to_csv(self.grading_data, csv_path)
        generated_files['summary_reports'].append(csv_path)

        return generated_files

    def update_grading_template(
        self,
        template_path: str,
        output_path: Optional[str] = None
    ) -> str:
        """
        Update the original grading template with calculated grades.

        Args:
            template_path: Path to the original grading template
            output_path: Optional output path (overwrites template if None)

        Returns:
            Path to the updated file
        """
        if output_path is None:
            output_path = template_path

        try:
            import pandas as pd

            # Load original template
            df = pd.read_csv(template_path)

            # Update with calculated grades
            for student in self.grading_data:
                student_id = student.get('student_id')
                if student_id:
                    mask = df['student_id'] == student_id
                    for col in ['final_grade', 'final_grade_letter', 'status']:
                        if col in student:
                            df.loc[mask, col] = student[col]

            # Save updated file
            df.to_csv(output_path, index=False)
            return output_path

        except Exception as e:
            print(f"Error updating template: {e}")
            return template_path


def main():
    """Main function for command line usage."""
    parser = argparse.ArgumentParser(
        description='Calculate final grades for SWE course'
    )
    parser.add_argument(
        '--input', '-i',
        default='grading_template_20251212.csv',
        help='Input CSV file with student grades (default: grading_template_20251212.csv)'
    )
    parser.add_argument(
        '--output', '-o',
        default='data/reports',
        help='Output directory for reports (default: data/reports)'
    )
    parser.add_argument(
        '--update-template',
        action='store_true',
        help='Update the original template file with calculated grades'
    )
    parser.add_argument(
        '--no-individual',
        action='store_true',
        help='Skip individual student report generation'
    )
    parser.add_argument(
        '--no-viz',
        action='store_true',
        help='Skip visualization generation'
    )
    parser.add_argument(
        '--json-output',
        help='Optional JSON file to save calculated grades'
    )

    args = parser.parse_args()

    # Initialize calculator
    calculator = GradeCalculator()

    # Load grades from CSV
    if os.path.exists(args.input):
        calculator.load_grades_from_csv(args.input)
    else:
        print(f"Error: Input file not found: {args.input}")
        sys.exit(1)

    # Calculate all grades
    print("Calculating final grades...")
    calculated_grades = calculator.calculate_all_grades()
    print(f"Calculated grades for {len(calculated_grades)} students")

    # Display class statistics
    stats = calculator.get_grade_statistics()
    print("\nClass Statistics")
    print("=" * 50)
    print(f"Mean Grade: {stats.get('mean', 0):.2f}")
    print(f"Median Grade: {stats.get('median', 0):.2f}")
    print(f"Standard Deviation: {stats.get('std_dev', 0):.2f}")
    print(f"Pass Rate: {stats.get('pass_rate', 0):.1f}%")

    # Grade distribution
    dist = stats.get('grade_distribution', {})
    print(f"\nGrade Distribution:")
    for grade in ['A', 'B', 'C', 'D', 'F']:
        print(f"  {grade}: {dist.get(grade, 0)} students")

    # Show top performers
    ranking = calculator.get_student_ranking()
    print("\nTop 5 Performers:")
    for i, (name, grade, letter) in enumerate(ranking[:5], 1):
        print(f"  {i}. {name}: {grade:.1f} ({letter})")

    # Show failing students
    failing = calculator.get_failing_students()
    if failing:
        print(f"\nFailing Students ({len(failing)}):")
        for student in failing[:5]:  # Show first 5
            print(f"  - {student.get('full_name', 'Unknown')}: {student.get('final_grade', 0):.1f}")
        if len(failing) > 5:
            print(f"  ... and {len(failing) - 5} more")

    # Generate reports
    print("\nGenerating reports...")
    generated_files = calculator.generate_reports(
        args.output,
        not args.no_individual,
        not args.no_viz
    )

    print("\nGenerated Files:")
    for category, files in generated_files.items():
        if files:
            print(f"\n{category.replace('_', ' ').title()}:")
            for file_path in files:
                print(f"  - {file_path}")

    # Update template if requested
    if args.update_template:
        print("\nUpdating grading template...")
        updated_path = calculator.update_grading_template(args.input)
        print(f"Template updated: {updated_path}")

    # Save JSON output if requested
    if args.json_output:
        json_data = {
            'students': calculated_grades,
            'statistics': stats,
            'generated_at': datetime.now().isoformat()
        }
        with open(args.json_output, 'w') as f:
            json.dump(json_data, f, indent=2, ensure_ascii=False)
        print(f"\nJSON output saved to: {args.json_output}")


if __name__ == '__main__':
    main()