const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['deposit', 'withdrawal', 'payment', 'fee', 'refund'], required: true },
    amount: { type: Number, required: true },
    description: { type: String },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
    paymentMethod: { type: String, enum: ['card', 'wallet'], default: 'wallet' },
    referenceId: { type: String } // e.g., Stripe Payment ID
}, { timestamps: true });

module.exports = mongoose.model('Transaction', TransactionSchema);
