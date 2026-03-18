import React, { useState } from "react";
import { bookRide } from "../api";

function BookRide() {
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");

  const handleBook = async () => {
    const token = localStorage.getItem("token");

    const res = await bookRide(token, {
      pickup,
      drop_off: drop,
      user_id: 125,
    });

    alert(JSON.stringify(res));
  };

  return (
    <div>
      <h3>Book Ride</h3>

      <input
        placeholder="Pickup"
        onChange={(e) => setPickup(e.target.value)}
      />

      <input
        placeholder="Drop"
        onChange={(e) => setDrop(e.target.value)}
      />

      <button onClick={handleBook}>Book Ride</button>
    </div>
  );
}

export default BookRide;