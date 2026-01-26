import { useState, useEffect } from "react";
import API_URL from "./config";
import { useLanguage } from "./LanguageContext";
import { translations } from "./translations";

const API_BASE = `${API_URL}/api`;

function UserProfile({ email, onClose }) {
  const { language } = useLanguage();
  const t = translations[language];
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
        setError(t.userNotFound);
      }
    } catch (err) {
      setError(t.errorLoadingProfile);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return t.unknown;
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'hr' ? "hr-HR" : "en-US", {
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

    if (diffDays < 30) return `${diffDays} ${t.days}`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} ${t.months}`;
    return `${Math.floor(diffDays / 365)} ${t.years}`;
  };

  if (!email) return null;

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <button className="profile-close-btn" onClick={onClose}>×</button>

        {loading ? (
          <div className="profile-loading">{t.loadingProfile}</div>
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
                <span className="stat-label">{t.reviewsLabel}</span>
              </div>
              <div className="profile-stat">
                <span className="stat-number">{profile.favorite_count}</span>
                <span className="stat-label">{t.favoritesLabel}</span>
              </div>
              <div className="profile-stat">
                <span className="stat-number">{getMemberDuration(profile.member_since)}</span>
                <span className="stat-label">{t.memberLabel}</span>
              </div>
            </div>

            {/* Member since */}
            <div className="profile-info-row">
              <span className="info-icon">📅</span>
              <span>{t.memberSince}: <strong>{formatDate(profile.member_since)}</strong></span>
            </div>

            {/* Average ratings */}
            {profile.review_count > 0 && profile.avg_ratings.comfort && (
              <div className="profile-avg-ratings">
                <h4>{t.averageRatings}</h4>
                <div className="avg-rating-items">
                  <div className="avg-rating-item">
                    <span className="rating-emoji">🪑</span>
                    <span className="rating-name">{t.comfort}</span>
                    <span className="rating-value">{profile.avg_ratings.comfort}/5</span>
                  </div>
                  <div className="avg-rating-item">
                    <span className="rating-emoji">👁️</span>
                    <span className="rating-name">{t.visibility}</span>
                    <span className="rating-value">{profile.avg_ratings.visibility}/5</span>
                  </div>
                  <div className="avg-rating-item">
                    <span className="rating-emoji">🦵</span>
                    <span className="rating-name">{t.legroom}</span>
                    <span className="rating-value">{profile.avg_ratings.legroom}/5</span>
                  </div>
                </div>
              </div>
            )}

            {/* Recent reviews */}
            {profile.recent_reviews && profile.recent_reviews.length > 0 && (
              <div className="profile-recent-reviews">
                <h4>{t.recentReviews}</h4>
                <div className="recent-reviews-list">
                  {profile.recent_reviews.map((review) => (
                    <div key={review.id} className="recent-review-item">
                      <div className="recent-review-header">
                        <span className="venue-name">{review.venue_name}</span>
                        <span className="seat-info">
                          {review.section} - {t.row} {review.row}, {t.seat} {review.seat_number}
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
