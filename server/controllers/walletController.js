const User = require('../models/User');
const Transaction = require('../models/Transaction');

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
    getTransactions
};
