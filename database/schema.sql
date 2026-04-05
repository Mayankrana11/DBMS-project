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
    account_id INT AUTO_INCREMENT PRIMARY KEY,
    entity_id INT,
    entity_type ENUM('user','driver'),
    balance DECIMAL(10,2) DEFAULT 0
);

DESCRIBE account;

CREATE TABLE RATING (  -- UPDATED TABLE
    rating_id INT AUTO_INCREMENT PRIMARY KEY,
    ride_id INT UNIQUE,
    driver_id INT,
    user_id INT,
    rating_val INT CHECK (rating_val BETWEEN 1 AND 5),

    FOREIGN KEY (ride_id) REFERENCES RIDE(ride_id),
    FOREIGN KEY (driver_id) REFERENCES DRIVER(driver_id),
    FOREIGN KEY (user_id) REFERENCES USER(user_id)
);

DESCRIBE rating;

CREATE TABLE AUTH (
    auth_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    password VARCHAR(100),
    role VARCHAR(20),
    linked_id INT
);

DESCRIBE auth;


ALTER TABLE RIDE MODIFY ride_id INT AUTO_INCREMENT;
ALTER TABLE PAYMENT MODIFY payment_id INT AUTO_INCREMENT;
ALTER TABLE RATING MODIFY rating_id INT AUTO_INCREMENT;

ALTER TABLE RIDE 
ADD user_id INT,
ADD driver_id INT;

ALTER TABLE USER DROP COLUMN ride_status;
ALTER TABLE USER DROP FOREIGN KEY user_ibfk_1;

ALTER TABLE RIDE
ADD FOREIGN KEY (user_id) REFERENCES USER(user_id),
ADD FOREIGN KEY (driver_id) REFERENCES DRIVER(driver_id);

ALTER TABLE DRIVER
ADD rating_count INT DEFAULT 0;