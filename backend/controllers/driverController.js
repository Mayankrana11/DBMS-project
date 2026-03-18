const db = require("../config/db");

// Get all drivers
exports.getDrivers = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT d.driver_id, d.license_no, d.availability_status, d.rating_avg,
             e.e_fname, e.e_lname
      FROM DRIVER d
      JOIN EMPLOYEE e ON d.driver_id = e.employee_id
    `);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get available drivers
exports.getAvailableDrivers = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT d.driver_id, d.license_no, d.rating_avg,
             e.e_fname, e.e_lname
      FROM DRIVER d
      JOIN EMPLOYEE e ON d.driver_id = e.employee_id
      WHERE d.availability_status = 'available'
    `);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};