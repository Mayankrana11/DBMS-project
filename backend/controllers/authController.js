const db = require("../config/db");
const jwt = require("jsonwebtoken");


exports.login = async (req, res) => {
  try {
    const { username, password, type } = req.body;

    // ================= EMPLOYEE LOGIN =================
 if (type === "employee") {
  const empId = parseInt(username);

  if (isNaN(empId)) {
    return res.status(400).json({ error: "Invalid employee ID" });
  }

  const [employees] = await db.query(
    "SELECT * FROM EMPLOYEE WHERE employee_id = ?",
    [empId]
  );

  if (employees.length === 0) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const emp = employees[0];

const formatDate = (date) => {
  const d = new Date(date);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}${month}${day}`;
};

  const expectedPassword = formatDate(emp.joining_date);

  
  if (String(password) !== expectedPassword) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    {
      id: emp.employee_id,
      role: "employee",
    },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );

  return res.json({
    message: "Employee login successful",
    token,
  });
}

    // ================= USER LOGIN (FIXED) =================
    if (type === "user") {
      const [users] = await db.query(
        "SELECT * FROM USER WHERE fname = ? AND lname = ?",
        [username, password]
      );

      if (users.length > 0) {
        const user = users[0];

        const token = jwt.sign(
          {
            id: user.user_id,
            role: "user",
          },
          process.env.JWT_SECRET,
          { expiresIn: "2h" }
        );

        return res.json({
          message: "User login successful",
          token,
        });
      }

      return res.status(401).json({ error: "Invalid credentials" });
    }

    // ================= INVALID TYPE =================
    return res.status(400).json({ error: "Invalid login type" });

  } catch (err) {
    console.error("LOGIN ERROR:", err);  // 👈 ADD THIS LINE
    res.status(500).json({ error: err.message });
  }
};