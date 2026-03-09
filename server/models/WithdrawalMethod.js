const mongoose = require('mongoose');

const WithdrawalMethodSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    method: { type: String, enum: ['instapay', 'vodafone_cash', 'bank'], required: true },
    phoneNumber: { type: String },       // For InstaPay / Vodafone Cash
    accountNumber: { type: String },    // For bank
    bankName: { type: String },         // For bank
    label: { type: String },            // User-friendly label e.g. "My Vodafone Cash"
    isDefault: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('WithdrawalMethod', WithdrawalMethodSchema);
