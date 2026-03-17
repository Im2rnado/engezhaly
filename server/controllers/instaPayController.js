const InstaPayPayment = require('../models/InstaPayPayment');
const User = require('../models/User');
const Order = require('../models/Order');
const Offer = require('../models/Offer');
const Job = require('../models/Job');
const Chat = require('../models/Chat');
const Conversation = require('../models/Conversation');
const Transaction = require('../models/Transaction');
const ConsultationPayment = require('../models/ConsultationPayment');
const { createMeetingLink } = require('../services/meetingService');

const INSTAPAY_PHONE = process.env.INSTAPAY_PHONE || '+201234567890';
const INSTAPAY_LINK = process.env.INSTAPAY_LINK || 'https://instapay.example.com';
const CLIENT_FEE = 20;

/**
 * POST /api/payments/instapay
 * Create InstaPay payment intent. Body: { amountCents, type, orderId?, offerId?, jobId?, proposalId?, conversationId? }
 */
const createInstaPayPayment = async (req, res) => {
    try {
        const userId = req.user.id;
        const { amountCents, type, orderId, offerId, jobId, proposalId, conversationId, durationMinutes, meetingDate, meetingTime } = req.body;

        const amountNum = Number(amountCents);
        if (!Number.isFinite(amountNum) || amountNum <= 0) {
            return res.status(400).json({ msg: 'Invalid amount' });
        }

        const amountEGP = amountNum / 100;

        const payment = new InstaPayPayment({
            userId,
            amountCents: amountNum,
            amountEGP,
            meta: { type, orderId, offerId, jobId, proposalId, conversationId, durationMinutes, meetingDate, meetingTime },
            status: 'pending'
        });
        await payment.save();

        res.json({
            id: payment._id,
            amountEGP,
            instructions: {
                phone: INSTAPAY_PHONE,
                link: INSTAPAY_LINK,
                amount: amountEGP
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

/**
 * POST /api/payments/instapay/:id/upload-screenshot
 * Body: { screenshotUrl: string } - URL from existing upload
 */
const uploadScreenshot = async (req, res) => {
    try {
        const userId = req.user.id;
        const { screenshotUrl } = req.body;

        if (!screenshotUrl || typeof screenshotUrl !== 'string') {
            return res.status(400).json({ msg: 'screenshotUrl is required' });
        }

        const payment = await InstaPayPayment.findById(req.params.id);
        if (!payment) return res.status(404).json({ msg: 'Payment not found' });
        if (payment.userId.toString() !== userId) {
            return res.status(403).json({ msg: 'Not authorized' });
        }
        if (payment.status !== 'pending') {
            return res.status(400).json({ msg: 'Payment is not pending' });
        }

        payment.screenshotUrl = screenshotUrl.trim();
        await payment.save();

        res.json({ payment });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

/**
 * GET /api/admin/instapay-pending
 */
const getPendingInstaPay = async (req, res) => {
    try {
        const payments = await InstaPayPayment.find({ status: 'pending' })
            .populate('userId', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .lean();
        res.json(payments);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

/**
 * PATCH /api/admin/instapay/:id/approve
 */
const approveInstaPay = async (req, res) => {
    try {
        const payment = await InstaPayPayment.findById(req.params.id);
        if (!payment) return res.status(404).json({ msg: 'Payment not found' });
        if (payment.status !== 'pending') {
            return res.status(400).json({ msg: 'Payment is not pending' });
        }

        payment.status = 'approved';
        payment.adminReviewedAt = new Date();
        payment.adminNotes = req.body.notes || '';
        await payment.save();

        const meta = payment.meta || {};
        const type = meta.type;
        const amountEGP = payment.amountEGP;
        const clientFee = type === 'consultation' ? 0 : CLIENT_FEE;
        const freelancerReceives = type === 'consultation' ? amountEGP : amountEGP - clientFee;
        const totalClientPaid = amountEGP;

        if (type === 'custom_offer' && meta.offerId) {
            const offer = await Offer.findById(meta.offerId).populate('conversationId').populate('senderId');
            if (offer && offer.status === 'pending') {
                const freelancerReceivesOffer = Number(offer.price) || 0;
                const totalClientPaidOffer = freelancerReceivesOffer + CLIENT_FEE;
                const deliveryDate = offer.deliveryDate
                    ? new Date(offer.deliveryDate)
                    : new Date(Date.now() + (offer.deliveryDays || 7) * 24 * 60 * 60 * 1000);

                const newOrder = new Order({
                    projectId: null,
                    buyerId: payment.userId,
                    sellerId: offer.senderId._id || offer.senderId,
                    packageType: 'Custom',
                    offerId: offer._id,
                    amount: freelancerReceivesOffer,
                    platformFee: CLIENT_FEE,
                    status: 'active',
                    deliveryDate,
                    description: offer.whatsIncluded || 'Custom offer'
                });
                await newOrder.save();

                const convId = offer.conversationId?._id || offer.conversationId;
                if (convId) {
                    const orderContent = `[Engezhaly Order] Order #${newOrder._id}\n\nCustom offer accepted (${offer.price} EGP).\n\nPlease as a client inform the freelancer what you need in chat.`;
                    const orderChat = new Chat({
                        conversationId: convId,
                        senderId: payment.userId,
                        receiverId: offer.senderId._id || offer.senderId,
                        content: orderContent,
                        messageType: 'order'
                    });
                    await orderChat.save();
                    await Conversation.findByIdAndUpdate(convId, { lastMessage: orderContent, lastMessageId: orderChat._id });
                }

                offer.status = 'accepted';
                offer.acceptedAt = new Date();
                await offer.save();

                // ESCROW: Do NOT credit freelancer - money stays in escrow until client approves delivery
                const freelancerId = String(offer.senderId._id || offer.senderId);
                await Transaction.create({
                    userId: payment.userId,
                    type: 'payment',
                    amount: -totalClientPaidOffer,
                    description: `Custom Offer (incl. ${CLIENT_FEE} EGP fee) - held in escrow`,
                    orderId: newOrder._id,
                    relatedUserId: freelancerId
                });
            }
        } else if (type === 'consultation' && meta.conversationId) {
            const paymentRecord = new ConsultationPayment({
                userId: payment.userId,
                conversationId: meta.conversationId,
                amount: amountEGP,
                used: false,
                durationMinutes: meta.durationMinutes || 30
            });
            await paymentRecord.save();

            // Credit freelancer's wallet (money goes to freelancer balance)
            const conversation = await Conversation.findById(meta.conversationId).select('participants');
            if (conversation?.participants?.length >= 2) {
                const freelancerId = conversation.participants.find(p => String(p) !== String(payment.userId));
                if (freelancerId) {
                    const freelancer = await User.findById(freelancerId);
                    if (freelancer) {
                        freelancer.walletBalance = (freelancer.walletBalance || 0) + amountEGP;
                        await freelancer.save();
                        await Transaction.create({
                            userId: freelancerId,
                            type: 'consultation',
                            amount: amountEGP,
                            description: 'Video consultation payment',
                            status: 'completed'
                        });
                    }
                }
            }

            await Transaction.create({
                userId: payment.userId,
                type: 'consultation',
                amount: -amountEGP,
                description: 'Video consultation payment',
                status: 'completed'
            });

            // If meeting date/time were pre-selected, create the meeting now
            if (meta.meetingDate && meta.meetingTime) {
                try {
                    const [year, month, day] = String(meta.meetingDate).split('-').map(Number);
                    const [hour, min] = String(meta.meetingTime).split(':').map(Number);
                    const scheduledAt = new Date(year, month - 1, day, hour, min, 0);
                    if (!isNaN(scheduledAt.getTime()) && scheduledAt >= new Date()) {
                        const { link } = createMeetingLink(meta.conversationId, scheduledAt);
                        if (link) {
                            paymentRecord.used = true;
                            paymentRecord.meetingLink = link;
                            paymentRecord.meetingDate = scheduledAt;
                            paymentRecord.meetingScheduledAt = new Date();
                            await paymentRecord.save();
                            const conversation = await Conversation.findById(meta.conversationId);
                            if (conversation) {
                                const receiverId = conversation.participants.find(p => String(p) !== String(payment.userId));
                                if (receiverId) {
                                    const dateStr = scheduledAt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
                                    const timeStr = scheduledAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                                    const meetingContent = `[Engezhaly Meeting] Video call scheduled for ${dateStr} at ${timeStr}. Join here: ${link}`;
                                    const meetingMsg = new Chat({
                                        conversationId: conversation._id,
                                        senderId: payment.userId,
                                        receiverId,
                                        content: meetingContent,
                                        messageType: 'meeting',
                                        isAdmin: false
                                    });
                                    await meetingMsg.save();
                                    conversation.lastMessage = meetingContent;
                                    conversation.lastMessageId = meetingMsg._id;
                                    await conversation.save();
                                    const io = req.app.get('io');
                                    if (io) {
                                        io.to(`conversation:${conversation._id}`).emit('message', {
                                            _id: meetingMsg._id,
                                            conversationId: conversation._id,
                                            senderId: meetingMsg.senderId,
                                            content: meetingContent,
                                            messageType: 'meeting',
                                            createdAt: meetingMsg.createdAt,
                                            isAdmin: false,
                                            isRead: false
                                        });
                                    }
                                }
                            }
                        }
                    }
                } catch (err) {
                    console.error('[InstaPay] Consultation meeting creation error:', err.message);
                }
            }
        } else if (type === 'project_order' && meta.orderId) {
            const order = await Order.findById(meta.orderId);
            if (order && order.status === 'pending_payment') {
                const totalPays = order.amount + clientFee;
                const freelancerId = String(order.sellerId);

                // ESCROW: Do NOT credit freelancer - money stays in escrow until client approves delivery
                order.status = 'active';
                await order.save();

                await Transaction.create({
                    userId: payment.userId,
                    type: 'payment',
                    amount: -totalPays,
                    description: `Project order - held in escrow`,
                    orderId: order._id,
                    relatedUserId: freelancerId
                });
            }
        } else if (type === 'job_proposal' && meta.jobId && meta.proposalId) {
            const job = await Job.findById(meta.jobId);
            const proposal = job?.proposals?.id(meta.proposalId);
            if (job && proposal) {
                const proposalPrice = Number(proposal.price) || 0;
                const totalPays = proposalPrice + clientFee;
                const freelancerId = String(proposal.freelancerId);

                // ESCROW: Do NOT credit freelancer - money stays in escrow until client approves work
                job.proposals.forEach((p) => {
                    p.status = p._id.toString() === meta.proposalId ? 'accepted' : 'rejected';
                });
                job.status = 'in_progress';
                await job.save();

                await Transaction.create({
                    userId: payment.userId,
                    type: 'payment',
                    amount: -totalPays,
                    description: `Job: ${job.title} - held in escrow`,
                    relatedUserId: freelancerId,
                    metadata: { jobId: meta.jobId, proposalId: meta.proposalId }
                });
            }
        }

        res.json({ payment });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

/**
 * PATCH /api/admin/instapay/:id/deny
 */
const denyInstaPay = async (req, res) => {
    try {
        const payment = await InstaPayPayment.findById(req.params.id);
        if (!payment) return res.status(404).json({ msg: 'Payment not found' });
        if (payment.status !== 'pending') {
            return res.status(400).json({ msg: 'Payment is not pending' });
        }

        payment.status = 'denied';
        payment.adminReviewedAt = new Date();
        payment.adminNotes = req.body.notes || '';
        await payment.save();

        res.json({ payment });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

module.exports = {
    createInstaPayPayment,
    uploadScreenshot,
    getPendingInstaPay,
    approveInstaPay,
    denyInstaPay
};
