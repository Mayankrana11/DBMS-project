# Ride-Hailing Management System  
(Database Management Systems Project)

## Group Number
46

## Team Members
- Mayank Rana (2024341)  
- Rishi Raina (2024456)  
- Mukul (2024359)

---

## Project Overview

This project is a database-driven Ride-Hailing Management System inspired by real-world platforms such as Uber and Ola. The system is designed to efficiently manage on-demand transportation services by connecting users who request rides with available drivers, handling ride execution, processing payments and supporting administrative operations.

The primary focus of this project is the design and implementation of a relational database that supports complex queries, constraints, triggers and transactions while maintaining data consistency and integrity.

---

## Objectives

- Design a realistic, data-heavy application suitable for a DBMS course
- Model real-world entities and relationships involved in ride-hailing services
- Support concurrent ride requests and driver assignments
- Handle payments for completed and partially cancelled rides
- Enable analytical queries for operational and business insights

---

## System Description

The system operates under a central **Company Office** that manages employees and oversees daily operations. Employees are categorized into **Drivers** and **Technical Team members**, while **Managers** supervise employees and monitor system activity.

**Users** are independent entities who register on the platform to request rides. Each user and driver is associated with an **Account**, which manages authentication details and wallet balance. Accounts are modeled as weak entities since they cannot exist independently of their owners.

When a user requests a ride, a **Ride** record is created. Available drivers may accept or reject ride requests based on their availability. Once accepted, the ride is associated with a specific driver and vehicle and may either be completed or cancelled.

The system supports **Payment** processing at different stages of a ride. Payments may be generated upon successful ride completion or during cancellation, where a percentage of the estimated fare may be charged as a cancellation fee. Both successful and failed transactions are recorded.

After a ride is completed or cancelled, users can provide **Ratings** for drivers. Ratings are modeled as weak entities and are associated with rides to evaluate driver performance and improve service quality.

---

## Key Entities

- Company Office  
- Manager  
- Employee  
- Driver  
- Tech Team  
- User  
- Vehicle  
- Ride  
- Payment  
- Account (Weak Entity)  
- Rating (Weak Entity)  

---

## Business Rules

- A ride cannot exist without a user request  
- A driver cannot be assigned to more than one active ride at a time  
- Payment records may be generated for completed or cancelled rides based on platform policy  
- Accounts cannot exist without a corresponding user or driver  
- Ratings are associated with rides and cannot exist independently  

---

## Database Features

- Well-defined entity relationships with integrity constraints  
- Support for at least 15 SQL queries of varying complexity  
- Use of triggers to enforce business rules and automate actions  
- Execution of concurrent and conflicting transactions to demonstrate ACID properties  
- Indexed attributes for efficient query processing  

---

## User Interface

A basic user interface is included to demonstrate:
- Ride booking by users  
- Driver ride acceptance or rejection  
- Payment processing  
- Administrative monitoring  

The UI serves as a demonstration layer and is not the primary focus of the project.

---

## Technologies Used

- Relational Database Management System (PostgreSQL / MySQL)
- SQL for schema definition, queries, triggers and transactions
- Frontend framework for demonstration (optional)
- Any backend language with embedded SQL support

---

## Project Status

- Task 1: Business Requirements and Scope – Completed  
- Task 2: ER Diagram and Relational Model – In Progress  
- Task 3–6: Schema, Queries, Triggers, Transactions and UI – Upcoming  

---

## Notes

This project is developed as part of the **Database Management Systems** course and emphasizes proper database design, normalization, and transaction handling over UI complexity.
