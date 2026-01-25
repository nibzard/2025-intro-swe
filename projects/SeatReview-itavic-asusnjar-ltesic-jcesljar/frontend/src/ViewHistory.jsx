import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import API_URL from "./config";
import { useLanguage } from "./LanguageContext";
import { translations } from "./translations";

const API_BASE = `${API_URL}/api`;

function ViewHistory({ onNavigateToSeat }) {
  const { language } = useLanguage();
  const t = translations[language];
  const { token } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchHistory();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_BASE}/history`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (item) => {
    if (onNavigateToSeat) {
      onNavigateToSeat(item.venue_id, item.section, item.row, item.seat_number);
    }
  };

  if (!token) {
    return (
      <div className="card">
        <p className="no-content">{t.mustBeLoggedInHistory}</p>
      </div>
    );
  }

  if (loading) {
    return <div className="loading-small">{t.loadingHistory}</div>;
  }

  if (history.length === 0) {
    return (
      <div className="card">
        <p className="no-content">{t.noViewHistory}</p>
      </div>
    );
  }

  return (
    <div className="history-container">
      <h3>{t.viewHistory}</h3>
      <div className="history-list">
        {history.map((item) => (
          <div key={item.id} className="history-card">
            <div className="history-info">
              <h4>{item.venue_name}</h4>
              <p>
                {t.section} {item.section}, {t.row} {item.row}, {t.seat} {item.seat_number}
              </p>
              <span className="history-date">
                {t.viewed}: {new Date(item.viewed_at).toLocaleString(language === 'hr' ? "hr-HR" : "en-US")}
              </span>
            </div>
            <button
              className="btn-secondary"
              onClick={() => handleNavigate(item)}
            >
              {t.viewAgain}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ViewHistory;
