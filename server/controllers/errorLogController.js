const ErrorLog = require('../models/ErrorLog');
const { recordError } = require('../services/errorLogService');

const reportError = async (req, res) => {
    const body = req.body || {};
    await recordError({
        source: body.source,
        severity: body.severity,
        name: body.name,
        message: body.message,
        stack: body.stack,
        componentStack: body.componentStack,
        page: body.page,
        endpoint: body.endpoint,
        method: body.method,
        statusCode: Number.isInteger(body.statusCode) ? body.statusCode : undefined,
        userId: req.user?.id,
        sessionId: body.sessionId,
        userAgent: req.get('user-agent'),
        viewport: body.viewport,
        language: body.language,
        online: body.online,
        metadata: {
            release: typeof body.release === 'string' ? body.release.slice(0, 100) : undefined
        }
    });
    res.status(202).json({ accepted: true });
};

const getErrorLogs = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
        const filter = {};
        if (['unresolved', 'resolved', 'ignored'].includes(req.query.status)) filter.status = req.query.status;
        if (['frontend', 'api', 'server'].includes(req.query.source)) filter.source = req.query.source;
        if (['warning', 'error', 'critical'].includes(req.query.severity)) filter.severity = req.query.severity;
        if (req.query.search) {
            const search = String(req.query.search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            filter.$or = [
                { message: { $regex: search, $options: 'i' } },
                { page: { $regex: search, $options: 'i' } },
                { endpoint: { $regex: search, $options: 'i' } },
                { 'userSnapshot.email': { $regex: search, $options: 'i' } },
                { 'userSnapshot.name': { $regex: search, $options: 'i' } }
            ];
        }
        const [logs, total] = await Promise.all([
            ErrorLog.find(filter).sort({ lastSeenAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
            ErrorLog.countDocuments(filter)
        ]);
        res.json({ logs, total, page, pages: Math.max(Math.ceil(total / limit), 1) });
    } catch (error) {
        res.status(500).json({ msg: 'Failed to load error logs' });
    }
};

const getErrorStats = async (req, res) => {
    try {
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const [total, unresolved, critical, last24Hours] = await Promise.all([
            ErrorLog.countDocuments(),
            ErrorLog.countDocuments({ status: 'unresolved' }),
            ErrorLog.countDocuments({ status: 'unresolved', severity: 'critical' }),
            ErrorLog.countDocuments({ lastSeenAt: { $gte: dayAgo } })
        ]);
        res.json({ total, unresolved, critical, last24Hours });
    } catch {
        res.status(500).json({ msg: 'Failed to load error statistics' });
    }
};

const updateErrorStatus = async (req, res) => {
    try {
        const status = req.body?.status;
        if (!['unresolved', 'resolved', 'ignored'].includes(status)) {
            return res.status(400).json({ msg: 'Invalid error status' });
        }
        const update = { status };
        if (status === 'unresolved') {
            update.resolvedAt = null;
            update.resolvedBy = null;
        } else {
            update.resolvedAt = new Date();
            update.resolvedBy = req.user.id;
        }
        const log = await ErrorLog.findByIdAndUpdate(req.params.id, update, { new: true }).lean();
        if (!log) return res.status(404).json({ msg: 'Error log not found' });
        res.json(log);
    } catch {
        res.status(500).json({ msg: 'Failed to update error status' });
    }
};

module.exports = { reportError, getErrorLogs, getErrorStats, updateErrorStatus };
