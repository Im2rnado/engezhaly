const User = require('../models/User');
const { sendAndLog } = require('../services/mailgunService');
const { adminSystemAlert } = require('../templates/emailTemplates');

const FALLBACK_EMAIL = process.env.SUPPORT_EMAIL || 'support@engezhaly.com';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let _cache = null;
let _cacheAt = 0;

/**
 * Returns an array of email addresses for all admin users in the DB.
 * Results are cached for 5 minutes so the DB is not hit on every request.
 * If no admins are found, falls back to SUPPORT_EMAIL env var (or hard-coded default).
 *
 * @returns {Promise<string[]>}
 */
async function getAdminEmails() {
    const now = Date.now();
    if (_cache && now - _cacheAt < CACHE_TTL_MS) {
        return _cache;
    }

    try {
        const admins = await User.find({ role: 'admin' }).select('email').lean();
        const emails = admins.map((u) => u.email).filter(Boolean);

        if (emails.length > 0) {
            _cache = emails;
            _cacheAt = now;
            return emails;
        }
    } catch (err) {
        console.error('[getAdminEmails] DB lookup failed:', err.message);
    }

    // Fallback: env var or hard-coded address
    const fallback = [FALLBACK_EMAIL];
    _cache = fallback;
    _cacheAt = now;
    return fallback;
}

/**
 * Convenience: returns the first admin email (for single-recipient use-cases).
 * @returns {Promise<string>}
 */
async function getPrimaryAdminEmail() {
    const emails = await getAdminEmails();
    return emails[0];
}

/**
 * Manually bust the cache (call after an admin email update if you want instant effect).
 */
function invalidateAdminEmailCache() {
    _cache = null;
    _cacheAt = 0;
}

/**
 * Helper to easily send an admin_system_alert template to all admins.
 */
async function notifyAdmins(subjectTitle, heading, messageHtml, linkText = null, linkUrl = null) {
    try {
        const emails = await getAdminEmails();
        if (!emails || emails.length === 0) return;
        
        const { subject, html } = adminSystemAlert(subjectTitle, heading, messageHtml, linkText, linkUrl);
        
        const promises = emails.map(email => 
            sendAndLog(email, subject, html, 'admin_system_alert', { subjectTitle })
                .catch(err => console.error('[notifyAdmins] Failed for', email, err.message))
        );
        await Promise.all(promises);
    } catch (err) {
        console.error('[notifyAdmins] Error:', err.message);
    }
}

module.exports = { getAdminEmails, getPrimaryAdminEmail, invalidateAdminEmailCache, notifyAdmins };
