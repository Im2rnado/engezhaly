const Project = require('../models/Project');
const User = require('../models/User');
const Order = require('../models/Order');

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
        const projects = await Project.find({ isActive: true }).populate('sellerId', '_id firstName lastName freelancerProfile');
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

const createProjectOrder = async (req, res) => {
    try {
        const buyerId = req.user.id;
        const { id: projectId } = req.params;
        const { packageIndex } = req.body;

        const buyer = await User.findById(buyerId);
        if (!buyer || buyer.role !== 'client') {
            return res.status(403).json({ msg: 'Only clients can order projects' });
        }

        const project = await Project.findById(projectId);
        if (!project || !project.isActive) {
            return res.status(404).json({ msg: 'Project not found' });
        }

        const pkgIdx = Number(packageIndex);
        if (Number.isNaN(pkgIdx) || pkgIdx < 0 || pkgIdx >= project.packages.length) {
            return res.status(400).json({ msg: 'Invalid package selection' });
        }
        const selectedPackage = project.packages[pkgIdx];
        if (!selectedPackage) {
            return res.status(400).json({ msg: 'Selected package not found' });
        }

        // Prevent self-ordering
        if (String(project.sellerId) === String(buyerId)) {
            return res.status(400).json({ msg: 'You cannot order your own project' });
        }

        // Prevent duplicate active order for same project + buyer
        const existing = await Order.findOne({
            projectId,
            buyerId,
            status: 'active'
        });
        if (existing) {
            return res.status(400).json({ msg: 'You already have an active order for this project' });
        }

        const amount = Number(selectedPackage.price || 0);
        if (buyer.walletBalance < amount) {
            return res.status(400).json({ msg: 'Insufficient wallet balance' });
        }

        const platformFee = amount * 0.2;
        const deliveryDate = new Date(Date.now() + Number(selectedPackage.days || 0) * 24 * 60 * 60 * 1000);

        const order = new Order({
            projectId: project._id,
            buyerId,
            sellerId: project.sellerId,
            packageType: selectedPackage.type || 'Basic',
            amount,
            platformFee,
            status: 'active',
            deliveryDate
        });

        await order.save();

        buyer.walletBalance -= amount;
        await buyer.save();

        const populated = await Order.findById(order._id)
            .populate('projectId', 'title')
            .populate('buyerId', 'firstName lastName')
            .populate('sellerId', 'firstName lastName');

        res.json(populated);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

module.exports = {
    createProject,
    getProjects,
    getFreelancerProjects,
    getProjectById,
    updateProject,
    createProjectOrder
};
