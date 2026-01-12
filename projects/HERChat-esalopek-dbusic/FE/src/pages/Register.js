import { useState } from "react";
import "./Login.css";
import { useHistory } from "react-router-dom";

function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  console.log(username, password);
  const history = useHistory();

  return (
    <div className="login-page-wrapper">
      <div className="login-modal">
        <h2 className="login-subtitle">Register</h2>

        <div className="input-wrapper">
          <label htmlFor="username" className="label-text">
            Username
          </label>
          <input
            type="text"
            onChange={(e) => {
              setUsername(e.target.value);
            }}
            className="login-input"
            placeholder="example@gmail.com"
          />
        </div>
        <div className="input-wrapper">
          <label htmlFor="password" className="label-text">
            Password
          </label>
          <input
            type="password"
            onChange={(e) => {
              setPassword(e.target.value);
            }}
            className="login-input"
          />
        </div>
        <div className="btn-container">
          <button onClick={() => history.push("/home")} className="login-login">
            Register{" "}
          </button>
        </div>
        <div className="login-footer">
          <p className="login-p">You already registerd?</p>
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
