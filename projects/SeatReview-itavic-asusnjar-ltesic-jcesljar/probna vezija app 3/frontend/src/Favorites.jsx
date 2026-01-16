import React, { useState, useEffect } from "react";
import { useLanguage } from "./LanguageContext";

function Favorites() {
  const { language } = useLanguage();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const text = {
    hr: {
      title: "Omiljeni",
      noFavorites: "Još nemate omiljenih sjedala",
      addFavorite: "Posjetite stadion i označite sjedala kao omiljene",
      venue: "Dvorana",
      section: "Sekcija",
      row: "Red",
      seat: "Sjedalo",
      addedOn: "Dodano",
      remove: "Ukloni"
    },
    en: {
      title: "Favorites",
      noFavorites: "You don't have any favorite seats yet",
      addFavorite: "Visit a venue and mark seats as favorites",
      venue: "Venue",
      section: "Section",
      row: "Row",
      seat: "Seat",
      addedOn: "Added on",
      remove: "Remove"
    }
  };

  const t = text[language];

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/favorites", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error("Failed to load favorites");
      }

      const data = await res.json();
      setFavorites(data.favorites || []);
    } catch (err) {
      console.error("Error loading favorites:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (favorite) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/favorites", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          venue_id: favorite.venue_id,
          section: favorite.section,
          row: favorite.row,
          seat_number: favorite.seat_number
        })
      });

      if (!res.ok) {
        throw new Error("Failed to remove favorite");
      }

      // Reload favorites list
      loadFavorites();
    } catch (err) {
      console.error("Error removing favorite:", err);
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="loading">Loading favorites...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="favorites-container">
      <h2>{t.title}</h2>

      {favorites.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">⭐</div>
          <h3>{t.noFavorites}</h3>
          <p>{t.addFavorite}</p>
        </div>
      ) : (
        <div className="favorites-grid">
          {favorites.map((fav) => (
            <div key={fav.id} className="favorite-card">
              <div className="favorite-header">
                <h3>{fav.venue_name}</h3>
                <button
                  className="btn-remove-favorite"
                  onClick={() => removeFavorite(fav)}
                >
                  ✕
                </button>
              </div>
              <div className="favorite-details">
                <div className="detail-row">
                  <span className="label">{t.section}:</span>
                  <span className="value">{fav.section}</span>
                </div>
                <div className="detail-row">
                  <span className="label">{t.row}:</span>
                  <span className="value">{fav.row}</span>
                </div>
                <div className="detail-row">
                  <span className="label">{t.seat}:</span>
                  <span className="value">{fav.seat_number}</span>
                </div>
              </div>
              <div className="favorite-footer">
                <small>{t.addedOn}: {new Date(fav.created_at).toLocaleDateString()}</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Favorites;
