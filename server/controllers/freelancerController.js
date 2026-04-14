const User = require('../models/User');
const { isValidEgyptianE164 } = require('../utils/phoneValidation');
const Order = require('../models/Order');
const Job = require('../models/Job');
const Chat = require('../models/Chat');
const { emitChatContextRefresh } = require('../services/chatContextRefresh');
const Conversation = require('../models/Conversation');
const { sendAndLog } = require('../services/mailgunService');
const { orderApproved, orderDenied, workSubmitted } = require('../templates/emailTemplates');
const { reviewStatsForSeller } = require('../utils/reviewStatsForSeller');

/** If order.revision fields were missing but linked offer has them, expose offer values (read path fix). */
const orderWithRevisionFallback = (order) => {
    const o = order.toObject ? order.toObject({ virtuals: true }) : { ...order };
    if (o.offerId && typeof o.offerId === 'object') {
        const off = o.offerId;
        const orderEmpty = !o.revisionsUnlimited && (o.revisions === undefined || o.revisions === null || Number(o.revisions) === 0);
        const offerHas = !!off.revisionsUnlimited || (Number(off.revisions) > 0);
        if (orderEmpty && offerHas) {
            o.revisions = off.revisionsUnlimited ? 0 : Math.max(0, Math.floor(Number(off.revisions) || 0));
            o.revisionsUnlimited = !!off.revisionsUnlimited;
        }
        if (!o.deliveryDate && off.deliveryDate) {
            o.deliveryDate = off.deliveryDate;
        }
    }
    if (!o.deliveryDate && o.projectId && typeof o.projectId === 'object' && Array.isArray(o.projectId.packages) && o.packageType && o.createdAt) {
        const pkg = o.projectId.packages.find((p) => p && p.type === o.packageType);
        const days = pkg?.days;
        if (days != null && !Number.isNaN(Number(days))) {
            const d = new Date(o.createdAt);
            d.setDate(d.getDate() + Number(days));
            if (!Number.isNaN(d.getTime())) o.deliveryDate = d;
        }
    }
    return o;
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            category,
            experienceYears,
            certificates, // Array of URLs
            isStudent,
            universityId,
            skills,
            technicalSkills,
            softSkills,
            surveyResponses,
            starterPricing,
            starterOffer,
            signupNotes,
            bio,
            idDocument,
            profilePicture,
            city,
            languages,
            extraLanguages,
            portfolio,
            certifications,
            consultationPrice,
            cvUrl,
            phoneNumber
        } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // if (user.role !== 'freelancer') {
        //     return res.status(403).json({ msg: 'Access denied. User is not a freelancer.' });
        // }

        if (phoneNumber !== undefined) {
            const trimmed = typeof phoneNumber === 'string' ? phoneNumber.trim() : '';
            if (!trimmed) {
                return res.status(400).json({ msg: 'Phone number is required' });
            }
            if (!isValidEgyptianE164(trimmed)) {
                return res.status(400).json({ msg: 'Phone must be a valid Egyptian mobile (11 digits: 01xxxxxxxxx).' });
            }
            user.phoneNumber = trimmed;
        }

        // Category is fixed after first signup — never change via profile update
        if (category !== undefined && !user.freelancerProfile?.category) {
            user.freelancerProfile.category = category;
        }
        if (experienceYears !== undefined) {
            const expNum = Number(experienceYears);
            if (isNaN(expNum) || expNum < 0 || expNum > 100) {
                return res.status(400).json({ msg: 'Experience years must be between 0 and 100' });
            }
            user.freelancerProfile.experienceYears = expNum;
        }
        if (certificates) user.freelancerProfile.certificates = certificates;
        if (isStudent !== undefined) user.freelancerProfile.isStudent = isStudent;
        if (universityId !== undefined) user.freelancerProfile.universityId = universityId;
        if (technicalSkills !== undefined) {
            user.freelancerProfile.technicalSkills = Array.isArray(technicalSkills) ? technicalSkills : [];
        }
        if (softSkills !== undefined) {
            user.freelancerProfile.softSkills = Array.isArray(softSkills) ? softSkills : [];
        }
        if (skills !== undefined) {
            user.freelancerProfile.skills = Array.isArray(skills) ? skills : [];
        }
        if (surveyResponses) user.freelancerProfile.surveyResponses = surveyResponses;
        if (cvUrl !== undefined) user.freelancerProfile.cvUrl = typeof cvUrl === 'string' ? cvUrl.trim() : null;
        if (starterPricing) user.freelancerProfile.starterPricing = starterPricing;
        if (starterOffer !== undefined && typeof starterOffer === 'object') user.freelancerProfile.starterOffer = starterOffer;
        if (signupNotes !== undefined && typeof signupNotes === 'string') user.freelancerProfile.signupNotes = signupNotes.trim();
        if (bio !== undefined) user.freelancerProfile.bio = bio;
        if (idDocument) user.freelancerProfile.idDocument = idDocument;
        if (profilePicture !== undefined) user.freelancerProfile.profilePicture = profilePicture;
        if (consultationPrice !== undefined && consultationPrice >= 0) user.freelancerProfile.consultationPrice = Number(consultationPrice);
        if (city !== undefined) user.freelancerProfile.city = city;
        if (languages && typeof languages === 'object') {
            user.freelancerProfile.languages = user.freelancerProfile.languages || {};
            if (languages.english !== undefined) user.freelancerProfile.languages.english = languages.english;
            if (languages.arabic !== undefined) user.freelancerProfile.languages.arabic = languages.arabic;
            if (languages.francoArabic !== undefined) user.freelancerProfile.languages.francoArabic = languages.francoArabic;
        }
        if (extraLanguages !== undefined && Array.isArray(extraLanguages)) {
            user.freelancerProfile.extraLanguages = extraLanguages.filter(Boolean).map(String);
        }
        if (portfolio !== undefined && Array.isArray(portfolio)) {
            user.freelancerProfile.portfolio = portfolio.map(p => ({
                title: p?.title || '',
                description: p?.description || '',
                imageUrl: p?.imageUrl || '',
                link: p?.link || '',
                subCategory: p?.subCategory || ''
            }));
        }
        if (certifications !== undefined && Array.isArray(certifications)) {
            user.freelancerProfile.certifications = certifications.map(c => ({
                name: c?.name || '',
                date: c?.date ? new Date(c.date) : null,
                institute: c?.institute || '',
                documentUrl: c?.documentUrl || ''
            }));
        }

        // Toggle Busy Mode
        if (req.body.isBusy !== undefined) {
            user.freelancerProfile.isBusy = req.body.isBusy;
        }

        // After Step 3 (Survey & Pricing), we can assume the profile submission is complete for review
        // But maybe we want a flag for that. For now, let's keep status as 'pending'.

        await user.save();

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password +phoneNumber');
        const obj = user?.toObject ? user.toObject() : user;
        const fp = obj?.freelancerProfile;
        if (fp && (!Array.isArray(fp.technicalSkills) || fp.technicalSkills.length === 0) && (!Array.isArray(fp.softSkills) || fp.softSkills.length === 0) && fp.skills?.length > 0) {
            fp.technicalSkills = Array.isArray(fp.skills) ? fp.skills : [];
        }
        res.json(obj || user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const getPublicProfile = async (req, res) => {
    try {
        const freelancerId = req.params.id;
        const user = await User.findById(freelancerId)
            .select('-password -phoneNumber -strikes -isFrozen -walletBalance +dateOfBirth')
            .select('-freelancerProfile.idDocument');

        if (!user) {
            return res.status(404).json({ msg: 'Freelancer not found' });
        }

        if (user.role !== 'freelancer') {
            return res.status(400).json({ msg: 'User is not a freelancer' });
        }

        // Only show approved freelancers
        if (user.freelancerProfile?.status !== 'approved') {
            return res.status(403).json({ msg: 'Freelancer profile is not available' });
        }

        const obj = user.toObject ? user.toObject() : user;
        if (obj.freelancerProfile?.certifications && Array.isArray(obj.freelancerProfile.certifications)) {
            obj.freelancerProfile.certifications = obj.freelancerProfile.certifications.map((c) => {
                const { documentUrl, ...rest } = c;
                return rest;
            });
        }
        // Migration: if only legacy skills exists, treat as technicalSkills for backward compat
        const fp = obj.freelancerProfile;
        if (fp) {
            if (!Array.isArray(fp.technicalSkills)) fp.technicalSkills = [];
            if (!Array.isArray(fp.softSkills)) fp.softSkills = [];
            if (fp.technicalSkills.length === 0 && fp.softSkills.length === 0 && fp.skills?.length > 0) {
                fp.technicalSkills = Array.isArray(fp.skills) ? fp.skills : [];
            }
        }
        res.json(obj);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const getReviewStats = async (req, res) => {
    try {
        const stats = await reviewStatsForSeller(req.params.sellerId);
        res.json(stats);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const getReviews = async (req, res) => {
    try {
        const sellerId = req.params.id;
        const orders = await Order.find({
            sellerId,
            status: 'completed',
            rating: { $exists: true, $gte: 1, $lte: 5 }
        })
            .populate('buyerId', 'firstName')
            .sort({ completedAt: -1 })
            .limit(20)
            .lean();
        const fromOrders = orders.map(o => ({
            rating: o.rating,
            review: o.review,
            buyerName: o.buyerId?.firstName ? `${o.buyerId.firstName}.` : 'Client', // Anonymized
            completedAt: o.completedAt
        }));

        const jobs = await Job.find({
            status: 'completed',
            rating: { $exists: true, $gte: 1, $lte: 5 },
            proposals: { $elemMatch: { freelancerId: sellerId, status: 'accepted' } }
        })
            .populate('clientId', 'firstName')
            .sort({ updatedAt: -1 })
            .limit(20)
            .lean();
        const fromJobs = jobs.map((j) => ({
            rating: j.rating,
            review: j.review,
            buyerName: j.clientId?.firstName ? `${j.clientId.firstName}.` : 'Client',
            completedAt: j.updatedAt
        }));

        const merged = [...fromOrders, ...fromJobs].sort(
            (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
        ).slice(0, 20);
        res.json(merged);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const getTopFreelancers = async (req, res) => {
    try {
        // Get top freelancers by various metrics
        // 1. Most Completed Deals
        const mostDeals = await Order.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: '$sellerId', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        // 2. Top Rated
        const topRated = await Order.aggregate([
            { $match: { status: 'completed', rating: { $exists: true } } },
            { $group: { _id: '$sellerId', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
            { $match: { count: { $gte: 1 } } },
            { $sort: { avgRating: -1, count: -1 } },
            { $limit: 5 }
        ]);

        // Fetch user details
        const freelancerIds = [
            ...mostDeals.map(d => d._id),
            ...topRated.map(r => r._id)
        ].filter((id, index, self) => self.indexOf(id) === index).slice(0, 6); // Get unique IDs, max 6

        const freelancers = await User.find({
            _id: { $in: freelancerIds },
            'freelancerProfile.status': 'approved'
        })
            .select('firstName lastName freelancerProfile email')
            .limit(6);

        // Enrich with stats
        const enriched = freelancers.map(freelancer => {
            const dealsData = mostDeals.find(d => d._id.toString() === freelancer._id.toString());
            const ratingData = topRated.find(r => r._id.toString() === freelancer._id.toString());

            return {
                ...freelancer.toObject(),
                completedDeals: dealsData?.count || 0,
                avgRating: ratingData?.avgRating || 0,
                startingPrice: freelancer.freelancerProfile?.starterPricing?.basic?.price || 0
            };
        });

        // Sort by completed deals and rating
        enriched.sort((a, b) => {
            if (b.completedDeals !== a.completedDeals) {
                return b.completedDeals - a.completedDeals;
            }
            return b.avgRating - a.avgRating;
        });

        res.json(enriched.slice(0, 6)); // Return top 6
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const raiseDispute = async (req, res) => {
    try {
        const userId = req.user.id;
        const orderId = req.params.id;
        const { reason } = req.body;
        const reasonStr = typeof reason === 'string' ? reason.trim() : '';
        if (!reasonStr || reasonStr.length < 10) {
            return res.status(400).json({ msg: 'Please provide a dispute reason (at least 10 characters).' });
        }

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ msg: 'Order not found' });
        if (order.sellerId.toString() !== userId) {
            return res.status(403).json({ msg: 'Only the seller can raise a dispute on this order' });
        }
        if (order.status !== 'active') {
            return res.status(400).json({ msg: 'Can only dispute active orders' });
        }

        order.status = 'disputed';
        order.disputeReason = reasonStr;
        await order.save();

        res.json({ msg: 'Dispute raised. Our team will review and resolve it shortly.', order });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const getMyOrders = async (req, res) => {
    try {
        const freelancerId = req.user.id;
        const orders = await Order.find({ sellerId: freelancerId })
            .populate('projectId', 'title packages subCategory')
            .populate('buyerId', 'firstName lastName email')
            .populate('offerId', 'revisions revisionsUnlimited deliveryDate')
            .sort({ createdAt: -1 });

        res.json(orders.map((ord) => orderWithRevisionFallback(ord)));
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const getOrderById = async (req, res) => {
    try {
        const freelancerId = req.user.id;
        const order = await Order.findById(req.params.id)
            .populate('projectId', 'title packages subCategory description')
            .populate('buyerId', 'firstName lastName email')
            .populate('offerId');

        if (!order) {
            return res.status(404).json({ msg: 'Order not found' });
        }
        if (String(order.sellerId) !== String(freelancerId)) {
            return res.status(403).json({ msg: 'Not authorized to view this order' });
        }

        res.json(orderWithRevisionFallback(order));
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: err.message || 'Server Error' });
    }
};

const submitOrderWork = async (req, res) => {
    try {
        const freelancerId = req.user.id;
        const { id: orderId } = req.params;
        const { message = '', links = [], files = [] } = req.body;

        const user = await User.findById(freelancerId);
        if (!user || user.role !== 'freelancer') {
            return res.status(403).json({ msg: 'Only freelancers can submit work' });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ msg: 'Order not found' });
        }

        if (String(order.sellerId) !== String(freelancerId)) {
            return res.status(403).json({ msg: 'Not authorized to submit work for this order' });
        }

        if (order.status !== 'active') {
            return res.status(400).json({ msg: 'Can only submit work for active orders' });
        }

        order.workSubmission = {
            message: String(message || '').trim(),
            links: Array.isArray(links) ? links.filter(Boolean) : [],
            files: Array.isArray(files) ? files.filter(Boolean) : [],
            submittedAt: order.workSubmission?.submittedAt || new Date(),
            updatedAt: new Date()
        };

        await order.save();

        const populated = await Order.findById(orderId)
            .populate('projectId', 'title packages subCategory')
            .populate('buyerId', 'firstName lastName email')
            .populate('sellerId', 'firstName lastName email');

        // Email notification to client
        if (populated.buyerId?.email) {
            const clientName = populated.buyerId.firstName;
            const freelancerName = populated.sellerId.firstName;
            const title = populated.projectId?.title || 'Order Work';
            const { subject, html } = workSubmitted(clientName, freelancerName, title, orderId);
            sendAndLog(populated.buyerId.email, subject, html, 'work_submitted', { orderId });
        }

        return res.json(populated);
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ msg: err.message || 'Server Error' });
    }
};

const approveOrder = async (req, res) => {
    try {
        const freelancerId = req.user.id;
        const orderId = req.params.id;

        const order = await Order.findById(orderId)
            .populate('projectId', 'title packages')
            .populate('buyerId', 'firstName lastName email');

        if (!order) return res.status(404).json({ msg: 'Order not found' });
        if (String(order.sellerId) !== String(freelancerId)) {
            return res.status(403).json({ msg: 'Not authorized to approve this order' });
        }
        if (order.status !== 'pending_approval') {
            return res.status(400).json({ msg: 'Only pending approval orders can be approved' });
        }

        // Set to pending_payment - client must pay via Paymob before seller is credited
        order.status = 'pending_payment';
        await order.save();

        const clientName = order.buyerId ? `${order.buyerId.firstName} ${order.buyerId.lastName}` : 'Client';
        const offerTitle = order.projectId?.title || 'Order';

        if (order.buyerId?.email) {
            const { subject, html } = orderApproved(clientName, offerTitle, order.amount, orderId);
            sendAndLog(order.buyerId.email, subject, html, 'order_approved', { orderId }).catch(err => console.error('[Freelancer] orderApproved email failed:', err.message));
        }

        const populated = await Order.findById(orderId)
            .populate('projectId', 'title packages subCategory')
            .populate('buyerId', 'firstName lastName email');

        // Sync order approval to chat
        const conversation = await Conversation.findOne({
            participants: { $all: [String(order.buyerId._id), String(freelancerId)] }
        });
        
        if (conversation) {
            const chatMsg = new Chat({
                conversationId: conversation._id,
                senderId: freelancerId,
                receiverId: order.buyerId._id,
                content: `[Engezhaly Order] Freelancer has accepted the order request. Please complete the payment of ${order.amount} EGP via Credit Card or InstaPay using the dashboard (My Orders) or chat button.`,
                messageType: 'order',
                isAdmin: false
            });
            await chatMsg.save();
            await Conversation.findByIdAndUpdate(conversation._id, { 
                lastMessage: chatMsg.content, 
                lastMessageId: chatMsg._id 
            });
            const io = req.app?.get('io');
            if (io) {
                io.to(`conversation:${conversation._id}`).emit('message', {
                    _id: chatMsg._id,
                    conversationId: conversation._id,
                    senderId: freelancerId,
                    content: chatMsg.content,
                    messageType: 'order',
                    createdAt: chatMsg.createdAt,
                    isAdmin: false,
                    isRead: false
                });
            }
            emitChatContextRefresh(io, conversation._id);
        }

        res.json(populated);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: err.message || 'Server Error' });
    }
};

const denyOrder = async (req, res) => {
    try {
        const freelancerId = req.user.id;
        const orderId = req.params.id;

        const order = await Order.findById(orderId)
            .populate('projectId', 'title')
            .populate('buyerId', 'firstName lastName email');

        if (!order) return res.status(404).json({ msg: 'Order not found' });
        if (String(order.sellerId) !== String(freelancerId)) {
            return res.status(403).json({ msg: 'Not authorized to deny this order' });
        }
        if (order.status !== 'pending_approval') {
            return res.status(400).json({ msg: 'Only pending approval orders can be denied' });
        }

        // No refund needed - client was never charged (payment happens on approval)
        order.status = 'refunded';
        await order.save();

        const clientName = order.buyerId ? `${order.buyerId.firstName} ${order.buyerId.lastName}` : 'Client';
        const offerTitle = order.projectId?.title || 'Order';

        if (order.buyerId?.email) {
            const { subject, html } = orderDenied(clientName, offerTitle, order.amount, orderId);
            sendAndLog(order.buyerId.email, subject, html, 'order_denied', { orderId }).catch(err => console.error('[Freelancer] orderDenied email failed:', err.message));
        }

        const populated = await Order.findById(orderId)
            .populate('projectId', 'title packages subCategory')
            .populate('buyerId', 'firstName lastName email');

        // Sync order denial to chat (mirror approveOrder)
        const conversation = await Conversation.findOne({
            participants: { $all: [String(order.buyerId._id), String(freelancerId)] }
        });
        if (conversation) {
            const chatMsg = new Chat({
                conversationId: conversation._id,
                senderId: freelancerId,
                receiverId: order.buyerId._id,
                content: `[Engezhaly Order] Freelancer has declined this order request.`,
                messageType: 'order',
                isAdmin: false
            });
            await chatMsg.save();
            await Conversation.findByIdAndUpdate(conversation._id, {
                lastMessage: chatMsg.content,
                lastMessageId: chatMsg._id
            });
            const io = req.app?.get('io');
            if (io) {
                io.to(`conversation:${conversation._id}`).emit('message', {
                    _id: chatMsg._id,
                    conversationId: conversation._id,
                    senderId: freelancerId,
                    content: chatMsg.content,
                    messageType: 'order',
                    createdAt: chatMsg.createdAt,
                    isAdmin: false,
                    isRead: false
                });
            }
            emitChatContextRefresh(io, conversation._id);
        }

        res.json(populated);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: err.message || 'Server Error' });
    }
};

const submitMilestoneWork = async (req, res) => {
    try {
        const freelancerId = req.user.id;
        const { jobId, milestoneIdx } = req.params;
        const { note, message, files, links } = req.body;

        const job = await Job.findById(jobId);
        if (!job) return res.status(404).json({ msg: 'Job not found' });

        const acceptedProposal = job.proposals.find(
            p => p.status === 'accepted' && String(p.freelancerId) === freelancerId
        );
        if (!acceptedProposal) {
            return res.status(403).json({ msg: 'You do not have an accepted proposal on this job' });
        }

        const idx = Number(milestoneIdx);
        if (!acceptedProposal.milestones || idx < 0 || idx >= acceptedProposal.milestones.length) {
            return res.status(400).json({ msg: 'Invalid milestone index' });
        }

        const milestone = acceptedProposal.milestones[idx];
        milestone.status = 'submitted';
        const text = String(message || note || '').trim();
        milestone.submissionNote = text;
        milestone.submissionFiles = Array.isArray(files) ? files : [];
        let linkArr = [];
        if (Array.isArray(links)) {
            linkArr = links.filter(Boolean).map(String);
        } else if (typeof links === 'string' && links.trim()) {
            linkArr = links.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
        }
        milestone.submissionLinks = linkArr;
        acceptedProposal.milestones[idx] = milestone;

        job.markModified('proposals');
        await job.save();

        res.json({ msg: 'Milestone work submitted successfully', job });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: err.message || 'Server Error' });
    }
};

module.exports = {
    updateProfile,
    getProfile,
    getPublicProfile,
    getReviewStats,
    getReviews,
    getTopFreelancers,
    getMyOrders,
    getOrderById,
    submitOrderWork,
    raiseDispute,
    approveOrder,
    denyOrder,
    submitMilestoneWork
};
