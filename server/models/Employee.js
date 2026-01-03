const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true
    },
    role: {
        type: String,
        required: [true, 'Please add a role']
    },
    phone: {
        type: String,
        required: [true, 'Please add a phone number']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    dailyRate: {
        type: Number,
        required: [true, 'Please add a daily rate']
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'on-leave'],
        default: 'active'
    },
    joinDate: {
        type: Date,
        default: Date.now
    },
    skills: {
        type: [String],
        default: []
    },
    projectId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Project',
        required: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Employee', EmployeeSchema);
