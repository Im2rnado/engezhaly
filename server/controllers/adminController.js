const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const EmailLog = require('../models/EmailLog');
const { sendAndLog } = require('../services/mailgunService');
const { freelancerApproved: freelancerApprovedTemplate, disputeResolved: disputeResolvedTemplate, offlineChat: offlineChatTemplate } = require('../templates/emailTemplates');
const { emitToUser, isUserOnline } = require('../services/notificationService');
const Chat = require('../models/Chat');
const Transaction = require('../models/Transaction');
const Project = require('../models/Project');
const Job = require('../models/Job');
const Order = require('../models/Order');
const Offer = require('../models/Offer');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const WithdrawalMethod = require('../models/WithdrawalMethod');

const getPendingFreelancers = async (req, res) => {
    try {
        const pending = await User.find({
            role: 'freelancer',
            'freelancerProfile.status': 'pending'
        }).select('-password +phoneNumber +dateOfBirth +freelancerProfile.idDocument +freelancerProfile.cvUrl').lean();
        const ids = pending.map(u => u._id);
        const allMethods = await WithdrawalMethod.find({ userId: { $in: ids } }).sort({ isDefault: -1, createdAt: -1 }).lean();
        const byUser = allMethods.reduce((acc, m) => {
            const id = m.userId?.toString?.() || m.userId;
            if (!acc[id]) acc[id] = [];
            acc[id].push(m);
            return acc;
        }, {});
        const result = pending.map(u => ({ ...u, withdrawalMethods: byUser[u._id?.toString?.() || u._id] || [] }));
        res.json(result);
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

        // Auto-create a live Project/Offer from the starter offer if provided
        const so = user.freelancerProfile?.starterOffer;
        if (so && so.title && so.packages && so.packages.length > 0) {
            try {
                const category = user.freelancerProfile.category || 'General';
                const subCategory = so.subCategory || (user.freelancerProfile.category || 'General');
                await Project.create({
                    sellerId: user._id,
                    title: so.title,
                    description: so.description || '',
                    category,
                    subCategory,
                    images: so.images || [],
                    packages: so.packages.map(p => ({
                        type: p.type || 'Basic',
                        price: Math.max(300, Number(p.price) || 300),
                        days: Math.max(1, Number(p.days) || 1),
                        revisions: Number(p.revisions) || 0,
                        features: Array.isArray(p.features) ? p.features.filter(Boolean) : []
                    })),
                    isActive: true
                });
            } catch (offerErr) {
                console.error('[Admin] Failed to create starter offer project:', offerErr.message);
            }
        }

        // Send approval email
        if (user.email) {
            const { subject, html } = freelancerApprovedTemplate();
            sendAndLog(user.email, subject, html, 'freelancer_approved', { userId: user._id }).catch(err => console.error('[Admin] Approval email failed:', err.message));
        }

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

const starFreelancer = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        if (user.role !== 'freelancer') return res.status(400).json({ msg: 'Not a freelancer' });
        user.freelancerProfile.adminStarred = true;
        await user.save();
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const unstarFreelancer = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        if (!user.freelancerProfile) user.freelancerProfile = {};
        user.freelancerProfile.adminStarred = false;
        await user.save();
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

async function getOrCreateSupportTeamUser() {
    const envId = process.env.SUPPORT_TEAM_USER_ID;
    if (envId && mongoose.Types.ObjectId.isValid(envId)) {
        const existing = await User.findById(envId).select('_id');
        if (existing) return existing._id;
    }
    let user = await User.findOne({ username: 'engezhaly_team_system' }).select('_id');
    if (user) return user._id;
    const salt = await bcrypt.genSalt(10);
    const randomPass = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), salt);
    const front = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
    const logoPath = front ? `${front}/logos/logo-green.png` : '/logos/logo-green.png';
    user = await User.create({
        firstName: 'Engezhaly',
        lastName: 'Team',
        username: 'engezhaly_team_system',
        email: `engezhaly.team.support@${crypto.randomBytes(4).toString('hex')}.internal`,
        password: randomPass,
        role: 'freelancer',
        emailVerified: true,
        freelancerProfile: {
            status: 'approved',
            category: 'Development & Tech',
            profilePicture: logoPath,
            bio: 'Official Engezhaly support. Messages here are from our team.'
        }
    });
    return user._id;
}

const getActiveChats = async (req, res) => {
    try {
        const conversations = await Conversation.find()
            .sort({ isFrozen: -1, updatedAt: -1 })
            .limit(80)
            .populate('participants', 'firstName lastName role freelancerProfile.profilePicture clientProfile.profilePicture')
            .populate('lastMessageId', 'content');

        // Format conversations to include sender/receiver info
        const formatted = conversations.map(conv => {
            const participants = conv.participants || [];
            const participant1 = participants[0];
            const participant2 = participants[1];
            
            return {
                _id: conv._id,
                kind: conv.kind || 'direct',
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

const getConversationOffers = async (req, res) => {
    try {
        const { conversationId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(String(conversationId))) {
            return res.status(400).json({ msg: 'Invalid conversation id' });
        }
        const convOid = new mongoose.Types.ObjectId(String(conversationId));
        const conversation = await Conversation.findById(convOid);
        if (!conversation) {
            return res.status(404).json({ msg: 'Conversation not found' });
        }
        const offers = await Offer.find({ conversationId: convOid })
            .populate('senderId', 'firstName lastName role')
            .populate('receiverId', 'firstName lastName role')
            .sort({ createdAt: 1 })
            .lean();
        res.json(offers);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: err.message || 'Server Error' });
    }
};

const sendAdminMessage = async (req, res) => {
    try {
        const { conversationId, receiverId, content } = req.body;
        const adminId = req.user.id;

        // Find conversation
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ msg: 'Conversation not found' });
        }

        const teamId = await getOrCreateSupportTeamUser();
        const parts = (conversation.participants || []).map((p) => String(p));
        let chatSenderId = adminId;
        let chatReceiverId = receiverId;
        if (conversation.kind === 'support') {
            chatSenderId = teamId;
            const customerId = parts.find((p) => p !== String(teamId));
            if (!customerId) {
                return res.status(400).json({ msg: 'Invalid support conversation participants' });
            }
            chatReceiverId = customerId;
        }

        // Create admin message (bypass frozen status)
        const newMsg = new Chat({
            conversationId: conversation._id,
            senderId: chatSenderId,
            receiverId: chatReceiverId,
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
                senderId: chatSenderId,
                content: newMsg.content,
                messageType: 'text',
                createdAt: newMsg.createdAt,
                isAdmin: true,
                isRead: false
            });
        }

        // Same as regular chat: push if online, otherwise offline email (was missing for admin messages)
        const receiverIdStr = String(chatReceiverId);
        const preview = String(content || '').substring(0, 100);
        const chatLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/chat?conversation=${conversation._id}`;
        const senderDisplay = 'Engezhaly Team';

        if (isUserOnline(req.app, receiverIdStr)) {
            emitToUser(req.app, receiverIdStr, {
                title: `New message from ${senderDisplay}`,
                message: preview,
                link: chatLink,
                type: 'chat'
            });
        } else {
            const receiverUser = await User.findById(receiverIdStr).select('email');
            if (receiverUser?.email) {
                const { subject, html } = offlineChatTemplate(senderDisplay, preview, conversation._id);
                sendAndLog(receiverUser.email, subject, html, 'offline_chat', {
                    conversationId: conversation._id,
                    senderId: chatSenderId,
                    receiverId: receiverIdStr
                }).catch((err) => console.error('[Admin Chat] Offline email failed:', err.message));
            }
        }

        res.json(newMsg);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
}

const createSupportConversation = async (req, res) => {
    try {
        const { userId } = req.body || {};
        if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
            return res.status(400).json({ msg: 'Valid userId is required' });
        }
        const customer = await User.findById(userId).select('role');
        if (!customer) return res.status(404).json({ msg: 'User not found' });
        if (customer.role === 'admin') {
            return res.status(400).json({ msg: 'Cannot open support chat with an admin account' });
        }
        const teamId = await getOrCreateSupportTeamUser();
        const candidates = await Conversation.find({
            kind: 'support',
            participants: { $all: [teamId, userId] }
        });
        let conv = candidates.find((c) => (c.participants || []).length === 2);
        if (!conv) {
            conv = new Conversation({
                kind: 'support',
                participants: [teamId, userId],
                lastMessage: ''
            });
            await conv.save();
        }
        const populated = await Conversation.findById(conv._id)
            .populate('participants', 'firstName lastName role freelancerProfile.profilePicture clientProfile.profilePicture')
            .populate('lastMessageId', 'content')
            .lean();
        const participants = populated.participants || [];
        res.json({
            _id: populated._id,
            kind: populated.kind || 'support',
            isFrozen: populated.isFrozen,
            lastMessage: populated.lastMessage,
            content: populated.lastMessageId?.content || populated.lastMessage || 'No messages yet',
            updatedAt: populated.updatedAt,
            createdAt: populated.createdAt,
            participants,
            senderId: participants[0],
            receiverId: participants[1]
        });
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
        const users = await User.find().select('-password +freelancerProfile.cvUrl').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password +phoneNumber +dateOfBirth +freelancerProfile.idDocument +freelancerProfile.cvUrl').lean();
        if (!user) return res.status(404).json({ msg: 'User not found' });
        if (user.role === 'freelancer') {
            const withdrawalMethods = await WithdrawalMethod.find({ userId: req.params.id }).sort({ isDefault: -1, createdAt: -1 }).lean();
            user.withdrawalMethods = withdrawalMethods || [];
        }
        res.json(user);
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

const topUpUserBalance = async (req, res) => {
    try {
        const { amount } = req.body;
        const amountNum = Number(amount);
        if (!Number.isFinite(amountNum) || amountNum <= 0) {
            return res.status(400).json({ msg: 'Amount must be a positive number' });
        }
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        const prevBalance = user.walletBalance || 0;
        user.walletBalance = prevBalance + amountNum;
        await user.save();

        await Transaction.create({
            userId: user._id,
            type: 'deposit',
            amount: amountNum,
            description: 'Admin top-up',
            status: 'completed',
            paymentMethod: 'wallet',
            isManualAdminTopUp: true
        });

        res.json({ user, balance: user.walletBalance });
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
        const projects = await Project.find()
            .populate('sellerId', 'firstName lastName email username freelancerProfile.profilePicture')
            .sort({ createdAt: -1 })
            .lean();
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
        const jobs = await Job.find()
            .populate('clientId', 'firstName lastName email username')
            .sort({ createdAt: -1 })
            .lean();
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
            .populate('buyerId', 'firstName lastName email username freelancerProfile.profilePicture')
            .populate('sellerId', 'firstName lastName email username freelancerProfile.profilePicture')
            .populate('projectId', 'title description category')
            .populate('offerId')
            .sort({ createdAt: -1 })
            .lean();
        res.json(orders);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const getDisputedOrders = async (req, res) => {
    try {
        const orders = await Order.find({ status: 'disputed' })
            .populate('buyerId', 'firstName lastName email username freelancerProfile.profilePicture')
            .populate('sellerId', 'firstName lastName email username freelancerProfile.profilePicture')
            .populate('projectId', 'title description category')
            .populate({ path: 'offerId', select: 'price milestones revisions revisionsUnlimited deliveryDate conversationId whatsIncluded' })
            .sort({ updatedAt: -1 })
            .lean();
        const enriched = orders.map((o) => ({
            ...o,
            conversationId: o.offerId?.conversationId || null
        }));
        res.json(enriched);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const updateOrder = async (req, res) => {
    try {
        const { status, disputeOutcome } = req.body;
        const orderId = req.params.id;
        const existingOrder = await Order.findById(orderId)
            .populate('projectId', 'title')
            .populate('buyerId', 'email firstName lastName')
            .populate('sellerId', 'email firstName lastName');

        if (!existingOrder) return res.status(404).json({ msg: 'Order not found' });

        const wasDisputed = existingOrder.status === 'disputed';
        const order = await Order.findByIdAndUpdate(orderId, { status }, { new: true })
            .populate('projectId', 'title')
            .populate('buyerId', 'email firstName lastName')
            .populate('sellerId', 'email firstName lastName');

        // If resolving a dispute, send email to both parties
        if (wasDisputed && (status === 'completed' || status === 'refunded' || status === 'active')) {
            const title = order.projectId?.title || order.offerId ? 'Custom Offer' : 'Order';
            const outcome = disputeOutcome || `The dispute has been resolved. Status: ${status}.`;
            const buyerEmail = order.buyerId?.email;
            const sellerEmail = order.sellerId?.email;
            const { subject, html } = disputeResolvedTemplate(title, outcome, orderId);
            if (buyerEmail) {
                sendAndLog(buyerEmail, subject, html, 'dispute_resolved', { orderId, userId: order.buyerId._id }).catch(err => console.error('[Admin] Dispute email failed:', err.message));
            }
            if (sellerEmail) {
                sendAndLog(sellerEmail, subject, html, 'dispute_resolved', { orderId, userId: order.sellerId._id }).catch(err => console.error('[Admin] Dispute email failed:', err.message));
            }
        }

        res.json(order);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const getAllTransactions = async (req, res) => {
    try {
        const excludeManualTopUp = req.query.excludeManualTopUp === 'true';
        const query = {};
        if (excludeManualTopUp) query.isManualAdminTopUp = { $ne: true };
        const transactions = await Transaction.find(query).populate('userId', 'firstName lastName');
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

const getEmailLogs = async (req, res) => {
    try {
        const logs = await EmailLog.find()
            .sort({ sentAt: -1 })
            .limit(200)
            .lean();
        res.json(logs);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const getWithdrawals = async (req, res) => {
    try {
        const requests = await WithdrawalRequest.find()
            .sort({ createdAt: -1 })
            .populate('userId', 'firstName lastName email');
        res.json(requests);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const completeWithdrawal = async (req, res) => {
    try {
        const withdrawal = await WithdrawalRequest.findById(req.params.id);
        if (!withdrawal) return res.status(404).json({ msg: 'Withdrawal not found' });
        if (withdrawal.status !== 'pending') return res.status(400).json({ msg: 'Only pending withdrawals can be completed' });

        withdrawal.status = 'completed';
        withdrawal.processedAt = new Date();
        withdrawal.processedBy = req.user.id;
        await withdrawal.save();

        await Transaction.updateOne(
            { userId: withdrawal.userId, type: 'withdrawal', referenceId: withdrawal._id.toString() },
            { $set: { status: 'completed', description: `Withdrawal (${withdrawal.amount} EGP + ${withdrawal.fee} EGP fee) - completed` } }
        );

        res.json(withdrawal);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const rejectWithdrawal = async (req, res) => {
    try {
        const { reason } = req.body || {};
        const reasonStr = reason != null ? String(reason).trim() : '';
        if (!reasonStr) {
            return res.status(400).json({ msg: 'Rejection reason is required' });
        }
        const withdrawal = await WithdrawalRequest.findById(req.params.id);
        if (!withdrawal) return res.status(404).json({ msg: 'Withdrawal not found' });
        if (withdrawal.status !== 'pending') return res.status(400).json({ msg: 'Only pending withdrawals can be rejected' });

        withdrawal.status = 'rejected';
        withdrawal.processedAt = new Date();
        withdrawal.processedBy = req.user.id;
        withdrawal.rejectReason = reasonStr;
        await withdrawal.save();

        const refundAmount = withdrawal.amount + Number(withdrawal.fee ?? 0);
        const user = await User.findById(withdrawal.userId);
        if (user) {
            user.walletBalance = (user.walletBalance || 0) + refundAmount;
            await user.save();
        }

        await Transaction.updateOne(
            { userId: withdrawal.userId, type: 'withdrawal', referenceId: withdrawal._id.toString() },
            { $set: { status: 'failed', description: `Withdrawal rejected - refunded ${refundAmount} EGP` } }
        );
        await Transaction.create({
            userId: withdrawal.userId,
            type: 'refund',
            amount: refundAmount,
            description: `Withdrawal request rejected - refund`,
            status: 'completed',
            referenceId: withdrawal._id.toString()
        });

        res.json(withdrawal);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

module.exports = {
    getPendingFreelancers,
    approveFreelancer,
    rejectFreelancer,
    starFreelancer,
    unstarFreelancer,
    getActiveChats,
    freezeChat,
    unfreezeChat,
    getConversationOffers,
    addStrike,
    toggleEmployeeOfMonth,
    getInsights,
    searchUser,
    getAllUsers,
    getUserById,
    updateUser,
    topUpUserBalance,
    deleteUser,
    getAllProjects,
    updateProject,
    deleteProject,
    getAllJobs,
    updateJob,
    deleteJob,
    getAllOrders,
    getDisputedOrders,
    updateOrder,
    getAllTransactions,
    getTopFreelancers,
    sendAdminMessage,
    createSupportConversation,
    getEmailLogs,
    getWithdrawals,
    completeWithdrawal,
    rejectWithdrawal
};
