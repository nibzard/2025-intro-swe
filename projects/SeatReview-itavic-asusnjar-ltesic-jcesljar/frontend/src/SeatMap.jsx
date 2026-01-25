import { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import API_URL from "./config";
import { useLanguage } from "./LanguageContext";
import { translations } from "./translations";

const API_BASE = `${API_URL}/api`;

function SeatMap({ venueId, venueName, autoSelectSeat }) {
  const { language } = useLanguage();
  const t = translations[language];
  const { token } = useAuth();
  const [allReviews, setAllReviews] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [seatReviews, setSeatReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredSeat, setHoveredSeat] = useState(null);
  const [budget, setBudget] = useState("");
  const [bestSeat, setBestSeat] = useState(null);

  // Seat configuration - positions in SVG coordinates
  const sections = {
    ZAPAD: { color: "#3b82f6", hoverColor: "#2563eb", rows: 5, seatsPerRow: 12 },
    ISTOK: { color: "#22c55e", hoverColor: "#16a34a", rows: 5, seatsPerRow: 12 },
    SJEVER: { color: "#f59e0b", hoverColor: "#d97706", rows: 4, seatsPerRow: 8 },
    JUG: { color: "#ef4444", hoverColor: "#dc2626", rows: 4, seatsPerRow: 8 }
  };

  // Generate seat positions for each section - following stadium curve
  const generateSeatPositions = () => {
    const seats = [];
    const centerX = 400;
    const centerY = 300;

    // ZAPAD (Top) - curved arc following top of stadium
    for (let row = 0; row < sections.ZAPAD.rows; row++) {
      const rowRadius = 340 - row * 22; // Each row gets closer to field
      const numSeats = sections.ZAPAD.seatsPerRow;

      for (let seat = 0; seat < numSeats; seat++) {
        // Spread seats along the top arc (from about 200° to 340°)
        const startAngle = Math.PI * 1.15; // ~207°
        const endAngle = Math.PI * 1.85;   // ~333°
        const angle = startAngle + (seat / (numSeats - 1)) * (endAngle - startAngle);

        const x = centerX + Math.cos(angle) * rowRadius * 0.92;
        const y = centerY + Math.sin(angle) * rowRadius * 0.72;

        seats.push({
          id: `ZAPAD-${row + 1}-${seat + 1}`,
          section: "ZAPAD",
          row: row + 1,
          seat_number: seat + 1,
          x, y,
          price: 80 - row * 8 + Math.floor(Math.random() * 10)
        });
      }
    }

    // ISTOK (Bottom) - curved arc following bottom of stadium
    for (let row = 0; row < sections.ISTOK.rows; row++) {
      const rowRadius = 340 - row * 22;
      const numSeats = sections.ISTOK.seatsPerRow;

      for (let seat = 0; seat < numSeats; seat++) {
        // Spread seats along the bottom arc (from about 20° to 160°)
        const startAngle = Math.PI * 0.15;  // ~27°
        const endAngle = Math.PI * 0.85;    // ~153°
        const angle = startAngle + (seat / (numSeats - 1)) * (endAngle - startAngle);

        const x = centerX + Math.cos(angle) * rowRadius * 0.92;
        const y = centerY + Math.sin(angle) * rowRadius * 0.72;

        seats.push({
          id: `ISTOK-${row + 1}-${seat + 1}`,
          section: "ISTOK",
          row: row + 1,
          seat_number: seat + 1,
          x, y,
          price: 70 - row * 6 + Math.floor(Math.random() * 10)
        });
      }
    }

    // SJEVER (Left) - curved following left side of stadium
    for (let row = 0; row < sections.SJEVER.rows; row++) {
      const rowRadius = 340 - row * 22;
      const numSeats = sections.SJEVER.seatsPerRow;

      for (let seat = 0; seat < numSeats; seat++) {
        // Spread seats along the left arc (from about 160° to 200°)
        const startAngle = Math.PI * 0.85;  // ~153°
        const endAngle = Math.PI * 1.15;    // ~207°
        const angle = startAngle + (seat / (numSeats - 1)) * (endAngle - startAngle);

        const x = centerX + Math.cos(angle) * rowRadius * 0.92;
        const y = centerY + Math.sin(angle) * rowRadius * 0.72;

        seats.push({
          id: `SJEVER-${row + 1}-${seat + 1}`,
          section: "SJEVER",
          row: row + 1,
          seat_number: seat + 1,
          x, y,
          price: 50 - row * 5 + Math.floor(Math.random() * 8)
        });
      }
    }

    // JUG (Right) - curved following right side of stadium
    for (let row = 0; row < sections.JUG.rows; row++) {
      const rowRadius = 340 - row * 22;
      const numSeats = sections.JUG.seatsPerRow;

      for (let seat = 0; seat < numSeats; seat++) {
        // Spread seats along the right arc (from about 340° to 380°/20°)
        const startAngle = Math.PI * 1.85;  // ~333°
        const endAngle = Math.PI * 2.15;    // ~387° (wraps to ~27°)
        const angle = startAngle + (seat / (numSeats - 1)) * (endAngle - startAngle);

        const x = centerX + Math.cos(angle) * rowRadius * 0.92;
        const y = centerY + Math.sin(angle) * rowRadius * 0.72;

        seats.push({
          id: `JUG-${row + 1}-${seat + 1}`,
          section: "JUG",
          row: row + 1,
          seat_number: seat + 1,
          x, y,
          price: 55 - row * 5 + Math.floor(Math.random() * 8)
        });
      }
    }

    return seats;
  };

  const [seatPositions] = useState(generateSeatPositions);

  useEffect(() => {
    fetchReviews();
  }, [venueId]);

  useEffect(() => {
    if (autoSelectSeat && autoSelectSeat.section) {
      const seat = seatPositions.find(
        s => s.section === autoSelectSeat.section &&
             s.row == autoSelectSeat.row &&
             s.seat_number == autoSelectSeat.seat_number
      );
      if (seat) {
        setSelectedSeat(seat);
        fetchSeatReviews(seat.section, seat.row, seat.seat_number);
      }
    }
  }, [autoSelectSeat]);

  const fetchReviews = async () => {
    try {
      const response = await fetch(`${API_BASE}/venues/${venueId}/reviews`);
      if (response.ok) {
        const data = await response.json();
        setAllReviews(data || []);
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSeatReviews = async (section, row, seatNumber) => {
    const filtered = allReviews.filter(
      r => r.section === section && r.row == row && r.seat_number == seatNumber
    );
    setSeatReviews(filtered);
  };

  const getSeatRating = (seat) => {
    const reviews = allReviews.filter(
      r => r.section === seat.section && r.row == seat.row && r.seat_number == seat.seat_number
    );
    if (reviews.length === 0) return null;

    const avgRating = reviews.reduce((sum, r) => {
      const comfort = r.rating_comfort || 0;
      const visibility = r.rating_visibility || 0;
      const legroom = r.rating_legroom || 0;
      return sum + (comfort + visibility + legroom) / 3;
    }, 0) / reviews.length;

    return avgRating;
  };

  const findBestSeatInBudget = () => {
    const budgetNum = parseFloat(budget);
    if (isNaN(budgetNum) || budgetNum <= 0) {
      alert(t.enterValidBudget);
      return;
    }

    // Filter seats within budget
    const affordableSeats = seatPositions.filter(s => s.price <= budgetNum);

    if (affordableSeats.length === 0) {
      alert(t.noSeatsInBudget);
      setBestSeat(null);
      return;
    }

    // Calculate ratings for affordable seats
    const seatsWithRatings = affordableSeats.map(seat => {
      const rating = getSeatRating(seat);
      return { ...seat, avgRating: rating || 3 }; // Default rating 3 if no reviews
    });

    // Sort by rating (highest first), then by price (lowest first)
    seatsWithRatings.sort((a, b) => {
      if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
      return a.price - b.price;
    });

    const best = seatsWithRatings[0];
    setBestSeat(best);
    setSelectedSeat(best);
    fetchSeatReviews(best.section, best.row, best.seat_number);
  };

  const handleSeatClick = (seat) => {
    setSelectedSeat(seat);
    setBestSeat(null);
    recordView(seat);
    fetchSeatReviews(seat.section, seat.row, seat.seat_number);
  };

  const addToFavorites = async (seat) => {
    if (!token) {
      alert(t.mustBeLoggedInToFavorite);
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/favorites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          venue_id: venueId,
          section: seat.section,
          row: seat.row,
          seat_number: seat.seat_number
        })
      });
      if (response.ok) {
        alert(t.seatAddedToFavorites.replace('{section}', seat.section).replace('{row}', seat.row).replace('{seat}', seat.seat_number));
      }
    } catch (error) {
      console.error("Failed to add favorite:", error);
    }
  };

  const recordView = async (seat) => {
    if (!token) return;
    try {
      await fetch(`${API_BASE}/history`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          venue_id: venueId,
          section: seat.section,
          row: seat.row,
          seat_number: seat.seat_number
        })
      });
    } catch (error) {
      console.error("Failed to record view:", error);
    }
  };

  const getSeatColor = (seat) => {
    if (selectedSeat?.id === seat.id) return "#1e3a8a";
    if (bestSeat?.id === seat.id) return "#fbbf24";
    if (hoveredSeat?.id === seat.id) return sections[seat.section].hoverColor;
    return sections[seat.section].color;
  };

  const getSeatRadius = (seat) => {
    if (selectedSeat?.id === seat.id || bestSeat?.id === seat.id) return 10;
    if (hoveredSeat?.id === seat.id) return 9;
    return 7;
  };

  if (loading) {
    return <div className="loading-small">{t.loadingSeatMap}</div>;
  }

  return (
    <div className="seatmap-container">
      <h3 className="seatmap-title">{t.seatMap} - {venueName}</h3>

      {/* Budget Finder */}
      <div className="budget-finder-box">
        <h4>💰 {t.findBestSeatForBudget}</h4>
        <div className="budget-input-row">
          <input
            type="number"
            placeholder={t.enterBudgetPlaceholder}
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="budget-input-field"
          />
          <button onClick={findBestSeatInBudget} className="btn-find-seat">
            🔍 {t.find}
          </button>
        </div>
        {bestSeat && (
          <div className="best-seat-result">
            <span className="best-label">⭐ {t.bestSeat}:</span>
            <span className="best-info">
              {bestSeat.section} - {t.row} {bestSeat.row}, {t.seat} {bestSeat.seat_number}
            </span>
            <span className="best-price">{bestSeat.price}€</span>
          </div>
        )}
      </div>

      {/* Stadium Layout SVG with Seats */}
      <div className="stadium-container">
        <svg viewBox="0 0 800 600" className="stadium-svg">
          {/* Outer stadium shape */}
          <ellipse cx="400" cy="300" rx="380" ry="280" fill="#1a365d" stroke="#0f172a" strokeWidth="4"/>

          {/* Tribune backgrounds */}
          {/* ZAPAD (Top) */}
          <path
            d="M 120 100 Q 400 10 680 100 L 620 170 Q 400 90 180 170 Z"
            fill="#1e40af"
            stroke="#1e3a8a"
            strokeWidth="2"
            opacity="0.3"
          />
          <text x="400" y="60" textAnchor="middle" fill="white" fontWeight="bold" fontSize="16" opacity="0.8">
            ZAPAD
          </text>

          {/* ISTOK (Bottom) */}
          <path
            d="M 120 500 Q 400 590 680 500 L 620 430 Q 400 510 180 430 Z"
            fill="#166534"
            stroke="#15803d"
            strokeWidth="2"
            opacity="0.3"
          />
          <text x="400" y="545" textAnchor="middle" fill="white" fontWeight="bold" fontSize="16" opacity="0.8">
            ISTOK
          </text>

          {/* SJEVER (Left) */}
          <path
            d="M 30 130 Q 10 300 30 470 L 100 420 Q 80 300 100 180 Z"
            fill="#b45309"
            stroke="#92400e"
            strokeWidth="2"
            opacity="0.3"
          />
          <text x="20" y="305" textAnchor="middle" fill="white" fontWeight="bold" fontSize="12" opacity="0.8" transform="rotate(-90, 20, 305)">
            SJEVER
          </text>

          {/* JUG (Right) */}
          <path
            d="M 770 130 Q 790 300 770 470 L 700 420 Q 720 300 700 180 Z"
            fill="#b91c1c"
            stroke="#991b1b"
            strokeWidth="2"
            opacity="0.3"
          />
          <text x="780" y="305" textAnchor="middle" fill="white" fontWeight="bold" fontSize="12" opacity="0.8" transform="rotate(90, 780, 305)">
            JUG
          </text>

          {/* Inner field area */}
          <ellipse cx="400" cy="300" rx="250" ry="160" fill="#15803d" stroke="#166534" strokeWidth="2"/>

          {/* Football field */}
          <rect x="220" y="200" width="360" height="200" fill="#22c55e" stroke="white" strokeWidth="2"/>
          <line x1="400" y1="200" x2="400" y2="400" stroke="white" strokeWidth="2"/>
          <circle cx="400" cy="300" r="40" fill="none" stroke="white" strokeWidth="2"/>
          <circle cx="400" cy="300" r="4" fill="white"/>
          <rect x="220" y="260" width="40" height="80" fill="none" stroke="white" strokeWidth="2"/>
          <rect x="540" y="260" width="40" height="80" fill="none" stroke="white" strokeWidth="2"/>
          <text x="400" y="305" textAnchor="middle" fill="white" fontWeight="bold" fontSize="14" opacity="0.7">
            {t.field}
          </text>

          {/* Seat dots */}
          {seatPositions.map((seat) => (
            <g key={seat.id}>
              <circle
                cx={seat.x}
                cy={seat.y}
                r={getSeatRadius(seat)}
                fill={getSeatColor(seat)}
                stroke={selectedSeat?.id === seat.id ? "#fff" : "rgba(255,255,255,0.3)"}
                strokeWidth={selectedSeat?.id === seat.id ? 2 : 1}
                style={{ cursor: "pointer", transition: "all 0.15s ease" }}
                onClick={() => handleSeatClick(seat)}
                onMouseEnter={() => setHoveredSeat(seat)}
                onMouseLeave={() => setHoveredSeat(null)}
              />
              {/* Show seat number on hover or selection */}
              {(hoveredSeat?.id === seat.id || selectedSeat?.id === seat.id) && (
                <text
                  x={seat.x}
                  y={seat.y + 3}
                  textAnchor="middle"
                  fill="white"
                  fontSize="8"
                  fontWeight="bold"
                  pointerEvents="none"
                >
                  {seat.seat_number}
                </text>
              )}
              {/* Best seat star */}
              {bestSeat?.id === seat.id && (
                <text
                  x={seat.x}
                  y={seat.y - 14}
                  textAnchor="middle"
                  fill="#fbbf24"
                  fontSize="16"
                  pointerEvents="none"
                >
                  ⭐
                </text>
              )}
            </g>
          ))}
        </svg>

        <p className="stadium-hint">{t.stadiumHint}</p>
      </div>

      {/* Hovered Seat Tooltip */}
      {hoveredSeat && !selectedSeat && (
        <div className="seat-hover-tooltip">
          <strong>{hoveredSeat.section}</strong> - {t.row} {hoveredSeat.row}, {t.seat} {hoveredSeat.seat_number}
          <span className="tooltip-price">{hoveredSeat.price}€</span>
        </div>
      )}

      {/* Selected Seat Details */}
      {selectedSeat && (
        <div className="seat-details-card">
          <div className="seat-details-header" style={{ backgroundColor: sections[selectedSeat.section].color }}>
            <h4>{t.seatDetails}</h4>
            <button className="close-details-btn" onClick={() => { setSelectedSeat(null); setSeatReviews([]); setBestSeat(null); }}>
              ✕
            </button>
          </div>
          <div className="seat-details-body">
            <div className="seat-location-info">
              <div className="seat-location-item">
                <span className="location-label">{t.tribune}</span>
                <span className="location-value">{selectedSeat.section}</span>
              </div>
              <div className="seat-location-item">
                <span className="location-label">{t.row}</span>
                <span className="location-value">{selectedSeat.row}</span>
              </div>
              <div className="seat-location-item">
                <span className="location-label">{t.seat}</span>
                <span className="location-value">{selectedSeat.seat_number}</span>
              </div>
              <div className="seat-location-item highlight">
                <span className="location-label">{t.price}</span>
                <span className="location-value price">{selectedSeat.price}€</span>
              </div>
            </div>

            <button className="btn-add-favorite" onClick={() => addToFavorites(selectedSeat)}>
              ⭐ {t.addToFavorites}
            </button>

            {/* Reviews for this seat */}
            <div className="seat-reviews-section">
              <h5>{t.reviewsForThisSeat} ({seatReviews.length})</h5>
              {seatReviews.length === 0 ? (
                <p className="no-reviews-msg">{t.noReviewsForSeat}</p>
              ) : (
                <div className="seat-reviews-list">
                  {seatReviews.map((review, idx) => (
                    <div key={idx} className="seat-review-item">
                      <div className="review-ratings-mini">
                        <span>{t.comfort}: {review.rating_comfort || '-'}/5</span>
                        <span>{t.visibility}: {review.rating_visibility || '-'}/5</span>
                        <span>{t.legroom}: {review.rating_legroom || '-'}/5</span>
                      </div>
                      {review.text_review && (
                        <p className="review-text-mini">"{review.text_review}"</p>
                      )}
                      <span className="review-author">- {review.user_email?.split('@')[0] || t.anonymous}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="seatmap-legend">
        <h4>{t.tribunes}</h4>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: "#3b82f6" }}></span>
            <span>{t.westTop}</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: "#22c55e" }}></span>
            <span>{t.eastBottom}</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: "#f59e0b" }}></span>
            <span>{t.northLeft}</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: "#ef4444" }}></span>
            <span>{t.southRight}</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: "#fbbf24" }}></span>
            <span>{t.recommendedBudget}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SeatMap;
