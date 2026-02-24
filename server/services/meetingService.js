/**
 * Meeting link generation.
 * Uses Jitsi Meet by default (free, no API key).
 * Set GOOGLE_APPLICATION_CREDENTIALS and GOOGLE_CALENDAR_ID for Google Meet.
 */
const crypto = require('crypto');

/**
 * Generate a unique meeting link.
 * @param {string} conversationId - Conversation ID for uniqueness
 * @param {Date} meetingDate - Scheduled date/time
 * @returns {{ link: string, error?: string }}
 */
function createMeetingLink(conversationId, meetingDate) {
    try {
        // Jitsi Meet: free, no setup. Format: meet.jit.si/room-name
        const slug = crypto.randomBytes(8).toString('hex');
        const roomName = `engezhaly-${String(conversationId).slice(-8)}-${slug}`;
        const link = `https://meet.jit.si/${roomName}`;
        return { link };
    } catch (err) {
        console.error('[Meeting] Create link error:', err.message);
        return { link: null, error: err.message };
    }
}

module.exports = { createMeetingLink };
