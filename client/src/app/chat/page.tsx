"use client";

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { io } from 'socket.io-client';
import { Send, Phone, Video, Paperclip, MoreVertical, FileText, CheckCircle, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useModal } from '@/context/ModalContext';
import CreateOfferModal from '@/components/CreateOfferModal';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function ChatPage() {
    const searchParams = useSearchParams();
    const { showModal } = useModal();
    const [socket, setSocket] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [offers, setOffers] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [chats, setChats] = useState<any[]>([]);
    const [activeChat, setActiveChat] = useState<any>(null);
    const [showOfferModal, setShowOfferModal] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Get current user
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        setTimeout(() => {
            setCurrentUser(storedUser);
        }, 0);

        // Check for conversation ID in URL
        const urlConversationId = searchParams.get('conversation');
        if (urlConversationId) {
            // Find chat by conversation ID or partner ID
            api.chat.getConversations().then((data: any) => {
                if (Array.isArray(data)) {
                    setChats(data);
                    const foundChat = data.find((c: any) => c.id === urlConversationId || c.partnerId === urlConversationId);
                    if (foundChat) {
                        setActiveChat(foundChat);
                        setConversationId(foundChat.id);
                    }
                }
            });
        } else {
            // Fetch conversations
            api.chat.getConversations().then((data: any) => {
                if (Array.isArray(data)) {
                    setChats(data);
                }
            });
        }

        // Initialize Socket
        const newSocket = io(SOCKET_URL, {
            extraHeaders: {
                'x-auth-token': localStorage.getItem('token') || ''
            }
        });
        setTimeout(() => {
            setSocket(newSocket);
        }, 10);

        newSocket.on('connect', () => {
            console.log('Connected to socket server');
        });

        return () => {
            newSocket.disconnect();
        };
    }, [searchParams]);

    useEffect(() => {
        if (socket) {
            socket.on('message', (msg: any) => {
                // Only append if it belongs to current chat or we handle global notifications
                if (activeChat && (msg.senderId === activeChat.id || msg.senderId === 'me')) {
                    setMessages((prev) => [...prev, msg]);
                }
            });
        }
        return () => {
            if (socket) socket.off('message');
        }
    }, [socket, activeChat]);

    // Fetch messages and offers when activeChat changes
    useEffect(() => {
        if (activeChat) {
            const convId = activeChat.id;
            setTimeout(() => {
                setConversationId(convId);
            }, 0);

            // Fetch messages
            api.chat.getMessages(convId).then((data: any) => {
                const userId = currentUser?._id || JSON.parse(localStorage.getItem('user') || '{}')._id;
                const formatted = data.map((m: any) => ({
                    _id: m._id,
                    text: m.content,
                    sender: m.senderId?._id === userId || m.senderId === userId ? 'me' : 'them',
                    senderId: m.senderId?._id || m.senderId,
                    timestamp: m.createdAt,
                    messageType: m.messageType
                }));
                setMessages(formatted);
            }).catch(console.error);

            // Fetch offers
            api.chat.getOffers(convId).then((data: any) => {
                setOffers(data || []);
            }).catch(console.error);
        }
    }, [activeChat, currentUser]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !activeChat) return;

        try {
            const receiverId = activeChat.partnerId || activeChat.id;
            await api.chat.sendMessage({
                receiverId,
                content: input,
                messageType: 'text'
            });

            // Refresh messages
            const data = await api.chat.getMessages(activeChat.id);
            const userId = currentUser?._id || JSON.parse(localStorage.getItem('user') || '{}')._id;
            const formatted = data.map((m: any) => ({
                _id: m._id,
                text: m.content,
                sender: m.senderId?._id === userId || m.senderId === userId ? 'me' : 'them',
                senderId: m.senderId?._id || m.senderId,
                timestamp: m.createdAt,
                messageType: m.messageType
            }));
            setMessages(formatted);
            setInput('');
        } catch (err) {
            console.error(err);
            showModal({
                title: 'Error',
                message: 'Failed to send message',
                type: 'error'
            });
        }
    };

    const handleCreateOffer = async (offerData: any) => {
        if (!activeChat || !conversationId) return;

        try {
            const receiverId = activeChat.partnerId || activeChat.id;
            await api.chat.createOffer({
                conversationId,
                receiverId,
                ...offerData
            });

            // Refresh offers and messages
            const offersData = await api.chat.getOffers(conversationId);
            setOffers(offersData || []);

            const messagesData = await api.chat.getMessages(conversationId);
            const userId = currentUser?._id || JSON.parse(localStorage.getItem('user') || '{}')._id;
            const formatted = messagesData.map((m: any) => ({
                _id: m._id,
                text: m.content,
                sender: m.senderId?._id === userId || m.senderId === userId ? 'me' : 'them',
                senderId: m.senderId?._id || m.senderId,
                timestamp: m.createdAt,
                messageType: m.messageType
            }));
            setMessages(formatted);

            setShowOfferModal(false);
            showModal({
                title: 'Success',
                message: 'Offer sent successfully!',
                type: 'success'
            });
        } catch (err: any) {
            console.error(err);
            showModal({
                title: 'Error',
                message: err.message || 'Failed to create offer',
                type: 'error'
            });
        }
    };

    const handleAcceptOffer = async (offerId: string) => {
        showModal({
            title: 'Accept Offer',
            message: 'This will process payment and create an order. Continue?',
            type: 'confirm',
            onConfirm: async () => {
                try {
                    const result = await api.chat.acceptOffer(offerId);

                    // Refresh offers
                    if (conversationId) {
                        const offersData = await api.chat.getOffers(conversationId);
                        setOffers(offersData || []);
                    }

                    showModal({
                        title: 'Success',
                        message: `Order #${result.order._id} created successfully! Payment processed.`,
                        type: 'success'
                    });
                } catch (err: any) {
                    console.error(err);
                    showModal({
                        title: 'Error',
                        message: err.message || 'Failed to accept offer',
                        type: 'error'
                    });
                }
            }
        });
    };

    return (
        <div className="flex h-screen bg-white">
            {/* Sidebar List */}
            <div className="w-1/3 border-r border-gray-100 flex flex-col">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-2xl font-black text-gray-900">Messages</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {chats.map((chat) => (
                        <div
                            key={chat.id}
                            onClick={() => setActiveChat(chat)}
                            className={`p-4 hover:bg-gray-50 cursor-pointer flex items-center gap-4 border-b border-gray-50 ${activeChat?.id === chat.id ? 'bg-green-50' : ''}`}
                        >
                            <div className="relative">
                                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                                {chat.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#09BF44] border-2 border-white rounded-full"></div>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-900 truncate">{chat.name}</h4>
                                <p className="text-gray-500 text-sm truncate">{chat.lastMessage}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
                {activeChat ? (
                    <>
                        {/* Header */}
                        <div className="h-20 border-b border-gray-100 flex items-center justify-between px-8 bg-white/80 backdrop-blur-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{activeChat.name}</h3>
                                    <span className="text-xs text-[#09BF44] font-bold">{activeChat.online ? 'Online' : 'Offline'}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-6 text-gray-400">
                                <Phone className="w-5 h-5 cursor-pointer hover:text-[#09BF44]" />
                                <Video className="w-5 h-5 cursor-pointer hover:text-[#09BF44]" />
                                <MoreVertical className="w-5 h-5 cursor-pointer hover:text-gray-600" />
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-50/50">
                            {/* Display offers */}
                            {offers.map((offer: any) => {
                                const isMyOffer = offer.senderId?._id === currentUser?._id || offer.senderId === currentUser?._id;
                                const canAccept = !isMyOffer && offer.status === 'pending';

                                return (
                                    <div key={offer._id} className={`flex ${isMyOffer ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] p-6 rounded-2xl border-2 ${isMyOffer
                                            ? 'bg-[#09BF44] text-white border-[#09BF44]'
                                            : 'bg-white border-[#09BF44]'}`}>
                                            <div className="flex items-center gap-2 mb-3">
                                                <FileText className={`w-5 h-5 ${isMyOffer ? 'text-white' : 'text-[#09BF44]'}`} />
                                                <span className={`font-bold ${isMyOffer ? 'text-white' : 'text-gray-900'}`}>
                                                    Custom Offer
                                                </span>
                                                {offer.status === 'accepted' && (
                                                    <CheckCircle className={`w-4 h-4 ml-auto ${isMyOffer ? 'text-white' : 'text-green-600'}`} />
                                                )}
                                                {offer.status === 'rejected' && (
                                                    <XCircle className={`w-4 h-4 ml-auto ${isMyOffer ? 'text-white' : 'text-red-600'}`} />
                                                )}
                                            </div>

                                            <div className={`space-y-2 mb-4 ${isMyOffer ? 'text-white/90' : 'text-gray-700'}`}>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-bold">Price:</span>
                                                    <span className="text-lg font-black">{offer.price} EGP</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-bold">Delivery:</span>
                                                    <span className="text-sm">{offer.deliveryDays} days</span>
                                                </div>
                                                <div className="pt-2 border-t border-white/20">
                                                    <p className="text-sm font-bold mb-1">What&apos;s Included:</p>
                                                    <p className="text-sm">{offer.whatsIncluded}</p>
                                                </div>
                                                {offer.milestones && offer.milestones.length > 0 && (
                                                    <div className="pt-2 border-t border-white/20">
                                                        <p className="text-sm font-bold mb-2">Milestones:</p>
                                                        {offer.milestones.map((milestone: any, idx: number) => (
                                                            <div key={idx} className="text-xs mb-1">
                                                                • {milestone.name}: {milestone.price} EGP
                                                                {milestone.dueDate && ` (Due: ${new Date(milestone.dueDate).toLocaleDateString()})`}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {canAccept && (
                                                <button
                                                    onClick={() => handleAcceptOffer(offer._id)}
                                                    className="w-full bg-white text-[#09BF44] font-bold py-2 rounded-xl hover:bg-gray-50 transition-colors"
                                                >
                                                    Accept Offer
                                                </button>
                                            )}
                                            {offer.status === 'accepted' && (
                                                <div className="text-center text-sm font-bold opacity-75">
                                                    ✓ Offer Accepted
                                                </div>
                                            )}
                                            {offer.status === 'rejected' && (
                                                <div className="text-center text-sm font-bold opacity-75">
                                                    ✗ Offer Rejected
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Display messages */}
                            {messages.map((msg, idx) => (
                                <div key={msg._id || idx} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] p-4 rounded-2xl ${msg.sender === 'me' ? 'bg-[#09BF44] text-white rounded-tr-none' : 'bg-white border border-gray-100 rounded-tl-none'}`}>
                                        <p className="text-sm">{msg.text}</p>
                                        <span className={`text-[10px] mt-1 block ${msg.sender === 'me' ? 'text-green-100' : 'text-gray-400'}`}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-6 bg-white border-t border-gray-100 space-y-3">
                            {/* Create Offer Button */}
                            <button
                                onClick={() => setShowOfferModal(true)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl font-bold text-gray-700 transition-colors"
                            >
                                <FileText className="w-5 h-5 text-[#09BF44]" />
                                Create Offer
                            </button>

                            <form onSubmit={sendMessage} className="flex items-center gap-4 bg-gray-50 p-2 rounded-full border border-gray-200 focus-within:border-[#09BF44] focus-within:ring-2 focus-within:ring-green-100 transition-all">
                                <button type="button" className="p-2 text-gray-400 hover:text-gray-600">
                                    <Paperclip className="w-5 h-5" />
                                </button>
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-transparent border-none outline-none text-gray-700 placeholder-gray-400"
                                />
                                <button type="submit" className="p-3 bg-[#09BF44] text-white rounded-full hover:bg-[#07a63a] transition-all transform hover:scale-105 shadow-md shadow-green-200">
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center flex-col text-gray-400">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Send className="w-10 h-10 text-gray-300" />
                        </div>
                        <p className="font-bold text-lg">Select a conversation to start chatting</p>
                    </div>
                )}
            </div>

            {/* Create Offer Modal */}
            {showOfferModal && activeChat && (
                <CreateOfferModal
                    isOpen={showOfferModal}
                    onClose={() => setShowOfferModal(false)}
                    onSubmit={handleCreateOffer}
                />
            )}
        </div>
    );
}
