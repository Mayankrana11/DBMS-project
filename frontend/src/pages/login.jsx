import React, { useState } from "react";
import { login, register } from "../api";

export default function Login({ setLoggedIn }) {
  const [isLogin, setIsLogin] = useState(true);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fname, setFname] = useState("");
  const [mname, setMname] = useState("");
  const [lname, setLname] = useState("");
  const [email, setEmail] = useState("");

  const handleLogin = async () => {
    try {
      const res = await login({
        username,
        password,
      });

      if (res.token) {
        localStorage.setItem("token", res.token);
        localStorage.setItem("role", res.role);
        setLoggedIn(true);
      } else {
        alert("Invalid Credentials");
      }
    } catch (err) {
      console.error(err);
      alert("Login error: " + err.message);
    }
  };

  const handleRegister = async () => {
    try {
      if (!username || !password || !fname || !email) {
        alert("Please fill all required fields");
        return;
      }

      const res = await register({
        username,
        password,
        fname,
        mname,
        lname,
        email,
      });

      if (res.token) {
        localStorage.setItem("token", res.token);
        localStorage.setItem("role", res.role);
        setLoggedIn(true);
      }
    } catch (err) {
      console.error(err);
      alert("Registration error: " + err.message);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
          {isLogin ? "Ride App Login 🚗" : "Create Account 🚗"}
        </h2>

        {!isLogin && (
          <>
            <input
              className="input"
              placeholder="First Name *"
              value={fname}
              onChange={(e) => setFname(e.target.value)}
            />
            <input
              className="input"
              placeholder="Middle Name"
              value={mname}
              onChange={(e) => setMname(e.target.value)}
            />
            <input
              className="input"
              placeholder="Last Name"
              value={lname}
              onChange={(e) => setLname(e.target.value)}
            />
            <input
              className="input"
              placeholder="Email / Phone *"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </>
        )}

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

        <button className="button" onClick={isLogin ? handleLogin : handleRegister}>
          {isLogin ? "Login" : "Sign Up"}
        </button>

        <p style={{ textAlign: "center", marginTop: "15px" }}>
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <span
            style={{ color: "#007bff", cursor: "pointer", textDecoration: "underline" }}
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Sign Up" : "Login"}
          </span>
        </p>
      </div>
    </div>
  );
}