INSTALL DEPENDENCIES 

npm init -y
npm install express mysql2 dotenv cors
npm install nodemon --save-dev
npm install jsonwebtoken

AUTH CREDENTIALS LOGIC:
1) user : (125, 'completed', 'Rahul', NULL, 'Verma', ...) // user<first_name> ,<last_name>
Username: Rahul
Password: Verma

2) employee : (1, '2026-01-10', 'Mayank', ...) // <employee_id>, <joining_date in YYYYMMDD>
Username: 1
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


HOW TO USE?

open one panel either user or driver in one chrome tab open the counterpart in incognito window or a completely different browser
after adding pickup and dropoff send request the database assigs "requested" status to the ride and all available drivers recieve the request
who ever accepts the ride first gets assigned in the database with ride status changed to "ongoing" and driver status changed to "busy" after 
driver completes the ride from his panel the after_ride_complete trigger gets called inturn changing the ride status from "ongoing" to "completed" 
and driver status from "busy" to "available".