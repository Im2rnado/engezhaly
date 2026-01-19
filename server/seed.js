const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Job = require('./models/Job');
const Project = require('./models/Project');

const seedData = async () => {
    try {
        const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/engezhaly';
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB Connected for Seeding');

        // Clear existing data
        await User.deleteMany({});
        await Job.deleteMany({});
        await Project.deleteMany({});
        console.log('Cleared existing data');

        // Create Users
        const salt = await bcrypt.genSalt(10);
        const password = await bcrypt.hash('Engezhaly123!', salt);

        const admin = await User.create({
            firstName: 'Ahmed',
            lastName: 'Khattab',
            username: 'admin',
            email: 'admin@engezhaly.com',
            password,
            role: 'admin',
            walletBalance: 0
        });

        const client = await User.create({
            firstName: 'Ahmed',
            lastName: 'Hatem',
            username: 'client',
            email: 'client@engezhaly.com',
            password,
            role: 'client',
            businessType: 'company',
            walletBalance: 5000
        });

        const freelancer = await User.create({
            firstName: 'Yassin',
            lastName: 'Bedier',
            username: 'freelancer',
            email: 'freelancer@engezhaly.com',
            password,
            role: 'freelancer',
            walletBalance: 0,
            freelancerProfile: {
                status: 'approved',
                bio: 'Expert Full Stack Developer',
                category: 'Development & Tech',
                experienceYears: 5,
                skills: ['React', 'Node.js', 'MongoDB'],
                starterPricing: {
                    basic: { price: 500, days: 3, description: 'Small fix' },
                    standard: { price: 1500, days: 7, description: 'Single page app' },
                    premium: { price: 3000, days: 14, description: 'Full website' }
                }
            }
        });

        console.log('Users created');

        // Create Job
        await Job.create({
            clientId: client._id,
            title: 'Build a React Website',
            description: 'Need a modern website using Next.js and Tailwind.',
            skills: ['React', 'Tailwind'],
            budgetRange: { min: 1000, max: 3000 },
            deadline: '2 weeks',
            status: 'open'
        });

        console.log('Job created');

        // Create Project
        await Project.create({
            sellerId: freelancer._id,
            title: 'I will build your MERN stack application',
            description: 'Professional MERN stack development services',
            category: 'Development & Tech',
            subCategory: 'Full-Stack',
            packages: [
                {
                    type: 'Basic',
                    price: 1000,
                    days: 5,
                    features: ['Backend Setup', 'Basic UI'],
                    revisions: 1
                },
                {
                    type: 'Standard',
                    price: 2500,
                    days: 10,
                    features: ['Full Stack', 'Responsive'],
                    revisions: 2
                },
                {
                    type: 'Premium',
                    price: 5000,
                    days: 20,
                    features: ['Advanced Features', 'SEO', 'Deployment'],
                    revisions: 3
                }
            ],
            isActive: true
        });

        console.log('Project created');

        console.log('Seeding Completed Successfully');
        process.exit(0);
    } catch (err) {
        console.error('Seeding Error:', err);
        process.exit(1);
    }
};

seedData();
