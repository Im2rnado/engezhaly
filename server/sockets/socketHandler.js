const jwt = require('jsonwebtoken');
const { usersInRoom } = require('../services/presence');

function getRoomId(conversationId) {
    return `conversation:${String(conversationId)}`;
}

module.exports = (io) => {
    io.on('connection', (socket) => {
        let userId = null;

        try {
            const token = socket.handshake.auth?.token || socket.handshake.headers?.['x-auth-token'];
            if (token) {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
                userId = decoded.user?.id || decoded.user?._id;
            }
        } catch (e) {
            // No auth - allow connection but no userId
        }

        // Join user-specific room for global notifications
        if (userId) {
            socket.join(`user:${userId}`);
        }

        socket.on('join_chat', (conversationId) => {
            if (!conversationId) return;
            const roomId = getRoomId(conversationId);
            const toLeave = [];
            socket.rooms.forEach((r) => {
                if (r !== socket.id && r.startsWith('conversation:')) toLeave.push(r);
            });
            toLeave.forEach((r) => {
                const set = usersInRoom.get(r);
                if (set && userId) {
                    set.delete(userId);
                    if (set.size === 0) usersInRoom.delete(r);
                    socket.to(r).emit('user_offline', { userId, conversationId: r.replace('conversation:', '') });
                }
                socket.leave(r);
            });
            socket.join(roomId);

            if (userId) {
                let set = usersInRoom.get(roomId);
                if (!set) {
                    set = new Set();
                    usersInRoom.set(roomId, set);
                }
                set.add(userId);
                socket.to(roomId).emit('user_online', { userId, conversationId });
                // Send current users in room to the joining socket (for presence)
                const usersInThisRoom = Array.from(set).filter((id) => id !== userId);
                socket.emit('users_in_room', { conversationId, userIds: usersInThisRoom });
            }
        });

        socket.on('leave_chat', (conversationId) => {
            if (!conversationId) return;
            const roomId = getRoomId(conversationId);
            socket.leave(roomId);
            if (userId) {
                const set = usersInRoom.get(roomId);
                if (set) {
                    set.delete(userId);
                    if (set.size === 0) usersInRoom.delete(roomId);
                    socket.to(roomId).emit('user_offline', { userId, conversationId });
                }
            }
        });

        socket.on('disconnect', () => {
            if (userId) {
                socket.leave(`user:${userId}`);
                usersInRoom.forEach((set, roomId) => {
                    if (set.has(userId)) {
                        set.delete(userId);
                        if (set.size === 0) usersInRoom.delete(roomId);
                        const convId = roomId.replace('conversation:', '');
                        io.to(roomId).emit('user_offline', { userId, conversationId: convId });
                    }
                });
            }
        });
    });
};
