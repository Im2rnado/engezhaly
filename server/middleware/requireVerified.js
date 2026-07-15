const User = require('../models/User');

/**
 * Requires freelancers to have verified their email. Use after auth middleware.
 * Clients and admins are exempt.
 */
module.exports = async function (req, res, next) {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }
    try {
        const user = await User.findById(req.user.id).select('emailVerified role');
        if (!user) {
            return res.status(401).json({ msg: 'User not found' });
        }
        // Clients can use the platform immediately. Email verification remains
        // required for freelancers, whose accounts also go through approval.
        if (user.role === 'admin' || user.role === 'client') {
            return next();
        }
        if (!user.emailVerified) {
            return res.status(403).json({
                msg: 'Please verify your email to access this feature',
                code: 'EMAIL_NOT_VERIFIED'
            });
        }
        next();
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
};
