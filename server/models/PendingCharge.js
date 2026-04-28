/**
 * Links a payment intent to a business action.
 * When the user completes Geidea payment, the webhook uses this to fulfill the charge.
 */
const mongoose = require('mongoose');

const PendingChargeSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amountCents: { type: Number, required: true },
    description: { type: String },
    status: { type: String, enum: ['pending', 'completed', 'failed', 'expired'], default: 'pending' },
    // Geidea session ID (= merchantReferenceId sent to Geidea = PendingCharge._id.toString())
    geideaSessionId: { type: String },
    // Geidea order ID returned in the callback
    geideaOrderId: { type: String },
    // Business context
    meta: {
        type: { type: String, enum: ['job_proposal', 'project_order', 'custom_offer', 'consultation', 'add_card'] },
        jobId: mongoose.Schema.Types.ObjectId,
        proposalId: String,
        orderId: mongoose.Schema.Types.ObjectId,
        offerId: mongoose.Schema.Types.ObjectId,
        conversationId: String,
        durationMinutes: Number,
        meetingDate: String,
        meetingTime: String
    },
    createdAt: { type: Date, default: Date.now },
    completedAt: { type: Date }
}, { timestamps: true });

PendingChargeSchema.index({ userId: 1, status: 1 });
PendingChargeSchema.index({ geideaSessionId: 1 });

module.exports = mongoose.model('PendingCharge', PendingChargeSchema);
