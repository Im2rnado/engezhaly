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

// Helper for curse words - common abusive/profane terms
const BAD_WORDS = [
    // English bad words
    'idiot', 'stupid', 'hate', 'dumb', 'moron', 'loser', 'scammer',
    'dumbass', 'asshole', 'bastard', 'bitch', 'damn', 'hell', 'crap',
    'shit', 'fuck', 'fucking', 'fck', 'fcking', 'wtf', 'stfu', 'kys', 'kill yourself',
    'die', 'go die', 'sucker', 'suck', 'screw you', 'screw off', 'get lost',
    'shut up', 'shut the fuck up', 'piece of shit', 'piece of crap', 'dumb fuck',
    // Arabic/Egyptian bad words
    'a7a', 'yabn el kalb', 'khawal', 'homar', 'sharmoot', '3ars',
    'zbala', 'metnak', 'gazma', 'a7eh', 'zeb', 'zeby', 'zobry',
    'kos omak', 'kos om', 'kos okhtak', 'kosomak', 'kosak', 'kosek', 'kos okht',
    'yabn el metnaka', 'metnaka', 'sharmoota', 'sharameet', 'manyak',
    'كسمك', 'كسمك', 'كس امك', 'امك فين', 'زفت', 'شرموط', 'خول'
];

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

        // 4. Phone Number Detection (Freeze Logic) - skip for voice messages (content is a URL)
        const phoneRegex = /(\d{11})|(\d{3}\s\d{4}\s\d{4})/;
        const hasPhone = messageType !== 'voice' && phoneRegex.test(content);

        let finalContent = content;
        let isChatFrozen = false;

        if (hasPhone) {
            finalContent = '********* [Phone Number Removed]';
            isChatFrozen = true;
            conversation.isFrozen = true; // FREEZE THE CONVERSATION
            // TODO: Notify Admin (Socket event or DB flag monitoring)
        }

        // 5. Curse Word Filtering - skip for voice messages (content is audio URL)
        let isBlurred = false;
        if (messageType !== 'voice') {
            const { filteredText, isBlurred: blurred } = filterCurseWords(finalContent);
            finalContent = filteredText;
            isBlurred = blurred;
        }

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
        conversation.lastMessage = messageType === 'voice' ? 'Voice message' : finalContent;
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
                isRead: newMsg.isRead || false,
                isBlurred: isBlurred || false
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
        const { conversationId, receiverId, price, deliveryDays, deliveryDate, whatsIncluded, milestones } = req.body;
        const senderId = req.user.id;

        const sender = await User.findById(senderId).select('role');
        if (!sender || sender.role !== 'freelancer') {
            return res.status(403).json({ msg: 'Only freelancers can create custom offers' });
        }

        if (!deliveryDate && (!deliveryDays || deliveryDays < 1)) {
            return res.status(400).json({ msg: 'Provide deliveryDate or deliveryDays (min 1)' });
        }

        // Validate conversation exists and user is participant
        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.participants.includes(senderId) || !conversation.participants.includes(receiverId)) {
            return res.status(403).json({ msg: 'Invalid conversation or unauthorized' });
        }

        const offerData = { conversationId, senderId, receiverId, price, whatsIncluded, milestones: milestones || [] };
        if (deliveryDate) {
            offerData.deliveryDate = new Date(deliveryDate);
        } else {
            offerData.deliveryDays = Number(deliveryDays);
        }

        // Create offer
        const offer = new Offer(offerData);

        await offer.save();

        const deliveryDesc = deliveryDate ? new Date(deliveryDate).toLocaleDateString() : `${deliveryDays} days`;
        // Send a message in chat about the offer
        const offerMessage = new Chat({
            conversationId,
            senderId,
            receiverId,
            content: `[OFFER] Custom offer created: ${price} EGP, delivery ${deliveryDesc}`,
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

        const offer = await Offer.findById(id).populate('conversationId').populate('senderId', 'freelancerProfile.isBusy');
        if (!offer) {
            return res.status(404).json({ msg: 'Offer not found' });
        }

        if (offer.senderId?.freelancerProfile?.isBusy) {
            return res.status(400).json({ msg: 'Freelancer is busy and not accepting orders.' });
        }

        if (offer.receiverId.toString() !== userId) {
            return res.status(403).json({ msg: 'Not authorized to accept this offer' });
        }

        if (offer.status !== 'pending') {
            return res.status(400).json({ msg: 'Offer is no longer pending' });
        }

        const clientFee = 20;
        const totalClientPays = offer.price + clientFee;
        const amountCents = Math.round(totalClientPays * 100);

        if (amountCents < 100) {
            return res.status(400).json({ msg: 'Invalid offer amount' });
        }

        // Do NOT deduct from wallet - return payment params for frontend to call initCharge
        res.json({
            requiresPayment: true,
            type: 'custom_offer',
            amountCents,
            meta: { offerId: offer._id.toString() }
        });
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
