INSTALL DEPENDENCIES 

npm init -y
npm install express mysql2 dotenv cors
npm install nodemon --save-dev
npm install jsonwebtoken

AUTH CREDENTIALS LOGIC:
1) user : (125, 'completed', 'Rahul', NULL, 'Verma', ...) // user<first_name><last_name> , <first_name><middle_name><last_name> ignore any nulls
Username: userRahulVerma
Password: RahulVerma

2) employee : (1, '2026-01-10', 'Mayank', ...) // <employee_id><first_name> , <joining_date in YYYYMMDD>
Username: 1Mayank
Password: 20260110

CREATE .ENV

PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=RideManagementDB
JWT_SECRET=supersecretkey123

API CALLS:
http://localhost:5000/api/users 
http://localhost:5000/api/drivers
http://localhost:5000/api/drivers/available
POST http://localhost:5000/api/rides/book

AUTH CALL: 
POST /api/auth/login
POST /auth/login

USER CALL: 
GET /users
GET /users/:id

PAYMENT CALL:
POST /payments/pay