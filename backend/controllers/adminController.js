const db = require("../config/db");

/*
========================================
1. GET ALL TABLES
========================================
*/
exports.getTables = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/*
========================================
2. GET TABLE DATA
========================================
*/
exports.getTableData = async (req, res) => {
  try {
    const { name } = req.params;
    const limit = parseInt(req.query.limit) || 100;

    console.log("GET TABLE DATA:", name, "limit:", limit);

    // Whitelist check for safety
    const [tables] = await db.query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
    `, [name]);

    console.log("Table check result:", tables);

    if (tables.length === 0) {
      return res.status(404).json({ error: "Table not found" });
    }

    const [rows] = await db.query(`SELECT * FROM \`${name}\` LIMIT ?`, [limit]);
    console.log("Rows returned:", rows.length);
    res.json(rows);
  } catch (err) {
    console.error("GET TABLE DATA ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/*
========================================
3. EXECUTE RAW SQL QUERY
========================================
*/
exports.executeQuery = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { query } = req.body;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Query is required" });
    }

    // Block dangerous operations in non-transaction mode
    const upperQuery = query.trim().toUpperCase();
    const blockedPatterns = ["DROP DATABASE", "TRUNCATE", "DELETE FROM AUTH", "UPDATE AUTH"];

    for (const pattern of blockedPatterns) {
      if (upperQuery.includes(pattern)) {
        return res.status(403).json({
          error: `Operation blocked: ${pattern} is not allowed from admin panel`
        });
      }
    }

    await connection.beginTransaction();

    const [results] = await connection.query(query);

    await connection.commit();

    // Return results based on query type
    if (upperQuery.startsWith("SELECT") || upperQuery.startsWith("SHOW") || upperQuery.startsWith("DESCRIBE")) {
      res.json({
        success: true,
        data: results,
        rowCount: results.length
      });
    } else {
      res.json({
        success: true,
        message: "Query executed successfully",
        affectedRows: results.affectedRows
      });
    }

  } catch (err) {
    await connection.rollback();
    res.status(500).json({
      error: err.message,
      hint: "Transaction rolled back due to error"
    });
  } finally {
    connection.release();
  }
};

/*
========================================
4. TOGGLE DRIVER AVAILABILITY
========================================
*/
exports.toggleDriverAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["available", "busy"].includes(status)) {
      return res.status(400).json({ error: "Status must be 'available' or 'busy'" });
    }

    const [result] = await db.query(
      "UPDATE DRIVER SET availability_status = ? WHERE driver_id = ?",
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Driver not found" });
    }

    res.json({
      message: `Driver ${id} marked as ${status}`,
      driver_id: parseInt(id),
      new_status: status
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/*
========================================
5. GET ALL USERS WITH BALANCE
========================================
*/
exports.getUsers = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.user_id,
             CONCAT_WS(' ', u.fname, u.lname) AS name,
             u.fname,
             u.lname,
             u.email_phn AS email,
             COALESCE(a.balance, 0) AS balance
      FROM USER u
      LEFT JOIN (
        SELECT entity_id, balance
        FROM ACCOUNT
        WHERE entity_type = 'user'
        AND account_id IN (
          SELECT MAX(account_id)
          FROM ACCOUNT
          WHERE entity_type = 'user'
          GROUP BY entity_id
        )
      ) a ON u.user_id = a.entity_id
      ORDER BY u.user_id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/*
========================================
6. UPDATE USER BALANCE
========================================
*/
exports.updateUserBalance = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { user_id, balance } = req.body;

    if (!user_id || balance === undefined) {
      return res.status(400).json({ error: "user_id and balance required" });
    }

    if (balance < 0) {
      return res.status(400).json({ error: "Balance cannot be negative" });
    }

    await connection.beginTransaction();

    // Check if user exists
    const [users] = await connection.query(
      "SELECT user_id, fname, lname FROM USER WHERE user_id = ?",
      [user_id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = users[0];

    // Get the LATEST account entry (highest account_id)
    const [[latestAccount]] = await connection.query(
      `SELECT account_id, balance FROM ACCOUNT
       WHERE entity_id = ? AND entity_type = 'user'
       ORDER BY account_id DESC
       LIMIT 1`,
      [user_id]
    );

    if (latestAccount) {
      // Update the latest account entry
      const oldBalance = latestAccount.balance;
      await connection.query(
        `UPDATE ACCOUNT SET balance = ?
         WHERE account_id = ?`,
        [balance, latestAccount.account_id]
      );
      res.json({
        message: `Balance updated for ${user.fname} ${user.lname}`,
        user_id,
        old_balance: oldBalance,
        new_balance: balance,
        change: balance - oldBalance
      });
    } else {
      // Create new account
      await connection.query(
        "INSERT INTO ACCOUNT (entity_id, entity_type, balance) VALUES (?, 'user', ?)",
        [user_id, balance]
      );
      res.json({
        message: `Account created for ${user.fname} ${user.lname}`,
        user_id,
        new_balance: balance
      });
    }

    await connection.commit();

  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
};

/*
========================================
7. GET DATABASE STATS
========================================
*/
exports.getDatabaseStats = async (req, res) => {
  try {
    const stats = {};

    // Count records in each table
    const tables = ["USER", "DRIVER", "EMPLOYEE", "RIDE", "PAYMENT", "ACCOUNT", "RATING", "AUTH", "VEHICLE", "MANAGER", "TECHTEAM", "COMPANY_OFFICE"];

    for (const table of tables) {
      const [[result]] = await db.query(`SELECT COUNT(*) as count FROM ${table}`);
      stats[table] = result.count;
    }

    res.json(stats);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
