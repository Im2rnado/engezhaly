/**
 * Egyptian mobile in E.164 as stored by the app: +20 + 10-digit national (without leading 0).
 * Example: 01123456789 → +201123456789
 */
function isValidEgyptianE164(phone) {
    const s = String(phone || '').replace(/\s/g, '');
    return /^\+20\d{10}$/.test(s);
}

module.exports = { isValidEgyptianE164 };
