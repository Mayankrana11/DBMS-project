import React, { useEffect, useState } from "react";
import { submitRating } from "../api";

const BASE_URL = "http://localhost:5000/api";

function BookRide() {
  const [pickup, setPickup] = useState("");
  const [dropOff, setDropOff] = useState("");
  const [balance, setBalance] = useState(0);

  const [currentRide, setCurrentRide] = useState(null);
  const [completedRide, setCompletedRide] = useState(null);

  const [rating, setRating] = useState(5);

  const token = localStorage.getItem("token");

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

  const bookRide = async () => {
    try {
      const res = await fetch(`${BASE_URL}/rides/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ pickup, drop_off: dropOff })
      });

      const data = await res.json();

      if (data.error) {
        alert(data.error);
      } else {
        alert(`Ride booked! ID: ${data.data.ride_id}`);
      }

      fetchBalance();
    } catch (err) {
      console.error(err);
    }
  };

  const checkRideStatus = async () => {
    try {
      const res = await fetch(`${BASE_URL}/rides/user-status`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();

      if (!data || data.message) return;

      if (data.ride_status === "completed") {
        setCompletedRide(data);
      } else {
        setCurrentRide(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBalance();
    checkRideStatus();

    const interval = setInterval(() => {
      fetchBalance();
      checkRideStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="driver-bg">
      <div className="dashboard">

        {/* HEADER */}
        <div className="dashboard-header">
          <h2>🚗 Ride Dashboard</h2>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>

        {/* WALLET */}
        <div className="stats-grid">
          <div className="stat-card">
            <h4>Wallet Balance</h4>
            <p>₹{balance}</p>
          </div>
        </div>

        {/* BOOK RIDE */}
        <div className="ride-card">
          <h3>📍 Book a Ride</h3>

          <input
            className="input"
            placeholder="Pickup Location"
            value={pickup}
            onChange={(e) => setPickup(e.target.value)}
          />

          <input
            className="input"
            placeholder="Drop Location"
            value={dropOff}
            onChange={(e) => setDropOff(e.target.value)}
          />

          <button className="button" onClick={bookRide}>
            Confirm Ride
          </button>
        </div>

        {/* DRIVER INFO */}
        {currentRide && currentRide.ride_status === "ongoing" && (
          <div className="ride-card">
            <h3>🚗 Driver Assigned</h3>
            <p>Driver ID: {currentRide.driver_id}</p>
            <p>
              Rating: ⭐{" "}
              {currentRide.rating_avg
                ? Number(currentRide.rating_avg).toFixed(1)
                : "New Driver"}
            </p>
          </div>
        )}

        {/* RATING */}
        {completedRide && completedRide.already_rated === 0 && (
          <div className="ride-card">
            <h3>⭐ Rate Your Driver</h3>

            <select
              className="input"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            >
              {[1,2,3,4,5].map(n => (
                <option key={n} value={n}>{n} ⭐</option>
              ))}
            </select>

            <button
              className="button"
              onClick={async () => {
                await submitRating(token, {
                  ride_id: completedRide.ride_id,
                  rating
                });

                alert("Rating submitted");
                setCompletedRide(null);
              }}
            >
              Submit Rating
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default BookRide;