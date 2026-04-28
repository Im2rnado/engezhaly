const mongoose = require('mongoose');

const PaymentMethodSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['card'], default: 'card' },
    // Geidea tokenId for card-on-file — never store raw card data (PCI)
    geideaTokenId: { type: String, select: false },
    // For display only — from Geidea callback
    last4: { type: String },
    brand: { type: String }, // Visa, Mastercard, etc.
    isDefault: { type: Boolean, default: false }
}, { timestamps: true });

// One default per user
PaymentMethodSchema.index({ userId: 1, isDefault: 1 });
PaymentMethodSchema.index({ userId: 1 });

module.exports = mongoose.model('PaymentMethod', PaymentMethodSchema);
