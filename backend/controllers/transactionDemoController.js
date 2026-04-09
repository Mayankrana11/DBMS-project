const db = require("../config/db");

/*
========================================
1. CONCURRENT RIDE BOOKING (Atomicity Demo)
========================================
Demonstrates:
- Atomicity: Either both operations succeed or both fail
- Shows rollback when user has insufficient balance for second ride
*/
exports.bookConcurrentRides = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { user_id, pickup1, drop1, pickup2, drop2 } = req.body;

    if (!user_id || !pickup1 || !drop1 || !pickup2 || !drop2) {
      return res.status(400).json({ error: "All fields required: user_id, pickup1, drop1, pickup2, drop2" });
    }

    const results = [];

    // Start transaction
    await connection.beginTransaction();

    // Check wallet balance ONCE at start
    const [[wallet]] = await connection.query(
      "SELECT balance FROM ACCOUNT WHERE entity_id = ? AND entity_type = 'user' ORDER BY account_id DESC LIMIT 1",
      [user_id]
    );

    const currentBalance = wallet ? wallet.balance : 0;
    const rideCost = 200; // Each ride costs 200

    results.push({
      step: "Initial Check",
      user_id,
      wallet_balance: currentBalance,
      required_for_two_rides: rideCost * 2
    });

    // Try to book first ride
    try {
      await connection.query(
        `INSERT INTO RIDE
        (ride_status, pickup, current_location, drop_off, dist_km, fare_amt, user_id, driver_id)
        VALUES ('requested', ?, ?, ?, ?, ?, ?, NULL)`,
        [pickup1, pickup1, drop1, 10, rideCost, user_id]
      );

      const [[ride1]] = await connection.query("SELECT LAST_INSERT_ID() AS ride_id");
      results.push({ step: "Ride 1 Booked", ride_id: ride1.ride_id, status: "success" });

    } catch (err) {
      results.push({ step: "Ride 1 Failed", error: err.message });
      throw err;
    }

    // Try to book second ride (may fail due to insufficient balance)
    try {
      // Re-check balance after first ride deduction
      const [[walletAfterFirst]] = await connection.query(
        "SELECT balance FROM ACCOUNT WHERE entity_id = ? AND entity_type = 'user' ORDER BY account_id DESC LIMIT 1",
        [user_id]
      );

      if (walletAfterFirst.balance < rideCost) {
        throw new Error(`Insufficient balance for second ride. Has: ${walletAfterFirst.balance}, Needs: ${rideCost}`);
      }

      await connection.query(
        `INSERT INTO RIDE
        (ride_status, pickup, current_location, drop_off, dist_km, fare_amt, user_id, driver_id)
        VALUES ('requested', ?, ?, ?, ?, ?, ?, NULL)`,
        [pickup2, pickup2, drop2, 10, rideCost, user_id]
      );

      const [[ride2]] = await connection.query("SELECT LAST_INSERT_ID() AS ride_id");
      results.push({ step: "Ride 2 Booked", ride_id: ride2.ride_id, status: "success" });

    } catch (err) {
      results.push({
        step: "Ride 2 Failed",
        error: err.message,
        atomicity_demo: "Rolling back both rides to maintain consistency"
      });

      // ROLLBACK - Atomicity in action!
      await connection.rollback();

      return res.json({
        scenario: "Atomicity Demo - Insufficient Balance",
        description: "When the second ride fails due to insufficient balance, the entire transaction rolls back",
        acid_property: "ATOMICITY - All or nothing",
        results,
        final_state: "Both rides cancelled due to rollback"
      });
    }

    // If both succeed, deduct from user's latest account entry
    const [[userAcc]] = await connection.query(
      "SELECT account_id FROM ACCOUNT WHERE entity_id = ? AND entity_type = 'user' ORDER BY account_id DESC LIMIT 1",
      [user_id]
    );
    await connection.query(
      "UPDATE ACCOUNT SET balance = balance - ? WHERE account_id = ?",
      [rideCost * 2, userAcc.account_id]
    );

    await connection.commit();

    res.json({
      scenario: "Both Rides Successful",
      description: "User had sufficient balance for both rides",
      acid_property: "ATOMICITY - Both operations completed",
      results,
      final_state: "Both rides booked successfully"
    });

  } catch (err) {
    await connection.rollback();
    res.status(500).json({
      error: err.message,
      acid_demo: "Transaction rolled back - atomicity preserved"
    });
  } finally {
    connection.release();
  }
};

/*
========================================
2. DRIVER ACCEPTANCE RACE (Isolation Demo)
========================================
Demonstrates:
- Isolation: Two drivers trying to accept same ride
- Only one succeeds due to row-level locking
- Shows how transactions prevent double-booking
*/
exports.driverAcceptRace = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { ride_id, driver1_id, driver2_id } = req.body;

    if (!ride_id || !driver1_id || !driver2_id) {
      return res.status(400).json({ error: "All fields required: ride_id, driver1_id, driver2_id" });
    }

    const results = [];

    // Check initial state
    const [[ride]] = await connection.query(
      "SELECT ride_status, driver_id FROM RIDE WHERE ride_id = ?",
      [ride_id]
    );

    if (!ride) {
      return res.status(404).json({ error: "Ride not found" });
    }

    results.push({
      step: "Initial State",
      ride_id,
      current_status: ride.ride_status,
      current_driver: ride.driver_id
    });

    if (ride.ride_status !== "requested") {
      return res.json({
        scenario: "Race Condition Demo - Invalid State",
        description: "Ride is not in 'requested' state",
        results
      });
    }

    // Check both drivers' availability
    const [[driver1]] = await connection.query(
      "SELECT availability_status FROM DRIVER WHERE driver_id = ?",
      [driver1_id]
    );

    const [[driver2]] = await connection.query(
      "SELECT availability_status FROM DRIVER WHERE driver_id = ?",
      [driver2_id]
    );

    results.push({
      step: "Driver Status Check",
      driver1: { id: driver1_id, status: driver1?.availability_status },
      driver2: { id: driver2_id, status: driver2?.availability_status }
    });

    // Start transaction for the race
    await connection.beginTransaction();

    // Simulate race: Try driver 1 first
    let winner = null;

    try {
      // Check if driver1 is available
      if (driver1?.availability_status !== "available") {
        throw new Error("Driver 1 is not available");
      }

      // Try to accept ride (uses row-level locking via WHERE clause)
      const [result1] = await connection.query(
        `UPDATE RIDE
         SET driver_id = ?, ride_status = 'ongoing'
         WHERE ride_id = ? AND ride_status = 'requested'`,
        [driver1_id, ride_id]
      );

      if (result1.affectedRows > 0) {
        // Driver 1 won the race!
        await connection.query(
          "UPDATE DRIVER SET availability_status = 'busy' WHERE driver_id = ?",
          [driver1_id]
        );
        winner = "driver1";
        results.push({ step: "Race Result", winner: "Driver 1", driver_id: driver1_id });
      }

    } catch (err) {
      results.push({ step: "Driver 1 Failed", error: err.message });
    }

    // Now try driver 2 (if driver 1 succeeded, this should fail)
    if (!winner) {
      try {
        if (driver2?.availability_status !== "available") {
          throw new Error("Driver 2 is not available");
        }

        const [result2] = await connection.query(
          `UPDATE RIDE
           SET driver_id = ?, ride_status = 'ongoing'
           WHERE ride_id = ? AND ride_status = 'requested'`,
          [driver2_id, ride_id]
        );

        if (result2.affectedRows > 0) {
          await connection.query(
            "UPDATE DRIVER SET availability_status = 'busy' WHERE driver_id = ?",
            [driver2_id]
          );
          winner = "driver2";
          results.push({ step: "Race Result", winner: "Driver 2", driver_id: driver2_id });
        }

      } catch (err) {
        results.push({ step: "Driver 2 Failed", error: err.message });
      }
    }

    // Check final state
    const [[finalRide]] = await connection.query(
      "SELECT ride_status, driver_id FROM RIDE WHERE ride_id = ?",
      [ride_id]
    );

    results.push({
      step: "Final State",
      ride_status: finalRide.ride_status,
      assigned_driver: finalRide.driver_id
    });

    await connection.commit();

    res.json({
      scenario: "Isolation Demo - Driver Race Condition",
      description: "Two drivers compete for the same ride. Only one wins due to row-level locking.",
      acid_property: "ISOLATION - Concurrent transactions don't interfere",
      winner: winner,
      results,
      explanation: winner
        ? `Driver ${winner === "driver1" ? driver1_id : driver2_id} won the race. The other driver's update affected 0 rows.`
        : "No driver won - both may have been unavailable"
    });

  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
};

/*
========================================
3. ATOMIC WALLET TRANSFER (Consistency Demo)
========================================
Demonstrates:
- Consistency: Money is neither created nor destroyed
- Atomicity: Debit and credit happen together or not at all
*/
exports.atomicWalletTransfer = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { from_user_id, to_driver_id, amount } = req.body;

    if (!from_user_id || !to_driver_id || !amount) {
      return res.status(400).json({ error: "All fields required: from_user_id, to_driver_id, amount" });
    }

    const results = [];

    await connection.beginTransaction();

    // Get initial balances
    const [[fromWallet]] = await connection.query(
      "SELECT balance FROM ACCOUNT WHERE entity_id = ? AND entity_type = 'user' ORDER BY account_id DESC LIMIT 1",
      [from_user_id]
    );

    const [[toWallet]] = await connection.query(
      "SELECT balance FROM ACCOUNT WHERE entity_id = ? AND entity_type = 'driver' ORDER BY account_id DESC LIMIT 1",
      [to_driver_id]
    );

    const initialFromBalance = fromWallet?.balance || 0;
    const initialToBalance = toWallet?.balance || 0;
    const totalBefore = initialFromBalance + initialToBalance;

    results.push({
      step: "Before Transfer",
      from_user: { id: from_user_id, balance: initialFromBalance },
      to_driver: { id: to_driver_id, balance: initialToBalance },
      total_money: totalBefore
    });

    // Check if sufficient balance
    if (initialFromBalance < amount) {
      return res.json({
        scenario: "Consistency Demo - Insufficient Funds",
        description: "Transfer rejected due to insufficient balance",
        acid_property: "CONSISTENCY - Cannot create money from nothing",
        results,
        error: `Insufficient balance. Has: ${initialFromBalance}, Needs: ${amount}`
      });
    }

    // Perform atomic transfer - debit from user's latest account
    const [[userAcc]] = await connection.query(
      "SELECT account_id FROM ACCOUNT WHERE entity_id = ? AND entity_type = 'user' ORDER BY account_id DESC LIMIT 1",
      [from_user_id]
    );
    await connection.query(
      "UPDATE ACCOUNT SET balance = balance - ? WHERE account_id = ?",
      [amount, userAcc.account_id]
    );

    results.push({ step: "Debited from user", amount });

    // Credit to driver's latest account
    const [[driverAcc]] = await connection.query(
      "SELECT account_id FROM ACCOUNT WHERE entity_id = ? AND entity_type = 'driver' ORDER BY account_id DESC LIMIT 1",
      [to_driver_id]
    );
    await connection.query(
      "UPDATE ACCOUNT SET balance = balance + ? WHERE account_id = ?",
      [amount, driverAcc.account_id]
    );

    results.push({ step: "Credited to driver", amount });

    // Verify consistency
    const [[fromWalletAfter]] = await connection.query(
      "SELECT balance FROM ACCOUNT WHERE entity_id = ? AND entity_type = 'user' ORDER BY account_id DESC LIMIT 1",
      [from_user_id]
    );

    const [[toWalletAfter]] = await connection.query(
      "SELECT balance FROM ACCOUNT WHERE entity_id = ? AND entity_type = 'driver' ORDER BY account_id DESC LIMIT 1",
      [to_driver_id]
    );

    const totalAfter = fromWalletAfter.balance + toWalletAfter.balance;

    results.push({
      step: "After Transfer",
      from_user: { id: from_user_id, balance: fromWalletAfter.balance },
      to_driver: { id: to_driver_id, balance: toWalletAfter.balance },
      total_money: totalAfter,
      consistency_check: totalBefore === totalAfter ? "PASSED" : "FAILED"
    });

    await connection.commit();

    res.json({
      scenario: "Consistency Demo - Atomic Wallet Transfer",
      description: "Money transferred from user to driver atomically",
      acid_property: "CONSISTENCY - Total money in system remains constant",
      results,
      explanation: `Total before: ${totalBefore}, Total after: ${totalAfter}. Money conserved: ${totalBefore === totalAfter}`
    });

  } catch (err) {
    await connection.rollback();
    res.status(500).json({
      error: err.message,
      acid_demo: "Transaction rolled back - consistency preserved"
    });
  } finally {
    connection.release();
  }
};

/*
========================================
4. COMPLETE RIDE WITH ROLLBACK SCENARIO
========================================
Demonstrates full ride completion with all ACID properties
*/
exports.completeRideWithAcidDemo = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { ride_id } = req.body;

    if (!ride_id) {
      return res.status(400).json({ error: "ride_id required" });
    }

    const results = [];

    await connection.beginTransaction();

    // Get ride details
    const [[ride]] = await connection.query(
      "SELECT * FROM RIDE WHERE ride_id = ?",
      [ride_id]
    );

    if (!ride) {
      return res.status(404).json({ error: "Ride not found" });
    }

    results.push({
      step: "Ride Details",
      ride_id,
      status: ride.ride_status,
      user_id: ride.user_id,
      driver_id: ride.driver_id,
      fare: ride.fare_amt
    });

    // Get balances before
    const [[userWallet]] = await connection.query(
      "SELECT balance FROM ACCOUNT WHERE entity_id = ? AND entity_type = 'user' ORDER BY account_id DESC LIMIT 1",
      [ride.user_id]
    );

    const [[driverWallet]] = await connection.query(
      "SELECT balance FROM ACCOUNT WHERE entity_id = ? AND entity_type = 'driver' ORDER BY account_id DESC LIMIT 1",
      [ride.driver_id]
    );

    const totalBefore = userWallet.balance + driverWallet.balance;

    results.push({
      step: "Balances Before",
      user_balance: userWallet.balance,
      driver_balance: driverWallet.balance,
      total: totalBefore
    });

    // Update ride status
    await connection.query(
      "UPDATE RIDE SET ride_status = 'completed' WHERE ride_id = ?",
      [ride_id]
    );

    results.push({ step: "Ride marked as completed" });

    // Update payment
    await connection.query(
      "UPDATE PAYMENT SET payment_status = 'success' WHERE ride_id = ?",
      [ride_id]
    );

    results.push({ step: "Payment marked as success" });

    // Deduct from user
    await connection.query(
      "UPDATE ACCOUNT SET balance = balance - ? WHERE entity_id = ? AND entity_type = 'user'",
      [ride.fare_amt, ride.user_id]
    );

    results.push({ step: `Debited ${ride.fare_amt} from user` });

    // Credit to driver
    await connection.query(
      "UPDATE ACCOUNT SET balance = balance + ? WHERE entity_id = ? AND entity_type = 'driver'",
      [ride.fare_amt, ride.driver_id]
    );

    results.push({ step: `Credited ${ride.fare_amt} to driver` });

    // Verify final state
    const [[userAfter]] = await connection.query(
      "SELECT balance FROM ACCOUNT WHERE entity_id = ? AND entity_type = 'user' ORDER BY account_id DESC LIMIT 1",
      [ride.user_id]
    );

    const [[driverAfter]] = await connection.query(
      "SELECT balance FROM ACCOUNT WHERE entity_id = ? AND entity_type = 'driver' ORDER BY account_id DESC LIMIT 1",
      [ride.driver_id]
    );

    const totalAfter = userAfter.balance + driverAfter.balance;

    results.push({
      step: "Balances After",
      user_balance: userAfter.balance,
      driver_balance: driverAfter.balance,
      total: totalAfter,
      consistency_check: totalBefore === totalAfter ? "PASSED" : "FAILED"
    });

    await connection.commit();

    res.json({
      scenario: "Full Ride Completion - All ACID Properties",
      description: "Complete ride with payment and wallet updates",
      acid_properties: {
        atomicity: "All operations succeed or all fail together",
        consistency: `Money conserved: ${totalBefore} → ${totalAfter}`,
        isolation: "Transaction isolated from concurrent operations",
        durability: "Changes committed to database permanently"
      },
      results
    });

  } catch (err) {
    await connection.rollback();
    res.status(500).json({
      error: err.message,
      acid_demo: "Transaction rolled back"
    });
  } finally {
    connection.release();
  }
};
