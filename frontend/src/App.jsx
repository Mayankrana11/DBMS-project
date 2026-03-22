import React, { useState } from "react";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import DriverDashboard from "./pages/DriverDashboard";

function App() {
  const [loggedIn, setLoggedIn] = useState(
    !!localStorage.getItem("token")
  );

  return (
    <div>
      <h1>Ride Management System</h1>

      {loggedIn ? (
        <Dashboard setLoggedIn={setLoggedIn} />
      ) : (
        <Login setLoggedIn={setLoggedIn} />
      )}
    </div>
  );
}

export default App;