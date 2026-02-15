const Chat = require('../models/Chat');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Offer = require('../models/Offer');
const Order = require('../models/Order');

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

        // Update offer status
        offer.status = 'accepted';
        offer.acceptedAt = new Date();
        await offer.save();

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

module.exports = {
    getConversations,
    getMessages,
    sendMessage,
    createOffer,
    acceptOffer,
    getOffers
};
