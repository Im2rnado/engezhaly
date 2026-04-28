const PaymentMethod = require('../models/PaymentMethod');
const PendingCharge = require('../models/PendingCharge');
const User = require('../models/User');
const { createSession } = require('../services/geideaService');
const { fulfillCharge } = require('./geideaWebhookController');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:5001';

// A minimal non-zero amount for card verification (1 EGP = 1.00)
const ADD_CARD_AMOUNT_EGP = 1.00;

/**
 * GET /payment-methods - List saved cards (client only)
 */
const list = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        if (!user || user.role !== 'client') {
            return res.status(403).json({ msg: 'Only clients can manage payment methods' });
        }
        const methods = await PaymentMethod.find({ userId }).select('-geideaTokenId').sort({ isDefault: -1, createdAt: -1 });
        res.json(methods);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: err.message || 'Server Error' });
    }
};

/**
 * POST /payment-methods - Add card via Geidea (returns sessionId for GeideaCheckout SDK)
 */
const addCard = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId).select('firstName lastName email role');
        if (!user || user.role !== 'client') {
            return res.status(403).json({ msg: 'Only clients can add payment methods' });
        }

        // Create a unique merchantReferenceId — we'll store it on PendingCharge and Geidea will echo it back
        const pending = new PendingCharge({
            userId,
            amountCents: Math.round(ADD_CARD_AMOUNT_EGP * 100),
            description: 'Add payment method',
            meta: { type: 'add_card' }
        });
        await pending.save();

        const merchantReferenceId = pending._id.toString();

        const sessionId = await createSession({
            amountEGP: ADD_CARD_AMOUNT_EGP,
            merchantReferenceId,
            callbackUrl: `${API_URL}/api/webhooks/geidea`,
            returnUrl: `${FRONTEND_URL}/dashboard/client/wallet?success=1`,
            customer: {
                email: user.email || '',
                firstName: user.firstName || 'Customer',
                lastName: user.lastName || ''
            },
            cardOnFile: true
        });

        // Store the sessionId back on the pending charge for lookup
        pending.geideaSessionId = merchantReferenceId; // merchantReferenceId IS our pendingCharge._id
        await pending.save();

        res.json({ sessionId, pendingChargeId: pending._id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: err.message || 'Server Error' });
    }
};

/**
 * DELETE /payment-methods/:id
 */
const remove = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const method = await PaymentMethod.findOne({ _id: id, userId });
        if (!method) {
            return res.status(404).json({ msg: 'Payment method not found' });
        }
        await PaymentMethod.findByIdAndDelete(id);
        if (method.isDefault) {
            const next = await PaymentMethod.findOne({ userId }).sort({ createdAt: -1 });
            if (next) {
                next.isDefault = true;
                await next.save();
            }
        }
        res.json({ msg: 'Removed' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: err.message || 'Server Error' });
    }
};

/**
 * PATCH /payment-methods/:id/default
 */
const setDefault = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const method = await PaymentMethod.findOne({ _id: id, userId });
        if (!method) {
            return res.status(404).json({ msg: 'Payment method not found' });
        }
        await PaymentMethod.updateMany({ userId }, { isDefault: false });
        method.isDefault = true;
        await method.save();
        res.json(method);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: err.message || 'Server Error' });
    }
};

/**
 * POST /payment-methods/init-charge - Create a Geidea payment session for a business action.
 * Returns { sessionId } for the frontend to pass to GeideaCheckout SDK.
 * If the client has sufficient wallet balance, deducts directly and returns { paidFromWallet: true }.
 * Body: { type, amountCents, ...meta }
 */
const initCharge = async (req, res) => {
    try {
        const userId = req.user.id;
        const { type, amountCents, callbackSuccessUrl, ...meta } = req.body || {};

        const user = await User.findById(userId).select('firstName lastName email walletBalance role');
        if (!user || user.role !== 'client') {
            return res.status(403).json({ msg: 'Only clients can initiate charges' });
        }
        if (!type || !amountCents || amountCents < 100) {
            return res.status(400).json({ msg: 'Invalid type or amount' });
        }

        const amountEGP = amountCents / 100;
        const fulfillableTypes = ['job_proposal', 'project_order', 'custom_offer', 'consultation'];

        // Check wallet balance first - if sufficient, deduct wallet and run same fulfillment
        const walletBalance = user.walletBalance || 0;
        if (walletBalance >= amountEGP && fulfillableTypes.includes(type)) {
            const prevBalance = walletBalance;
            user.walletBalance = walletBalance - amountEGP;
            await user.save();

            const syntheticPending = {
                userId,
                amountCents,
                meta: { type, ...meta }
            };
            try {
                await fulfillCharge(syntheticPending, req.app);
            } catch (fulfillErr) {
                console.error('[initCharge] fulfillCharge after wallet failed:', fulfillErr);
                user.walletBalance = prevBalance;
                await user.save();
                return res.status(500).json({ msg: fulfillErr.message || 'Could not complete payment from wallet' });
            }

            return res.json({ paidFromWallet: true, remainingBalance: user.walletBalance });
        }

        // Create PendingCharge first so we have the _id as merchantReferenceId
        const pending = new PendingCharge({
            userId,
            amountCents,
            description: meta.description || type,
            meta: { type, ...meta }
        });
        await pending.save();

        const merchantReferenceId = pending._id.toString();

        const sessionId = await createSession({
            amountEGP,
            merchantReferenceId,
            callbackUrl: `${API_URL}/api/webhooks/geidea`,
            returnUrl: callbackSuccessUrl || `${FRONTEND_URL}/dashboard/client`,
            customer: {
                email: user.email || '',
                firstName: user.firstName || 'Customer',
                lastName: user.lastName || ''
            },
            cardOnFile: false
        });

        pending.geideaSessionId = merchantReferenceId;
        await pending.save();

        res.json({ sessionId, pendingChargeId: pending._id, walletBalance });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: err.message || 'Server Error' });
    }
};

module.exports = {
    list,
    addCard,
    remove,
    setDefault,
    initCharge
};
