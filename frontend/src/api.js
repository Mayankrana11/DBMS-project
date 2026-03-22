const BASE_URL = "http://localhost:5000/api";

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