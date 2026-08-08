const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required; refusing to start with an insecure signing key');
}

const app = express();
const server = http.createServer(app);
// Sync Models at startup (registers with mongoose global instance)
require('./models/User');
require('./models/Project');
require('./models/Job');
require('./models/Order');
require('./models/Offer');
require('./models/Sequence');
require('./models/Conversation');
require('./models/Chat');
require('./models/Transaction');
require('./models/EmailLog');
require('./models/Announcement');
require('./models/AnnouncementRead');
require('./models/ErrorLog');

const io = new Server(server, {
    cors: {
        origin: ["https://engezhaly.com", "https://www.engezhaly.com", "http://localhost:3000"],
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
    }
});

const allowedOrigins = new Set([
    'https://engezhaly.com',
    'https://www.engezhaly.com',
    'http://localhost:3000',
    'http://localhost:3001',
    ...(process.env.CORS_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean)
]);

// CORS Middleware (Global - absolute top)
app.use(cors({
    origin(origin, callback) {
        // Requests without Origin include same-origin/server-to-server clients.
        if (!origin || allowedOrigins.has(origin)) return callback(null, true);
        return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-auth-token", "Authorization"]
}));

// Error reports have a deliberately small parser limit. Mount this before the
// larger upload-compatible JSON parser so anonymous clients cannot send 30 MB
// diagnostic bodies before rate limiting is applied.
app.use('/api/errors', require('./routes/errors'));

// Middleware
// Allow 20MB files plus base64 encoding overhead during registration.
app.use(express.json({ limit: '30mb' }));

const rateLimit = require('express-rate-limit');
app.set('trust proxy', 1); // Trust first proxy (NGINX/Cloudflare)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5000, // Limit each IP to 5000 requests per `window` (here, per 15 minutes)
    standardHeaders: true,
    legacyHeaders: false,
    message: { msg: 'Too many requests from this IP, please try again after 15 minutes' }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // Limit each IP to 30 auth requests per `window`
    standardHeaders: true,
    legacyHeaders: false,
    message: { msg: 'Too many authentication attempts, please try again after 15 minutes' }
});

// Apply general rate limiter to all requests
app.use(limiter);

// Controllers sometimes return a 500 response after handling an exception. Capture those too.
app.use((req, res, next) => {
    res.on('finish', () => {
        if (res.statusCode < 500 || res.locals.errorAlreadyLogged || req.originalUrl.startsWith('/api/errors/report')) return;
        const { recordError } = require('./services/errorLogService');
        recordError({
            source: 'server',
            severity: res.statusCode >= 503 ? 'critical' : 'error',
            name: 'HttpError',
            message: `HTTP ${res.statusCode} ${req.method} ${req.path}`,
            endpoint: req.originalUrl,
            method: req.method,
            statusCode: res.statusCode,
            userId: req.user?.id,
            userAgent: req.get('user-agent')
        });
    });
    next();
});

const auth = require('./middleware/auth');
const adminAuth = require('./middleware/adminAuth');

// Uploaded files (public)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Secure uploads (admin only)
app.use('/secure-uploads', auth, adminAuth, express.static(path.join(__dirname, 'secure_uploads')));

// Database Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/engezhaly';
const mongooseOptions = {
    serverSelectionTimeoutMS: 10000, // 10 second timeout per attempt as requested
    socketTimeoutMS: 45000,
    family: 4 // Use IPv4 for Atlas stability
};

const connectWithRetry = () => {
    console.log('[MongoDB] Attempting to connect...');
    mongoose.connect(MONGO_URI, mongooseOptions)
        .then(() => {
            console.log('MongoDB connected successfully');
            // Non-blocking migration
            const User = mongoose.model('User');
            User.updateMany(
                { $or: [{ emailVerified: { $exists: false } }, { emailVerified: null }] },
                { $set: { emailVerified: true } }
            ).then(r => {
                if (r.modifiedCount > 0) console.log(`[Migration] Set emailVerified for ${r.modifiedCount} existing users`);
            }).catch(err => console.error('[Migration] Failed:', err.message));
        })
        .catch(err => {
            console.error('MongoDB connection error. Retrying in 5 seconds...', err.message);
            setTimeout(connectWithRetry, 5000);
        });
};

connectWithRetry();

// Routes
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/freelancer', require('./routes/freelancer'));
app.use('/api/client', require('./routes/client'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/webhooks', require('./routes/webhooks'));
app.use('/api/payment-methods', require('./routes/paymentMethods'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/withdrawal-methods', require('./routes/withdrawalMethods'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/contact', require('./routes/contact'));

app.get('/', (req, res) => {
    res.send('Engezhaly API is running');
});

// Keep unexpected server failures visible to admins without exposing internals to visitors.
app.use((err, req, res, next) => {
    const { recordError } = require('./services/errorLogService');
    res.locals.errorAlreadyLogged = true;
    recordError({
        source: 'server',
        severity: 'critical',
        name: err.name,
        message: err.message,
        stack: err.stack,
        endpoint: req.originalUrl,
        method: req.method,
        statusCode: err.status || 500,
        userId: req.user?.id,
        userAgent: req.get('user-agent')
    });
    if (res.headersSent) return next(err);
    res.status(err.status || 500).json({ msg: 'Server Error' });
});

// Socket.io - make io available to routes (e.g. chatController)
app.set('io', io);
require('./sockets/socketHandler')(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
