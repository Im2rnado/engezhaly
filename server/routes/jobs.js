const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createJob, getJobs, applyToJob } = require('../controllers/jobController');

// @route   POST api/jobs
// @desc    Create a new job post
// @access  Private (Client)
router.post('/', auth, createJob);

// @route   GET api/jobs
// @desc    Get all jobs
// @access  Public (or Private)
router.get('/', getJobs);

// @route   POST api/jobs/:id/apply
// @desc    Apply to a job
// @access  Private (Freelancer)
router.post('/:id/apply', auth, applyToJob);

module.exports = router;
