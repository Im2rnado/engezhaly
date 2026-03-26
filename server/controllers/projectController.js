const Project = require('../models/Project');
const User = require('../models/User');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const Conversation = require('../models/Conversation');
const Chat = require('../models/Chat');
const { isValidCategorySubCategory } = require('../config/categories');
const { sendAndLog } = require('../services/mailgunService');
const { offerPurchased: offerPurchasedTemplate, paymentReceiptFreelancer, paymentReceiptClient } = require('../templates/emailTemplates');
const { emitToUser, isUserOnline } = require('../services/notificationService');

const createProject = async (req, res) => {
    try {
        const { title, description, category, subCategory, images, packages, consultationPrice } = req.body;

        // Validation handled in frontend mostly, but double check min price
        if (packages.some(p => p.price < 500)) {
            return res.status(400).json({ msg: 'Minimum price must be 500 EGP' });
        }

        if (!category || !subCategory) {
            return res.status(400).json({ msg: 'Category and subcategory are required' });
        }

        const seller = await User.findById(req.user.id);
        const lockedCategory = seller?.freelancerProfile?.category;
        if (!lockedCategory) {
            return res.status(400).json({ msg: 'Freelancer must complete profile with category before creating offers' });
        }
        if (category !== lockedCategory) {
            return res.status(400).json({ msg: 'Category must match your profile category. You cannot change your main category.' });
        }
        if (!isValidCategorySubCategory(category, subCategory)) {
            return res.status(400).json({ msg: 'Invalid subcategory for this category' });
        }

        const existing = await Project.findOne({ sellerId: req.user.id, subCategory });
        if (existing) {
            return res.status(400).json({ msg: 'You already have an offer under this subcategory.' });
        }

        const newProject = new Project({
            sellerId: req.user.id,
            title,
            description,
            category,
            subCategory,
            images,
            packages,
            consultationPrice: consultationPrice != null && consultationPrice >= 0 ? Number(consultationPrice) : 100
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
        const { title, description, category, subCategory, images, packages, isActive, consultationPrice } = req.body;

        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ msg: 'Project not found' });
        }

        // Check if user owns the project
        if (project.sellerId.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized to update this project' });
        }

        const seller = await User.findById(req.user.id);
        const lockedCategory = seller?.freelancerProfile?.category;
        if (!lockedCategory) {
            return res.status(400).json({ msg: 'Freelancer must have a profile category' });
        }
        if (category && category !== lockedCategory) {
            return res.status(400).json({ msg: 'You cannot change the main category. It is locked to your profile.' });
        }

        // Update fields (category is locked - only subcategory can change within allowed list)
        if (title) project.title = title;
        if (description !== undefined) project.description = description;
        if (subCategory) {
            const cat = category || project.category;
            if (!isValidCategorySubCategory(cat, subCategory)) {
                return res.status(400).json({ msg: 'Invalid subcategory for this category' });
            }
            if (subCategory !== project.subCategory) {
                const existing = await Project.findOne({ sellerId: req.user.id, subCategory, _id: { $ne: project._id } });
                if (existing) {
                    return res.status(400).json({ msg: 'You already have an offer under this subcategory.' });
                }
            }
            project.subCategory = subCategory;
        }
        if (images) project.images = images;
        if (packages) {
            // Validate packages
            if (packages.some(p => p.price < 500)) {
                return res.status(400).json({ msg: 'Minimum price must be 500 EGP' });
            }
            project.packages = packages;
        }
        if (isActive !== undefined) project.isActive = isActive;
        if (consultationPrice !== undefined && consultationPrice >= 0) project.consultationPrice = Number(consultationPrice);

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
        const { packageIndex, description } = req.body;

        if (!description || typeof description !== 'string' || !description.trim()) {
            return res.status(400).json({ msg: 'Order description is required' });
        }

        const buyer = await User.findById(buyerId);
        if (!buyer || buyer.role !== 'client') {
            return res.status(403).json({ msg: 'Only clients can order projects' });
        }

        const project = await Project.findById(projectId);
        if (!project || !project.isActive) {
            return res.status(404).json({ msg: 'Project not found' });
        }

        const freelancer = await User.findById(project.sellerId).select('freelancerProfile.isBusy');
        if (freelancer?.freelancerProfile?.isBusy) {
            return res.status(400).json({ msg: 'Freelancer is busy and not accepting orders.' });
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
        const platformFee = 20; // Fixed 20 EGP platform fee
        const deliveryDate = new Date(Date.now() + Number(selectedPackage.days || 0) * 24 * 60 * 60 * 1000);

        const order = new Order({
            projectId: project._id,
            buyerId,
            sellerId: project.sellerId,
            packageType: selectedPackage.type || 'Basic',
            amount,
            platformFee,
            status: 'pending_approval',
            description: description.trim(),
            deliveryDate
        });

        await order.save();
        // No charge at order creation - client pays when freelancer approves

        // Create/find conversation and send description as message from buyer
        let conversation = await Conversation.findOne({
            participants: { $all: [buyerId, project.sellerId] }
        });
        if (!conversation) {
            conversation = new Conversation({
                participants: [buyerId, project.sellerId],
                lastMessage: `[Order] ${description.trim().substring(0, 80)}${description.trim().length > 80 ? '...' : ''}`
            });
            await conversation.save();
        }
        const orderChat = new Chat({
            conversationId: conversation._id,
            senderId: buyerId,
            receiverId: project.sellerId,
            content: `[Engezhaly Order] Order #${order.orderNumber || order._id}\nBundle: ${order.packageType}\n\n${description.trim()}`,
            messageType: 'order'
        });
        await orderChat.save();
        conversation.lastMessage = orderChat.content;
        conversation.lastMessageId = orderChat._id;
        await conversation.save();

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
                    title: 'New order - approval needed',
                    message: `${clientName} ordered: ${offerTitle} (${amount} EGP). Please approve or deny.`,
                    link: orderLink,
                    type: 'order'
                });
            } else if (seller?.email) {
                const { subject, html } = offerPurchasedTemplate(clientName, offerTitle, amount, order._id);
                sendAndLog(seller.email, subject, html, 'offer_purchased', { orderId: order._id, buyerId, sellerId }).catch(err => console.error('[Project] Email failed:', err.message));
            }
        }

        // No payment receipts for pending_approval; client gets orderApproved on approval, orderDenied on deny
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
