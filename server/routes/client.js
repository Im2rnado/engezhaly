const express = require('express');
const router = express.Router();
const authVerified = require('../middleware/authVerified');
const {
    getProfile,
    updateProfile,
    getMyJobs,
    getJobById,
    updateJob,
    deleteJob,
    acceptProposal,
    getMyOrders,
    getActiveOrderForProject,
    getAllActiveOrders,
    raiseDispute
} = require('../controllers/clientController');

// @route   GET api/client/profile
// @desc    Get current client profile
// @access  Private (Client only)
router.get('/profile', authVerified, getProfile);

// @route   PUT api/client/profile
// @desc    Update client profile
// @access  Private (Client only)
router.put('/profile', authVerified, updateProfile);

// @route   GET api/client/jobs
// @desc    Get client's jobs
// @access  Private (Client only)
router.get('/jobs', authVerified, getMyJobs);

// @route   GET api/client/jobs/:id
// @desc    Get job by ID with proposals
// @access  Private (Client only, owner)
router.get('/jobs/:id', authVerified, getJobById);

// @route   PUT api/client/jobs/:id
// @desc    Update a job
// @access  Private (Client only, owner)
router.put('/jobs/:id', authVerified, updateJob);

// @route   DELETE api/client/jobs/:id
// @desc    Delete a job
// @access  Private (Client only, owner)
router.delete('/jobs/:id', authVerified, deleteJob);

// @route   POST api/client/jobs/:id/accept-proposal
// @desc    Accept a proposal for a job
// @access  Private (Client only, owner)
router.post('/jobs/:id/accept-proposal', authVerified, acceptProposal);

// @route   GET api/client/orders
// @desc    Get client's orders
// @access  Private (Client only)
router.get('/orders', authVerified, getMyOrders);

// @route   GET api/client/orders/project/:projectId/active
// @desc    Get active order for a project
// @access  Private
router.get('/orders/project/:projectId/active', authVerified, getActiveOrderForProject);

// @route   GET api/client/orders/active
// @desc    Get all active orders for current user
// @access  Private
router.get('/orders/active', authVerified, getAllActiveOrders);
router.post('/orders/:id/dispute', authVerified, raiseDispute);

module.exports = router;
