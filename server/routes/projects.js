const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createProject, getProjects, getFreelancerProjects, getProjectById, updateProject } = require('../controllers/projectController');

router.post('/', auth, createProject);
router.get('/', getProjects);
router.get('/my-projects', auth, getFreelancerProjects);
router.get('/:id', getProjectById);
router.put('/:id', auth, updateProject);

module.exports = router;
