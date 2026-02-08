import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { apiClient } from "../api/client";
import "./Login.css";

export default function Profile() {
  const history = useHistory();
  const [user, setUser] = useState(null);
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        setUser(userData);

        // Fetch full profile from API
        const profile = await apiClient.getCurrentUser();
        setUser(profile);
        setBio(profile.bio || "");
        setLoading(false);
      } catch (err) {
        console.error("Error loading profile:", err);
        setError(err.message || "Failed to load profile");
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSaveProfile = async () => {
    try {
      await apiClient.updateProfile(user.id, bio, null, "light");
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to update profile");
    }
  };

  if (loading) {
    return (
      <div className="login-page-wrapper">
        <div className="login-modal">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="login-page-wrapper">
        <div className="login-modal">
          <p>No user logged in</p>
          <button onClick={() => history.push("/")}>Back to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page-wrapper">
      <div className="profile-modal" style={{ maxWidth: "500px" }}>
        <h2 className="login-subtitle">My Profile</h2>

        {error && (
          <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>
        )}
        {success && (
          <div style={{ color: "green", marginBottom: "1rem" }}>{success}</div>
        )}

        <div className="input-wrapper">
          <label className="label-text">Username</label>
          <input
            type="text"
            value={user.username || ""}
            disabled
            className="login-input"
            style={{ backgroundColor: "#f0f0f0" }}
          />
        </div>

        <div className="input-wrapper">
          <label className="label-text">Email</label>
          <input
            type="email"
            value={user.email || ""}
            disabled
            className="login-input"
            style={{ backgroundColor: "#f0f0f0" }}
          />
        </div>

        <div className="input-wrapper">
          <label className="label-text">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="login-input"
            placeholder="Tell us about yourself"
            style={{ height: "20px", resize: "none" }}
          />
        </div>

        <div className="btn-container">
          <button onClick={handleSaveProfile} className="login-login">
            Save Profile
          </button>
          <button
            onClick={() => history.push("/home")}
            className="login-login"
            style={{ background: "#999", marginTop: "0.5rem" }}
          >
            Back to Feed
          </button>
        </div>

        <div className="login-footer">
          <p className="login-p">
            <button
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                history.push("/");
              }}
              style={{
                background: "none",
                border: "none",
                color: "#ec407a",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Logout
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
