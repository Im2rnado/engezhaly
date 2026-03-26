const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String },
    subCategory: { type: String },
    skills: [String],
    budgetRange: {
        min: { type: Number, required: true, min: 500 },
        max: { type: Number, required: true }
    },
    deadline: { type: String }, // e.g., "1 week", "Urgent"
    milestones: [{
        name: { type: String, required: true },
        price: { type: Number, required: true },
        dueDate: { type: Date }
    }],
    status: { type: String, enum: ['open', 'in_progress', 'completed', 'closed'], default: 'open' },
    proposals: [{
        freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        price: Number,
        deliveryDays: Number,
        revisions: { type: Number, default: 0 },
        message: String,
        milestones: [{
            name: { type: String, required: true },
            price: { type: Number, required: true },
            deliveryDays: { type: Number }
        }],
        status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
        workSubmission: {
            message: { type: String, default: '' },
            links: [String],
            files: [String],
            submittedAt: { type: Date, default: null },
            updatedAt: { type: Date, default: null }
        }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Job', JobSchema);
