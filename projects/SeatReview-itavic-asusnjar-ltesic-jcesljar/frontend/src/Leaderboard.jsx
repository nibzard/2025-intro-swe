import React, { useState, useEffect } from "react";
import API_URL from "./config";

const API_BASE = `${API_URL}/api`;

function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`${API_BASE}/leaderboard`);
      if (response.ok) {
        const data = await response.json();
        setLeaders(data);
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-small">Ucitavanje ljestvice...</div>;
  }

  if (leaders.length === 0) {
    return (
      <div className="card">
        <p className="no-content">Nema recenzija za prikaz ljestvice.</p>
      </div>
    );
  }

  return (
    <div className="leaderboard-container">
      <h3>Top Recenzenti</h3>
      <div className="leaderboard-list">
        {leaders.map((leader, index) => (
          <div key={leader.user_id} className="leaderboard-card">
            <div className="leaderboard-rank">
              {index === 0 && <span className="medal gold">🥇</span>}
              {index === 1 && <span className="medal silver">🥈</span>}
              {index === 2 && <span className="medal bronze">🥉</span>}
              {index > 2 && <span className="rank-number">#{index + 1}</span>}
            </div>
            <div className="leaderboard-info">
              <h4>{leader.email?.split("@")[0] || "Korisnik"}</h4>
              <div className="leaderboard-stats">
                <span className="stat">
                  <strong>{leader.review_count}</strong> recenzija
                </span>
                <span className="stat">
                  <strong>{leader.total_likes || 0}</strong> lajkova
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Leaderboard;
