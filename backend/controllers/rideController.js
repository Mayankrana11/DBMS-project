const rideService = require("../services/rideService");

/*
========================================
1. USER: BOOK RIDE
========================================
*/
exports.bookRide = async (req, res) => {
  try {
    const { pickup, drop_off } = req.body;

    const user_id = req.user.id;

    if (
      !pickup ||
      !drop_off ||
      typeof pickup !== "string" ||
      typeof drop_off !== "string" ||
      pickup.trim() === "" ||
      drop_off.trim() === ""
    ) {
      return res.status(400).json({
        error: "Pickup and drop locations are required",
      });
    }

    const result = await rideService.createRide(
      pickup.trim(),
      drop_off.trim(),
      user_id
    );

    res.json({
      message: "Ride booked successfully",
      data: result,
    });

  } catch (err) {
    console.error("BOOK RIDE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};


/*
========================================
2. DRIVER: VIEW REQUESTED RIDES
========================================
*/
exports.getRequestedRides = async (req, res) => {
  try {
    const rides = await rideService.getRequestedRides();
    res.json(rides);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/*
========================================
3. DRIVER: ACCEPT RIDE
========================================
*/
exports.acceptRide = async (req, res) => {
  try {
    const { ride_id } = req.body;

    if (!ride_id) {
      return res.status(400).json({ error: "ride_id is required" });
    }
    if (req.user.role !== "employee") {
      return res.status(403).json({ error: "Only drivers can accept rides" });
    }

    const driver_id = req.user.id;

    const result = await rideService.acceptRide(ride_id, driver_id);

    res.json(result);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/*
========================================
4. DRIVER: COMPLETE RIDE
========================================
*/
exports.completeRide = async (req, res) => {
  try {
    const { ride_id } = req.body;

    if (!ride_id) {
      return res.status(400).json({ error: "ride_id is required" });
    }
    if (req.user.role !== "employee") {
      return res.status(403).json({ error: "Only drivers can complete rides" });
    }


    const result = await rideService.completeRide(ride_id);

    res.json(result);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/*
========================================
5. DRIVER: CANCEL RIDE
========================================
*/
exports.cancelRide = async (req, res) => {
  try {
    const { ride_id } = req.body;

    if (!ride_id) {
      return res.status(400).json({ error: "ride_id is required" });
    }
    if (req.user.role !== "employee") {
      return res.status(403).json({ error: "Only drivers can cancel rides" });
    }


    const result = await rideService.cancelRide(ride_id);

    res.json(result);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};