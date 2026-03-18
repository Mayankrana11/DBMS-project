const express = require("express");
const router = express.Router();
const controller = require("../controllers/driverController");

router.get("/", controller.getDrivers);
router.get("/available", controller.getAvailableDrivers);

module.exports = router;