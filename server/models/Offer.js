const mongoose = require('mongoose');

const OfferSchema = new mongoose.Schema({
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Freelancer or Client who created the offer
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // The other party
    price: { type: Number, required: true, min: 500 },
    deliveryDays: { type: Number, required: true },
    whatsIncluded: { type: String, required: true }, // Description of what's included
    milestones: [{
        name: { type: String, required: true },
        price: { type: Number, required: true },
        dueDate: { type: Date }
    }], // Optional milestones for payment splitting
    status: { type: String, enum: ['pending', 'accepted', 'rejected', 'expired'], default: 'pending' },
    acceptedAt: { type: Date },
    expiresAt: { type: Date } // Optional expiration date
}, { timestamps: true });

module.exports = mongoose.model('Offer', OfferSchema);
