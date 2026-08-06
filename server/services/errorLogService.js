const crypto = require('crypto');
const ErrorLog = require('../models/ErrorLog');
const User = require('../models/User');

const limitText = (value, max) => typeof value === 'string' ? value.slice(0, max) : undefined;

const cleanPath = (value, max = 500) => {
    if (typeof value !== 'string') return undefined;
    try {
        const parsed = new URL(value, 'https://engezhaly.local');
        return `${parsed.pathname}${parsed.hash || ''}`.slice(0, max);
    } catch {
        return value.split('?')[0].slice(0, max);
    }
};

function detectClient(userAgent = '') {
    const ua = String(userAgent).slice(0, 1000);
    const browser = /Edg\//i.test(ua) ? 'Edge'
        : /OPR\//i.test(ua) ? 'Opera'
            : /CriOS|Chrome\//i.test(ua) ? 'Chrome'
                : /FxiOS|Firefox\//i.test(ua) ? 'Firefox'
                    : /Safari\//i.test(ua) ? 'Safari' : 'Unknown';
    const os = /Android/i.test(ua) ? 'Android'
        : /iPhone|iPad|iPod/i.test(ua) ? 'iOS'
            : /Windows/i.test(ua) ? 'Windows'
                : /Mac OS X|Macintosh/i.test(ua) ? 'macOS'
                    : /Linux/i.test(ua) ? 'Linux' : 'Unknown';
    const deviceType = /iPad|Tablet/i.test(ua) ? 'tablet'
        : /Mobile|Android|iPhone|iPod/i.test(ua) ? 'mobile'
            : ua ? 'desktop' : 'unknown';
    return { userAgent: ua, browser, os, deviceType };
}

function makeFingerprint(data) {
    return crypto.createHash('sha256').update([
        data.source,
        data.name,
        data.message,
        data.page,
        data.endpoint,
        data.method,
        data.statusCode
    ].map((value) => value || '').join('|')).digest('hex');
}

async function getUserSnapshot(userId) {
    if (!userId) return null;
    const user = await User.findById(userId).select('firstName lastName email role').lean();
    if (!user) return null;
    return {
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        email: user.email,
        role: user.role
    };
}

async function recordError(input = {}) {
    try {
        const client = detectClient(input.userAgent);
        const data = {
            source: ['frontend', 'api', 'server'].includes(input.source) ? input.source : 'server',
            severity: ['warning', 'error', 'critical'].includes(input.severity) ? input.severity : 'error',
            name: limitText(input.name, 150),
            message: limitText(input.message || 'Unknown error', 3000),
            stack: limitText(input.stack, 15000),
            componentStack: limitText(input.componentStack, 10000),
            page: cleanPath(input.page),
            endpoint: cleanPath(input.endpoint),
            method: limitText(input.method, 12),
            statusCode: Number.isInteger(input.statusCode) ? input.statusCode : undefined,
            userId: input.userId || null,
            sessionId: limitText(input.sessionId, 100),
            ...client,
            viewport: input.viewport && Number.isFinite(input.viewport.width) && Number.isFinite(input.viewport.height)
                ? { width: input.viewport.width, height: input.viewport.height } : undefined,
            language: limitText(input.language, 30),
            online: typeof input.online === 'boolean' ? input.online : undefined,
            metadata: input.metadata && typeof input.metadata === 'object' ? input.metadata : undefined
        };
        data.fingerprint = makeFingerprint(data);

        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        const existing = await ErrorLog.findOne({
            fingerprint: data.fingerprint,
            userId: data.userId,
            sessionId: data.sessionId,
            lastSeenAt: { $gte: tenMinutesAgo }
        }).sort({ lastSeenAt: -1 });

        if (existing) {
            existing.count += 1;
            existing.lastSeenAt = new Date();
            if (existing.status === 'resolved') existing.status = 'unresolved';
            await existing.save();
            return existing;
        }

        data.userSnapshot = await getUserSnapshot(data.userId);
        return await ErrorLog.create(data);
    } catch (error) {
        console.error('[ErrorLog] Failed to persist error:', error.message);
        return null;
    }
}

module.exports = { recordError, cleanPath };
