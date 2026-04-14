const express = require('express');
const router = express.Router();
const authVerified = require('../middleware/authVerified');
const auth = require('../middleware/auth');
const { updateProfile, getProfile, getPublicProfile, getReviewStats, getReviews, getTopFreelancers, getMyOrders, getOrderById, submitOrderWork, submitOrderMilestoneWork, raiseDispute, approveOrder, denyOrder, submitMilestoneWork, getActiveJobWithClientForChat } = require('../controllers/freelancerController');

// @route   PUT api/freelancer/profile
// @desc    Update freelancer profile (onboarding steps) - auth only, no email verification required
// @access  Private (Freelancer only)
router.put('/profile', auth, updateProfile);

// @route   GET api/freelancer/profile
// @desc    Get current freelancer profile
// @access  Private
router.get('/profile', authVerified, getProfile);

// @route   GET api/freelancer/review-stats/:sellerId
// @desc    Aggregate rating + review count (public)
router.get('/review-stats/:sellerId', getReviewStats);

// @route   GET api/freelancer/:id/reviews
// @desc    Get completed order reviews for a freelancer (public)
// @access  Public
router.get('/:id/reviews', getReviews);

// @route   GET api/freelancer/:id/public
// @desc    Get public freelancer profile
// @access  Public
router.get('/:id/public', getPublicProfile);

// @route   GET api/freelancer/top
// @desc    Get top freelancers (public)
// @access  Public
router.get('/top', getTopFreelancers);

// @route   GET api/freelancer/orders
// @desc    Get freelancer orders
// @access  Private (Freelancer)
router.get('/orders', authVerified, getMyOrders);
router.get('/orders/:id', authVerified, getOrderById);

// @route   GET api/freelancer/chat-active-job/:clientId
// @desc    In-progress job with this client (for chat banner)
// @access  Private (Freelancer)
router.get('/chat-active-job/:clientId', authVerified, getActiveJobWithClientForChat);

// @route   POST api/freelancer/orders/:id/submit-work
// @desc    Submit work for a freelancer project order
// @access  Private (Freelancer)
router.post('/orders/:id/submit-work', authVerified, submitOrderWork);
router.post('/orders/:id/milestones/:milestoneIdx/submit-work', authVerified, submitOrderMilestoneWork);
router.post('/orders/:id/dispute', authVerified, raiseDispute);
router.patch('/orders/:id/approve', authVerified, approveOrder);
router.patch('/orders/:id/deny', authVerified, denyOrder);

// @route   POST api/freelancer/jobs/:jobId/milestones/:milestoneIdx/submit
// @desc    Submit work for a specific milestone in a job proposal
// @access  Private (Freelancer)
router.post('/jobs/:jobId/milestones/:milestoneIdx/submit', authVerified, submitMilestoneWork);

module.exports = router;
