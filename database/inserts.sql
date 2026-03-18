-- inserts

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

