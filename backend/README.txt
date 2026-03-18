INSTALL DEPENDENCIES 

npm init -y
npm install express mysql2 dotenv cors
npm install nodemon --save-dev

CREATE .ENV

PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=RideManagementDB

API CALLS:
http://localhost:5000/api/users 
http://localhost:5000/api/drivers
http://localhost:5000/api/drivers/available
POST http://localhost:5000/api/rides/book
