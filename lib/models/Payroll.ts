import mongoose from 'mongoose';

const payrollSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: false
    },
    period: {
        type: String,
        required: false
    },
    paymentDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    paymentType: {
        type: String,
        enum: ['salary', 'advance', 'adhoc'],
        default: 'adhoc'
    },
    daysWorked: {
        type: Number,
        required: false,
        default: 0
    },
    dailyRate: {
        type: Number,
        required: false,
        default: 0
    },
    basePay: {
        type: Number,
        required: false,
        default: 0
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
    netPay: { // acts as total Amount
        type: Number,
        required: true
    },
    description: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'paid'],
        default: 'pending'
    }
}, {
    timestamps: true
});

export default mongoose.models.Payroll || mongoose.model('Payroll', payrollSchema);
