const db = require('../config/database');
const employeeMod = require('../models/employee');
const queues = require('../config/queues')

module.exports = {
    loadAbsence: (req, res) => {
        const pandemic = parseInt(req.query.pandemic);
        console.log("RECEIVE REQUEST", req.query)

        employeeMod.createTableAbsence();
        employeeMod.createTableLeave();

        // Preparing queue
        const absenceQueue = queues.absenceQueue;
        const leaveQueue = queues.leaveQueue;
        const salaryQueue = queues.salaryQueue;
        
        // Add job to queue
        absenceQueue.add('generate-absence', req.query);
        leaveQueue.add('generate-leave', req.query);
        salaryQueue.add('generate-salary', req.query);

        res.json({
            status: 'ok',
            message: 'Processing your request!'
        })
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