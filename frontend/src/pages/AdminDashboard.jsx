import React, { useEffect, useState } from "react";
import {
  getTables,
  getTableData,
  executeQuery,
  toggleDriverAvailability,
  getDatabaseStats,
  bookConcurrentRides,
  driverAcceptRace,
  atomicWalletTransfer,
  completeRideDemo,
  getUsers,
  updateUserBalance,
} from "../api";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function AdminDashboard({ setLoggedIn }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  const [activeTab, setActiveTab] = useState("database");
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [tableData, setTableData] = useState([]);
  const [sqlQuery, setSqlQuery] = useState("");
  const [queryResult, setQueryResult] = useState(null);
  const [stats, setStats] = useState({});
  const [drivers, setDrivers] = useState([]);

  // Transaction demo states
  const [concurrentResult, setConcurrentResult] = useState(null);
  const [raceResult, setRaceResult] = useState(null);
  const [transferResult, setTransferResult] = useState(null);
  const [rideCompleteResult, setRideCompleteResult] = useState(null);

  // Form states for transaction demos
  const [concurrentForm, setConcurrentForm] = useState({
    user_id: 125,
    pickup1: "Location A",
    drop1: "Location B",
    pickup2: "Location C",
    drop2: "Location D",
  });

  const [raceForm, setRaceForm] = useState({
    ride_id: 113,
    driver1_id: 2,
    driver2_id: 4,
  });

  const [transferForm, setTransferForm] = useState({
    from_user_id: 125,
    to_driver_id: 2,
    amount: 100,
  });

  const [rideCompleteForm, setRideCompleteForm] = useState({ ride_id: 113 });

  // User management state
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [newBalance, setNewBalance] = useState(0);

  useEffect(() => {
    if (token) {
      loadTables();
      loadStats();
      loadDrivers();
      loadUsers();
    }
  }, []);

  const loadTables = async () => {
    try {
      const data = await getTables(token);
      setTables(data);
    } catch (err) {
      console.error("Error loading tables:", err);
    }
  };

  const loadStats = async () => {
    try {
      const data = await getDatabaseStats(token);
      setStats(data);
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  };

  const loadTableData = async (tableName) => {
    setSelectedTable(tableName);
    try {
      const data = await getTableData(token, tableName);
      setTableData(data);
    } catch (err) {
      console.error("Error loading table data:", err);
      setTableData([]);
    }
  };

  const handleExecuteQuery = async () => {
    try {
      const result = await executeQuery(token, sqlQuery);
      setQueryResult(result);
      if (result.success) {
        loadTables();
        loadStats();
      }
    } catch (err) {
      setQueryResult({ error: err.message });
    }
  };

  const handleToggleDriver = async (driverId, currentStatus) => {
    try {
      const newStatus = currentStatus === "available" ? "busy" : "available";
      await toggleDriverAvailability(token, driverId, newStatus);
      loadDrivers();
      alert(`Driver ${driverId} marked as ${newStatus}`);
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const loadDrivers = async () => {
    try {
      const res = await fetch(`${BASE_URL}/drivers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setDrivers(data);
    } catch (err) {
      console.error("Error loading drivers:", err);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await getUsers(token);
      setUsers(data);
    } catch (err) {
      console.error("Error loading users:", err);
    }
  };

  const handleEditUserBalance = (user) => {
    setEditingUser(user.user_id);
    setNewBalance(Number(user.balance) || 0);
  };

  const handleUpdateBalance = async (userId) => {
    try {
      const result = await updateUserBalance(token, userId, newBalance);
      alert(result.message || `Balance updated to ₹${newBalance}`);
      setEditingUser(null);
      loadUsers();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  // Transaction Demo Handlers
  const handleBookConcurrent = async () => {
    try {
      const result = await bookConcurrentRides(token, concurrentForm);
      setConcurrentResult(result);
    } catch (err) {
      setConcurrentResult({ error: err.message });
    }
  };

  const handleAcceptRace = async () => {
    try {
      const result = await driverAcceptRace(token, raceForm);
      setRaceResult(result);
    } catch (err) {
      setRaceResult({ error: err.message });
    }
  };

  const handleWalletTransfer = async () => {
    try {
      const result = await atomicWalletTransfer(token, transferForm);
      setTransferResult(result);
    } catch (err) {
      setTransferResult({ error: err.message });
    }
  };

  const handleCompleteRideDemo = async () => {
    try {
      const result = await completeRideDemo(token, rideCompleteForm.ride_id);
      setRideCompleteResult(result);
    } catch (err) {
      setRideCompleteResult({ error: err.message });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setLoggedIn(false);
  };

  const renderDatabaseTab = () => (
    <div style={styles.tabContent}>
      <div style={styles.twoColumn}>
        {/* Left Column - Table List */}
        <div style={styles.column}>
          <h3 style={styles.subHeader}>Database Tables</h3>
          <div style={styles.statsGrid}>
            {Object.entries(stats).map(([table, count]) => (
              <div
                key={table}
                style={{
                  ...styles.statCard,
                  cursor: "pointer",
                  background: selectedTable === table ? "#e0e7ff" : "white",
                }}
                onClick={() => loadTableData(table)}
              >
                <div style={styles.statLabel}>{table}</div>
                <div style={styles.statValue}>{count} rows</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column - Table Data */}
        <div style={{ ...styles.column, flex: 2 }}>
          <h3 style={styles.subHeader}>
            {selectedTable ? `Data: ${selectedTable}` : "Select a table"}
          </h3>
          {tableData.length > 0 && (
            <div style={styles.tableContainer}>
              <table style={styles.dataTable}>
                <thead>
                  <tr>
                    {Object.keys(tableData[0]).map((key) => (
                      <th key={key} style={styles.th}>
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, idx) => (
                    <tr key={idx}>
                      {Object.values(row).map((val, i) => (
                        <td key={i} style={styles.td}>
                          {val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderSQLTab = () => (
    <div style={styles.tabContent}>
      <h3 style={styles.subHeader}>Execute SQL Query</h3>
      <p style={{ color: "#666", marginBottom: "15px" }}>
        ⚠️ Warning: Verify SQL Query before running directly onto database!!
      </p>
      <textarea
        style={styles.sqlTextarea}
        value={sqlQuery}
        onChange={(e) => setSqlQuery(e.target.value)}
        placeholder="Enter SQL query here... e.g., SELECT * FROM DRIVER WHERE availability_status = 'available'"
        rows={6}
      />
      <button style={styles.button} onClick={handleExecuteQuery}>
        Execute Query
      </button>

      {queryResult && (
        <div style={styles.resultBox}>
          <h4>Result:</h4>
          {queryResult.error ? (
            <div style={styles.error}>{queryResult.error}</div>
          ) : (
            <div>
              <div style={styles.success}>
                {queryResult.message || `${queryResult.rowCount} rows returned`}
              </div>
              {queryResult.data && queryResult.data.length > 0 && (
                <div style={styles.tableContainer}>
                  <table style={styles.dataTable}>
                    <thead>
                      <tr>
                        {Object.keys(queryResult.data[0]).map((key) => (
                          <th key={key} style={styles.th}>
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {queryResult.data.map((row, idx) => (
                        <tr key={idx}>
                          {Object.values(row).map((val, i) => (
                            <td key={i} style={styles.td}>
                              {val}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderQuickActionsTab = () => (
    <div style={styles.tabContent}>
      <h3 style={styles.subHeader}>Driver Availability Management</h3>
      <div style={styles.tableContainer}>
        <table style={styles.dataTable}>
          <thead>
            <tr>
              <th style={styles.th}>Driver ID</th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>License</th>
              <th style={styles.th}>Rating</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((driver) => (
              <tr key={driver.driver_id}>
                <td style={styles.td}>{driver.driver_id}</td>
                <td style={styles.td}>
                  {driver.e_fname} {driver.e_lname}
                </td>
                <td style={styles.td}>{driver.license_no}</td>
                <td style={styles.td}>⭐ {driver.rating_avg}</td>
                <td style={styles.td}>
                  <span
                    style={{
                      ...styles.statusBadge,
                      background:
                        driver.availability_status === "available"
                          ? "#22c55e"
                          : "#ef4444",
                    }}
                  >
                    {driver.availability_status}
                  </span>
                </td>
                <td style={styles.td}>
                  <button
                    style={{
                      ...styles.smallButton,
                      background:
                        driver.availability_status === "available"
                          ? "#ef4444"
                          : "#22c55e",
                    }}
                    onClick={() =>
                      handleToggleDriver(
                        driver.driver_id,
                        driver.availability_status
                      )
                    }
                  >
                    {driver.availability_status === "available"
                      ? "Set Busy"
                      : "Set Available"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Balance Management Panel */}
      <h3 style={{ ...styles.subHeader, marginTop: "30px" }}>User Balance Management</h3>
      <p style={{ color: "#666", marginBottom: "15px" }}>
        Edit user wallet balance for demo purposes
      </p>
      <div style={styles.tableContainer}>
        <table style={styles.dataTable}>
          <thead>
            <tr>
              <th style={styles.th}>User ID</th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Current Balance</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.user_id}>
                <td style={styles.td}>{user.user_id}</td>
                <td style={styles.td}>{user.name || `${user.fname} ${user.lname}`}</td>
                <td style={styles.td}>{user.email_phn}</td>
                <td style={styles.td}>
                  {editingUser === user.user_id ? (
                    <input
                      type="number"
                      style={{ ...styles.input, width: "100px" }}
                      value={newBalance}
                      onChange={(e) => setNewBalance(parseFloat(e.target.value) || 0)}
                    />
                  ) : (
                    <span>₹{Number(user.balance || 0)}</span>
                  )}
                </td>
                <td style={styles.td}>
                  {editingUser === user.user_id ? (
                    <>
                      <button
                        style={{ ...styles.smallButton, background: "#22c55e", marginRight: "5px" }}
                        onClick={() => handleUpdateBalance(user.user_id)}
                      >
                        Save
                      </button>
                      <button
                        style={{ ...styles.smallButton, background: "#ef4444" }}
                        onClick={() => setEditingUser(null)}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      style={{ ...styles.smallButton, background: "#4f46e5" }}
                      onClick={() => handleEditUserBalance(user)}
                    >
                      Edit Balance
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTransactionDemoTab = () => (
    <div style={styles.tabContent}>
      <h3 style={styles.subHeader}>ACID Transaction Demonstrations</h3>

      {/* Demo 1: Concurrent Ride Booking */}
      <div style={styles.demoCard}>
        <h4 style={styles.demoTitle}>1. Atomicity Demo - Concurrent Ride Booking</h4>
        <p style={styles.demoDesc}>
          Attempts to book two rides simultaneously. If user has insufficient balance for both,
          the transaction rolls back completely (atomicity).
        </p>
        <div style={styles.formRow}>
          <input
            style={styles.input}
            type="number"
            placeholder="User ID"
            value={concurrentForm.user_id}
            onChange={(e) =>
              setConcurrentForm({ ...concurrentForm, user_id: parseInt(e.target.value) })
            }
          />
          <input
            style={styles.input}
            placeholder="Pickup 1"
            value={concurrentForm.pickup1}
            onChange={(e) =>
              setConcurrentForm({ ...concurrentForm, pickup1: e.target.value })
            }
          />
          <input
            style={styles.input}
            placeholder="Drop 1"
            value={concurrentForm.drop1}
            onChange={(e) =>
              setConcurrentForm({ ...concurrentForm, drop1: e.target.value })
            }
          />
        </div>
        <div style={styles.formRow}>
          <input
            style={styles.input}
            placeholder="Pickup 2"
            value={concurrentForm.pickup2}
            onChange={(e) =>
              setConcurrentForm({ ...concurrentForm, pickup2: e.target.value })
            }
          />
          <input
            style={styles.input}
            placeholder="Drop 2"
            value={concurrentForm.drop2}
            onChange={(e) =>
              setConcurrentForm({ ...concurrentForm, drop2: e.target.value })
            }
          />
          <button style={styles.button} onClick={handleBookConcurrent}>
            Run Demo
          </button>
        </div>
        {concurrentResult && (
          <div style={styles.resultBox}>
            <pre style={styles.pre}>{JSON.stringify(concurrentResult, null, 2)}</pre>
          </div>
        )}
      </div>

      {/* Demo 2: Driver Acceptance Race */}
      <div style={styles.demoCard}>
        <h4 style={styles.demoTitle}>2. Isolation Demo - Driver Acceptance Race</h4>
        <p style={styles.demoDesc}>
          Two drivers try to accept the same ride. Only one succeeds due to row-level locking
          (isolation). The other driver's update affects 0 rows.
        </p>
        <div style={styles.formRow}>
          <input
            style={styles.input}
            type="number"
            placeholder="Ride ID"
            value={raceForm.ride_id}
            onChange={(e) =>
              setRaceForm({ ...raceForm, ride_id: parseInt(e.target.value) })
            }
          />
          <input
            style={styles.input}
            type="number"
            placeholder="Driver 1 ID"
            value={raceForm.driver1_id}
            onChange={(e) =>
              setRaceForm({ ...raceForm, driver1_id: parseInt(e.target.value) })
            }
          />
          <input
            style={styles.input}
            type="number"
            placeholder="Driver 2 ID"
            value={raceForm.driver2_id}
            onChange={(e) =>
              setRaceForm({ ...raceForm, driver2_id: parseInt(e.target.value) })
            }
          />
          <button style={styles.button} onClick={handleAcceptRace}>
            Run Demo
          </button>
        </div>
        {raceResult && (
          <div style={styles.resultBox}>
            <pre style={styles.pre}>{JSON.stringify(raceResult, null, 2)}</pre>
          </div>
        )}
      </div>

      {/* Demo 3: Atomic Wallet Transfer */}
      <div style={styles.demoCard}>
        <h4 style={styles.demoTitle}>3. Consistency Demo - Atomic Wallet Transfer</h4>
        <p style={styles.demoDesc}>
          Transfer money from user to driver. Total money in system remains constant
          (consistency). Debit and credit happen atomically.
        </p>
        <div style={styles.formRow}>
          <input
            style={styles.input}
            type="number"
            placeholder="From User ID"
            value={transferForm.from_user_id}
            onChange={(e) =>
              setTransferForm({ ...transferForm, from_user_id: parseInt(e.target.value) })
            }
          />
          <input
            style={styles.input}
            type="number"
            placeholder="To Driver ID"
            value={transferForm.to_driver_id}
            onChange={(e) =>
              setTransferForm({ ...transferForm, to_driver_id: parseInt(e.target.value) })
            }
          />
          <input
            style={styles.input}
            type="number"
            placeholder="Amount"
            value={transferForm.amount}
            onChange={(e) =>
              setTransferForm({ ...transferForm, amount: parseInt(e.target.value) })
            }
          />
          <button style={styles.button} onClick={handleWalletTransfer}>
            Run Demo
          </button>
        </div>
        {transferResult && (
          <div style={styles.resultBox}>
            <pre style={styles.pre}>{JSON.stringify(transferResult, null, 2)}</pre>
          </div>
        )}
      </div>

      {/* Demo 4: Complete Ride with ACID */}
      <div style={styles.demoCard}>
        <h4 style={styles.demoTitle}>4. Full ACID Demo - Complete Ride</h4>
        <p style={styles.demoDesc}>
          Complete a ride with all ACID properties: atomicity (all-or-nothing),
          consistency (money conserved), isolation (concurrent-safe), durability (permanent).
        </p>
        <div style={styles.formRow}>
          <input
            style={styles.input}
            type="number"
            placeholder="Ride ID"
            value={rideCompleteForm.ride_id}
            onChange={(e) =>
              setRideCompleteForm({ ride_id: parseInt(e.target.value) })
            }
          />
          <button style={styles.button} onClick={handleCompleteRideDemo}>
            Run Demo
          </button>
        </div>
        {rideCompleteResult && (
          <div style={styles.resultBox}>
            <pre style={styles.pre}>{JSON.stringify(rideCompleteResult, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2>🛠 Admin / Manager Dashboard</h2>
        <div style={styles.headerRight}>
          <span style={styles.roleBadge}>{role?.toUpperCase()}</span>
          <button style={styles.logoutButton} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === "database" ? styles.activeTab : {}),
          }}
          onClick={() => setActiveTab("database")}
        >
          📊 Database Browser
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === "sql" ? styles.activeTab : {}),
          }}
          onClick={() => setActiveTab("sql")}
        >
          💻 SQL Executor
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === "actions" ? styles.activeTab : {}),
          }}
          onClick={() => setActiveTab("actions")}
        >
          ⚡ Quick Actions
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === "transactions" ? styles.activeTab : {}),
          }}
          onClick={() => setActiveTab("transactions")}
        >
          🔬 Transaction Demos
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "database" && renderDatabaseTab()}
      {activeTab === "sql" && renderSQLTab()}
      {activeTab === "actions" && renderQuickActionsTab()}
      {activeTab === "transactions" && renderTransactionDemoTab()}
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#f4f6f9",
    padding: "20px",
  },
  header: {
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    color: "white",
    padding: "20px 30px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: "12px",
    marginBottom: "20px",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },
  roleBadge: {
    background: "rgba(255,255,255,0.2)",
    padding: "5px 12px",
    borderRadius: "20px",
    fontSize: "14px",
  },
  logoutButton: {
    background: "white",
    color: "#4f46e5",
    border: "none",
    padding: "8px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },
  tabs: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
    borderBottom: "2px solid #e0e0e0",
    paddingBottom: "10px",
  },
  tab: {
    padding: "12px 20px",
    border: "none",
    background: "white",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "500",
    transition: "all 0.2s",
  },
  activeTab: {
    background: "#4f46e5",
    color: "white",
  },
  tabContent: {
    background: "white",
    padding: "25px",
    borderRadius: "12px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
  },
  subHeader: {
    fontSize: "18px",
    marginBottom: "15px",
    color: "#333",
  },
  twoColumn: {
    display: "flex",
    gap: "20px",
  },
  column: {
    flex: 1,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
    gap: "10px",
  },
  statCard: {
    background: "white",
    border: "2px solid #e0e0e0",
    padding: "15px",
    borderRadius: "8px",
    textAlign: "center",
    transition: "all 0.2s",
  },
  statLabel: {
    fontSize: "14px",
    color: "#666",
    marginBottom: "5px",
  },
  statValue: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#4f46e5",
  },
  tableContainer: {
    overflowX: "auto",
    marginTop: "15px",
  },
  dataTable: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  },
  th: {
    background: "#4f46e5",
    color: "white",
    padding: "12px",
    textAlign: "left",
    border: "1px solid #ddd",
  },
  td: {
    padding: "10px 12px",
    border: "1px solid #ddd",
  },
  sqlTextarea: {
    width: "100%",
    padding: "15px",
    fontFamily: "monospace",
    fontSize: "14px",
    border: "2px solid #e0e0e0",
    borderRadius: "8px",
    resize: "vertical",
  },
  button: {
    background: "#4f46e5",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    marginTop: "10px",
  },
  smallButton: {
    padding: "5px 10px",
    border: "none",
    borderRadius: "5px",
    color: "white",
    cursor: "pointer",
    fontSize: "12px",
  },
  resultBox: {
    marginTop: "20px",
    padding: "15px",
    background: "#f8fafc",
    borderRadius: "8px",
    border: "1px solid #e0e0e0",
  },
  error: {
    color: "#ef4444",
    fontWeight: "600",
  },
  success: {
    color: "#22c55e",
    fontWeight: "600",
  },
  pre: {
    whiteSpace: "pre-wrap",
    wordWrap: "break-word",
    fontSize: "13px",
    color: "#333",
  },
  statusBadge: {
    padding: "4px 10px",
    borderRadius: "12px",
    color: "white",
    fontSize: "12px",
    fontWeight: "600",
  },
  demoCard: {
    border: "2px solid #e0e0e0",
    padding: "20px",
    borderRadius: "10px",
    marginBottom: "20px",
  },
  demoTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#333",
    marginBottom: "8px",
  },
  demoDesc: {
    fontSize: "14px",
    color: "#666",
    marginBottom: "15px",
  },
  formRow: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  input: {
    padding: "8px 12px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: "14px",
    minWidth: "120px",
  },
};

export default AdminDashboard;
