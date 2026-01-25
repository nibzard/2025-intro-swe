import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

const API_BASE = "http://localhost:5000/api";

function ViewHistory({ onNavigateToSeat }) {
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
        <p className="no-content">Morate biti prijavljeni da biste vidjeli povijest.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="loading-small">Ucitavanje povijesti...</div>;
  }

  if (history.length === 0) {
    return (
      <div className="card">
        <p className="no-content">Nemate povijest pregledavanja.</p>
      </div>
    );
  }

  return (
    <div className="history-container">
      <h3>Povijest pregledavanja</h3>
      <div className="history-list">
        {history.map((item) => (
          <div key={item.id} className="history-card">
            <div className="history-info">
              <h4>{item.venue_name}</h4>
              <p>
                Sekcija {item.section}, Red {item.row}, Sjedalo {item.seat_number}
              </p>
              <span className="history-date">
                Pregledano: {new Date(item.viewed_at).toLocaleString("hr-HR")}
              </span>
            </div>
            <button
              className="btn-secondary"
              onClick={() => handleNavigate(item)}
            >
              Pogledaj ponovo
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ViewHistory;
