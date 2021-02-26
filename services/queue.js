require('dotenv').config(`${__dirname}/../.env`);
const Queue = require('bull')

let redisOpt = {
    host: process.env.RD_HOST,
    port: process.env.RD_PORT
}
module.exports = {
    absenceQueue: new Queue('generate-absence', { redis: redisOpt }),
    leaveQueue: new Queue('generate-leave', { redis: redisOpt }),
    salaryQueue: new Queue('generate-salary', { redis: redisOpt }),
}