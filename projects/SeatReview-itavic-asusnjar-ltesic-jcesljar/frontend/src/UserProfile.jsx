import { useState, useEffect } from "react";

const API_BASE = "http://localhost:5000/api";

function UserProfile({ email, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (email) {
      fetchProfile();
    }
  }, [email]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/users/profile/${encodeURIComponent(email)}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else {
        setError("Korisnik nije pronađen");
      }
    } catch (err) {
      setError("Greška pri učitavanju profila");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Nepoznato";
    const date = new Date(dateStr);
    return date.toLocaleDateString("hr-HR", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  const getMemberDuration = (dateStr) => {
    if (!dateStr) return "";
    const joinDate = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now - joinDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) return `${diffDays} dana`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} mjeseci`;
    return `${Math.floor(diffDays / 365)} godina`;
  };

  if (!email) return null;

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <button className="profile-close-btn" onClick={onClose}>×</button>

        {loading ? (
          <div className="profile-loading">Učitavanje profila...</div>
        ) : error ? (
          <div className="profile-error">{error}</div>
        ) : profile ? (
          <>
            {/* Header */}
            <div className="profile-header">
              <div className="profile-avatar">
                {profile.username?.charAt(0).toUpperCase() || "?"}
              </div>
              <div className="profile-title">
                <h2>{profile.username}</h2>
                <span className="profile-email">{profile.email}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="profile-stats">
              <div className="profile-stat">
                <span className="stat-number">{profile.review_count}</span>
                <span className="stat-label">Recenzija</span>
              </div>
              <div className="profile-stat">
                <span className="stat-number">{profile.favorite_count}</span>
                <span className="stat-label">Favorita</span>
              </div>
              <div className="profile-stat">
                <span className="stat-number">{getMemberDuration(profile.member_since)}</span>
                <span className="stat-label">Član</span>
              </div>
            </div>

            {/* Member since */}
            <div className="profile-info-row">
              <span className="info-icon">📅</span>
              <span>Član od: <strong>{formatDate(profile.member_since)}</strong></span>
            </div>

            {/* Average ratings */}
            {profile.review_count > 0 && profile.avg_ratings.comfort && (
              <div className="profile-avg-ratings">
                <h4>Prosječne ocjene</h4>
                <div className="avg-rating-items">
                  <div className="avg-rating-item">
                    <span className="rating-emoji">🪑</span>
                    <span className="rating-name">Udobnost</span>
                    <span className="rating-value">{profile.avg_ratings.comfort}/5</span>
                  </div>
                  <div className="avg-rating-item">
                    <span className="rating-emoji">👁️</span>
                    <span className="rating-name">Vidljivost</span>
                    <span className="rating-value">{profile.avg_ratings.visibility}/5</span>
                  </div>
                  <div className="avg-rating-item">
                    <span className="rating-emoji">🦵</span>
                    <span className="rating-name">Prostor</span>
                    <span className="rating-value">{profile.avg_ratings.legroom}/5</span>
                  </div>
                </div>
              </div>
            )}

            {/* Recent reviews */}
            {profile.recent_reviews && profile.recent_reviews.length > 0 && (
              <div className="profile-recent-reviews">
                <h4>Nedavne recenzije</h4>
                <div className="recent-reviews-list">
                  {profile.recent_reviews.map((review) => (
                    <div key={review.id} className="recent-review-item">
                      <div className="recent-review-header">
                        <span className="venue-name">{review.venue_name}</span>
                        <span className="seat-info">
                          {review.section} - Red {review.row}, Sjedalo {review.seat_number}
                        </span>
                      </div>
                      {review.text_review && (
                        <p className="recent-review-text">"{review.text_review}"</p>
                      )}
                      <div className="recent-review-ratings">
                        <span>⭐ {((review.rating_comfort + review.rating_visibility + review.rating_legroom) / 3).toFixed(1)}/5</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

export default UserProfile;
