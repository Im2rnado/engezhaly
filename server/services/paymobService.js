/**
 * Paymob Egypt - Payment Gateway Integration
 * Docs: https://docs.paymob.com/
 * Flow: Auth Token -> Order -> Payment Key -> iframe/Callback
 */

const PAYMOB_API_URL = process.env.PAYMOB_API_URL || 'https://accept.paymob.com/api';
const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
const PAYMOB_IFRAME_ID = process.env.PAYMOB_IFRAME_ID;
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID;
const PAYMOB_HMAC_SECRET = process.env.PAYMOB_HMAC_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

let cachedAuthToken = null;
let cachedAuthExpiry = 0;

const getAuthToken = async () => {
    if (cachedAuthToken && Date.now() < cachedAuthExpiry) {
        return cachedAuthToken;
    }
    if (!PAYMOB_API_KEY) {
        throw new Error('Paymob API key not configured');
    }
    const res = await fetch(`${PAYMOB_API_URL}/auth/tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: PAYMOB_API_KEY })
    });
    const data = await res.json();
    if (!data.token) {
        throw new Error(data.message || 'Failed to get Paymob auth token');
    }
    cachedAuthToken = data.token;
    cachedAuthExpiry = Date.now() + 50 * 60 * 1000; // 50 min
    return cachedAuthToken;
};

/**
 * Register an order with Paymob
 * @param {number} amountCents - Amount in piastres (EGP * 100)
 * @returns {Promise<string>} - Paymob order ID
 */
const registerOrder = async (amountCents) => {
    const token = await getAuthToken();
    const res = await fetch(`${PAYMOB_API_URL}/ecommerce/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            auth_token: token,
            amount_cents: Math.round(amountCents),
            currency: 'EGP',
            delivery_needed: 'false',
            items: []
        })
    });
    const data = await res.json();
    if (!data.id) {
        throw new Error(data.message || 'Failed to create Paymob order');
    }
    return data.id.toString();
};

/**
 * Create a payment key for iframe / redirect
 * @param {Object} opts
 * @param {number} opts.amountCents
 * @param {string} opts.paymobOrderId
 * @param {Object} opts.billingData - { first_name, last_name, email, phone_number, apartment, floor, street, building, shipping_method, city, state, country }
 * @param {string} opts.callbackUrl - success redirect
 * @param {Object} opts.metadata - stored in Paymob and returned in webhook/callback
 * @returns {Promise<string>} - payment_token for iframe URL
 */
const createPaymentKey = async ({ amountCents, paymobOrderId, billingData, callbackUrl, metadata = {} }) => {
    const token = await getAuthToken();
    if (!PAYMOB_INTEGRATION_ID) {
        throw new Error('Paymob integration ID not configured');
    }
    const payload = {
        auth_token: token,
        amount_cents: Math.round(amountCents),
        expiration: 3600,
        order_id: paymobOrderId,
        billing_data: {
            first_name: billingData.first_name || 'Customer',
            last_name: billingData.last_name || '',
            email: billingData.email || '',
            phone_number: billingData.phone_number || '01000000000',
            apartment: 'NA',
            floor: 'NA',
            street: 'NA',
            building: 'NA',
            shipping_method: 'NA',
            city: 'NA',
            state: 'NA',
            country: 'EGY',
            ...billingData
        },
        currency: 'EGP',
        integration_id: parseInt(PAYMOB_INTEGRATION_ID, 10),
        lock_order_when_paid: 'false',
        ...(callbackUrl && { return_url: callbackUrl }),
        ...(Object.keys(metadata).length && { metadata: metadata })
    };
    const res = await fetch(`${PAYMOB_API_URL}/acceptance/payment_keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.token) {
        throw new Error(data.message || 'Failed to create payment key');
    }
    return data.token;
};

/**
 * Build iframe URL for Paymob payment form
 * @param {string} paymentToken - from createPaymentKey
 * @returns {string}
 */
const getIframeUrl = (paymentToken) => {
    if (!PAYMOB_IFRAME_ID) {
        throw new Error('Paymob iframe ID not configured');
    }
    return `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${paymentToken}`;
};

/**
 * Verify webhook HMAC from Paymob
 * @param {Object} obj - Paymob callback obj
 * @returns {boolean}
 */
const verifyWebhookHmac = (obj) => {
    if (!PAYMOB_HMAC_SECRET) return false;
    const concatenated = [
        obj.amount_cents,
        obj.created_at,
        obj.currency,
        obj.error_occured,
        obj.has_parent_transaction,
        obj.id,
        obj.integration_id,
        obj.is_3d_secure,
        obj.is_auth,
        obj.is_capture,
        obj.is_refunded,
        obj.is_standalone_payment,
        obj.is_voided,
        obj.order.id,
        obj.owner,
        obj.pending,
        obj.source_data.pan,
        obj.source_data.sub_type,
        obj.source_data.type,
        obj.success
    ].join('');
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha512', PAYMOB_HMAC_SECRET).update(concatenated).digest('hex');
    return hmac === obj.hmac;
};

module.exports = {
    getAuthToken,
    registerOrder,
    createPaymentKey,
    getIframeUrl,
    verifyWebhookHmac
};
