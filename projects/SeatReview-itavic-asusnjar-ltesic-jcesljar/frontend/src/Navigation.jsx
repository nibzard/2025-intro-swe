import { useState } from "react";
import { useAuth } from "./AuthContext";
import { useLanguage } from "./LanguageContext";
import { translations } from "./translations";
import API_URL from "./config";

const API_BASE = `${API_URL}/api`;

function Navigation({ onAdminClick }) {
  const { user, login, logout } = useAuth();
  const { language, switchLanguage } = useLanguage();
  const t = translations[language];

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // "login" or "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        login(data.token, data.user);
        setShowAuthModal(false);
        resetForm();
      } else {
        setError(data.error || "Prijava nije uspjela");
      }
    } catch (err) {
      setError("Greška pri povezivanju sa serverom");
    } finally {
      setLoading(false);
    }
  };

  // Password strength validation
  const validatePassword = (pwd) => {
    const checks = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)
    };
    return checks;
  };

  const getPasswordStrength = (pwd) => {
    const checks = validatePassword(pwd);
    const passed = Object.values(checks).filter(Boolean).length;
    if (passed <= 2) return { level: "weak", label: "Slaba", color: "#ef4444" };
    if (passed <= 3) return { level: "medium", label: "Srednja", color: "#f59e0b" };
    if (passed <= 4) return { level: "good", label: "Dobra", color: "#3b82f6" };
    return { level: "strong", label: "Jaka", color: "#22c55e" };
  };

  const passwordChecks = validatePassword(password);
  const passwordStrength = getPasswordStrength(password);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Lozinke se ne podudaraju");
      return;
    }

    // Check all password requirements
    const checks = validatePassword(password);
    if (!checks.length) {
      setError("Lozinka mora imati najmanje 8 znakova");
      return;
    }
    if (!checks.uppercase) {
      setError("Lozinka mora sadržavati barem jedno veliko slovo");
      return;
    }
    if (!checks.lowercase) {
      setError("Lozinka mora sadržavati barem jedno malo slovo");
      return;
    }
    if (!checks.number) {
      setError("Lozinka mora sadržavati barem jedan broj");
      return;
    }
    if (!checks.special) {
      setError("Lozinka mora sadržavati barem jedan specijalni znak (!@#$%^&*...)");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("Registracija uspješna! Možete se prijaviti.");
        setAuthMode("login");
        setPassword("");
        setConfirmPassword("");
      } else {
        setError(data.error || "Registracija nije uspjela");
      }
    } catch (err) {
      setError("Greška pri povezivanju sa serverom");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess("");
    setAuthMode("login");
  };

  const closeModal = () => {
    setShowAuthModal(false);
    resetForm();
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          {/* Logo */}
          <div className="navbar-brand">
            <span className="navbar-logo">
              🎫 {t.appTitle}
            </span>
          </div>

          {/* Right side - Language & User */}
          <div className="navbar-menu">
            {/* Language Switcher */}
            <div className="language-switcher">
              <button
                className={`lang-btn ${language === "hr" ? "active" : ""}`}
                onClick={() => switchLanguage("hr")}
                title="Hrvatski"
              >
                HR
              </button>
              <button
                className={`lang-btn ${language === "en" ? "active" : ""}`}
                onClick={() => switchLanguage("en")}
                title="English"
              >
                EN
              </button>
            </div>

            {/* User Info */}
            {user ? (
              <div className="navbar-user">
                {user.is_admin === 1 && (
                  <button className="navbar-admin" onClick={onAdminClick}>
                    ⚙️ Admin Panel
                  </button>
                )}
                <span className="navbar-profile">
                  <span className="user-icon">👤</span>
                  <span className="user-email">{user.email?.split("@")[0]}</span>
                </span>
                <button className="navbar-logout" onClick={logout}>
                  {t.logout}
                </button>
              </div>
            ) : (
              <div className="navbar-user">
                <button
                  className="btn-login"
                  onClick={() => setShowAuthModal(true)}
                >
                  🔐 {t.login || "Prijava"}
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="auth-modal-overlay" onClick={closeModal}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <button className="auth-modal-close" onClick={closeModal}>×</button>

            <div className="auth-tabs">
              <button
                className={`auth-tab ${authMode === "login" ? "active" : ""}`}
                onClick={() => { setAuthMode("login"); setError(""); setSuccess(""); }}
              >
                Prijava
              </button>
              <button
                className={`auth-tab ${authMode === "register" ? "active" : ""}`}
                onClick={() => { setAuthMode("register"); setError(""); setSuccess(""); }}
              >
                Registracija
              </button>
            </div>

            {error && <div className="auth-error">{error}</div>}
            {success && <div className="auth-success">{success}</div>}

            {authMode === "login" ? (
              <form className="auth-form" onSubmit={handleLogin}>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Unesite email"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Lozinka</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Unesite lozinku"
                    required
                  />
                </div>
                <button type="submit" className="btn-auth-submit" disabled={loading}>
                  {loading ? "Učitavanje..." : "Prijavi se"}
                </button>
                <p className="auth-switch">
                  Nemate račun?{" "}
                  <span onClick={() => { setAuthMode("register"); setError(""); }}>
                    Registrirajte se
                  </span>
                </p>
              </form>
            ) : (
              <form className="auth-form" onSubmit={handleRegister}>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Unesite email"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Lozinka</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Unesite lozinku"
                    required
                  />
                  {password && (
                    <div className="password-strength">
                      <div className="strength-bar">
                        <div
                          className="strength-fill"
                          style={{
                            width: `${Object.values(passwordChecks).filter(Boolean).length * 20}%`,
                            backgroundColor: passwordStrength.color
                          }}
                        />
                      </div>
                      <span className="strength-label" style={{ color: passwordStrength.color }}>
                        {passwordStrength.label}
                      </span>
                    </div>
                  )}
                  {password && (
                    <div className="password-requirements">
                      <div className={`req ${passwordChecks.length ? "valid" : ""}`}>
                        {passwordChecks.length ? "✓" : "○"} Najmanje 8 znakova
                      </div>
                      <div className={`req ${passwordChecks.uppercase ? "valid" : ""}`}>
                        {passwordChecks.uppercase ? "✓" : "○"} Veliko slovo (A-Z)
                      </div>
                      <div className={`req ${passwordChecks.lowercase ? "valid" : ""}`}>
                        {passwordChecks.lowercase ? "✓" : "○"} Malo slovo (a-z)
                      </div>
                      <div className={`req ${passwordChecks.number ? "valid" : ""}`}>
                        {passwordChecks.number ? "✓" : "○"} Broj (0-9)
                      </div>
                      <div className={`req ${passwordChecks.special ? "valid" : ""}`}>
                        {passwordChecks.special ? "✓" : "○"} Specijalni znak (!@#$%...)
                      </div>
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>Potvrdi lozinku</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ponovite lozinku"
                    required
                  />
                </div>
                <button type="submit" className="btn-auth-submit" disabled={loading}>
                  {loading ? "Učitavanje..." : "Registriraj se"}
                </button>
                <p className="auth-switch">
                  Već imate račun?{" "}
                  <span onClick={() => { setAuthMode("login"); setError(""); }}>
                    Prijavite se
                  </span>
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default Navigation;
