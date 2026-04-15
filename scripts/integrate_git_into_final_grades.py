#!/usr/bin/env python3
"""
Integrate git activity into final grading output and update roster GitHub usernames.

Workflow:
1. Read a grade file (default: `final_grade_git.csv`).
2. Read `OFFICIAL_STUDENT_ROSTER.json` and fill missing `github_username`
   values from the grade source (name/email match preferred).
3. Read `STUDENT_ACTIVITY_DATA.json` and map each student to a git activity grade.
4. Recompute final-with-git fields on every row.
5. Write output CSV (by default in-place to the input path).

Canonical behavior:
- `final_grade_git.csv` is treated as canonical and preserved as-is (all current
  grade columns remain).
Legacy compatibility:
- `final_grades.csv` is still supported and will be transformed into canonical
  shape automatically.
"""

import argparse
import csv
import json
import math
import os
import re
import unicodedata
from pathlib import Path
from typing import Dict, Optional, Tuple


CANONICAL_FIELDS = {
    "Final_grade_numeric_with_git",
    "Final_grade_with_git",
    "final_grade_with_git_delta",
}

CANONICAL_GRADE_FIELD = "Test_grade"
CANONICAL_SEMINAR_GRADE_FIELD = "Seminar_grade"
LEGACY_GRADE_FIELD = "Grade"
LEGACY_SEMINAR_GRADE_FIELD = "Ocjena"
_NUMERIC_VALUE_RE = re.compile(r"^[+-]?(?:\d+\.?\d*|\.\d+)$")

LEGACY_DROP_FIELDS = {
    "Dolasci_lectures_pct",
    "Dolasci_exercises_pct",
    "Test_total",
    "Control_total",
    "Chance_guess_ge_score",
    "Chance_guess_ge_score_and_control_le",
    "Final_grade_numeric",
    "Final_grade",
}


def normalize_text(value: str) -> str:
    """Normalize a person name/email for resilient matching."""
    if not value:
        return ""
    value = value.lower().strip()
    value = unicodedata.normalize("NFKD", value)
    value = "".join(ch for ch in value if not unicodedata.combining(ch))
    value = value.replace("-", " ").replace("_", " ")
    value = re.sub(r"\s+", " ", value).strip()
    return value


def normalize_key(value: str) -> str:
    """Stricter normalizer for fallback matching."""
    return normalize_text(value).replace(" ", "")


def clean_username(value: Optional[str]) -> str:
    """Normalize GitHub fields, preferring first username when multiple are joined with '/'. """
    if value is None:
        return ""
    value = str(value).strip()
    if "/" in value:
        value = value.split("/", 1)[0].strip()
    return value if value and value.lower() not in {"none", "-", "n/a", "na"} else ""


def parse_float(value: Optional[str]) -> Optional[float]:
    """Parse a numeric CSV field or return None for missing markers."""
    if value is None:
        return None
    v = str(value).strip()
    if not v or v in {"-", "*"}:
        return None
    try:
        return float(v.replace(",", "."))
    except ValueError:
        return None


def format_two_decimals(value: Optional[str]) -> str:
    """Format plain numeric strings as strings with two decimals."""
    if value is None:
        return ""
    v = str(value).strip()
    if not v or v in {"-", "*", "nan", "inf", "-inf"}:
        return v
    if ":" in v:
        return v
    if not _NUMERIC_VALUE_RE.match(v):
        return v
    try:
        return f"{float(v):.2f}"
    except ValueError:
        return v


def attendance_bonus(attendance_pct: Optional[float]) -> float:
    """Attendance bonus exactly as in grading formula."""
    if attendance_pct is None:
        return 0.0
    if attendance_pct < 60:
        return -0.1
    if attendance_pct < 70:
        return 0.1
    if attendance_pct < 80:
        return 0.2
    return 0.3


def clamp(value: float, min_value: float, max_value: float) -> float:
    """Clamp a float into a numeric interval."""
    return max(min_value, min(max_value, value))


def round_half_up(value: float) -> int:
    """Round half up to integer on tie."""
    return int(math.floor(value + 0.5))


def status_to_git_grade(
    status: str,
    commits: int,
    is_project_lead: bool = False,
    project_folder: str = "",
    project_total_commits: Optional[int] = None,
) -> float:
    """Map activity status to 0-10 grade.

    Fallbacks use commit counts only when the status is not one of known buckets.
    """
    status = (status or "").strip().lower()
    if status == "very active":
        return 10.0
    if status == "active":
        return 7.0
    if status == "low activity":
        return 4.0
    if status == "minimal activity":
        return 2.0
    if status in {"no git activity"}:
        return 0.0
    if status == "lead only - verify":
        # Pair-programming leads can still contribute through project work.
        # If project activity exists, give baseline credit instead of zero.
        if is_project_lead and project_folder and (project_total_commits or 0) > 0:
            return 2.0
        return 0.0
    if commits >= 15:
        return 10.0
    if commits >= 5:
        return 7.0
    if commits >= 2:
        return 4.0
    if commits == 1:
        return 2.0
    return 0.0


def is_canonical_row(row: Dict[str, str]) -> bool:
    """Check if this row follows the canonical final_grade_git schema."""
    return all(field in row for field in CANONICAL_FIELDS)


def load_csv_rows(path: str):
    with open(path, "r", encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def update_roster(
    roster_path: str,
    final_rows: list,
    output_path: Optional[str] = None
) -> Tuple[dict, int]:
    """Fill missing roster GitHub usernames using grade source data."""
    with open(roster_path, "r", encoding="utf-8") as f:
        roster = json.load(f)

    students = roster.get("students", [])

    final_by_github = {}
    final_by_name = {}
    final_by_email = {}
    for row in final_rows:
        gh = clean_username(row.get("github_username", ""))
        full_name = f"{row.get('Ime', '').strip()} {row.get('Prezime', '').strip()}".strip()
        norm = normalize_text(full_name)
        if gh:
            final_by_github[gh.lower()] = row
        if norm:
            final_by_name[norm] = row
        email = normalize_text(row.get("Email", ""))
        if email:
            final_by_email[email] = row

    updates = 0
    for student in students:
        current_gh = clean_username(student.get("github_username"))
        if current_gh:
            continue

        student_name = normalize_text(student.get("full_name", ""))
        student_email = normalize_text(student.get("email", ""))

        chosen_row = None
        if student_email and student_email in final_by_email:
            chosen_row = final_by_email[student_email]
        elif student_name and student_name in final_by_name:
            chosen_row = final_by_name[student_name]

        if chosen_row:
            new_gh = clean_username(chosen_row.get("github_username"))
            if new_gh:
                student["github_username"] = new_gh
                updates += 1

    # Optionally write an updated roster copy
    out_path = output_path or roster_path
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(roster, f, ensure_ascii=False, indent=2)

    return roster, updates


def load_activity_rows(path: str) -> Dict[str, dict]:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    activity_by_github = {}
    activity_by_name = {}
    for student in data.get("students", []):
        name = normalize_text(student.get("name", ""))
        key_name = normalize_key(name)
        gh = clean_username(student.get("github_username"))
        if gh:
            activity_by_github[gh.lower()] = student
        if key_name:
            activity_by_name[key_name] = student
    return {
        "by_github": activity_by_github,
        "by_name": activity_by_name,
        "project_totals": data.get("projects", {}),
    }


def load_seminar_map(path: str) -> Dict[str, Dict[str, str]]:
    """Load seminar grades keyed by github username and normalized full name."""
    seminar_by_github: Dict[str, str] = {}
    seminar_by_name: Dict[str, str] = {}
    with open(path, "r", encoding="utf-8-sig", newline="") as f:
        for row in csv.DictReader(f):
            gh = clean_username(row.get("github_username"))
            value = str(row.get(LEGACY_SEMINAR_GRADE_FIELD, "")).strip()
            if not value:
                continue
            if gh:
                seminar_by_github[gh.lower()] = value

            full_name = normalize_text(row.get("Ime i prezime", ""))
            full_name_norm = normalize_key(full_name)
            if full_name_norm:
                seminar_by_name[full_name_norm] = value
    return {
        "by_github": seminar_by_github,
        "by_name": seminar_by_name,
    }


def normalize_test_grade_field(row: dict) -> dict:
    """Normalize grade field naming to canonical `Test_grade` in output rows."""
    if CANONICAL_GRADE_FIELD not in row and LEGACY_GRADE_FIELD in row:
        row[CANONICAL_GRADE_FIELD] = row[LEGACY_GRADE_FIELD]
    row.pop(LEGACY_GRADE_FIELD, None)
    return row


def normalize_seminar_grade_field(row: dict) -> dict:
    """Normalize seminar field naming to canonical `Seminar_grade`."""
    if (
        CANONICAL_SEMINAR_GRADE_FIELD not in row
        and LEGACY_SEMINAR_GRADE_FIELD in row
    ):
        row[CANONICAL_SEMINAR_GRADE_FIELD] = row[LEGACY_SEMINAR_GRADE_FIELD]
    row.pop(LEGACY_SEMINAR_GRADE_FIELD, None)
    return row


def build_grade_row(
    row: dict,
    activity_map: Dict[str, dict],
    seminar_map: Dict[str, Dict[str, str]],
) -> dict:
    out = dict(row)
    normalized_github = clean_username(row.get("github_username"))
    if normalized_github:
        out["github_username"] = normalized_github

    for field in LEGACY_DROP_FIELDS:
        out.pop(field, None)

    normalize_test_grade_field(out)
    normalize_seminar_grade_field(out)

    full_name = f"{row.get('Ime', '').strip()} {row.get('Prezime', '').strip()}".strip()
    full_name_norm = normalize_key(full_name)
    gh = clean_username(row.get("github_username"))

    project_grade = parse_float(row.get("Project_grade"))
    test_grade = parse_float(out.get(CANONICAL_GRADE_FIELD))
    seminar_grade = parse_float(out.get(CANONICAL_SEMINAR_GRADE_FIELD))
    if seminar_grade is None and gh:
        seminar_grade = parse_float(seminar_map["by_github"].get(gh.lower(), ""))
        if seminar_grade is not None:
            out[CANONICAL_SEMINAR_GRADE_FIELD] = str(seminar_grade)
    if seminar_grade is None and full_name_norm:
        seminar_grade = parse_float(seminar_map["by_name"].get(full_name_norm, ""))
        if seminar_grade is not None:
            out[CANONICAL_SEMINAR_GRADE_FIELD] = str(seminar_grade)
    attendance_pct = parse_float(row.get("Dolasci_total_pct"))
    base_bonus = attendance_bonus(attendance_pct)

    if project_grade is None and test_grade is None and seminar_grade is None:
        final_base = "-"
        final_base_letter = "-"
        final_base_num = None
    elif project_grade is None or test_grade is None or seminar_grade is None:
        final_base = "*"
        final_base_letter = "*"
        final_base_num = None
    else:
        base_num = project_grade * 0.6 + seminar_grade * 0.1 + test_grade * 0.3
        final_base_num = clamp(base_num + base_bonus, 1.0, 5.0)
        final_base = round(final_base_num, 3)
        final_base_letter = str(round_half_up(final_base_num))

    activity = None
    if gh and gh.lower() in activity_map["by_github"]:
        activity = activity_map["by_github"][gh.lower()]
    elif full_name_norm and full_name_norm in activity_map["by_name"]:
        activity = activity_map["by_name"][full_name_norm]

    commits = 0
    status = ""
    if activity:
        commits = int(activity.get("total_commits", 0) or 0)
        status = activity.get("status", "")
    elif gh:
        status = "No Git Activity"

    project_folder = activity.get("project_folder", "") if activity else ""
    project_total = 0
    if project_folder:
        project_total = int((activity_map.get("project_totals", {}).get(project_folder, {}) or {}).get("total_commits", 0) or 0)
    is_project_lead = bool(activity.get("is_project_lead")) if activity else False
    git_grade = status_to_git_grade(
        status,
        commits,
        is_project_lead=is_project_lead,
        project_folder=project_folder,
        project_total_commits=project_total,
    )
    out["git_status"] = status
    out["git_commits"] = str(commits)
    out["git_activity_grade"] = str(git_grade)

    if final_base_num is None:
        final_with_git = final_base
        final_with_git_letter = final_base_letter
        final_with_git_delta = ""
    else:
        final_with_git_num = final_base_num * 0.95 + (git_grade / 2) * 0.05
        final_with_git_num = clamp(final_with_git_num, 1.0, 5.0)
        final_with_git = round(final_with_git_num, 3)
        final_with_git_letter = str(round_half_up(final_with_git_num))
        final_with_git_delta = round(final_with_git - final_base, 3)

    out["Final_grade_numeric_with_git"] = "" if final_base in {"-", "*"} else str(final_with_git)
    out["Final_grade_with_git"] = "" if final_base in {"-", "*"} else final_with_git_letter
    out["final_grade_with_git_delta"] = final_with_git_delta

    for key, value in list(out.items()):
        out[key] = format_two_decimals(value)

    return out


def main():
    parser = argparse.ArgumentParser(
        description="Integrate git activity into grade data and update roster usernames."
    )
    parser.add_argument(
        "--final-grades",
        default="final_grade_git.csv",
        help="Input grade file (default: final_grade_git.csv)"
    )
    parser.add_argument(
        "--roster",
        default="OFFICIAL_STUDENT_ROSTER.json",
        help="Path to OFFICIAL_STUDENT_ROSTER.json"
    )
    parser.add_argument(
        "--activity-data",
        default="STUDENT_ACTIVITY_DATA.json",
        help="Path to STUDENT_ACTIVITY_DATA.json"
    )
    parser.add_argument(
        "--seminar-data",
        default="seminari.csv",
        help="Path to seminari.csv"
    )
    parser.add_argument(
        "--output",
        default=None,
        help="Output CSV path (default: same as --final-grades)"
    )
    parser.add_argument(
        "--mode",
        choices=["auto", "legacy", "canonical"],
        default="auto",
        help="Mode for input shape detection: auto|legacy|canonical"
    )
    parser.add_argument(
        "--no-roster-update",
        action="store_true",
        help="Do not write back roster changes."
    )
    args = parser.parse_args()

    final_rows = load_csv_rows(args.final_grades)
    print(f"Loaded {len(final_rows)} rows from {args.final_grades}")
    if not final_rows:
        print("No rows found. Nothing to do.")
        return

    if args.mode == "canonical":
        canonical = True
    elif args.mode == "legacy":
        canonical = False
    else:
        canonical = is_canonical_row(final_rows[0])
    print(f"Input mode: {'canonical' if canonical else 'legacy'}")

    roster_updates = 0
    if not args.no_roster_update:
        _, roster_updates = update_roster(args.roster, final_rows)
        print(f"Updated roster GitHub usernames in {args.roster}: {roster_updates}")
    else:
        print("Skipping roster update due --no-roster-update")

    activity_map = load_activity_rows(args.activity_data)
    seminar_map = load_seminar_map(args.seminar_data)
    output_rows = [
        build_grade_row(
            r,
            activity_map,
            seminar_map,
        ) for r in final_rows
    ]

    sample_row = dict(final_rows[0])
    for field in LEGACY_DROP_FIELDS:
        sample_row.pop(field, None)
    normalize_test_grade_field(sample_row)
    normalize_seminar_grade_field(sample_row)

    fieldnames = list(sample_row.keys())
    fieldnames = [field for field in fieldnames if field != CANONICAL_GRADE_FIELD]
    fieldnames = [field for field in fieldnames if field != CANONICAL_SEMINAR_GRADE_FIELD]
    if "Test_time" in fieldnames:
        insert_idx = fieldnames.index("Test_time") + 1
    else:
        insert_idx = len(fieldnames)

    has_test_grade = any(CANONICAL_GRADE_FIELD in row for row in output_rows)
    has_seminar_grade = any(
        CANONICAL_SEMINAR_GRADE_FIELD in row for row in output_rows
    )

    if CANONICAL_GRADE_FIELD in sample_row or has_test_grade:
        fieldnames.insert(insert_idx, CANONICAL_GRADE_FIELD)
        insert_idx += 1
    if CANONICAL_SEMINAR_GRADE_FIELD in sample_row or has_seminar_grade:
        fieldnames.insert(insert_idx, CANONICAL_SEMINAR_GRADE_FIELD)

    extra_fields = [
        "git_status",
        "git_commits",
        "git_activity_grade",
        "Final_grade_numeric_with_git",
        "Final_grade_with_git",
        "final_grade_with_git_delta",
    ]
    for field in extra_fields:
        if field not in fieldnames:
            fieldnames.append(field)

    out_path = Path(args.output or args.final_grades)
    with open(out_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in output_rows:
            writer.writerow(row)

    # Touch base CSV for reproducibility of "activity-only" updates
    os.utime(out_path, None)
    print(f"Written {len(output_rows)} rows to {out_path}")


if __name__ == "__main__":
    main()
