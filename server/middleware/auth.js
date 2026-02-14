const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const log = (data) => {
    try {
        fs.appendFileSync('c:\\Users\\DELL\\Desktop\\webicco\\engezhaly\\code\\.cursor\\debug.log', JSON.stringify(data) + '\n');
    } catch (e) { }
};

module.exports = function (req, res, next) {
    const token = req.header('x-auth-token');
    // #region agent log
    log({ location: 'server/middleware/auth.js:12', message: 'Auth Middleware called', data: { url: req.originalUrl, hasToken: !!token }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: '1' });
    // #endregion

    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = decoded.user;
        next();
    } catch (err) {
        // #region agent log
        log({ location: 'server/middleware/auth.js:23', message: 'Token verification failed', data: { error: err.message }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: '1' });
        // #endregion
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
