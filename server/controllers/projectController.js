const Project = require('../models/Project');
const User = require('../models/User');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const { sendAndLog } = require('../services/mailgunService');
const { offerPurchased: offerPurchasedTemplate, paymentReceiptFreelancer, paymentReceiptClient } = require('../templates/emailTemplates');
const { emitToUser, isUserOnline } = require('../services/notificationService');

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

        // Create Transaction records
        await Transaction.create([
            { userId: buyerId, type: 'payment', amount: -amount, description: `Order: ${project.title}`, orderId: order._id, relatedUserId: project.sellerId },
            { userId: project.sellerId, type: 'payment', amount: amount - platformFee, description: `Order: ${project.title}`, orderId: order._id, relatedUserId: buyerId }
        ]);

        const populated = await Order.findById(order._id)
            .populate('projectId', 'title')
            .populate('buyerId', 'firstName lastName email')
            .populate('sellerId', 'firstName lastName email');

        // Notify freelancer (seller): if online -> push; if offline -> email
        const seller = populated.sellerId;
        const sellerId = seller?._id || project.sellerId;
        const clientName = populated.buyerId ? `${populated.buyerId.firstName} ${populated.buyerId.lastName}` : 'A client';
        const offerTitle = populated.projectId?.title || 'Project';
        const orderLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/freelancer?tab=orders`;

        if (sellerId && req.app) {
            if (isUserOnline(req.app, sellerId)) {
                emitToUser(req.app, sellerId, {
                    title: 'Your offer has been purchased!',
                    message: `${clientName} purchased: ${offerTitle} (${amount} EGP)`,
                    link: orderLink,
                    type: 'order'
                });
            } else if (seller?.email) {
                const { subject, html } = offerPurchasedTemplate(clientName, offerTitle, amount, order._id);
                sendAndLog(seller.email, subject, html, 'offer_purchased', { orderId: order._id, buyerId, sellerId }).catch(err => console.error('[Project] Email failed:', err.message));
            }
        }

        // Send payment receipt emails to both
        const buyerUser = populated.buyerId;
        if (buyerUser?.email) {
            const { subject, html } = paymentReceiptClient(amount, populated.projectId?.title || 'Project', order._id.toString(), new Date().toLocaleDateString());
            sendAndLog(buyerUser.email, subject, html, 'payment_receipt_client', { orderId: order._id }).catch(err => console.error('[Project] Receipt email failed:', err.message));
        }
        if (seller?.email) {
            const { subject, html } = paymentReceiptFreelancer(amount, amount - platformFee, platformFee, populated.projectId?.title, order._id.toString(), new Date().toLocaleDateString());
            sendAndLog(seller.email, subject, html, 'payment_receipt_freelancer', { orderId: order._id }).catch(err => console.error('[Project] Receipt email failed:', err.message));
        }

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
