const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    lastMessage: { type: String },
    lastMessageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },
    isFrozen: { type: Boolean, default: false }, // If true, no new messages allowed
}, { timestamps: true });

module.exports = mongoose.model('Conversation', ConversationSchema);
