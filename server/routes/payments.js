const express = require('express');
const router = express.Router();
const authVerified = require('../middleware/authVerified');
const { createInstaPayPayment, uploadScreenshot } = require('../controllers/instaPayController');

router.post('/instapay', authVerified, createInstaPayPayment);
router.post('/instapay/:id/upload-screenshot', authVerified, uploadScreenshot);

module.exports = router;
