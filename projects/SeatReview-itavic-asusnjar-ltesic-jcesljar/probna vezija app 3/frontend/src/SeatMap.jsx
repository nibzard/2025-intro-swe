import React, { useState, useEffect } from "react";
import { useLanguage } from "./LanguageContext";

function SeatMap({ venueId, venueName, autoSelectSeat }) {
  const { language } = useLanguage();
  const [reviewedSeats, setReviewedSeats] = useState([]);
  const [budget, setBudget] = useState("");
  const [bestSeat, setBestSeat] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [viewMode, setViewMode] = useState("price"); // "price" or "rating"

  const text = {
    hr: {
      title: "Profesionalni Tlocrt Stadiona",
      budgetLabel: "Vaš Budžet:",
      findBest: "Pronađi Najbolje Sjedalo",
      bestSeatTitle: "Najbolje Sjedalo",
      section: "Sekcija",
      row: "Red",
      seat: "Sjedalo",
      avgPrice: "Prosječna Cijena",
      rating: "Ocjena",
      reviews: "recenzija",
      noSeats: "Nema sjedala u odabranom budžetu",
      priceRange: "Legenda Cijena",
      reviewed: "Sa recenzijama",
      notReviewed: "Bez recenzija",
      bestSeat: "Najbolje sjedalo",
      comfort: "Udobnost",
      legroom: "Prostor",
      visibility: "Vidljivost",
      cleanliness: "Čistoća",
      field: "IGRALIŠTE",
      clickSeat: "Klikni na bilo koje sjedalo za više informacija",
      noData: "Učitavanje podataka...",
      seatDetails: "Detalji Sjedala",
      noReviews: "Ovo sjedalo još nema recenzija",
      beFirst: "Budite prvi koji će ostaviti recenziju za ovo sjedalo!",
      unavailable: "Nema podataka",
      cheap: "Jeftino",
      moderate: "Srednje",
      expensive: "Skupo",
      addToFavorites: "Dodaj u omiljene",
      removeFromFavorites: "Ukloni iz omiljenih",
      viewByPrice: "Prikaz po cijeni",
      viewByRating: "Heatmapa ocjena"
    },
    en: {
      title: "Professional Stadium Floor Plan",
      budgetLabel: "Your Budget:",
      findBest: "Find Best Seat",
      bestSeatTitle: "Best Seat",
      section: "Section",
      row: "Row",
      seat: "Seat",
      avgPrice: "Average Price",
      rating: "Rating",
      reviews: "reviews",
      noSeats: "No seats within budget",
      priceRange: "Price Legend",
      reviewed: "With reviews",
      notReviewed: "No reviews",
      bestSeat: "Best seat",
      comfort: "Comfort",
      legroom: "Legroom",
      visibility: "Visibility",
      cleanliness: "Cleanliness",
      field: "FIELD",
      clickSeat: "Click on any seat for more information",
      noData: "Loading data...",
      seatDetails: "Seat Details",
      noReviews: "This seat has no reviews yet",
      beFirst: "Be the first to review this seat!",
      unavailable: "Not available",
      cheap: "Cheap",
      moderate: "Moderate",
      expensive: "Expensive",
      addToFavorites: "Add to Favorites",
      removeFromFavorites: "Remove from Favorites",
      viewByPrice: "View by Price",
      viewByRating: "Rating Heatmap"
    }
  };

  const t = text[language];

  // Define all seats in stadium (typical stadium layout)
  const generateAllSeats = () => {
    const allSeats = [];
    const sections = ['A', 'B', 'C', 'D'];

    sections.forEach(section => {
      // Each section has 10 rows with varying number of seats
      for (let row = 1; row <= 10; row++) {
        const seatsInRow = 15 + (10 - row); // More seats in back rows
        for (let seatNum = 1; seatNum <= seatsInRow; seatNum++) {
          allSeats.push({
            section,
            row: row.toString(),
            seat_number: seatNum.toString()
          });
        }
      }
    });

    return allSeats;
  };

  const allStadiumSeats = generateAllSeats();

  useEffect(() => {
    loadReviewedSeats();
  }, [venueId]);

  const loadReviewedSeats = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/venues/${venueId}/seats`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error("Failed to load seats");
      }

      const data = await res.json();
      setReviewedSeats(data.seats || []);
    } catch (err) {
      console.error("Error loading seats:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const findBestSeat = async () => {
    if (!budget || parseFloat(budget) <= 0) {
      setError(language === "hr" ? "Unesite valjan budžet" : "Enter a valid budget");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/api/venues/${venueId}/best-seat?budget=${budget}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!res.ok) {
        throw new Error("Failed to find best seat");
      }

      const data = await res.json();
      if (data.bestSeat) {
        setBestSeat(data.bestSeat);
        setSelectedSeat(data.bestSeat);
      } else {
        setBestSeat(null);
        setError(data.message || t.noSeats);
      }
    } catch (err) {
      console.error("Error finding best seat:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getSeatReview = (section, row, seatNum) => {
    return reviewedSeats.find(
      s => s.section === section && s.row === row && s.seat_number === seatNum
    );
  };

  const getPriceColor = (price) => {
    if (!price) return "#d1d5db"; // Gray for no review

    const prices = reviewedSeats.map(s => s.price).filter(p => p);
    if (prices.length === 0) return "#d1d5db";

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice;

    if (range === 0) return "#10b981";

    const percentage = (price - minPrice) / range;

    if (percentage < 0.33) return "#10b981"; // Green
    if (percentage < 0.66) return "#f59e0b"; // Orange
    return "#ef4444"; // Red
  };

  const getRatingColor = (rating) => {
    if (!rating) return "#d1d5db"; // Gray for no review

    // Rating is from 0-5, convert to heatmap colors
    // Red (bad) -> Orange -> Yellow -> Light Green -> Green (good)
    if (rating < 2) return "#ef4444"; // Red (bad)
    if (rating < 3) return "#f59e0b"; // Orange
    if (rating < 3.5) return "#eab308"; // Yellow
    if (rating < 4) return "#84cc16"; // Light green
    return "#22c55e"; // Green (excellent)
  };

  const getSeatColor = (review) => {
    if (!review) return "#d1d5db";

    if (viewMode === "price") {
      return getPriceColor(review.price);
    } else {
      // Rating mode - calculate overall rating
      const overallRating = (
        (review.avg_comfort || 0) +
        (review.avg_legroom || 0) +
        (review.avg_visibility || 0) +
        (review.avg_cleanliness || 0)
      ) / 4;
      return getRatingColor(overallRating);
    }
  };

  const formatPrice = (price) => {
    if (!price) return t.unavailable;
    return `${price.toFixed(2)} €`;
  };

  const formatRating = (rating) => {
    if (!rating) return t.unavailable;
    return rating.toFixed(1);
  };

  const getPriceRanges = () => {
    const prices = reviewedSeats.map(s => s.price).filter(p => p);
    if (prices.length === 0) return null;

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice;

    if (range === 0) {
      return {
        cheap: { min: minPrice, max: minPrice },
        moderate: { min: minPrice, max: minPrice },
        expensive: { min: minPrice, max: minPrice }
      };
    }

    const thirdRange = range / 3;

    return {
      cheap: { min: minPrice, max: minPrice + thirdRange },
      moderate: { min: minPrice + thirdRange, max: minPrice + (thirdRange * 2) },
      expensive: { min: minPrice + (thirdRange * 2), max: maxPrice }
    };
  };

  const priceRanges = getPriceRanges();

  const isBestSeat = (seat) => {
    if (!bestSeat) return false;
    return (
      seat.section === bestSeat.section &&
      seat.row === bestSeat.row &&
      seat.seat_number === bestSeat.seat_number
    );
  };

  const isAutoSelectedSeat = (section, row, seatNum) => {
    if (!autoSelectSeat) return false;
    return (
      autoSelectSeat.section === section &&
      autoSelectSeat.row === row &&
      autoSelectSeat.seat_number === seatNum
    );
  };

  const getSeatPosition = (section, row, seatNum) => {
    const rowNum = parseInt(row);
    const seat = parseInt(seatNum);

    let x = 500;
    let y = 400;

    if (section === "A") {
      // North - top
      x = 200 + seat * 24;
      y = 50 + rowNum * 10;
    } else if (section === "C") {
      // South - bottom
      x = 200 + seat * 24;
      y = 750 - rowNum * 10;
    } else if (section === "B") {
      // East - right
      x = 950 - rowNum * 10;
      y = 150 + seat * 22;
    } else if (section === "D") {
      // West - left
      x = 50 + rowNum * 10;
      y = 150 + seat * 22;
    }

    return { x, y };
  };

  const handleSeatClick = async (section, row, seatNum) => {
    const review = getSeatReview(section, row, seatNum);
    if (review) {
      setSelectedSeat(review);
    } else {
      setSelectedSeat({
        section,
        row,
        seat_number: seatNum,
        hasReview: false
      });
    }

    // Check if seat is favorited
    await checkFavorite(section, row, seatNum);

    // Add to view history
    await addToHistory(section, row, seatNum);
  };

  const checkFavorite = async (section, row, seatNum) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/api/favorites/check?venue_id=${venueId}&section=${section}&row=${row}&seat_number=${seatNum}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (res.ok) {
        const data = await res.json();
        setIsFavorite(data.isFavorite);
      }
    } catch (err) {
      console.error("Error checking favorite:", err);
    }
  };

  const addToHistory = async (section, row, seatNum) => {
    try {
      const token = localStorage.getItem("token");
      await fetch("http://localhost:5000/api/history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          venue_id: venueId,
          section,
          row,
          seat_number: seatNum
        })
      });
    } catch (err) {
      console.error("Error adding to history:", err);
    }
  };

  const toggleFavorite = async () => {
    if (!selectedSeat) return;

    try {
      const token = localStorage.getItem("token");
      const method = isFavorite ? "DELETE" : "POST";
      const res = await fetch("http://localhost:5000/api/favorites", {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          venue_id: venueId,
          section: selectedSeat.section,
          row: selectedSeat.row,
          seat_number: selectedSeat.seat_number
        })
      });

      if (res.ok) {
        setIsFavorite(!isFavorite);
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
      setError(err.message);
    }
  };

  // Auto-select seat when navigating from history
  useEffect(() => {
    if (autoSelectSeat && reviewedSeats.length > 0) {
      const { section, row, seat_number } = autoSelectSeat;
      // Small delay to ensure everything is rendered
      setTimeout(() => {
        handleSeatClick(section, row, seat_number);
      }, 100);
    }
  }, [autoSelectSeat, reviewedSeats.length]);

  return (
    <div className="seat-map-container">
      {/* View Mode Toggle */}
      <div className="view-mode-toggle">
        <button
          className={`toggle-btn ${viewMode === "price" ? "active" : ""}`}
          onClick={() => setViewMode("price")}
        >
          💰 {t.viewByPrice}
        </button>
        <button
          className={`toggle-btn ${viewMode === "rating" ? "active" : ""}`}
          onClick={() => setViewMode("rating")}
        >
          🔥 {t.viewByRating}
        </button>
      </div>

      {/* Budget Filter */}
      <div className="budget-filter">
        <label className="budget-label">
          <span>{t.budgetLabel}</span>
          <div className="budget-input-group">
            <input
              type="number"
              className="input budget-input"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="150"
              min="0"
              step="10"
            />
            <span className="currency-symbol">€</span>
            <button className="btn-primary" onClick={findBestSeat} disabled={loading}>
              {loading ? "..." : t.findBest}
            </button>
          </div>
        </label>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Best Seat Info Card */}
      {bestSeat && bestSeat.hasReview !== false && (
        <div className="best-seat-card">
          <h3>⭐ {t.bestSeatTitle}</h3>
          <div className="best-seat-details">
            <div className="best-seat-location">
              <span className="location-badge">{bestSeat.section}</span>
              <span className="location-text">
                {t.row} {bestSeat.row}, {t.seat} {bestSeat.seat_number}
              </span>
            </div>
            <div className="best-seat-price">{formatPrice(bestSeat.price)}</div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="floor-plan-legend">
        <h4>{viewMode === "price" ? t.priceRange : "Heatmapa Ocjena"}</h4>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color" style={{ background: "#d1d5db" }}></div>
            <span>{t.notReviewed}</span>
          </div>
          {viewMode === "price" ? (
            priceRanges && (
              <>
                <div className="legend-item">
                  <div className="legend-color" style={{ background: "#10b981" }}></div>
                  <span>{t.cheap}: {priceRanges.cheap.min.toFixed(0)}€ - {priceRanges.cheap.max.toFixed(0)}€</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ background: "#f59e0b" }}></div>
                  <span>{t.moderate}: {priceRanges.moderate.min.toFixed(0)}€ - {priceRanges.moderate.max.toFixed(0)}€</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ background: "#ef4444" }}></div>
                  <span>{t.expensive}: {priceRanges.expensive.min.toFixed(0)}€ - {priceRanges.expensive.max.toFixed(0)}€</span>
                </div>
              </>
            )
          ) : (
            <>
              <div className="legend-item">
                <div className="legend-color" style={{ background: "#ef4444" }}></div>
                <span>Loše (1-2 ⭐)</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ background: "#f59e0b" }}></div>
                <span>Prosječno (2-3 ⭐)</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ background: "#eab308" }}></div>
                <span>Dobro (3-3.5 ⭐)</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ background: "#84cc16" }}></div>
                <span>Vrlo dobro (3.5-4 ⭐)</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ background: "#22c55e" }}></div>
                <span>Odlično (4-5 ⭐)</span>
              </div>
            </>
          )}
          {bestSeat && (
            <div className="legend-item">
              <div className="legend-color best-highlight" style={{ background: "#fbbf24" }}></div>
              <span>⭐ {t.bestSeat}</span>
            </div>
          )}
        </div>
      </div>

      {/* Professional Stadium Layout */}
      {loading ? (
        <div className="loading">{t.noData}</div>
      ) : (
        <div className="professional-stadium">
          <svg viewBox="0 0 1000 800" className="stadium-svg">
            {/* Gradient Definitions */}
            <defs>
              <linearGradient id="fieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <filter id="shadow">
                <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.3"/>
              </filter>
            </defs>

            {/* Stadium Background */}
            <rect width="1000" height="800" fill="#f9fafb" />

            {/* Field/Pitch */}
            <rect
              x="200"
              y="150"
              width="600"
              height="500"
              fill="url(#fieldGradient)"
              stroke="#047857"
              strokeWidth="8"
              rx="30"
              filter="url(#shadow)"
            />

            {/* Field Lines */}
            <line x1="500" y1="150" x2="500" y2="650" stroke="white" strokeWidth="3" opacity="0.5" />
            <circle cx="500" cy="400" r="50" fill="none" stroke="white" strokeWidth="3" opacity="0.5" />
            <circle cx="500" cy="400" r="3" fill="white" opacity="0.5" />

            <text
              x="500"
              y="420"
              textAnchor="middle"
              fontSize="52"
              fontWeight="900"
              fill="white"
              opacity="0.2"
              letterSpacing="8"
            >
              {t.field}
            </text>

            {/* Section Labels */}
            <text x="500" y="35" textAnchor="middle" fontSize="28" fontWeight="bold" fill="#1f2937">
              SECTION A - NORTH
            </text>
            <text x="500" y="795" textAnchor="middle" fontSize="28" fontWeight="bold" fill="#1f2937">
              SECTION C - SOUTH
            </text>
            <text x="25" y="405" textAnchor="middle" fontSize="28" fontWeight="bold" fill="#1f2937" transform="rotate(-90, 25, 405)">
              SECTION D - WEST
            </text>
            <text x="975" y="405" textAnchor="middle" fontSize="28" fontWeight="bold" fill="#1f2937" transform="rotate(90, 975, 405)">
              SECTION B - EAST
            </text>

            {/* All Seats */}
            {allStadiumSeats.map((seat, idx) => {
              const pos = getSeatPosition(seat.section, seat.row, seat.seat_number);
              const review = getSeatReview(seat.section, seat.row, seat.seat_number);
              const isBest = review && isBestSeat(review);
              const isFromHistory = isAutoSelectedSeat(seat.section, seat.row, seat.seat_number);
              const color = getSeatColor(review);

              return (
                <g key={idx}>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={isBest ? "7" : "4"}
                    fill={isBest ? "#fbbf24" : color}
                    stroke={isBest ? "#f59e0b" : review ? "#374151" : "#9ca3af"}
                    strokeWidth={isBest ? "2" : "0.5"}
                    className="stadium-seat"
                    onClick={() => handleSeatClick(seat.section, seat.row, seat.seat_number)}
                    opacity={review ? "1" : "0.5"}
                  >
                    {isBest && (
                      <animate
                        attributeName="r"
                        values="7;10;7"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    )}
                  </circle>
                  {isFromHistory && selectedSeat &&
                   selectedSeat.section === seat.section &&
                   selectedSeat.row === seat.row &&
                   selectedSeat.seat_number === seat.seat_number && (
                    <text
                      x={pos.x}
                      y={pos.y - 12}
                      fontSize="16"
                      textAnchor="middle"
                      fill="#fbbf24"
                      stroke="#f59e0b"
                      strokeWidth="0.5"
                      className="history-star-indicator"
                    >
                      ⭐
                      <animate
                        attributeName="opacity"
                        values="1;0.3;1"
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {/* Selected Seat Panel */}
      {selectedSeat && (
        <div className="selected-seat-panel">
          <div className="panel-header">
            <h3>{t.seatDetails}</h3>
            <div className="panel-actions">
              <button
                className={`btn-favorite ${isFavorite ? 'active' : ''}`}
                onClick={toggleFavorite}
                title={isFavorite ? t.removeFromFavorites : t.addToFavorites}
              >
                {isFavorite ? '⭐' : '☆'}
              </button>
              <button className="close-btn" onClick={() => setSelectedSeat(null)}>✕</button>
            </div>
          </div>

          <div className="seat-info-grid">
            <div className="info-item">
              <span className="info-label">{t.section}:</span>
              <span className="info-value">{selectedSeat.section}</span>
            </div>
            <div className="info-item">
              <span className="info-label">{t.row}:</span>
              <span className="info-value">{selectedSeat.row}</span>
            </div>
            <div className="info-item">
              <span className="info-label">{t.seat}:</span>
              <span className="info-value">{selectedSeat.seat_number}</span>
            </div>
            {selectedSeat.price && (
              <div className="info-item">
                <span className="info-label">{t.avgPrice}:</span>
                <span className="info-value price-highlight">{formatPrice(selectedSeat.price)}</span>
              </div>
            )}
          </div>

          {selectedSeat.hasReview === false ? (
            <div className="no-reviews-message">
              <div className="no-reviews-icon">📝</div>
              <h4>{t.noReviews}</h4>
              <p>{t.beFirst}</p>
            </div>
          ) : (
            <>
              <div className="seat-ratings-display">
                <div className="rating-box">
                  <div className="rating-icon">🛋️</div>
                  <div className="rating-label">{t.comfort}</div>
                  <div className="rating-score">{formatRating(selectedSeat.avg_comfort)}</div>
                </div>
                <div className="rating-box">
                  <div className="rating-icon">🦵</div>
                  <div className="rating-label">{t.legroom}</div>
                  <div className="rating-score">{formatRating(selectedSeat.avg_legroom)}</div>
                </div>
                <div className="rating-box">
                  <div className="rating-icon">👁️</div>
                  <div className="rating-label">{t.visibility}</div>
                  <div className="rating-score">{formatRating(selectedSeat.avg_visibility)}</div>
                </div>
                <div className="rating-box">
                  <div className="rating-icon">✨</div>
                  <div className="rating-label">{t.cleanliness}</div>
                  <div className="rating-score">{formatRating(selectedSeat.avg_cleanliness)}</div>
                </div>
              </div>

              <div className="overall-score">
                <span className="score-label">{t.rating}:</span>
                <span className="score-value">⭐ {formatRating(selectedSeat.overall_rating)}</span>
                <span className="review-count-badge">({selectedSeat.review_count} {t.reviews})</span>
              </div>
            </>
          )}
        </div>
      )}

      <p className="info-text">{t.clickSeat}</p>
    </div>
  );
}

export default SeatMap;
