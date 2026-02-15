const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    messageType: { type: String, enum: ['text', 'voice', 'file'], default: 'text' },
    content: { type: String, required: true }, // Text content or URL
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
    isBlurred: { type: Boolean, default: false },
    isFrozen: { type: Boolean, default: false }, // Kept for historical context if needed, but Conversation.isFrozen is master switch
    isAdmin: { type: Boolean, default: false } // Flag to identify admin messages
}, { timestamps: true });

module.exports = mongoose.model('Chat', ChatSchema);
