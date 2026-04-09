const db = require("../config/db");

exports.getBalance = async (req, res) => {
  try {
    const id = req.user.id;
    const role = req.user.role;

    const type = role === "driver" ? "driver" : "user";

    // Get the LATEST account entry (highest account_id) for the entity
    const [rows] = await db.query(
      `SELECT balance FROM ACCOUNT
       WHERE entity_id = ? AND entity_type = ?
       ORDER BY account_id DESC
       LIMIT 1`,
      [id, type]
    );

    res.json(rows[0] || { balance: 0 });

  } catch (err) {
    console.error("GET BALANCE ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
};