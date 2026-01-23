import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
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
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
        }
    },
    toObject: {
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
        }
    }
});

export default mongoose.models.Project || mongoose.model('Project', projectSchema);
