const User = require('../models/User');
const Transaction = require('../models/Transaction');
const ConsultationPayment = require('../models/ConsultationPayment');
const { sendAndLog } = require('../services/mailgunService');
const { depositReceipt } = require('../templates/emailTemplates');

const CONSULTATION_AMOUNT = 100;

// Mock Deposit (Top Up)
const topUpWallet = async (req, res) => {
    try {
        const { amount, paymentMethod } = req.body; // paymentMethod: 'card'
        const userId = req.user.id;

        if (amount <= 0) return res.status(400).json({ msg: 'Invalid amount' });

        // Simulate Payment Processing (e.g. Stripe/Paymob)
        const fee = 20; // Fixed fee on top-up
        const netAmount = amount - fee;

        if (netAmount <= 0) return res.status(400).json({ msg: 'Amount too low to cover fees' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        user.walletBalance += netAmount;
        await user.save();

        // Log Transaction (Deposit)
        const deposit = new Transaction({
            userId,
            type: 'deposit',
            amount: amount,
            description: 'Wallet Top-up via Card',
            status: 'completed',
            paymentMethod: paymentMethod || 'card'
        });
        await deposit.save();

        // Log Transaction (Fee)
        const feeTx = new Transaction({
            userId,
            type: 'fee',
            amount: -fee,
            description: 'Top-up Fee',
            status: 'completed'
        });
        await feeTx.save();

        // Send receipt email
        const userWithEmail = await User.findById(userId).select('email');
        if (userWithEmail?.email) {
            const { subject, html } = depositReceipt(netAmount, deposit._id.toString(), new Date().toLocaleDateString());
            sendAndLog(userWithEmail.email, subject, html, 'deposit_receipt', { userId, type: 'deposit' }).catch(err => console.error('[Wallet] Receipt email failed:', err.message));
        }

        res.json({ msg: 'Top-up successful', balance: user.walletBalance });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const getBalance = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json({ balance: user.walletBalance });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Pay for consultation (deduct from wallet, create payment record) - clients only
const payConsultation = async (req, res) => {
    try {
        const { conversationId } = req.body;
        const userId = req.user.id;

        if (!conversationId) return res.status(400).json({ msg: 'conversationId is required' });

        const user = await User.findById(userId);
        if (user.role !== 'client') return res.status(403).json({ msg: 'Only clients can pay for consultations.' });
        if (!user) return res.status(404).json({ msg: 'User not found' });

        if (user.walletBalance < CONSULTATION_AMOUNT) {
            return res.status(400).json({ msg: 'Insufficient balance. You need at least 100 EGP.' });
        }

        user.walletBalance -= CONSULTATION_AMOUNT;
        await user.save();

        const tx = new Transaction({
            userId,
            type: 'consultation',
            amount: -CONSULTATION_AMOUNT,
            description: 'Video consultation payment',
            status: 'completed',
            metadata: { conversationId }
        });
        await tx.save();

        const payment = new ConsultationPayment({
            userId,
            conversationId,
            amount: CONSULTATION_AMOUNT,
            used: false
        });
        await payment.save();

        res.json({ msg: 'Payment successful', balance: user.walletBalance, paymentId: payment._id });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: err.message || 'Server Error' });
    }
};

const getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(transactions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

module.exports = {
    topUpWallet,
    getBalance,
    getTransactions,
    payConsultation
};
