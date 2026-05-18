CREATE DATABASE geo_attendance_tracker2;

USE geo_attendance_tracker2;
CREATE TABLE employees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    department VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE office_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    office_name VARCHAR(100),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    radius_meters INT,
    office_start_time TIME,
    late_threshold_minutes INT
);
CREATE TABLE attendance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT,
    attendance_date DATE,
    check_in_time DATETIME,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    distance_from_office DOUBLE,
    status VARCHAR(20),

    FOREIGN KEY (employee_id)
    REFERENCES employees(id)
);

CREATE TABLE attendance_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,

    user_id INT NOT NULL,

    event_type ENUM('CHECK_IN', 'CHECK_OUT') NOT NULL,

    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,

    lat DECIMAL(10,8) NOT NULL,

    lng DECIMAL(11,8) NOT NULL,

    distance_office DOUBLE,

    accepted BOOLEAN DEFAULT FALSE,

    reason VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

USE geo_attendance_tracker2;
INSERT INTO attendance_logs (
    user_id,
    event_type,
    lat,
    lng,
    distance_office,
    accepted,
    reason
)
VALUES (1,'CHECK_IN',12.9716,77.5946,25.5,TRUE,'Inside office radius'),
(2,'CHECK_IN',12.9789,78.5946,25.5,TRUE,'Inside office radius'),
(3,'CHECK_IN',13.9789,79.5946,29.5,false,'outside office radius');
SELECT * FROM attendance_logs;

INSERT INTO office_settings (
    office_name,
    latitude,
    longitude,
    radius_meters,
    office_start_time,
    late_threshold_minutes
)
VALUES ('GEA Main Office',12.9716,77.5946,200,'09:00:00',15),
('GEA Second Office',12.9716,77.5946,200,'07:01:00',14),
('GEA Third  Office',12.9716,77.5946,200,'08:00:00',13),
('GEA Fourth Office',12.9716,77.5946,200,'10:00:00',12);
SELECT * FROM office_settings ;

INSERT INTO employees (
    employee_name,
    email,
    department
)
VALUES
('Rahul Sharma', 'rahul12@gea.com', 'IT'),
('Ananya Shetty', 'ananya@gea.com', 'HR'),
('ganesh', 'ganesh@gea.com', 'IT'),
('manisha Shetty', 'manisha@gea.com', 'HR');
SELECT * FROM employees;



DELIMITER //

CREATE FUNCTION calculate_distance(
    lat1 DOUBLE,
    lon1 DOUBLE,
    lat2 DOUBLE,
    lon2 DOUBLE
)
RETURNS DOUBLE
DETERMINISTIC
BEGIN

    DECLARE distance DOUBLE;

    SET distance = (
        6371000 * ACOS(
            COS(RADIANS(lat1))
            * COS(RADIANS(lat2))
            * COS(RADIANS(lon2) - RADIANS(lon1))
            + SIN(RADIANS(lat1))
            * SIN(RADIANS(lat2))
        )
    );

    RETURN distance;

END //

DELIMITER ;

DELIMITER //

CREATE PROCEDURE check_in_employee(
    IN p_employee_id INT,
    IN p_lat DECIMAL(10,8),
    IN p_lng DECIMAL(11,8)
)
BEGIN

    DECLARE office_lat DECIMAL(10,8);
    DECLARE office_lng DECIMAL(11,8);
    DECLARE allowed_radius INT;
    DECLARE office_time TIME;
    DECLARE late_limit INT;

    DECLARE distance_m DOUBLE;
    DECLARE attendance_status VARCHAR(20);

    -- Get office settings
    SELECT latitude,
           longitude,
           radius_meters,
           office_start_time,
           late_threshold_minutes
    INTO office_lat,
         office_lng,
         allowed_radius,
         office_time,
         late_limit
    FROM office_settings
    LIMIT 1;

  #Calculate distance
    SET distance_m = calculate_distance(
        office_lat,
        office_lng,
        p_lat,
        p_lng
    );

#Check location
    IF distance_m <= allowed_radius THEN

        -- Check late attendance
        IF CURRENT_TIME() >
           ADDTIME(
               office_time,
               SEC_TO_TIME(late_limit * 60)
           )
        THEN
            SET attendance_status = 'Late';
        ELSE
            SET attendance_status = 'Present';
        END IF;

        -- Insert attendance
        INSERT INTO attendance (
            employee_id,
            attendance_date,
            check_in_time,
            latitude,
            longitude,
            distance_from_office,
            status
        )
        VALUES (
            p_employee_id,
            CURDATE(),
            NOW(),
            p_lat,
            p_lng,
            distance_m,
            attendance_status
        );

        SELECT
            'Check-in Successful' AS message,
            attendance_status AS status,
            ROUND(distance_m, 2) AS distance_in_meters;

    ELSE

        SELECT
            'Outside Office Radius' AS message,
            ROUND(distance_m, 2) AS distance_in_meters;

    END IF;

END //

DELIMITER ;



CALL check_in_employee(
    1,
    12.9717,
    77.5945
);

#Query to View Employee Attendance
SELECT
    a.id,
    e.employee_name,
    a.attendance_date,
    a.check_in_time,
    a.status,
    ROUND(a.distance_from_office, 2) AS distance_m
FROM attendance a
JOIN employees e
ON a.employee_id = e.id; 




#Query to Find Late Employees
SELECT
    e.employee_name,
    a.check_in_time,
    a.status
FROM attendance a
JOIN employees e
ON a.employee_id = e.id
WHERE a.status = 'Late';


# Query to Find Employees Outside Office Radius
SELECT
    user_id,
    lat,
    lng,
    distance_office,
    reason
FROM attendance_logs
WHERE accepted = True;

#10. Query to Count Total Attendance
SELECT COUNT(*) AS total_attendance
FROM attendance;

# Query to Count Present Employees
SELECT COUNT(*) AS total_present
FROM attendance
WHERE status = 'Present';

# Query to Count Late Employees
SELECT COUNT(*) AS total_late
FROM attendance
WHERE status = 'Late';

# Query for Daily Attendance Report
SELECT
    attendance_date,
    COUNT(*) AS total_employees,
    SUM(status = 'Present') AS present_count,
    SUM(status = 'Late') AS late_count
FROM attendance
GROUP BY attendance_date;

#Query to Get Nearest Employees
SELECT
    employee_id,
    ROUND(distance_from_office,2) AS distance_m
FROM attendance
ORDER BY distance_from_office ASC;


#Query to Check Today's Attendance
SELECT
    e.employee_name,
    a.status,
    a.check_in_time
FROM attendance a
JOIN employees e
ON a.employee_id = e.id
WHERE a.attendance_date = CURDATE();

#Distance Function Test
SELECT calculate_distance(
    12.9716,
    77.5946,
    12.9717,
    77.5945
) AS distance_meters;

#Procedure Call Example
CALL check_in_employee(
    1,
    12.9717,
    77.5945
);
