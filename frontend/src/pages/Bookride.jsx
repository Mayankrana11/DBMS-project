import React, { useEffect, useState } from "react";
import { submitRating } from "../api";

function BookRide() {

  const [pickup, setPickup] = useState("");
  const [dropOff, setDropOff] = useState("");
  const [balance, setBalance] = useState(0);

  const [currentRide, setCurrentRide] = useState(null);
  const [completedRide, setCompletedRide] = useState(null);

  const [rating, setRating] = useState(5);

  const token = localStorage.getItem("token");
  console.log("CURRENT RIDE:", currentRide);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  /*
  =============================
  FETCH WALLET BALANCE
  =============================
  */
  const fetchBalance = async () => {
    try {

      const res = await fetch(
        "http://localhost:5000/api/wallet/balance",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await res.json();
      setBalance(data.balance);

    } catch (err) {
      console.error("BALANCE ERROR:", err);
    }
  };

  /*
  =============================
  BOOK RIDE
  =============================
  */
  const bookRide = async () => {

    try {

      const res = await fetch(
        "http://localhost:5000/api/rides/book",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            pickup,
            drop_off: dropOff
          })
        }
      );

      const data = await res.json();

      if (data.error) {
        alert(data.error);
      } else {
        alert(`Ride booked! Ride ID: ${data.data.ride_id}`);
      }

      fetchBalance();

    } catch (err) {
      console.error("BOOK ERROR:", err);
    }
  };

  /*
  =============================
  CHECK RIDE STATUS
  =============================
  */
  const checkRideStatus = async () => {

    try {

      const res = await fetch(
        "http://localhost:5000/api/rides/user-status",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await res.json();

      if (!data || data.message) return;

      setCurrentRide(null);

      if (data.ride_status === "completed") {
        setCompletedRide(data);
      }

    } catch (err) {
      console.error("STATUS ERROR:", err);
    }
  };

  /*
  =============================
  AUTO REFRESH
  =============================
  */
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
    <div style={{ padding: "20px" }}>

      <h1>Ride Management System</h1>

      <h2>🚗 Ride Dashboard</h2>

      <h3>Wallet Balance: ₹{balance}</h3>

      <button onClick={handleLogout}>Logout</button>

      <div style={{ marginTop: "20px" }}>

        <h3>Book a Ride</h3>

        <input
          placeholder="Pickup Location"
          value={pickup}
          onChange={(e) => setPickup(e.target.value)}
        />

        <br /><br />

        <input
          placeholder="Drop Location"
          value={dropOff}
          onChange={(e) => setDropOff(e.target.value)}
        />

        <br /><br />

        <button onClick={bookRide}>
          Confirm Ride
        </button>

      </div>

      {/* DRIVER INFO */}

      {currentRide &&
      currentRide.ride_status === "ongoing" && (

        <div style={{ marginTop: "20px" }}>
          <h3>Driver Assigned</h3>

          <p>Driver ID: {currentRide.driver_id}</p>

          <p>
            Driver Rating: ⭐
            {currentRide.rating_avg
              ? Number(currentRide.rating_avg).toFixed(1)
              : "New Driver"}
          </p>

        </div>

      )}

      {/* RATING UI */}

      {currentRide &&
      currentRide.ride_status === "completed" &&
      currentRide.driver_id &&
      currentRide.already_rated === 0 && (

        <div style={{ marginTop: "25px" }}>
          <h3>Rate your driver</h3>

          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
          >
            <option value={1}>1 ⭐</option>
            <option value={2}>2 ⭐</option>
            <option value={3}>3 ⭐</option>
            <option value={4}>4 ⭐</option>
            <option value={5}>5 ⭐</option>
          </select>

          <button
            onClick={async () => {
              await submitRating(token, {
                ride_id: currentRide.ride_id,
                rating
              });

              alert("Rating submitted");

              setCurrentRide(null); // remove panel
            }}
          >
            Submit Rating
          </button>
        </div>

      )}

    </div>
  );
}

export default BookRide;