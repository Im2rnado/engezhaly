const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'server/controllers/adminController.js');
let content = fs.readFileSync(filePath, 'utf8');

const getUnverifiedUsersCode = `
const getUnverifiedUsers = async (req, res) => {
    try {
        const users = await User.find({
            emailVerified: false
        }).select('-password').sort({ createdAt: -1 }).lean();
        const withPresence = users.map((u) => ({
            ...u,
            isOnline: u._id ? isUserOnline(req.app, u._id) : false
        }));
        res.json(withPresence);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const resendVerificationEmail = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        if (user.emailVerified) return res.status(400).json({ msg: 'Email is already verified' });

        const crypto = require('crypto');
        const VerificationToken = require('../models/VerificationToken');
        
        await VerificationToken.deleteMany({ userId: user._id, type: 'email_verification' });

        const token = crypto.randomBytes(32).toString('hex');
        await VerificationToken.create({
            userId: user._id,
            token,
            type: 'email_verification',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });

        const { sendAndLog } = require('../services/mailgunService');
        const { verification: verificationTemplate } = require('../templates/emailTemplates');
        
        const { subject, html } = verificationTemplate(token);
        await sendAndLog(user.email, subject, html, 'verification', { userId: user._id });

        res.json({ msg: 'Verification email sent' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
`;

content = content.replace(
    /module\.exports = \{/,
    getUnverifiedUsersCode + '\nmodule.exports = {\n    getUnverifiedUsers,\n    resendVerificationEmail,'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('patched adminController.js');
