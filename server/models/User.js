const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    phoneNumber: { type: String, select: false }, // Hidden by default
    dateOfBirth: { type: Date, select: false }, // Optional, for freelancers
    role: { type: String, enum: ['client', 'freelancer', 'admin'], default: 'client' },
    emailVerified: { type: Boolean, default: false },
    businessType: { type: String, enum: ['personal', 'company'] }, // For Clients
    clientProfile: {
        companyName: { type: String },
        companyDescription: { type: String },
        position: { type: String },
        linkedIn: { type: String },
        instagram: { type: String },
        facebook: { type: String },
        tiktok: { type: String }
    },
    walletBalance: { type: Number, default: 0 },
    strikes: { type: Number, default: 0, max: 3 },
    isFrozen: { type: Boolean, default: false },
    freelancerProfile: {
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
        isBusy: { type: Boolean, default: false },
        adminStarred: { type: Boolean, default: false }, // Admin marked for later review
        isEmployeeOfMonth: { type: Boolean, default: false },
        profilePicture: { type: String }, // URL or base64 data URL
        bio: { type: String }, // Describe self
        idDocument: { type: String, select: false }, // URL to ID, hidden from public
        category: {
            type: String,
            enum: [
                'Development & Tech',
                'Design & Creative',
                'Digital Marketing',
                'Video Editor',
                'AI and Automations',
                'Writing & Language',
                'Voice Over'
            ]
        },
        experienceYears: { type: Number },
        isStudent: { type: Boolean, default: false },
        universityId: { type: String }, // URL to uploaded University ID (for students)
        city: { type: String },
        languages: {
            english: { type: String },
            arabic: { type: String }
        },
        extraLanguages: [String], // Other languages (name only, no fluency level)
        certificates: [String], // URLs to uploaded files
        skills: [String],
        surveyResponses: {
            isFullTime: Boolean,
            speedQualityCommitment: String, // Yes/Maybe/No - legacy
            disagreementHandling: String,  // 1) What happens if you have a disagreement with the client?
            hoursPerDay: String,           // 2) On average, how many hours per day can you dedicate?
            clientUpdates: String,         // 3) How do you keep clients updated?
            biggestChallenge: String,     // 4) What's the biggest challenge you could face?
            discoverySource: String       // 5) Where did you find out about Engezhaly?
        },
        starterPricing: {
            basic: { price: Number, days: Number, description: String },
            standard: { price: Number, days: Number, description: String },
            premium: { price: Number, days: Number, description: String }
        },
        portfolio: [{
            title: { type: String },
            description: { type: String },
            imageUrl: { type: String },
            link: { type: String },
            subCategory: { type: String }
        }],
        certifications: [{
            name: { type: String },
            date: { type: Date },
            institute: { type: String },
            documentUrl: { type: String }
        }]
    }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
