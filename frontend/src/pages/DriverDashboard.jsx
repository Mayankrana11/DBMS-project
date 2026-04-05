import React, { useEffect, useState } from "react";

const BASE_URL = "http://localhost:5000/api";

function DriverDashboard() {
  const [rides, setRides] = useState([]);
  const [balance, setBalance] = useState(0);

  const token = localStorage.getItem("token");
  const payload = JSON.parse(atob(token.split(".")[1]));
  const driverId = payload.id;

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  const fetchBalance = async () => {
    try {
      const res = await fetch(`${BASE_URL}/wallet/balance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setBalance(data.balance);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRides = async () => {
    try {
      const res = await fetch(`${BASE_URL}/rides/requested`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setRides(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const acceptRide = async (ride_id) => {
    await fetch(`${BASE_URL}/rides/accept`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ ride_id })
    });
    fetchRides();
  };

  const completeRide = async (ride_id) => {
    await fetch(`${BASE_URL}/rides/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ ride_id })
    });
    fetchRides();
    fetchBalance();
  };

  const cancelRide = async (ride_id) => {
    await fetch(`${BASE_URL}/rides/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ ride_id })
    });
    fetchRides();
  };

  useEffect(() => {
    fetchRides();
    fetchBalance();

    const interval = setInterval(() => {
      fetchRides();
      fetchBalance();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
  <div className="driver-bg">
    <div className="dashboard">

      {/* 🔝 HEADER */}
      <div className="dashboard-header">
        <h2>🚗 Driver Dashboard</h2>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* 📊 STATS */}
      <div className="stats-grid">
        <div className="stat-card">
          <h4>Driver ID</h4>
          <p>{driverId}</p>
        </div>

        <div className="stat-card">
          <h4>Wallet Balance</h4>
          <p>₹{balance}</p>
        </div>

        <div className="stat-card">
          <h4>Available Rides</h4>
          <p>{rides.length}</p>
        </div>
      </div>

      {/* 🚗 RIDES */}
      <h3 className="section-title">Available Rides</h3>

      <div className="rides-grid">
        {rides.length === 0 ? (
          <p className="empty">No rides available</p>
        ) : (
          rides.map((r) => (
            <div key={r.ride_id} className="ride-card">

              <div className="ride-header">
                <h4>{r.fname} {r.lname}</h4>
                <span className={`status ${r.ride_status}`}>
                  {r.ride_status}
                </span>
              </div>

              <p className="route">
                📍 {r.pickup} → {r.drop_off}
              </p>

              <p className="fare">₹{r.fare_amt}</p>

              <div className="actions">
                {r.ride_status === "requested" && (
                  <button
                    className="btn accept"
                    onClick={() => acceptRide(r.ride_id)}
                  >
                    Accept
                  </button>
                )}

                {r.ride_status === "ongoing" && (
                  <>
                    <button
                      className="btn complete"
                      onClick={() => completeRide(r.ride_id)}
                    >
                      Complete
                    </button>
                    <button
                      className="btn cancel"
                      onClick={() => cancelRide(r.ride_id)}
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  </div>
);
}

export default DriverDashboard;