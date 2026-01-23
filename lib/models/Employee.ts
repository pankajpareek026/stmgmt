import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
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
        required: false
    },
    email: {
        type: String,
        required: false,
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
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: false
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

export default mongoose.models.Employee || mongoose.model('Employee', employeeSchema);
