const db = require("../config/db");

exports.processPayment = async (req, res) => {
  try {
    const { ride_id } = req.body;

    const result = await db.query(
      `
      UPDATE payment
      SET payment_status = 'success'
      WHERE ride_id = $1
      RETURNING *
      `,
      [ride_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Payment record not found"
      });
    }

    res.json({
      message: "Payment successful",
      payment: result.rows[0]
    });

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};