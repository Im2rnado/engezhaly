const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { updateProfile, getProfile, getPublicProfile, getTopFreelancers, getMyOrders, submitOrderWork } = require('../controllers/freelancerController');

// @route   PUT api/freelancer/profile
// @desc    Update freelancer profile (onboarding steps)
// @access  Private (Freelancer only)
router.put('/profile', auth, updateProfile);

// @route   GET api/freelancer/profile
// @desc    Get current freelancer profile
// @access  Private
router.get('/profile', auth, getProfile);

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
router.get('/orders', auth, getMyOrders);

// @route   POST api/freelancer/orders/:id/submit-work
// @desc    Submit work for a freelancer project order
// @access  Private (Freelancer)
router.post('/orders/:id/submit-work', auth, submitOrderWork);

module.exports = router;
