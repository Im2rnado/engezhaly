const Job = require('../models/Job');
const User = require('../models/User');
const { sendAndLog } = require('../services/mailgunService');
const { jobApplication: jobApplicationTemplate } = require('../templates/emailTemplates');
const { emitToUser, isUserOnline } = require('../services/notificationService');
const fs = require('fs');

const log = (data) => {
    try {
        fs.appendFileSync('c:\\Users\\DELL\\Desktop\\webicco\\engezhaly\\code\\.cursor\\debug.log', JSON.stringify(data) + '\n');
    } catch (e) { }
};

const createJob = async (req, res) => {
    try {
        const { title, description, skills, budgetMin, budgetMax, deadline } = req.body;

        // Validation: Min budget 500
        if (budgetMin < 500) {
            return res.status(400).json({ msg: 'Minimum budget must be 500 EGP' });
        }

        const newJob = new Job({
            clientId: req.user.id,
            title,
            description,
            skills,
            budgetRange: { min: budgetMin, max: budgetMax },
            deadline
        });

        await newJob.save();
        res.json(newJob);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const getJobs = async (req, res) => {
    try {
        const jobs = await Job.find({ status: 'open' }).sort({ createdAt: -1 }).populate('clientId', 'firstName lastName');
        const userId = req.user?.id;
        const isFreelancer = req.user?.role === 'freelancer';

        if (userId && isFreelancer) {
            const enriched = jobs.map((job) => {
                const hasApplied = job.proposals?.some((p) => p.freelancerId?.toString() === userId);
                return { ...job.toObject(), hasApplied: !!hasApplied };
            });
            return res.json(enriched);
        }
        res.json(jobs);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const applyToJob = async (req, res) => {
    try {
        if (req.user.role !== 'freelancer') {
            return res.status(403).json({ msg: 'Only freelancers can apply to jobs' });
        }
        const { price, deliveryDays, message } = req.body;
        const jobId = req.params.id;
        const freelancerId = req.user.id;

        // #region agent log
        log({ location: 'server/controllers/jobController.js:46', message: 'Applying to job', data: { jobId, freelancerId, price }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: '5' });
        // #endregion

        const job = await Job.findById(jobId).populate('clientId', 'email');
        if (!job) return res.status(404).json({ msg: 'Job not found' });

        if (job.status !== 'open') return res.status(400).json({ msg: 'Job is not open for applications' });

        // Check if already applied
        if (job.proposals.some(p => p.freelancerId && p.freelancerId.toString() === freelancerId)) {
            // #region agent log
            log({ location: 'server/controllers/jobController.js:58', message: 'Duplicate application blocked', data: { jobId, freelancerId }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: '5' });
            // #endregion
            return res.status(400).json({ msg: 'You have already applied to this job' });
        }

        const newProposal = {
            freelancerId,
            price,
            deliveryDays,
            message,
            status: 'pending'
        };

        job.proposals.push(newProposal);
        await job.save();

        // Get Freelancer info for Email
        const freelancer = await User.findById(freelancerId).select('firstName lastName freelancerProfile.bio');
        const freelancerName = freelancer ? `${freelancer.firstName} ${freelancer.lastName}` : 'A freelancer';
        const freelancerBio = freelancer?.freelancerProfile?.bio || '';

        // Notify client: if online -> push; if offline -> email
        const clientId = job.clientId?._id || job.clientId;
        const clientEmail = job.clientId?.email;
        const jobLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/client/jobs/${jobId}`;

        if (clientId && req.app) {
            if (isUserOnline(req.app, clientId)) {
                emitToUser(req.app, clientId, {
                    title: `New application for: ${job.title}`,
                    message: `${freelancerName} has applied to your job.`,
                    link: jobLink,
                    type: 'job_application'
                });
            } else if (clientEmail) {
                const { subject, html } = jobApplicationTemplate(job.title, freelancerName, freelancerBio, jobId);
                sendAndLog(clientEmail, subject, html, 'job_application', { jobId, freelancerId }).catch(err => console.error('[Job] Email failed:', err.message));
            }
        }

        // #region agent log
        log({ location: 'server/controllers/jobController.js:84', message: 'Application successful', data: { jobId }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: '5' });
        // #endregion

        res.json(job.proposals);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
}

const getFreelancerJobs = async (req, res) => {
    try {
        if (req.user.role !== 'freelancer') {
            return res.status(403).json({ msg: 'Only freelancers can access this resource' });
        }
        const freelancerId = req.user.id;

        const jobs = await Job.find({ 'proposals.freelancerId': freelancerId })
            .sort({ updatedAt: -1 })
            .populate('clientId', 'firstName lastName email');

        const formatted = jobs.map((job) => {
            const myProposal = job.proposals.find(
                (p) => p.freelancerId && p.freelancerId.toString() === freelancerId
            );
            return {
                ...job.toObject(),
                myProposal: myProposal || null
            };
        });

        res.json(formatted);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

const submitWork = async (req, res) => {
    try {
        if (req.user.role !== 'freelancer') {
            return res.status(403).json({ msg: 'Only freelancers can submit work' });
        }
        const freelancerId = req.user.id;
        const { id: jobId } = req.params;
        const { message, links, files } = req.body;

        const job = await Job.findById(jobId);
        if (!job) return res.status(404).json({ msg: 'Job not found' });

        if (job.status !== 'in_progress') {
            return res.status(400).json({ msg: 'Work can only be submitted for in-progress jobs' });
        }

        const proposal = job.proposals.find(
            (p) => p.freelancerId && p.freelancerId.toString() === freelancerId
        );
        if (!proposal) {
            return res.status(403).json({ msg: 'You did not apply to this job' });
        }
        if (proposal.status !== 'accepted') {
            return res.status(400).json({ msg: 'Only accepted freelancers can submit work' });
        }

        proposal.workSubmission = {
            message: typeof message === 'string' ? message.trim() : '',
            links: Array.isArray(links) ? links.filter(Boolean) : [],
            files: Array.isArray(files) ? files.filter(Boolean) : [],
            submittedAt: proposal.workSubmission?.submittedAt || new Date(),
            updatedAt: new Date()
        };

        await job.save();
        res.json({ msg: 'Work submitted successfully', proposal });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

module.exports = {
    createJob,
    getJobs,
    applyToJob,
    getFreelancerJobs,
    submitWork
};
