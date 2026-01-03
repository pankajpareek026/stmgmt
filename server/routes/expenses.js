const express = require('express');
const {
    getExpenses,
    getExpense,
    addExpense,
    updateExpense,
    deleteExpense
} = require('../controllers/expenses');

const router = express.Router();

router
    .route('/')
    .get(getExpenses)
    .post(addExpense);

router
    .route('/:id')
    .get(getExpense)
    .put(updateExpense)
    .delete(deleteExpense);

module.exports = router;
