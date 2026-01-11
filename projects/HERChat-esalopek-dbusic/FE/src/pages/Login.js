import { useState } from "react";
import { useHistory } from "react-router-dom";
import "./Login.css";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const history = useHistory();

  console.log(username, password);

  return (
    <div className="login-page-wrapper">
      <div className="login-modal">
        <h2 className="login-subtitle">Login</h2>
        <div className="input-wrapper">
          <label className="label-text" htmlFor="username">
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
          <label className="label-text" htmlFor="password">
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
            {" "}
            Login{" "}
          </button>
        </div>
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
