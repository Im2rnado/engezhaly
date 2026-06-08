const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const SECURE_UPLOAD_DIR = path.join(__dirname, '..', 'secure_uploads');

require('../models/User');
const User = mongoose.model('User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/engezhaly';

const migrate = async () => {
    try {
        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            family: 4
        });
        console.log('MongoDB connected.');

        if (!fs.existsSync(SECURE_UPLOAD_DIR)) {
            fs.mkdirSync(SECURE_UPLOAD_DIR, { recursive: true });
        }

        const users = await User.find({
            $or: [
                { 'freelancerProfile.idDocument': { $regex: '/uploads/' } },
                { 'freelancerProfile.universityId': { $regex: '/uploads/' } },
                { 'freelancerProfile.cvUrl': { $regex: '/uploads/' } }
            ]
        }).select('+freelancerProfile.idDocument +freelancerProfile.cvUrl').lean();

        console.log(`Found ${users.length} users with documents to migrate.`);

        for (const user of users) {
            let modified = false;

            const fields = ['idDocument', 'universityId', 'cvUrl'];
            for (const field of fields) {
                const url = user.freelancerProfile?.[field];
                if (url && url.includes('/uploads/')) {
                    const filename = url.split('/uploads/').pop();
                    const oldPath = path.join(UPLOAD_DIR, filename);
                    const newPath = path.join(SECURE_UPLOAD_DIR, filename);

                    if (fs.existsSync(oldPath)) {
                        fs.renameSync(oldPath, newPath);
                        console.log(`Moved ${filename} to secure_uploads`);
                    } else {
                        console.log(`File ${filename} not found in uploads, updating URL anyway.`);
                    }

                    user.freelancerProfile[field] = url.replace('/uploads/', '/secure-uploads/');
                    modified = true;
                }
            }

            if (modified) {
                const updateFields = {};
                for (const field of fields) {
                    if (user.freelancerProfile[field]) {
                        updateFields[`freelancerProfile.${field}`] = user.freelancerProfile[field];
                    }
                }
                await User.updateOne({ _id: user._id }, { $set: updateFields });
                console.log(`Updated URLs for user ${user._id}`);
            }
        }

        console.log('Migration complete.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

migrate();
