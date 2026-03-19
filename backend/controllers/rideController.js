const rideService = require("../services/rideService");

exports.bookRide = async (req, res) => {
  try {
    const { pickup, drop_off } = req.body;

    // 🔥 Extract user from JWT
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