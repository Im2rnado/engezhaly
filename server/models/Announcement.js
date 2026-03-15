const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
    content: { type: String },           // Text (optional if image only)
    imageUrl: { type: String },           // Image URL (optional)
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Announcement', AnnouncementSchema);
