const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
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
    sendAdminMessage
} = require('../controllers/adminController');

router.get('/freelancers/pending', [auth, adminAuth], getPendingFreelancers);
router.put('/freelancers/:id/approve', [auth, adminAuth], approveFreelancer);
router.delete('/freelancers/:id/reject', [auth, adminAuth], rejectFreelancer);
router.get('/chats', [auth, adminAuth], getActiveChats);
router.put('/chats/:id/freeze', [auth, adminAuth], freezeChat);
router.put('/chats/:id/unfreeze', [auth, adminAuth], unfreezeChat);
router.post('/chats/message', [auth, adminAuth], sendAdminMessage);
router.post('/users/:id/strike', [auth, adminAuth], addStrike);
router.put('/freelancers/:id/employee-of-month', [auth, adminAuth], toggleEmployeeOfMonth);
router.get('/insights', [auth, adminAuth], getInsights);
router.get('/users/search', [auth, adminAuth], searchUser);

// New Routes for Full Access
router.get('/users', [auth, adminAuth], getAllUsers);
router.put('/users/:id', [auth, adminAuth], updateUser);
router.delete('/users/:id', [auth, adminAuth], deleteUser);

router.get('/projects', [auth, adminAuth], getAllProjects);
router.put('/projects/:id', [auth, adminAuth], updateProject);
router.delete('/projects/:id', [auth, adminAuth], deleteProject);

router.get('/jobs', [auth, adminAuth], getAllJobs);
router.put('/jobs/:id', [auth, adminAuth], updateJob);
router.delete('/jobs/:id', [auth, adminAuth], deleteJob);

router.get('/orders', [auth, adminAuth], getAllOrders);
router.put('/orders/:id', [auth, adminAuth], updateOrder);

router.get('/transactions', [auth, adminAuth], getAllTransactions);
router.get('/top-freelancers', [auth, adminAuth], getTopFreelancers);

module.exports = router;
