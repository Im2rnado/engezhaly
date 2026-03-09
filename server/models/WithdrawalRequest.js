const mongoose = require('mongoose');

const WithdrawalRequestSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true }, // Amount freelancer receives (after fee)
    fee: { type: Number, default: 20 },     // 20 EGP withdrawal fee
    method: { type: String, enum: ['instapay', 'vodafone_cash', 'bank'], required: true },
    // Method-specific details (admin uses these to process)
    phoneNumber: { type: String },          // For InstaPay / Vodafone Cash
    accountNumber: { type: String },       // For bank
    bankName: { type: String },
    notes: { type: String },
    status: { type: String, enum: ['pending', 'completed', 'rejected'], default: 'pending' },
    processedAt: { type: Date },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectReason: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('WithdrawalRequest', WithdrawalRequestSchema);
