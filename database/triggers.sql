-- Triggers

DELIMITER $$

CREATE TRIGGER after_ride_complete
AFTER UPDATE ON RIDE
FOR EACH ROW
BEGIN
    IF NEW.ride_status = 'completed' THEN
        UPDATE DRIVER
        SET availability_status = 'available'
        WHERE driver_id IN (
            SELECT driver_id FROM RATING WHERE ride_id = NEW.ride_id
        );
    END IF;
END$$

DELIMITER ;


DELIMITER $$

CREATE TRIGGER after_payment_success
AFTER INSERT ON PAYMENT
FOR EACH ROW
BEGIN
    IF NEW.payment_status = 'success' THEN
        UPDATE ACCOUNT
        SET balance = balance - NEW.amount
        WHERE user_id IN (
            SELECT user_id FROM RATING WHERE ride_id = NEW.ride_id
        );
    END IF;
END$$

DELIMITER ;

