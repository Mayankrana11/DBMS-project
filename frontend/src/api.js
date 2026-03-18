const API = "http://localhost:5000/api";

export const login = async (data) => {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(data),
  });
  return res.json();
};

export const bookRide = async (token, data) => {
  const res = await fetch(`${API}/rides/book`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const getDrivers = async () => {
  const res = await fetch(`${API}/drivers`);
  return res.json();
};