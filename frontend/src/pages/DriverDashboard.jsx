import React, { useEffect, useState, useRef, useCallback } from "react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function DriverDashboard() {
  const [rides, setRides] = useState([]);
  const [balance, setBalance] = useState(0);
  const [acceptedRideId, setAcceptedRideId] = useState(null);
  const [swipeStates, setSwipeStates] = useState({});
  const [touchStates, setTouchStates] = useState({});
  const touchRefs = useRef({});

  const token = localStorage.getItem("token");

  // Safety check: Parse JWT token to get driver ID if token exists
  let driverId = "Unknown";
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      driverId = payload.id;
    } catch (e) {
      console.error("Invalid token format");
    }
  }

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  const fetchBalance = async () => {
    if (!token) return;
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
    if (!token) return;
    try {
      const res = await fetch(`${BASE_URL}/rides/requested`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      const requestedRides = Array.isArray(data) ? data : [];

      // If we have an accepted ride, keep it in the list
      if (acceptedRideId) {
        const acceptedRide = requestedRides.find(r => r.ride_id === acceptedRideId);
        if (acceptedRide) {
          setRides([acceptedRide]);
          return;
        } else {
          // Accepted ride is no longer in requested state, clear it
          setAcceptedRideId(null);
        }
      }

      setRides(requestedRides);

      // Also fetch ongoing rides
      const ongoingRes = await fetch(`${BASE_URL}/rides/ongoing`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const ongoingData = await ongoingRes.json();
      if (Array.isArray(ongoingData) && ongoingData.length > 0) {
        setAcceptedRideId(ongoingData[0].ride_id);
      }
    } catch (err) {
      console.error("FETCH RIDES ERROR:", err);
    }
  };

  const acceptRide = async (ride_id) => {
    try {
      await fetch(`${BASE_URL}/rides/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ride_id })
      });

      // Set accepted ride and clear other rides from display
      setAcceptedRideId(ride_id);
      fetchRides();
    } catch (err) {
      console.error("Error accepting ride", err);
    }
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

    setAcceptedRideId(null);
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

    setAcceptedRideId(null);
    fetchRides();
  };

  // --- TOUCH HANDLERS (MOBILE) ---
  const handleTouchStart = useCallback((rideId, e) => {
    const touch = e.touches[0];
    setTouchStates(prev => ({
      ...prev,
      [rideId]: {
        startX: touch.clientX,
        isDragging: true,
        deltaX: 0
      }
    }));
  }, []);

  const handleTouchMove = useCallback((rideId, e) => {
    if (!touchStates[rideId]?.isDragging) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStates[rideId].startX;

    // Get exact slider width dynamically to prevent dragging outside
    const sliderWidth = touchRefs.current[rideId]?.clientWidth || 300;
    const maxPixels = sliderWidth - 56; // container width minus handle width (48px) and padding (8px)

    // Bind the movement between 0 and the max width of the track
    const boundedX = Math.max(0, Math.min(maxPixels, deltaX));

    setSwipeStates(prev => ({ ...prev, [rideId]: boundedX }));
    setTouchStates(prev => ({
      ...prev,
      [rideId]: { ...prev[rideId], deltaX: boundedX }
    }));
  }, [touchStates]);

  const handleTouchEnd = useCallback((rideId, ride) => {
    const state = touchStates[rideId];
    if (!state?.isDragging) return;

    const deltaX = state.deltaX || 0;
    const sliderWidth = touchRefs.current[rideId]?.clientWidth || 300;
    const threshold = (sliderWidth - 56) * 0.6; // 60% of the track to accept

    setTouchStates(prev => ({ ...prev, [rideId]: { isDragging: false } }));

    if (deltaX > threshold) {
      setSwipeStates(prev => ({ ...prev, [rideId]: sliderWidth - 56 }));
      acceptRide(ride.ride_id);
    } else {
      setSwipeStates(prev => ({ ...prev, [rideId]: 0 }));
    }
  }, [touchStates]);

  // --- MOUSE HANDLERS (DESKTOP) ---
  const handleMouseDown = useCallback((rideId, e) => {
    setTouchStates(prev => ({
      ...prev,
      [rideId]: {
        startX: e.clientX,
        isDragging: true,
        deltaX: 0
      }
    }));
  }, []);

  const handleMouseMove = useCallback((rideId, e) => {
    if (!touchStates[rideId]?.isDragging) return;

    const deltaX = e.clientX - touchStates[rideId].startX;
    
    const sliderWidth = touchRefs.current[rideId]?.clientWidth || 300;
    const maxPixels = sliderWidth - 56;
    const boundedX = Math.max(0, Math.min(maxPixels, deltaX));

    setSwipeStates(prev => ({ ...prev, [rideId]: boundedX }));
    setTouchStates(prev => ({
      ...prev,
      [rideId]: { ...prev[rideId], deltaX: boundedX }
    }));
  }, [touchStates]);

  const handleMouseUp = useCallback((rideId, ride) => {
    const state = touchStates[rideId];
    if (!state?.isDragging) return;

    const deltaX = state.deltaX || 0;
    const sliderWidth = touchRefs.current[rideId]?.clientWidth || 300;
    const threshold = (sliderWidth - 56) * 0.6;

    setTouchStates(prev => ({ ...prev, [rideId]: { isDragging: false } }));

    if (deltaX > threshold) {
      setSwipeStates(prev => ({ ...prev, [rideId]: sliderWidth - 56 }));
      acceptRide(ride.ride_id);
    } else {
      setSwipeStates(prev => ({ ...prev, [rideId]: 0 }));
    }
  }, [touchStates]);

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
    <div className="driver-dashboard-container">
      <header className="header">
        <div className="header-content">
          <h1 className="logo">Driver Dashboard</h1>
          <div className="header-right">
            <div className="driver-id-badge">
              <span>ID: {driverId}</span>
            </div>
            <div className="wallet-balance">
              <span>₹{balance}</span>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="main-content">
        <div className="section-header">
          <h2>Ride Requests</h2>
          <span className="rides-count">{rides.length} active</span>
        </div>

        {rides.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No ride requests</h3>
            <p>New requests will appear here</p>
          </div>
        ) : (
          <div className="rides-list">
            {rides.map((ride) => {
              const isAccepted = acceptedRideId === ride.ride_id;

              return (
                <div
                  key={ride.ride_id}
                  className="ride-request-card"
                >
                  <div className="card-header">
                    <div className="status-badge">
                      <span className={`status-dot ${isAccepted ? 'accepted' : ''}`}></span>
                      {isAccepted ? "Ride Accepted" : "New Request"}
                    </div>
                    <span className="ride-id">#{ride.ride_id}</span>
                  </div>

                  <div className="card-body">
                    <div className="rider-info">
                      <div className="rider-avatar">👤</div>
                      <div className="rider-details">
                        <h4>{ride.fname} {ride.lname}</h4>
                        {ride.rating_avg && (
                          <span className="rating">⭐ {Number(ride.rating_avg).toFixed(1)}</span>
                        )}
                      </div>
                    </div>

                    <div className="route-info">
                      <div className="route-row">
                        <span className="route-icon pickup">📍</span>
                        <span className="route-text">{ride.pickup}</span>
                      </div>
                      <div className="route-line"></div>
                      <div className="route-row">
                        <span className="route-icon dropoff">🏁</span>
                        <span className="route-text">{ride.drop_off}</span>
                      </div>
                    </div>

                    <div className="fare-display">
                      <span className="fare-label">Fare</span>
                      <span className="fare-value">₹{ride.fare_amt}</span>
                    </div>
                  </div>

                  {/* Action Section */}
                  <div className="action-container">
                    {isAccepted ? (
                      // Show Complete/Cancel buttons after accepting
                      <div className="action-buttons">
                        <button
                          className="btn-complete"
                          onClick={() => completeRide(ride.ride_id)}
                        >
                          <span className="btn-icon">✓</span>
                          Complete Ride
                        </button>
                        <button
                          className="btn-cancel"
                          onClick={() => cancelRide(ride.ride_id)}
                        >
                          <span className="btn-icon">✕</span>
                          Cancel Ride
                        </button>
                      </div>
                    ) : (
                      // Show swipe slider for unaccepted rides
                      <div className="swipe-slider-container">
                        <div
                          ref={(el) => (touchRefs.current[ride.ride_id] = el)}
                          className="swipe-slider"
                          onTouchStart={(e) => handleTouchStart(ride.ride_id, e)}
                          onTouchMove={(e) => handleTouchMove(ride.ride_id, e)}
                          onTouchEnd={() => handleTouchEnd(ride.ride_id, ride)}
                          onMouseDown={(e) => handleMouseDown(ride.ride_id, e)}
                          onMouseMove={(e) => handleMouseMove(ride.ride_id, e)}
                          onMouseUp={() => handleMouseUp(ride.ride_id, ride)}
                          onMouseLeave={() => handleMouseUp(ride.ride_id, ride)}
                        >
                          <div
                            className="swipe-handle"
                            style={{
                              transform: `translateX(${swipeStates[ride.ride_id] || 0}px)`,
                              // Remove CSS delay while dragging so it smoothly follows the mouse/finger
                              transition: touchStates[ride.ride_id]?.isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                          >
                            <span className="swipe-arrow">➜</span>
                            <span className="swipe-text">Slide to accept</span>
                          </div>
                        </div>
                        <div className="slider-labels">
                          <span className="label-reject">✕ Decline</span>
                          <span className="label-accept">Accept ✓</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .driver-dashboard-container {
          min-height: 100vh;
          background: #f5f5f5;
          font-family: 'Uber Move', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .header {
          background: #000;
          color: white;
          padding: 16px 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo {
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .driver-id-badge,
        .wallet-balance {
          background: rgba(255,255,255,0.1);
          padding: 8px 14px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
        }

        .logout-btn {
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: background 0.2s;
        }

        .logout-btn:hover {
          background: rgba(255,255,255,0.3);
        }

        .main-content {
          max-width: 500px;
          margin: 0 auto;
          padding: 24px 16px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .section-header h2 {
          font-size: 20px;
          font-weight: 600;
          color: #000;
        }

        .rides-count {
          background: #000;
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
        }

        .empty-state {
          background: white;
          border-radius: 16px;
          padding: 60px 24px;
          text-align: center;
          box-shadow: 0 2px 12px rgba(0,0,0,0.05);
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .empty-state h3 {
          font-size: 18px;
          color: #000;
          margin-bottom: 8px;
        }

        .empty-state p {
          color: #666;
          font-size: 14px;
        }

        .rides-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .ride-request-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
          overflow: hidden;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 16px;
          border-bottom: 1px solid #f0f0f0;
        }

        .status-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        .status-dot:not(.accepted) {
          background: #16a34a;
        }

        .status-dot.accepted {
          background: #000;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .ride-id {
          font-size: 12px;
          color: #999;
        }

        .card-body {
          padding: 16px;
        }

        .rider-info {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .rider-avatar {
          width: 44px;
          height: 44px;
          background: #f5f5f5;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .rider-details h4 {
          font-size: 16px;
          font-weight: 600;
          color: #000;
          margin-bottom: 4px;
        }

        .rating {
          font-size: 13px;
          color: #666;
        }

        .route-info {
          margin-bottom: 16px;
        }

        .route-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 6px 0;
        }

        .route-icon {
          font-size: 16px;
          flex-shrink: 0;
        }

        .route-text {
          font-size: 13px;
          color: #333;
          line-height: 1.4;
          flex: 1;
        }

        .route-line {
          width: 2px;
          height: 16px;
          background: #e0e0e0;
          margin-left: 7px;
        }

        .fare-display {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 12px;
          border-top: 1px solid #f0f0f0;
        }

        .fare-label {
          font-size: 13px;
          color: #666;
        }

        .fare-value {
          font-size: 22px;
          font-weight: 700;
          color: #000;
        }

        /* Action Container */
        .action-container {
          padding: 0 16px 16px;
        }

        /* Action Buttons (after accepting) */
        .action-buttons {
          display: flex;
          gap: 10px;
        }

        .btn-complete {
          flex: 1;
          padding: 14px;
          background: #000;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: background 0.2s;
        }

        .btn-complete:hover {
          background: #333;
        }

        .btn-cancel {
          flex: 1;
          padding: 14px;
          background: #f5f5f5;
          color: #ef4444;
          border: 1px solid #e5e5e5;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: background 0.2s;
        }

        .btn-cancel:hover {
          background: #fef2f2;
        }

        .btn-icon {
          font-size: 16px;
        }

        /* Swipe Slider Styles */
        .swipe-slider-container {
          width: 100%;
        }

        .swipe-slider {
          position: relative;
          width: 100%;
          height: 56px;
          background: #f5f5f5;
          border-radius: 28px;
          overflow: visible;
        }

        .swipe-handle {
          position: absolute;
          top: 4px;
          left: 4px;
          width: 48px;
          height: 48px;
          background: #000;
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: grab;
          user-select: none;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }

        .swipe-handle:active {
          cursor: grabbing;
        }

        .swipe-arrow {
          font-size: 18px;
          color: white;
          animation: slideArrow 1.5s infinite;
        }

        @keyframes slideArrow {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(4px); }
        }

        .swipe-text {
          display: none;
        }

        .slider-labels {
          display: flex;
          justify-content: space-between;
          padding: 8px 12px 0;
          font-size: 12px;
        }

        .label-reject {
          color: #ef4444;
          font-weight: 500;
        }

        .label-accept {
          color: #16a34a;
          font-weight: 500;
        }

        @media (max-width: 480px) {
          .header {
            padding: 12px 16px;
          }

          .logo {
            font-size: 18px;
          }

          .header-right {
            gap: 8px;
          }

          .driver-id-badge,
          .wallet-balance {
            padding: 6px 12px;
            font-size: 13px;
          }

          .main-content {
            padding: 16px 12px;
          }

          .rider-details h4 {
            font-size: 15px;
          }

          .fare-value {
            font-size: 20px;
          }

          .action-buttons {
            flex-direction: column;
          }

          .btn-complete,
          .btn-cancel {
            padding: 12px;
          }
        }
      `}</style>
    </div>
  );
}

export default DriverDashboard;