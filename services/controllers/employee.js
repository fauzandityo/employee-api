const db = require('../../config/database');
const moment = require('moment');
const helper = require('../../libs/helper');

module.exports = {
    generateAbsence: (proData) => {
        let limit = parseInt(proData.limit);
        let offset = parseInt(proData.offset);
        return new Promise((resolve, reject) => {
            console.log("PROCESSING DATA ABSENCE");
            // db.query(`SELECT emp_no FROM employees`)
            db.query(`SELECT emp_no FROM employees LIMIT ?,?`, [limit, offset])
            .on('error', (error) => {
                reject(error);
            })
            .on('result', (employee) => {
                db.pause();
                console.log("START STREAM", employee.emp_no);
                let dataToStore = [];
                // Preparing date range (now - 3 month) <= now
                let now = moment();
                let deltaMonth = moment().subtract(3, 'months');
                // Generate absence
                console.log("PREPARE TO GENERATE ABSENCE", deltaMonth <= now)
                console.log(now, deltaMonth)
                while(deltaMonth <= now){
                    console.log("START GENERATE ABSENCE")
                    dataToStore.push([
                        helper.randomTime(deltaMonth, 8, 11),
                        helper.randomTime(deltaMonth, 17, 18),
                        0 + Math.random() * (90 - 0),
                        employee.emp_no
                    ]);
                    
                    deltaMonth = deltaMonth.add(1, 'day');
                }
                console.log("PREPARE TO STORE DATA", dataToStore)
                // Insert absence
                db.query(`
                    INSERT INTO emp_absence
                        (start_date, end_date, break_time, emp_no)
                    VALUES ?
                `, [dataToStore],
                (err, result, fields) => {
                    if (err) reject(err);
                    resolve(result);
                })
                db.resume();
            })
        })
    },
    generateLeave: (proData) => {
        let limit = parseInt(proData.limit);
        let offset = parseInt(proData.offset);
        return new Promise((resolve, reject) => {
            // Prepare to generate leave
            console.log("PROCESSING DATA LEAVE");
            // db.query(`SELECT emp_no FROM employees`,
            db.query(`SELECT emp_no FROM employees LIMIT ?,?`, [limit, offset],
            (err, result, fields) => {
                if (err) throw err;
    
                let leaveEmp = [];
                let dataToStore = [];
                let dataToRemove = [];
                result.forEach(res => {
                    leaveEmp.push(res.emp_no)
                });
            
                leaveEmp = leaveEmp.filter(() => Math.round(Math.random()));
                db.query(`
                    SELECT emp_no, gender FROM employees
                    WHERE emp_no IN (${leaveEmp})
                `)
                .on('error', (error) => { throw error; })
                .on('result', (employee) => {
                    // Preparing date range (now - 3 month) <= now
                    let now = moment();
                    let deltaMonth = moment().subtract(3, 'months');
                    let dateRange = [];
                    // console.log("PREPARED LEAVE DATE RANGE", deltaMonth <= now)
                    // console.log(deltaMonth, now)
                    while (deltaMonth <= now) {
                        dateRange.push(deltaMonth.format('YYYY-MM-DD'));
                        deltaMonth = deltaMonth.add(1, 'day');
                    }
                    // console.log("DATE RANGE CREATED", dateRange)
                    // Generate random date in range
                    let start = dateRange[Math.floor(Math.random()*dateRange.length)];
                    let end = dateRange[Math.floor(Math.random()*dateRange.length)];
                    let type = ['annual', 'sick', 'maternity', 'unpaid'];
                    // - Check condition -
                    // Check gender
                    if (employee.gender !== 'F') {
                        type.pop('maternity');
                    }
                    type = type[Math.floor(Math.random()*type.length)];
                    // Check type of leave
                    if (type === 'annual') {
                        end = start;
                    }
                    dataToStore.push([ start, end, type, employee.emp_no ]);
                    if (type === 'unpaid') {
                        dataToRemove = [ employee.emp_no, `${start}%`, `${end}%` ];
                    }
                    if (dataToRemove.length > 0) {
                        db.query(`
                            DELETE FROM emp_absence
                            WHERE emp_no = ?
                                AND (start_date LIKE ? OR start_date LIKE ?)
                        `, dataToRemove,
                        (err, result, field) => {
                            if (err) reject(err)
                            resolve(result);
                        })
                    }
                })
                .on('end', () => {
                    // Store data
                    db.query(`
                        INSERT INTO emp_leave(start_date, end_date, type, emp_no)
                        VALUES ?
                    `, [dataToStore],
                    (err, res, field) => {
                        if (err) reject(err)
                        resolve(res);
                    })
                })
            });
        })
    },
    generateSalary: (obj) => {
        return new Promise((resolve, reject) => {
            db.query(`
                SELECT ea.emp_no,
                    AVG(DATE_FORMAT(ea.end_date, '%T') - DATE_FORMAT(ea.start_date, '%T')) AS working_hour,
                    AVG(ea.break_time) AS break, MAX(s.salary) AS emp_salary,
                    (
                        SELECT title FROM titles t2
                        WHERE t2.emp_no = ea.emp_no
                        ORDER BY t2.from_date DESC
                        LIMIT 1
                    ) AS emp_title,
                    (
                        SELECT s2.from_date FROM salaries s2
                        WHERE s2.emp_no = ea.emp_no
                        ORDER BY s2.from_date DESC
                        LIMIT 1
                    ) AS start_salary
                FROM emp_absence ea
                LEFT JOIN salaries s
                    ON s.emp_no = ea.emp_no
                GROUP BY ea.emp_no
            `)
            .on('error', (error) => { reject(error) })
            .on('result', (employee) => {
                // Preparing data needed
                let pandemic = parseInt(obj.pandemic);
                let empNo = employee.emp_no;
                let workHour = Math.round(employee.working_hour);
                let empBreak = Math.round(employee.break);
                let empSalary = employee.emp_salary;
                let startSalary = employee.start_salary;
                let empTitle = employee.emp_title;
                let incPercent = 0;
                let incTotal = 0;
                let inc = 'percent';
                let finSalary = 0;
                let now = moment().format('YYYY-MM-DD');
                // Check work hour
                if (workHour > 10) {
                    incPercent += 5;
                }else if (workHour < 8) {
                    incPercent += 2.5;
                }else if (workHour < 7) {
                    incPercent += 0.5;
                }
                // Check break time
                if (empBreak > 60) {
                    incPercent -= 1;
                }else if (empBreak < 60) {
                    incPercent += 1.5;
                }
                // Check title
                if (empTitle.toLowerCase() === 'staff') {
                    incPercent += 1;
                }else if (empTitle.toLowerCase() === 'senior engineer') {
                    incPercent += 3;
                }else if (empTitle.toLowerCase() === 'engineer') {
                    incPercent += 2;
                }else if (empTitle.toLowerCase() === 'assistant engineer') {
                    incPercent += 2.5;
                }else if (empTitle.toLowerCase() === 'technical leader') {
                    incPercent += 4;
                }else {
                    inc = 'fix'
                }
                // Check increment type
                if (inc === 'fix') {
                    incTotal = 1000
                }else {
                    incTotal = (empSalary * incPercent) / 100;
                }
                // Check pandemic
                if (pandemic === true) {
                    let incPand = (incTotal * 1) / 100;
                    incTotal = incTotal - incPand;
                }
                // Check final increment
                if (incTotal > 2000) {
                    incTotal = 2000
                }else if (incTotal < 0) {
                    incTotal = 0;
                }
                console.log("GET FINAL INCREMENT", incTotal)
        
                finSalary = empSalary + incTotal;
                console.log("GET FINAL SALARY", finSalary)
        
                // Prepare data
                let dataToUpdate = [ now, empNo, moment(startSalary).format('YYYY-MM-DD') ];
                let dataToStore = [ empNo, parseInt(finSalary), now, '9999-01-01' ]
                db.query(`
                    UPDATE salaries
                    SET to_date = ?
                    WHERE emp_no = ? AND from_date = ?
                `, dataToUpdate,
                (err, res, field) => {
                    if (err) reject(err);
                    console.log("PREPARE TO INSERT SALARY", dataToStore)
                    db.query(`
                        INSERT INTO salaries (emp_no, salary, from_date, to_date)
                        VALUES (?, ?, ?, ?)
                    `, dataToStore,
                    (error, result, fields) => {
                        if (error) reject(error)
                        resolve(result);
                    })
                })
            })
        })
    }
}