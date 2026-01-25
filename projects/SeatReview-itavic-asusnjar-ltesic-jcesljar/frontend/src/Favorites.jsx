import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import API_URL from "./config";
import { useLanguage } from "./LanguageContext";
import { translations } from "./translations";

const API_BASE = `${API_URL}/api`;

function Favorites({ onNavigateToSeat }) {
  const { language } = useLanguage();
  const t = translations[language];
  const { token } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchFavorites();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchFavorites = async () => {
    try {
      const response = await fetch(`${API_BASE}/favorites`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFavorites(data);
      }
    } catch (error) {
      console.error("Failed to fetch favorites:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (e, fav) => {
    e.stopPropagation(); // Prevent card click
    try {
      const response = await fetch(`${API_BASE}/favorites`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          venue_id: fav.venue_id,
          section: fav.section,
          row: fav.row,
          seat_number: fav.seat_number
        })
      });
      if (response.ok) {
        setFavorites(favorites.filter((f) => f.id !== fav.id));
      }
    } catch (error) {
      console.error("Failed to remove favorite:", error);
    }
  };

  const handleFavoriteClick = (fav) => {
    if (onNavigateToSeat) {
      onNavigateToSeat(fav.venue_id, fav.section, fav.row, fav.seat_number);
    }
  };

  if (!token) {
    return (
      <div className="card">
        <p className="no-content">{t.mustBeLoggedInFavorites}</p>
      </div>
    );
  }

  if (loading) {
    return <div className="loading-small">{t.loadingFavorites}</div>;
  }

  if (favorites.length === 0) {
    return (
      <div className="card">
        <p className="no-content">{t.noFavorites}</p>
      </div>
    );
  }

  return (
    <div className="favorites-container">
      <h3>⭐ {t.yourFavoriteSeats}</h3>
      <p className="favorites-hint">{t.clickFavoriteHint}</p>
      <div className="favorites-list">
        {favorites.map((fav) => (
          <div
            key={fav.id}
            className="favorite-card clickable"
            onClick={() => handleFavoriteClick(fav)}
          >
            <div className="favorite-icon">🎫</div>
            <div className="favorite-info">
              <h4>{fav.venue_name}</h4>
              <p className="favorite-seat-info">
                <span className="seat-badge" style={{ backgroundColor: getSectionColor(fav.section) }}>
                  {fav.section}
                </span>
                {t.row} {fav.row}, {t.seat} {fav.seat_number}
              </p>
              <span className="favorite-date">
                {t.added}: {new Date(fav.created_at).toLocaleDateString(language === 'hr' ? "hr-HR" : "en-US")}
              </span>
            </div>
            <div className="favorite-actions">
              <button className="btn-go-to-seat">
                {t.goToSeat} →
              </button>
              <button
                className="btn-remove-fav"
                onClick={(e) => removeFavorite(e, fav)}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getSectionColor(section) {
  const colors = {
    "ZAPAD": "#3b82f6",
    "ISTOK": "#22c55e",
    "SJEVER": "#f59e0b",
    "JUG": "#ef4444"
  };
  return colors[section] || "#6b7280";
}

export default Favorites;
