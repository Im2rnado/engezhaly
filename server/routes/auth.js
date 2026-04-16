const express = require('express');
const router = express.Router();
const { register, login, verifyEmail, forgotPassword, resetPassword, checkAvailability } = require('../controllers/authController');

router.post('/register', register);
router.post('/check-availability', checkAvailability);
router.post('/login', login);
router.get('/verify', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
