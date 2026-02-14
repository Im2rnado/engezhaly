const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { updateProfile, getProfile, getPublicProfile, getTopFreelancers } = require('../controllers/freelancerController');

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

module.exports = router;
