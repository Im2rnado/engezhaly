const Chat = require('../models/Chat');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const ConsultationPayment = require('../models/ConsultationPayment');
const Offer = require('../models/Offer');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const { createMeetingLink } = require('../services/meetingService');
const { sendAndLog } = require('../services/mailgunService');
const { offerPurchased: offerPurchasedTemplate, offlineChat: offlineChatTemplate, paymentReceiptFreelancer, paymentReceiptClient } = require('../templates/emailTemplates');
const { isUserInConversation } = require('../services/presence');
const { emitToUser, isUserOnline } = require('../services/notificationService');

// Helper for curse words (extended list for demo)
const BAD_WORDS = ['badword1', 'badword2', 'idiot', 'stupid', 'scam', 'hate'];

const filterCurseWords = (text) => {
    let filteredText = text;
    let isBlurred = false;
    BAD_WORDS.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        if (regex.test(filteredText)) {
            filteredText = filteredText.replace(regex, '#######');
            isBlurred = true;
        }
    });
    return { filteredText, isBlurred };
};

const getConversations = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const userIdStr = String(userId);

        // Find conversations where user is a participant
        const conversations = await Conversation.find({
            participants: userId
        })
            .populate('participants', 'firstName lastName freelancerProfile.isBusy freelancerProfile.profilePicture')
            .sort({ updatedAt: -1 })
            .lean();

        const formatted = await Promise.all(conversations.map(async (conv) => {
            let partner = null;
            if (Array.isArray(conv.participants)) {
                partner = conv.participants.find(p => {
                    if (!p) return false;
                    const pid = p._id ? String(p._id) : (typeof p === 'string' ? p : null);
                    return pid && pid !== userIdStr;
                });
            }
            const partnerId = partner?._id ? String(partner._id) : (partner?.toString?.() || null);
            const name = partner && (partner.firstName || partner.lastName)
                ? `${partner.firstName || ''} ${partner.lastName || ''}`.trim() || 'Unknown User'
                : 'Unknown User';
            const unreadCount = await Chat.countDocuments({
                conversationId: conv._id,
                receiverId: userId,
                isRead: { $ne: true }
            });

            return {
                id: conv._id,
                partnerId: partnerId || undefined,
                name,
                profilePicture: partner?.freelancerProfile?.profilePicture || null,
                lastMessage: conv.lastMessage,
                isFrozen: conv.isFrozen,
                unreadCount,
                hasUnread: unreadCount > 0,
                online: false
            };
        }));

        res.json(formatted);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: err.message || 'Server Error' });
    }
};

const getMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params; // This is now Conversation ID or User ID? 
        // To support existing frontend which sends User ID often, we need to handle both or standardize.
        // Let's assume frontend might send Partner ID initially to start chat, or Conversation ID if established.

        let conversationId = id;
        let conversation;

        // Check if ID is a valid ObjectId
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            // Try to find by _id first
            conversation = await Conversation.findById(id);
            // If not found, maybe it was a User ID passed to find conversation between two people
            if (!conversation) {
                conversation = await Conversation.findOne({
                    participants: { $all: [userId, id] }
                });
                if (conversation) conversationId = conversation._id;
            }
        }

        if (!conversation) {
            // No conversation yet, return empty
            return res.json([]);
        }

        await Chat.updateMany(
            {
                conversationId: conversation._id,
                receiverId: userId,
                isRead: { $ne: true }
            },
            {
                $set: {
                    isRead: true,
                    readAt: new Date()
                }
            }
        );

        const messages = await Chat.find({ conversationId: conversation._id })
            .sort({ createdAt: 1 })
            .populate('senderId', 'firstName lastName');

        res.json(messages);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: err.message || 'Server Error' });
    }
}

const sendMessage = async (req, res) => {
    try {
        const { content, messageType } = req.body;
        let receiverId = req.body.receiverId;
        if (receiverId && typeof receiverId === 'object' && receiverId._id) receiverId = receiverId._id;
        receiverId = (receiverId && String(receiverId).trim()) || null;
        const senderId = req.user.id;

        if (!receiverId || !/^[0-9a-fA-F]{24}$/.test(receiverId)) {
            return res.status(400).json({ msg: 'receiverId is required and must be a valid user ID' });
        }

        // 1. Check Global Account Freeze
        const sender = await User.findById(senderId);
        if (sender.isFrozen) {
            return res.status(403).json({ msg: 'Account is frozen. Cannot send messages.' });
        }

        // 2. Find or Create Conversation
        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] }
        });

        if (!conversation) {
            conversation = new Conversation({
                participants: [senderId, receiverId],
                lastMessage: content
            });
            await conversation.save();
        }

        // Derive receiverId from conversation (use actual participant for reliability)
        const senderIdStr = String(senderId);
        const otherParticipant = conversation.participants.find(p => String(p) !== senderIdStr);
        if (otherParticipant) {
            receiverId = String(otherParticipant);
        }
        if (!receiverId) {
            return res.status(400).json({ msg: 'Could not determine message recipient' });
        }

        // 3. Check Chat Specific Freeze
        if (conversation.isFrozen) {
            return res.status(403).json({ msg: 'This chat is frozen due to policy violations.' });
        }

        // 4. Phone Number Detection (Freeze Logic)
        const phoneRegex = /(\d{11})|(\d{3}\s\d{4}\s\d{4})/;
        const hasPhone = phoneRegex.test(content);

        let finalContent = content;
        let isChatFrozen = false;

        if (hasPhone) {
            finalContent = '********* [Phone Number Removed]';
            isChatFrozen = true;
            conversation.isFrozen = true; // FREEZE THE CONVERSATION
            // TODO: Notify Admin (Socket event or DB flag monitoring)
        }

        // 5. Curse Word Filtering
        const { filteredText, isBlurred } = filterCurseWords(finalContent);
        finalContent = filteredText;

        // 6. Create Message
        const newMsg = new Chat({
            conversationId: conversation._id,
            senderId,
            receiverId,
            content: finalContent,
            messageType,
            isFrozen: isChatFrozen,
            isBlurred
        });

        await newMsg.save();

        // 7. Update Conversation Metadata
        conversation.lastMessage = finalContent;
        conversation.lastMessageId = newMsg._id;
        await conversation.save();

        // 8. Emit via socket for real-time delivery
        const io = req.app.get('io');
        if (io) {
            const roomId = `conversation:${conversation._id}`;
            const payload = {
                _id: newMsg._id,
                conversationId: conversation._id,
                senderId: newMsg.senderId,
                content: finalContent,
                messageType: newMsg.messageType || 'text',
                createdAt: newMsg.createdAt,
                isAdmin: newMsg.isAdmin || false,
                isRead: newMsg.isRead || false
            };
            io.to(roomId).emit('message', payload);
        }

        // 9. Notify recipient: if online -> push notification; if offline -> email
        const recipientOnline = isUserOnline(req.app, receiverId);
        const senderName = sender ? `${sender.firstName} ${sender.lastName}` : 'Someone';
        const preview = messageType === 'voice' ? 'Voice message' : (finalContent || '').substring(0, 100);
        const chatLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/chat?conversation=${conversation._id}`;

        if (recipientOnline) {
            emitToUser(req.app, receiverId, {
                title: `New message from ${senderName}`,
                message: preview,
                link: chatLink,
                type: 'chat'
            });
        } else {
            const receiver = await User.findById(receiverId).select('email');
            if (receiver?.email) {
                const { subject, html } = offlineChatTemplate(senderName, preview, conversation._id);
                sendAndLog(receiver.email, subject, html, 'offline_chat', { conversationId: conversation._id, senderId, receiverId }).catch(err => console.error('[Chat] Offline email failed:', err.message));
            }
        }

        res.json(newMsg);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: err.message || 'Server Error' });
    }
}

const createOffer = async (req, res) => {
    try {
        const { conversationId, receiverId, price, deliveryDays, whatsIncluded, milestones } = req.body;
        const senderId = req.user.id;

        // Validate conversation exists and user is participant
        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.participants.includes(senderId) || !conversation.participants.includes(receiverId)) {
            return res.status(403).json({ msg: 'Invalid conversation or unauthorized' });
        }

        // Create offer
        const offer = new Offer({
            conversationId,
            senderId,
            receiverId,
            price,
            deliveryDays,
            whatsIncluded,
            milestones: milestones || []
        });

        await offer.save();

        // Send a message in chat about the offer
        const offerMessage = new Chat({
            conversationId,
            senderId,
            receiverId,
            content: `[OFFER] Custom offer created: ${price} EGP, ${deliveryDays} days delivery`,
            messageType: 'text'
        });
        await offerMessage.save();

        conversation.lastMessage = `[OFFER] Custom offer: ${price} EGP`;
        await conversation.save();

        res.json(offer);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: err.message || 'Server Error' });
    }
};

const acceptOffer = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const offer = await Offer.findById(id).populate('conversationId');
        if (!offer) {
            return res.status(404).json({ msg: 'Offer not found' });
        }

        // Check if user is the receiver
        if (offer.receiverId.toString() !== userId) {
            return res.status(403).json({ msg: 'Not authorized to accept this offer' });
        }

        if (offer.status !== 'pending') {
            return res.status(400).json({ msg: 'Offer is no longer pending' });
        }

        // Check wallet balance
        const buyer = await User.findById(userId);
        if (buyer.walletBalance < offer.price) {
            return res.status(400).json({ msg: 'Insufficient wallet balance' });
        }

        // Create order from offer
        const order = new Order({
            projectId: null, // Custom offers don't have a projectId
            buyerId: userId,
            sellerId: offer.senderId,
            packageType: 'Custom',
            offerId: offer._id, // Link to the offer
            amount: offer.price,
            platformFee: offer.price * 0.2, // 20% platform fee
            status: 'active',
            deliveryDate: new Date(Date.now() + offer.deliveryDays * 24 * 60 * 60 * 1000)
        });
        await order.save();

        // Deduct from buyer wallet
        buyer.walletBalance -= offer.price;
        await buyer.save();

        // Create Transaction records
        const platformFee = offer.price * 0.2;
        const netAmount = offer.price - platformFee;
        await Transaction.create([
            { userId: userId, type: 'payment', amount: -offer.price, description: 'Custom Offer', orderId: order._id, relatedUserId: offer.senderId },
            { userId: offer.senderId, type: 'payment', amount: netAmount, description: 'Custom Offer', orderId: order._id, relatedUserId: userId }
        ]);

        // Update offer status
        offer.status = 'accepted';
        offer.acceptedAt = new Date();
        await offer.save();

        // Notify freelancer (seller): if online -> push; if offline -> email
        const seller = await User.findById(offer.senderId).select('email firstName lastName');
        const sellerId = offer.senderId;
        const clientName = buyer ? `${buyer.firstName} ${buyer.lastName}` : 'A client';
        const orderLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/freelancer?tab=orders`;

        if (sellerId && req.app) {
            if (isUserOnline(req.app, sellerId)) {
                emitToUser(req.app, sellerId, {
                    title: 'Your offer has been purchased!',
                    message: `${clientName} accepted your custom offer (${offer.price} EGP)`,
                    link: orderLink,
                    type: 'order'
                });
            } else if (seller?.email) {
                const { subject, html } = offerPurchasedTemplate(clientName, 'Custom Offer', offer.price, order._id);
                sendAndLog(seller.email, subject, html, 'offer_purchased', { orderId: order._id, offerId: offer._id }).catch(err => console.error('[Chat] Offer email failed:', err.message));
            }
        }

        // Send payment receipt emails to both
        if (buyer?.email) {
            const { subject, html } = paymentReceiptClient(offer.price, 'Custom Offer', order._id.toString(), new Date().toLocaleDateString());
            sendAndLog(buyer.email, subject, html, 'payment_receipt_client', { orderId: order._id }).catch(err => console.error('[Chat] Receipt email failed:', err.message));
        }
        if (seller?.email) {
            const { subject, html } = paymentReceiptFreelancer(offer.price, netAmount, platformFee, 'Custom Offer', order._id.toString(), new Date().toLocaleDateString());
            sendAndLog(seller.email, subject, html, 'payment_receipt_freelancer', { orderId: order._id }).catch(err => console.error('[Chat] Receipt email failed:', err.message));
        }

        // Send acceptance message
        const acceptanceMessage = new Chat({
            conversationId: offer.conversationId._id,
            senderId: userId,
            receiverId: offer.senderId,
            content: `[OFFER ACCEPTED] Order #${order._id} created. Payment of ${offer.price} EGP processed.`,
            messageType: 'text'
        });
        await acceptanceMessage.save();

        res.json({ order, offer });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: err.message || 'Server Error' });
    }
};

const getOffers = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.id;

        // Verify user is part of conversation
        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.participants.includes(userId)) {
            return res.status(403).json({ msg: 'Unauthorized' });
        }

        const offers = await Offer.find({ conversationId })
            .populate('senderId', 'firstName lastName')
            .populate('receiverId', 'firstName lastName')
            .sort({ createdAt: -1 });

        res.json(offers);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: err.message || 'Server Error' });
    }
};

const getConsultationStatus = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.id;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.participants.some(p => String(p) === String(userId))) {
            return res.status(403).json({ msg: 'Unauthorized' });
        }

        const unusedPayment = await ConsultationPayment.findOne({
            conversationId,
            used: false
        });
        const lastUsedPayment = await ConsultationPayment.findOne({
            conversationId,
            used: true
        }).sort({ meetingScheduledAt: -1 });

        res.json({
            hasUnusedPayment: !!unusedPayment,
            lastMeetingLink: lastUsedPayment?.meetingLink || null,
            lastMeetingDate: lastUsedPayment?.meetingDate || null
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: err.message || 'Server Error' });
    }
};

const createConsultationMeeting = async (req, res) => {
    try {
        const { conversationId, meetingDate, meetingTime } = req.body;
        const userId = req.user.id;

        if (!conversationId || !meetingDate || !meetingTime) {
            return res.status(400).json({ msg: 'conversationId, meetingDate, and meetingTime are required' });
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.participants.some(p => String(p) === String(userId))) {
            return res.status(403).json({ msg: 'Unauthorized' });
        }

        const payment = await ConsultationPayment.findOne({
            conversationId,
            used: false
        });
        if (!payment) {
            return res.status(400).json({ msg: 'No unused consultation payment. Please pay 100 EGP first.' });
        }

        const [year, month, day] = meetingDate.split('-').map(Number);
        const [hour, min] = meetingTime.split(':').map(Number);
        const scheduledAt = new Date(year, month - 1, day, hour, min, 0);
        if (isNaN(scheduledAt.getTime()) || scheduledAt < new Date()) {
            return res.status(400).json({ msg: 'Please select a valid future date and time.' });
        }

        const { link, error } = createMeetingLink(conversationId, scheduledAt);
        if (error || !link) {
            return res.status(500).json({ msg: error || 'Failed to create meeting link' });
        }

        payment.used = true;
        payment.meetingLink = link;
        payment.meetingDate = scheduledAt;
        payment.meetingScheduledAt = new Date();
        await payment.save();

        const otherParticipant = conversation.participants.find(p => String(p) !== String(userId));
        const receiverId = otherParticipant ? String(otherParticipant) : null;
        if (!receiverId) return res.status(400).json({ msg: 'Could not determine recipient' });

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

        const io = req.app.get('io');
        if (io) {
            const roomId = `conversation:${conversation._id}`;
            io.to(roomId).emit('message', {
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

        res.json({ meetingLink: link, message: meetingMsg });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: err.message || 'Server Error' });
    }
};

module.exports = {
    getConversations,
    getMessages,
    sendMessage,
    createOffer,
    acceptOffer,
    getOffers,
    getConsultationStatus,
    createConsultationMeeting
};
