const express = require("express");
const router = express.Router();
const rideController = require("../controllers/rideController");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/book", verifyToken, rideController.bookRide);
module.exports = router;