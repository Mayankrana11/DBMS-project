import React from "react";
import BookRide from "./Bookride";

function Dashboard({ setLoggedIn }) {
  const handleLogout = () => {
    localStorage.removeItem("token");
    setLoggedIn(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f4f6f9" }}>
      
      {/* 🔷 Top Navbar */}
      <div
        style={{
          background: "#4f46e5",
          color: "white",
          padding: "15px 30px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2>🚗 Ride Dashboard</h2>

        <button
          onClick={handleLogout}
          style={{
            background: "white",
            color: "#4f46e5",
            border: "none",
            padding: "8px 16px",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>

      {/* 🔷 Main Content */}
      <div style={{ padding: "30px" }}>
        
        {/* Welcome Card */}
        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 5px 15px rgba(0,0,0,0.08)",
            marginBottom: "20px",
          }}
        >
          <h3>Welcome 👋</h3>
          <p>Book your ride easily and quickly.</p>
        </div>

        {/* Book Ride Section */}
        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 5px 15px rgba(0,0,0,0.08)",
          }}
        >
          <h3 style={{ marginBottom: "15px" }}>Book a Ride</h3>
          <BookRide />
        </div>

      </div>
    </div>
  );
}

export default Dashboard;