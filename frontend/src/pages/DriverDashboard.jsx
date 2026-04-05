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
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      setBalance(data.balance);
    } catch (err) {
      console.error("BALANCE ERROR:", err);
    }
  };

  const fetchRides = async () => {
    try {
      const res = await fetch(`${BASE_URL}/rides/requested`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      setRides(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("FETCH RIDES ERROR:", err);
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
    <div style={{ padding: "20px" }}>
      <h1>Ride Management System</h1>

      <h2>🚗 Driver Dashboard</h2>

      <h3>Driver ID: {driverId}</h3>

      <h3>Wallet Balance: ₹{balance}</h3>

      <button onClick={handleLogout}>Logout</button>

      {rides.length === 0 ? (
        <p>No rides available</p>
      ) : (
        rides.map((r) => (
          <div
            key={r.ride_id}
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              margin: "10px 0",
              borderRadius: "8px"
            }}
          >
            <p><b>Passenger:</b> {r.fname} {r.lname}</p>
            <p><b>Route:</b> {r.pickup} → {r.drop_off}</p>
            <p><b>Fare:</b> ₹{r.fare_amt}</p>
            <p><b>Status:</b> {r.ride_status}</p>

            {r.ride_status === "requested" && (
              <button onClick={() => acceptRide(r.ride_id)}>Accept</button>
            )}

            {r.ride_status === "ongoing" && (
              <>
                <button onClick={() => completeRide(r.ride_id)}>Complete</button>
                <button onClick={() => cancelRide(r.ride_id)}>Cancel</button>
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default DriverDashboard;