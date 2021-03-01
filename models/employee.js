const db = require('../config/database');

module.exports = {
    createTableAbsence: () => {
        // Create table
        db.query(`
            CREATE TABLE IF NOT EXISTS emp_absence(
                abs_no INT NOT NULL AUTO_INCREMENT,
                start_date DATETIME, end_date DATETIME,
                break_time INT, emp_no INT,

                PRIMARY KEY (abs_no),
                INDEX (emp_no),

                FOREIGN KEY (emp_no)
                    REFERENCES employees(emp_no)
                    ON DELETE CASCADE
            )
        `, (err, result, fields) => {
            if (err) throw err;
        });
    },
    createTableLeave: () => {
        db.query(`
            CREATE TABLE IF NOT EXISTS emp_leave(
                leave_no INT NOT NULL AUTO_INCREMENT,
                start_date DATE, end_date DATE,
                type VARCHAR(10), emp_no INT,

                PRIMARY KEY (leave_no),
                INDEX (emp_no),

                FOREIGN KEY (emp_no)
                    REFERENCES employees(emp_no)
                    ON DELETE CASCADE
            )
        `, (err, result, fields) => {
            if (err) throw err;
        })
    },
}