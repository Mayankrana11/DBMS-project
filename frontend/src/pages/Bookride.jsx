import React, { useEffect, useState } from "react";
import { submitRating } from "../api";
import { MapPin, Navigation, Wallet, Star, Car } from "lucide-react";

import MapView from "../components/mapview";
import LocationSearch from "../components/locationsearch";

const BASE_URL = "http://localhost:5000/api";

function BookRide() {

  const [pickup, setPickup] = useState("");
  const [dropOff, setDropOff] = useState("");
  const [balance, setBalance] = useState(0);

  const [currentRide, setCurrentRide] = useState(null);
  const [completedRide, setCompletedRide] = useState(null);

  const [rating, setRating] = useState(5);

  // ✅ NEW STATES (map)
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropCoords, setDropCoords] = useState(null);

  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);

  const token = localStorage.getItem("token");

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

  /*
  =============================
  BOOK RIDE (UNCHANGED)
  =============================
  */
  const bookRide = async () => {
    try {
      const res = await fetch(`${BASE_URL}/rides/book`, {
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

  /*
  =============================
  CHECK RIDE STATUS
  =============================
  */
  const checkRideStatus = async () => {
    try {
      const res = await fetch(`${BASE_URL}/rides/user-status`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!data || data.message) {
        setCurrentRide(null);
        return;
      }

      setCurrentRide(data);

      if (data.ride_status === "completed") {
        setCompletedRide(data);
      }

    } catch (err) {
      console.error("STATUS ERROR:", err);
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

  // ✅ NEW: route data handler
  const handleRouteData = ({ distance, duration }) => {
    setDistance(distance);
    setDuration(duration);
  };

  return (
    <div className="w-full min-h-screen bg-gray-100">

      {/* HEADER */}
      <div className="bg-black text-white flex justify-between items-center px-6 py-4 shadow">
        <div className="flex items-center gap-2">
          <Car size={22} />
          <h1 className="text-xl font-semibold">RideX</h1>
        </div>

        <button
          onClick={handleLogout}
          className="bg-red-500 px-4 py-2 rounded-lg hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      {/* MAIN */}
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6 p-6">

        {/* LEFT PANEL */}
        <div className="bg-white p-6 rounded-xl shadow">

          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Navigation size={18} /> Book a Ride
          </h2>

          {/* ✅ MAP */}
          <div className="mb-4">
            <MapView
              pickup={pickupCoords}
              drop={dropCoords}
              setRouteData={handleRouteData}
            />
          </div>

          {/* ✅ PICKUP SEARCH */}
          <LocationSearch
            placeholder="Enter Pickup Location"
            onSelect={(loc) => {
              setPickup(loc.name);
              setPickupCoords([loc.lat, loc.lon]);
            }}
          />

          {/* ✅ DROP SEARCH */}
          <LocationSearch
            placeholder="Enter Drop Location"
            onSelect={(loc) => {
              setDropOff(loc.name);
              setDropCoords([loc.lat, loc.lon]);
            }}
          />

          {/* ✅ DISTANCE + TIME */}
          {distance && (
            <div className="mb-4 text-sm text-gray-600">
              Distance: <b>{distance} km</b> | Time: <b>{duration} mins</b>
            </div>
          )}

          <button
            onClick={bookRide}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700"
          >
            Confirm Ride 🚗
          </button>

          {/* WALLET */}
          <div className="mt-6 bg-gray-50 p-4 rounded-lg flex justify-between items-center">
            <div className="flex items-center gap-2 text-gray-600">
              <Wallet size={18} /> Wallet
            </div>
            <div className="text-xl font-bold text-indigo-600">
              ₹{balance}
            </div>
          </div>

        </div>

        {/* RIGHT PANEL */}
        <div className="space-y-6">

          {currentRide &&
          currentRide.ride_status === "ongoing" && (
            <div className="bg-white p-6 rounded-xl shadow">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Car size={18} /> Driver Assigned
              </h3>

              <p className="text-gray-600">
                Driver ID: <span className="font-medium">{currentRide.driver_id}</span>
              </p>

              <p className="text-yellow-500 mt-2 flex items-center gap-1">
                <Star size={16} />
                {currentRide.rating_avg
                  ? Number(currentRide.rating_avg).toFixed(1)
                  : "New Driver"}
              </p>
            </div>
          )}

          {currentRide &&
          currentRide.ride_status === "completed" &&
          currentRide.driver_id &&
          currentRide.already_rated === 0 && (
            <div className="bg-white p-6 rounded-xl shadow">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Star size={18} /> Rate your driver
              </h3>

              <select
                className="w-full p-3 border rounded-lg mb-4"
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
                className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600"
                onClick={async () => {
                  await submitRating(token, {
                    ride_id: currentRide.ride_id,
                    rating
                  });

                  alert("Rating submitted");
                  setCurrentRide(null);
                }}
              >
                Submit Rating ⭐
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default BookRide;