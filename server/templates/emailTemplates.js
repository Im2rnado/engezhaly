const { wrapEmail, ctaButton, FRONTEND_URL } = require('./emailBase');

function verification(token) {
    const link = `${FRONTEND_URL}/verify?token=${token}`;
    const content = `
        <h2 style="margin: 0 0 16px; font-size: 22px; color: #111827;">Welcome to Engezhaly!</h2>
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #4b5563;">
            Thanks for signing up. Please verify your email address to get full access to your account.
        </p>
        <p style="margin: 0 0 16px; font-size: 14px; color: #6b7280;">
            This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
        </p>
        ${ctaButton('Verify Account', link)}
    `;
    return { subject: 'Verify your Engezhaly account', html: wrapEmail(content) };
}

function jobApplication(jobTitle, freelancerName, freelancerBio, jobId) {
    const link = `${FRONTEND_URL}/dashboard/client/jobs/${jobId}`;
    const bio = freelancerBio ? freelancerBio.substring(0, 100) + (freelancerBio.length > 100 ? '...' : '') : 'No bio provided';
    const content = `
        <h2 style="margin: 0 0 16px; font-size: 22px; color: #111827;">New Application for Your Job</h2>
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #4b5563;">
            <strong>${freelancerName}</strong> has applied to your job: <strong>${jobTitle}</strong>
        </p>
        <p style="margin: 0 0 16px; font-size: 14px; color: #6b7280; background: #f9fafb; padding: 12px; border-radius: 8px;">
            ${bio}
        </p>
        ${ctaButton('View Application', link)}
    `;
    return { subject: `New application for your job: ${jobTitle}`, html: wrapEmail(content) };
}

function offerPurchased(clientName, offerTitle, amount, orderId) {
    const link = `${FRONTEND_URL}/dashboard/freelancer?tab=orders`;
    const content = `
        <h2 style="margin: 0 0 16px; font-size: 22px; color: #111827;">Your Offer Has Been Purchased!</h2>
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #4b5563;">
            <strong>${clientName}</strong> has purchased your offer: <strong>${offerTitle}</strong>
        </p>
        <p style="margin: 0 0 16px; font-size: 16px; color: #111827;">
            Amount: <strong>${amount} EGP</strong>
        </p>
        <p style="margin: 0 0 16px; font-size: 14px; color: #6b7280;">
            You can now start the work and communicate with your client via chat.
        </p>
        ${ctaButton('View Order', link)}
    `;
    return { subject: 'Your offer has been purchased!', html: wrapEmail(content) };
}

function offlineChat(senderName, messagePreview, conversationId) {
    const link = `${FRONTEND_URL}/chat?conversation=${conversationId}`;
    const preview = messagePreview || 'New message';
    const content = `
        <h2 style="margin: 0 0 16px; font-size: 22px; color: #111827;">New Message from ${senderName}</h2>
        <p style="margin: 0 0 16px; font-size: 14px; color: #6b7280; background: #f9fafb; padding: 12px; border-radius: 8px;">
            ${preview}
        </p>
        ${ctaButton('Open Chat', link)}
    `;
    return { subject: `New message from ${senderName}`, html: wrapEmail(content) };
}

/** @param {number} grossAmount - Client order / proposal total before platform fee */
/** @param {number} netAmount - Amount credited to freelancer wallet */
/** @param {number} fee - Platform fee deducted */
/** @param {string} title - Job or project title (not Mongo id) */
function paymentReceiptFreelancer(grossAmount, netAmount, fee, title, transactionId, date) {
    const link = `${FRONTEND_URL}/dashboard/freelancer?tab=wallet`;
    const safeTitle = (title && String(title).trim()) || 'Your work';
    const gross = Number(grossAmount) || 0;
    const net = Number(netAmount) || 0;
    const feeNum = Number(fee) || 0;
    const content = `
        <h2 style="margin: 0 0 16px; font-size: 22px; color: #111827;">You Received a Payment</h2>
        <p style="margin: 0 0 8px; font-size: 24px; font-weight: 700; color: #09BF44;">${net} EGP</p>
        <p style="margin: 0 0 16px; font-size: 14px; color: #6b7280;">Credited to your wallet (after platform fee).</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; color: #4b5563;">
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Job / order</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${safeTitle}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Order total</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${gross} EGP</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Platform fee</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${feeNum} EGP</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Net credited</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${net} EGP</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Transaction ID</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${transactionId || 'N/A'}</td></tr>
            <tr><td style="padding: 8px 0;">Date</td><td style="padding: 8px 0; text-align: right;">${date || new Date().toLocaleDateString()}</td></tr>
        </table>
        ${ctaButton('View Transaction Details', link)}
    `;
    return { subject: `Payment released: ${net} EGP net for ${safeTitle}`, html: wrapEmail(content) };
}

function paymentReceiptClient(amount, title, transactionId, date) {
    const link = `${FRONTEND_URL}/dashboard/client?tab=wallet`;
    const content = `
        <h2 style="margin: 0 0 16px; font-size: 22px; color: #111827;">Payment Sent</h2>
        <p style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #111827;">${amount} EGP</p>
        <p style="margin: 0 0 16px; font-size: 16px; color: #4b5563;">For: <strong>${title || 'Order'}</strong></p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; color: #4b5563;">
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Transaction ID</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${transactionId || 'N/A'}</td></tr>
            <tr><td style="padding: 8px 0;">Date</td><td style="padding: 8px 0; text-align: right;">${date || new Date().toLocaleDateString()}</td></tr>
        </table>
        ${ctaButton('View Transaction Details', link)}
    `;
    return { subject: `Payment sent – ${amount} EGP for ${title || 'Order'}`, html: wrapEmail(content) };
}

function passwordReset(token) {
    const link = `${FRONTEND_URL}/reset-password?token=${token}`;
    const content = `
        <h2 style="margin: 0 0 16px; font-size: 22px; color: #111827;">Password Reset Request</h2>
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #4b5563;">
            You requested a password reset for your Engezhaly account. Click the button below to set a new password.
        </p>
        <p style="margin: 0 0 16px; font-size: 14px; color: #6b7280;">
            This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
        </p>
        ${ctaButton('Reset Password', link)}
    `;
    return { subject: 'Password reset request for Engezhaly', html: wrapEmail(content) };
}

function freelancerApproved() {
    const link = `${FRONTEND_URL}/dashboard/freelancer`;
    const content = `
        <h2 style="margin: 0 0 16px; font-size: 22px; color: #111827;">Congratulations! Your Profile is Now Live</h2>
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #4b5563;">
            Your freelancer profile has been approved. You can now apply to jobs and receive offers from clients.
        </p>
        ${ctaButton('Go to Dashboard', link)}
    `;
    return { subject: 'Congratulations! Your profile is now live', html: wrapEmail(content) };
}

function depositReceipt(amount, transactionId, date) {
    const link = `${FRONTEND_URL}/dashboard/client?tab=wallet`;
    const content = `
        <h2 style="margin: 0 0 16px; font-size: 22px; color: #111827;">Wallet Top-up Confirmed</h2>
        <p style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #09BF44;">${amount} EGP</p>
        <p style="margin: 0 0 16px; font-size: 14px; color: #4b5563;">Added to your Engezhaly wallet.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; color: #4b5563;">
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Transaction ID</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${transactionId || 'N/A'}</td></tr>
            <tr><td style="padding: 8px 0;">Date</td><td style="padding: 8px 0; text-align: right;">${date || new Date().toLocaleDateString()}</td></tr>
        </table>
        ${ctaButton('View Transaction Details', link)}
    `;
    return { subject: `Wallet top-up: ${amount} EGP added`, html: wrapEmail(content) };
}

function orderApproved(clientName, offerTitle, amount, orderId) {
    const link = `${FRONTEND_URL}/dashboard/client?tab=orders`;
    const content = `
        <h2 style="margin: 0 0 16px; font-size: 22px; color: #111827;">Order Approved</h2>
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #4b5563;">
            Hi ${clientName}, your order for <strong>${offerTitle}</strong> has been approved by the freelancer.
        </p>
        <p style="margin: 0 0 16px; font-size: 16px; color: #111827;">
            Amount: <strong>${amount} EGP</strong>
        </p>
        <p style="margin: 0 0 16px; font-size: 14px; color: #6b7280;">
            The freelancer can now start working. You can communicate via chat.
        </p>
        ${ctaButton('View Order', link)}
    `;
    return { subject: 'Your order has been approved', html: wrapEmail(content) };
}

function orderDenied(clientName, offerTitle, amount, orderId) {
    const link = `${FRONTEND_URL}/dashboard/client?tab=orders`;
    const content = `
        <h2 style="margin: 0 0 16px; font-size: 22px; color: #111827;">Order Denied</h2>
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #4b5563;">
            Hi ${clientName}, the freelancer has declined your order for <strong>${offerTitle}</strong>.
        </p>
        <p style="margin: 0 0 16px; font-size: 16px; color: #111827;">
            Amount refunded: <strong>${amount} EGP</strong> (returned to your wallet)
        </p>
        <p style="margin: 0 0 16px; font-size: 14px; color: #6b7280;">
            You can browse other offers or contact the freelancer to discuss.
        </p>
        ${ctaButton('View Dashboard', link)}
    `;
    return { subject: 'Your order was declined', html: wrapEmail(content) };
}

function disputeResolved(title, outcome, orderId) {
    const link = `${FRONTEND_URL}/dashboard/client?tab=orders`;
    const content = `
        <h2 style="margin: 0 0 16px; font-size: 22px; color: #111827;">Dispute Resolved</h2>
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #4b5563;">
            The dispute for <strong>${title || 'your order'}</strong> has been resolved.
        </p>
        <p style="margin: 0 0 16px; font-size: 14px; color: #6b7280; background: #f9fafb; padding: 12px; border-radius: 8px;">
            ${outcome || 'Please check your dashboard for details.'}
        </p>
        ${ctaButton('View Details', link)}
    `;
    return { subject: `Dispute resolved: ${title || 'Order'}`, html: wrapEmail(content) };
}

/**
 * @param {string} reviewLink - Deep link (order or job page). Falls back to client orders tab.
 * @param {{ milestoneName?: string }} [opts] - If set, email describes a milestone delivery.
 */
function workSubmitted(clientName, freelancerName, title, reviewLink, opts = {}) {
    const link = reviewLink || `${FRONTEND_URL}/dashboard/client?tab=orders`;
    const milestoneName = typeof opts.milestoneName === 'string' ? opts.milestoneName.trim() : '';
    const heading = milestoneName ? 'Milestone Submitted for Your Review' : 'Work Submitted for Your Review';
    const mainLine = milestoneName
        ? `Hi ${clientName}, <strong>${freelancerName}</strong> has submitted milestone <strong>${milestoneName}</strong> for your job <strong>${title}</strong>.`
        : `Hi ${clientName}, <strong>${freelancerName}</strong> has submitted the work for <strong>${title}</strong>.`;
    const subject = milestoneName
        ? `Milestone submitted: ${milestoneName} — ${title}`
        : `Work submitted for: ${title}`;
    const content = `
        <h2 style="margin: 0 0 16px; font-size: 22px; color: #111827;">${heading}</h2>
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #4b5563;">
            ${mainLine}
        </p>
        <p style="margin: 0 0 16px; font-size: 14px; color: #6b7280;">
            Please review the submission in your dashboard. You can approve it to release the payment or request revisions.
        </p>
        ${ctaButton('Review Submission', link)}
    `;
    return { subject, html: wrapEmail(content) };
}

function bundlePurchased(freelancerName, clientName, bundleType, amount) {
    const link = `${FRONTEND_URL}/dashboard/freelancer?tab=orders`;
    const content = `
        <h2 style="margin: 0 0 16px; font-size: 22px; color: #111827;">New Bundle Order Received!</h2>
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #4b5563;">
            Hi ${freelancerName}, <strong>${clientName}</strong> has purchased your <strong>${bundleType}</strong> bundle.
        </p>
        <p style="margin: 0 0 16px; font-size: 16px; color: #111827;">
            Amount: <strong>${amount} EGP</strong>
        </p>
        <p style="margin: 0 0 16px; font-size: 14px; color: #6b7280;">
            The client will provide details in the chat. You can now start the work.
        </p>
        ${ctaButton('View Order', link)}
    `;
    return { subject: `New ${bundleType} bundle order!`, html: wrapEmail(content) };
}

function jobProposalRejected(clientName, jobTitle, jobId) {
    const link = `${FRONTEND_URL}/dashboard/freelancer/jobs`;
    const content = `
        <h2 style="margin: 0 0 16px; font-size: 22px; color: #111827;">Job proposal not selected</h2>
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #4b5563;">
            <strong>${clientName}</strong> has declined your proposal for the job: <strong>${jobTitle || 'Posted job'}</strong>.
        </p>
        <p style="margin: 0 0 16px; font-size: 14px; color: #6b7280;">
            You can keep browsing jobs and send proposals to other clients.
        </p>
        ${ctaButton('View my jobs', link)}
    `;
    return { subject: `Update on your proposal: ${jobTitle || 'Job'}`, html: wrapEmail(content) };
}

/** Admin alert: conversation auto-frozen after phone-like pattern in chat text */
function chatFrozenPhoneAdminAlert(conversationId, senderLine, receiverLine, adminChatsUrl) {
    const content = `
        <h2 style="margin: 0 0 16px; font-size: 22px; color: #111827;">Chat auto-frozen (phone policy)</h2>
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #4b5563;">
            A conversation was <strong>frozen automatically</strong> because a message matched the phone-number policy. The message was redacted in the thread.
        </p>
        <p style="margin: 0 0 8px; font-size: 14px; color: #374151;"><strong>Conversation ID</strong><br/><code style="background:#f3f4f6;padding:4px 8px;border-radius:6px;">${conversationId}</code></p>
        <p style="margin: 0 0 8px; font-size: 14px; color: #374151;"><strong>Sender of flagged message</strong><br/>${senderLine}</p>
        <p style="margin: 0 0 16px; font-size: 14px; color: #374151;"><strong>Other participant</strong><br/>${receiverLine}</p>
        ${ctaButton('Review in admin', adminChatsUrl)}
    `;
    return {
        subject: `[Engezhaly] Chat frozen — phone detected · ${conversationId}`,
        html: wrapEmail(content)
    };
}

function paymentConfirmed(userName, amount, type, title) {
    const link = `${FRONTEND_URL}/dashboard/${userName.includes('Client') ? 'client' : 'freelancer'}?tab=wallet`;
    const content = `
        <h2 style="margin: 0 0 16px; font-size: 22px; color: #111827;">Payment Confirmed</h2>
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #4b5563;">
            Hi ${userName}, your payment of <strong>${amount} EGP</strong> for <strong>${title || type}</strong> has been confirmed.
        </p>
        <p style="margin: 0 0 16px; font-size: 14px; color: #6b7280;">
            Wait for the freelancer to start the work or check your dashboard for updates.
        </p>
        ${ctaButton('View Wallet', link)}
    `;
    return { subject: 'Payment confirmed successfully', html: wrapEmail(content) };
}

function adminSystemAlert(subjectTitle, heading, messageHtml, linkText = null, linkUrl = null) {
    let buttonHtml = '';
    if (linkText && linkUrl) {
        buttonHtml = ctaButton(linkText, linkUrl);
    }
    const content = `
        <h2 style="margin: 0 0 16px; font-size: 22px; color: #111827;">${heading}</h2>
        <div style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #4b5563;">
            ${messageHtml}
        </div>
        ${buttonHtml}
    `;
    return { subject: `[Admin Alert] ${subjectTitle}`, html: wrapEmail(content) };
}

module.exports = {
    verification,
    jobApplication,
    jobProposalRejected,
    offerPurchased,
    offlineChat,
    paymentReceiptFreelancer,
    paymentReceiptClient,
    depositReceipt,
    passwordReset,
    freelancerApproved,
    disputeResolved,
    orderApproved,
    orderDenied,
    workSubmitted,
    bundlePurchased,
    paymentConfirmed,
    chatFrozenPhoneAdminAlert,
    adminSystemAlert
};
