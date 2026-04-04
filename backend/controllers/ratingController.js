const ratingService = require("../services/ratingService");

exports.submitRating = async (req, res) => {
  try {
    if (req.user.role !== "user") {
      return res.status(403).json({
        error: "Only users can rate drivers"
      });
    }

    const { ride_id, rating } = req.body;
    const user_id = req.user.id;

    if (!ride_id || !rating) {
      return res.status(400).json({
        error: "ride_id and rating required"
      });
    }

    const result = await ratingService.submitRating(
      ride_id,
      user_id,
      rating
    );

    res.json(result);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};