const express = require('express');
const rateLimit = require('express-rate-limit');
const optionalAuth = require('../middleware/optionalAuth');
const { reportError } = require('../controllers/errorLogController');

const router = express.Router();
const reportLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { msg: 'Too many error reports' }
});

router.post('/report', reportLimiter, optionalAuth, reportError);

module.exports = router;
