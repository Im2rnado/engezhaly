const express = require('express');
const router = express.Router();
const authVerified = require('../middleware/authVerified');
const { createProject, getProjects, getFreelancerProjects, getProjectById, updateProject, createProjectOrder, deleteMyProject } = require('../controllers/projectController');

router.post('/', authVerified, createProject);
router.get('/', getProjects);
router.get('/my-projects', authVerified, getFreelancerProjects);
router.get('/:id', getProjectById);
router.put('/:id', authVerified, updateProject);
router.delete('/:id', authVerified, deleteMyProject);
router.post('/:id/order', authVerified, createProjectOrder);

module.exports = router;
