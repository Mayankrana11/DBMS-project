const express = require("express");
const router = express.Router();
const rideController = require("../controllers/rideController");
const { verifyToken } = require("../middleware/authMiddleware");


// USER routes
router.post("/book", verifyToken, rideController.bookRide);

// DRIVER routes
router.get("/requested", verifyToken, rideController.getRequestedRides);
router.post("/accept", verifyToken, rideController.acceptRide);
router.post("/complete", verifyToken, rideController.completeRide);
router.post("/cancel", verifyToken, rideController.cancelRide);

module.exports = router;