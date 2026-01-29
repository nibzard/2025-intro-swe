import { useState } from "react";
import "./Login.css";
import { useHistory } from "react-router-dom";
import { apiClient } from "../api/client";

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const history = useHistory();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await apiClient.register(username, email, password);
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      history.push("/home");
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-modal">
        <h2 className="login-subtitle">Register</h2>
        {error && <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>}
        <form onSubmit={handleRegister}>
          <div className="input-wrapper">
            <label htmlFor="username" className="label-text">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="login-input"
              placeholder="your_username"
              required
            />
          </div>
          <div className="input-wrapper">
            <label htmlFor="email" className="label-text">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="login-input"
              placeholder="example@gmail.com"
              required
            />
          </div>
          <div className="input-wrapper">
            <label htmlFor="password" className="label-text">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
              required
            />
          </div>
          <div className="btn-container">
            <button type="submit" className="login-login" disabled={loading}>
              {loading ? "Registering..." : "Register"}
            </button>
          </div>
        </form>
        <div className="login-footer">
          <p className="login-p">You already registered?</p>
          <p className="login-p">
            Go back to log in{" "}
            <a href="/" className="login-link">
              here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
