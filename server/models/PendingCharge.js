/**
 * Links a payment intent to a business action.
 * When user completes Paymob payment, webhook uses this to fulfill the charge.
 */
const mongoose = require('mongoose');

const PendingChargeSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amountCents: { type: Number, required: true },
    description: { type: String },
    status: { type: String, enum: ['pending', 'completed', 'failed', 'expired'], default: 'pending' },
    paymobOrderId: { type: String },
    paymobTransactionId: { type: String },
    // Business context
    meta: {
        type: { type: String, enum: ['job_proposal', 'project_order', 'custom_offer', 'consultation', 'add_card'] },
        jobId: mongoose.Schema.Types.ObjectId,
        proposalId: String,
        orderId: mongoose.Schema.Types.ObjectId,
        offerId: mongoose.Schema.Types.ObjectId,
        conversationId: String
    },
    createdAt: { type: Date, default: Date.now },
    completedAt: { type: Date }
}, { timestamps: true });

PendingChargeSchema.index({ userId: 1, status: 1 });
PendingChargeSchema.index({ paymobOrderId: 1 });

module.exports = mongoose.model('PendingCharge', PendingChargeSchema);
