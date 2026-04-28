const PaymentMethod = require('../models/PaymentMethod');
const PendingCharge = require('../models/PendingCharge');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Order = require('../models/Order');
const Job = require('../models/Job');
const Chat = require('../models/Chat');
const Conversation = require('../models/Conversation');
const ConsultationPayment = require('../models/ConsultationPayment');
const { isCallbackSuccess } = require('../services/geideaService');
const { createMeetingLink } = require('../services/meetingService');
const { sendAndLog } = require('../services/mailgunService');
const emailTemplates = require('../templates/emailTemplates');
const { ORDER_PLATFORM_FEE_EGP } = require('../config/fees');
const { emitChatContextRefresh } = require('../services/chatContextRefresh');
const { sendJobProposalAcceptedChatMessage } = require('../services/jobProposalChatNotifications');
const { notifyAdmins } = require('../utils/getAdminEmails');

/**
 * Fulfill a completed payment - credit freelancer, create records, etc.
 * Order.platformFee comes from ORDER_PLATFORM_FEE_EGP (see server/config/fees.js).
 */
const fulfillCharge = async (pendingCharge, app) => {
    const { meta } = pendingCharge;
    if (!meta || !meta.type) return;

    switch (meta.type) {
        case 'job_proposal': {
            const job = await Job.findById(meta.jobId)
                .populate('clientId', 'firstName lastName email')
                .populate('proposals.freelancerId', 'firstName lastName email');
            if (!job || job.status !== 'open') return;
            const proposal = job.proposals.id(meta.proposalId);
            if (!proposal) return;
            const freelancerId = proposal.freelancerId?._id || proposal.freelancerId;
            const freelancerUser = proposal.freelancerId;
            const totalClientPaid = pendingCharge.amountCents / 100;

            // ESCROW: Do NOT credit freelancer - money stays in escrow until client approves work
            job.proposals.forEach((p) => {
                p.status = p._id.toString() === meta.proposalId ? 'accepted' : 'rejected';
            });
            job.status = 'in_progress';
            await job.save();

            const clientIdStr = String(job.clientId?._id || job.clientId);
            await sendJobProposalAcceptedChatMessage(
                app?.get?.('io'),
                clientIdStr,
                String(freelancerId),
                job.title
            );

            await Transaction.create({
                userId: pendingCharge.userId,
                type: 'payment',
                amount: -totalClientPaid,
                description: `Job: ${job.title} - held by Engezhaly team`,
                orderId: null,
                relatedUserId: freelancerId,
                metadata: { jobId: meta.jobId, proposalId: meta.proposalId }
            });

            // Email notifications
            const client = job.clientId;
            if (client?.email) {
                const { subject, html } = emailTemplates.paymentConfirmed(client.firstName, totalClientPaid, 'Job Payment', job.title);
                sendAndLog(client.email, subject, html, 'payment_confirmed');
            }
            if (freelancerUser?.email) {
                const { subject, html } = emailTemplates.offerPurchased(client?.firstName || 'A client', job.title, proposal.price, null);
                sendAndLog(freelancerUser.email, subject, html, 'offer_purchased');
            }

            const adminDashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin`;
            notifyAdmins(
                `Payment Made: Job Accepted`,
                'A Client Accepted a Job Proposal',
                `<strong>Job:</strong> ${job.title}<br/><strong>Amount Paid:</strong> ${totalClientPaid} EGP<br/><strong>Client:</strong> ${client?.firstName} ${client?.lastName}`,
                'View in Admin Dashboard',
                adminDashboardUrl
            );

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
                description: `Order: ${order.projectId?.title || 'Project'} - held by Engezhaly team`,
                orderId: order._id,
                relatedUserId: freelancerId
            });

            // Email notifications
            const client = order.buyerId;
            const freelancer = order.sellerId;
            const title = order.projectId?.title || 'Project Order';
            if (client?.email) {
                const { subject, html } = emailTemplates.paymentConfirmed(client.firstName, totalClientPaid, 'Order Payment', title);
                sendAndLog(client.email, subject, html, 'payment_confirmed');
            }
            if (freelancer?.email) {
                const { subject, html } = emailTemplates.offerPurchased(client?.firstName || 'A client', title, order.amount, order._id);
                sendAndLog(freelancer.email, subject, html, 'offer_purchased');
            }
            {
                const buyerId = String(order.buyerId?._id || order.buyerId);
                const conv = await Conversation.findOne({ participants: { $all: [buyerId, String(freelancerId)] } });
                if (conv) emitChatContextRefresh(app?.get?.('io'), conv._id);
            }

            const adminDashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin`;
            notifyAdmins(
                `Payment Made: Project Order`,
                'A Client Paid for a Project Order',
                `<strong>Project:</strong> ${title}<br/><strong>Amount Paid:</strong> ${totalClientPaid} EGP<br/><strong>Client:</strong> ${client?.firstName} ${client?.lastName}`,
                'View in Admin Dashboard',
                adminDashboardUrl
            );

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
            const orderPlatformFee = ORDER_PLATFORM_FEE_EGP;

            const orderDeliveryDate = offer.deliveryDate
                ? new Date(offer.deliveryDate)
                : new Date(Date.now() + (offer.deliveryDays || 7) * 24 * 60 * 60 * 1000);

            const revUnlimited = !!offer.revisionsUnlimited;
            let revNum = 0;
            if (!revUnlimited) {
                const n = Number(offer.revisions);
                revNum = Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
            }
            const revisionsLine = revUnlimited ? 'Revisions: Unlimited' : `Revisions: ${revNum}`;

            const order = new OrderModel({
                projectId: null,
                buyerId: pendingCharge.userId,
                sellerId: offer.senderId,
                packageType: 'Custom',
                offerId: offer._id,
                amount: offer.price,
                platformFee: orderPlatformFee,
                status: 'active',
                deliveryDate: orderDeliveryDate,
                description: (offer.whatsIncluded && String(offer.whatsIncluded).trim()) || 'Custom offer',
                revisions: revNum,
                revisionsUnlimited: revUnlimited
            });
            await order.save();

            // Add order message to chat
            const convId = offer.conversationId?._id || offer.conversationId;
            if (convId) {
                const buyerId = String(pendingCharge.userId);
                const sellerId = String(offer.senderId._id || offer.senderId);
                const orderNo = order.orderNumber != null ? String(order.orderNumber) : String(order._id);
                const orderContent = `[Engezhaly Order] Order #${orderNo}\n\nCustom offer successfully accepted (Paid ${offer.price} EGP).\n${revisionsLine}\n\nTo track your order, please visit My Orders in the dashboard.`;
                const orderChat = new Chat({
                    conversationId: convId,
                    senderId: buyerId,
                    receiverId: sellerId,
                    content: orderContent,
                    messageType: 'order'
                });
                await orderChat.save();
                await Conversation.findByIdAndUpdate(convId, { lastMessage: orderContent, lastMessageId: orderChat._id });
                const io = app && app.get ? app.get('io') : null;
                emitChatContextRefresh(io, convId);
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
                description: orderPlatformFee > 0
                    ? `Custom Offer (incl. ${orderPlatformFee} EGP fee) - held by Engezhaly team`
                    : 'Custom Offer - held by Engezhaly team',
                orderId: order._id,
                relatedUserId: sellerId
            });

            // Email notifications
            const client = await User.findById(pendingCharge.userId);
            const freelancer = offer.senderId;
            if (client?.email) {
                const { subject, html } = emailTemplates.paymentConfirmed(client.firstName, totalClientPaid, 'Custom Offer', offer.title);
                sendAndLog(client.email, subject, html, 'payment_confirmed');
            }
            if (freelancer?.email) {
                const { subject, html } = emailTemplates.offerPurchased(client?.firstName || 'A client', offer.title || 'Custom Offer', offer.price, order._id);
                sendAndLog(freelancer.email, subject, html, 'offer_purchased');
            }

            const adminDashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin`;
            notifyAdmins(
                `Payment Made: Custom Offer Accepted`,
                'A Client Accepted a Custom Offer',
                `<strong>Amount Paid:</strong> ${totalClientPaid} EGP<br/><strong>Client:</strong> ${client?.firstName} ${client?.lastName}`,
                'View in Admin Dashboard',
                adminDashboardUrl
            );

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
                    console.error('[Geidea] Consultation meeting creation error:', err.message);
                }
            }

            // Credit freelancer's wallet (money goes to freelancer balance)
            const conversationDoc = await Conversation.findById(conversationId).select('participants');
            if (conversationDoc?.participants?.length >= 2) {
                const freelancerId = conversationDoc.participants.find(p => String(p) !== String(userId));
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

            // Email notifications
            const client = await User.findById(userId);
            if (client?.email) {
                const { subject, html } = emailTemplates.paymentConfirmed(client.firstName, amount, 'Consultation', 'Video Call');
                sendAndLog(client.email, subject, html, 'payment_confirmed');
            }
            const conversationEmails = await Conversation.findById(conversationId).populate('participants');
            const freelancer = conversationEmails?.participants?.find(p => String(p._id) !== String(userId));
            if (freelancer?.email) {
                const { subject, html } = emailTemplates.offerPurchased(client?.firstName || 'A client', 'Video Consultation', amount, null);
                sendAndLog(freelancer.email, subject, html, 'offer_purchased');
            }
            emitChatContextRefresh(app?.get?.('io'), conversationId);
            break;
        }
        case 'add_card':
            // PaymentMethod is created below from callback body
            break;
        default:
            break;
    }
};

/**
 * Geidea transaction callback (webhook)
 * Geidea sends POST with JSON body containing order details and responseCode.
 * The merchantReferenceId in the Geidea response maps to our geideaSessionId stored on PendingCharge.
 */
const handleWebhook = async (req, res) => {
    try {
        const body = req.body;

        if (!body) {
            return res.status(400).send('Missing body');
        }

        // Always acknowledge immediately
        res.status(200).send('OK');

        if (!isCallbackSuccess(body)) {
            console.log('[Geidea Webhook] Payment not successful. responseCode:', body?.responseCode);
            return;
        }

        // Geidea returns merchantReferenceId which we set to our pendingCharge ID or a unique ref
        // The order.merchantReferenceId maps to the merchantReferenceId we sent in createSession
        const merchantReferenceId = body?.order?.merchantReferenceId || body?.merchantReferenceId;
        const geideaOrderId = body?.order?.orderId || body?.orderId;
        const tokenId = body?.order?.tokenId || body?.tokenId;

        const pendingCharge = await PendingCharge.findOne({
            geideaSessionId: merchantReferenceId,
            status: 'pending'
        });

        if (pendingCharge) {
            pendingCharge.status = 'completed';
            pendingCharge.geideaOrderId = geideaOrderId || null;
            pendingCharge.completedAt = new Date();
            await pendingCharge.save();

            if (pendingCharge.meta?.type === 'add_card') {
                // Extract card details from Geidea callback
                const cardNumber = body?.order?.paymentMethod?.cardNumber || '';
                const last4 = cardNumber.slice(-4) || body?.order?.paymentMethod?.maskedCardNumber?.slice(-4) || '****';
                const brand = body?.order?.paymentMethod?.cardholderName
                    ? (body?.order?.brand || body?.order?.paymentMethod?.type || 'card')
                    : (body?.order?.brand || 'card');

                const existing = await PaymentMethod.countDocuments({ userId: pendingCharge.userId });
                const pm = new PaymentMethod({
                    userId: pendingCharge.userId,
                    type: 'card',
                    geideaTokenId: tokenId || null,
                    last4,
                    brand,
                    isDefault: existing === 0
                });
                await pm.save();
            } else {
                await fulfillCharge(pendingCharge, req.app);
            }
        } else {
            console.log('[Geidea Webhook] No pending charge found for merchantReferenceId:', merchantReferenceId);
        }
    } catch (err) {
        console.error('[Geidea Webhook]', err);
    }
};

module.exports = { handleWebhook, fulfillCharge };
