const db = require("../config/db");

/*
========================================
1. USER BOOK RIDE
========================================
*/
exports.createRide = async (
  pickup,
  drop_off,
  user_id,
  distance = 10,
  cost = 200
) => {

  const client = await db.connect();

  try {

    await client.query("BEGIN");

    const userResult = await client.query(
      "SELECT * FROM users WHERE user_id=$1",
      [user_id]
    );

    if (userResult.rows.length === 0) {
      throw new Error("Invalid user_id");
    }

    let walletResult = await client.query(
      `
      SELECT balance
      FROM account
      WHERE entity_id=$1
      AND entity_type='user'
      ORDER BY account_id DESC
      LIMIT 1
      `,
      [user_id]
    );

    if (walletResult.rows.length === 0) {

      await client.query(
        `
        INSERT INTO account
        (entity_id,entity_type,balance)
        VALUES($1,'user',0)
        `,
        [user_id]
      );

      walletResult = await client.query(
        `
        SELECT balance
        FROM account
        WHERE entity_id=$1
        AND entity_type='user'
        ORDER BY account_id DESC
        LIMIT 1
        `,
        [user_id]
      );
    }

    const wallet = walletResult.rows[0];

    if (wallet.balance < cost) {
      throw new Error(
        "Insufficient wallet balance"
      );
    }

    const rideResult = await client.query(
      `
      INSERT INTO ride
      (
        ride_status,
        pickup,
        current_location,
        drop_off,
        dist_km,
        fare_amt,
        user_id,
        driver_id
      )
      VALUES
      (
        'requested',
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        NULL
      )
      RETURNING ride_id
      `,
      [
        pickup,
        pickup,
        drop_off,
        distance,
        cost,
        user_id
      ]
    );

    const ride_id =
      rideResult.rows[0].ride_id;

    await client.query("COMMIT");

    return {
      ride_id,
      user_id,
      distance,
      cost,
      message:
        "Ride requested, waiting for driver"
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



/*
========================================
2. DRIVER VIEW REQUESTED RIDES
========================================
*/
exports.getRequestedRides = async (
  driver_id
) => {

  const result = await db.query(
    `
    SELECT
      r.*,
      u.fname,
      u.lname,
      d.rating_avg
    FROM ride r
    JOIN users u
    ON r.user_id=u.user_id

    LEFT JOIN driver d
    ON r.driver_id=d.driver_id

    WHERE
    (
      r.ride_status='requested'
      AND EXISTS(
      SELECT 1
      FROM driver
      WHERE driver_id=$1
      AND availability_status='available'
      )
    )
    OR
    (
      r.ride_status='ongoing'
      AND r.driver_id=$2
    )
    `,
    [
      driver_id,
      driver_id
    ]
  );

  return result.rows;

};



/*
========================================
3. ACCEPT RIDE
========================================
*/
exports.acceptRide = async (
  ride_id,
  driver_id
) => {

  const client = await db.connect();

  try {

    await client.query("BEGIN");

    const driverResult =
      await client.query(
        `
SELECT availability_status
FROM driver
WHERE driver_id=$1
`,
        [driver_id]
      );

    if (
      driverResult.rows.length === 0
    ) {
      throw new Error(
        "Driver not found"
      );
    }

    const driver =
      driverResult.rows[0];

    if (
      driver.availability_status !== "available"
    ) {
      throw new Error(
        "Driver busy"
      );
    }

    const updateResult =
      await client.query(
        `
UPDATE ride
SET
driver_id=$1,
ride_status='ongoing'
WHERE ride_id=$2
AND ride_status='requested'
`,
        [
          driver_id,
          ride_id
        ]
      );

    if (
      updateResult.rowCount === 0
    ) {
      throw new Error(
        "Ride already accepted"
      );
    }

    await client.query(
      `
UPDATE driver
SET availability_status='busy'
WHERE driver_id=$1
`,
      [driver_id]
    );

    await client.query("COMMIT");

    return {
      message: "Ride accepted",
      ride_id,
      driver_id
    };

  }
  catch (err) {

    await client.query(
      "ROLLBACK"
    );

    throw err;

  }
  finally {

    client.release();

  }

};



/*
========================================
4. COMPLETE RIDE
========================================
*/
exports.completeRide = async (
  ride_id
) => {

  const client = await db.connect();

  try {

    await client.query("BEGIN");

    await client.query(
      `
UPDATE ride
SET
ride_status='completed',
current_location=drop_off
WHERE ride_id=$1
`,
      [ride_id]
    );

    const rideResult =
      await client.query(
        `
SELECT *
FROM ride
WHERE ride_id=$1
`,
        [ride_id]
      );

    const ride =
      rideResult.rows[0];

    await client.query(
      `
UPDATE payment
SET payment_status='success'
WHERE ride_id=$1
`,
      [ride_id]
    );

    await client.query(
      "COMMIT"
    );

    return {
      message:
        "Ride completed successfully",

      ride
    };

  }
  catch (err) {

    await client.query(
      "ROLLBACK"
    );

    throw err;

  }
  finally {

    client.release();

  }

};



/*
========================================
5. CANCEL RIDE
========================================
*/
exports.cancelRide = async (
  ride_id
) => {

  const client = await db.connect();

  try {

    await client.query(
      "BEGIN"
    );

    await client.query(
      `
UPDATE ride
SET ride_status='cancelled'
WHERE ride_id=$1
`,
      [ride_id]
    );

    await client.query(
      `
UPDATE payment
SET payment_status='failed'
WHERE ride_id=$1
`,
      [ride_id]
    );

    await client.query(
      "COMMIT"
    );

    return {
      message: "Ride cancelled"
    };

  }
  catch (err) {

    await client.query(
      "ROLLBACK"
    );

    throw err;

  }
  finally {

    client.release();

  }

};



/*
========================================
6. GET USER RIDE STATUS
========================================
*/
exports.getUserRideStatus =
  async (user_id) => {

    const result =
      await db.query(

        `
SELECT
r.ride_id,
r.ride_status,
r.driver_id,
d.rating_avg,

EXISTS(
SELECT 1
FROM rating ra
WHERE ra.ride_id=r.ride_id
AND ra.user_id=$1
)
AS already_rated

FROM ride r

LEFT JOIN driver d
ON r.driver_id=d.driver_id

WHERE r.user_id=$2

ORDER BY r.ride_id DESC
LIMIT 1
`,
        [
          user_id,
          user_id
        ]

      );

    return result.rows[0] || null;

  };