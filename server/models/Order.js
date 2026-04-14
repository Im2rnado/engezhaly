const mongoose = require('mongoose');
const Sequence = require('./Sequence');

const OrderSchema = new mongoose.Schema({
    orderNumber: { type: Number, unique: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' }, // Optional for custom offers
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    packageType: { type: String, enum: ['Basic', 'Standard', 'Premium', 'Custom'], required: true },
    offerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer' }, // For custom offers
    amount: { type: Number, required: true },
    platformFee: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'completed', 'disputed', 'refunded', 'pending_approval', 'pending_payment'], default: 'active' },
    description: { type: String },
    revisions: { type: Number, default: 0 },
    revisionsUnlimited: { type: Boolean, default: false },
    deliveryDate: { type: Date },
    completedAt: { type: Date },
    rating: { type: Number, min: 1, max: 5 },
    review: { type: String },
    disputeReason: { type: String },
    disputeResolvedAt: { type: Date },
    disputeResolution: { type: String },
    disputeResolutionType: {
        type: String,
        enum: ['release', 'refund', 'manual_split', 'reopen'],
        required: false
    },
    workSubmission: {
        message: { type: String, default: '' },
        links: [String],
        files: [String],
        submittedAt: { type: Date, default: null },
        updatedAt: { type: Date, default: null }
    },
    /** Per-phase delivery for custom offers (indexes match offer.milestones order). */
    offerMilestoneSubmissions: [{
        milestoneIndex: { type: Number, required: true },
        message: { type: String, default: '' },
        links: [String],
        files: [String],
        submittedAt: { type: Date, default: null },
        updatedAt: { type: Date, default: null }
    }]
}, { timestamps: true });

OrderSchema.pre('save', async function () {
    if (this.isNew && !this.orderNumber) {
        const Sequence = mongoose.model('Sequence');
        const sequence = await Sequence.findOneAndUpdate(
            { name: 'orderNumber' },
            { $inc: { value: 1 } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        this.orderNumber = sequence.value;
    }
});

module.exports = mongoose.model('Order', OrderSchema);
