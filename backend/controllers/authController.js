const db = require("../config/db");
const jwt = require("jsonwebtoken");


exports.login = async (req, res) => {

  try {

    const { username, password } = req.body;

    const result = await db.query(
      `
SELECT *
FROM auth_table
WHERE username=$1
AND password=$2
`,
      [
        username,
        password
      ]
    );

    if (result.rows.length === 0) {

      return res.status(401).json({
        error: "Invalid credentials"
      });

    }

    const user = result.rows[0];

    const token = jwt.sign(

      {
        id: user.linked_id,
        role: user.role.toLowerCase()
      },

      process.env.JWT_SECRET,

      {
        expiresIn: "2h"
      }

    );

    res.json({

      message: "Login successful",

      token,

      role: user.role

    });

  }
  catch (err) {

    console.error(
      "LOGIN ERROR:",
      err
    );

    res.status(500).json({
      error: err.message
    });

  }

};



exports.register = async (req, res) => {

  const client = await db.connect();

  try {

    const {
      username,
      password,
      fname,
      mname,
      lname,
      email
    } = req.body;

    if (
      !username ||
      !password ||
      !fname ||
      !email
    ) {

      return res.status(400).json({
        error: "Required fields missing"
      });

    }

    await client.query(
      "BEGIN"
    );

    try {

      const userResult =
        await client.query(

          `
INSERT INTO users
(
fname,
mname,
lname,
email_phn
)

VALUES
(
$1,
$2,
$3,
$4
)

RETURNING user_id
`,

          [
            fname,
            mname || "",
            lname || "",
            email
          ]

        );

      const userId =
        userResult.rows[0].user_id;


      await client.query(

        `
INSERT INTO auth_table
(
username,
password,
role,
linked_id
)

VALUES
(
$1,
$2,
$3,
$4
)
`,

        [
          username,
          password,
          "user",
          userId
        ]

      );


      await client.query(
        "COMMIT"
      );


      const token = jwt.sign(

        {
          id: userId,
          role: "user"
        },

        process.env.JWT_SECRET,

        {
          expiresIn: "2h"
        }

      );


      res.json({

        message: "Registration successful",

        token,

        role: "user"

      });

    }
    catch (err) {

      await client.query(
        "ROLLBACK"
      );

      throw err;

    }

  }
  catch (err) {

    console.error(
      "REGISTER ERROR:",
      err
    );

    res.status(500).json({
      error: err.message
    });

  }
  finally {

    client.release();

  }

};