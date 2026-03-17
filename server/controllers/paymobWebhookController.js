const PaymentMethod = require('../models/PaymentMethod');
const PendingCharge = require('../models/PendingCharge');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Order = require('../models/Order');
const Job = require('../models/Job');
const Chat = require('../models/Chat');
const Conversation = require('../models/Conversation');
const ConsultationPayment = require('../models/ConsultationPayment');
const { verifyWebhookHmac } = require('../services/paymobService');
const { createMeetingLink } = require('../services/meetingService');

const CLIENT_PLATFORM_FEE = 20; // 20 EGP charged to client on each payment
// Freelancer receives full amount; 20 EGP withdrawal fee applied when they withdraw

/**
 * Fulfill a completed payment - credit freelancer, create records, etc.
 * Client pays +20 EGP fee; freelancer receives full amount (withdrawal fee applied on withdrawal).
 */
const fulfillCharge = async (pendingCharge, app) => {
    const { meta } = pendingCharge;
    if (!meta || !meta.type) return;

    switch (meta.type) {
        case 'job_proposal': {
            const job = await Job.findById(meta.jobId).populate('clientId freelancerId');
            if (!job || job.status !== 'open') return;
            const proposal = job.proposals.id(meta.proposalId);
            if (!proposal) return;
            const freelancerId = proposal.freelancerId;
            const totalClientPaid = pendingCharge.amountCents / 100;

            // ESCROW: Do NOT credit freelancer - money stays in escrow until client approves work
            job.proposals.forEach((p) => {
                p.status = p._id.toString() === meta.proposalId ? 'accepted' : 'rejected';
            });
            job.status = 'in_progress';
            await job.save();

            await Transaction.create({
                userId: pendingCharge.userId,
                type: 'payment',
                amount: -totalClientPaid,
                description: `Job: ${job.title} - held in escrow`,
                orderId: null,
                relatedUserId: freelancerId,
                metadata: { jobId: meta.jobId, proposalId: meta.proposalId }
            });
            break;
        }
        case 'project_order': {
            const order = await Order.findById(meta.orderId)
                .populate('projectId')
                .populate('buyerId')
                .populate('sellerId');
            if (!order || (order.status !== 'pending_approval' && order.status !== 'pending_payment')) return;

            const totalClientPaid = pendingCharge.amountCents / 100;
            const freelancerId = order.sellerId?._id || order.sellerId;

            // ESCROW: Do NOT credit freelancer - money stays in escrow until client approves delivery
            order.status = 'active';
            await order.save();

            await Transaction.create({
                userId: order.buyerId?._id || order.buyerId,
                type: 'payment',
                amount: -totalClientPaid,
                description: `Order: ${order.projectId?.title || 'Project'} - held in escrow`,
                orderId: order._id,
                relatedUserId: freelancerId
            });
            break;
        }
        case 'custom_offer': {
            const OrderModel = require('../models/Order');
            const Offer = require('../models/Offer');
            const offer = await Offer.findById(meta.offerId)
                .populate('senderId')
                .populate('conversationId');
            if (!offer || offer.status !== 'pending') return;

            const totalClientPaid = pendingCharge.amountCents / 100;
            const clientFee = 20;

            const orderDeliveryDate = offer.deliveryDate
                ? new Date(offer.deliveryDate)
                : new Date(Date.now() + (offer.deliveryDays || 7) * 24 * 60 * 60 * 1000);

            const order = new OrderModel({
                projectId: null,
                buyerId: pendingCharge.userId,
                sellerId: offer.senderId,
                packageType: 'Custom',
                offerId: offer._id,
                amount: offer.price,
                platformFee: clientFee,
                status: 'active',
                deliveryDate: orderDeliveryDate
            });
            await order.save();

            // Add order message to chat - custom offers: prompt client to inform freelancer
            const convId = offer.conversationId?._id || offer.conversationId;
            if (convId) {
                const buyerId = String(pendingCharge.userId);
                const sellerId = String(offer.senderId._id || offer.senderId);
                const orderContent = `[Engezhaly Order] Order #${order._id}\n\nCustom offer accepted (${offer.price} EGP).\n\nPlease as a client inform the freelancer what you need in chat.`;
                const orderChat = new Chat({
                    conversationId: convId,
                    senderId: buyerId,
                    receiverId: sellerId,
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
            const sellerId = offer.senderId?._id || offer.senderId;
            await Transaction.create({
                userId: pendingCharge.userId,
                type: 'payment',
                amount: -totalClientPaid,
                description: `Custom Offer (incl. ${clientFee} EGP fee) - held in escrow`,
                orderId: order._id,
                relatedUserId: sellerId
            });
            break;
        }
        case 'consultation': {
            const userId = pendingCharge.userId;
            const conversationId = meta.conversationId;
            const amount = pendingCharge.amountCents / 100;

            const payment = new ConsultationPayment({
                userId,
                conversationId,
                amount,
                used: false,
                durationMinutes: meta.durationMinutes || 30
            });
            await payment.save();

            // If meeting date/time were pre-selected, create the meeting now
            if (meta.meetingDate && meta.meetingTime) {
                try {
                    const [year, month, day] = String(meta.meetingDate).split('-').map(Number);
                    const [hour, min] = String(meta.meetingTime).split(':').map(Number);
                    const scheduledAt = new Date(year, month - 1, day, hour, min, 0);
                    if (!isNaN(scheduledAt.getTime()) && scheduledAt >= new Date()) {
                        const { link } = createMeetingLink(conversationId, scheduledAt);
                        if (link) {
                            payment.used = true;
                            payment.meetingLink = link;
                            payment.meetingDate = scheduledAt;
                            payment.meetingScheduledAt = new Date();
                            await payment.save();
                            const conversation = await Conversation.findById(conversationId);
                            if (conversation) {
                                const receiverId = conversation.participants.find(p => String(p) !== String(userId));
                                if (receiverId) {
                                    const dateStr = scheduledAt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
                                    const timeStr = scheduledAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                                    const meetingContent = `[Engezhaly Meeting] Video call scheduled for ${dateStr} at ${timeStr}. Join here: ${link}`;
                                    const meetingMsg = new Chat({
                                        conversationId: conversation._id,
                                        senderId: userId,
                                        receiverId,
                                        content: meetingContent,
                                        messageType: 'meeting',
                                        isAdmin: false
                                    });
                                    await meetingMsg.save();
                                    conversation.lastMessage = meetingContent;
                                    conversation.lastMessageId = meetingMsg._id;
                                    await conversation.save();
                                    const io = app?.get?.('io');
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
                    console.error('[Paymob] Consultation meeting creation error:', err.message);
                }
            }

            // Credit freelancer's wallet (money goes to freelancer balance)
            const Conversation = require('../models/Conversation');
            const conversation = await Conversation.findById(conversationId).select('participants');
            if (conversation?.participants?.length >= 2) {
                const freelancerId = conversation.participants.find(p => String(p) !== String(userId));
                if (freelancerId) {
                    const freelancer = await User.findById(freelancerId);
                    if (freelancer) {
                        freelancer.walletBalance = (freelancer.walletBalance || 0) + amount;
                        await freelancer.save();
                        await Transaction.create({
                            userId: freelancerId,
                            type: 'consultation',
                            amount,
                            description: 'Video consultation payment',
                            status: 'completed',
                            metadata: { conversationId, fromUserId: userId }
                        });
                    }
                }
            }

            await Transaction.create({
                userId,
                type: 'consultation',
                amount: -amount,
                description: 'Video consultation payment',
                status: 'completed',
                metadata: { conversationId }
            });
            break;
        }
        case 'add_card':
            // PaymentMethod created below from callback obj
            break;
        default:
            break;
    }
};

/**
 * Paymob transaction callback (webhook)
 * Paymob sends POST with: obj (transaction), hmac
 */
const handleWebhook = async (req, res) => {
    try {
        const { obj, hmac } = req.body;
        if (!obj) {
            return res.status(400).send('Missing obj');
        }

        if (PAYMOB_HMAC_SECRET && !verifyWebhookHmac(obj)) {
            return res.status(400).send('Invalid HMAC');
        }

        if (obj.success !== true) {
            return res.status(200).send('OK');
        }

        const orderId = obj.order?.id?.toString();
        const transactionId = obj.id?.toString();
        const amountCents = obj.amount_cents;
        const metadata = obj.metadata || {};

        const pendingCharge = await PendingCharge.findOne({
            paymobOrderId: orderId,
            status: 'pending'
        });

        if (pendingCharge) {
            pendingCharge.status = 'completed';
            pendingCharge.paymobTransactionId = transactionId;
            pendingCharge.completedAt = new Date();
            await pendingCharge.save();

            if (pendingCharge.meta?.type === 'add_card') {
                const last4 = obj.source_data?.pan?.slice(-4) || obj.mask?.slice(-4) || '****';
                const brand = obj.source_data?.sub_type || obj.source_data?.type || 'card';
                const token = obj.token || obj.payment_key;
                const existing = await PaymentMethod.countDocuments({ userId: pendingCharge.userId });
                const pm = new PaymentMethod({
                    userId: pendingCharge.userId,
                    type: 'card',
                    paymobToken: token,
                    last4,
                    brand,
                    isDefault: existing === 0
                });
                await pm.save();
            } else {
                await fulfillCharge(pendingCharge, req.app);
            }
        }

        res.status(200).send('OK');
    } catch (err) {
        console.error('[Paymob Webhook]', err);
        res.status(500).send('Error');
    }
};

const PAYMOB_HMAC_SECRET = process.env.PAYMOB_HMAC_SECRET;

module.exports = { handleWebhook };
