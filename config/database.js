require('dotenv').config(`${__dirname}/../.env`);
const mysql = require('mysql');

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE
});

connection.connect((err) => {
    if (err) {
        console.error('Error', err.stack);
        return;
    }
    console.log('Connected as id', connection.threadId);
});

module.exports = connection;