require('dotenv').config(`${__dirname}/../.env`);
const bull = require('bull');
const employee = require('./controllers/employee');
// const queues = require('../config/queues');

const redisOpt = {
    host: process.env.RD_HOST,
    port: process.env.RD_PORT
}

console.log("STARTING QUEUE")

const generateAbsence = new bull('generate-absence', { redis: redisOpt });
const generateLeave = new bull('generate-leave', { redis: redisOpt });
const generateSalary = new bull('generate-salary', { redis: redisOpt });

generateAbsence.process('generate-absence', async job => {
    return employee.generateAbsence(job.data);
});

generateLeave.process('generate-leave', async job => {
    return employee.generateLeave(job.data);
});

generateSalary.process('generate-salary', async job => {
    return employee.generateSalary(job.data)
})