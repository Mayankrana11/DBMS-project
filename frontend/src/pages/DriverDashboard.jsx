import React, { useEffect, useState } from "react";

function DriverDashboard() {
  const [rides, setRides] = useState([]);

  const token = localStorage.getItem("token");

  /*
  ========================================
  LOGOUT
  ========================================
  */
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.reload();
  };

  /*
  ========================================
  SAFE TOKEN DECODE
  ========================================
  */
  let driverId = "Unknown";

  try {
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      driverId = payload.id;
    }
  } catch (err) {
    console.error("TOKEN DECODE ERROR:", err);
    handleLogout();
  }

  /*
  ========================================
  FETCH RIDES
  ========================================
  */
  const fetchRides = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/rides/requested", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      // 🔥 HANDLE AUTH ERROR
      if (res.status === 401 || data.error) {
        console.error("AUTH ERROR:", data);
        alert("Session expired. Please login again.");
        handleLogout();
        return;
      }

      // 🔥 PREVENT CRASH
      if (!Array.isArray(data)) {
        console.error("Invalid data format:", data);
        setRides([]);
        return;
      }

      setRides(data);

    } catch (err) {
      console.error("FETCH RIDES ERROR:", err);
    }
  };

  /*
  ========================================
  ACCEPT RIDE
  ========================================
  */
  const acceptRide = async (ride_id) => {
    try {
      const res = await fetch("http://localhost:5000/api/rides/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ride_id }),
      });

      const data = await res.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      fetchRides();
    } catch (err) {
      console.error("ACCEPT RIDE ERROR:", err);
    }
  };

  /*
  ========================================
  COMPLETE RIDE
  ========================================
  */
  const completeRide = async (ride_id) => {
    try {
      await fetch("http://localhost:5000/api/rides/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ride_id }),
      });

      fetchRides();
    } catch (err) {
      console.error("COMPLETE RIDE ERROR:", err);
    }
  };

  /*
  ========================================
  CANCEL RIDE
  ========================================
  */
  const cancelRide = async (ride_id) => {
    try {
      await fetch("http://localhost:5000/api/rides/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ride_id }),
      });

      fetchRides();
    } catch (err) {
      console.error("CANCEL RIDE ERROR:", err);
    }
  };

  /*
  ========================================
  AUTO REFRESH
  ========================================
  */
  useEffect(() => {
    if (!token) {
      handleLogout();
      return;
    }

    fetchRides();

    const interval = setInterval(fetchRides, 5000);
    return () => clearInterval(interval);
  }, []);

  /*
  ========================================
  UI
  ========================================
  */
  return (
    <div style={{ padding: "20px" }}>
      <h2>🚗 Driver Dashboard</h2>

      <h3>Driver ID: {driverId}</h3>

      <button onClick={handleLogout} style={{ marginBottom: "20px" }}>
        Logout
      </button>

      {!Array.isArray(rides) || rides.length === 0 ? (
        <p>No rides available</p>
      ) : (
        rides.map((r) => (
          <div
            key={r.ride_id}
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              margin: "10px 0",
              borderRadius: "8px",
            }}
          >
            <p>
              <b>Passenger:</b> {r.fname} {r.lname}
            </p>

            <p>
              <b>Route:</b> {r.pickup} → {r.drop_off}
            </p>

            <p>
              <b>Fare:</b> ₹{r.fare_amt}
            </p>

            <p>
              <b>Status:</b> {r.ride_status}
            </p>

            {r.ride_status === "requested" && (
              <button onClick={() => acceptRide(r.ride_id)}>
                Accept
              </button>
            )}

            {r.ride_status === "ongoing" && (
              <>
                <button
                  onClick={() => completeRide(r.ride_id)}
                  style={{ marginRight: "10px" }}
                >
                  Complete
                </button>

                <button onClick={() => cancelRide(r.ride_id)}>
                  Cancel
                </button>
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default DriverDashboard;