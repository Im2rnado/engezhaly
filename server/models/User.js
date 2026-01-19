const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phoneNumber: { type: String, select: false }, // Hidden by default
    role: { type: String, enum: ['client', 'freelancer', 'admin'], default: 'client' },
    businessType: { type: String, enum: ['personal', 'company'] }, // For Clients
    walletBalance: { type: Number, default: 0 },
    strikes: { type: Number, default: 0, max: 3 },
    isFrozen: { type: Boolean, default: false },
    freelancerProfile: {
        status: { type: String, enum: ['pending', 'approved'], default: 'pending' },
        isBusy: { type: Boolean, default: false },
        isEmployeeOfMonth: { type: Boolean, default: false },
        profilePicture: { type: String }, // URL or base64 data URL
        bio: { type: String }, // Describe self
        idDocument: { type: String, select: false }, // URL to ID, hidden from public
        category: {
            type: String,
            enum: [
                'Development & Tech',
                'Design & Creativity',
                'Digital Marketing',
                'Video Editor',
                'AI and Automations',
                'Writing & Language',
                'Voice Over'
            ]
        },
        experienceYears: { type: Number },
        certificates: [String], // URLs to uploaded files
        skills: [String],
        surveyResponses: {
            isFullTime: Boolean,
            speedQualityCommitment: String, // Yes/Maybe/No
        },
        starterPricing: {
            basic: { price: Number, days: Number, description: String },
            standard: { price: Number, days: Number, description: String },
            premium: { price: Number, days: Number, description: String }
        }
    }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
