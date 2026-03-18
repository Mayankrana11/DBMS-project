-- schema

CREATE DATABASE RideManagementDB;

USE RideManagementDB;

CREATE TABLE COMPANY_OFFICE (
    office_id INT PRIMARY KEY,
    office_name VARCHAR(50) NOT NULL,
    o_state VARCHAR(50) NOT NULL,
    o_city VARCHAR(50) NOT NULL
);


CREATE TABLE EMPLOYEE (
    employee_id INT PRIMARY KEY,
    joining_date DATE,
    e_fname VARCHAR(30),
    e_mname VARCHAR(30),
    e_lname VARCHAR(30),
    e_contacts VARCHAR(15),
    office_id INT
);


CREATE TABLE MANAGER (
    manager_id INT PRIMARY KEY,
    m_fname VARCHAR(30),
    m_mname VARCHAR(30),
    m_lname VARCHAR(30)
);


CREATE TABLE DRIVER (
    driver_id INT,
    license_no VARCHAR(20) UNIQUE,
    availability_status VARCHAR(20),
    rating_avg DECIMAL(2,1),
    FOREIGN KEY (driver_id) REFERENCES EMPLOYEE(employee_id)
);

CREATE TABLE TECHTEAM (
    tech_id INT PRIMARY KEY,
    t_fname VARCHAR(30),
    t_mname VARCHAR(30),
    t_lname VARCHAR(30)
);

CREATE TABLE VEHICLE (
    vehicle_id INT PRIMARY KEY,
    driver_id INT,
    vehicle_type VARCHAR(30),
    FOREIGN KEY (driver_id) REFERENCES DRIVER(driver_id)
);


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

CREATE TABLE PAYMENT (
    payment_id INT PRIMARY KEY,
    ride_id INT,
    amount DECIMAL(8,2),
    payment_status VARCHAR(20),
    FOREIGN KEY (ride_id) REFERENCES RIDE(ride_id)
);



CREATE TABLE ACCOUNT (
    account_id INT,
    user_id INT,
    driver_id INT,
    balance DECIMAL(10,2),
    PRIMARY KEY (account_id, user_id, driver_id),
    FOREIGN KEY (user_id) REFERENCES USER(user_id),
    FOREIGN KEY (driver_id) REFERENCES DRIVER(driver_id)
);


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
