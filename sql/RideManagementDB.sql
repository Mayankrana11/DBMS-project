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

DESCRIBE user;

CREATE INDEX idx_ride_id ON RIDE(ride_id);

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

INSERT INTO COMPANY_OFFICE VALUES
(1, 'Delhi Office', 'Delhi', 'New Delhi');


INSERT INTO EMPLOYEE VALUES
(001, '2026-01-10', 'Mayank', NULL, 'Rana', '8895783991', 1), 
(002, '2026-01-11', 'Mukul', NULL, NULL, '1234567890', 1), 
(003, '2026-01-15', 'Rishi', NULL, 'Raina', '9999112260', 1); 

INSERT INTO MANAGER VALUES
(001, 'Mayank', NULL, 'Rana');

INSERT INTO DRIVER VALUES
(002, 'DL-4587', 'available', 4.5);

INSERT INTO TECHTEAM VALUES
(003, 'Rishi', NULL, 'Raina');

INSERT INTO VEHICLE VALUES
(1, 002, 'Sedan');

INSERT INTO RIDE VALUES
(111, 'completed', 'CP', 'Sector 18', 'Noida', 12.5, 350.00);

INSERT INTO USER VALUES
(125, 'completed', 'Rahul', NULL, 'Verma', 'rahul@gmail.com');

INSERT INTO PAYMENT VALUES
(501, 111, 350.00, 'success');

INSERT INTO ACCOUNT VALUES
(123, 125, 002, 1200.56);

INSERT INTO RATING VALUES
(701, 111, 002, 125, 5);

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


SHOW TABLES;
