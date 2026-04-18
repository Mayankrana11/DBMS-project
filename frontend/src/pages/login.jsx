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
    <>
      <div className="login-wrapper">
        <div className="login-card">
          
          {/* Header Section */}
          <div className="login-header">
            <div className="login-icon-wrapper">
              <span role="img" aria-label="car">🚗</span>
            </div>
            <h2 className="login-title">
              {isLogin ? "Welcome Back" : "Create an Account"}
            </h2>
            <p className="login-subtitle">
              {isLogin ? "Sign in to access your rides." : "Join us and start riding today."}
            </p>
          </div>

          {/* Form Section */}
          <div className="login-body">
            {!isLogin && (
              <div className="register-fields animate-in">
                <div className="login-row">
                  <div className="input-group">
                    <label className="login-label">First Name *</label>
                    <input
                      className="login-input"
                      placeholder="John"
                      value={fname}
                      onChange={(e) => setFname(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label className="login-label">Last Name</label>
                    <input
                      className="login-input"
                      placeholder="Doe"
                      value={lname}
                      onChange={(e) => setLname(e.target.value)}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="login-label">Middle Name</label>
                  <input
                    className="login-input"
                    placeholder="Optional"
                    value={mname}
                    onChange={(e) => setMname(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label className="login-label">Email / Phone *</label>
                  <input
                    className="login-input"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="input-group">
              <label className="login-label">Username *</label>
              <input
                className="login-input"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="login-label">Password *</label>
              <input
                className="login-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button 
              className="login-btn"
              onClick={isLogin ? handleLogin : handleRegister}
            >
              {isLogin ? "Sign In" : "Create Account"}
            </button>

            <div className="login-footer">
              <p className="login-footer-text">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  className="login-link"
                  onClick={() => setIsLogin(!isLogin)}
                >
                  {isLogin ? "Sign up now" : "Log in here"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded CSS */}
      <style>{`
        .login-wrapper {
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(to bottom right, #eff6ff, #e0e7ff);
          padding: 1rem;
          font-family: system-ui, -apple-system, sans-serif;
          box-sizing: border-box;
        }
        .login-card {
          max-width: 28rem;
          width: 100%;
          background-color: #ffffff;
          border-radius: 1rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          border: 1px solid #f3f4f6;
          overflow: hidden;
        }
        .login-header {
          padding: 2.5rem 2rem 1.5rem;
          text-align: center;
        }
        .login-icon-wrapper {
          margin: 0 auto 1rem;
          display: flex;
          height: 4rem;
          width: 4rem;
          align-items: center;
          justify-content: center;
          border-radius: 9999px;
          background-color: #dbeafe;
          box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
          font-size: 1.875rem;
        }
        .login-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
          letter-spacing: -0.025em;
          margin: 0;
        }
        .login-subtitle {
          font-size: 0.875rem;
          color: #6b7280;
          margin-top: 0.5rem;
        }
        .login-body {
          padding: 0 2rem 2.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .register-fields {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .login-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }
        @media (min-width: 640px) {
          .login-row {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        .input-group {
          display: flex;
          flex-direction: column;
        }
        .login-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          color: #4b5563;
          text-transform: uppercase;
          letter-spacing: 0.025em;
          margin-bottom: 0.35rem;
        }
        .login-input {
          width: 100%;
          box-sizing: border-box;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          border: 1px solid #d1d5db;
          background-color: #f9fafb;
          color: #111827;
          transition: all 0.2s ease-in-out;
          font-family: inherit;

          font-size: 16px; /* prevents mobile zoom */
        }
        .login-input:focus {
          background-color: #ffffff;
          outline: none;
          border-color: transparent;
          box-shadow: 0 0 0 2px #3b82f6;
        }
        .login-btn {
          width: 100%;
          margin-top: 1rem;
          padding: 14px 16px;
          background-color: #2563eb;
          color: #ffffff;
          font-weight: 600;
          font-size: 16px;
          border-radius: 0.5rem;
          border: none;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }
        .login-btn:hover {
          background-color: #1d4ed8;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        .login-btn:active {
          transform: scale(0.98);
        }
        .login-footer {
          padding-top: 1rem;
          text-align: center;
          border-top: 1px solid #f3f4f6;
          margin-top: 0.5rem;
        }
        .login-footer-text {
          font-size: 0.875rem;
          color: #4b5563;
          margin: 0;
        }
        .login-link {
          font-weight: 600;
          color: #2563eb;
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          font-family: inherit;
          font-size: inherit;
          transition: color 0.2s;
        }
        .login-link:hover {
          color: #1e40af;
          text-decoration: underline;
        }
        
        /* Simple fade-in animation for register fields */
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-in {
          animation: slideUpFade 0.4s ease-out forwards;
        }
      `}</style>
    </>
  );
}