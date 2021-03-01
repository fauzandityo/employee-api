require('dotenv').config(`${__dirname}/../.env`);
const bull = require('bull');
const employee = require('./controllers/employee');
// const queues = require('../config/queues');

const redisOpt = {
    host: process.env.RD_HOST,
    port: process.env.RD_PORT
}

console.log("STARTING QUEUE")

// const generateAbsence = queues.absenceQueue;
// const generateLeave = queues.leaveQueue;
// const generateSalary = queues.salaryQueue;
const generateAbsence = new bull('generate-absence', { redis: redisOpt });
const generateLeave = new bull('generate-leave', { redis: redisOpt });
const generateSalary = new bull('generate-salary', { redis: redisOpt });

generateAbsence.process(async job => {
    console.log("PROCESSING DATA ABSENCE", job.data.empNo);
    return employee.generateAbsence(job.data.empNo);
});

generateLeave.process(async job => {
    console.log("PROCESSING DATA LEAVE", job.data);
    return employee.generateLeave(job.data)
});

generateSalary.process(async job => {
    console.log("PROCESSING DATA SALARY", job.data);
    return employee.generateSalary(job.data)
})