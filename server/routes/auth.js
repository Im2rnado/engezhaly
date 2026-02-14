const express = require('express');
const router = express.Router();
const { register, login, forgotPassword } = require('../controllers/authController');

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', register);

// @route   POST api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', login);

// @route   POST api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', forgotPassword);

module.exports = router;
