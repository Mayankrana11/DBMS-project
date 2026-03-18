import React from "react";
import BookRide from "./Bookride";

function Dashboard({ setLoggedIn }) {

  const handleLogout = () => {
    localStorage.removeItem("token");
    setLoggedIn(false);
  };

  return (
    <div>
      <h2>Dashboard</h2>

      <button onClick={handleLogout}>Logout</button>

      <BookRide />
    </div>
  );
}

export default Dashboard;