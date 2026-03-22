const db = require("../config/db");

/*
========================================
1. USER BOOK RIDE (requested state)
========================================
*/
exports.createRide = async (pickup, drop_off, user_id) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const ride_id = Math.floor(Math.random() * 10000);

    // 🔥 No driver assignment here
    await connection.query(
      `INSERT INTO RIDE 
      (ride_id, ride_status, pickup, current_location, drop_off, dist_km, fare_amt, user_id, driver_id)
      VALUES (?, 'requested', ?, ?, ?, ?, ?, ?, NULL)`,
      [ride_id, pickup, pickup, drop_off, 10, 200, user_id]
    );

    await connection.commit();

    return {
      ride_id,
      message: "Waiting for driver to accept..."
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
exports.getRequestedRides = async () => {
  const [rows] = await db.query(
    `SELECT r.*, u.fname, u.lname
     FROM RIDE r
     JOIN USER u ON r.user_id = u.user_id
     WHERE r.ride_status IN ('requested', 'ongoing')`
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

    // Assign driver + start ride
    await connection.query(
      `UPDATE RIDE 
       SET driver_id = ?, ride_status = 'ongoing'
       WHERE ride_id = ?`,
      [driver_id, ride_id]
    );

    // Mark driver busy
    await connection.query(
      `UPDATE DRIVER SET availability_status='busy' WHERE driver_id=?`,
      [driver_id]
    );

    // Create payment
    const payment_id = Math.floor(Math.random() * 10000);

    await connection.query(
      `INSERT INTO PAYMENT (payment_id, ride_id, amount, payment_status)
       VALUES (?, ?, ?, 'pending')`,
      [payment_id, ride_id, 200]
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
      `UPDATE RIDE SET ride_status='completed' WHERE ride_id=?`,
      [ride_id]
    );

    // Payment success → triggers account update
    await connection.query(
      `UPDATE PAYMENT SET payment_status='success' WHERE ride_id=?`,
      [ride_id]
    );

    // 🔥 Fetch updated data AFTER triggers
    const [[ride]] = await connection.query(
      `SELECT * FROM RIDE WHERE ride_id=?`,
      [ride_id]
    );

    const [[driver]] = await connection.query(
      `SELECT * FROM DRIVER WHERE driver_id=?`,
      [ride.driver_id]
    );

    const [[payment]] = await connection.query(
      `SELECT * FROM PAYMENT WHERE ride_id=?`,
      [ride_id]
    );

    const [[account]] = await connection.query(
      `SELECT * FROM ACCOUNT WHERE user_id=?`,
      [ride.user_id]
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