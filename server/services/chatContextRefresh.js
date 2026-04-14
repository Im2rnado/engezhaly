/** Room joined by admin dashboard sockets to refresh the active-chats list when anything changes. */
const ADMIN_CHATS_ROOM = 'admin_chats_watch';

/**
 * Notify admin dashboard to refetch chat list (unread badges, order, etc.).
 * @param {import('socket.io').Server | null | undefined} io
 * @param {string|import('mongoose').Types.ObjectId} conversationId
 */
function notifyAdminChatsListRefresh(io, conversationId) {
    if (!io || conversationId == null) return;
    io.to(ADMIN_CHATS_ROOM).emit('admin_chats_refresh_hint', { conversationId: String(conversationId) });
}

/**
 * Notify both chat participants to refetch offers, pending banners, etc.
 * @param {import('socket.io').Server | null | undefined} io
 * @param {string|import('mongoose').Types.ObjectId} conversationId
 */
function emitChatContextRefresh(io, conversationId) {
    if (!io || conversationId == null) return;
    const id = String(conversationId);
    io.to(`conversation:${id}`).emit('chat_context_refresh', { conversationId: id });
    notifyAdminChatsListRefresh(io, id);
}

module.exports = { emitChatContextRefresh, notifyAdminChatsListRefresh, ADMIN_CHATS_ROOM };
