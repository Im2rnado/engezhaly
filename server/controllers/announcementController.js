const Announcement = require('../models/Announcement');
const AnnouncementRead = require('../models/AnnouncementRead');

/** Admin: Get all announcements */
const getAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find()
            .populate('createdBy', 'firstName lastName')
            .sort({ createdAt: -1 })
            .lean();
        res.json(announcements);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

/** Admin: Create announcement */
const createAnnouncement = async (req, res) => {
    try {
        const userId = req.user.id;
        const { content, imageUrl } = req.body;

        if (!content?.trim() && !imageUrl?.trim()) {
            return res.status(400).json({ msg: 'Provide at least content or image' });
        }

        const announcement = new Announcement({
            content: (content || '').trim() || undefined,
            imageUrl: (imageUrl || '').trim() || undefined,
            createdBy: userId
        });
        await announcement.save();
        const populated = await Announcement.findById(announcement._id)
            .populate('createdBy', 'firstName lastName')
            .lean();
        res.status(201).json(populated);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

/** Admin: Delete announcement */
const deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const announcement = await Announcement.findByIdAndDelete(id);
        if (!announcement) {
            return res.status(404).json({ msg: 'Announcement not found' });
        }
        await AnnouncementRead.deleteMany({ announcementId: id });
        res.json({ msg: 'Announcement deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

/** Freelancer: Get announcements (for display) */
const getAnnouncementsForFreelancer = async (req, res) => {
    try {
        if (req.user?.role !== 'freelancer') {
            return res.status(403).json({ msg: 'Access denied. Freelancers only.' });
        }
        const announcements = await Announcement.find()
            .populate('createdBy', 'firstName lastName')
            .sort({ createdAt: -1 })
            .lean();
        res.json(announcements);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

/** Freelancer: Get unread count */
const getUnreadCount = async (req, res) => {
    try {
        if (req.user?.role !== 'freelancer') {
            return res.status(403).json({ msg: 'Access denied. Freelancers only.' });
        }
        const userId = req.user.id;
        const total = await Announcement.countDocuments();
        const readCount = await AnnouncementRead.countDocuments({ userId });
        const unread = Math.max(0, total - readCount);
        res.json({ unread });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

/** Freelancer: Mark announcements as read (e.g. when viewing the page) */
const markAllAsRead = async (req, res) => {
    try {
        if (req.user?.role !== 'freelancer') {
            return res.status(403).json({ msg: 'Access denied. Freelancers only.' });
        }
        const userId = req.user.id;
        const announcements = await Announcement.find().select('_id').lean();
        const existing = await AnnouncementRead.find({ userId }).select('announcementId').lean();
        const existingIds = new Set(existing.map(e => String(e.announcementId)));
        const toInsert = announcements
            .filter(a => !existingIds.has(String(a._id)))
            .map(a => ({ userId, announcementId: a._id }));
        if (toInsert.length > 0) {
            await AnnouncementRead.insertMany(toInsert);
        }
        res.json({ msg: 'Marked as read' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

module.exports = {
    getAnnouncements,
    createAnnouncement,
    deleteAnnouncement,
    getAnnouncementsForFreelancer,
    getUnreadCount,
    markAllAsRead
};
