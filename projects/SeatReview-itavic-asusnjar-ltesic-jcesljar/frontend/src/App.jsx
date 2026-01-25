import React, { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { useLanguage } from "./LanguageContext";
import { translations } from "./translations";
import Navigation from "./Navigation";
import Photo360Viewer from "./Photo360Viewer";
import SeatMap from "./SeatMap";
import Favorites from "./Favorites";
import ViewHistory from "./ViewHistory";
import Leaderboard from "./Leaderboard";
import UserProfile from "./UserProfile";

const API_BASE = "http://localhost:5000/api";

function App() {
  const { user, token } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];
  const [step, setStep] = useState(1); // 1 = category, 2 = venue selection, 3 = content
  const [category, setCategory] = useState("");
  const [venues, setVenues] = useState([]);
  const [selectedVenueId, setSelectedVenueId] = useState("");
  const [tab, setTab] = useState("360view");
  const [autoSelectSeat, setAutoSelectSeat] = useState(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [selectedProfileEmail, setSelectedProfileEmail] = useState(null);

  useEffect(() => {
    if (category && step === 2) {
      fetchVenues();
    }
  }, [category]);

  const fetchVenues = () => {
    const url = `${API_BASE}/venues?category=${category}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setVenues(data);
      })
      .catch((e) => console.error("Failed to load venues", e));
  };

  const handleCategorySelect = (cat) => {
    setCategory(cat);
    setStep(2);
    setSelectedVenueId("");
  };

  const handleVenueSelect = (venueId) => {
    setSelectedVenueId(venueId);
    setStep(3);
  };

  const handleBack = () => {
    if (step === 3) {
      setStep(2);
      setSelectedVenueId("");
      setAutoSelectSeat(null);
    } else if (step === 2) {
      setStep(1);
      setCategory("");
      setVenues([]);
    }
  };

  const handleNavigateToSeat = async (venueId, section, row, seatNumber) => {
    try {
      const res = await fetch(`${API_BASE}/venues/${venueId}`);
      if (res.ok) {
        const venue = await res.json();
        setCategory(venue.category);

        const venuesRes = await fetch(`${API_BASE}/venues?category=${venue.category}`);
        if (venuesRes.ok) {
          const venuesData = await venuesRes.json();
          setVenues(venuesData);
        }

        setAutoSelectSeat({
          section,
          row,
          seat_number: seatNumber
        });

        setSelectedVenueId(venueId);
        setStep(3);
        setTab("seatmap");
      }
    } catch (err) {
      console.error("Error navigating to seat:", err);
    }
  };

  return (
    <>
      {/* Animated Sports Field Background */}
      <div className="sports-field-bg">
        <div className="football-field">
          <div className="field-center-circle"></div>
          <div className="field-center-line"></div>
          <div className="field-penalty-left"></div>
          <div className="field-penalty-right"></div>
          <div className="field-goal-left"></div>
          <div className="field-goal-right"></div>
        </div>
        <div className="basketball-court">
          <div className="court-center-circle"></div>
          <div className="court-center-line"></div>
          <div className="court-three-point-left"></div>
          <div className="court-three-point-right"></div>
          <div className="court-hoop-left"></div>
          <div className="court-hoop-right"></div>
          <div className="court-key-left"></div>
          <div className="court-key-right"></div>
        </div>
      </div>
      <div className="stadium-lights"></div>
      <div className="particles">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>
      <div className="glow-border"></div>

      <Navigation onAdminClick={() => setShowAdminPanel(!showAdminPanel)} />
      <div className="container">
        {/* Admin Panel */}
        {showAdminPanel && user?.is_admin === 1 && (
          <AdminPanel token={token} onClose={() => setShowAdminPanel(false)} />
        )}

        {/* Step 1: Category Selection */}
        {!showAdminPanel && step === 1 && (
          <div className="selection-container">
            <h2 className="selection-title">{t.selectCategory}</h2>
            <div className="category-cards">
              <div
                className="category-card"
                onClick={() => handleCategorySelect("stadium")}
              >
                <div className="category-icon">⚽</div>
                <h3>{t.stadiums}</h3>
                <p>{t.stadiumsDesc}</p>
              </div>
              <div
                className="category-card"
                onClick={() => handleCategorySelect("arena")}
              >
                <div className="category-icon">🎭</div>
                <h3>{t.arenasTheatres}</h3>
                <p>{t.arenasDesc}</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Venue Selection */}
        {!showAdminPanel && step === 2 && (
          <div className="selection-container">
            <button className="back-button" onClick={handleBack}>
              ← {t.backToCategories}
            </button>
            <h2 className="selection-title">
              {category === "stadium" ? `⚽ ${t.selectStadium}` : `🎭 ${t.selectArena}`}
            </h2>
            <div className="venue-cards">
              {venues.map((venue) => (
                <div
                  key={venue.id}
                  className="venue-card"
                  onClick={() => handleVenueSelect(venue.id)}
                >
                  <h3>{venue.name}</h3>
                  <p>{venue.address}</p>
                  <div className="venue-type">{venue.type}</div>
                </div>
              ))}
            </div>
            {venues.length === 0 && (
              <p className="no-venues">{t.noVenues}</p>
            )}
          </div>
        )}

        {/* Step 3: Venue Content */}
        {!showAdminPanel && step === 3 && selectedVenueId && (
          <>
            <button className="back-button" onClick={handleBack}>
              ← {t.backToVenues}
            </button>

            {/* Tabs */}
            <div className="tabs">
              <button
                className={tab === "360view" ? "tab active" : "tab"}
                onClick={() => setTab("360view")}
              >
                🌐 {t.tab360Views || "360° Pregled"}
              </button>
              <button
                className={tab === "seatmap" ? "tab active" : "tab"}
                onClick={() => setTab("seatmap")}
              >
                🎫 {t.tabSeatMap || "Seat Map"}
              </button>
              <button
                className={tab === "reviews" ? "tab active" : "tab"}
                onClick={() => setTab("reviews")}
              >
                📝 {t.tabAllReviews}
              </button>
              <button
                className={tab === "submit" ? "tab active" : "tab"}
                onClick={() => setTab("submit")}
              >
                ✍️ {t.tabSubmitReview}
              </button>
              <button
                className={tab === "gallery" ? "tab active" : "tab"}
                onClick={() => setTab("gallery")}
              >
                📸 {t.tabGallery}
              </button>
              <button
                className={tab === "insights" ? "tab active" : "tab"}
                onClick={() => setTab("insights")}
              >
                📊 {t.tabInsights}
              </button>
              <button
                className={tab === "favorites" ? "tab active" : "tab"}
                onClick={() => setTab("favorites")}
              >
                ⭐ {t.tabFavorites || "Favorites"}
              </button>
              <button
                className={tab === "history" ? "tab active" : "tab"}
                onClick={() => setTab("history")}
              >
                📜 {t.tabHistory || "History"}
              </button>
              <button
                className={tab === "leaderboard" ? "tab active" : "tab"}
                onClick={() => setTab("leaderboard")}
              >
                🏆 {t.tabLeaderboard || "Leaderboard"}
              </button>
            </div>

            {/* Content */}
            {tab === "360view" && <Photo360Viewer venueId={selectedVenueId} />}
            {tab === "seatmap" && (
              <SeatMap
                venueId={selectedVenueId}
                venueName={venues.find((v) => v.id === selectedVenueId)?.name}
                autoSelectSeat={autoSelectSeat}
              />
            )}
            {tab === "reviews" && <AllReviews venueId={selectedVenueId} onProfileClick={setSelectedProfileEmail} />}
            {tab === "submit" && <ReviewForm venueId={selectedVenueId} token={token} />}
            {tab === "gallery" && <VenueGallery venueId={selectedVenueId} />}
            {tab === "insights" && <VenueInsights venueId={selectedVenueId} />}
            {tab === "favorites" && <Favorites onNavigateToSeat={handleNavigateToSeat} />}
            {tab === "history" && <ViewHistory onNavigateToSeat={handleNavigateToSeat} />}
            {tab === "leaderboard" && <Leaderboard />}
          </>
        )}
      </div>

      {/* User Profile Modal */}
      {selectedProfileEmail && (
        <UserProfile
          email={selectedProfileEmail}
          onClose={() => setSelectedProfileEmail(null)}
        />
      )}
    </>
  );
}

// AllReviews component with voting
function AllReviews({ venueId, onProfileClick }) {
  const { token } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [votes, setVotes] = useState({});
  const [userVotes, setUserVotes] = useState({});

  useEffect(() => {
    fetch(`${API_BASE}/venues/${venueId}/reviews`)
      .then((r) => r.json())
      .then((data) => {
        setReviews(data);
        setLoading(false);
        data.forEach((review) => {
          fetchVotes(review.id);
          if (token) {
            fetchUserVote(review.id);
          }
        });
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, [venueId, token]);

  const fetchVotes = async (reviewId) => {
    try {
      const res = await fetch(`${API_BASE}/reviews/${reviewId}/votes`);
      if (res.ok) {
        const data = await res.json();
        setVotes((prev) => ({ ...prev, [reviewId]: data }));
      }
    } catch (err) {
      console.error("Error fetching votes:", err);
    }
  };

  const fetchUserVote = async (reviewId) => {
    try {
      const res = await fetch(`${API_BASE}/reviews/${reviewId}/my-vote`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserVotes((prev) => ({ ...prev, [reviewId]: data.vote_type }));
      }
    } catch (err) {
      console.error("Error fetching user vote:", err);
    }
  };

  const handleVote = async (reviewId, voteType) => {
    if (!token) {
      alert("Morate biti prijavljeni da biste glasali");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/reviews/${reviewId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ vote_type: voteType })
      });

      if (res.ok) {
        fetchVotes(reviewId);
        fetchUserVote(reviewId);
      }
    } catch (err) {
      console.error("Error voting:", err);
    }
  };

  if (loading) return <div className="loading-small">Loading reviews...</div>;

  if (reviews.length === 0) {
    return (
      <div className="card">
        <p className="no-content">No reviews yet. Be the first to review!</p>
      </div>
    );
  }

  return (
    <div className="reviews-container">
      <h3 className="reviews-header">All Reviews ({reviews.length})</h3>
      {reviews.map((review) => (
        <div key={review.id} className="review-card">
          <div className="review-header">
            <div className="review-location">
              <span className="review-badge">Section: {review.section || "N/A"}</span>
              <span className="review-badge">Row: {review.row || "N/A"}</span>
              <span className="review-badge">Seat: {review.seat_number || "N/A"}</span>
            </div>
            <div
              className="review-user clickable-user"
              onClick={() => review.user_email && onProfileClick && onProfileClick(review.user_email)}
              title="Kliknite za prikaz profila"
            >
              {review.user_email?.split("@")[0] || "Anonymous"}
            </div>
          </div>

          <div className="review-ratings">
            <div className="rating-item">
              <span className="rating-label">Comfort</span>
              <div className="rating-stars">
                {"★".repeat(review.rating_comfort || 0)}
                {"☆".repeat(5 - (review.rating_comfort || 0))}
              </div>
              <span className="rating-value">{review.rating_comfort || "N/A"}/5</span>
            </div>
            <div className="rating-item">
              <span className="rating-label">Legroom</span>
              <div className="rating-stars">
                {"★".repeat(review.rating_legroom || 0)}
                {"☆".repeat(5 - (review.rating_legroom || 0))}
              </div>
              <span className="rating-value">{review.rating_legroom || "N/A"}/5</span>
            </div>
            <div className="rating-item">
              <span className="rating-label">Visibility</span>
              <div className="rating-stars">
                {"★".repeat(review.rating_visibility || 0)}
                {"☆".repeat(5 - (review.rating_visibility || 0))}
              </div>
              <span className="rating-value">{review.rating_visibility || "N/A"}/5</span>
            </div>
            <div className="rating-item">
              <span className="rating-label">Cleanliness</span>
              <div className="rating-stars">
                {"★".repeat(review.rating_cleanliness || 0)}
                {"☆".repeat(5 - (review.rating_cleanliness || 0))}
              </div>
              <span className="rating-value">{review.rating_cleanliness || "N/A"}/5</span>
            </div>
          </div>

          {review.text_review && (
            <div className="review-text">
              <p>{review.text_review}</p>
            </div>
          )}

          <div className="review-footer">
            <span className="review-date">
              {new Date(review.created_at).toLocaleDateString("hr-HR", {
                year: "numeric",
                month: "long",
                day: "numeric"
              })}
            </span>
            <div className="review-votes">
              <button
                className={`vote-btn vote-like ${userVotes[review.id] === 'like' ? 'active' : ''}`}
                onClick={() => handleVote(review.id, 'like')}
                title="Svidja mi se"
              >
                <span className="vote-icon">👍</span>
                <span className="vote-count">{votes[review.id]?.likes || 0}</span>
              </button>
              <button
                className={`vote-btn vote-dislike ${userVotes[review.id] === 'dislike' ? 'active' : ''}`}
                onClick={() => handleVote(review.id, 'dislike')}
                title="Ne svidja mi se"
              >
                <span className="vote-icon">👎</span>
                <span className="vote-count">{votes[review.id]?.dislikes || 0}</span>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ReviewForm component
function ReviewForm({ venueId, token }) {
  const [formData, setFormData] = useState({
    section: "",
    row: "",
    seat_number: "",
    price: "",
    rating_comfort: "",
    rating_legroom: "",
    rating_visibility: "",
    rating_cleanliness: "",
    text_review: ""
  });
  const [photos, setPhotos] = useState([]);
  const [status, setStatus] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setPhotos([...e.target.files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Submitting...");

    const formDataToSend = new FormData();
    formDataToSend.append("venue_id", venueId);
    Object.keys(formData).forEach((key) => {
      if (formData[key]) {
        formDataToSend.append(key, formData[key]);
      }
    });
    photos.forEach((photo) => {
      formDataToSend.append("photos", photo);
    });

    try {
      const response = await fetch(`${API_BASE}/reviews`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (response.ok) {
        setStatus("Review submitted successfully!");
        setFormData({
          section: "",
          row: "",
          seat_number: "",
          price: "",
          rating_comfort: "",
          rating_legroom: "",
          rating_visibility: "",
          rating_cleanliness: "",
          text_review: ""
        });
        setPhotos([]);
        setTimeout(() => setStatus(""), 3000);
      } else {
        setStatus("Failed to submit review");
      }
    } catch (error) {
      setStatus("Error: " + error.message);
    }
  };

  if (!token) {
    return (
      <div className="card">
        <p className="no-content">Morate biti prijavljeni da biste ostavili recenziju.</p>
      </div>
    );
  }

  return (
    <div className="card review-form-card">
      <h3>Submit Your Seat Review</h3>
      <form className="review-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h4 className="form-section-title">Seat Location</h4>
          <div className="grid-3">
            <div>
              <label className="label">Section</label>
              <input
                name="section"
                className="input"
                value={formData.section}
                onChange={handleChange}
                placeholder="e.g., A"
              />
            </div>
            <div>
              <label className="label">Row</label>
              <input
                name="row"
                className="input"
                value={formData.row}
                onChange={handleChange}
                placeholder="e.g., 5"
              />
            </div>
            <div>
              <label className="label">Seat Number</label>
              <input
                name="seat_number"
                className="input"
                value={formData.seat_number}
                onChange={handleChange}
                placeholder="e.g., 12"
              />
            </div>
          </div>
          <div style={{ marginTop: "16px" }}>
            <label className="label">Price</label>
            <input
              name="price"
              type="number"
              step="0.01"
              min="0"
              className="input"
              value={formData.price}
              onChange={handleChange}
              placeholder="e.g., 85.50"
            />
          </div>
        </div>

        <div className="form-section">
          <h4 className="form-section-title">Ratings (1-5 stars)</h4>
          <div className="grid-2">
            <div className="rating-input">
              <label className="label">Comfort</label>
              <input
                type="number"
                name="rating_comfort"
                className="input"
                min="1"
                max="5"
                value={formData.rating_comfort}
                onChange={handleChange}
                placeholder="1-5"
              />
            </div>
            <div className="rating-input">
              <label className="label">Legroom</label>
              <input
                type="number"
                name="rating_legroom"
                className="input"
                min="1"
                max="5"
                value={formData.rating_legroom}
                onChange={handleChange}
                placeholder="1-5"
              />
            </div>
            <div className="rating-input">
              <label className="label">Visibility</label>
              <input
                type="number"
                name="rating_visibility"
                className="input"
                min="1"
                max="5"
                value={formData.rating_visibility}
                onChange={handleChange}
                placeholder="1-5"
              />
            </div>
            <div className="rating-input">
              <label className="label">Cleanliness</label>
              <input
                type="number"
                name="rating_cleanliness"
                className="input"
                min="1"
                max="5"
                value={formData.rating_cleanliness}
                onChange={handleChange}
                placeholder="1-5"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4 className="form-section-title">Your Experience</h4>
          <textarea
            name="text_review"
            className="input textarea"
            value={formData.text_review}
            onChange={handleChange}
            placeholder="Share your experience with this seat..."
            rows="4"
          />
        </div>

        <div className="form-section">
          <h4 className="form-section-title">Photos (optional, max 5)</h4>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="input"
          />
          {photos.length > 0 && (
            <div className="file-preview">
              {photos.length} file(s) selected
            </div>
          )}
        </div>

        <button type="submit" className="btn-primary btn-large">
          Submit Review
        </button>
        {status && <div className="form-status">{status}</div>}
      </form>
    </div>
  );
}

// VenueGallery component with Virtual Tour
function VenueGallery({ venueId }) {
  const [photos, setPhotos] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [venue, setVenue] = useState(null);
  const [showVirtualTour, setShowVirtualTour] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/venues/${venueId}`)
      .then((r) => r.json())
      .then((data) => {
        setVenue(data);
      })
      .catch((e) => console.error(e));

    fetch(`${API_BASE}/venues/${venueId}/gallery`)
      .then((r) => r.json())
      .then((data) => {
        setPhotos(data);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, [venueId]);

  const sectionGroups = photos.reduce((acc, photo) => {
    const section = photo.section || "General";
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(photo);
    return acc;
  }, {});

  const sections = Object.keys(sectionGroups);

  if (loading) {
    return <div className="loading-small">Loading gallery...</div>;
  }

  const hasVirtualTour = venue && venue.virtual_tour_url;

  const getTourUrl = () => {
    if (!venue || !venue.virtual_tour_url) return '';
    let url = venue.virtual_tour_url;
    if (url.includes('matterport.com')) {
      const separator = url.includes('?') ? '&' : '?';
      url += `${separator}play=1&qs=1&brand=0&mls=2&wh=0&guides=0&title=0`;
    }
    return url;
  };

  return (
    <div className="seatgeek-gallery">
      {/* Virtual Tour Section */}
      {hasVirtualTour && (
        <div className="virtual-tour-section">
          <div className="virtual-tour-header">
            <h3>360 Virtualna Setnja</h3>
            <p className="gallery-subtitle">Istrazite {venue.name} u 360 panoramskom prikazu</p>
          </div>

          {!showVirtualTour ? (
            <div className="virtual-tour-preview" onClick={() => setShowVirtualTour(true)}>
              <div className="virtual-tour-overlay">
                <div className="play-button">
                  <span>▶</span>
                </div>
                <span className="tour-label">Kliknite za virtualnu setnju</span>
              </div>
            </div>
          ) : (
            <div className="virtual-tour-container">
              <div className="virtual-tour-controls">
                <button
                  className="close-tour-btn"
                  onClick={() => setShowVirtualTour(false)}
                >
                  Zatvori virtualnu setnju
                </button>
              </div>
              <iframe
                src={getTourUrl()}
                title="360 Virtual Tour"
                className="virtual-tour-iframe"
                allowFullScreen
              />
            </div>
          )}
        </div>
      )}

      {/* Gallery Header */}
      <div className="gallery-header">
        <h3>Seat Views by Section</h3>
        <p className="gallery-subtitle">Click on a section to see views from that area</p>
      </div>

      {sections.length === 0 ? (
        <div className="no-photos-message">
          <p className="no-content">No seat view photos yet. Be the first to share your view!</p>
        </div>
      ) : (
        <>
          {/* Section Cards Grid */}
          <div className="section-cards-grid">
            {sections.map((sectionName) => {
              const sectionPhotos = sectionGroups[sectionName];
              const mainPhoto = sectionPhotos[0];
              const photoCount = sectionPhotos.length;
              const ratingsArr = sectionPhotos.map(p => {
                const ratings = [p.rating_comfort, p.rating_visibility, p.rating_legroom, p.rating_cleanliness].filter(Boolean);
                return ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
              }).filter(r => r > 0);
              const avgRating = ratingsArr.length ? ratingsArr.reduce((a, b) => a + b, 0) / ratingsArr.length : 0;

              return (
                <div
                  key={sectionName}
                  className={`section-card ${selectedSection === sectionName ? 'active' : ''}`}
                  onClick={() => setSelectedSection(selectedSection === sectionName ? null : sectionName)}
                >
                  <div className="section-card-image">
                    {mainPhoto ? (
                      <img
                        src={`http://localhost:5000${mainPhoto.file_path}`}
                        alt={`View from ${sectionName}`}
                      />
                    ) : (
                      <div className="no-image-placeholder">
                        <span>📷</span>
                      </div>
                    )}
                    <div className="section-card-overlay">
                      <span className="section-name">Section {sectionName}</span>
                      <span className="photo-count">{photoCount} {photoCount === 1 ? 'photo' : 'photos'}</span>
                    </div>
                  </div>
                  <div className="section-card-info">
                    <div className="section-rating">
                      {avgRating > 0 ? (
                        <>
                          <span className="stars">{'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}</span>
                          <span className="rating-text">{avgRating.toFixed(1)}</span>
                        </>
                      ) : (
                        <span className="no-rating">No ratings yet</span>
                      )}
                    </div>
                    <div className="section-reviews-count">
                      {photoCount} {photoCount === 1 ? 'view' : 'views'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Expanded Section View */}
          {selectedSection && (
            <div className="section-expanded">
              <div className="section-expanded-header">
                <h4>Views from Section {selectedSection}</h4>
                <button className="close-btn" onClick={() => setSelectedSection(null)}>X</button>
              </div>
              <div className="section-photos-grid">
                {sectionGroups[selectedSection].map((photo) => (
                  <div key={photo.id} className="section-photo-item">
                    <img
                      src={`http://localhost:5000${photo.file_path}`}
                      alt={`View from Section ${selectedSection}`}
                    />
                    <div className="photo-info">
                      <span className="photo-location">
                        Row {photo.row || '?'}, Seat {photo.seat_number || '?'}
                      </span>
                      {photo.text_review && (
                        <p className="photo-comment">"{photo.text_review}"</p>
                      )}
                      <span className="photo-author">by {photo.user_email?.split('@')[0] || 'Anonymous'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// VenueInsights component
function VenueInsights({ venueId }) {
  const [stats, setStats] = useState(null);
  const [insight, setInsight] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/venues/${venueId}/stats`)
      .then((r) => r.json())
      .then(setStats)
      .catch((e) => console.error(e));

    fetch(`${API_BASE}/venues/${venueId}/insights`)
      .then((r) => {
        if (r.ok) return r.json();
        return null;
      })
      .then(setInsight)
      .catch((e) => console.error(e));
  }, [venueId]);

  if (!stats) return <div className="loading-small">Loading...</div>;

  // Calculate overall average from all rating categories
  const calculateOverallAvg = () => {
    const ratings = [stats.avg_comfort, stats.avg_legroom, stats.avg_visibility, stats.avg_cleanliness].filter(r => r != null);
    if (ratings.length === 0) return null;
    return ratings.reduce((a, b) => a + b, 0) / ratings.length;
  };
  const overallAvg = calculateOverallAvg();

  return (
    <div className="card insights-card">
      <h3>Statistike i Uvidi</h3>

      {/* Overall Average - Main Highlight */}
      <div className="overall-rating-box">
        <div className="overall-rating-circle">
          <span className="overall-rating-value">
            {overallAvg ? overallAvg.toFixed(1) : "N/A"}
          </span>
          <span className="overall-rating-max">/5</span>
        </div>
        <div className="overall-rating-label">Prosječna Ocjena</div>
        <div className="overall-rating-reviews">{stats.total_reviews || 0} recenzija</div>
      </div>

      {/* Detailed Ratings */}
      <div className="stats-detailed">
        <h4>Detaljne Ocjene</h4>
        <div className="rating-bars">
          <div className="rating-bar-item">
            <span className="rating-bar-label">🪑 Udobnost</span>
            <div className="rating-bar-track">
              <div
                className="rating-bar-fill"
                style={{ width: `${(stats.avg_comfort || 0) * 20}%` }}
              ></div>
            </div>
            <span className="rating-bar-value">{stats.avg_comfort ? stats.avg_comfort.toFixed(1) : "N/A"}</span>
          </div>
          <div className="rating-bar-item">
            <span className="rating-bar-label">👁️ Vidljivost</span>
            <div className="rating-bar-track">
              <div
                className="rating-bar-fill"
                style={{ width: `${(stats.avg_visibility || 0) * 20}%` }}
              ></div>
            </div>
            <span className="rating-bar-value">{stats.avg_visibility ? stats.avg_visibility.toFixed(1) : "N/A"}</span>
          </div>
          <div className="rating-bar-item">
            <span className="rating-bar-label">🦵 Prostor za noge</span>
            <div className="rating-bar-track">
              <div
                className="rating-bar-fill"
                style={{ width: `${(stats.avg_legroom || 0) * 20}%` }}
              ></div>
            </div>
            <span className="rating-bar-value">{stats.avg_legroom ? stats.avg_legroom.toFixed(1) : "N/A"}</span>
          </div>
          <div className="rating-bar-item">
            <span className="rating-bar-label">✨ Čistoća</span>
            <div className="rating-bar-track">
              <div
                className="rating-bar-fill"
                style={{ width: `${(stats.avg_cleanliness || 0) * 20}%` }}
              ></div>
            </div>
            <span className="rating-bar-value">{stats.avg_cleanliness ? stats.avg_cleanliness.toFixed(1) : "N/A"}</span>
          </div>
        </div>
      </div>

      {/* Price Info */}
      {stats.avg_price && (
        <div className="price-info-box">
          <span className="price-icon">💰</span>
          <span className="price-label">Prosječna cijena:</span>
          <span className="price-value">{stats.avg_price.toFixed(0)} €</span>
        </div>
      )}

      {insight && (
        <div className="ai-section">
          <h4>🤖 AI Sažetak</h4>
          <div className="ai-summary">{insight.summary_text}</div>
        </div>
      )}
    </div>
  );
}

// AdminPanel component
function AdminPanel({ token, onClose }) {
  const [adminTab, setAdminTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [newVenue, setNewVenue] = useState({ name: "", address: "", type: "", category: "stadium", virtual_tour_url: "" });

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [usersRes, venuesRes] = await Promise.all([
        fetch(`${API_BASE}/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/venues`)
      ]);
      if (usersRes.ok) setUsers(await usersRes.json());
      if (venuesRes.ok) setVenues(await venuesRes.json());
    } catch (err) {
      console.error("Failed to fetch admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAdmin = async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/toggle-admin`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMessage("Admin status updated!");
        fetchAdminData();
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      console.error("Failed to toggle admin:", err);
    }
  };

  const deleteUser = async (userId) => {
    if (!confirm("Jeste li sigurni da zelite obrisati ovog korisnika?")) return;
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMessage("Korisnik obrisan!");
        fetchAdminData();
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      console.error("Failed to delete user:", err);
    }
  };

  const addVenue = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/admin/venues`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(newVenue)
      });
      if (res.ok) {
        setMessage("Venue dodan!");
        setNewVenue({ name: "", address: "", type: "", category: "stadium", virtual_tour_url: "" });
        fetchAdminData();
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      console.error("Failed to add venue:", err);
    }
  };

  const deleteVenue = async (venueId) => {
    if (!confirm("Jeste li sigurni da zelite obrisati ovaj venue?")) return;
    try {
      const res = await fetch(`${API_BASE}/admin/venues/${venueId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMessage("Venue obrisan!");
        fetchAdminData();
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      console.error("Failed to delete venue:", err);
    }
  };

  if (loading) return <div className="loading-small">Ucitavanje admin panela...</div>;

  return (
    <div className="admin-panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 className="admin-title">Admin Panel</h2>
        <button className="btn-secondary" onClick={onClose}>Zatvori Admin Panel</button>
      </div>

      {message && <div className="admin-message">{message}</div>}

      <div className="admin-tabs">
        <button className={`admin-tab ${adminTab === "users" ? "active" : ""}`} onClick={() => setAdminTab("users")}>
          Korisnici ({users.length})
        </button>
        <button className={`admin-tab ${adminTab === "venues" ? "active" : ""}`} onClick={() => setAdminTab("venues")}>
          Venues ({venues.length})
        </button>
      </div>

      {adminTab === "users" && (
        <div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Admin</th>
                <th>Verificiran</th>
                <th>Akcije</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`admin-badge ${u.is_admin ? "admin" : "user"}`}>
                      {u.is_admin ? "Admin" : "User"}
                    </span>
                  </td>
                  <td>{u.is_verified ? "Da" : "Ne"}</td>
                  <td>
                    <button className="btn-small btn-toggle" onClick={() => toggleAdmin(u.id)}>
                      {u.is_admin ? "Makni Admin" : "Postavi Admin"}
                    </button>
                    <button className="btn-small btn-danger" onClick={() => deleteUser(u.id)}>
                      Obrisi
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {adminTab === "venues" && (
        <div>
          <div className="admin-form-card">
            <h3>Dodaj novi Venue</h3>
            <form className="admin-form" onSubmit={addVenue}>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Naziv"
                  value={newVenue.name}
                  onChange={(e) => setNewVenue({ ...newVenue, name: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Adresa"
                  value={newVenue.address}
                  onChange={(e) => setNewVenue({ ...newVenue, address: e.target.value })}
                />
              </div>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Tip (npr. stadium, arena)"
                  value={newVenue.type}
                  onChange={(e) => setNewVenue({ ...newVenue, type: e.target.value })}
                />
                <select
                  value={newVenue.category}
                  onChange={(e) => setNewVenue({ ...newVenue, category: e.target.value })}
                >
                  <option value="stadium">Stadium</option>
                  <option value="arena">Arena</option>
                  <option value="theatre">Theatre</option>
                </select>
              </div>
              <input
                type="text"
                placeholder="Virtual Tour URL (opcionalno)"
                value={newVenue.virtual_tour_url}
                onChange={(e) => setNewVenue({ ...newVenue, virtual_tour_url: e.target.value })}
              />
              <button type="submit" className="btn-primary">Dodaj Venue</button>
            </form>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Naziv</th>
                <th>Adresa</th>
                <th>Kategorija</th>
                <th>Akcije</th>
              </tr>
            </thead>
            <tbody>
              {venues.map((v) => (
                <tr key={v.id}>
                  <td>{v.id}</td>
                  <td>{v.name}</td>
                  <td>{v.address}</td>
                  <td>
                    <span className={`category-badge ${v.category}`}>{v.category}</span>
                  </td>
                  <td>
                    <button className="btn-small btn-danger" onClick={() => deleteVenue(v.id)}>
                      Obrisi
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;
