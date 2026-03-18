const db = require("../config/db");
const jwt = require("jsonwebtoken");

// Helper functions
const formatDate = (date) => {
  return new Date(date).toISOString().slice(0, 10).replace(/-/g, "");
};

exports.login = async (req, res) => {
  try {
    const { username, password, type } = req.body;

    if (type === "employee") {
      const [employees] = await db.query("SELECT * FROM EMPLOYEE");

      for (let emp of employees) {
        const expectedUsername = `${emp.employee_id}${emp.e_fname}`;
        const expectedPassword = formatDate(emp.joining_date);

        if (
          username === expectedUsername &&
          password === expectedPassword
        ) {
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
      }

      return res.status(401).json({ error: "Invalid credentials" });
    }

    // USER LOGIN
    if (type === "user") {
      const [users] = await db.query("SELECT * FROM USER");

      for (let user of users) {
        // Username logic
        let expectedUsername;

        if (!user.mname && !user.lname) {
          expectedUsername = `user${user.fname}`;
        } else {
          expectedUsername = `user${user.fname}${user.lname || ""}`;
        }

        // Password logic
        let expectedPassword = `${user.fname}${
          user.mname || ""
        }${user.lname || ""}`;

        if (
          username === expectedUsername &&
          password === expectedPassword
        ) {
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
      }

      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.status(400).json({ error: "Invalid login type" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};