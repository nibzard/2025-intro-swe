import { useState } from "react";

function AuthPage({ onAuthSuccess }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  function resetForm() {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError("");
  }

  function validateEmail(value) {
    return value.includes("@") && value.includes(".");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!validateEmail(email)) {
      setError("Unesite ispravan email.");
      return;
    }
    if (!password) {
      setError("Unesite lozinku.");
      return;
    }

    try {
      let userEmail;
      if (mode === "login") {
        userEmail = loginUser(email, password);
      } else {
        if (password.length < 4) {
          setError("Lozinka mora imati barem 4 znaka.");
          return;
        }
        if (password !== confirmPassword) {
          setError("Lozinke se ne podudaraju.");
          return;
        }
        userEmail = registerUser(email, password);
      }
      resetForm();
      onAuthSuccess(userEmail);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="auth-root">
      <div className="phone-frame">
        <div className="auth-card">
          <h1 className="auth-title">Osobne financije</h1>
          <p className="auth-subtitle">Prijavi se ili kreiraj račun</p>

          <div className="tabs-row auth-tabs">
            <button
              type="button"
              className={mode === "login" ? "tab active" : "tab"}
              onClick={() => setMode("login")}
            >
              Prijava
            </button>
            <button
              type="button"
              className={mode === "register" ? "tab active" : "tab"}
              onClick={() => setMode("register")}
            >
              Registracija
            </button>
          </div>

          <form className="form" onSubmit={handleSubmit}>
            <div className="form-row">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-row">
              <label>Lozinka</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {mode === "register" && (
              <div className="form-row">
                <label>Potvrdi lozinku</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            )}
            {error && <p className="error-text">{error}</p>}

            <button className="btn-primary full" type="submit">
              {mode === "login" ? "Prijava" : "Registracija"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
