const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const login = async (data) => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...data,
      type: data.type === "driver" ? "employee" : data.type, // 🔥 FIX
    }),
  });

  return res.json();
};

export const register = async (data) => {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return res.json();
};

export const bookRide = async (token, data) => {
  const res = await fetch(`${BASE_URL}/rides/book`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  return res.json();
};

export const submitRating = async (token, data) => {
  const res = await fetch(`${BASE_URL}/rating/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  return res.json();
};

/* ========================================
   ADMIN API FUNCTIONS
   ======================================== */
export const getTables = async (token) => {
  const res = await fetch(`${BASE_URL}/admin/tables`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const getTableData = async (token, tableName, limit = 100) => {
  const res = await fetch(`${BASE_URL}/admin/table/${tableName}?limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const executeQuery = async (token, query) => {
  const res = await fetch(`${BASE_URL}/admin/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ query })
  });
  return res.json();
};

export const toggleDriverAvailability = async (token, driverId, status) => {
  const res = await fetch(`${BASE_URL}/admin/driver/${driverId}/toggle`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  });
  return res.json();
};

export const getDatabaseStats = async (token) => {
  const res = await fetch(`${BASE_URL}/admin/stats`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const getUsers = async (token) => {
  const res = await fetch(`${BASE_URL}/admin/users`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const updateUserBalance = async (token, userId, balance) => {
  const res = await fetch(`${BASE_URL}/admin/user/${userId}/balance`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ balance })
  });
  return res.json();
};

/* ========================================
   TRANSACTION DEMO API FUNCTIONS
   ======================================== */
export const bookConcurrentRides = async (token, data) => {
  const res = await fetch(`${BASE_URL}/transactions/book-concurrent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  return res.json();
};

export const driverAcceptRace = async (token, data) => {
  const res = await fetch(`${BASE_URL}/transactions/accept-race`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  return res.json();
};

export const atomicWalletTransfer = async (token, data) => {
  const res = await fetch(`${BASE_URL}/transactions/wallet-transfer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  return res.json();
};

export const completeRideDemo = async (token, rideId) => {
  const res = await fetch(`${BASE_URL}/transactions/complete-ride-demo`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ ride_id: rideId })
  });
  return res.json();
};