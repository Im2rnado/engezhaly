const express = require('express');
const router = express.Router();
const authVerified = require('../middleware/authVerified');
const optionalAuth = require('../middleware/optionalAuth');
const { createJob, getJobs, applyToJob, getFreelancerJobs, submitWork } = require('../controllers/jobController');

// @route   POST api/jobs
// @desc    Create a new job post
// @access  Private (Client)
router.post('/', authVerified, createJob);

// @route   GET api/jobs
// @desc    Get all jobs (optional auth for hasApplied when freelancer)
// @access  Public
router.get('/', optionalAuth, getJobs);

// @route   POST api/jobs/:id/apply
// @desc    Apply to a job
// @access  Private (Freelancer)
router.post('/:id/apply', authVerified, applyToJob);

// @route   GET api/jobs/freelancer/my-jobs
// @desc    Get freelancer jobs (applied + accepted/in-progress)
// @access  Private (Freelancer)
router.get('/freelancer/my-jobs', authVerified, getFreelancerJobs);

// @route   POST api/jobs/:id/submit-work
// @desc    Submit work for accepted in-progress job
// @access  Private (Freelancer)
router.post('/:id/submit-work', authVerified, submitWork);

module.exports = router;
