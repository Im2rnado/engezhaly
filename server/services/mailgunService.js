const Mailgun = require('mailgun.js');
const formData = require('form-data');
const EmailLog = require('../models/EmailLog');

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
    username: 'api',
    key: process.env.MAILGUN_API_KEY || '',
    url: process.env.MAILGUN_EU_URL ? 'https://api.eu.mailgun.net' : undefined
});

const DOMAIN = process.env.MAILGUN_DOMAIN || '';
const FROM = process.env.MAILGUN_FROM || 'Engezhaly <no-reply@engezhaly.com>';

/**
 * Send email via Mailgun
 */
async function sendEmail(to, subject, html) {
    if (!process.env.MAILGUN_API_KEY || !DOMAIN) {
        console.warn('[Mailgun] MAILGUN_API_KEY or MAILGUN_DOMAIN not set. Skipping email send.');
        return { id: 'skipped' };
    }
    try {
        const result = await mg.messages.create(DOMAIN, {
            from: FROM,
            to: [to],
            subject,
            html
        });
        return result;
    } catch (err) {
        console.error('[Mailgun] Send failed:', err.message);
        throw err;
    }
}

/**
 * Log email to database
 */
async function logEmail(recipient, subject, templateType, body, metadata, status, error = null) {
    try {
        await EmailLog.create({
            recipient,
            subject,
            templateType,
            body,
            metadata,
            status,
            error
        });
    } catch (err) {
        console.error('[EmailLog] Failed to log:', err.message);
    }
}

/**
 * Send email and log to database
 */
async function sendAndLog(to, subject, html, templateType, metadata = {}) {
    try {
        await sendEmail(to, subject, html);
        await logEmail(to, subject, templateType, html, metadata, 'sent');
    } catch (err) {
        await logEmail(to, subject, templateType, html, metadata, 'failed', err.message);
        throw err;
    }
}

module.exports = { sendEmail, logEmail, sendAndLog };
