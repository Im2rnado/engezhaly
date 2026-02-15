const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Chat = require('../models/Chat');
const Transaction = require('../models/Transaction');
const Project = require('../models/Project');
const Job = require('../models/Job');
const Order = require('../models/Order');

const getPendingFreelancers = async (req, res) => {
    try {
        const pending = await User.find({
            role: 'freelancer',
            'freelancerProfile.status': 'pending'
        }).select('-password +phoneNumber +dateOfBirth +freelancerProfile.idDocument');
        res.json(pending);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const approveFreelancer = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        user.freelancerProfile.status = 'approved';
        await user.save();
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const rejectFreelancer = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        await User.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Freelancer rejected and deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const getActiveChats = async (req, res) => {
    try {
        const conversations = await Conversation.find()
            .sort({ isFrozen: -1, updatedAt: -1 })
            .limit(50)
            .populate('participants', 'firstName lastName role')
            .populate('lastMessageId', 'content');

        // Format conversations to include sender/receiver info
        const formatted = conversations.map(conv => {
            const participants = conv.participants || [];
            const participant1 = participants[0];
            const participant2 = participants[1];
            
            return {
                _id: conv._id,
                isFrozen: conv.isFrozen,
                lastMessage: conv.lastMessage,
                content: conv.lastMessageId?.content || conv.lastMessage || 'No messages yet',
                updatedAt: conv.updatedAt,
                createdAt: conv.createdAt,
                participants: participants,
                // For backward compatibility
                senderId: participant1,
                receiverId: participant2
            };
        });

        res.json(formatted);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
}

const freezeChat = async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.id);
        if (!conversation) return res.status(404).json({ msg: 'Conversation not found' });

        conversation.isFrozen = true;
        await conversation.save();
        res.json(conversation);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
}

const unfreezeChat = async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.id);
        if (!conversation) return res.status(404).json({ msg: 'Conversation not found' });

        conversation.isFrozen = false;
        await conversation.save();
        res.json(conversation);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
}

const sendAdminMessage = async (req, res) => {
    try {
        const { conversationId, receiverId, content } = req.body;
        const adminId = req.user.id;

        // Find conversation
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ msg: 'Conversation not found' });
        }

        // Create admin message (bypass frozen status)
        const newMsg = new Chat({
            conversationId: conversation._id,
            senderId: adminId,
            receiverId: receiverId,
            content: `[Engezhaly Admin] ${content}`,
            messageType: 'text',
            isAdmin: true // Flag to identify admin messages
        });

        await newMsg.save();

        // Update conversation metadata
        conversation.lastMessage = `[Engezhaly Admin] ${content}`;
        conversation.lastMessageId = newMsg._id;
        await conversation.save();

        // Emit via socket for real-time delivery
        const io = req.app.get('io');
        if (io) {
            const roomId = `conversation:${conversation._id}`;
            io.to(roomId).emit('message', {
                _id: newMsg._id,
                conversationId: conversation._id,
                senderId: adminId,
                content: newMsg.content,
                messageType: 'text',
                createdAt: newMsg.createdAt,
                isAdmin: true,
                isRead: false
            });
        }

        res.json(newMsg);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
}

const addStrike = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        user.strikes = (user.strikes || 0) + 1;
        if (user.strikes >= 3) {
            user.isFrozen = true;
        }
        await user.save();
        res.json({ msg: 'Strike added', strikes: user.strikes, isFrozen: user.isFrozen });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
}

const toggleEmployeeOfMonth = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user || user.role !== 'freelancer') return res.status(404).json({ msg: 'Freelancer not found' });

        if (!user.freelancerProfile.isEmployeeOfMonth) {
            await User.updateMany(
                { 'freelancerProfile.isEmployeeOfMonth': true },
                { $set: { 'freelancerProfile.isEmployeeOfMonth': false } }
            );
        }

        user.freelancerProfile.isEmployeeOfMonth = !user.freelancerProfile.isEmployeeOfMonth;
        await user.save();
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
}

const getInsights = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalFreelancers = await User.countDocuments({ role: 'freelancer' });
        const totalClients = await User.countDocuments({ role: 'client' });

        const revenueAgg = await Transaction.aggregate([
            { $match: { type: 'fee', status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalRevenue = revenueAgg.length > 0 ? Math.abs(revenueAgg[0].total) : 0;

        res.json({
            totalUsers,
            totalFreelancers,
            totalClients,
            totalRevenue
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
}

const searchUser = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.status(400).json({ msg: 'Query is required' });

        let user;
        if (query.match(/^[0-9a-fA-F]{24}$/)) {
            user = await User.findById(query).select('-password');
        } else {
            user = await User.findOne({
                $or: [{ email: query }, { username: query }]
            }).select('-password');
        }

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
}

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const updateUser = async (req, res) => {
    try {
        const { firstName, lastName, email, role, walletBalance } = req.body;
        const user = await User.findByIdAndUpdate(req.params.id, {
            firstName, lastName, email, role, walletBalance
        }, { new: true }).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const deleteUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ msg: 'User deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};


const getAllProjects = async (req, res) => {
    try {
        const projects = await Project.find().populate('sellerId', 'firstName lastName');
        res.json(projects);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const updateProject = async (req, res) => {
    try {
        const { title, isActive } = req.body;
        const project = await Project.findByIdAndUpdate(req.params.id, {
            title, isActive
        }, { new: true });
        res.json(project);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const deleteProject = async (req, res) => {
    try {
        await Project.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Project deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const getAllJobs = async (req, res) => {
    try {
        const jobs = await Job.find().populate('clientId', 'firstName lastName');
        res.json(jobs);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const updateJob = async (req, res) => {
    try {
        const { title, status, budgetRange } = req.body;
        const job = await Job.findByIdAndUpdate(req.params.id, {
            title, status, budgetRange
        }, { new: true });
        res.json(job);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const deleteJob = async (req, res) => {
    try {
        await Job.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Job deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('buyerId', 'firstName lastName')
            .populate('sellerId', 'firstName lastName')
            .populate('projectId', 'title');
        res.json(orders);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const updateOrder = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
        res.json(order);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const getAllTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find().populate('userId', 'firstName lastName');
        res.json(transactions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const getTopFreelancers = async (req, res) => {
    try {
        // 1. Most Completed Deals
        const mostDeals = await Order.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: '$sellerId', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 }
        ]);

        // 2. On-Time Delivery Rate
        // This is complex in aggregation, simplifiction: fetch all completed orders and calculate in JS for now or complex pipeline
        // Let's do a pipeline for average rating first
        const topRated = await Order.aggregate([
            { $match: { status: 'completed', rating: { $exists: true } } },
            { $group: { _id: '$sellerId', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
            { $match: { count: { $gte: 1 } } }, // At least 1 rated order
            { $sort: { avgRating: -1, count: -1 } },
            { $limit: 1 }
        ]);

        // Fetch user details for these IDs
        const result = {
            mostDeals: null,
            topRated: null,
            onTime: null // Placeholder, implementing simple version below
        };

        if (mostDeals.length > 0) {
            result.mostDeals = await User.findById(mostDeals[0]._id).select('firstName lastName freelancerProfile');
            if (result.mostDeals) result.mostDeals = { ...result.mostDeals.toObject(), value: `${mostDeals[0].count} Deals` };
        }

        if (topRated.length > 0) {
            result.topRated = await User.findById(topRated[0]._id).select('firstName lastName freelancerProfile');
            if (result.topRated) result.topRated = { ...result.topRated.toObject(), value: `${topRated[0].avgRating.toFixed(1)} Stars` };
        }

        // On-time delivery logic (JS calculation for simplicity on limited dataset)
        // In prod, use robust aggregation or pre-calculated fields on User model
        const allCompleted = await Order.find({ status: 'completed' }).select('sellerId deliveryDate completedAt');
        const sellerStats = {};

        allCompleted.forEach(order => {
            if (!sellerStats[order.sellerId]) sellerStats[order.sellerId] = { total: 0, onTime: 0 };
            sellerStats[order.sellerId].total++;
            if (order.completedAt && order.deliveryDate && new Date(order.completedAt) <= new Date(order.deliveryDate)) {
                sellerStats[order.sellerId].onTime++;
            }
        });

        let bestOnTimeSellerId = null;
        let bestRate = -1;

        Object.keys(sellerStats).forEach(sellerId => {
            const stats = sellerStats[sellerId];
            if (stats.total > 0) { // threshold
                const rate = stats.onTime / stats.total;
                if (rate > bestRate) {
                    bestRate = rate;
                    bestOnTimeSellerId = sellerId;
                }
            }
        });

        if (bestOnTimeSellerId) {
            result.onTime = await User.findById(bestOnTimeSellerId).select('firstName lastName freelancerProfile');
            if (result.onTime) result.onTime = { ...result.onTime.toObject(), value: `${(bestRate * 100).toFixed(0)}% On-Time` };
        }

        res.json(result);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

module.exports = {
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
};
