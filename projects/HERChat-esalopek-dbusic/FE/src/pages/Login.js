import { useState } from "react";
import { useHistory } from "react-router-dom";
import { apiClient } from "../api/client";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const history = useHistory();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await apiClient.login(email, password);
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      history.push("/home");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-modal">
        <h2 className="login-subtitle">Login</h2>
        {error && <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="input-wrapper">
            <label className="label-text" htmlFor="email">
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
            <label className="label-text" htmlFor="password">
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
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>
        </form>
        <div className="login-footer">
          <p className="login-p">Don't have account?</p>
          <p className="login-p">
            No worries, register{" "}
            <a href="./register" className="login-link">
              here
            </a>
            !
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
