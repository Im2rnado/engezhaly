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
            'payment_receipt_freelancer', // Wallet payment
            'payment_receipt_client', // Wallet payment
            'deposit_receipt', // Wallet deposit
            'password_reset',
            'freelancer_approved',
            'dispute_resolved',
            'order_approved',
            'order_denied',
            'work_submitted',
            'delivery_approved',
            'job_work_approved',
            'payment_confirmed',
            'contact_form'
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
