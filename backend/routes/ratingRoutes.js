const express = require("express");
const router = express.Router();
const ratingController = require("../controllers/ratingController");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/submit", verifyToken, ratingController.submitRating);

module.exports = router;