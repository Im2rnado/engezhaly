/**
 * Geidea Egypt - Payment Gateway Integration
 * Docs: https://docs.geidea.net/docs/geidea-checkout-v2
 * Flow: Create Session (server-to-server, Basic Auth) -> Return sessionId -> Frontend loads GeideaCheckout JS SDK -> startPayment(sessionId)
 * Callback: Geidea POSTs to callbackUrl when payment completes
 */

const crypto = require('crypto');

const GEIDEA_PUBLIC_KEY = process.env.GEIDEA_PUBLIC_KEY;
const GEIDEA_API_PASSWORD = process.env.GEIDEA_API_PASSWORD;
const GEIDEA_API_URL = process.env.GEIDEA_API_URL || 'https://api.merchant.geidea.net';

/**
 * Generate HMAC-SHA256 signature required by Geidea
 * Signature = Base64( HMAC-SHA256( publicKey + amountStr + currency + merchantRefId + timestamp, apiPassword ) )
 * @param {string} publicKey
 * @param {number} amount
 * @param {string} currency
 * @param {string} merchantReferenceId
 * @param {string} apiPassword
 * @param {string} timestamp
 * @returns {string} Base64 signature
 */
const generateSignature = (publicKey, amount, currency, merchantReferenceId, apiPassword, timestamp) => {
    const amountStr = parseFloat(amount).toFixed(2);
    const data = `${publicKey}${amountStr}${currency}${merchantReferenceId}${timestamp}`;
    const hash = crypto.createHmac('sha256', apiPassword).update(data).digest();
    return hash.toString('base64');
};

/**
 * Format timestamp as required by Geidea: M/D/YYYY H:MM:SS AM/PM
 * e.g. "4/28/2026 7:43:00 PM"
 */
const formatTimestamp = (date) => {
    const d = date || new Date();
    const month = d.getUTCMonth() + 1;
    const day = d.getUTCDate();
    const year = d.getUTCFullYear();
    let hours = d.getUTCHours();
    const minutes = String(d.getUTCMinutes()).padStart(2, '0');
    const seconds = String(d.getUTCSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${month}/${day}/${year} ${hours}:${minutes}:${seconds} ${ampm}`;
};

/**
 * Create a Geidea checkout session (server-to-server)
 * @param {Object} opts
 * @param {number} opts.amountEGP - Amount in EGP (e.g. 19.99)
 * @param {string} opts.merchantReferenceId - Unique reference for this charge (used to look up PendingCharge)
 * @param {string} opts.callbackUrl - Backend URL Geidea POSTs to on payment completion (HTTPS required in prod)
 * @param {string} [opts.returnUrl] - Browser redirect after completion
 * @param {Object} [opts.customer] - { email, firstName, lastName, phoneNumber }
 * @param {boolean} [opts.cardOnFile] - true to save card and receive tokenId in callback
 * @returns {Promise<string>} sessionId to pass to the frontend GeideaCheckout SDK
 */
const createSession = async ({
    amountEGP,
    merchantReferenceId,
    callbackUrl,
    returnUrl,
    customer,
    cardOnFile = false
}) => {
    if (!GEIDEA_PUBLIC_KEY || !GEIDEA_API_PASSWORD) {
        throw new Error('Geidea credentials not configured (GEIDEA_PUBLIC_KEY, GEIDEA_API_PASSWORD)');
    }

    const now = new Date();
    const timestamp = formatTimestamp(now);
    const signature = generateSignature(
        GEIDEA_PUBLIC_KEY,
        amountEGP,
        'EGP',
        merchantReferenceId,
        GEIDEA_API_PASSWORD,
        timestamp
    );

    const payload = {
        amount: parseFloat(parseFloat(amountEGP).toFixed(2)),
        currency: 'EGP',
        timestamp,
        merchantReferenceId,
        signature,
        paymentOperation: 'Pay',
        language: 'en',
        callbackUrl,
        cardOnFile,
        appearance: {
            showEmail: false,
            showAddress: false,
            showPhone: false,
            receiptPage: false,
            uiMode: 'modal',
            styles: {
                hideGeideaLogo: false
            }
        }
    };

    if (returnUrl) payload.returnUrl = returnUrl;

    if (customer) {
        payload.customer = {
            email: customer.email || '',
            firstName: customer.firstName || '',
            lastName: customer.lastName || '',
            phoneNumber: customer.phoneNumber || ''
        };
    }

    const authHeader = 'Basic ' + Buffer.from(`${GEIDEA_PUBLIC_KEY}:${GEIDEA_API_PASSWORD}`).toString('base64');

    const res = await fetch(`${GEIDEA_API_URL}/payment-intent/api/v2/direct/session`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
        },
        body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok || data.responseCode !== '000' || !data.session?.id) {
        throw new Error(
            data.detailedResponseMessage ||
            data.responseMessage ||
            `Geidea session creation failed (HTTP ${res.status})`
        );
    }

    return data.session.id;
};

/**
 * Verify a Geidea callback/webhook body.
 * Geidea sends POST with JSON: { order: { status, ... }, responseCode, ... }
 * Success is indicated by responseCode === '000'.
 * @param {Object} body - Parsed JSON body from Geidea callback
 * @returns {boolean}
 */
const isCallbackSuccess = (body) => {
    return body?.responseCode === '000' || body?.order?.status === 'Success';
};

module.exports = {
    createSession,
    generateSignature,
    isCallbackSuccess
};
