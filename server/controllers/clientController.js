const User = require('../models/User');
const Job = require('../models/Job');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const { sendAndLog } = require('../services/mailgunService');
const emailTemplates = require('../templates/emailTemplates');

const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        if (user.role !== 'client') {
            return res.status(403).json({ msg: 'Access denied. User is not a client.' });
        }
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { firstName, lastName, email, phoneNumber, businessType, clientProfile } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        if (user.role !== 'client') {
            return res.status(403).json({ msg: 'Access denied. User is not a client.' });
        }

        // Update fields
        if (firstName !== undefined) user.firstName = firstName;
        if (lastName !== undefined) user.lastName = lastName;
        if (email !== undefined) user.email = email;
        if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
        if (businessType !== undefined) user.businessType = businessType;
        if (clientProfile && typeof clientProfile === 'object') {
            if (!user.clientProfile) user.clientProfile = {};
            if (clientProfile.profilePicture !== undefined) user.clientProfile.profilePicture = clientProfile.profilePicture || null;
            if (clientProfile.companyName !== undefined) user.clientProfile.companyName = clientProfile.companyName;
            if (clientProfile.companyDescription !== undefined) user.clientProfile.companyDescription = clientProfile.companyDescription;
            if (clientProfile.position !== undefined) user.clientProfile.position = clientProfile.position;
            if (clientProfile.linkedIn !== undefined) user.clientProfile.linkedIn = clientProfile.linkedIn;
            if (clientProfile.instagram !== undefined) user.clientProfile.instagram = clientProfile.instagram;
            if (clientProfile.facebook !== undefined) user.clientProfile.facebook = clientProfile.facebook;
            if (clientProfile.tiktok !== undefined) user.clientProfile.tiktok = clientProfile.tiktok;
        }

        await user.save();
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const getMyJobs = async (req, res) => {
    try {
        const userId = req.user.id;
        const jobs = await Job.find({ clientId: userId })
            .sort({ createdAt: -1 })
            .populate('proposals.freelancerId', 'firstName lastName email');
        res.json(jobs);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const updateJob = async (req, res) => {
    try {
        const userId = req.user.id;
        const jobId = req.params.id;
        const { title, description, skills, budgetMin, budgetMax, deadline, status } = req.body;

        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ msg: 'Job not found' });
        }

        // Check ownership
        if (job.clientId.toString() !== userId) {
            return res.status(403).json({ msg: 'Access denied. You do not own this job.' });
        }

        // Update fields
        if (title !== undefined) job.title = title;
        if (description !== undefined) job.description = description;
        if (skills !== undefined) job.skills = Array.isArray(skills) ? skills : [];
        if (job.status === 'open') {
            const { category, subCategory } = req.body;
            if (category !== undefined) job.category = category;
            if (subCategory !== undefined) {
                const cat = category || job.category;
                const { isValidCategorySubCategory } = require('../config/categories');
                if (!isValidCategorySubCategory(cat, subCategory)) {
                    return res.status(400).json({ msg: 'Invalid subcategory for this category' });
                }
                job.subCategory = subCategory;
            }
        }
        if (budgetMin !== undefined) {
            if (budgetMin < 500) {
                return res.status(400).json({ msg: 'Minimum budget must be 500 EGP' });
            }
            job.budgetRange.min = budgetMin;
        }
        if (budgetMax !== undefined) job.budgetRange.max = budgetMax;
        if (deadline !== undefined) job.deadline = deadline;
        if (status !== undefined) job.status = status;

        if (job.status === 'open' && req.body.milestones !== undefined) {
            const milestones = req.body.milestones;
            const parsed = Array.isArray(milestones)
                ? milestones
                    .filter((m) => m && m.name && Number(m.price) > 0)
                    .map((m) => ({
                        name: String(m.name).trim(),
                        price: Number(m.price),
                        dueDate: m.dueDate ? new Date(m.dueDate) : undefined
                    }))
                : [];
            job.milestones = parsed;
        }

        await job.save();
        res.json(job);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const deleteJob = async (req, res) => {
    try {
        const userId = req.user.id;
        const jobId = req.params.id;

        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ msg: 'Job not found' });
        }

        // Check ownership
        if (job.clientId.toString() !== userId) {
            return res.status(403).json({ msg: 'Access denied. You do not own this job.' });
        }

        // Only allow deletion if job is open or closed (not in progress)
        if (job.status === 'in_progress') {
            return res.status(400).json({ msg: 'Cannot delete a job that is in progress' });
        }

        await Job.findByIdAndDelete(jobId);
        res.json({ msg: 'Job deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const acceptProposal = async (req, res) => {
    try {
        const userId = req.user.id;
        const jobId = req.params.id;
        const { proposalId } = req.body;

        const user = await User.findById(userId);
        if (!user || user.role !== 'client') {
            return res.status(403).json({ msg: 'Access denied. Client only.' });
        }

        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ msg: 'Job not found' });
        }

        if (job.clientId.toString() !== userId) {
            return res.status(403).json({ msg: 'Access denied. You do not own this job.' });
        }

        if (job.status !== 'open') {
            return res.status(400).json({ msg: 'Job is not open for accepting proposals.' });
        }

        const proposal = job.proposals.id(proposalId);
        if (!proposal) {
            return res.status(404).json({ msg: 'Proposal not found' });
        }

        const freelancer = await User.findById(proposal.freelancerId).select('freelancerProfile.isBusy');
        if (freelancer?.freelancerProfile?.isBusy) {
            return res.status(400).json({ msg: 'This freelancer is busy and not accepting new work.' });
        }

        const amount = Number(proposal.price) || job.budgetRange?.min || 500;
        const clientFee = 20; // 20 EGP platform fee charged to client
        const totalClientPays = amount + clientFee;
        const amountCents = Math.round(totalClientPays * 100);
        if (amountCents < 100) {
            return res.status(400).json({ msg: 'Invalid proposal amount' });
        }

        // Do NOT accept immediately - return payment params for frontend to call initCharge
        res.json({
            requiresPayment: true,
            type: 'job_proposal',
            amountCents,
            meta: { jobId, proposalId }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const InstaPayPayment = require('../models/InstaPayPayment');

const getMyOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const orders = await Order.find({ buyerId: userId })
            .populate('projectId', 'title packages')
            .populate('sellerId', 'firstName lastName')
            .sort({ createdAt: -1 });
        const ordersArr = orders.map(o => o.toObject ? o.toObject() : o);
        const pendingPaymentIds = ordersArr.filter(o => o.status === 'pending_payment').map(o => o._id?.toString()).filter(Boolean);
        if (pendingPaymentIds.length > 0) {
            const pendingInstaPay = await InstaPayPayment.find({
                status: 'pending',
                'meta.type': 'project_order',
                'meta.orderId': { $in: pendingPaymentIds }
            }).select('meta.orderId').lean();
            const orderIdsWithPending = new Set(pendingInstaPay.map(p => String(p.meta?.orderId)).filter(Boolean));
            ordersArr.forEach(o => {
                o.hasPendingInstaPay = orderIdsWithPending.has(String(o._id));
            });
        }
        res.json(ordersArr);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const getJobById = async (req, res) => {
    try {
        const userId = req.user.id;
        const jobId = req.params.id;

        const job = await Job.findById(jobId)
            .populate('clientId', 'firstName lastName email')
            .populate({
                path: 'proposals.freelancerId',
                select: 'firstName lastName email freelancerProfile'
            });

        if (!job) {
            return res.status(404).json({ msg: 'Job not found' });
        }

        // Check ownership (clientId may be populated or plain id)
        const ownerId = job.clientId?._id?.toString() || job.clientId?.toString();
        if (ownerId !== userId) {
            return res.status(403).json({ msg: 'Access denied. You do not own this job.' });
        }

        res.json(job);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const getActiveOrderForProject = async (req, res) => {
    try {
        const userId = req.user.id;
        const { projectId } = req.params;

        // Find active order for this project where user is either buyer or seller
        const order = await Order.findOne({
            projectId: projectId,
            status: { $in: ['active', 'pending_payment'] },
            $or: [
                { buyerId: userId },
                { sellerId: userId }
            ]
        })
            .populate('projectId', 'title')
            .populate('buyerId', 'firstName lastName')
            .populate('sellerId', 'firstName lastName')
            .sort({ createdAt: -1 });

        if (!order) {
            return res.status(404).json({ msg: 'No active order found' });
        }

        res.json(order);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const getAllActiveOrders = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find all active orders where user is either buyer or seller
        const orders = await Order.find({
            status: { $in: ['active', 'pending_payment'] },
            $or: [
                { buyerId: userId },
                { sellerId: userId }
            ]
        })
            .populate('projectId', 'title _id')
            .populate('buyerId', 'firstName lastName')
            .populate('sellerId', 'firstName lastName')
            .sort({ createdAt: -1 });

        res.json(orders);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const raiseDispute = async (req, res) => {
    try {
        const userId = req.user.id;
        const orderId = req.params.id;
        const { reason } = req.body;

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ msg: 'Order not found' });
        if (order.buyerId.toString() !== userId) {
            return res.status(403).json({ msg: 'Only the buyer can raise a dispute on this order' });
        }
        if (order.status !== 'active') {
            return res.status(400).json({ msg: 'Can only dispute active orders' });
        }

        order.status = 'disputed';
        if (reason) order.disputeReason = reason;
        await order.save();

        res.json({ msg: 'Dispute raised. Our team will review and resolve it shortly.', order });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const approveDelivery = async (req, res) => {
    try {
        const userId = req.user.id;
        const orderId = req.params.id;

        const order = await Order.findById(orderId)
            .populate('projectId', 'title packages')
            .populate('sellerId', 'firstName lastName')
            .populate('buyerId', '_id');

        if (!order) return res.status(404).json({ msg: 'Order not found' });
        if (order.buyerId.toString() !== userId) {
            return res.status(403).json({ msg: 'Only the buyer can approve delivery' });
        }
        if (order.status !== 'active') {
            return res.status(400).json({ msg: 'Can only approve delivery for active orders' });
        }
        if (!order.workSubmission || (!order.workSubmission.message && (!order.workSubmission.links || order.workSubmission.links.length === 0) && (!order.workSubmission.files || order.workSubmission.files.length === 0))) {
            return res.status(400).json({ msg: 'Freelancer has not submitted work yet' });
        }

        // Release escrow: credit freelancer
        const freelancerId = String(order.sellerId?._id || order.sellerId);
        const amount = order.amount;
        const freelancer = await User.findById(freelancerId);
        if (freelancer) {
            freelancer.walletBalance = (freelancer.walletBalance || 0) + amount;
            await freelancer.save();
        }
        await Transaction.create({
            userId: freelancerId,
            type: 'payment',
            amount,
            description: `Order: ${order.projectId?.title || 'Project'}`,
            orderId: order._id,
            relatedUserId: order.buyerId
        });

        order.status = 'completed';
        order.completedAt = new Date();
        await order.save();

        // Email notification to freelancer
        if (freelancer?.email) {
            const clientName = (await User.findById(userId))?.firstName || 'A client';
            const { subject, html } = emailTemplates.paymentReceiptFreelancer(clientName, order.amount, order.projectId?.title || 'Project', order._id);
            sendAndLog(freelancer.email, subject, html, 'delivery_approved', { orderId: order._id });
        }

        res.json({ msg: 'Delivery approved. Order completed.', order });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

/** Get order or job with submitted work awaiting client approval for a given partner (for chat) */
const getPendingWorkToApprove = async (req, res) => {
    try {
        const userId = req.user.id;
        const partnerId = req.params.partnerId;

        if (!partnerId) return res.status(400).json({ msg: 'Partner ID required' });

        const [order] = await Order.find({
            buyerId: userId,
            sellerId: partnerId,
            status: 'active',
            $or: [
                { 'workSubmission.message': { $exists: true, $ne: '' } },
                { 'workSubmission.links.0': { $exists: true } },
                { 'workSubmission.files.0': { $exists: true } }
            ]
        })
            .populate('projectId', 'title')
            .populate('sellerId', 'firstName lastName')
            .limit(1)
            .lean();

        const jobs = await Job.find({
            clientId: userId,
            status: 'in_progress',
            'proposals.status': 'accepted',
            'proposals.freelancerId': partnerId
        })
            .populate('proposals.freelancerId', 'firstName lastName')
            .lean();

        let job = null;
        let activeJobForNav = null;
        for (const j of jobs) {
            const accepted = j.proposals?.find((p) => p.status === 'accepted' && String(p.freelancerId?._id || p.freelancerId) === partnerId);
            if (!activeJobForNav) activeJobForNav = j;
            if (accepted?.workSubmission && (accepted.workSubmission.message || (accepted.workSubmission.links?.length > 0) || (accepted.workSubmission.files?.length > 0))) {
                job = { ...j, acceptedProposal: accepted };
            }
        }

        res.json({ order: order || null, job: job || null, activeJobForNav: activeJobForNav || null });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

/** Client approves submitted work for a job - releases escrow to freelancer */
const approveJobWork = async (req, res) => {
    try {
        const userId = req.user.id;
        const jobId = req.params.id;

        const job = await Job.findById(jobId).populate('clientId proposals.freelancerId');
        if (!job) return res.status(404).json({ msg: 'Job not found' });
        if (job.clientId.toString() !== userId) {
            return res.status(403).json({ msg: 'Only the job owner can approve work' });
        }
        if (job.status !== 'in_progress') {
            return res.status(400).json({ msg: 'Can only approve work for in-progress jobs' });
        }

        const acceptedProposal = job.proposals.find((p) => p.status === 'accepted');
        if (!acceptedProposal) {
            return res.status(400).json({ msg: 'No accepted proposal found' });
        }
        const ws = acceptedProposal.workSubmission;
        if (!ws || (!ws.message && (!ws.links || ws.links.length === 0) && (!ws.files || ws.files.length === 0))) {
            return res.status(400).json({ msg: 'Freelancer has not submitted work yet' });
        }

        const freelancerId = String(acceptedProposal.freelancerId?._id || acceptedProposal.freelancerId);
        const amount = Number(acceptedProposal.price) || 0;

        const freelancer = await User.findById(freelancerId);
        if (freelancer && amount > 0) {
            freelancer.walletBalance = (freelancer.walletBalance || 0) + amount;
            await freelancer.save();
        }
        await Transaction.create({
            userId: freelancerId,
            type: 'payment',
            amount,
            description: `Job: ${job.title}`,
            relatedUserId: userId,
            metadata: { jobId: job._id }
        });

        job.status = 'completed';
        await job.save();

        // Email notification to freelancer
        if (freelancer?.email) {
            const clientName = job.clientId?.firstName || 'A client';
            const { subject, html } = emailTemplates.paymentReceiptFreelancer(clientName, amount, job.title, job._id);
            sendAndLog(freelancer.email, subject, html, 'job_work_approved', { jobId: job._id });
        }

        res.json({ msg: 'Work approved. Job completed.', job });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const submitReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const orderId = req.params.id;
        const { rating, review } = req.body;

        const order = await Order.findById(orderId)
            .populate('projectId', 'title packages')
            .populate('sellerId', 'firstName lastName');

        if (!order) return res.status(404).json({ msg: 'Order not found' });
        if (order.buyerId.toString() !== userId) {
            return res.status(403).json({ msg: 'Only the buyer can submit a review' });
        }
        if (order.status !== 'completed') {
            return res.status(400).json({ msg: 'Can only review completed orders' });
        }
        if (order.rating != null) {
            return res.status(400).json({ msg: 'You have already submitted a review for this order' });
        }

        const r = Number(rating);
        if (!Number.isFinite(r) || r < 1 || r > 5) {
            return res.status(400).json({ msg: 'Rating must be between 1 and 5' });
        }

        order.rating = Math.round(r);
        if (typeof review === 'string') order.review = review.trim();
        await order.save();

        res.json({ msg: 'Review submitted. Thank you!', order });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

module.exports = {
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
    raiseDispute,
    approveDelivery,
    approveJobWork,
    getPendingWorkToApprove,
    submitReview
};
