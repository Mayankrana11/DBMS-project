const rideService = require("../services/rideService");

exports.bookRide = async (req, res) => {
  try {
    const { pickup, drop_off, user_id } = req.body;

    const result = await rideService.createRide(
      pickup,
      drop_off,
      user_id
    );

    res.json({
      message: "Ride booked successfully",
      data: result,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};