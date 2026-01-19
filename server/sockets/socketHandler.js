module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        socket.on('join_chat', (chatId) => {
            socket.join(chatId);
            console.log(`User ${socket.id} joined chat: ${chatId}`);
        });

        socket.on('send_message', (data) => {
            // data: { chatId, senderId, text, ... }
            io.to(data.chatId).emit('receive_message', data);
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });
};
