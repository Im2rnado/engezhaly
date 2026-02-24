const mongoose = require('mongoose');

const ConsultationPaymentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    amount: { type: Number, required: true, default: 100 },
    used: { type: Boolean, default: false },
    meetingLink: { type: String },
    meetingDate: { type: Date },
    meetingScheduledAt: { type: Date },
}, { timestamps: true });

// One unused payment per user per conversation
ConsultationPaymentSchema.index({ userId: 1, conversationId: 1, used: 1 });

module.exports = mongoose.model('ConsultationPayment', ConsultationPaymentSchema);
