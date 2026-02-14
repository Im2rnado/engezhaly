const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendVerificationEmail } = require('../services/emailService');

const register = async (req, res) => {
    try {
        const { firstName, lastName, username, email, password, role, phoneNumber, businessType, profilePicture, dateOfBirth } = req.body;

        let user = await User.findOne({ $or: [{ email }, { username }] });
        if (user) {
            return res.status(400).json({ message: 'User with this email or username already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const userData = {
            firstName,
            lastName,
            username,
            email,
            password: hashedPassword,
            role,
            phoneNumber
        };

        if (role === 'client') {
            userData.businessType = businessType || 'personal';
        }

        if (role === 'freelancer') {
            userData.freelancerProfile = { status: 'pending' };
            if (profilePicture) {
                userData.freelancerProfile.profilePicture = profilePicture;
            }
            if (dateOfBirth) {
                userData.dateOfBirth = new Date(dateOfBirth);
            }
        }

        user = new User(userData);
        await user.save();

        // Send Verification Email (Async)
        sendVerificationEmail(email, 'dummy-verification-token');

        // Create Token
        const payload = { user: { id: user.id, role: user.role } };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1d' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: {
                        id: user.id,
                        firstName,
                        lastName,
                        email,
                        role,
                        username,
                        freelancerProfile: user.freelancerProfile
                    }
                });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const login = async (req, res) => {
    try {
        const { identifier, password } = req.body; // identifier can be email, username, or phone

        // Check if user exists
        let user = await User.findOne({
            $or: [
                { email: identifier },
                { username: identifier },
                { phoneNumber: identifier }
            ]
        }).select('+password');

        if (!user) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        // Create Token
        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1d' },
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
                        freelancerProfile: user.freelancerProfile
                    }
                });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
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
            // Don't reveal if user exists for security
            return res.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
        }

        // In a real app, you would:
        // 1. Generate a reset token
        // 2. Save it to the user model with expiration
        // 3. Send email with reset link
        // For now, we'll just return a success message

        // TODO: Implement actual password reset email sending
        // const resetToken = crypto.randomBytes(32).toString('hex');
        // user.resetPasswordToken = resetToken;
        // user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        // await user.save();
        // await sendPasswordResetEmail(email, resetToken);

        res.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

module.exports = {
    register,
    login,
    forgotPassword
};
