const db = require("../config/db");

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM USER");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM USER WHERE user_id = ?",
      [id]
    );

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};