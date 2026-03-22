import React, { useState } from "react";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import DriverDashboard from "./pages/DriverDashboard";

function App() {
  const [loggedIn, setLoggedIn] = useState(
    !!localStorage.getItem("token")
  );

  const role = localStorage.getItem("role");

  return (
    <div>
      <h1>Ride Management System</h1>

      {!loggedIn ? (
        <Login setLoggedIn={setLoggedIn} />
      ) : role === "driver" ? (
        <DriverDashboard setLoggedIn={setLoggedIn} />
      ) : (
        <Dashboard setLoggedIn={setLoggedIn} />
      )}
    </div>
  );
}

export default App;