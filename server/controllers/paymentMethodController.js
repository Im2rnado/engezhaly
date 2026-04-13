const PaymentMethod = require('../models/PaymentMethod');
const PendingCharge = require('../models/PendingCharge');
const User = require('../models/User');
const {
    registerOrder,
    createPaymentKey,
    getIframeUrl
} = require('../services/paymobService');
const { fulfillCharge } = require('./paymobWebhookController');

const ADD_CARD_AMOUNT_CENTS = 100; // 1 EGP verification

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
        const methods = await PaymentMethod.find({ userId }).select('-paymobToken').sort({ isDefault: -1, createdAt: -1 });
        res.json(methods);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: err.message || 'Server Error' });
    }
};

/**
 * POST /payment-methods - Add card (returns iframe URL for Paymob)
 * Body: { callbackSuccessUrl?: string } - where to redirect after success
 */
const addCard = async (req, res) => {
    try {
        const userId = req.user.id;
        const { callbackSuccessUrl } = req.body || {};

        const user = await User.findById(userId).select('firstName lastName email role');
        if (!user || user.role !== 'client') {
            return res.status(403).json({ msg: 'Only clients can add payment methods' });
        }

        const paymobOrderId = await registerOrder(ADD_CARD_AMOUNT_CENTS);
        const paymentToken = await createPaymentKey({
            amountCents: ADD_CARD_AMOUNT_CENTS,
            paymobOrderId,
            billingData: {
                first_name: user.firstName || 'Customer',
                last_name: user.lastName || '',
                email: user.email || '',
                phone_number: '01000000000'
            },
            callbackUrl: callbackSuccessUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/client/payment-methods?success=1`,
            metadata: { action: 'add_card', userId }
        });

        const iframeUrl = getIframeUrl(paymentToken);

        const pending = new PendingCharge({
            userId,
            amountCents: ADD_CARD_AMOUNT_CENTS,
            description: 'Add payment method',
            paymobOrderId,
            meta: { type: 'add_card' }
        });
        await pending.save();

        res.json({ iframeUrl, paymentToken, pendingChargeId: pending._id });
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
 * POST /payment-methods/init-charge - Create payment for a business action
 * Returns iframe URL. Client pays, webhook fulfills.
 * Body: { type, amountCents, ...meta }
 * If the client has sufficient wallet balance, deducts directly and returns { paidFromWallet: true }
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

        // Check wallet balance first - if sufficient, deduct wallet and run same fulfillment as Paymob success
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

        const paymobOrderId = await registerOrder(amountCents);
        const paymentToken = await createPaymentKey({
            amountCents,
            paymobOrderId,
            billingData: {
                first_name: user.firstName || 'Customer',
                last_name: user.lastName || '',
                email: user.email || '',
                phone_number: '01000000000'
            },
            callbackUrl: callbackSuccessUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/client`,
            metadata: { action: type, userId, ...meta }
        });

        const pending = new PendingCharge({
            userId,
            amountCents,
            description: meta.description || type,
            paymobOrderId,
            meta: { type, ...meta }
        });
        await pending.save();

        const iframeUrl = getIframeUrl(paymentToken);
        res.json({ iframeUrl, paymentToken, pendingChargeId: pending._id, walletBalance });
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
