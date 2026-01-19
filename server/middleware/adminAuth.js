module.exports = function (req, res, next) {
    // Check if user exists and is admin
    // This middleware assumes 'auth' middleware has already run and populated req.user
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ msg: 'Access denied. Admin only.' });
    }
};
