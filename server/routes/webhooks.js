const express = require('express');
const router = express.Router();
const { handleWebhook } = require('../controllers/geideaWebhookController');

// Geidea sends POST to this URL after payment completion - no auth middleware
router.post('/geidea', handleWebhook);

module.exports = router;
