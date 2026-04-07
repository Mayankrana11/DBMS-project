const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { verifyToken } = require("../middleware/authMiddleware");

// Middleware to check for manager role
const requireManager = (req, res, next) => {
  console.log("requireManager check:", req.user);
  if (req.user.role !== "manager") {
    return res.status(403).json({ error: "Manager access required. Your role: " + req.user.role });
  }
  next();
};

// All admin routes require authentication + manager role
router.use(verifyToken);
router.use(requireManager);

router.get("/tables", adminController.getTables);
router.get("/table/:name", adminController.getTableData);
router.post("/query", adminController.executeQuery);
router.put("/driver/:id/toggle", adminController.toggleDriverAvailability);
router.get("/stats", adminController.getDatabaseStats);
router.get("/users", adminController.getUsers);
router.put("/user/:id/balance", adminController.updateUserBalance);

module.exports = router;
