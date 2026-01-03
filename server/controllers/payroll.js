const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Payroll = require('../models/Payroll');

// @desc    Get all payroll records
// @route   GET /api/payroll
// @access  Public
exports.getPayrolls = asyncHandler(async (req, res, next) => {
    const payrolls = await Payroll.find().populate('employeeId', 'name role');
    res.status(200).json({
        success: true,
        count: payrolls.length,
        data: payrolls
    });
});

// @desc    Get single payroll record
// @route   GET /api/payroll/:id
// @access  Public
exports.getPayroll = asyncHandler(async (req, res, next) => {
    const payroll = await Payroll.findById(req.params.id).populate('employeeId', 'name role');

    if (!payroll) {
        return next(
            new ErrorResponse(`Payroll record not found with id of ${req.params.id}`, 404)
        );
    }

    res.status(200).json({
        success: true,
        data: payroll
    });
});

// @desc    Create payroll record
// @route   POST /api/payroll
// @access  Private
exports.createPayroll = asyncHandler(async (req, res, next) => {
    const payroll = await Payroll.create(req.body);
    res.status(201).json({
        success: true,
        data: payroll
    });
});

// @desc    Update payroll status
// @route   PUT /api/payroll/:id
// @access  Private
exports.updatePayroll = asyncHandler(async (req, res, next) => {
    let payroll = await Payroll.findById(req.params.id);

    if (!payroll) {
        return next(
            new ErrorResponse(`Payroll record not found with id of ${req.params.id}`, 404)
        );
    }

    payroll = await Payroll.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: payroll
    });
});

// @desc    Delete payroll record
// @route   DELETE /api/payroll/:id
// @access  Private
exports.deletePayroll = asyncHandler(async (req, res, next) => {
    const payroll = await Payroll.findById(req.params.id);

    if (!payroll) {
        return next(
            new ErrorResponse(`Payroll record not found with id of ${req.params.id}`, 404)
        );
    }

    await payroll.deleteOne();

    res.status(200).json({
        success: true,
        data: {}
    });
});
