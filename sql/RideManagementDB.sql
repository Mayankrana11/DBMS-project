CREATE DATABASE RideManagementDB;

USE RideManagementDB;

CREATE TABLE COMPANY_OFFICE (
    office_id INT PRIMARY KEY,
    office_name VARCHAR(50) NOT NULL,
    o_state VARCHAR(50) NOT NULL,
    o_city VARCHAR(50) NOT NULL
);

DESCRIBE company_office;


CREATE TABLE EMPLOYEE (
    employee_id INT PRIMARY KEY,
    joining_date DATE,
    e_fname VARCHAR(30),
    e_mname VARCHAR(30),
    e_lname VARCHAR(30),
    e_contacts VARCHAR(15),
    office_id INT
);
DESCRIBE employee;


CREATE TABLE MANAGER (
    manager_id INT PRIMARY KEY,
    m_fname VARCHAR(30),
    m_mname VARCHAR(30),
    m_lname VARCHAR(30)
);

DESCRIBE manager;

CREATE TABLE DRIVER (
    driver_id INT,
    license_no VARCHAR(20) UNIQUE,
    availability_status VARCHAR(20),
    rating_avg DECIMAL(2,1),
    FOREIGN KEY (driver_id) REFERENCES EMPLOYEE(employee_id)
);

DESCRIBE driver;

CREATE TABLE TECHTEAM (
    tech_id INT PRIMARY KEY,
    t_fname VARCHAR(30),
    t_mname VARCHAR(30),
    t_lname VARCHAR(30)
);

DESCRIBE techteam;

CREATE TABLE VEHICLE (
    vehicle_id INT PRIMARY KEY,
    driver_id INT,
    vehicle_type VARCHAR(30),
    FOREIGN KEY (driver_id) REFERENCES DRIVER(driver_id)
);

DESCRIBE vehicle;

CREATE TABLE RIDE (
    ride_id INT,
    ride_status VARCHAR(20),
    pickup VARCHAR(100),
    current_location VARCHAR(100),
    drop_off VARCHAR(100),
    dist_km DECIMAL(6,2),
    fare_amt DECIMAL(8,2),
    PRIMARY KEY (ride_id, ride_status)
);

CREATE INDEX idx_ride_status ON RIDE(ride_status);

DESCRIBE ride;

CREATE TABLE USER (
    user_id INT PRIMARY KEY,
    ride_status VARCHAR(20),
    fname VARCHAR(30),
    mname VARCHAR(30),
    lname VARCHAR(30),
    email_phn VARCHAR(50),
    FOREIGN KEY (ride_status) REFERENCES RIDE(ride_status)
);
CREATE INDEX idx_ride_id ON RIDE(ride_id);

ALTER TABLE USER DROP COLUMN ride_status;
ALTER TABLE USER DROP FOREIGN KEY user_ibfk_1;
DESCRIBE user;


CREATE TABLE PAYMENT (
    payment_id INT PRIMARY KEY,
    ride_id INT,
    amount DECIMAL(8,2),
    payment_status VARCHAR(20),
    FOREIGN KEY (ride_id) REFERENCES RIDE(ride_id)
);

DESCRIBE payment;


CREATE TABLE ACCOUNT (
    account_id INT,
    user_id INT,
    driver_id INT,
    balance DECIMAL(10,2),
    PRIMARY KEY (account_id, user_id, driver_id),
    FOREIGN KEY (user_id) REFERENCES USER(user_id),
    FOREIGN KEY (driver_id) REFERENCES DRIVER(driver_id)
);

DESCRIBE account;

CREATE TABLE RATING (
    rating_id INT,
    ride_id INT,
    driver_id INT,
    user_id INT,
    rating_val INT,
    PRIMARY KEY (rating_id, ride_id, driver_id, user_id),
    FOREIGN KEY (ride_id) REFERENCES RIDE(ride_id),
    FOREIGN KEY (driver_id) REFERENCES DRIVER(driver_id),
    FOREIGN KEY (user_id) REFERENCES USER(user_id)
);

DESCRIBE rating;

-- adding data for the above tables

SET SQL_SAFE_UPDATES = 0;

DELETE FROM RATING;
DELETE FROM ACCOUNT;
DELETE FROM PAYMENT;
DELETE FROM USER;
DELETE FROM VEHICLE;
DELETE FROM DRIVER;
DELETE FROM TECHTEAM;
DELETE FROM MANAGER;
DELETE FROM EMPLOYEE;
DELETE FROM RIDE;
DELETE FROM COMPANY_OFFICE;

SET SQL_SAFE_UPDATES = 1;

INSERT INTO COMPANY_OFFICE VALUES
(1, 'Delhi Office', 'Delhi', 'New Delhi'),
(2, 'Mumbai Office', 'Maharashtra', 'Mumbai'),
(3, 'Bangalore Office', 'Karnataka', 'Bangalore');

INSERT INTO EMPLOYEE VALUES
(001, '2026-01-10', 'Mayank', NULL, 'Rana', '8895783991', 1),
(002, '2026-01-11', 'Mukul', NULL, NULL, '1234567890', 1),
(003, '2026-01-15', 'Rishi', NULL, 'Raina', '9999112260', 1),
(004, '2026-01-18', 'Aman', NULL, 'Sharma', '9876543210', 2),
(005, '2026-01-20', 'Neha', NULL, 'Kapoor', '9988776655', 2),
(006, '2026-01-21', 'Arjun', NULL, 'Mehta', '8899001122', 3),
(007, '2026-01-22', 'Priya', NULL, 'Singh', '7788996655', 3),
(008, '2026-01-25', 'Karan', NULL, 'Malhotra', '8899776655', 1);

INSERT INTO MANAGER VALUES
(001, 'Mayank', NULL, 'Rana'),
(004, 'Aman', NULL, 'Sharma');

INSERT INTO DRIVER VALUES
(002, 'DL-4587', 'available', 4.5),
(004, 'MH-7845', 'available', 4.2),
(006, 'KA-9987', 'busy', 4.7),
(008, 'DL-2211', 'available', 4.0);

INSERT INTO TECHTEAM VALUES
(003, 'Rishi', NULL, 'Raina'),
(005, 'Neha', NULL, 'Kapoor'),
(007, 'Priya', NULL, 'Singh');

INSERT INTO VEHICLE VALUES
(1, 002, 'Sedan'),
(2, 004, 'Auto'),
(3, 006, 'SUV'),
(4, 008, 'Sedan');

INSERT INTO RIDE VALUES
(111, 'completed', 'CP', 'Sector 18', 'Noida', 12.5, 350.00),
(112, 'completed', 'Connaught Place', 'Karol Bagh', 'Dwarka', 15.2, 420.00),
(113, 'ongoing', 'Saket', 'AIIMS', 'CP', 8.5, 200.00),
(114, 'completed', 'Noida Sector 62', 'Botanical Garden', 'Delhi Gate', 18.3, 520.00),
(115, 'cancelled', 'Rohini', 'Pitampura', 'Rajouri Garden', 6.0, 150.00),
(116, 'completed', 'Indirapuram', 'Akshardham', 'Lajpat Nagar', 20.5, 600.00);


INSERT INTO USER VALUES
(125, 'completed', 'Rahul', NULL, 'Verma', 'rahul@gmail.com'),
(126, 'completed', 'Sneha', NULL, 'Gupta', 'sneha@gmail.com'),
(127, 'ongoing', 'Amit', NULL, 'Khanna', 'amit@gmail.com'),
(128, 'completed', 'Rohit', NULL, 'Bansal', 'rohit@gmail.com'),
(129, 'cancelled', 'Simran', NULL, 'Kaur', 'simran@gmail.com'),
(130, 'completed', 'Vikas', NULL, 'Arora', 'vikas@gmail.com');

INSERT INTO PAYMENT VALUES
(501, 111, 350.00, 'success'),
(502, 112, 420.00, 'success'),
(503, 113, 200.00, 'pending'),
(504, 114, 520.00, 'success'),
(505, 115, 150.00, 'failed'),
(506, 116, 600.00, 'success');

INSERT INTO ACCOUNT VALUES
(123, 125, 002, 1200.56),
(124, 126, 004, 850.75),
(125, 127, 006, 640.50),
(126, 128, 002, 980.00),
(127, 129, 004, 300.00),
(128, 130, 008, 1500.00);

INSERT INTO RATING VALUES
(701, 111, 002, 125, 5),
(702, 112, 004, 126, 4),
(703, 114, 006, 128, 5),
(704, 116, 008, 130, 4);


SELECT * FROM COMPANY_OFFICE;
SELECT * FROM EMPLOYEE;
SELECT * FROM MANAGER;
SELECT * FROM DRIVER;
SELECT * FROM TECHTEAM;
SELECT * FROM VEHICLE;
SELECT * FROM RIDE;
SELECT * FROM USER;
SELECT * FROM PAYMENT;
SELECT * FROM ACCOUNT;
SELECT * FROM RATING;

-- testing cases and updating

SET SQL_SAFE_UPDATES = 0; -- off
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_SAFE_UPDATES = 1; -- on
SET FOREIGN_KEY_CHECKS = 1;
DELETE FROM RIDE WHERE ride_id = 2513;
DELETE FROM RIDE WHERE ride_id = 7980;

SHOW TRIGGERS;

SELECT ride_status FROM RIDE WHERE ride_id = 3754;


UPDATE DRIVER 
SET availability_status = 'available'
WHERE driver_id = 2;

UPDATE DRIVER 
SET availability_status = 'available'
WHERE driver_id = 4;

ALTER TABLE RIDE 
ADD user_id INT,
ADD driver_id INT;

ALTER TABLE RIDE
ADD FOREIGN KEY (user_id) REFERENCES USER(user_id),
ADD FOREIGN KEY (driver_id) REFERENCES DRIVER(driver_id);


SHOW TABLES;

-- query 1 listing employees with their office name
SELECT e.employee_id, e.e_fname, e.e_lname, c.office_name
FROM EMPLOYEE e
JOIN COMPANY_OFFICE c
ON e.office_id = c.office_id;

-- query 2 showing all drivers in the available state
SELECT driver_id, license_no, rating_avg
FROM DRIVER
WHERE availability_status = 'available';

-- query 3 showing vehicles and the drivers that drive these vehicles
SELECT v.vehicle_id, 
       v.vehicle_type, 
       d.driver_id,
       e.e_fname,
       e.e_lname
FROM VEHICLE v
JOIN DRIVER d 
ON v.driver_id = d.driver_id
JOIN EMPLOYEE e 
ON d.driver_id = e.employee_id;

-- query 4 showing rides with price greater than some price x , let x = 400
SELECT ride_id, pickup, drop_off, fare_amt
FROM RIDE
WHERE fare_amt > 400;

-- query 5 showing all users with their ride status 
SELECT user_id, fname, lname, ride_status
FROM USER;

-- query 6 showing sum of amt generated from rides 
SELECT SUM(fare_amt) AS total_revenue
FROM RIDE
WHERE ride_status = 'completed';

-- query 7 showing avg rating of drivers 
SELECT AVG(rating_avg) AS avg_driver_rating
FROM DRIVER;

-- query showing max rating (with driver and user name)
SELECT r.ride_id,
       r.pickup,
       r.drop_off,
       r.fare_amt,
       CONCAT(e.e_fname,' ',e.e_lname) AS driver_name,
       CONCAT(u.fname,' ',u.lname) AS passenger_name
FROM RIDE r
JOIN RATING ra ON r.ride_id = ra.ride_id
JOIN DRIVER d ON ra.driver_id = d.driver_id
JOIN EMPLOYEE e ON d.driver_id = e.employee_id
JOIN USER u ON ra.user_id = u.user_id
WHERE r.fare_amt = (
    SELECT MAX(fare_amt)
    FROM RIDE
);

-- query 9 drivers with above avg rating (using CONCAT_WS otherwise mukul's name would be null as concatinating even a single null string returns null value
SELECT d.driver_id,
       CONCAT_WS(' ', e.e_fname, e.e_lname) AS driver_name, 
       d.license_no,
       d.rating_avg
FROM DRIVER d
JOIN EMPLOYEE e 
ON d.driver_id = e.employee_id
WHERE d.rating_avg > (
    SELECT AVG(rating_avg)
    FROM DRIVER
);

-- query 10 users with completed rides 
SELECT 
    u.user_id,
    CONCAT_WS(' ', u.fname, u.lname) AS passenger_name,
    d.driver_id,
    CONCAT_WS(' ', e.e_fname, e.e_lname) AS driver_name,
    v.vehicle_id,
    v.vehicle_type,
    d.license_no AS vehicle_number_plate
FROM USER u
JOIN RATING r ON u.user_id = r.user_id
JOIN DRIVER d ON r.driver_id = d.driver_id
JOIN EMPLOYEE e ON d.driver_id = e.employee_id
JOIN VEHICLE v ON d.driver_id = v.driver_id
WHERE u.ride_status IN (
    SELECT ride_status
    FROM RIDE
    WHERE ride_status = 'completed'
);

-- query 11 drivers who received ratings
SELECT 
    d.driver_id,
    CONCAT_WS(' ', e.e_fname, e.e_lname) AS driver_name,
    d.license_no,
    u.user_id,
    CONCAT_WS(' ', u.fname, u.lname) AS user_name,
    r.rating_val
FROM DRIVER d
JOIN EMPLOYEE e ON d.driver_id = e.employee_id
JOIN RATING r ON d.driver_id = r.driver_id
JOIN USER u ON r.user_id = u.user_id
WHERE d.driver_id IN (
    SELECT driver_id
    FROM RATING
);

-- query 12 showing users with account balance above average
SELECT 
    a.account_id,
    u.user_id,
    CONCAT_WS(' ', u.fname, u.lname) AS user_name,
    u.email_phn,
    a.balance
FROM ACCOUNT a
JOIN USER u ON a.user_id = u.user_id
WHERE a.balance > (
    SELECT AVG(balance)
    FROM ACCOUNT
);

-- query 13 showing completed ride details for highest paid ride
SELECT 
    r.ride_id,
    r.pickup,
    r.current_location,
    r.drop_off,
    r.dist_km,
    r.fare_amt,
    r.ride_status,

    CONCAT_WS(' ', u.fname, u.lname) AS passenger_name,
    u.email_phn,

    d.driver_id,
    CONCAT_WS(' ', e.e_fname, e.e_lname) AS driver_name,
    d.license_no,

    v.vehicle_id,
    v.vehicle_type,

    p.payment_id,
    p.payment_status,
    p.amount

FROM RIDE r
JOIN PAYMENT p ON r.ride_id = p.ride_id
JOIN RATING ra ON r.ride_id = ra.ride_id
JOIN USER u ON ra.user_id = u.user_id
JOIN DRIVER d ON ra.driver_id = d.driver_id
JOIN EMPLOYEE e ON d.driver_id = e.employee_id
JOIN VEHICLE v ON d.driver_id = v.driver_id

WHERE r.fare_amt = (
    SELECT MAX(fare_amt)
    FROM RIDE
);

-- query 14 users who paid above avg of the total 
SELECT 
    u.user_id,
    CONCAT_WS(' ', u.fname, u.lname) AS passenger_name,
    u.email_phn,

    r.ride_id,
    r.pickup,
    r.drop_off,
    r.fare_amt,

    p.payment_id,
    p.amount,
    p.payment_status,

    d.driver_id,
    CONCAT_WS(' ', e.e_fname, e.e_lname) AS driver_name,
    d.license_no,

    v.vehicle_id,
    v.vehicle_type

FROM USER u
JOIN RATING ra ON u.user_id = ra.user_id
JOIN RIDE r ON ra.ride_id = r.ride_id
JOIN PAYMENT p ON r.ride_id = p.ride_id
JOIN DRIVER d ON ra.driver_id = d.driver_id
JOIN EMPLOYEE e ON d.driver_id = e.employee_id
JOIN VEHICLE v ON d.driver_id = v.driver_id

WHERE p.amount > (
    SELECT AVG(amount)
    FROM PAYMENT
);

-- query 15 showing top rated drivers with payments and and ride stats 
SELECT 
    d.driver_id,
    CONCAT_WS(' ', e.e_fname, e.e_lname) AS driver_name,
    d.license_no,
    d.rating_avg,

    v.vehicle_id,
    v.vehicle_type,

    COUNT(DISTINCT r.ride_id) AS total_rides,
    AVG(ra.rating_val) AS avg_rating_received,
    SUM(p.amount) AS total_revenue_generated

FROM DRIVER d
JOIN EMPLOYEE e ON d.driver_id = e.employee_id
JOIN VEHICLE v ON d.driver_id = v.driver_id
JOIN RATING ra ON d.driver_id = ra.driver_id
JOIN RIDE r ON ra.ride_id = r.ride_id
JOIN PAYMENT p ON r.ride_id = p.ride_id

GROUP BY 
    d.driver_id,
    e.e_fname,
    e.e_lname,
    d.license_no,
    d.rating_avg,
    v.vehicle_id,
    v.vehicle_type

HAVING d.rating_avg > (
    SELECT AVG(rating_avg)
    FROM DRIVER
);

-- Triggers

DROP TRIGGER IF EXISTS after_ride_complete;

DELIMITER $$

CREATE TRIGGER after_ride_complete
AFTER UPDATE ON RIDE
FOR EACH ROW
BEGIN
    IF NEW.ride_status = 'completed' THEN
        UPDATE DRIVER
        SET availability_status = 'available'
        WHERE driver_id = NEW.driver_id;
    END IF;
END$$

SELECT ride_id, driver_id, ride_status FROM RIDE WHERE ride_id = 3754;

SHOW TRIGGERS;

DELIMITER $$

CREATE TRIGGER after_payment_success
AFTER UPDATE ON PAYMENT
FOR EACH ROW
BEGIN
    IF NEW.payment_status = 'success' THEN
        UPDATE ACCOUNT
        SET balance = balance - NEW.amount
        WHERE user_id = (
            SELECT user_id FROM RIDE WHERE ride_id = NEW.ride_id
        );
    END IF;
END$$

DELIMITER ;

