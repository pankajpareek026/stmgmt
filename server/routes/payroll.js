const express = require('express');
const {
    getPayrolls,
    getPayroll,
    createPayroll,
    updatePayroll,
    deletePayroll
} = require('../controllers/payroll');

const router = express.Router();

router
    .route('/')
    .get(getPayrolls)
    .post(createPayroll);

router
    .route('/:id')
    .get(getPayroll)
    .put(updatePayroll)
    .delete(deletePayroll);

module.exports = router;
