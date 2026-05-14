const db = require("../config/db");

// Get all users
exports.getUsers = async (req, res) => {
  try {

    const result = await db.query(`
      SELECT
        u.*,
        COALESCE(a.balance,0) AS balance
      FROM users u

      LEFT JOIN LATERAL (
        SELECT balance
        FROM account
        WHERE entity_id = u.user_id
        AND entity_type = 'user'
        ORDER BY account_id DESC
        LIMIT 1
      ) a ON true
    `);

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};


// Get user by ID
exports.getUserById = async (req, res) => {
  try {

    const { id } = req.params;

    const result = await db.query(
      `
      SELECT
        u.*,
        COALESCE(a.balance,0) AS balance
      FROM users u

      LEFT JOIN LATERAL (
        SELECT balance
        FROM account
        WHERE entity_id=u.user_id
        AND entity_type='user'
        ORDER BY account_id DESC
        LIMIT 1
      ) a ON true

      WHERE u.user_id=$1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    res.json(result.rows[0]);

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};