const db = require("../config/db");

exports.getBalance = async (req, res) => {
  try {
    const id = req.user.id;
    const role = req.user.role;

    const type = role === "driver" ? "driver" : "user";

    const [rows] = await db.query(
      "SELECT balance FROM ACCOUNT WHERE entity_id=? AND entity_type=?",
      [id, type]
    );

    res.json(rows[0] || { balance: 1000 });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};