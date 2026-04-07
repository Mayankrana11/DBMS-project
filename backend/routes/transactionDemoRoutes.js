const express = require("express");
const router = express.Router();
const transactionDemoController = require("../controllers/transactionDemoController");
const { verifyToken } = require("../middleware/authMiddleware");

// Middleware to check for manager role
const requireManager = (req, res, next) => {
  if (req.user.role !== "manager") {
    return res.status(403).json({ error: "Manager access required" });
  }
  next();
};

// All transaction demo routes require authentication + manager role
router.use(verifyToken);
router.use(requireManager);

// ACID Property Demos
router.post("/book-concurrent", transactionDemoController.bookConcurrentRides);
router.post("/accept-race", transactionDemoController.driverAcceptRace);
router.post("/wallet-transfer", transactionDemoController.atomicWalletTransfer);
router.post("/complete-ride-demo", transactionDemoController.completeRideWithAcidDemo);

module.exports = router;
