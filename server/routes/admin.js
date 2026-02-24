const express = require('express');
const router = express.Router();
const authVerified = require('../middleware/authVerified');
const adminAuth = require('../middleware/adminAuth');
const {
    getPendingFreelancers,
    approveFreelancer,
    rejectFreelancer,
    getActiveChats,
    freezeChat,
    unfreezeChat,
    addStrike,
    toggleEmployeeOfMonth,
    getInsights,
    searchUser,
    getAllUsers,
    updateUser,
    deleteUser,
    getAllProjects,
    updateProject,
    deleteProject,
    getAllJobs,
    updateJob,
    deleteJob,
    getAllOrders,
    updateOrder,
    getAllTransactions,
    getTopFreelancers,
    sendAdminMessage,
    getEmailLogs
} = require('../controllers/adminController');

router.get('/freelancers/pending', [authVerified, adminAuth], getPendingFreelancers);
router.put('/freelancers/:id/approve', [authVerified, adminAuth], approveFreelancer);
router.delete('/freelancers/:id/reject', [authVerified, adminAuth], rejectFreelancer);
router.get('/chats', [authVerified, adminAuth], getActiveChats);
router.put('/chats/:id/freeze', [authVerified, adminAuth], freezeChat);
router.put('/chats/:id/unfreeze', [authVerified, adminAuth], unfreezeChat);
router.post('/chats/message', [authVerified, adminAuth], sendAdminMessage);
router.post('/users/:id/strike', [authVerified, adminAuth], addStrike);
router.put('/freelancers/:id/employee-of-month', [authVerified, adminAuth], toggleEmployeeOfMonth);
router.get('/insights', [authVerified, adminAuth], getInsights);
router.get('/users/search', [authVerified, adminAuth], searchUser);

// New Routes for Full Access
router.get('/users', [authVerified, adminAuth], getAllUsers);
router.put('/users/:id', [authVerified, adminAuth], updateUser);
router.delete('/users/:id', [authVerified, adminAuth], deleteUser);

router.get('/projects', [authVerified, adminAuth], getAllProjects);
router.put('/projects/:id', [authVerified, adminAuth], updateProject);
router.delete('/projects/:id', [authVerified, adminAuth], deleteProject);

router.get('/jobs', [authVerified, adminAuth], getAllJobs);
router.put('/jobs/:id', [authVerified, adminAuth], updateJob);
router.delete('/jobs/:id', [authVerified, adminAuth], deleteJob);

router.get('/orders', [authVerified, adminAuth], getAllOrders);
router.put('/orders/:id', [authVerified, adminAuth], updateOrder);

router.get('/transactions', [authVerified, adminAuth], getAllTransactions);
router.get('/top-freelancers', [authVerified, adminAuth], getTopFreelancers);
router.get('/email-logs', [authVerified, adminAuth], getEmailLogs);

module.exports = router;
