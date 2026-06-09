const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'server/routes/admin.js');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
    /getAllUsers,/,
    'getAllUsers, getUnverifiedUsers, resendVerificationEmail,'
);

content = content.replace(
    /router\.get\('\/users', \[authVerified, adminAuth\], getAllUsers\);/,
    "router.get('/users', [authVerified, adminAuth], getAllUsers);\nrouter.get('/users/unverified', [authVerified, adminAuth], getUnverifiedUsers);\nrouter.post('/users/:id/resend-verification', [authVerified, adminAuth], resendVerificationEmail);"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('patched admin.js');
