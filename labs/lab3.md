# Lab 3: Fork → Codespaces → PR (with Sync + Conflicts)

**Goal:** Every student forks the course repo, works in their own Codespace, adds a lab folder + file, and opens a clean Pull Request (PR) to the upstream repo.

---

## Learning Objectives

By the end of this lab you will be able to:

* Explain the Git/GitHub flow (fork/clone/branch/commit/push/PR).
* Work safely in **GitHub Codespaces** and keep it in sync with the remote repo.
* Use **Sync fork** + `git pull` to avoid drift and resolve basic conflicts.
* Structure a contribution that passes review and gets merged.
* Understand empty-folder pitfalls (`.gitkeep`) and basic `.gitignore`.
* Recognize **main vs master** naming and the role of protected branches.
* Know when to **delete/recreate** a Codespace to fix a broken state.

---

## Prerequisites

* GitHub account (logged in).
* Access to the course repo: `nibzard/2025-intro-swe` (read-only).
* Browser with stable internet.

---

## Key Terms (fast recap)

* **Repository (repo):** place where code + history live.
* **Commit:** a saved revision with a message.
* **Branch:** a line of development; **main** is the canonical one (old default: *master*).
* **Fork:** your copy of someone’s repo under your account (lets you push + open PRs).
* **Pull Request (PR):** a request to **pull** your changes into the upstream repo.
* **Sync:** keep your fork and local/Codespace copy up to date with upstream.

---

## What You’ll Submit

A PR that adds **your personal folder** with a file to:

```
students/lab03/<your_id>/
```

* **Folder name convention:** `<firstInitial><lastName>` (e.g., `mmaric`, `ijankin`).
* **Required file:** `README.md` with at least one non-empty line (or any text file).
* If you really need an empty folder, add `.gitkeep`.

---

## Step-by-Step

### 1) Fork the repo (2 min)

1. Open the course repo on GitHub: `nibzard/2025-intro-swe`.
2. Click **Fork** → create the fork under **your account**.
   (You now own this copy and can push to it.)

### 2) Create a Codespace on *your fork* (3–5 min)

1. In **your fork**, click **Code** → **Codespaces** → **Create codespace on main**.
2. Wait for the dev container to build. If it hangs, use **Show log** to see progress.

> Tip: If a Codespace gets messy (conflicts/mismatch), it’s fine to **delete** it and create a new one. Your source of truth is the remote repo, not the old Codespace state.

### 3) Ensure you’re in sync (1 min)

In the terminal inside Codespaces:

```bash
git pull
```

* If it says **Already up to date**, great.
* Otherwise it will pull upstream changes into your working copy.

Also keep your **fork** in sync with upstream:

* On your fork’s GitHub page you may see **“This branch is X commits behind”** → click **Sync fork**.

> Rule of thumb: **Sync fork** (GitHub) → then `git pull` (Codespace) before you start work.

### 4) Add your lab folder + file (5 min)

From the repo root:

```bash
mkdir -p students/lab03/<your_id>
printf "# Lab 03 – %s\n" "<Your Name>" > students/lab03/<your_id>/README.md
```

If you want an empty folder, add:

```bash
touch students/lab03/<your_id>/.gitkeep
```

### 5) Stage, commit, push (3 min)

```bash
git status                 # sanity check
git add students/lab03/<your_id>
git commit -m "lab03: add folder and README for <your_id>"
git push                   # pushes to *your fork* (origin)
```

> Only stage what you actually changed. Avoid `git add .` if there are auto-generated files you don’t need.

### 6) Open a Pull Request (PR) to upstream (5 min)

1. On your fork, click **Contribute** → **Open pull request**.
2. Target: **base repository** = `nibzard/2025-intro-swe`, **base branch** = `main`.
3. Title: `lab03: add <your_id>`
4. Body: briefly say what you added.
5. Submit the PR.

The instructor/reviewer may leave comments or approvals. After merge, your contribution is in upstream.

---

## Verification & Sync Hygiene

Before, during, and after edits:

* **On GitHub (fork):** click **Sync fork** if you’re *behind*.
* **In Codespaces:** run `git pull` to ensure your working copy reflects the latest fork state.
* After a merge happens upstream, your fork can be **behind** again—sync it!

> Biggest source of errors: forgetting where you made changes (GitHub web editor vs Codespaces vs local), leading to drift. Always sync.

---

## Troubleshooting

**“Nothing to PR / 0 changed files”**
You created a folder but no files. Add `README.md` or `.gitkeep`.

**Push rejected / non-fast-forward**
Your fork’s `main` diverged.

* Fix: `git pull --rebase` then `git push`.

**Conflict on the same file**
Open the file, resolve `<<<<<<<`/`=======`/`>>>>>>>` markers, then:

```bash
git add <file>
git commit
git push
```

**Weird Codespace state / old attempts lingering**
Delete the Codespace and create a fresh one from your fork. Then `git pull` after **Sync fork**.

**Accidentally staged generated files**
Use `.gitignore`. Common entries (already in many Python devcontainers): `__pycache__/`, `.DS_Store`, `Thumbs.db`, `.venv`, etc.

---

## Review Etiquette (what reviewers look for)

* Minimal, focused diff (only your `students/lab03/<your_id>` folder).
* Clear commit message (`lab03: …` prefix helps).
* Non-empty content.
* Folder named per convention.

---

## Licensing & Ethics (quick note)

* If a repo has a **license** (e.g., MIT/Apache-2.0), you may fork and contribute under that license.
* If a repo has **no license**, rights are reserved—treat with care.
* **Fork vs copy-paste:** Fork preserves provenance/history and is the ethical way to build on others’ work.

---

## Optional: “Power Moves”

* Use **GitHub CLI (`gh`)** from the terminal:

  ```bash
  gh auth login
  gh pr status
  gh pr view --web
  ```

* Try **branches** for larger changes:

  ```bash
  git checkout -b feat/lab03-note
  # ...edit...
  git push -u origin feat/lab03-note
  ```

  Open the PR from that branch.

* Explore **worktrees** for parallel experiments without extra clones.

---

## Success Criteria (checklist)

* [ ] Your fork was created and synced.
* [ ] Codespace built and `git pull` showed you’re up to date.
* [ ] `students/lab03/<your_id>/README.md` exists with content (or `.gitkeep`).
* [ ] Commit pushed to your fork with a clear message.
* [ ] PR opened against upstream `main`.
* [ ] PR merged (or pending review with requested changes addressed).

---

## What to Do If You’re Stuck

* Read the exact error text; it usually names the command to run.
* Try **Sync fork** (GitHub) → `git pull` (Codespace) again.
* If the Codespace is cursed, **delete it** and recreate.
* Paste the error into your AI assistant and ask: *“Give me a step-by-step plan to fix this in Git”*.
* Ask in the course forum/office hours with a screenshot of the error + what you tried.

