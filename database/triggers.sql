-- Triggers

DROP TRIGGER IF EXISTS after_ride_complete;

DELIMITER $$

CREATE TRIGGER after_ride_complete
AFTER UPDATE ON RIDE
FOR EACH ROW
BEGIN
    IF NEW.ride_status IN ('completed','cancelled') THEN
        UPDATE DRIVER
        SET availability_status = 'available'
        WHERE driver_id = NEW.driver_id;
    END IF;
END$$

DELIMITER $$

DROP TRIGGER IF EXISTS create_payment_after_ride;

DELIMITER $$

CREATE TRIGGER create_payment_after_ride
AFTER INSERT ON RIDE
FOR EACH ROW
BEGIN
    INSERT INTO PAYMENT (ride_id, amount, payment_status)
    VALUES (NEW.ride_id, NEW.fare_amt, 'pending');
END$$

DELIMITER ;
