import React, { useEffect, useState, useRef, useCallback } from "react";

const BASE_URL = "http://localhost:5000/api";

function DriverDashboard() {
  const [rides, setRides] = useState([]);
  const [balance, setBalance] = useState(0);
  const [acceptedRideId, setAcceptedRideId] = useState(null);
  const [swipeStates, setSwipeStates] = useState({});
  const [touchStates, setTouchStates] = useState({});
  const touchRefs = useRef({});

  const token = localStorage.getItem("token");

  // Parse JWT token to get driver ID
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

  // Touch/Swipe handlers for the slider
  const handleTouchStart = useCallback((rideId, e) => {
    const touch = e.touches[0];
    setTouchStates(prev => ({
      ...prev,
      [rideId]: {
        startX: touch.clientX,
        currentX: touch.clientX,
        isDragging: true
      }
    }));
  }, []);

  const handleTouchMove = useCallback((rideId, e) => {
    if (!touchStates[rideId]?.isDragging) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStates[rideId].startX;

    setTouchStates(prev => ({
      ...prev,
      [rideId]: {
        ...prev[rideId],
        currentX: touch.clientX,
        deltaX
      }
    }));

    // Calculate swipe percentage based on slider width (full width drag)
    const sliderWidth = 260; // Approximate slider width in pixels
    const maxPercent = 220; // Can slide almost to the end
    const swipePercent = (deltaX / sliderWidth) * maxPercent;
    setSwipeStates(prev => ({
      ...prev,
      [rideId]: Math.max(0, Math.min(maxPercent, swipePercent))
    }));
  }, [touchStates]);

  const handleTouchEnd = useCallback((rideId, ride) => {
    const deltaX = touchStates[rideId]?.deltaX || 0;

    setTouchStates(prev => ({
      ...prev,
      [rideId]: { isDragging: false }
    }));

    // Threshold for accepting (slide more than 60% to the right)
    if (deltaX > 150) {
      setSwipeStates(prev => ({ ...prev, [rideId]: 220 }));
      acceptRide(ride.ride_id);
    } else {
      // Reset to center
      setSwipeStates(prev => ({ ...prev, [rideId]: 0 }));
    }
  }, [touchStates]);

  // Mouse handlers for desktop
  const handleMouseDown = useCallback((rideId, e) => {
    setTouchStates(prev => ({
      ...prev,
      [rideId]: {
        startX: e.clientX,
        currentX: e.clientX,
        isDragging: true
      }
    }));
  }, []);

  const handleMouseMove = useCallback((rideId, e) => {
    if (!touchStates[rideId]?.isDragging) return;

    const deltaX = e.clientX - touchStates[rideId].startX;

    setTouchStates(prev => ({
      ...prev,
      [rideId]: {
        ...prev[rideId],
        currentX: e.clientX,
        deltaX
      }
    }));

    const sliderWidth = 260;
    const maxPercent = 220;
    const swipePercent = (deltaX / sliderWidth) * maxPercent;
    setSwipeStates(prev => ({
      ...prev,
      [rideId]: Math.max(0, Math.min(maxPercent, swipePercent))
    }));
  }, [touchStates]);

  const handleMouseUp = useCallback((rideId, ride) => {
    const deltaX = touchStates[rideId]?.deltaX || 0;

    setTouchStates(prev => ({
      ...prev,
      [rideId]: { isDragging: false }
    }));

    if (deltaX > 150) {
      setSwipeStates(prev => ({ ...prev, [rideId]: 220 }));
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
                          onTouchEnd={(e) => handleTouchEnd(ride.ride_id, ride)}
                          onMouseDown={(e) => handleMouseDown(ride.ride_id, e)}
                          onMouseMove={(e) => handleMouseMove(ride.ride_id, e)}
                          onMouseUp={(e) => handleMouseUp(ride.ride_id, ride)}
                          onMouseLeave={(e) => handleMouseUp(ride.ride_id, ride)}
                        >
                          <div
                            className="swipe-handle"
                            style={{
                              transform: swipeStates[ride.ride_id]
                                ? `translateX(${(swipeStates[ride.ride_id] / 220) * 100}%)`
                                : 'translateX(0)'
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
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
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
