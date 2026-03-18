const rideService = require("../services/rideService");

exports.bookRide = async (req, res) => {
  try {
    const { pickup, drop_off, user_id } = req.body;
    
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

  
    if (!user_id || isNaN(user_id)) {
      return res.status(400).json({
        error: "Valid user ID is required",
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