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

DELIMITER ;


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

