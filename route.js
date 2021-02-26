const express = require('express');
const router = express.Router();

const EmployeeController = require('./controllers/EmployeeController');

// Employee
router.get('/employee', EmployeeController.loadAbsence);
router.get('/employee/age', EmployeeController.listAge);
router.get('/employee/salary', EmployeeController.listSalary);

module.exports = router;