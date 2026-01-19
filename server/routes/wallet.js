const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { topUpWallet, getBalance, getTransactions } = require('../controllers/walletController');

router.post('/topup', auth, topUpWallet);
router.get('/balance', auth, getBalance);
router.get('/transactions', auth, getTransactions);

module.exports = router;
