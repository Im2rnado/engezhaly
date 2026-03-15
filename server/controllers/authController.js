const crypto = require('crypto');
const dns = require('dns').promises;
const User = require('../models/User');
const VerificationToken = require('../models/VerificationToken');
const bcrypt = require('bcryptjs');

/** MX lookup: returns true if domain has mail servers */
async function hasValidEmailDomain(email) {
    const domain = (email || '').split('@')[1];
    if (!domain || domain.length < 3) return false;
    try {
        const mx = await dns.resolveMx(domain);
        return mx && mx.length > 0;
    } catch {
        return false;
    }
}
const jwt = require('jsonwebtoken');
const { sendAndLog } = require('../services/mailgunService');
const { verification: verificationTemplate, passwordReset: passwordResetTemplate } = require('../templates/emailTemplates');

const register = async (req, res) => {
    try {
        const { firstName, lastName, username, email, password, role, phoneNumber, businessType, profilePicture, dateOfBirth, clientProfile, category, experienceYears, isStudent, certificates, certifications, universityId, skills, technicalSkills, softSkills, bio, idDocument, surveyResponses, cvUrl, starterPricing, starterOffer, portfolio, signupNotes, city, languages, extraLanguages, withdrawalMethod } = req.body;

        const emailNorm = (email || '').trim().toLowerCase();
        if (!emailNorm) {
            return res.status(400).json({ message: 'Email is required' });
        }
        const hasMX = await hasValidEmailDomain(emailNorm);
        if (!hasMX) {
            return res.status(400).json({ message: 'Email domain does not appear to accept mail. Please use a valid email address.' });
        }
        // Case-insensitive duplicate check (handles legacy mixed-case emails)
        const emailRegex = new RegExp(`^${(emailNorm || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
        let user = await User.findOne({ $or: [{ email: emailRegex }, { username }] });
        if (user) {
            return res.status(400).json({ message: 'User with this email or username already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const userData = {
            firstName,
            lastName,
            username,
            email: emailNorm,
            password: hashedPassword,
            role,
            phoneNumber,
            emailVerified: false
        };

        if (role === 'client') {
            userData.businessType = businessType || 'personal';
            userData.phoneNumber = phoneNumber;
            if (clientProfile && typeof clientProfile === 'object') {
                userData.clientProfile = {};
                if (clientProfile.companyName) userData.clientProfile.companyName = clientProfile.companyName;
                if (clientProfile.companyDescription) userData.clientProfile.companyDescription = clientProfile.companyDescription;
                if (clientProfile.position) userData.clientProfile.position = clientProfile.position;
                if (clientProfile.linkedIn) userData.clientProfile.linkedIn = clientProfile.linkedIn;
                if (clientProfile.instagram) userData.clientProfile.instagram = clientProfile.instagram;
                if (clientProfile.facebook) userData.clientProfile.facebook = clientProfile.facebook;
                if (clientProfile.tiktok) userData.clientProfile.tiktok = clientProfile.tiktok;
                if (clientProfile.profilePicture) userData.clientProfile.profilePicture = clientProfile.profilePicture;
            }
        }

        if (role === 'freelancer') {
            userData.freelancerProfile = { status: 'pending' };
            if (profilePicture) userData.freelancerProfile.profilePicture = profilePicture;
            if (dateOfBirth) userData.dateOfBirth = new Date(dateOfBirth);
            if (phoneNumber) userData.phoneNumber = phoneNumber;
            if (category) userData.freelancerProfile.category = category;
            if (experienceYears !== undefined) userData.freelancerProfile.experienceYears = Number(experienceYears);
            if (isStudent !== undefined) userData.freelancerProfile.isStudent = !!isStudent;
            if (certificates && Array.isArray(certificates)) userData.freelancerProfile.certificates = certificates;
            if (certifications !== undefined && Array.isArray(certifications)) {
                userData.freelancerProfile.certifications = certifications.map(c => ({
                    name: c?.name || '',
                    date: c?.date ? new Date(c.date) : null,
                    institute: c?.institute || '',
                    documentUrl: c?.documentUrl || ''
                }));
            }
            if (universityId) userData.freelancerProfile.universityId = universityId;
            // Prefer technicalSkills/softSkills; fallback to legacy skills
            if (technicalSkills !== undefined) {
                userData.freelancerProfile.technicalSkills = Array.isArray(technicalSkills) ? technicalSkills : (typeof technicalSkills === 'string' ? technicalSkills.trim().split(/\s+/).filter(Boolean) : []);
            }
            if (softSkills !== undefined) {
                userData.freelancerProfile.softSkills = Array.isArray(softSkills) ? softSkills : (typeof softSkills === 'string' ? softSkills.trim().split(/\s+/).filter(Boolean) : []);
            }
            if (skills && !technicalSkills && !softSkills) {
                userData.freelancerProfile.technicalSkills = Array.isArray(skills) ? skills : (typeof skills === 'string' ? skills.trim().split(/\s+/).filter(Boolean) : []);
            }
            if (bio) userData.freelancerProfile.bio = bio;
            if (idDocument) userData.freelancerProfile.idDocument = idDocument;
            if (surveyResponses && typeof surveyResponses === 'object') userData.freelancerProfile.surveyResponses = surveyResponses;
            if (cvUrl && typeof cvUrl === 'string') userData.freelancerProfile.cvUrl = cvUrl.trim();
            if (starterPricing && typeof starterPricing === 'object') userData.freelancerProfile.starterPricing = starterPricing;
            if (starterOffer && typeof starterOffer === 'object') userData.freelancerProfile.starterOffer = starterOffer;
            if (portfolio && Array.isArray(portfolio)) userData.freelancerProfile.portfolio = portfolio;
            if (signupNotes && typeof signupNotes === 'string') userData.freelancerProfile.signupNotes = signupNotes.trim();
            if (city) userData.freelancerProfile.city = city;
            if (languages && typeof languages === 'object') {
                userData.freelancerProfile.languages = {};
                if (languages.english) userData.freelancerProfile.languages.english = languages.english;
                if (languages.arabic) userData.freelancerProfile.languages.arabic = languages.arabic;
            }
            if (extraLanguages && Array.isArray(extraLanguages)) {
                userData.freelancerProfile.extraLanguages = extraLanguages.filter(Boolean).map(String);
            }
        }

        user = new User(userData);
        await user.save();

        // Create withdrawal method for freelancers if provided
        if (role === 'freelancer' && withdrawalMethod && typeof withdrawalMethod === 'object') {
            const { method, phoneNumber: wPhone, accountNumber: wAccount, bankName: wBank } = withdrawalMethod;
            const validMethods = ['instapay', 'vodafone_cash', 'bank'];
            if (method && validMethods.includes(method)) {
                const hasPhone = (method === 'instapay' || method === 'vodafone_cash') && wPhone?.trim();
                const hasBank = method === 'bank' && wAccount?.trim() && wBank?.trim();
                if (hasPhone || hasBank) {
                    try {
                        const WithdrawalMethod = require('../models/WithdrawalMethod');
                        await WithdrawalMethod.create({
                            userId: user._id,
                            method,
                            phoneNumber: hasPhone ? wPhone.trim() : undefined,
                            accountNumber: hasBank ? wAccount.trim() : undefined,
                            bankName: hasBank ? wBank.trim() : undefined,
                            isDefault: true
                        });
                    } catch (wmErr) {
                        console.error('[Auth] Withdrawal method create failed:', wmErr.message);
                    }
                }
            }
        }

        // Generate verification token (24h expiry)
        const token = crypto.randomBytes(32).toString('hex');
        await VerificationToken.create({
            userId: user._id,
            token,
            type: 'email_verification',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });

        // Send verification email (async, don't block response)
        const { subject, html } = verificationTemplate(token);
        sendAndLog(emailNorm, subject, html, 'verification', { userId: user._id }).catch(err => console.error('[Auth] Verification email failed:', err.message));

        // Create JWT
        const payload = { user: { id: user.id, role: user.role } };
        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '30d' },
            (err, authToken) => {
                if (err) throw err;
                res.json({
                    token: authToken,
                    user: {
                        id: user.id,
                        firstName,
                        lastName,
                        email,
                        role,
                        username,
                        emailVerified: false,
                        freelancerProfile: user.freelancerProfile
                    }
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

const login = async (req, res) => {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password || typeof password !== 'string') {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        const identifierStr = String(identifier).trim();
        const isLikelyEmail = identifierStr.includes('@');
        const orConditions = [
            { username: identifierStr },
            { phoneNumber: identifierStr }
        ];
        if (isLikelyEmail) {
            const emailRegex = new RegExp(`^${identifierStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
            orConditions.unshift({ email: emailRegex });
        }
        let user = await User.findOne({ $or: orConditions }).select('+password');

        if (!user) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        if (!user.password) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        if (!user.emailVerified && user.role !== 'admin') {
            return res.status(403).json({
                message: 'Please verify your email before logging in. Check your inbox for the verification link.',
                code: 'EMAIL_NOT_VERIFIED'
            });
        }

        const payload = { user: { id: user.id, role: user.role } };
        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '30d' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: {
                        id: user.id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        role: user.role,
                        username: user.username,
                        emailVerified: user.emailVerified,
                        freelancerProfile: user.freelancerProfile
                    }
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) {
            return res.status(400).json({ msg: 'Verification token is required' });
        }

        const vt = await VerificationToken.findOne({ token, type: 'email_verification' });
        if (!vt) {
            return res.status(400).json({ msg: 'Invalid or expired verification link' });
        }
        if (vt.expiresAt < new Date()) {
            await VerificationToken.deleteOne({ _id: vt._id });
            return res.status(400).json({ msg: 'Verification link has expired' });
        }

        await User.findByIdAndUpdate(vt.userId, { emailVerified: true });
        await VerificationToken.deleteOne({ _id: vt._id });

        res.json({ msg: 'Email verified successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        await VerificationToken.create({
            userId: user._id,
            token,
            type: 'password_reset',
            expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
        });

        const { subject, html } = passwordResetTemplate(token);
        sendAndLog(email, subject, html, 'password_reset', { userId: user._id }).catch(err => console.error('[Auth] Password reset email failed:', err.message));

        res.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return res.status(400).json({ msg: 'Token and new password are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ msg: 'Password must be at least 6 characters' });
        }

        const vt = await VerificationToken.findOne({ token, type: 'password_reset' });
        if (!vt) {
            return res.status(400).json({ msg: 'Invalid or expired reset link' });
        }
        if (vt.expiresAt < new Date()) {
            await VerificationToken.deleteOne({ _id: vt._id });
            return res.status(400).json({ msg: 'Reset link has expired' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        await User.findByIdAndUpdate(vt.userId, { password: hashedPassword });
        await VerificationToken.deleteOne({ _id: vt._id });

        res.json({ msg: 'Password reset successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

module.exports = {
    register,
    login,
    verifyEmail,
    forgotPassword,
    resetPassword
};
