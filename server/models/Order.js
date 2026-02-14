const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' }, // Optional for custom offers
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    packageType: { type: String, enum: ['Basic', 'Standard', 'Premium', 'Custom'], required: true },
    offerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer' }, // For custom offers
    amount: { type: Number, required: true },
    platformFee: { type: Number, default: 20 },
    status: { type: String, enum: ['active', 'completed', 'disputed'], default: 'active' },
    deliveryDate: { type: Date },
    completedAt: { type: Date },
    rating: { type: Number, min: 1, max: 5 },
    review: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
