const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
    kind: { type: String, enum: ['direct', 'support'], default: 'direct' },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    lastMessage: { type: String },
    lastMessageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },
    isFrozen: { type: Boolean, default: false }, // If true, no new messages allowed
    /** When the admin last opened this thread in the dashboard (for unread badge). */
    adminLastReadAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Conversation', ConversationSchema);
