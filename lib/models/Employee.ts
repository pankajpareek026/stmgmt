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
        required: false,
        validate: {
            validator: function (v: any) {
                return !v || mongoose.Types.ObjectId.isValid(v);
            },
            message: 'Invalid projectId'
        }
    },
    projectIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        validate: {
            validator: function (v: any) {
                return mongoose.Types.ObjectId.isValid(v);
            },
            message: 'Invalid projectId in projectIds array'
        }
    }]
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
    },
    strictPopulate: false
});

// Pre-save hook to clean up projectIds
employeeSchema.pre('save', function () {
    try {
        if (this.isModified('projectIds') && this.projectIds && Array.isArray(this.projectIds)) {
            this.projectIds = this.projectIds.filter((id: any) => {
                if (!id) return false;
                // If it's a string, check if it's a valid ObjectId string
                if (typeof id === 'string') {
                    return mongoose.Types.ObjectId.isValid(id) && !id.includes('\n') && !id.includes('{');
                }
                // If it's already an ObjectId instance, it's valid
                return mongoose.Types.ObjectId.isValid(id as any);
            });
        }
    } catch (err) {
        console.error('Error in pre-save hook:', err);
        throw err;
    }
});

export default mongoose.models.Employee || mongoose.model('Employee', employeeSchema);
