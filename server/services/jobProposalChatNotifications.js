const Chat = require('../models/Chat');
const Conversation = require('../models/Conversation');
const { emitChatContextRefresh } = require('./chatContextRefresh');

/**
 * Inserts a blue order-style chat line when a posted-job proposal is accepted (after payment).
 */
async function sendJobProposalAcceptedChatMessage(io, clientUserId, freelancerUserId, jobTitle) {
    const clientIdStr = String(clientUserId);
    const freelancerIdStr = String(freelancerUserId);
    if (!clientIdStr || !freelancerIdStr || clientIdStr === freelancerIdStr) return;

    let conversation = await Conversation.findOne({
        participants: { $all: [clientIdStr, freelancerIdStr] }
    });
    if (!conversation) {
        conversation = await Conversation.create({
            participants: [clientIdStr, freelancerIdStr],
            lastMessage: ''
        });
    }

    const title = typeof jobTitle === 'string' && jobTitle.trim() ? jobTitle.trim() : 'Posted job';
    const content = `[Engezhaly Job] Job ${title} has been accepted by the client.`;

    const chatMsg = new Chat({
        conversationId: conversation._id,
        senderId: clientIdStr,
        receiverId: freelancerIdStr,
        content,
        messageType: 'order',
        isAdmin: false
    });
    await chatMsg.save();
    await Conversation.findByIdAndUpdate(conversation._id, {
        lastMessage: chatMsg.content,
        lastMessageId: chatMsg._id
    });

    if (io) {
        io.to(`conversation:${conversation._id}`).emit('message', {
            _id: chatMsg._id,
            conversationId: conversation._id,
            senderId: clientIdStr,
            content: chatMsg.content,
            messageType: 'order',
            createdAt: chatMsg.createdAt,
            isAdmin: false,
            isRead: false
        });
    }
    emitChatContextRefresh(io, conversation._id);
}

module.exports = { sendJobProposalAcceptedChatMessage };
