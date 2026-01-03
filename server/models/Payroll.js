const mongoose = require('mongoose');

const PayrollSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Employee',
        required: true
    },
    period: {
        type: String,
        required: true // e.g., "Jan 2024"
    },
    daysWorked: {
        type: Number,
        required: true
    },
    dailyRate: {
        type: Number,
        required: true
    },
    basePay: {
        type: Number,
        required: true
    },
    overtimePay: {
        type: Number,
        default: 0
    },
    bonus: {
        type: Number,
        default: 0
    },
    deductions: {
        type: Number,
        default: 0
    },
    netPay: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'paid'],
        default: 'pending'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Payroll', PayrollSchema);
