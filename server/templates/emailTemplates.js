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

function paymentReceiptFreelancer(amount, netAmount, fee, title, transactionId, date) {
    const link = `${FRONTEND_URL}/dashboard/freelancer?tab=wallet`;
    const content = `
        <h2 style="margin: 0 0 16px; font-size: 22px; color: #111827;">You Received a Payment</h2>
        <p style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #09BF44;">${amount} EGP</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; color: #4b5563;">
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Job/Order</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${title || 'N/A'}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Platform Fee</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${fee || 0} EGP</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Net Amount</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${netAmount} EGP</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Transaction ID</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${transactionId || 'N/A'}</td></tr>
            <tr><td style="padding: 8px 0;">Date</td><td style="padding: 8px 0; text-align: right;">${date || new Date().toLocaleDateString()}</td></tr>
        </table>
        ${ctaButton('View Transaction Details', link)}
    `;
    return { subject: `You received a payment of ${amount} EGP`, html: wrapEmail(content) };
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

module.exports = {
    verification,
    jobApplication,
    offerPurchased,
    offlineChat,
    paymentReceiptFreelancer,
    paymentReceiptClient,
    depositReceipt,
    passwordReset,
    freelancerApproved,
    disputeResolved
};
