
import React, { useEffect, useState } from "react";

const API_BASE = "http://localhost:5000/api";

function App() {
  const [venues, setVenues] = useState([]);
  const [selectedVenueId, setSelectedVenueId] = useState("");
  const [tab, setTab] = useState("review"); // review | gallery | insights

  useEffect(() => {
    fetch(`${API_BASE}/venues`)
      .then((r) => r.json())
      .then(setVenues)
      .catch((e) => console.error("Failed to load venues", e));
  }, []);

  useEffect(() => {
    if (venues.length > 0 && !selectedVenueId) {
      setSelectedVenueId(String(venues[0].id));
    }
  }, [venues, selectedVenueId]);

  return (
    <div className="container">
      <h1>Seat Review</h1>
      <p className="subtitle">
        Rate your seat comfort in stadiums, theatres, arenas and more.
      </p>

      <div className="card">
        <label className="label">Select Venue</label>
        <select
          className="input"
          value={selectedVenueId}
          onChange={(e) => setSelectedVenueId(e.target.value)}
        >
          {venues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      </div>

      <div className="tabs">
        <button
          className={tab === "review" ? "tab active" : "tab"}
          onClick={() => setTab("review")}
        >
          Submit Review
        </button>
        <button
          className={tab === "gallery" ? "tab active" : "tab"}
          onClick={() => setTab("gallery")}
        >
          Venue Photos
        </button>
        <button
          className={tab === "insights" ? "tab active" : "tab"}
          onClick={() => setTab("insights")}
        >
          Venue Insights
        </button>
      </div>

      {selectedVenueId && tab === "review" && (
        <ReviewForm venueId={selectedVenueId} />
      )}
      {selectedVenueId && tab === "gallery" && (
        <VenueGallery venueId={selectedVenueId} />
      )}
      {selectedVenueId && tab === "insights" && (
        <VenueInsights venueId={selectedVenueId} />
      )}
    </div>
  );
}

function ReviewForm({ venueId }) {
  const [form, setForm] = useState({
    section: "",
    row: "",
    seat_number: "",
    rating_comfort: "3",
    rating_legroom: "3",
    rating_visibility: "3",
    rating_cleanliness: "3",
    text_review: ""
  });
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState(null);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Submitting...");

    try {
      const fd = new FormData();
      fd.append("venue_id", venueId);
      Object.entries(form).forEach(([key, value]) => {
        fd.append(key, value);
      });
      files.forEach((file) => fd.append("photos", file));

      const res = await fetch(`${API_BASE}/reviews`, {
        method: "POST",
        body: fd
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit review");
      }

      setStatus("Review submitted successfully ✅");
      setForm((f) => ({
        ...f,
        text_review: ""
      }));
      setFiles([]);
    } catch (err) {
      console.error(err);
      setStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div className="card">
      <h2>Submit a Seat Review</h2>
      <form onSubmit={handleSubmit} className="form">
        <div className="grid-3">
          <div>
            <label className="label">Section</label>
            <input
              className="input"
              name="section"
              value={form.section}
              onChange={handleChange}
              placeholder="e.g. A"
            />
          </div>
          <div>
            <label className="label">Row</label>
            <input
              className="input"
              name="row"
              value={form.row}
              onChange={handleChange}
              placeholder="e.g. 12"
            />
          </div>
          <div>
            <label className="label">Seat</label>
            <input
              className="input"
              name="seat_number"
              value={form.seat_number}
              onChange={handleChange}
              placeholder="e.g. 18"
            />
          </div>
        </div>

        <div className="grid-2">
          <RatingSelect
            label="Comfort"
            name="rating_comfort"
            value={form.rating_comfort}
            onChange={handleChange}
          />
          <RatingSelect
            label="Legroom"
            name="rating_legroom"
            value={form.rating_legroom}
            onChange={handleChange}
          />
          <RatingSelect
            label="Visibility"
            name="rating_visibility"
            value={form.rating_visibility}
            onChange={handleChange}
          />
          <RatingSelect
            label="Cleanliness"
            name="rating_cleanliness"
            value={form.rating_cleanliness}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="label">Describe your experience (optional)</label>
          <textarea
            className="input textarea"
            name="text_review"
            value={form.text_review}
            onChange={handleChange}
            placeholder="Legroom very tight, view blocked by railing..."
          />
        </div>

        <div>
          <label className="label">
            Seat photos (optional, up to 5) – visibility, legroom, damage...
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>

        <button type="submit" className="btn-primary">
          Submit Review
        </button>
        {status && <p className="status">{status}</p>}
      </form>
    </div>
  );
}

function RatingSelect({ label, name, value, onChange }) {
  return (
    <div>
      <label className="label">{label}</label>
      <select
        className="input"
        name={name}
        value={value}
        onChange={onChange}
        required
      >
        <option value="1">1 – Very poor</option>
        <option value="2">2 – Poor</option>
        <option value="3">3 – OK</option>
        <option value="4">4 – Good</option>
        <option value="5">5 – Excellent</option>
      </select>
    </div>
  );
}

function VenueGallery({ venueId }) {
  const [photos, setPhotos] = useState([]);
  const [status, setStatus] = useState("Loading...");

  const loadPhotos = () => {
    setStatus("Loading...");
    fetch(`${API_BASE}/venues/${venueId}/photos`)
      .then((r) => r.json())
      .then((data) => {
        setPhotos(data);
        setStatus(data.length === 0 ? "No photos yet." : null);
      })
      .catch((e) => {
        console.error(e);
        setStatus("Failed to load photos.");
      });
  };

  useEffect(() => {
    loadPhotos();
  }, [venueId]);

  return (
    <div className="card">
      <div className="card-header">
        <h2>Seat Photo Gallery</h2>
        <button className="btn-secondary" onClick={loadPhotos}>
          Refresh
        </button>
      </div>

      {status && <p className="status">{status}</p>}

      <div className="gallery">
        {photos.map((p) => (
          <div key={p.id} className="gallery-item">
            <img src={`http://localhost:5000${p.file_path}`} alt="Seat" />
          </div>
        ))}
      </div>
    </div>
  );
}

function VenueInsights({ venueId }) {
  const [stats, setStats] = useState(null);
  const [insight, setInsight] = useState(null);
  const [status, setStatus] = useState("Loading...");
  const [aiStatus, setAiStatus] = useState(null);

  const loadStats = () => {
    setStatus("Loading...");
    Promise.all([
      fetch(`${API_BASE}/venues/${venueId}/stats`).then((r) => r.json()),
      fetch(`${API_BASE}/venues/${venueId}/insights`).then(async (r) => {
        if (r.status === 404) return null;
        return r.json();
      })
    ])
      .then(([statsData, insightData]) => {
        setStats(statsData);
        setInsight(insightData);
        setStatus(null);
      })
      .catch((e) => {
        console.error(e);
        setStatus("Failed to load insights.");
      });
  };

  useEffect(() => {
    loadStats();
  }, [venueId]);

  const handleGenerateAI = async () => {
    setAiStatus("Generating AI summary...");
    try {
      const res = await fetch(
        `${API_BASE}/venues/${venueId}/insights/generate`,
        {
          method: "POST"
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate insights");
      }
      setInsight(data);
      setAiStatus("AI summary generated ✅");
    } catch (err) {
      console.error(err);
      setAiStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>Venue Insights</h2>
        <button className="btn-secondary" onClick={loadStats}>
          Refresh
        </button>
      </div>

      {status && <p className="status">{status}</p>}

      {stats && (
        <>
          <div className="stats-grid">
            <StatBox
              label="Total Reviews"
              value={stats.total_reviews || 0}
            />
            <StatBox
              label="Comfort"
              value={stats.avg_comfort?.toFixed(1) || "-"}
            />
            <StatBox
              label="Legroom"
              value={stats.avg_legroom?.toFixed(1) || "-"}
            />
            <StatBox
              label="Visibility"
              value={stats.avg_visibility?.toFixed(1) || "-"}
            />
            <StatBox
              label="Cleanliness"
              value={stats.avg_cleanliness?.toFixed(1) || "-"}
            />
          </div>

          {stats.top_words && stats.top_words.length > 0 && (
            <div className="top-words">
              <h3>Frequent complaint words</h3>
              <ul>
                {stats.top_words.map((w) => (
                  <li key={w.word}>
                    {w.word} <span className="chip">×{w.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <div className="ai-section">
        <div className="ai-header">
          <h3>AI-generated Summary</h3>
          <button className="btn-primary" onClick={handleGenerateAI}>
            Generate / Refresh AI Insights
          </button>
        </div>
        {aiStatus && <p className="status">{aiStatus}</p>}
        {insight ? (
          <>
            <p className="ai-time">
              Last generated: {insight.created_at || "unknown"}
            </p>
            <pre className="ai-summary">{insight.summary_text}</pre>
          </>
        ) : (
          <p className="muted">
            No AI summary yet. Click the button to generate one (if the backend
            has an OpenAI API key).
          </p>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="stat-box">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

export default App;
