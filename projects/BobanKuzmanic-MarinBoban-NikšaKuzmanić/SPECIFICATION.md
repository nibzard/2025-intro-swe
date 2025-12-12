# 📄 PROJECT SPECIFICATIONS

## 1. Project Overview

**Project Name & Working Title:**  
Posture Optimization App for Sitting Position  

**Version / Date:**  
v0.1.0 Baseline – 2025-12-01  

**High-Level Goal:**  
The app tracks a user’s sitting posture using webcam or body/head position tracking technologies and provides real-time alerts when posture deviates from ergonomic standards. It is designed for office workers, students, and remote employees who spend long hours sitting.  

**Core Value Proposition:**  
By providing instant feedback on posture, the app helps prevent discomfort, back pain, and long-term musculoskeletal problems. Users can adjust their sitting position immediately, promoting healthier work habits.  

---

## 2. Scope & Requirements

### 2.1 Goals (In-Scope)  
- Real-time posture detection via webcam or tracking device.  
- Immediate alerts for incorrect posture (visual and/or auditory).  
- Track posture history per session and provide basic analytics.  
- Configurable settings: alert sensitivity, frequency, and camera/device selection.  
- Local-only data storage to preserve privacy.  

### 2.2 Non-Goals (Out-of-Scope)  
- Multi-user authentication or cloud sync.  
- Advanced AI coaching beyond posture detection.  
- Mobile app support or external app integrations in MVP.  
- Real-time multi-person tracking.  

### 2.3 User Personas / Scenarios  
**Persona:** Remote office worker, 28 years old, spends ~8 hours/day at a desk.  
**Scenario:** Alice launches the app in the morning. The app monitors her posture silently. After 30 seconds of slouching, a small popup or sound reminds her to correct her posture. At the end of the day, she can see how well she maintained proper posture.  

---

## 3. Technical Architecture

### 3.1 Tech Stack & Rationale  
- **Language/Runtime:** Python 3.12 or C#  
- **Frameworks / Libraries:** OpenCV, Freetrack (if hardware tracking used), GUI library TBD (PySide6 / WPF)  
- **Storage:** SQLite or local JSON logs  
- **Rationale:**  
  - Python chosen for computer vision prototyping and rapid development.  
  - C# considered for native desktop GUI integration (Windows).  
  - OpenCV provides robust computer vision and webcam handling.  
  - Local storage ensures privacy and avoids cloud dependencies.

### 3.2 High-Level Architecture

The system consists of the following main components:

1. **User Webcam / Tracking Device**  
   Captures the live video or positional data of the user. This serves as the primary input for posture detection.

2. **Posture Detection Module**  
   Processes frames from the webcam or tracking device using computer vision libraries (OpenCV, Freetrack, MediaPipe). It estimates key body/head points and classifies the user’s posture as correct or incorrect.

3. **Analysis & Alert Logic**  
   Receives posture data from the detection module and applies rules for alerting. For example, if bad posture is detected continuously for a configurable duration, it triggers a visual or auditory alert.

4. **GUI / Notifications**  
   Displays the live camera feed with posture overlay, alert popups, and session statistics. It also provides controls for settings and pausing/resuming tracking.

5. **Local Storage**  
   Logs posture events and session data into a local SQLite database (or JSON files). This enables session review, reporting, and analytics without relying on cloud services.

**Interaction Flow:**  

- The webcam/tracking device streams data to the Posture Detection Module.  
- Detection Module outputs posture states to the Analysis & Alert Logic.  
- Alert Logic triggers GUI notifications when necessary.  
- All posture events are logged in Local Storage for future review.  

This design keeps processing local to the user’s device, ensures privacy, and maintains modularity so that components can be updated independently.

### 3.3 Project Directory Structure

├── src/
│ ├── detection/
│ ├── analysis/
│ ├── storage/
│ └── ui/
├── tests/
├── config/
└── README.md

---

## 4. Data Design (The Domain Model)

**Core Entities:**  
- `UserSession` – Single posture tracking session.  
- `PostureEvent` – Captures posture state (Good/Bad) with timestamp.  
- `Settings` – User preferences for alerts and sensitivity.  

**Schema / Data Structure:**  

SQLite tables:  
```sql
CREATE TABLE user_sessions (
    id INTEGER PRIMARY KEY,
    start_time DATETIME,
    end_time DATETIME
);

CREATE TABLE posture_events (
    id INTEGER PRIMARY KEY,
    session_id INTEGER,
    timestamp DATETIME,
    posture_state TEXT,
    FOREIGN KEY(session_id) REFERENCES user_sessions(id)
);

CREATE TABLE settings (
    id INTEGER PRIMARY KEY,
    alert_frequency_seconds INTEGER,
    sensitivity REAL,
    camera_index INTEGER
);
```

**Storage Strategy:**

- All session data stored locally in SQLite.  
- Optional JSON export for offline analytics.  

---

## 5. Interface Specifications

### GUI (Desktop App)

**UI Components:**  
- **Sidebar:** Session stats, settings button  
- **Main View:** Live camera feed with posture overlay  
- **Settings Modal:** Sensitivity, camera/device selection, alert preferences  

**Interactions:**  
- Hotkey to pause/resume tracking  
- Clickable alerts to dismiss  
- Drag-and-drop camera/device selection  

---

## 6. Functional Specifications (Module Breakdown)

**Module A – Config Loader:**  
- Loads settings from local storage  
- Validates camera/device selection and sensitivity ranges  
- Handles missing/invalid settings  

**Module B – Posture Detector:**  
- Captures frames from webcam/tracking device  
- Uses OpenCV/Freetrack for keypoint estimation  
- Classifies posture state (GOOD/BAD)  
- Sends events to Analysis Module  

**Module C – Analysis & Alerts:**  
- Monitors posture events over time  
- Triggers visual/audio alerts if bad posture persists  
- Logs posture events to SQLite  

**Module D – Reporting / Session History:**  
- Aggregates events per session  
- Generates stats: % good posture, longest bad posture streak  

---

## 7. Development Plan & Milestones

**Milestone 1 (Skeleton):** Project setup, basic UI, webcam feed displays.  
**Milestone 2 (Core Logic):** Pose estimation and posture classification working.  
**Milestone 3 (Interface):** Alerts trigger correctly; GUI overlays live posture.  
**Milestone 4 (Polish):** Settings modal, session history, error handling, README.  

**Definition of Done:**  
- Unit and integration tests pass  
- App launches on clean install  
- Alerts work as expected  
- Settings persist between sessions  

---

## 8. Testing & Quality Strategy

**Unit Tests:**  
- Pose classification logic  
- Settings validation  
- Database read/write  

**Integration Tests:**  
- Simulated webcam/device input triggers alerts  
- Full session logging end-to-end  

**Fixtures:**  
- Recorded video sequences representing good and bad posture  

**Performance Targets:**  
- Frame processing <200ms  
- Runs smoothly on standard laptop without GPU  

---

## 9. Future Improvements (Roadmap)

- Cloud sync and multi-device support  
- Mobile companion app  
- AI suggestions for posture correction  
- Gamification and streak tracking  
- Integration with calendar break reminders