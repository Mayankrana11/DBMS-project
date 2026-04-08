const db = require("../config/db");

/*
========================================
1. USER BOOK RIDE (requested state)
========================================
*/
exports.createRide = async (pickup, drop_off, user_id, distance = 10, cost = 200) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 🔥 FIX 3: CHECK IF USER EXISTS
    const [users] = await connection.query(
      "SELECT * FROM USER WHERE user_id = ?",
      [user_id]
    );

    if (users.length === 0) {
      throw new Error("Invalid user_id");
    }

    // Check wallet balance
    const [[wallet]] = await connection.query(
      "SELECT balance FROM ACCOUNT WHERE entity_id=? AND entity_type='user'",
      [user_id]
    );

    // Create wallet if missing
    if (!wallet) {
      await connection.query(
        "INSERT INTO ACCOUNT(entity_id, entity_type, balance) VALUES (?, 'user', 1000)",
        [user_id]
      );
    }

    // Fetch balance again
    const [[walletCheck]] = await connection.query(
      "SELECT balance FROM ACCOUNT WHERE entity_id=? AND entity_type='user'",
      [user_id]
    );

    if (walletCheck.balance < cost) {
      throw new Error("Insufficient wallet balance to book ride");
    }

    // Insert ride (requested, no driver yet)
    await connection.query(
      `INSERT INTO RIDE
      (ride_status, pickup, current_location, drop_off, dist_km, fare_amt, user_id, driver_id)
      VALUES ('requested', ?, ?, ?, ?, ?, ?, NULL)`,
      [pickup, pickup, drop_off, distance, cost, user_id]
    );

    const [[ride]] = await connection.query(
      "SELECT LAST_INSERT_ID() AS ride_id"
    );

    const ride_id = ride.ride_id;

    await connection.commit();

    return {
      ride_id,
      user_id,
      distance,
      cost,
      message: "Ride requested, waiting for driver"
    };

  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};


/*
========================================
2. DRIVER: VIEW REQUESTED RIDES
========================================
*/
exports.getRequestedRides = async (driver_id) => {
  const [rows] = await db.query(
    `SELECT r.*, u.fname, u.lname, d.rating_avg
     FROM RIDE r
     JOIN USER u ON r.user_id = u.user_id
     LEFT JOIN DRIVER d ON r.driver_id = d.driver_id
     WHERE 
        (
          r.ride_status = 'requested'
          AND EXISTS (
            SELECT 1 FROM DRIVER d
            WHERE d.driver_id = ? AND d.availability_status = 'available'
          )
        )
        OR
        (
          r.ride_status = 'ongoing'
          AND r.driver_id = ?
        )`,
    [driver_id, driver_id]
  );

  return rows;
};


/*
========================================
3. DRIVER: ACCEPT RIDE
========================================
*/
exports.acceptRide = async (ride_id, driver_id) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 🔥 CHECK DRIVER AVAILABILITY (ADD HERE)
    const [driver] = await connection.query(
      "SELECT availability_status FROM DRIVER WHERE driver_id=?",
      [driver_id]
    );

    if (driver.length === 0) {
      throw new Error("Driver not found");
    }

    if (driver[0].availability_status !== "available") {
      throw new Error("Driver is already busy");
    }

    // Assign driver + start ride
    const [result] = await connection.query(
      `UPDATE RIDE 
      SET driver_id = ?, ride_status = 'ongoing'
      WHERE ride_id = ? AND ride_status = 'requested'`,
      [driver_id, ride_id]
    );

    // If no rows updated → someone already accepted
    if (result.affectedRows === 0) {
      throw new Error("Ride already accepted by another driver");
    }

    // 🔥 Mark driver busy
    await connection.query(
      `UPDATE DRIVER SET availability_status='busy' WHERE driver_id=?`,
      [driver_id]
    );

    await connection.commit();

    return {
      message: "Ride accepted",
      ride_id,
      driver_id
    };

  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};


/*
========================================
4. DRIVER: COMPLETE RIDE (TRIGGERS DEMO)
========================================
*/
exports.completeRide = async (ride_id) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Complete ride
    await connection.query(
      `UPDATE RIDE 
      SET ride_status = 'completed', current_location = current_location
      WHERE ride_id = ?`,
      [ride_id]
    );

    // Payment success → triggers account update
    await connection.query(
      `UPDATE PAYMENT SET payment_status='success' WHERE ride_id=?`,
      [ride_id]
    );

    // 🔥 Fetch updated data AFTER triggers
    const [[ride]] = await connection.query(
      "SELECT user_id, driver_id, fare_amt FROM RIDE WHERE ride_id=?",
      [ride_id]
    );

    const [[driver]] = await connection.query(
      `SELECT * FROM DRIVER WHERE driver_id=?`,
      [ride.driver_id]
    );

    const fare = ride.fare_amt;
    const user_id = ride.user_id;
    const driver_id = ride.driver_id;

    // Ensure wallets exist
    await connection.query(
      "INSERT IGNORE INTO ACCOUNT(entity_id, entity_type, balance) VALUES (?, 'user', 1000)",
      [user_id]
    );

    await connection.query(
      "INSERT IGNORE INTO ACCOUNT(entity_id, entity_type, balance) VALUES (?, 'driver', 1000)",
      [driver_id]
    );

    // Deduct user balance
    await connection.query(
      `UPDATE ACCOUNT
      SET balance = balance - ?
      WHERE entity_id=? AND entity_type='user'`,
      [fare, user_id]
    );

    // Add driver balance
    await connection.query(
      `UPDATE ACCOUNT
      SET balance = balance + ?
      WHERE entity_id=? AND entity_type='driver'`,
      [fare, driver_id]
    );

    // Mark payment success
    await connection.query(
      "UPDATE PAYMENT SET payment_status='success' WHERE ride_id=?",
      [ride_id]
    );

    const [[account]] = await connection.query(
      `SELECT * FROM ACCOUNT 
      WHERE entity_id=? AND entity_type='user'`,
      [ride.user_id]
    );
    const [[payment]] = await connection.query(
      "SELECT payment_status, amount FROM PAYMENT WHERE ride_id=?",
      [ride_id]
    );

    await connection.commit();

    return {
      message: "Ride completed successfully",

      ride: {
        ride_id: ride.ride_id,
        ride_status: ride.ride_status
      },

      driver: {
        driver_id: driver.driver_id,
        availability_status: driver.availability_status
      },

      payment: {
        payment_status: payment.payment_status,
        amount: payment.amount
      },

      account: {
        user_id: account.user_id,
        updated_balance: account.balance
      },

      trigger_info:
        "Driver availability & account balance updated via triggers"
    };

  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};


/*
========================================
5. DRIVER: CANCEL RIDE
========================================
*/
exports.cancelRide = async (ride_id) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    await connection.query(
      `UPDATE RIDE SET ride_status='cancelled' WHERE ride_id=?`,
      [ride_id]
    );

    await connection.query(
      `UPDATE PAYMENT SET payment_status='failed' WHERE ride_id=?`,
      [ride_id]
    );

    await connection.commit();

    return {
      message: "Ride cancelled"
    };

  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

/*
========================================
6. USER: GET RIDE STATUS
========================================
*/
exports.getUserRideStatus = async (user_id) => {

  const [rows] = await db.query(
    `SELECT 
        r.ride_id,
        r.ride_status,
        r.driver_id,
        d.rating_avg,

        EXISTS (
            SELECT 1
            FROM RATING ra
            WHERE ra.ride_id = r.ride_id
            AND ra.user_id = ?
        ) AS already_rated

     FROM RIDE r
     LEFT JOIN DRIVER d 
     ON r.driver_id = d.driver_id

     WHERE r.user_id = ?

     ORDER BY r.ride_id DESC
     LIMIT 1`,
    [user_id, user_id]
  );

  if (rows.length === 0) {
    return null;
  }

  return rows[0];
};