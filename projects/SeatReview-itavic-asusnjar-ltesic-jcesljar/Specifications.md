# *1. Project Overview*

### *Project Name & Working Title*

*Seat Review – A System for Evaluating Seating Comfort in Public Venues*

### *High-Level Goal (Elevator Pitch)*

Seat Review is a platform that allows visitors of stadiums, theatres, arenas, and other public venues to submit objective reviews about the comfort of their seats. The system aggregates and analyzes these crowdsourced reviews — including *optional seat photos* — to help venues understand common comfort issues and improve visitor satisfaction.

### *Core Value Proposition*

Visitors often experience seat discomfort, poor visibility, lack of legroom, or damaged seating, but there is no structured way to report these issues. Seat Review solves this by providing a simple review system with structured ratings, text input, and photo uploads. The platform collects and analyzes seat comfort data to highlight patterns and insights — without promising issue resolution.

---

# *2. Scope & Requirements*

## *2.1 Goals (In-Scope for MVP)*

* Allow users to select a venue and input seating details (section, row, seat number).
* Submit a structured review with ratings (comfort, legroom, cleanliness, visibility).
* Submit *optional seat photos* (e.g., visibility obstruction, worn cushion, legroom issues).
* Store all reviews + photos in a local SQLite + file storage folder.
* Display average comfort score per seat/section.
* Provide a “Venue Insights” page with:

  * top issues
  * recurring complaints
  * AI-generated summary via OpenAI
* Allow anonymous submissions (no authentication).
* Simple web UI optimized for mobile.

## *2.2 Non-Goals (Out of Scope)*

* No ticket sales / seat reservations.
* No maintenance request system.
* No guarantee that issues will be fixed.
* No user accounts (for MVP).
* No photo moderation or AI image classification.
* No real-time updates or live charts.
* No push notifications.

## *2.3 User Personas / Scenarios*

### *Visitor (Primary)*

Wants to quickly rate their seat and upload a photo showing the issue.

*Scenario:*
A concert-goer notices a railing obstructing their view. They take a photo, upload it in the review form, and rate visibility.

### *Venue Manager (Secondary)*

Wants to see recurring issues and photo examples but is not notified or required to act.

*Scenario:*
The manager checks insights and sees 20+ photo submissions showing damaged armrests in Section B.

---

# *3. Technical Architecture*

## *3.1 Tech Stack & Rationale*

*Frontend:* React

* Easy for components like photo upload fields
* Large ecosystem

*Backend:* Node.js + Express

* Simple REST API
* Easy integration with file upload libraries

*Database:* SQLite

* Lightweight
* Suitable for student projects

*File Storage:*

* /uploads/ folder for photos (local filesystem; simple and sufficient)

*LLM:* OpenAI GPT models

* Generates insights based on reviews and text data
* (Photos are *not* sent to OpenAI in MVP)

## *3.2 High-Level Architecture*


[React Frontend] --(photo + JSON)--> [Express API]
                           |
                           v
                    [Uploads Folder]
                           |
                           v
                       [SQLite DB]
                           |
                           v
                 [OpenAI API Summaries]


## *3.3 Project Directory Structure*


seat-review/
  ├── backend/
  │   ├── api/
  │   ├── db/
  │   ├── uploads/   ← seat photos stored here
  │   └── index.js
  ├── frontend/
  │   └── src/
  ├── tests/
  ├── config/
  └── README.md


---

# *4. Data Design (Domain Model)*

### *Core Entities*

* Venue
* Seat
* Review
* Photo
* AIInsight

### *Tables (SQLite)*

*Venue*

* id (PK)
* name
* address
* type

*Review*

* id (PK)
* venue_id (FK)
* section
* row
* seat_number
* rating_comfort
* rating_legroom
* rating_visibility
* rating_cleanliness
* text_review
* created_at

*Photo*

* id (PK)
* review_id (FK)
* file_path

*AIInsight*

* id (PK)
* venue_id (FK)
* summary_text
* top_issues_json
* created_at

---

# *5. Interface Specifications*

### *REST API*

#### *POST /api/reviews*

Multipart form-data example:

Fields:


venue_id: 1  
section: A  
row: 12  
seat_number: 18
rating_comfort: 3  
rating_legroom: 2  
...
text_review: "Legroom very tight"
photo[]: file upload


#### *GET /api/venues/:id/photos*

Returns file paths for public display.

#### *GET /api/reviews/:id*

Returns review + associated photo file paths.

---

# *6. Functional Specifications*

### *Module A — Review Collector*

* Handles text + photo uploads
* Stores metadata in SQLite
* Saves files to /uploads/

### *Module B — Analytics Engine*

* Calculates average ratings
* Identifies frequent complaint words
* Prepares text for AI summarization

### *Module C — AI Insights Generator*

* Sends aggregated text to OpenAI
* Stores summary + top issues

### *Module D — Frontend Interface*

* Seat review form with photo upload button
* Gallery view for user-submitted seat photos
* Insights dashboard

---

# *7. Development Plan & Milestones*

### *Milestone 1 — Setup*

* Project skeleton
* Database
* Express server
* React app

### *Milestone 2 — Core Logic*

* Review + photo upload endpoint
* File storage system
* Database schema complete

### *Milestone 3 — Interface*

* Review form with image upload
* Venue gallery
* Insights dashboard

### *Milestone 4 — Polish*

* AI summaries
* UI polish
* Sample data

### *Definition of Done*

* User can submit a review *with photos*
* Photos saved locally and visible in gallery
* Reviews saved in SQLite
* Insights generated from text reviews
* No major UI or backend errors

---

# *8. Testing & Quality Strategy*

### *Unit Tests*

* Rating validation
* File upload validation

### *Integration Tests*

* Submit review + photo → check DB + file exists
* Insights generation → correct summary

### *Fixtures*

* Example venues
* Dummy images

### *Performance Targets*

* Upload photo < 2 seconds
* Load gallery < 1 second for first 20 photos

---

# *9. Future Improvements (Roadmap)*

* AI photo recognition (“detect obstructed views”)
* Photo moderation
* Seat map integration
* User accounts
* Dark mode
* Multi-language support
* Cloud photo storage (S3, Google Cloud)
