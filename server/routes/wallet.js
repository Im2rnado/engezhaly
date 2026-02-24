const express = require('express');
const router = express.Router();
const authVerified = require('../middleware/authVerified');
const { topUpWallet, getBalance, getTransactions, payConsultation } = require('../controllers/walletController');

router.post('/topup', authVerified, topUpWallet);
router.post('/consultation-pay', authVerified, payConsultation);
router.get('/balance', authVerified, getBalance);
router.get('/transactions', authVerified, getTransactions);

module.exports = router;
