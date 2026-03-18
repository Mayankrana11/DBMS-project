const db = require("../config/db");

exports.createRide = async (pickup, drop_off, user_id) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Find available driver
    const [drivers] = await connection.query(
      "SELECT * FROM DRIVER WHERE availability_status = 'available' LIMIT 1"
    );

    if (drivers.length === 0) {
      throw new Error("No drivers available");
    }

    const driver = drivers[0];

    // 2. Generate ride id
    const ride_id = Math.floor(Math.random() * 10000);

    // 3. Create ride
    await connection.query(
      `INSERT INTO RIDE 
       (ride_id, ride_status, pickup, current_location, drop_off, dist_km, fare_amt)
       VALUES (?, 'ongoing', ?, ?, ?, ?, ?)`,
      [ride_id, pickup, pickup, drop_off, 10, 200]
    );

    // 4. Update driver status
    await connection.query(
      `UPDATE DRIVER SET availability_status='busy' WHERE driver_id=?`,
      [driver.driver_id]
    );

    await connection.commit();

    return { ride_id, driver };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};