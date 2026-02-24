const User = require('../models/User');
const Order = require('../models/Order');

const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            category,
            experienceYears,
            certificates, // Array of URLs
            skills,
            surveyResponses,
            starterPricing,
            bio,
            idDocument,
            profilePicture
        } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        if (user.role !== 'freelancer') {
            return res.status(403).json({ msg: 'Access denied. User is not a freelancer.' });
        }

        // Update fields
        if (category !== undefined) user.freelancerProfile.category = category;
        if (experienceYears !== undefined) {
            const expNum = Number(experienceYears);
            if (isNaN(expNum) || expNum < 0 || expNum > 100) {
                return res.status(400).json({ msg: 'Experience years must be between 0 and 100' });
            }
            user.freelancerProfile.experienceYears = expNum;
        }
        if (certificates) user.freelancerProfile.certificates = certificates;
        if (skills !== undefined) {
            user.freelancerProfile.skills = Array.isArray(skills) ? skills : [];
        }
        if (surveyResponses) user.freelancerProfile.surveyResponses = surveyResponses;
        if (starterPricing) user.freelancerProfile.starterPricing = starterPricing;
        if (bio !== undefined) user.freelancerProfile.bio = bio;
        if (idDocument) user.freelancerProfile.idDocument = idDocument;
        if (profilePicture !== undefined) user.freelancerProfile.profilePicture = profilePicture;

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
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const getPublicProfile = async (req, res) => {
    try {
        const freelancerId = req.params.id;
        const user = await User.findById(freelancerId)
            .select('-password -phoneNumber -strikes -isFrozen -walletBalance')
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

        res.json(user);
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

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ msg: 'Order not found' });
        if (order.sellerId.toString() !== userId) {
            return res.status(403).json({ msg: 'Only the seller can raise a dispute on this order' });
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

const getMyOrders = async (req, res) => {
    try {
        const freelancerId = req.user.id;
        const orders = await Order.find({ sellerId: freelancerId })
            .populate('projectId', 'title packages')
            .populate('buyerId', 'firstName lastName email')
            .sort({ createdAt: -1 });

        res.json(orders);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
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
            .populate('projectId', 'title packages')
            .populate('buyerId', 'firstName lastName email')
            .populate('sellerId', 'firstName lastName email');

        return res.json(populated);
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ msg: err.message || 'Server Error' });
    }
};

module.exports = {
    updateProfile,
    getProfile,
    getPublicProfile,
    getTopFreelancers,
    getMyOrders,
    submitOrderWork,
    raiseDispute
};
