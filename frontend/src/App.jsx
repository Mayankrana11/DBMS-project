import React, { useState } from "react";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import DriverDashboard from "./pages/DriverDashboard";

// TEMP ADMIN PAGE
function AdminPage({ setLoggedIn }) {
  return (
    <div>
      <h2>Admin / Manager Panel</h2>
      <p>This is a placeholder admin page.</p>

      <button
        onClick={() => {
          localStorage.clear();
          window.location.reload();
        }}
      >
        Logout
      </button>
    </div>
  );
}

function App() {
  const [loggedIn, setLoggedIn] = useState(
    !!localStorage.getItem("token")
  );

  const role = localStorage.getItem("role");

  console.log("CURRENT ROLE:", role); // DEBUG

  return (
    <div>
      <h1>Ride Management System</h1>

      {!loggedIn ? (
        <Login setLoggedIn={setLoggedIn} />
      ) : role === "driver" ? (
        <DriverDashboard setLoggedIn={setLoggedIn} />
      ) : role === "user" ? (
        <Dashboard setLoggedIn={setLoggedIn} />
      ) : (
        // TEMP: managers + employees both go here
        // TODO later create EmployeeDashboard.jsx
        <AdminPage setLoggedIn={setLoggedIn} />
      )}
    </div>
  );
}

export default App;