const db = require("../config/db");

/*
1. GET ALL TABLES
*/
exports.getTables = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema='public'
      ORDER BY table_name
    `);

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/*
2. GET TABLE DATA
*/
exports.getTableData = async (req, res) => {
  try {
    const { name } = req.params;
    const limit = parseInt(req.query.limit) || 100;

    console.log("GET TABLE DATA:", name);

    const allowedTables = [
      "company_office",
      "employee",
      "manager",
      "driver",
      "techteam",
      "vehicle",
      "users",
      "ride",
      "payment",
      "account",
      "rating",
      "auth_table"
    ];

    if (!allowedTables.includes(name)) {
      return res.status(404).json({
        error: "Table not found"
      });
    }

    const result = await db.query(
      `SELECT * FROM ${name} LIMIT $1`,
      [limit]
    );

    console.log("Rows:", result.rows.length);

    res.json(result.rows);

  } catch (err) {
    console.error(err.message);

    res.status(500).json({
      error: err.message
    });
  }
};


/*
3. EXECUTE RAW QUERY
*/
exports.executeQuery = async (req, res) => {

  const client = await db.connect();

  try {

    const { query } = req.body;

    if (!query || typeof query !== "string") {
      return res.status(400).json({
        error: "Query required"
      });
    }

    const upperQuery = query.trim().toUpperCase();

    const blockedPatterns = [
      "DROP DATABASE",
      "TRUNCATE",
      "DELETE FROM AUTH_TABLE",
      "UPDATE AUTH_TABLE"
    ];

    for (const pattern of blockedPatterns) {

      if (upperQuery.includes(pattern)) {
        return res.status(403).json({
          error: `Blocked operation: ${pattern}`
        });
      }

    }

    await client.query("BEGIN");

    const result = await client.query(query);

    await client.query("COMMIT");

    if (
      upperQuery.startsWith("SELECT")
    ) {

      return res.json({
        success: true,
        data: result.rows,
        rowCount: result.rowCount
      });

    }

    return res.json({
      success: true,
      affectedRows: result.rowCount
    });

  } catch (err) {

    await client.query("ROLLBACK");

    res.status(500).json({
      error: err.message
    });

  } finally {

    client.release();

  }
};


/*
4. TOGGLE DRIVER AVAILABILITY
*/
exports.toggleDriverAvailability = async (req,res)=>{

  try{

    const {id}=req.params;
    const {status}=req.body;

    if(
      !["available","busy"].includes(status)
    ){

      return res.status(400).json({
        error:"Invalid status"
      });

    }

    const result = await db.query(
      `
      UPDATE driver
      SET availability_status=$1
      WHERE driver_id=$2
      `,
      [status,id]
    );

    if(result.rowCount===0){

      return res.status(404).json({
        error:"Driver not found"
      });

    }

    res.json({
      message:`Driver ${id} updated`,
      driver_id:Number(id),
      new_status:status
    });

  }
  catch(err){

    res.status(500).json({
      error:err.message
    });

  }

};


/*
5. GET USERS
*/
exports.getUsers = async(req,res)=>{

try{

const result=await db.query(`

SELECT
u.user_id,
CONCAT_WS(' ',u.fname,u.lname) AS name,
u.fname,
u.lname,
u.email_phn AS email,

COALESCE(

(
SELECT balance
FROM account a
WHERE a.entity_id=u.user_id
AND a.entity_type='user'
ORDER BY account_id DESC
LIMIT 1
),
0

) AS balance

FROM users u
ORDER BY u.user_id

`);

res.json(result.rows);

}
catch(err){

res.status(500).json({
error:err.message
});

}

};



/*
6. UPDATE USER BALANCE
*/
exports.updateUserBalance = async(req,res)=>{

const client=await db.connect();

try{

const user_id=parseInt(req.params.id);

const {balance}=req.body;

await client.query("BEGIN");

const userResult=await client.query(
`
SELECT *
FROM users
WHERE user_id=$1
`,
[user_id]
);

if(userResult.rows.length===0){

return res.status(404).json({
error:"User not found"
});

}

const user=userResult.rows[0];

const accountResult=await client.query(
`
SELECT account_id,balance
FROM account
WHERE entity_id=$1
AND entity_type='user'
ORDER BY account_id DESC
LIMIT 1
`,
[user_id]
);

if(accountResult.rows.length>0){

const latest=accountResult.rows[0];

await client.query(
`
UPDATE account
SET balance=$1
WHERE account_id=$2
`,
[
balance,
latest.account_id
]
);

res.json({

message:"Balance updated",

user_id,

old_balance:latest.balance,

new_balance:balance

});

}
else{

await client.query(
`
INSERT INTO account
(
entity_id,
entity_type,
balance
)
VALUES
(
$1,
'user',
$2
)
`,
[
user_id,
balance
]
);

res.json({

message:"Account created",

user_id,

new_balance:balance

});

}

await client.query("COMMIT");

}
catch(err){

await client.query("ROLLBACK");

res.status(500).json({
error:err.message
});

}
finally{

client.release();

}

};



/*
7. DATABASE STATS
*/
exports.getDatabaseStats=async(req,res)=>{

try{

const stats={};

const tables=[
"users",
"driver",
"employee",
"ride",
"payment",
"account",
"rating",
"auth_table",
"vehicle",
"manager",
"techteam",
"company_office"
];

for(const table of tables){

const result=await db.query(
`SELECT COUNT(*) AS count FROM ${table}`
);

stats[table]=result.rows[0].count;

}

res.json(stats);

}
catch(err){

res.status(500).json({
error:err.message
});

}

};