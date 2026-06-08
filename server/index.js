const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

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

const io = new Server(server, {
    cors: {
        origin: ["https://engezhaly.com", "https://www.engezhaly.com", "http://localhost:3000"],
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
    }
});

// CORS Middleware (Global - absolute top)
app.use(cors({
    origin: true, // Allow any origin temporarily to debug, or provide your array
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-auth-token", "Authorization"]
}));

// Middleware
// 15MB limit for JSON (registration sends base64 profile picture + certificates)
app.use(express.json({ limit: '15mb' }));

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
app.use('/api/auth', require('./routes/auth'));
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

// Socket.io - make io available to routes (e.g. chatController)
app.set('io', io);
require('./sockets/socketHandler')(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
