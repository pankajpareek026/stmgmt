const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Attendance = require('../models/Attendance');

// @desc    Get all attendance records
// @route   GET /api/attendance
// @access  Public
exports.getAttendances = asyncHandler(async (req, res, next) => {
    const attendances = await Attendance.find()
        .populate('employeeId', 'name role')
        .populate('projectId', 'name');

    res.status(200).json({
        success: true,
        count: attendances.length,
        data: attendances
    });
});

// @desc    Get single attendance record
// @route   GET /api/attendance/:id
// @access  Public
exports.getAttendance = asyncHandler(async (req, res, next) => {
    const attendance = await Attendance.findById(req.params.id)
        .populate('employeeId', 'name role')
        .populate('projectId', 'name');

    if (!attendance) {
        return next(
            new ErrorResponse(`Attendance record not found with id of ${req.params.id}`, 404)
        );
    }

    res.status(200).json({
        success: true,
        data: attendance
    });
});

// @desc    Add attendance record
// @route   POST /api/attendance
// @access  Private
exports.addAttendance = asyncHandler(async (req, res, next) => {
    const attendance = await Attendance.create(req.body);
    res.status(201).json({
        success: true,
        data: attendance
    });
});

// @desc    Update attendance record
// @route   PUT /api/attendance/:id
// @access  Private
exports.updateAttendance = asyncHandler(async (req, res, next) => {
    let attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
        return next(
            new ErrorResponse(`Attendance record not found with id of ${req.params.id}`, 404)
        );
    }

    attendance = await Attendance.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: attendance
    });
});

// @desc    Delete attendance record
// @route   DELETE /api/attendance/:id
// @access  Private
exports.deleteAttendance = asyncHandler(async (req, res, next) => {
    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
        return next(
            new ErrorResponse(`Attendance record not found with id of ${req.params.id}`, 404)
        );
    }

    await attendance.deleteOne();

    res.status(200).json({
        success: true,
        data: {}
    });
});
