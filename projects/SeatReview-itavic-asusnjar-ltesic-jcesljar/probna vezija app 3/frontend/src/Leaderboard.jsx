import React, { useState, useEffect } from "react";
import { useLanguage } from "./LanguageContext";

function Leaderboard() {
  const { language } = useLanguage();
  const [topReviewers, setTopReviewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const text = {
    hr: {
      title: "Top Recenzenti",
      rank: "Rang",
      reviewer: "Recenzent",
      reviews: "Recenzija",
      avgRating: "Prosječna Ocjena",
      followers: "Pratitelja",
      noData: "Nema podataka"
    },
    en: {
      title: "Top Reviewers",
      rank: "Rank",
      reviewer: "Reviewer",
      reviews: "Reviews",
      avgRating: "Avg Rating",
      followers: "Followers",
      noData: "No data available"
    }
  };

  const t = text[language];

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/leaderboard", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error("Failed to load leaderboard");
      }

      const data = await res.json();
      setTopReviewers(data.topReviewers || []);
    } catch (err) {
      console.error("Error loading leaderboard:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getMedalIcon = (rank) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `${rank}.`;
  };

  if (loading) {
    return <div className="loading">Loading leaderboard...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="leaderboard-container">
      <h2>{t.title}</h2>

      {topReviewers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏆</div>
          <h3>{t.noData}</h3>
        </div>
      ) : (
        <div className="leaderboard-table">
          <div className="table-header">
            <div className="col-rank">{t.rank}</div>
            <div className="col-reviewer">{t.reviewer}</div>
            <div className="col-reviews">{t.reviews}</div>
            <div className="col-rating">{t.avgRating}</div>
            <div className="col-followers">{t.followers}</div>
          </div>
          {topReviewers.map((reviewer, index) => (
            <div key={reviewer.id} className={`table-row ${index < 3 ? 'top-three' : ''}`}>
              <div className="col-rank">
                <span className="rank-badge">{getMedalIcon(index + 1)}</span>
              </div>
              <div className="col-reviewer">
                <div className="reviewer-email">{reviewer.email}</div>
              </div>
              <div className="col-reviews">
                <span className="badge">{reviewer.review_count}</span>
              </div>
              <div className="col-rating">
                <span className="rating-value">⭐ {reviewer.avg_rating?.toFixed(1) || 'N/A'}</span>
              </div>
              <div className="col-followers">
                <span className="follower-count">👥 {reviewer.follower_count || 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Leaderboard;
