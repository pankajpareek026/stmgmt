const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Routes
const projects = require('./routes/projects');
const employees = require('./routes/employees');
const attendance = require('./routes/attendance');
const expenses = require('./routes/expenses');
const payroll = require('./routes/payroll');

app.use('/api/projects', projects);
app.use('/api/employees', employees);
app.use('/api/attendance', attendance);
app.use('/api/expenses', expenses);
app.use('/api/payroll', payroll);

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Site Management API' });
});

app.use(errorHandler);

// Port configuration
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT} `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message} `);
    // Close server & exit process
    server.close(() => process.exit(1));
});
