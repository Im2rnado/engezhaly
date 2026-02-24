const express = require('express');
const router = express.Router();
const authVerified = require('../middleware/authVerified');
const { getConversations, getMessages, sendMessage, createOffer, acceptOffer, getOffers, getConsultationStatus, createConsultationMeeting } = require('../controllers/chatController');

router.get('/conversations', authVerified, getConversations);
router.get('/messages/:id', authVerified, getMessages);
router.post('/messages', authVerified, sendMessage);
router.post('/offers', authVerified, createOffer);
router.post('/offers/:id/accept', authVerified, acceptOffer);
router.get('/offers/:conversationId', authVerified, getOffers);
router.get('/consultation-status/:conversationId', authVerified, getConsultationStatus);
router.post('/consultation-meeting', authVerified, createConsultationMeeting);

// Legacy route for backward compatibility (must be last to avoid conflicts)
router.get('/:userId', authVerified, getMessages);

module.exports = router;
