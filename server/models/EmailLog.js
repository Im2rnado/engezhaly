const mongoose = require('mongoose');

const EmailLogSchema = new mongoose.Schema({
    recipient: { type: String, required: true },
    subject: { type: String, required: true },
    templateType: {
        type: String,
        enum: [
            'verification',
            'job_application',
            'offer_purchased',
            'offline_chat',
            'payment_receipt_freelancer',
            'payment_receipt_client',
            'deposit_receipt',
            'password_reset',
            'freelancer_approved',
            'dispute_resolved'
        ],
        required: true
    },
    body: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
    status: { type: String, enum: ['sent', 'failed'], default: 'sent' },
    sentAt: { type: Date, default: Date.now },
    error: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('EmailLog', EmailLogSchema);
