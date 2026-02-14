const nodemailer = require('nodemailer');

// Mock Transport for Dev
// In production, use SendGrid or similar
const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal_password'
    }
});

const sendEmail = async (to, subject, html) => {
    try {
        const info = await transporter.sendMail({
            from: '"Engezhaly Platform" <no-reply@engezhaly.com>',
            to,
            subject,
            html
        });
        console.log('Email sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        // Don't throw error to avoid breaking main flow, just log it
    }
};

const sendVerificationEmail = (email, token) => {
    const link = `http://localhost:3000/verify?token=${token}`;
    const html = `
    <h1>Welcome to Engezhaly!</h1>
    <p>Please verify your account by clicking the link below:</p>
    <a href="${link}" style="background:#09BF44; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;">Verify Account</a>
  `;
    return sendEmail(email, 'Verify your Engezhaly account', html);
};

const sendJobApplicationEmail = (clientEmail, jobTitle, freelancerName) => {
    const html = `
    <h1>New Application for ${jobTitle}</h1>
    <p>${freelancerName} has applied to your job.</p>
    <a href="http://localhost:3000/dashboard/client" style="background:#09BF44; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;">View Application</a>
  `;
    return sendEmail(clientEmail, `New application for your job: ${jobTitle}`, html);
}

module.exports = {
    sendVerificationEmail,
    sendJobApplicationEmail
};
