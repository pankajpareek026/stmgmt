const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// Load models
const Project = require('./models/Project');
const Employee = require('./models/Employee');
const Attendance = require('./models/Attendance');
const Payroll = require('./models/Payroll');
const Expense = require('./models/Expense');

// Connect to DB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/stmgmt');

// Data to seed (Simplified for example, ideally read from JSON files)
const projects = [
    {
        name: "Downtown Office Complex",
        status: "active",
        location: "Downtown, City Center",
        startDate: "2024-01-15",
        budget: 2500000,
        spent: 1650000,
        completion: 65,
        manager: "John Smith",
        workersCount: 24
    },
    {
        name: "Residential Tower - Phase 2",
        status: "active",
        location: "Westside District",
        startDate: "2024-02-01",
        budget: 3200000,
        spent: 1280000,
        completion: 40,
        manager: "Sarah Johnson",
        workersCount: 32
    }
];

// Import into DB
const importData = async () => {
    try {
        await Project.create(projects);
        console.log('Data Imported...');
        process.exit();
    } catch (err) {
        console.error(err);
    }
};

// Delete data
const deleteData = async () => {
    try {
        await Project.deleteMany();
        await Employee.deleteMany();
        await Attendance.deleteMany();
        await Payroll.deleteMany();
        await Expense.deleteMany();
        console.log('Data Destroyed...');
        process.exit();
    } catch (err) {
        console.error(err);
    }
};

if (process.argv[2] === '-i') {
    importData();
} else if (process.argv[2] === '-d') {
    deleteData();
}
