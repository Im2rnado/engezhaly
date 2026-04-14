const Order = require('../models/Order');
const Job = require('../models/Job');

async function reviewStatsForSeller(sellerId) {
    const sid = String(sellerId);
    const [orders, jobs] = await Promise.all([
        Order.find({ sellerId: sid, status: 'completed', rating: { $gte: 1, $lte: 5 } }).select('rating').lean(),
        Job.find({
            status: 'completed',
            rating: { $gte: 1, $lte: 5 },
            proposals: { $elemMatch: { freelancerId: sid, status: 'accepted' } }
        }).select('rating').lean()
    ]);
    const ratings = [...orders.map((o) => o.rating), ...jobs.map((j) => j.rating)].filter((r) => r != null);
    const reviewCount = ratings.length;
    const avgRating = reviewCount ? Math.round((ratings.reduce((a, b) => a + b, 0) / reviewCount) * 10) / 10 : 0;
    return { reviewCount, avgRating };
}

module.exports = { reviewStatsForSeller };
