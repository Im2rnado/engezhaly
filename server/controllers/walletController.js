const User = require('../models/User');
const Transaction = require('../models/Transaction');
const ConsultationPayment = require('../models/ConsultationPayment');
const Conversation = require('../models/Conversation');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const { sendAndLog } = require('../services/mailgunService');
const { depositReceipt } = require('../templates/emailTemplates');

const DEFAULT_CONSULTATION_AMOUNT = 100;
const WITHDRAWAL_FEE = 20;

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

// Pay for consultation - returns payment params for frontend to call initCharge (Paymob)
// Base price is for 30 minutes. durationMinutes (30, 60, 90) multiplies the price.
const payConsultation = async (req, res) => {
    try {
        const { conversationId, projectId, durationMinutes } = req.body;
        const userId = req.user.id;
        const duration = Math.max(30, Math.min(120, Number(durationMinutes) || 30));

        if (!conversationId) return res.status(400).json({ msg: 'conversationId is required' });

        const user = await User.findById(userId);
        if (!user || user.role !== 'client') {
            return res.status(403).json({ msg: 'Only clients can pay for consultations.' });
        }

        const conversation = await Conversation.findById(conversationId).select('participants');
        if (!conversation || !conversation.participants || conversation.participants.length < 2) {
            return res.status(400).json({ msg: 'Invalid conversation' });
        }
        const freelancerId = conversation.participants.find(p => String(p) !== String(userId));
        if (!freelancerId) return res.status(400).json({ msg: 'Could not determine freelancer' });

        // Check for ongoing order or job - consultation is FREE
        const Order = require('../models/Order');
        const Job = require('../models/Job');
        const ongoingOrder = await Order.findOne({
            $or: [
                { buyerId: userId, sellerId: freelancerId },
                { buyerId: freelancerId, sellerId: userId }
            ],
            status: { $in: ['active', 'pending_payment'] }
        });
        const ongoingJob = await Job.findOne({
            clientId: userId,
            'proposals.freelancerId': freelancerId,
            'proposals.status': 'accepted',
            status: 'in_progress'
        });
        if (ongoingOrder || ongoingJob) {
            return res.json({ requiresPayment: false, freeReason: 'ongoing_work' });
        }

        // Resolve base price (for 30 min): project's price if projectId provided, else freelancer's profile default
        let basePrice = DEFAULT_CONSULTATION_AMOUNT;
        if (projectId) {
            const Project = require('../models/Project');
            const project = await Project.findById(projectId).select('consultationPrice sellerId');
            if (project && project.consultationPrice != null && project.consultationPrice > 0) {
                basePrice = Number(project.consultationPrice);
            }
        }
        if (basePrice === DEFAULT_CONSULTATION_AMOUNT) {
            const freelancer = await User.findById(freelancerId).select('freelancerProfile.consultationPrice');
            const fp = freelancer?.freelancerProfile;
            if (fp != null && fp.consultationPrice != null && fp.consultationPrice > 0) {
                basePrice = Number(fp.consultationPrice);
            }
        }
        const amount = Math.round(basePrice * (duration / 30) * 100) / 100;
        const amountCents = Math.round(amount * 100);

        res.json({
            requiresPayment: true,
            type: 'consultation',
            amountCents,
            meta: { conversationId, durationMinutes: duration }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: err.message || 'Server Error' });
    }
};

const getTransactions = async (req, res) => {
    try {
        const excludeManualTopUp = req.query.excludeManualTopUp === 'true';
        const query = { userId: req.user.id };
        if (excludeManualTopUp) query.isManualAdminTopUp = { $ne: true };
        const transactions = await Transaction.find(query).sort({ createdAt: -1 });
        res.json(transactions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Create withdrawal request - freelancers only
const createWithdrawalRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user || user.role !== 'freelancer') {
            return res.status(403).json({ msg: 'Only freelancers can request withdrawals.' });
        }

        const { amount, method, phoneNumber, accountNumber, bankName, notes } = req.body || {};

        if (!amount || amount < 50) {
            return res.status(400).json({ msg: 'Minimum withdrawal amount is 50 EGP' });
        }

        const validMethods = ['instapay', 'vodafone_cash', 'bank'];
        if (!method || !validMethods.includes(method)) {
            return res.status(400).json({ msg: 'Invalid withdrawal method. Use instapay, vodafone_cash, or bank' });
        }

        const totalDeducted = amount + WITHDRAWAL_FEE;
        const balance = user.walletBalance || 0;

        if (balance < totalDeducted) {
            return res.status(400).json({
                msg: `Insufficient balance. You need ${totalDeducted} EGP (${amount} + ${WITHDRAWAL_FEE} EGP fee). Your balance: ${balance} EGP`
            });
        }

        if ((method === 'instapay' || method === 'vodafone_cash') && !phoneNumber) {
            return res.status(400).json({ msg: 'Phone number is required for InstaPay and Vodafone Cash' });
        }
        if (method === 'bank' && (!accountNumber || !bankName)) {
            return res.status(400).json({ msg: 'Account number and bank name are required for bank transfer' });
        }

        user.walletBalance = balance - totalDeducted;
        await user.save();

        const withdrawal = new WithdrawalRequest({
            userId,
            amount,
            fee: WITHDRAWAL_FEE,
            method,
            phoneNumber: phoneNumber || undefined,
            accountNumber: accountNumber || undefined,
            bankName: bankName || undefined,
            notes: notes || undefined,
            status: 'pending'
        });
        await withdrawal.save();

        await Transaction.create({
            userId,
            type: 'withdrawal',
            amount: -totalDeducted,
            description: `Withdrawal request (${amount} EGP + ${WITHDRAWAL_FEE} EGP fee) - pending`,
            status: 'pending',
            referenceId: withdrawal._id.toString()
        });

        res.json(withdrawal);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: err.message || 'Server Error' });
    }
};

// List my withdrawal requests - freelancers only
const getMyWithdrawals = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user || user.role !== 'freelancer') {
            return res.status(403).json({ msg: 'Only freelancers can view withdrawals.' });
        }

        const requests = await WithdrawalRequest.find({ userId }).sort({ createdAt: -1 });
        res.json(requests);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

module.exports = {
    topUpWallet,
    getBalance,
    getTransactions,
    payConsultation,
    createWithdrawalRequest,
    getMyWithdrawals
};
