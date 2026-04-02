import React from "react";

function AdminDashboard() {

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "/";
  };

  return (
    <div style={{ padding: "30px" }}>
      <h1>🛠 Admin / Manager Dashboard</h1>

      <p>Welcome to the Admin Panel.</p>

      <div style={{ marginTop: "30px" }}>
        <h3>Future Controls</h3>

        <ul>
          <li>View all users</li>
          <li>View all drivers</li>
          <li>View rides history</li>
          <li>Manage payments</li>
          <li>Analytics dashboard</li>
        </ul>
      </div>

      <button
        onClick={handleLogout}
        style={{
          marginTop: "40px",
          padding: "10px 20px",
          background: "black",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer"
        }}
      >
        Logout
      </button>
    </div>
  );
}

export default AdminDashboard;