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

    // Add simulated locations for map display (spread around a city center)
    // In production, these would come from real GPS data
    const cityCenter = { lat: 28.6139, lon: 77.209 }; // Delhi coordinates

    const driversWithLocation = rows.map((driver, index) => {
      // Spread drivers around the city center with small offsets
      const latOffset = (Math.sin(index * 1.5) * 0.05); // ~5km spread
      const lonOffset = (Math.cos(index * 1.5) * 0.05);

      return {
        ...driver,
        lat: cityCenter.lat + latOffset,
        lon: cityCenter.lon + lonOffset
      };
    });

    res.json({ drivers: driversWithLocation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};