const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('./models/User');
const User = mongoose.model('User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/engezhaly';

const test = async () => {
    await mongoose.connect(MONGO_URI);
    const users = await User.find({
        $or: [
            { 'freelancerProfile.idDocument': { $regex: '/uploads/' } },
            { 'freelancerProfile.universityId': { $regex: '/uploads/' } },
            { 'freelancerProfile.cvUrl': { $regex: '/uploads/' } }
        ]
    }).select('+freelancerProfile.idDocument +freelancerProfile.cvUrl').lean();

    console.log(`Found ${users.length} users with documents to migrate.`);
    if (users.length > 0) {
        console.log("First user freelancerProfile:", users[0].freelancerProfile);
    }
    process.exit(0);
};

test();
