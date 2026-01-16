import React from "react";
import { useAuth } from "./AuthContext";

function Profile() {
  const { user, logout } = useAuth();

  if (!user) {
    return <div className="loading">Loading profile...</div>;
  }

  return (
    <div className="container">
      <div className="card">
        <h2>My Profile</h2>
        <div style={{ marginTop: "20px" }}>
          <div className="profile-item">
            <strong>Email:</strong> {user.email}
          </div>
          <div className="profile-item">
            <strong>Member Since:</strong>{" "}
            {new Date(user.created_at).toLocaleDateString()}
          </div>
          <div className="profile-item">
            <strong>Total Reviews:</strong> {user.reviewCount || 0}
          </div>
        </div>
        <button
          className="btn btn-secondary"
          onClick={logout}
          style={{ marginTop: "20px" }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default Profile;
