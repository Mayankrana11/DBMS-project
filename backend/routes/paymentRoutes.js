const express = require("express");
const router = express.Router();
const controller = require("../controllers/paymentController");

router.post("/pay", controller.processPayment);

module.exports = router;