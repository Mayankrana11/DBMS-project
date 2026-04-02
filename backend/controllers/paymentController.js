// redundant left for reference 
const db = require("../config/db");

exports.processPayment = async (req, res) => {
  try {
    const { ride_id, amount } = req.body;

    await db.query(
      `INSERT INTO PAYMENT (payment_id, ride_id, amount, payment_status)
       VALUES (?, ?, ?, 'success')`,
      [payment_id, ride_id, amount]
    );

    res.json({
      message: "Payment successful",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};