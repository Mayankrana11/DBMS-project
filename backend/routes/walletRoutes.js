const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const walletController = require("../controllers/walletController");

router.get("/balance", verifyToken, walletController.getBalance);

module.exports = router;