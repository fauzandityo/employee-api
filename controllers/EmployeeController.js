const db = require('../config/database');
const employeeMod = require('../models/employee');
const services = require('../services/queue')

module.exports = {
    loadAbsence: (req, res) => {
        // const limit = parseInt(req.query.limit);
        // const offset = parseInt(req.query.offset);
        const pandemic = parseInt(req.query.pandemic);
        console.log("RECEIVE REQUEST", req.query)

        employeeMod.createTableAbsence();
        employeeMod.createTableLeave();

        const absenceQueue = services.absenceQueue;
        // db.query(`SELECT emp_no FROM employees LIMIT ?,?`, [limit, offset])
        db.query(`SELECT emp_no FROM employees`)
        .on('error', (error) => {
            throw error;
        })
        .on('result', (employee) => {
            db.pause();
            // console.log("START STREAM", employee.emp_no);
            // employeeMod.generateAbsence(employee.emp_no)
            absenceQueue.add({ empNo: employee.emp_no });
            db.resume();
        })
        .on('end', () => {
            absenceQueue.process(async job => {
                // console.log("PROCESSING DATA ABSENCE", job.data.empNo);
                return employeeMod.generateAbsence(job.data.empNo)
            });
            
        })
        
        const leaveQueue = services.leaveQueue;
        // db.query(`SELECT emp_no FROM employees LIMIT ?,?`, [limit, offset],
        db.query(`SELECT emp_no FROM employees`,
        (err, result, fields) => {
            if (err) throw err;

            let leaveEmp = [];
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
                leaveQueue.add({ empNo: employee.emp_no, empGen: employee.gender });
            })
            .on('end', () => {
                leaveQueue.process(async job => {
                    // console.log("PROCESSING DATA LEAVE", job.data);
                    return employeeMod.generateLeave(job.data)
                })
            })
        })

        const salaryQueue = services.salaryQueue;
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
        .on('error', (error) => { throw error; })
        .on('result', (employee) => {
            salaryQueue.add({
                empNo: employee.emp_no,
                workHour: Math.round(employee.working_hour),
                empBreak: Math.round(employee.break),
                empSalary: employee.emp_salary,
                startSalary: employee.start_salary,
                empTitle: employee.emp_title,
                pandemic: pandemic
            });
        })
        .on('end', () => {
            salaryQueue.process(async job => {
                console.log("PROCESSING DATA SALARY", job.data);
                return employeeMod.generateSalary(job.data)
            })
        })

        db.query(`
            SELECT
                emp_no, birth_date, first_name, last_name, gender, hire_date
            FROM employees LIMIT ?, ?
        `, [limit, offset], (err, result, fields) => {
            if (err) throw err;
            res.json({
                status: 'ok',
                data: result
            });
        });
    },
    listAge: (req, res) => {
        db.query(`
            SELECT
                (YEAR(CURRENT_DATE()) - YEAR(e.birth_date)) -
                ((DATE_FORMAT(CURRENT_DATE() , '00-%m-%d') < DATE_FORMAT(e.birth_date , '00-%m-%d'))) AS age,
                t.title
            FROM employees e
            LEFT JOIN titles t on t.emp_no = e.emp_no
        `, (err, result, fields) => {
            if (err) throw err;
            let avgAge = result.reduce((acc, val) => {
                let { age, title } = val;
                if(!acc.hasOwnProperty(title)){
                   acc[title] = {
                      'count': 0,
                      'total': 0
                   };
                };
                const accuKey = acc[title];
                accuKey['count']++;
                accuKey['total'] += age;
                accuKey['average'] = (accuKey['total'] / accuKey['count']).toFixed(2);
                return acc;
             }, {});
            res.json({
                status: 'ok',
                data: avgAge
            })
        })
    },
    listSalary: (req, res) => {
        db.query(`
            SELECT s.salary, t.title
            FROM salaries s
            LEFT JOIN titles t on t.emp_no = s.emp_no
        `, (err, result, fields) => {
            if (err) throw err;
            let avgAge = result.reduce((acc, val) => {
                let { salary, title } = val;
                if(!acc.hasOwnProperty(title)){
                   acc[title] = {
                      'count': 0,
                      'total': 0
                   };
                };
                const accuKey = acc[title];
                accuKey['count']++;
                accuKey['total'] += salary;
                accuKey['average'] = (accuKey['total'] / accuKey['count']).toFixed(2);
                return acc;
             }, {});
            res.json({
                status: 'ok',
                data: avgAge
            })
        })
    }
}