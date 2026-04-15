# Final Grades Scoring Explainer

This document explains how `final_grade_git.csv` is now the canonical grade source.

`final_grade_git.csv` is the canonical output produced by
`scripts/integrate_git_into_final_grades.py`.

## Data sources

- Source inputs used to build/rebuild canonical grade file:
  - Base file: `students_test_results.csv`
  - Project grades file: `students_test_results_projects.csv`
  - Git activity file: `STUDENT_ACTIVITY_DATA.json`
  - Seminar grades file: `seminari.csv` (merged as `Seminar_grade` in `final_grade_git.csv`)
  - Join key: `github_username`

`Project_grade` comes from `students_test_results_projects.csv` column `Final_grade`.
`Test_grade` is sourced from `students_test_results.csv` column `Grade` and stored in `final_grade_git.csv` as `Test_grade`.
`Seminar_grade` is sourced from `seminari.csv` column `Ocjena` and stored as `Seminar_grade`.
Attendance uses `students_test_results.csv` column `Dolasci_total_pct`.
Git activity uses `status` and `total_commits` from `STUDENT_ACTIVITY_DATA.json`.

## Merge rule

Canonical workflow:
- Default input is `final_grade_git.csv`.
- Any manual edits in that file are preserved in-place and all derived columns are recalculated.
- For legacy rebuilds, pass `--final-grades final_grades.csv` (or use `--mode legacy`).
Rows are preserved from the chosen input file.
Project/test/seminar grades are attached by `github_username` first, then normalized full name fallback.

For canonical/recalculation runs on `final_grade_git.csv`, rows are additionally
matched against `STUDENT_ACTIVITY_DATA.json` by `github_username` first, then by
normalized full name as a fallback.

## Base final grade formula (`final_grade_git.csv`)

When all three component grades exist:

1. Core weighted grade:

`g_core = 0.6 * Project_grade + 0.1 * Seminar_grade + 0.3 * Test_grade`

2. Attendance bonus by `Dolasci_total_pct`:

`a = Dolasci_total_pct / 100`

- if `a < 0.60`: `bonus = -0.1`
- if `0.60 <= a < 0.70`: `bonus = 0.1`
- if `0.70 <= a < 0.80`: `bonus = 0.2`
- if `a >= 0.80`: `bonus = 0.3`

3. Attendance-adjusted final numeric grade:

`g_final_num = g_core + bonus`

4. Clamp to grading scale:

`g_final_num = clamp(1, 5, g_final_num)`

5. Base final decimal (`g_final_num`) is blended with git and stored as `Final_grade_numeric_with_git`.

## Git-integrated formula (`final_grade_git.csv`)

For rows where base grades exist, a git activity component is added.

### 1) Map git activity to a 0–10 grade

- `Very Active` → `10`
- `Active` → `7`
- `Low Activity` → `4`
- `Minimal Activity` → `2`
- `No Git Activity` → `0`
- `Lead Only - Verify` → `0` by default, but team leads on active project folders now receive baseline `2`
- Fallback by commit count (when status is unrecognized):
  - `>= 15` commits → `10`
  - `>= 5` commits → `7`
  - `>= 2` commits → `4`
  - `1` commit → `2`
  - `0` commits → `0`

### 2) Blend with base grade

- Existing base numeric final grade:

`g_base_num = clamp(1, 5, 0.6 * Project_grade + 0.1 * Seminar_grade + 0.3 * Test_grade + attendance_bonus)`

- Git-integrated final numeric grade:

`g_git_num = 0.95 * g_base_num + 0.05 * (git_grade / 2)`

- Clamp and round:

`g_git_num = clamp(1, 5, g_git_num)`

`Final_grade_with_git = round_half_up(g_git_num)`

Also stored in output:

- `Final_grade_numeric_with_git` = `g_git_num`
- `Final_grade_with_git` = rounded grade with git
- `final_grade_with_git_delta` = difference to base decimal grade

For rows with missing inputs or base-grade markers `-`/`*`, this integration keeps git-enhanced fields empty for consistency.

## Canonical `final_grade_git.csv` columns

`final_grade_git.csv` intentionally includes everything needed for ongoing calculation:

Canonical columns are:
- `Prezime`, `Ime`, `Email`, `Dolasci_lectures`, `Dolasci_exercises`, `Dolasci_total`, `Dolasci_total_pct`
- `Test_score`, `Control_correct`, `Test_time`, `Test_grade`, `Seminar_grade`, `Project_grade`
- `github_username`, `git_status`, `git_commits`, `git_activity_grade`
- `Final_grade_with_git`, `Final_grade_numeric_with_git`, `final_grade_with_git_delta`

Columns intentionally removed from canonical output: `Dolasci_lectures_pct`,
`Dolasci_exercises_pct`, `Test_total`, `Control_total`, `Chance_guess_ge_score`,
`Chance_guess_ge_score_and_control_le`, `Final_grade_numeric`, `Final_grade`.

## Missing data behavior

For each row in canonical `final_grade_git.csv`:

- If any of (`Project_grade`, `Test_grade`, `Seminar_grade`) is missing:
  - `Final_grade_numeric_with_git = ""`
  - `Final_grade_with_git = ""`

For `final_grade_git.csv`, rows with base `-`/`*` keep `Final_grade_numeric_with_git`
and `Final_grade_with_git` empty.

## Current run notes

- `students_test_results_projects.csv` and `students_test_results.csv` were cross-checked before build.
- `Jakov Češljar`, `Iva Dežmalj`, and `Blago Vukšić` were added from project records where
  `Project_grade` was present but missing in legacy source data; their GitHub usernames were then filled
  (`jakces`, `ivadez`, `bvuksicc`).
- `Matea Begonja`, `Barbara Jezidžić`, and `Ivan Tavić` remain `*` in the legacy grade base
  because they still have no `Grade` value in the test results, even though
  `Project_grade` is present.
- `final_grade_git.csv` still keeps Git activity for all rows with a GitHub username; missing activity is
  intentionally represented as `No Git Activity` with grade `0`.

## Rounding method

`round_half_up` means values ending in `.5` round upward to the next integer.
Examples:

- `3.49 -> 3`
- `3.50 -> 4`

`round_half_up(x) = floor(x + 0.5)`

In addition, `scripts/integrate_git_into_final_grades.py` formats numeric output
fields in `final_grade_git.csv` to **two decimals** (e.g., `3` -> `3.00`), while
preserving non-numeric display values such as `7:03` time stamps and status text.
