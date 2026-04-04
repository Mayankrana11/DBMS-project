const db = require("../config/db");

exports.submitRating = async (ride_id, user_id, rating_val) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Get ride info
    const [[ride]] = await connection.query(
      "SELECT driver_id FROM RIDE WHERE ride_id=? AND user_id=? AND ride_status='completed'",
      [ride_id, user_id]
    );

    if (!ride) {
      throw new Error("Ride not found or not completed");
    }

    const driver_id = ride.driver_id;

    // Prevent duplicate rating
    const [existing] = await connection.query(
      "SELECT * FROM RATING WHERE ride_id=?",
      [ride_id]
    );

    if (existing.length > 0) {
      throw new Error("Ride already rated");
    }

    // Insert rating
    await connection.query(
      `INSERT INTO RATING (ride_id, driver_id, user_id, rating_val)
       VALUES (?, ?, ?, ?)`,
      [ride_id, driver_id, user_id, rating_val]
    );

    // Fetch driver current rating
    const [[driver]] = await connection.query(
      "SELECT rating_avg, rating_count FROM DRIVER WHERE driver_id=?",
      [driver_id]
    );

    const newCount = driver.rating_count + 1;
    const newAvg =
      ((driver.rating_avg * driver.rating_count) + rating_val) / newCount;

    // Update driver rating
    await connection.query(
      `UPDATE DRIVER 
       SET rating_avg=?, rating_count=?
       WHERE driver_id=?`,
      [newAvg, newCount, driver_id]
    );

    await connection.commit();

    return {
      message: "Rating submitted",
      driver_id,
      rating_avg: newAvg
    };

  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};