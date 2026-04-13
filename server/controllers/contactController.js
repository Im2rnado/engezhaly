const { sendAndLog } = require('../services/mailgunService');
const { wrapEmail } = require('../templates/emailBase');

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@engezhaly.com';

function escapeHtml(s) {
    if (s == null || typeof s !== 'string') return '';
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function isValidEmail(email) {
    const t = String(email || '').trim();
    if (!t || t.length > 254) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

/**
 * POST /api/contact — public contact form; emails support via Mailgun (sendAndLog).
 */
const submitContact = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body || {};

        const nameTrim = String(name || '').trim();
        const emailTrim = String(email || '').trim().toLowerCase();
        const subjectTrim = String(subject || '').trim();
        const messageTrim = String(message || '').trim();

        if (!nameTrim || nameTrim.length > 120) {
            return res.status(400).json({ msg: 'Please enter your name (max 120 characters).' });
        }
        if (!isValidEmail(emailTrim)) {
            return res.status(400).json({ msg: 'Please enter a valid email address.' });
        }
        if (!subjectTrim || subjectTrim.length > 200) {
            return res.status(400).json({ msg: 'Please enter a subject (max 200 characters).' });
        }
        if (!messageTrim || messageTrim.length > 8000) {
            return res.status(400).json({ msg: 'Please enter a message (max 8000 characters).' });
        }

        const inner = `
            <h2 style="margin: 0 0 16px; font-size: 20px; color: #111827;">New message from the website</h2>
            <p style="margin: 0 0 8px; font-size: 14px; color: #374151;"><strong>Name:</strong> ${escapeHtml(nameTrim)}</p>
            <p style="margin: 0 0 8px; font-size: 14px; color: #374151;"><strong>Email:</strong> <a href="mailto:${escapeHtml(emailTrim)}" style="color: #09BF44;">${escapeHtml(emailTrim)}</a></p>
            <p style="margin: 0 0 16px; font-size: 14px; color: #374151;"><strong>Subject:</strong> ${escapeHtml(subjectTrim)}</p>
            <div style="padding: 16px; background: #f9fafb; border-radius: 10px; border: 1px solid #e5e7eb;">
                <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; color: #6b7280; text-transform: uppercase;">Message</p>
                <p style="margin: 0; font-size: 14px; color: #111827; white-space: pre-wrap; line-height: 1.6;">${escapeHtml(messageTrim)}</p>
            </div>
        `;
        const html = wrapEmail(inner, { preheader: `Contact: ${subjectTrim.slice(0, 80)}` });

        const mailSubject = `[Engezhaly Contact] ${subjectTrim}`;

        await sendAndLog(SUPPORT_EMAIL, mailSubject, html, 'contact_form', {
            fromEmail: emailTrim,
            fromName: nameTrim
        });

        res.json({ msg: 'Thanks — your message has been sent. We will get back to you soon.' });
    } catch (err) {
        console.error('[Contact]', err.message);
        res.status(500).json({ msg: 'Could not send your message right now. Please try again or email us directly.' });
    }
};

module.exports = { submitContact };
