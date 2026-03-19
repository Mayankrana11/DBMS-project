import React, { useState } from "react";
import { bookRide } from "../api";

function BookRide() {
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");

  const handleBook = async () => {
    const token = localStorage.getItem("token");


    if (!pickup || !drop || pickup.trim() === "" || drop.trim() === "") {
      alert("Please enter both pickup and drop locations");
      return;
    }

    try {
      const res = await bookRide(token, {
        pickup: pickup.trim(),
        drop_off: drop.trim(),
      });

   
      if (res.error) {
        alert(res.error);
        return;
      }

  
      alert(`Ride ID: ${res.data.ride_id}, Driver: ${res.data.driver_id}`);

      
      setPickup("");
      setDrop("");

    } catch (err) {
      console.error("BOOK RIDE ERROR:", err);
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <div>
      {/* Title */}
      <h3 style={{ marginBottom: "15px" }}>🚗 Book Your Ride</h3>

      {/* Pickup */}
      <input
        className="input"
        placeholder="Pickup Location"
        value={pickup}
        onChange={(e) => setPickup(e.target.value)}
      />

      {/* Drop */}
      <input
        className="input"
        placeholder="Drop Location"
        value={drop}
        onChange={(e) => setDrop(e.target.value)}
      />

      {/* Button */}
      <button className="button" onClick={handleBook}>
        Confirm Ride
      </button>
    </div>
  );
}

export default BookRide;