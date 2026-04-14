const express = require('express');
const router = express.Router();
const authVerified = require('../middleware/authVerified');
const adminAuth = require('../middleware/adminAuth');
const {
    getPendingFreelancers,
    approveFreelancer,
    rejectFreelancer,
    starFreelancer,
    unstarFreelancer,
    getActiveChats,
    freezeChat,
    unfreezeChat,
    findConversationBetweenUsers,
    markAdminConversationRead,
    getConversationOffers,
    addStrike,
    toggleFreelancerReward,
    getInsights,
    searchUser,
    searchUsersPartial,
    getAllUsers,
    getUserById,
    updateUser,
    topUpUserBalance,
    deleteUser,
    getAllProjects,
    updateProject,
    deleteProject,
    getAllJobs,
    updateJob,
    deleteJob,
    getAllOrders,
    getDisputedOrders,
    updateOrder,
    getAllTransactions,
    getTopFreelancers,
    sendAdminMessage,
    createSupportConversation,
    getEmailLogs,
    getWithdrawals,
    completeWithdrawal,
    rejectWithdrawal
} = require('../controllers/adminController');
const { getPendingInstaPay, approveInstaPay, denyInstaPay } = require('../controllers/instaPayController');

router.get('/freelancers/pending', [authVerified, adminAuth], getPendingFreelancers);
router.put('/freelancers/:id/approve', [authVerified, adminAuth], approveFreelancer);
router.delete('/freelancers/:id/reject', [authVerified, adminAuth], rejectFreelancer);
router.patch('/freelancers/:id/star', [authVerified, adminAuth], starFreelancer);
router.patch('/freelancers/:id/unstar', [authVerified, adminAuth], unstarFreelancer);
router.get('/chats', [authVerified, adminAuth], getActiveChats);
router.get('/conversations/between', [authVerified, adminAuth], findConversationBetweenUsers);
router.get('/chats/:conversationId/offers', [authVerified, adminAuth], getConversationOffers);
router.get('/custom-offers/:conversationId', [authVerified, adminAuth], getConversationOffers);
router.put('/chats/:id/freeze', [authVerified, adminAuth], freezeChat);
router.put('/chats/:id/unfreeze', [authVerified, adminAuth], unfreezeChat);
router.patch('/chats/:id/admin-read', [authVerified, adminAuth], markAdminConversationRead);
router.post('/chats/message', [authVerified, adminAuth], sendAdminMessage);
router.post('/chats/support', [authVerified, adminAuth], createSupportConversation);
router.post('/users/:id/strike', [authVerified, adminAuth], addStrike);
router.put('/freelancers/:id/reward', [authVerified, adminAuth], toggleFreelancerReward);
router.get('/insights', [authVerified, adminAuth], getInsights);
router.get('/users/search', [authVerified, adminAuth], searchUser);
router.get('/users/search/partial', [authVerified, adminAuth], searchUsersPartial);

// New Routes for Full Access
router.get('/users', [authVerified, adminAuth], getAllUsers);
router.get('/users/:id', [authVerified, adminAuth], getUserById);
router.put('/users/:id', [authVerified, adminAuth], updateUser);
router.put('/users/:id/topup', [authVerified, adminAuth], topUpUserBalance);
router.delete('/users/:id', [authVerified, adminAuth], deleteUser);

router.get('/projects', [authVerified, adminAuth], getAllProjects);
router.put('/projects/:id', [authVerified, adminAuth], updateProject);
router.delete('/projects/:id', [authVerified, adminAuth], deleteProject);

router.get('/jobs', [authVerified, adminAuth], getAllJobs);
router.put('/jobs/:id', [authVerified, adminAuth], updateJob);
router.delete('/jobs/:id', [authVerified, adminAuth], deleteJob);

router.get('/orders', [authVerified, adminAuth], getAllOrders);
router.get('/disputes', [authVerified, adminAuth], getDisputedOrders);
router.put('/orders/:id', [authVerified, adminAuth], updateOrder);

router.get('/transactions', [authVerified, adminAuth], getAllTransactions);
router.get('/withdrawals', [authVerified, adminAuth], getWithdrawals);
router.patch('/withdrawals/:id/complete', [authVerified, adminAuth], completeWithdrawal);
router.patch('/withdrawals/:id/reject', [authVerified, adminAuth], rejectWithdrawal);
router.get('/top-freelancers', [authVerified, adminAuth], getTopFreelancers);
router.get('/email-logs', [authVerified, adminAuth], getEmailLogs);

// InstaPay pending payments
router.get('/instapay-pending', [authVerified, adminAuth], getPendingInstaPay);
router.patch('/instapay/:id/approve', [authVerified, adminAuth], approveInstaPay);
router.patch('/instapay/:id/deny', [authVerified, adminAuth], denyInstaPay);

module.exports = router;
