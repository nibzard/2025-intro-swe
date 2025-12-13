# 📄 Engineering Specification Template

## 1. Project Overview
*   **Project Name & Working Title:**
*   **Version / Date:** (e.g., v0.1.0 Baseline)
*   **High-Level Goal:** A 2-3 sentence elevator pitch describing what the software does and who it is for.
*   **Core Value Proposition:** What specific problem does this solve? Why is it useful?

## 2. Scope & Requirements
### 2.1 Goals (In-Scope)
*   List specific, achievable functionality for the initial release (MVP).
*   *Example: "Must support offline mode," "Must parse JSONL files."*

### 2.2 Non-Goals (Out-of-Scope)
*   Explicitly list what you will **not** build in this version to avoid scope creep.
*   *Example: "No multi-user authentication," "No cloud sync," "No real-time collaboration."*

### 2.3 User Personas / Scenarios
*   Briefly describe who uses the tool and a specific scenario of usage.
*   *Example: "A researcher uses the CLI to batch-process 50 PDF files."*

## 3. Technical Architecture
### 3.1 Tech Stack & Rationale
*   **Language/Runtime:** (e.g., Python 3.12+, Node.js 16+, Rust)
*   **Frameworks:** (e.g., React, FastAPI, Tauri, Typer)
*   **Storage:** (e.g., SQLite, JSON files, PostgreSQL)
*   **Rationale:** Briefly explain *why* these technologies were chosen over alternatives (e.g., "Chosen for low memory footprint" or "Chosen for rich ecosystem").

### 3.2 High-Level Architecture
*   Describe the system components and how they interact (e.g., Frontend <-> API <-> Database).
*   *Optional:* ASCII diagram of data flow.

### 3.3 Project Directory Structure
*   A tentative layout of the folders and key files.
    ```text
    project_root/
      ├── src/
      │   ├── api/
      │   ├── storage/
      │   └── ui/
      ├── tests/
      ├── config/
      └── README.md
    ```

## 4. Data Design (The Domain Model)
*   **Core Entities:** What are the "nouns" in your system? (e.g., User, Project, Note, Transaction).
*   **Schema / Data Structure:**
    *   If using SQL: Table definitions and relationships.
    *   If using NoSQL/Files: JSON schemas or file formats.
*   **Storage Strategy:** How is data persisted? (e.g., "One JSON file per session," "Local SQLite database").

## 5. Interface Specifications
*   *Choose the section below that fits your project type:*

### A. If Building an API / Web App:
*   **Endpoints:** List key routes (e.g., `GET /api/projects`, `POST /run`).
*   **Request/Response bodies:** Example JSON payloads.

### B. If Building a CLI:
*   **Commands:** List commands and arguments (e.g., `tool run --config <path>`, `tool validate`).
*   **Output:** Describe what the user sees (Text tables, JSON, progress bars).

### C. If Building a GUI (Desktop/Mobile):
*   **UI Components:** Sidebar, Main View, Settings Modal.
*   **Interactions:** Hotkeys, Drag-and-drop behavior.

## 6. Functional Specifications (Module breakdown)
*   Break down the logic into modular components.
*   **Module A (e.g., Config Loader):** Input, Validation rules, Error handling.
*   **Module B (e.g., The Processor):** Logic steps, algorithm description, edge case handling.
*   **Module C (e.g., The Reporter):** Template logic, file generation.

## 7. Development Plan & Milestones
*   **Milestone 1 (Skeleton):** Basic project setup, config loading, "Hello World" flow.
*   **Milestone 2 (Core Logic):** The main algorithm or data processing works.
*   **Milestone 3 (Interface):** The UI/CLI is usable and pretty.
*   **Milestone 4 (Polish):** Documentation, error handling, final bug fixes.
*   **Definition of Done:** A checklist of what must be true to call the project "finished" (e.g., "Test coverage > 80%", "Runs on clean install").

## 8. Testing & Quality Strategy
*   **Unit Tests:** What logic needs isolated testing? (e.g., Math calculations, parsers).
*   **Integration Tests:** Testing the full flow (e.g., "Run CLI against sample file").
*   **Fixtures:** What sample data will you create to verify the code?
*   **Performance Targets:** (Optional) e.g., "Must load under 1s", "Must handle 10k records."

## 9. Future Improvements (Roadmap)
*   Features you thought of but cut from the MVP.
*   Ideas for version 2.0 (e.g., "Add Cloud Sync", "Add Dark Mode").

---

# 💡 Implementation Guide for Students

Here is how to effectively fill out the template above, using the provided examples as reference.

### 1. The "Non-Goals" are as important as Goals
In the **LLM Answer Watcher** example, the author explicitly states: *"No scheduling, no diffing over time, no alerts."*
*   **Why do this?** This prevents you from getting overwhelmed. Define exactly what you are **not** building so you don't waste time on features that aren't core to the assignment.

### 2. Data Design is the Backbone
In the **Claude Project Viewer** example, the specification clearly maps out the structure of the `.jsonl` files and the message types (*User, Assistant, Tool Result*).
*   **Advice:** Don't write a single line of code until you know the shape of your data. If you are using a database, write the SQL schema. If you are using files, write a JSON example.

### 3. Modular "Domain Driven" Design
In the **LLM Answer Watcher** example, the code is split into logical domains: `config`, `llm_runner`, `extractor`, `storage`.
*   **Advice:** Do not put everything in one file. Split your spec (Section 6) into logical "jobs" the software needs to do. This makes writing the code much easier.

### 4. Think "API-First" (Even for CLIs)
Both **AgentProbe** and **LLM Answer Watcher** emphasize a stable contract.
*   **Advice:** Define exactly what arguments your functions or API routes need before you write them. If you are building a CLI, write down the help text (e.g., `tool --help`) before implementing the logic.

### 5. Define "Success" (Definition of Done)
The **LLM Answer Watcher** example has a detailed checklist at the end (Section 10).
*   **Advice:** Create a checklist that proves your project works.
    *   *Bad:* "The project runs."
    *   *Good:* "The CLI returns exit code 0 on success, exit code 1 on config error, and generates a report.html file in the output folder."