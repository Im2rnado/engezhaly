const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String }, // Main project description
    category: { type: String, required: true }, // Main category
    subCategory: { type: String, required: true }, // Sub category
    images: [{ type: String }], // Array of image URLs
    packages: [{
        type: { type: String, enum: ['Basic', 'Standard', 'Premium'], required: true },
        price: { type: Number, required: true, min: 500 },
        days: { type: Number, required: true },
        features: [{ type: String }],
        revisions: { type: Number, default: 0 }
    }],
    consultationPrice: { type: Number, default: 100 }, // EGP per video/voice consultation - overrides freelancer default when set
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Project', ProjectSchema);
