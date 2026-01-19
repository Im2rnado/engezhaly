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

module.exports = {
    updateProfile,
    getProfile,
    getPublicProfile,
    getTopFreelancers
};
