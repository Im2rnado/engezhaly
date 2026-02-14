const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getConversations, getMessages, sendMessage, createOffer, acceptOffer, getOffers } = require('../controllers/chatController');

router.get('/conversations', auth, getConversations);
router.get('/messages/:id', auth, getMessages);
router.post('/messages', auth, sendMessage);
router.post('/offers', auth, createOffer);
router.post('/offers/:id/accept', auth, acceptOffer);
router.get('/offers/:conversationId', auth, getOffers);

// Legacy route for backward compatibility (must be last to avoid conflicts)
router.get('/:userId', auth, getMessages);

module.exports = router;
