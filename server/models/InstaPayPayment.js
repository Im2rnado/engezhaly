const mongoose = require('mongoose');

const InstaPayPaymentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amountCents: { type: Number, required: true },
    amountEGP: { type: Number, required: true },
    meta: {
        type: { type: String, enum: ['job_proposal', 'project_order', 'custom_offer', 'consultation'], required: true },
        jobId: mongoose.Schema.Types.ObjectId,
        proposalId: String,
        orderId: mongoose.Schema.Types.ObjectId,
        offerId: mongoose.Schema.Types.ObjectId,
        conversationId: String,
        durationMinutes: Number,
        meetingDate: String,
        meetingTime: String
    },
    screenshotUrl: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'denied'], default: 'pending' },
    adminReviewedAt: { type: Date },
    adminNotes: { type: String },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

InstaPayPaymentSchema.index({ userId: 1, status: 1 });
InstaPayPaymentSchema.index({ status: 1 });

module.exports = mongoose.model('InstaPayPayment', InstaPayPaymentSchema);
