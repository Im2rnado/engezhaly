const express = require('express');
const router = express.Router();
const { handleWebhook } = require('../controllers/paymobWebhookController');

// Paymob sends POST to this URL - no auth
router.post('/paymob', handleWebhook);

module.exports = router;
