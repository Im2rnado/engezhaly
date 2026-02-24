/**
 * Emit in-app notification to a user (when they are online).
 * Used instead of email when user is connected via socket.
 */
function emitToUser(app, userId, payload) {
    const io = app.get('io');
    if (!io || !userId) return;
    const roomId = `user:${String(userId)}`;
    io.to(roomId).emit('notification', {
        title: payload.title || 'Notification',
        message: payload.message || '',
        link: payload.link || '/',
        type: payload.type || 'info'
    });
}

function isUserOnline(app, userId) {
    const io = app.get('io');
    if (!io || !userId) return false;
    const roomId = `user:${String(userId)}`;
    const adapter = io.sockets?.adapter;
    if (!adapter?.rooms) return false;
    const room = adapter.rooms.get(roomId);
    return room && room.size > 0;
}

module.exports = { emitToUser, isUserOnline };
