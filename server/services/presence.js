/**
 * Shared presence map: roomId -> Set of userIds currently in that room.
 * Used by socketHandler (updates) and chatController (checks for offline email).
 */
const usersInRoom = new Map();

function isUserInConversation(conversationId, userId) {
    const roomId = `conversation:${String(conversationId)}`;
    const set = usersInRoom.get(roomId);
    return set ? set.has(String(userId)) : false;
}

module.exports = { usersInRoom, isUserInConversation };
