#!/usr/bin/env python3
"""
ABOUTME: Create sample datasets for scientific programming exercises
Author: Teaching Assistant
Course: Scientific Programming 2025/26
"""

import numpy as np
import pandas as pd
import pathlib

def create_student_grades():
    """Create sample student grades dataset."""
    np.random.seed(42)
    n_students = 100

    data = {
        'student_id': range(1, n_students + 1),
        'name': [f'Student_{i}' for i in range(1, n_students + 1)],
        'assignment_1': np.random.normal(75, 15, n_students),
        'assignment_2': np.random.normal(80, 12, n_students),
        'midterm': np.random.normal(78, 18, n_students),
        'final_exam': np.random.normal(82, 14, n_students),
        'participation': np.random.uniform(60, 100, n_students)
    }

    df = pd.DataFrame(data)
    return df

def main():
    """Create and save sample datasets."""
    # Try to create data directory
    data_dirs = ["~/data", "/workspaces/data", "data"]
    data_dir = None

    for dir_path in data_dirs:
        expanded_path = pathlib.Path(dir_path).expanduser()
        if expanded_path.exists() or expanded_path.mkdir(parents=True, exist_ok=True):
            data_dir = expanded_path
            break

    if data_dir is None:
        print("Could not create data directory")
        return

    # Create datasets
    print("Creating student grades dataset...")
    grades_df = create_student_grades()
    grades_df.to_csv(data_dir / 'student_grades.csv', index=False)
    print(f"Saved {len(grades_df)} student records to {data_dir / 'student_grades.csv'}")

    print("Sample datasets created successfully!")

if __name__ == "__main__":
    main()
