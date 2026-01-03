const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a project name'],
        unique: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'on-hold', 'planning'],
        default: 'planning'
    },
    location: {
        type: String,
        required: [true, 'Please add a location']
    },
    startDate: {
        type: Date,
        required: [true, 'Please add a start date']
    },
    endDate: {
        type: Date
    },
    budget: {
        type: Number,
        required: [true, 'Please add a budget']
    },
    spent: {
        type: Number,
        default: 0
    },
    completion: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    manager: {
        type: String,
        required: [true, 'Please add a manager name']
    },
    workersCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Project', ProjectSchema);
