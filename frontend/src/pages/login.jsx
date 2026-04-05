import React, { useState } from "react";
import { login } from "../api";

export default function Login({ setLoggedIn }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await login({ username, password });

      if (res.token) {
        localStorage.setItem("token", res.token);
        localStorage.setItem("role", res.role);
        setLoggedIn(true);
      } else {
        alert("Invalid Credentials");
      }
    } catch (err) {
      alert("Login error");
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2>🚗 Ride App</h2>
        <p>Login to continue</p>

        <input
          className="input"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          className="input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="button" onClick={handleLogin}>
          Login
        </button>
      </div>
    </div>
  );
}