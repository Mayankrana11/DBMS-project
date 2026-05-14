const db = require("../config/db");

exports.submitRating = async (
  ride_id,
  user_id,
  rating_val
) => {

  const client = await db.connect();

  try {

    await client.query("BEGIN");

    // Get ride info

    const rideResult = await client.query(
      `
      SELECT driver_id
      FROM ride
      WHERE ride_id = $1
      AND user_id = $2
      AND ride_status = 'completed'
      `,
      [ride_id, user_id]
    );

    const ride = rideResult.rows[0];

    if (!ride) {
      throw new Error(
        "Ride not found or not completed"
      );
    }

    const driver_id = ride.driver_id;

    // Prevent duplicate rating

    const existingResult =
      await client.query(
        `
        SELECT *
        FROM rating
        WHERE ride_id = $1
        `,
        [ride_id]
      );

    if (
      existingResult.rows.length > 0
    ) {
      throw new Error(
        "Ride already rated"
      );
    }

    // Insert rating

    await client.query(
      `
      INSERT INTO rating
      (
        ride_id,
        driver_id,
        user_id,
        rating_val
      )
      VALUES
      (
        $1,
        $2,
        $3,
        $4
      )
      `,
      [
        ride_id,
        driver_id,
        user_id,
        rating_val
      ]
    );

    // Get current driver rating

    const driverResult =
      await client.query(
        `
        SELECT
          rating_avg,
          rating_count
        FROM driver
        WHERE driver_id = $1
        `,
        [driver_id]
      );

    const driver =
      driverResult.rows[0];

    const currentAvg =
      driver.rating_avg || 0;

    const currentCount =
      driver.rating_count || 0;

    const newCount =
      currentCount + 1;

    const newAvg =
      (
        (currentAvg * currentCount)
        + rating_val
      ) / newCount;

    // Update driver rating

    await client.query(
      `
      UPDATE driver
      SET
        rating_avg = $1,
        rating_count = $2
      WHERE driver_id = $3
      `,
      [
        newAvg,
        newCount,
        driver_id
      ]
    );

    await client.query(
      "COMMIT"
    );

    return {
      message: "Rating submitted",
      driver_id,
      rating_avg: Number(
        newAvg.toFixed(1)
      )
    };

  } catch (err) {

    await client.query(
      "ROLLBACK"
    );

    throw err;

  } finally {

    client.release();

  }

};