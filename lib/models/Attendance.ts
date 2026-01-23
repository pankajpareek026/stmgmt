import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    checkIn: {
        type: String,
        required: true
    },
    checkOut: {
        type: String
    },
    hours: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['present', 'absent', 'half-day', 'overtime'],
        default: 'present'
    },
    overtime: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Compound index to prevent duplicate attendance for the same employee on the same date
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export default mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);
