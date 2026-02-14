const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Uploaded files (public)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/engezhaly';
mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/freelancer', require('./routes/freelancer'));
app.use('/api/client', require('./routes/client'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/upload', require('./routes/upload'));

app.get('/', (req, res) => {
    res.send('Engezhaly API is running');
});

// Socket.io
require('./sockets/socketHandler')(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
