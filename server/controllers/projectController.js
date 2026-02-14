const Project = require('../models/Project');
const User = require('../models/User');

const createProject = async (req, res) => {
    try {
        const { title, description, category, subCategory, images, packages } = req.body;

        // Validation handled in frontend mostly, but double check min price
        if (packages.some(p => p.price < 500)) {
            return res.status(400).json({ msg: 'Minimum price must be 500 EGP' });
        }

        if (!category || !subCategory) {
            return res.status(400).json({ msg: 'Category and subcategory are required' });
        }

        const newProject = new Project({
            sellerId: req.user.id,
            title,
            description,
            category,
            subCategory,
            images,
            packages
        });

        await newProject.save();
        res.json(newProject);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const getProjects = async (req, res) => {
    try {
        const projects = await Project.find({ isActive: true }).populate('sellerId', 'firstName lastName freelancerProfile');
        res.json(projects);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const getFreelancerProjects = async (req, res) => {
    try {
        const projects = await Project.find({ sellerId: req.user.id });
        res.json(projects);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id).populate('sellerId', 'firstName lastName freelancerProfile');
        if (!project) {
            return res.status(404).json({ msg: 'Project not found' });
        }
        res.json(project);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const updateProject = async (req, res) => {
    try {
        const { title, description, category, subCategory, images, packages, isActive } = req.body;

        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ msg: 'Project not found' });
        }

        // Check if user owns the project
        if (project.sellerId.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized to update this project' });
        }

        // Update fields
        if (title) project.title = title;
        if (description !== undefined) project.description = description;
        if (category) project.category = category;
        if (subCategory) project.subCategory = subCategory;
        if (images) project.images = images;
        if (packages) {
            // Validate packages
            if (packages.some(p => p.price < 500)) {
                return res.status(400).json({ msg: 'Minimum price must be 500 EGP' });
            }
            project.packages = packages;
        }
        if (isActive !== undefined) project.isActive = isActive;

        await project.save();
        res.json(project);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

module.exports = {
    createProject,
    getProjects,
    getFreelancerProjects,
    getProjectById,
    updateProject
};
