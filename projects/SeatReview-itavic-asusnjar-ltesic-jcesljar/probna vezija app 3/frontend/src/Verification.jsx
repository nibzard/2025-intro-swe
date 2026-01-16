import React, { useState } from "react";

function Verification({ email, testCode, onVerified }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (code.length !== 6) {
      setError("Code must be 6 digits");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code })
      });

      const data = await response.json();

      if (response.ok) {
        onVerified();
      } else {
        setError(data.error || "Invalid verification code");
      }
    } catch (err) {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Verify Your Email</h2>
        <p style={{ textAlign: "center", marginBottom: "20px", color: "#6b7280" }}>
          We sent a 6-digit verification code to <strong>{email}</strong>
        </p>
        {testCode && (
          <div className="test-code-display">
            <p style={{ textAlign: "center", fontSize: "0.875rem", color: "#059669" }}>
              Test Mode - Your code:
            </p>
            <div style={{
              textAlign: "center",
              fontSize: "32px",
              fontWeight: "bold",
              letterSpacing: "8px",
              color: "#1d4ed8",
              margin: "10px 0"
            }}>
              {testCode}
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Enter 6-Digit Code</label>
            <input
              type="text"
              className="input"
              style={{
                textAlign: "center",
                fontSize: "24px",
                letterSpacing: "10px",
                fontWeight: "bold"
              }}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              maxLength="6"
              required
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Verification;
