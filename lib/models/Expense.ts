import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
    category: {
        type: String,
        enum: ['materials', 'equipment', 'transport', 'permits', 'other'],
        required: true
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    amount: {
        type: Number,
        required: [true, 'Please add an amount']
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    submittedBy: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    receipt: {
        type: String
    }
}, {
    timestamps: true
});

export default mongoose.models.Expense || mongoose.model('Expense', expenseSchema);
