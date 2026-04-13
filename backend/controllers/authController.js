const db = require("../config/db");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const [rows] = await db.query(
      "SELECT * FROM AUTH WHERE username=? AND password=?",
      [username, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = rows[0];

    const token = jwt.sign(
      {
        id: user.linked_id,
        role: user.role.toLowerCase()
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      message: "Login successful",
      token,
      role: user.role
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.register = async (req, res) => {
  try {
    const { username, password, fname, mname, lname, email } = req.body;

    if (!username || !password || !fname || !email) {
      return res.status(400).json({ error: "Required fields missing" });
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Insert into USER table
      await connection.query(
        "INSERT INTO USER (fname, mname, lname, email_phn) VALUES (?, ?, ?, ?)",
        [fname, mname || "", lname || "", email]
      );

      // Get the auto-generated user_id
      const [result] = await connection.query("SELECT LAST_INSERT_ID() AS user_id");
      const userId = result[0].user_id;

      // Insert into AUTH table
      await connection.query(
        "INSERT INTO AUTH (username, password, role, linked_id) VALUES (?, ?, ?, ?)",
        [username, password, "user", userId]
      );

      await connection.commit();

      const token = jwt.sign(
        {
          id: userId,
          role: "user"
        },
        process.env.JWT_SECRET,
        { expiresIn: "2h" }
      );

      res.json({
        message: "Registration successful",
        token,
        role: "user"
      });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};