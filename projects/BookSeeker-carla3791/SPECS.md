# 📄 SPECS.md — BookSeeker (Technical Specification)

## 1. Project Overview
**Project Name & Working Title:** BookSeeker  
**Version / Date:** v1.0.0 – December 2025  
**High-Level Goal:** Web-based or CLI-based book search tool that allows users to semantically search for books based on natural language descriptions. Uses embeddings and a local FAISS vector store for fast and accurate retrieval.  
**Core Value Proposition:** Simplifies book discovery by allowing users to describe books in natural language rather than relying on exact titles or metadata.

---

## 2. Scope & Requirements

### 2.1 Goals (In-Scope)
- Semantic search using sentence embeddings (`sentence-transformers`).  
- Local FAISS index for fast nearest-neighbor retrieval.  
- JSON-based data store for book catalog.  
- REST API using FastAPI (`POST /search` endpoint).  
- Support for multiple query results (`k` parameter).  
- Basic CLI or minimal web UI for demonstration.  
- BDD tests (using `behave`) to validate user scenarios.

### 2.2 Non-Goals (Out-of-Scope)
- Multi-user authentication or profiles.  
- Cloud hosting or database integration beyond local JSON.  
- Full web frontend with rich UX (optional CLI/demo UI only).  
- Recommender system or personalized book suggestions.  

### 2.3 User Personas / Scenarios
**Primary User:** Reader or book enthusiast who wants to quickly find books matching a description.  
**Scenario:** Ana types “a fantasy book with dragons and political intrigue” → BookSeeker returns the closest matches from the local catalog with relevant metadata.

---

## 3. Technical Architecture

### 3.1 Tech Stack & Rationale
- **Language/Runtime:** Python 3.8+ (rapid prototyping, library support).  
- **Web Framework:** FastAPI (lightweight REST API).  
- **Embeddings:** `sentence-transformers` (`all-MiniLM-L6-v2`) for semantic encoding.  
- **Vector Store:** FAISS (efficient similarity search).  
- **Data Storage:** JSON (easy to modify and portable).  
- **Testing:** `behave` BDD framework for functional testing.  
- **Rationale:** Minimal infrastructure, reproducible locally, and scalable for future enhancements.

### 3.2 High-Level Architecture
User (CLI / Web UI)
|
v
FastAPI Endpoint (/search)
|
v
Embeddings Module (sentence-transformers)
|
v
FAISS Vector Store
|
v
JSON Book Catalog

## 4. Project Directory Structure
BookSeeker/
├── app.py # FastAPI application
├── embeddings.py # Embedding generation module
├── search.py # Query & FAISS search logic
├── books.json # Local book catalog
├── requirements.txt # Python dependencies
├── tests/
│ └── features/ # BDD tests
├── README.md
└── SPECS.md

## 5. Interface Specifications

## 5. Interface Specifications

### Web / CLI Interface
- **Input:** Text query describing a book.  
- **Output:** List of top-k books with metadata (title, author, description).  
- **Endpoints:**  

##User Workflows
1.User enters a description.
2.Backend converts description to embedding.
3.FAISS searches nearest book embeddings.
4.Return top-k results to the user.

## 6. Functional Specifications (Module Breakdown)

### Module A – API (`app.py`)
Handles requests, routing, input validation, and response formatting.

### Module B – Embeddings (`embeddings.py`)
Generates vector representations for text.

### Module C – Search (`search.py`)
Performs similarity search using FAISS.

### Module D – Data (`books.json`)
Stores book metadata and embeddings (precomputed).

### Module E – Testing (`tests/`)
BDD tests validating end-to-end functionality.

---

## 7. Development Plan & Milestones

- **Milestone 1:** Project setup, FastAPI skeleton, JSON book catalog. ✅  
- **Milestone 2:** Embeddings and FAISS integration. ✅  
- **Milestone 3:** API endpoint `/search` fully functional. ✅  
- **Milestone 4:** BDD tests implemented, documentation and `SPECS.md` finalized. ✅

---

## 8. Testing & Quality Strategy

### Unit Tests
- Embedding module, search module, API endpoint.

### Integration Tests
- Full query-to-result workflow using BDD.

### Quality Assurance
- Validate top-k results.  
- Error handling for invalid input.  
- Ensure JSON catalog integrity.

---

## 9. Future Improvements (Roadmap)

- Web frontend with richer UI.  
- Integration with external book APIs for larger catalogs.  
- Persistent database storage instead of JSON.  
- Multi-user profiles and personalized recommendations.  
- Dockerized deployment for reproducibility.
