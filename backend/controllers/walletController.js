const db = require("../config/db");

exports.getBalance = async (req, res) => {
  try {
    const id = req.user.id;
    const role = req.user.role;

    const type = role === "driver"
      ? "driver"
      : "user";

    const result = await db.query(
      `
      SELECT balance
      FROM account
      WHERE entity_id = $1
      AND entity_type = $2
      ORDER BY account_id DESC
      LIMIT 1
      `,
      [id, type]
    );

    res.json(
      result.rows[0] || { balance: 0 }
    );

  } catch (err) {
    console.error(
      "GET BALANCE ERROR:",
      err.message
    );

    res.status(500).json({
      error: err.message
    });
  }
};