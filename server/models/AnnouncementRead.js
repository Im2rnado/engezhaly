const mongoose = require('mongoose');

const AnnouncementReadSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    announcementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Announcement', required: true },
    readAt: { type: Date, default: Date.now }
}, { timestamps: true });

AnnouncementReadSchema.index({ userId: 1, announcementId: 1 }, { unique: true });

module.exports = mongoose.model('AnnouncementRead', AnnouncementReadSchema);
