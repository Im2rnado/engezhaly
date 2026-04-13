/**
 * Notify both chat participants to refetch offers, pending banners, etc.
 * @param {import('socket.io').Server | null | undefined} io
 * @param {string|import('mongoose').Types.ObjectId} conversationId
 */
function emitChatContextRefresh(io, conversationId) {
    if (!io || conversationId == null) return;
    const id = String(conversationId);
    io.to(`conversation:${id}`).emit('chat_context_refresh', { conversationId: id });
}

module.exports = { emitChatContextRefresh };
