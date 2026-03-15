const express = require('express');
const router = express.Router();
const authVerified = require('../middleware/authVerified');
const adminAuth = require('../middleware/adminAuth');
const {
    getAnnouncements,
    createAnnouncement,
    getAnnouncementsForFreelancer,
    getUnreadCount,
    markAllAsRead
} = require('../controllers/announcementController');

// Admin only
router.get('/admin', [authVerified, adminAuth], getAnnouncements);
router.post('/admin', [authVerified, adminAuth], createAnnouncement);

// Freelancer
router.get('/', [authVerified], getAnnouncementsForFreelancer);
router.get('/unread-count', [authVerified], getUnreadCount);
router.post('/mark-read', [authVerified], markAllAsRead);

module.exports = router;
