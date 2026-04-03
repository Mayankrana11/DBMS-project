import React, { useEffect, useState } from "react";

function BookRide() {
  const [pickup, setPickup] = useState("");
  const [dropOff, setDropOff] = useState("");
  const [balance, setBalance] = useState(0);

  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  const fetchBalance = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/wallet/balance", {
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

  const bookRide = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/rides/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          pickup,
          drop_off: dropOff
        })
      });

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

  useEffect(() => {
    fetchBalance();

    const interval = setInterval(fetchBalance, 5000);
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

        <button onClick={bookRide}>Confirm Ride</button>
      </div>
    </div>
  );
}

export default BookRide;