import React, { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { submitRating } from "../api";
import "leaflet/dist/leaflet.css";

const BASE_URL = "http://localhost:5000/api";

// Fix for default Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom car icon for available drivers
const carIcon = L.divIcon({
  html: `<div style="font-size: 24px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">🚗</div>`,
  className: "car-marker",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Location search component for map
function LocationSearch({ onLocationSelect, placeholder }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const searchLocations = useCallback(async (searchQuery) => {
    if (searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      // Using Nominatim (OpenStreetMap) geocoding API - free, no key required
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=5&addressdetails=1`
      );
      const data = await res.json();
      setSuggestions(data);
    } catch (err) {
      console.error("Location search error:", err);
    }
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (query) {
        searchLocations(query);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [query, searchLocations]);

  return (
    <div className="location-search">
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        className="location-input"
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="suggestions-dropdown">
          {suggestions.map((suggestion, idx) => (
            <div
              key={idx}
              className="suggestion-item"
              onClick={() => {
                onLocationSelect({
                  name: suggestion.display_name,
                  lat: parseFloat(suggestion.lat),
                  lon: parseFloat(suggestion.lon),
                });
                setQuery(suggestion.display_name.split(",")[0]);
                setShowSuggestions(false);
              }}
            >
              {suggestion.display_name.split(",").slice(0, 3).join(",")}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Component to update map center
function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 13, { duration: 1 });
    }
  }, [center, map]);
  return null;
}

function BookRide() {
  // Existing state
  const [pickup, setPickup] = useState("");
  const [dropOff, setDropOff] = useState("");
  const [balance, setBalance] = useState(0);
  const [currentRide, setCurrentRide] = useState(null);
  const [completedRide, setCompletedRide] = useState(null);
  const [rating, setRating] = useState(5);

  // New state for map and dynamic pricing
  const [pickupLocation, setPickupLocation] = useState(null);
  const [dropoffLocation, setDropoffLocation] = useState(null);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [distance, setDistance] = useState(0);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [mapCenter, setMapCenter] = useState([40.7128, -74.006]); // Default: NYC
  const [userLocation, setUserLocation] = useState(null);
  const [showRideOptions, setShowRideOptions] = useState(false);
  const [selectedRideType, setSelectedRideType] = useState("uberx");

  const token = localStorage.getItem("token");

  // Ride types with pricing
  const rideTypes = {
    uberx: { name: "UberX", icon: "🚗", multiplier: 1, desc: "Affordable everyday rides" },
    comfort: { name: "Comfort", icon: "🚙", multiplier: 1.3, desc: "Newer cars with extra legroom" },
    black: { name: "Black", icon: "🖤", multiplier: 1.8, desc: "Premium rides with professional drivers" },
  };

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Calculate cost based on distance
  const calculateCost = (distKm, multiplier = 1) => {
    const baseFare = 50; // Base fare in INR
    const perKmRate = 15; // Per km rate in INR
    return Math.round((baseFare + distKm * perKmRate) * multiplier);
  };

  // Fetch available drivers for map markers
  const fetchAvailableDrivers = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/drivers/available`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.drivers) {
        setAvailableDrivers(data.drivers);
      } else {
        setAvailableDrivers([]);
      }
    } catch (err) {
      console.error("Error fetching drivers:", err);
      setAvailableDrivers([]);
    }
  }, [token]);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setUserLocation([lat, lon]);
          setMapCenter([lat, lon]);
        },
        () => {
          // Default to a major city if geolocation fails
          setMapCenter([28.6139, 77.209]); // Delhi, India
        }
      );
    }
  }, []);

  // Fetch available drivers on mount
  useEffect(() => {
    fetchAvailableDrivers();
  }, [fetchAvailableDrivers]);

  // Calculate distance and cost when locations change
  useEffect(() => {
    if (pickupLocation && dropoffLocation) {
      const dist = calculateDistance(
        pickupLocation.lat,
        pickupLocation.lon,
        dropoffLocation.lat,
        dropoffLocation.lon
      );
      setDistance(dist.toFixed(2));
      const cost = calculateCost(dist, rideTypes[selectedRideType]?.multiplier || 1);
      setEstimatedCost(cost);
      setShowRideOptions(true);
    }
  }, [pickupLocation, dropoffLocation, selectedRideType]);

  // Existing fetchBalance function
  const fetchBalance = async () => {
    try {
      const res = await fetch(`${BASE_URL}/wallet/balance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setBalance(data.balance);
    } catch (err) {
      console.error("BALANCE ERROR:", err);
    }
  };

  // Modified bookRide to include distance/cost
  const bookRide = async () => {
    try {
      const res = await fetch(`${BASE_URL}/rides/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pickup: pickupLocation?.name || pickup,
          drop_off: dropoffLocation?.name || dropOff,
          distance: distance || 10,
          cost: estimatedCost || 200,
        }),
      });

      const data = await res.json();

      if (data.error) {
        alert(data.error);
      } else {
        alert(`Ride booked! Ride ID: ${data.data.ride_id}`);
        setCurrentRide({
          ...currentRide,
          ride_id: data.data.ride_id,
          ride_status: "ongoing",
        });
        setShowRideOptions(false);
      }

      fetchBalance();
    } catch (err) {
      console.error("BOOK ERROR:", err);
    }
  };

  // Existing checkRideStatus function
  const checkRideStatus = async () => {
    try {
      const res = await fetch(`${BASE_URL}/rides/user-status`, {
        headers: { Authorization: `Bearer ${token}` },
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

  // Auto refresh
  useEffect(() => {
    fetchBalance();
    checkRideStatus();

    const interval = setInterval(() => {
      fetchBalance();
      checkRideStatus();
      fetchAvailableDrivers();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchAvailableDrivers]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <div className="bookride-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <h1 className="logo">🚖 BookRide</h1>
          <div className="header-right">
            <div className="wallet-balance">
              <span className="wallet-icon">💰</span>
              <span>₹{balance}</span>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="main-content">
        {/* Left Panel - Booking */}
        <div className="booking-panel">
          <div className="panel-header">
            <h2>Where to?</h2>
          </div>

          {/* Location Inputs */}
          <div className="location-inputs">
            <LocationSearch
              placeholder="Pickup location"
              onLocationSelect={(loc) => {
                setPickupLocation(loc);
                setPickup(loc.name);
              }}
            />
            <LocationSearch
              placeholder="Dropoff location"
              onLocationSelect={(loc) => {
                setDropoffLocation(loc);
                setDropOff(loc.name);
              }}
            />
          </div>

          {/* Ride Options */}
          {showRideOptions && pickupLocation && dropoffLocation && (
            <div className="ride-options">
              <h3 className="ride-options-title">Choose a ride</h3>
              {Object.entries(rideTypes).map(([key, ride]) => (
                <div
                  key={key}
                  className={`ride-option ${
                    selectedRideType === key ? "selected" : ""
                  }`}
                  onClick={() => setSelectedRideType(key)}
                >
                  <div className="ride-info">
                    <span className="ride-icon">{ride.icon}</span>
                    <div className="ride-details">
                      <span className="ride-name">{ride.name}</span>
                      <span className="ride-desc">{ride.desc}</span>
                    </div>
                  </div>
                  <div className="ride-price">
                    <span className="price">
                      ₹{calculateCost(distance, ride.multiplier)}
                    </span>
                    <span className="eta">~{Math.ceil(distance * 3)} min</span>
                  </div>
                </div>
              ))}

              <div className="trip-summary">
                <div className="summary-row">
                  <span>Distance</span>
                  <span>{distance} km</span>
                </div>
                <div className="summary-row">
                  <span>Estimated Time</span>
                  <span>~{Math.ceil(distance * 3)} mins</span>
                </div>
              </div>

              <button className="confirm-ride-btn" onClick={bookRide}>
                Confirm {rideTypes[selectedRideType]?.name}
              </button>
            </div>
          )}

          {/* Driver Assigned Panel */}
          {currentRide && currentRide.ride_status === "ongoing" && (
            <div className="driver-panel">
              <div className="panel-status ongoing">
                <span className="status-dot"></span>
                Driver Assigned
              </div>
              <div className="driver-info">
                <div className="driver-avatar">👨‍✈️</div>
                <div className="driver-details">
                  <h4>Driver ID: {currentRide.driver_id}</h4>
                  <p className="driver-rating">
                    ⭐ {currentRide.rating_avg
                      ? Number(currentRide.rating_avg).toFixed(1)
                      : "New Driver"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Rating Panel */}
          {currentRide &&
            currentRide.ride_status === "completed" &&
            currentRide.driver_id &&
            currentRide.already_rated === 0 && (
              <div className="rating-panel">
                <h3>Rate your driver</h3>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      className={`star-btn ${rating >= star ? "active" : ""}`}
                      onClick={() => setRating(star)}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
                <button
                  className="submit-rating-btn"
                  onClick={async () => {
                    await submitRating(token, {
                      ride_id: currentRide.ride_id,
                      rating,
                    });
                    alert("Rating submitted");
                    setCurrentRide(null);
                  }}
                >
                  Submit Rating
                </button>
              </div>
            )}
        </div>

        {/* Right Panel - Map */}
        <div className="map-panel">
          <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapUpdater center={mapCenter} />

            {/* Pickup Marker */}
            {pickupLocation && (
              <Marker position={[pickupLocation.lat, pickupLocation.lon]}>
                <Popup>📍 Pickup: {pickupLocation.name}</Popup>
              </Marker>
            )}

            {/* Dropoff Marker */}
            {dropoffLocation && (
              <Marker position={[dropoffLocation.lat, dropoffLocation.lon]}>
                <Popup>🏁 Dropoff: {dropoffLocation.name}</Popup>
              </Marker>
            )}

            {/* Route Line */}
            {pickupLocation && dropoffLocation && (
              <Polyline
                positions={[
                  [pickupLocation.lat, pickupLocation.lon],
                  [dropoffLocation.lat, dropoffLocation.lon],
                ]}
                color="#4f46e5"
                weight={4}
                opacity={0.7}
              />
            )}

            {/* Available Driver Cars */}
            {availableDrivers.length > 0 &&
              availableDrivers.map((driver) => (
                <Marker
                  key={driver.driver_id}
                  position={[driver.lat || mapCenter[0], driver.lon || mapCenter[1]]}
                  icon={carIcon}
                >
                  <Popup>
                    👨‍️ Driver {driver.driver_id} - Available
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        </div>
      </div>

      {/* Mobile Ride Options Bottom Sheet */}
      {showRideOptions && pickupLocation && dropoffLocation && (
        <div className="mobile-ride-options">
          <div className="mobile-options-content">
            <div className="drag-handle"></div>
            <h3>Choose a ride</h3>
            <div className="mobile-ride-list">
              {Object.entries(rideTypes).map(([key, ride]) => (
                <div
                  key={key}
                  className={`mobile-ride-option ${
                    selectedRideType === key ? "selected" : ""
                  }`}
                  onClick={() => setSelectedRideType(key)}
                >
                  <div className="mobile-ride-info">
                    <span className="ride-icon">{ride.icon}</span>
                    <div>
                      <span className="ride-name">{ride.name}</span>
                      <span className="ride-eta">
                        ~{Math.ceil(distance * 3)} min away
                      </span>
                    </div>
                  </div>
                  <span className="ride-price">
                    ₹{calculateCost(distance, ride.multiplier)}
                  </span>
                </div>
              ))}
            </div>
            <button className="mobile-confirm-btn" onClick={bookRide}>
              Confirm {rideTypes[selectedRideType]?.name}
            </button>
          </div>
        </div>
      )}

      {/* CSS Styles */}
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .bookride-container {
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: #f6f6f6;
        }

        /* Header */
        .header {
          background: #000;
          color: white;
          padding: 16px 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 1400px;
          margin: 0 auto;
        }

        .logo {
          font-size: 24px;
          font-weight: 700;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .wallet-balance {
          background: rgba(255,255,255,0.1);
          padding: 8px 16px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
        }

        .logout-btn {
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: background 0.2s;
        }

        .logout-btn:hover {
          background: rgba(255,255,255,0.3);
        }

        /* Main Content */
        .main-content {
          display: grid;
          grid-template-columns: 400px 1fr;
          flex: 1;
          overflow: hidden;
        }

        /* Booking Panel */
        .booking-panel {
          background: white;
          overflow-y: auto;
          box-shadow: 2px 0 12px rgba(0,0,0,0.1);
          z-index: 100;
        }

        .panel-header {
          padding: 24px;
          border-bottom: 1px solid #eee;
        }

        .panel-header h2 {
          font-size: 28px;
          font-weight: 700;
          color: #111;
        }

        /* Location Inputs */
        .location-inputs {
          padding: 24px;
          position: relative;
        }

        .location-search {
          position: relative;
          margin-bottom: 12px;
        }

        .location-input {
          width: 100%;
          padding: 16px 16px 16px 48px;
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          font-size: 16px;
          background: #f6f6f6;
          transition: all 0.2s;
        }

        .location-input:focus {
          outline: none;
          border-color: #4f46e5;
          background: white;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .location-input::before {
          content: "📍";
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
        }

        .suggestions-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          z-index: 1000;
          margin-top: 4px;
          overflow: hidden;
        }

        .suggestion-item {
          padding: 12px 16px;
          cursor: pointer;
          border-bottom: 1px solid #f0f0f0;
          transition: background 0.2s;
        }

        .suggestion-item:hover {
          background: #f6f6f6;
        }

        .suggestion-item:last-child {
          border-bottom: none;
        }

        /* Ride Options */
        .ride-options {
          padding: 0 24px 24px;
        }

        .ride-options-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
          color: #111;
        }

        .ride-option {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          margin-bottom: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .ride-option:hover {
          border-color: #bbb;
          background: #fafafa;
        }

        .ride-option.selected {
          border-color: #000;
          background: #f6f6f6;
        }

        .ride-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .ride-icon {
          font-size: 32px;
        }

        .ride-details {
          display: flex;
          flex-direction: column;
        }

        .ride-name {
          font-weight: 600;
          font-size: 16px;
          color: #111;
        }

        .ride-desc {
          font-size: 13px;
          color: #666;
        }

        .ride-price {
          text-align: right;
        }

        .price {
          display: block;
          font-weight: 700;
          font-size: 18px;
          color: #111;
        }

        .eta {
          font-size: 13px;
          color: #666;
        }

        .trip-summary {
          background: #f6f6f6;
          padding: 16px;
          border-radius: 12px;
          margin: 16px 0;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          font-size: 14px;
          color: #666;
        }

        .confirm-ride-btn {
          width: 100%;
          padding: 18px;
          background: #000;
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .confirm-ride-btn:hover {
          background: #333;
        }

        /* Driver Panel */
        .driver-panel {
          margin: 24px;
          padding: 20px;
          background: #f6f6f6;
          border-radius: 16px;
        }

        .panel-status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .panel-status.ongoing {
          color: #16a34a;
        }

        .status-dot {
          width: 10px;
          height: 10px;
          background: #16a34a;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .driver-info {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .driver-avatar {
          font-size: 48px;
          background: white;
          padding: 12px;
          border-radius: 50%;
        }

        .driver-details h4 {
          font-size: 16px;
          color: #111;
        }

        .driver-rating {
          color: #666;
          font-size: 14px;
        }

        /* Rating Panel */
        .rating-panel {
          margin: 24px;
          padding: 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          color: white;
          text-align: center;
        }

        .rating-panel h3 {
          margin-bottom: 20px;
        }

        .star-rating {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-bottom: 20px;
        }

        .star-btn {
          background: rgba(255,255,255,0.2);
          border: none;
          font-size: 32px;
          cursor: pointer;
          border-radius: 8px;
          padding: 8px;
          transition: all 0.2s;
        }

        .star-btn.active,
        .star-btn:hover {
          background: rgba(255,255,255,0.4);
          transform: scale(1.1);
        }

        .submit-rating-btn {
          width: 100%;
          padding: 14px;
          background: white;
          color: #667eea;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }

        /* Map Panel */
        .map-panel {
          position: relative;
        }

        .car-marker {
          transition: all 0.3s;
          z-index: 1000;
        }

        .leaflet-marker-icon {
          transition: transform 0.2s;
        }

        .leaflet-marker-icon:hover {
          transform: scale(1.2);
        }

        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .leaflet-popup-content {
          font-size: 14px;
          line-height: 1.5;
        }

        /* Mobile Ride Options */
        .mobile-ride-options {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: white;
          border-radius: 24px 24px 0 0;
          box-shadow: 0 -4px 20px rgba(0,0,0,0.15);
          z-index: 1000;
          max-height: 70vh;
          overflow-y: auto;
        }

        .mobile-options-content {
          padding: 24px;
        }

        .drag-handle {
          width: 40px;
          height: 4px;
          background: #ddd;
          border-radius: 2px;
          margin: 0 auto 20px;
        }

        .mobile-ride-list {
          margin: 16px 0;
        }

        .mobile-ride-option {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          margin-bottom: 12px;
          cursor: pointer;
        }

        .mobile-ride-option.selected {
          border-color: #000;
        }

        .mobile-ride-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .mobile-ride-option .ride-eta {
          display: block;
          font-size: 13px;
          color: #666;
        }

        .mobile-confirm-btn {
          width: 100%;
          padding: 18px;
          background: #000;
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
        }

        /* Responsive Design */
        @media (max-width: 900px) {
          .main-content {
            grid-template-columns: 1fr;
          }

          .booking-panel {
            order: 2;
          }

          .map-panel {
            order: 1;
            height: 50vh;
          }

          .mobile-ride-options {
            display: block;
          }

          .ride-options {
            display: none;
          }
        }

        @media (max-width: 600px) {
          .header {
            padding: 12px 16px;
          }

          .logo {
            font-size: 20px;
          }

          .wallet-balance {
            padding: 6px 12px;
            font-size: 14px;
          }

          .logout-btn {
            padding: 6px 12px;
            font-size: 14px;
          }

          .panel-header h2 {
            font-size: 24px;
          }

          .location-inputs {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
}

export default BookRide;
