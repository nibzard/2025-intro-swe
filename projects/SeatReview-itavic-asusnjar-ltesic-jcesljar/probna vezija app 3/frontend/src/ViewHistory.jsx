import React, { useState, useEffect } from "react";
import { useLanguage } from "./LanguageContext";

function ViewHistory({ onNavigateToSeat }) {
  const { language } = useLanguage();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const text = {
    hr: {
      title: "Povijest Pregleda",
      noHistory: "Jos nemate povijesti pregleda",
      explore: "Istražite stadione i pregledajte sjedala",
      venue: "Dvorana",
      section: "Sekcija",
      row: "Red",
      seat: "Sjedalo",
      viewedOn: "Pregledano",
      clickToView: "Kliknite za prikaz mape sjedala"
    },
    en: {
      title: "View History",
      noHistory: "You don't have any viewing history yet",
      explore: "Explore venues and view seats",
      venue: "Venue",
      section: "Section",
      row: "Row",
      seat: "Seat",
      viewedOn: "Viewed on",
      clickToView: "Click to view seat map"
    }
  };

  const t = text[language];

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/history", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error("Failed to load history");
      }

      const data = await res.json();
      setHistory(data.history || []);
    } catch (err) {
      console.error("Error loading history:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryItemClick = (item) => {
    if (onNavigateToSeat) {
      onNavigateToSeat(item.venue_id, item.section, item.row, item.seat_number);
    }
  };

  if (loading) {
    return <div className="loading">Loading history...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="history-container">
      <h2>{t.title}</h2>

      {history.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📜</div>
          <h3>{t.noHistory}</h3>
          <p>{t.explore}</p>
        </div>
      ) : (
        <div className="history-list">
          {history.map((item) => (
            <div
              key={item.id}
              className="history-item clickable"
              onClick={() => handleHistoryItemClick(item)}
              title={t.clickToView}
            >
              <div className="history-icon">👁️</div>
              <div className="history-details">
                <div className="history-venue">{item.venue_name}</div>
                <div className="history-seat">
                  {t.section} {item.section}, {t.row} {item.row}, {t.seat} {item.seat_number}
                </div>
                <div className="history-time">
                  {t.viewedOn}: {new Date(item.viewed_at).toLocaleString()}
                </div>
              </div>
              <div className="history-arrow">→</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ViewHistory;
