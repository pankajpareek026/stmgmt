import mongoose from 'mongoose';

const payrollSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    month: {
        type: Number,
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    period: {
        type: String,
        required: true // e.g., "January 2026"
    },
    payments: [{
        amount: {
            type: Number,
            required: true
        },
        paymentDate: {
            type: Date,
            required: true,
            default: Date.now
        },
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: false
        },
        description: {
            type: String,
            default: ""
        }
    }],
    totalPaid: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'paid'],
        default: 'paid'
    }
}, {
    timestamps: true
});

// Create a compound index for efficient lookups
payrollSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.models.Payroll || mongoose.model('Payroll', payrollSchema);
