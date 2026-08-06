const mongoose = require('mongoose');

const ErrorLogSchema = new mongoose.Schema({
    fingerprint: { type: String, required: true, index: true },
    source: { type: String, enum: ['frontend', 'api', 'server'], required: true },
    severity: { type: String, enum: ['warning', 'error', 'critical'], default: 'error' },
    name: { type: String, trim: true },
    message: { type: String, required: true, trim: true },
    stack: { type: String },
    componentStack: { type: String },
    page: { type: String, trim: true },
    endpoint: { type: String, trim: true },
    method: { type: String, trim: true, uppercase: true },
    statusCode: { type: Number },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    userSnapshot: {
        name: String,
        email: String,
        role: String
    },
    sessionId: { type: String, trim: true },
    userAgent: { type: String },
    browser: { type: String },
    os: { type: String },
    deviceType: { type: String, enum: ['mobile', 'tablet', 'desktop', 'unknown'], default: 'unknown' },
    viewport: { width: Number, height: Number },
    language: { type: String },
    online: { type: Boolean },
    metadata: { type: mongoose.Schema.Types.Mixed },
    count: { type: Number, default: 1, min: 1 },
    firstSeenAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now, index: true },
    status: { type: String, enum: ['unresolved', 'resolved', 'ignored'], default: 'unresolved', index: true },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt: { type: Date, default: null }
}, { timestamps: true });

ErrorLogSchema.index({ status: 1, lastSeenAt: -1 });
ErrorLogSchema.index({ source: 1, severity: 1, lastSeenAt: -1 });
ErrorLogSchema.index({ fingerprint: 1, userId: 1, page: 1, lastSeenAt: -1 });

module.exports = mongoose.model('ErrorLog', ErrorLogSchema);
