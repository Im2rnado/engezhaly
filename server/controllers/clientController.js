const User = require('../models/User');
const Job = require('../models/Job');
const Order = require('../models/Order');

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
        const { firstName, lastName, email, phoneNumber, businessType } = req.body;

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
        if (budgetMin !== undefined) {
            if (budgetMin < 500) {
                return res.status(400).json({ msg: 'Minimum budget must be 500 EGP' });
            }
            job.budgetRange.min = budgetMin;
        }
        if (budgetMax !== undefined) job.budgetRange.max = budgetMax;
        if (deadline !== undefined) job.deadline = deadline;
        if (status !== undefined) job.status = status;

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

const getMyOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const orders = await Order.find({ buyerId: userId })
            .populate('projectId', 'title packages')
            .populate('sellerId', 'firstName lastName')
            .sort({ createdAt: -1 });
        res.json(orders);
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
                select: 'firstName lastName email freelancerProfile',
                populate: {
                    path: 'freelancerProfile',
                    select: 'bio category experienceYears skills isEmployeeOfMonth status'
                }
            });

        if (!job) {
            return res.status(404).json({ msg: 'Job not found' });
        }

        // Check ownership
        if (job.clientId._id.toString() !== userId && job.clientId.toString() !== userId) {
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

module.exports = {
    getProfile,
    updateProfile,
    getMyJobs,
    getJobById,
    updateJob,
    deleteJob,
    getMyOrders,
    getActiveOrderForProject,
    getAllActiveOrders
};
