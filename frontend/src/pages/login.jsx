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
        localStorage.setItem("token", res.token);
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

        {/* Select Login Type */}
        <select
          className="input"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="user">User</option>
          <option value="employee">Employee</option>
        </select>

        {/* Username */}
        <input
          className="input"
          placeholder="Username (First Name)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        {/* Password */}
        <input
          className="input"
          type="password"
          placeholder="Password (Last Name)"
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