import React, { useState } from "react";
import { login } from "../api";

export default function Login({ setLoggedIn }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [type, setType] = useState("user"); // user or employee

  const handleLogin = async () => {
    try {
      const res = await login({
        type,
        username,
        password,
      });

      if (res.token) {
        console.log("LOGIN RESPONSE:", res); // DEBUG

        localStorage.setItem("token", res.token);

        // use backend role
        localStorage.setItem("role", res.role);

        setLoggedIn(true);
      } else {
        alert("Login failed");
      }
    } catch (err) {
      console.error(err);
      alert("Login error");
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
          Ride App Login 🚗
        </h2>
        {/* Username */}
        <input
          className="input"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        {/* Password */}
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