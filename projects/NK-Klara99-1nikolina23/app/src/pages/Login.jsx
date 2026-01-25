import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function signIn(e) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return alert(error.message);
    nav("/app");
  }

  return (
    <div className="page">
      <div className="card">
        <h2>Login</h2>
        <p className="muted">Ulogiraj se u aplikaciju.</p>

        <form onSubmit={signIn} className="form">
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
            Lozinka
            <input
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              placeholder="••••••••"
            />
          </label>

          <button className="btn" type="submit">Login</button>
        </form>

        <div className="linkRow">
          Nemaš račun? <Link to="/register">Registracija</Link>
        </div>
      </div>
    </div>
  );
}
