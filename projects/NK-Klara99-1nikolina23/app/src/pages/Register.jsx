import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function Register() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function signUp(e) {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return alert(error.message);

    alert("Registracija OK. Provjeri email ako je uključena potvrda, pa se ulogiraj.");
    nav("/login");
  }

  return (
    <div className="page">
      <div className="card">
        <h2>Registracija</h2>
        <p className="muted">Napravi novi račun.</p>

        <form onSubmit={signUp} className="form">
          <label className="label">
            Email
            <input
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              placeholder="npr. ana@gmail.com"
            />
          </label>

          <label className="label">
            Lozinka (min 6 znakova)
            <input
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              minLength={6}
              required
              placeholder="••••••••"
            />
          </label>

          <button className="btn" type="submit">Registracija</button>
        </form>

        <div className="linkRow">
          Već imaš račun? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}
