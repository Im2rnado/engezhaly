const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    skills: [String],
    budgetRange: {
        min: { type: Number, required: true, min: 500 },
        max: { type: Number, required: true }
    },
    deadline: { type: String }, // e.g., "1 week", "Urgent"
    status: { type: String, enum: ['open', 'in_progress', 'completed', 'closed'], default: 'open' },
    proposals: [{
        freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        price: Number,
        deliveryDays: Number,
        message: String,
        status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Job', JobSchema);
