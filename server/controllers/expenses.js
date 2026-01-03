const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Expense = require('../models/Expense');

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Public
exports.getExpenses = asyncHandler(async (req, res, next) => {
    const expenses = await Expense.find().populate('projectId', 'name');
    res.status(200).json({
        success: true,
        count: expenses.length,
        data: expenses
    });
});

// @desc    Get single expense
// @route   GET /api/expenses/:id
// @access  Public
exports.getExpense = asyncHandler(async (req, res, next) => {
    const expense = await Expense.findById(req.params.id).populate('projectId', 'name');

    if (!expense) {
        return next(
            new ErrorResponse(`Expense not found with id of ${req.params.id}`, 404)
        );
    }

    res.status(200).json({
        success: true,
        data: expense
    });
});

// @desc    Add expense
// @route   POST /api/expenses
// @access  Private
exports.addExpense = asyncHandler(async (req, res, next) => {
    const expense = await Expense.create(req.body);
    res.status(201).json({
        success: true,
        data: expense
    });
});

// @desc    Update expense status
// @route   PUT /api/expenses/:id
// @access  Private
exports.updateExpense = asyncHandler(async (req, res, next) => {
    let expense = await Expense.findById(req.params.id);

    if (!expense) {
        return next(
            new ErrorResponse(`Expense not found with id of ${req.params.id}`, 404)
        );
    }

    expense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: expense
    });
});

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
exports.deleteExpense = asyncHandler(async (req, res, next) => {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
        return next(
            new ErrorResponse(`Expense not found with id of ${req.params.id}`, 404)
        );
    }

    await expense.deleteOne();

    res.status(200).json({
        success: true,
        data: {}
    });
});
