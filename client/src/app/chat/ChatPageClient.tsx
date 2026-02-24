"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import { Send, Video, Paperclip, MoreVertical, FileText, CheckCircle, XCircle, MessageSquare, Shield, PanelLeft, ArrowLeft, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useModal } from '@/context/ModalContext';
import CreateOfferModal from '@/components/CreateOfferModal';
import ClientSidebar from '@/components/ClientSidebar';
import FreelancerSidebar from '@/components/FreelancerSidebar';
import DashboardMobileTopStrip from '@/components/DashboardMobileTopStrip';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function ChatPageClient() {
    const router = useRouter();
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
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [partnerOnline, setPartnerOnline] = useState(false);
    const [consultationStatus, setConsultationStatus] = useState<{ hasUnusedPayment: boolean; lastMeetingLink?: string | null } | null>(null);
    const [showMeetingModal, setShowMeetingModal] = useState(false);
    const [meetingDate, setMeetingDate] = useState('');
    const [meetingTime, setMeetingTime] = useState('');
    const [settingMeeting, setSettingMeeting] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const resolveUserId = useCallback(() => {
        const storedUser = typeof window !== 'undefined'
            ? JSON.parse(localStorage.getItem('user') || '{}')
            : {};
        return String(currentUser?._id || currentUser?.id || storedUser?._id || storedUser?.id || '');
    }, [currentUser]);

    useEffect(() => {
        // Get current user
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const authToken = localStorage.getItem('token');
        setTimeout(() => {
            setCurrentUser(storedUser);
        }, 0);

        // Fetch profile based on user role
        if (authToken && storedUser.role) {
            if (storedUser.role === 'client') {
                api.client.getProfile().then((data) => {
                    setProfile(data);
                    setTimeout(() => {
                        setLoading(false);
                    }, 0);
                }).catch(() => {
                    setTimeout(() => {
                        setLoading(false);
                    }, 0);
                });
            } else if (storedUser.role === 'freelancer') {
                api.freelancer.getProfile().then((data) => {
                    setProfile(data);
                    setTimeout(() => {
                        setLoading(false);
                    }, 0);
                }).catch(() => {
                    setTimeout(() => {
                        setLoading(false);
                    }, 0);
                });
            } else {
                setTimeout(() => {
                    setLoading(false);
                }, 0);
            }
        } else {
            setTimeout(() => {
                setLoading(false);
            }, 0);
        }

        // Check for conversation ID in URL
        const urlConversationId = searchParams.get('conversation');
        if (urlConversationId) {
            // Find chat by conversation ID or partner ID
            api.chat.getConversations().then((data: any) => {
                if (Array.isArray(data)) {
                    setChats(data);
                    const foundChat = data.find((c: any) => c.id === urlConversationId || c.partnerId === urlConversationId);
                    if (foundChat) {
                        setChats(data.map((c: any) => c.id === foundChat.id ? { ...c, unreadCount: 0, hasUnread: false } : c));
                        setPartnerOnline(false);
                        setActiveChat({ ...foundChat, unreadCount: 0, hasUnread: false });
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
            auth: { token: authToken || '' },
            extraHeaders: authToken ? { 'x-auth-token': authToken } : {}
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
                // Only append if it belongs to current chat
                if (activeChat && conversationId && (msg.conversationId === conversationId || String(msg.conversationId) === String(conversationId))) {
                    const userId = resolveUserId();
                    const senderId = msg.senderId?._id || msg.senderId;
                    const isMine = String(senderId) === String(userId);
                    // Skip our own messages - we already have optimistic update and will refetch
                    if (isMine) return;
                    const isAdmin = msg.isAdmin || msg.content?.includes('[Engezhaly Admin]');
                    const isMeeting = msg.messageType === 'meeting' || msg.content?.includes('[Engezhaly Meeting]');
                    const formattedMsg = {
                        _id: msg._id,
                        text: msg.content,
                        sender: 'them' as const,
                        senderId: senderId,
                        timestamp: msg.createdAt || new Date(),
                        messageType: msg.messageType,
                        isRead: !!msg.isRead,
                        isAdmin: isAdmin,
                        isMeeting: isMeeting
                    };
                    setMessages((prev) => {
                        const exists = prev.some(m => m._id === formattedMsg._id);
                        if (exists) return prev;
                        return [...prev, formattedMsg];
                    });
                } else {
                    const userId = resolveUserId();
                    const senderId = msg.senderId?._id || msg.senderId;
                    const isMine = String(senderId) === String(userId);
                    const targetConversationId = String(msg.conversationId);
                    setChats((prev: any[]) => prev.map((c) => {
                        if (String(c.id) !== targetConversationId) return c;
                        const nextUnread = isMine ? Number(c.unreadCount || 0) : Number(c.unreadCount || 0) + 1;
                        return {
                            ...c,
                            lastMessage: msg.content || c.lastMessage,
                            unreadCount: nextUnread,
                            hasUnread: nextUnread > 0
                        };
                    }));
                }
            });
        }
        return () => {
            if (socket) socket.off('message');
        };
    }, [socket, activeChat, conversationId, currentUser, resolveUserId]);

    // Join/leave socket room when conversation changes
    useEffect(() => {
        if (!socket || !conversationId) return;
        socket.emit('join_chat', conversationId);
        return () => {
            socket.emit('leave_chat', conversationId);
        };
    }, [socket, conversationId]);

    // Listen for presence (online/offline)

    useEffect(() => {
        if (!socket || !activeChat?.partnerId) return;
        const handleOnline = (data: { userId: string; conversationId: string }) => {
            if (String(data.conversationId) === String(conversationId) && String(data.userId) === String(activeChat.partnerId)) {
                setPartnerOnline(true);
            }
        };
        const handleOffline = (data: { userId: string; conversationId: string }) => {
            if (String(data.conversationId) === String(conversationId) && String(data.userId) === String(activeChat.partnerId)) {
                setPartnerOnline(false);
            }
        };
        const handleUsersInRoom = (data: { conversationId: string; userIds: string[] }) => {
            if (String(data.conversationId) !== String(conversationId)) return;
            const partnerId = String(activeChat?.partnerId || '');
            setPartnerOnline(data.userIds.some((id) => String(id) === partnerId));
        };
        socket.on('user_online', handleOnline);
        socket.on('user_offline', handleOffline);
        socket.on('users_in_room', handleUsersInRoom);
        return () => {
            socket.off('user_online', handleOnline);
            socket.off('user_offline', handleOffline);
            socket.off('users_in_room', handleUsersInRoom);
        };
    }, [socket, conversationId, activeChat?.partnerId]);

    // Fetch messages and offers when activeChat changes
    useEffect(() => {
        if (activeChat) {
            const convId = activeChat.id;
            setTimeout(() => {
                setConversationId(convId);
            }, 0);

            // Fetch messages
            api.chat.getMessages(convId).then((data: any) => {
                const userId = resolveUserId();
                const formatted = data.map((m: any) => {
                    const senderId = m.senderId?._id || m.senderId;
                    const isAdmin = m.isAdmin || m.content?.includes('[Engezhaly Admin]');
                    const isMeeting = m.messageType === 'meeting' || m.content?.includes('[Engezhaly Meeting]');
                    return {
                        _id: m._id,
                        text: m.content,
                        sender: String(senderId) === String(userId) ? 'me' : 'them',
                        senderId: senderId,
                        timestamp: m.createdAt,
                        messageType: m.messageType,
                        isRead: !!m.isRead,
                        isAdmin: isAdmin,
                        isMeeting: isMeeting
                    };
                });
                setMessages(formatted);
            }).catch(console.error);

            // Fetch consultation status
            api.chat.getConsultationStatus(convId).then((data: any) => {
                setConsultationStatus(data);
            }).catch(() => setConsultationStatus(null));

            // Fetch offers
            api.chat.getOffers(convId).then((data: any) => {
                setOffers(data || []);
            }).catch(console.error);
        } else {
            setConsultationStatus(null);
        }
    }, [activeChat, currentUser, resolveUserId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !activeChat) return;

        // Check if conversation is frozen
        if (activeChat.isFrozen) {
            showModal({
                title: 'Conversation Frozen',
                message: 'This conversation has been frozen. A support team will review and unfreeze it as soon as possible.',
                type: 'error'
            });
            return;
        }

        const messageContent = input;
        setInput(''); // Clear input immediately for better UX
        
        try {
            const receiverId = activeChat.partnerId?._id ?? activeChat.partnerId;
            if (!receiverId) {
                showModal({ title: 'Error', message: 'Cannot send message: no recipient selected.', type: 'error' });
                return;
            }
                    const userId = resolveUserId();
            
            // Optimistically add the message to show it immediately
            const optimisticMessage = {
                _id: `temp-${Date.now()}`,
                text: messageContent,
                sender: 'me' as const,
                senderId: userId,
                timestamp: new Date(),
                messageType: 'text',
                isRead: false
            };
            setMessages((prev) => [...prev, optimisticMessage]);
            
            await api.chat.sendMessage({
                receiverId,
                content: messageContent,
                messageType: 'text'
            });

            // Refresh messages to get the real message from server
            const data = await api.chat.getMessages(activeChat.id);
            const formatted = data.map((m: any) => {
                const senderId = m.senderId?._id || m.senderId;
                const isAdmin = m.isAdmin || m.content?.includes('[Engezhaly Admin]');
                const isMeeting = m.messageType === 'meeting' || m.content?.includes('[Engezhaly Meeting]');
                return {
                    _id: m._id,
                    text: m.content,
                    sender: String(senderId) === String(userId) ? 'me' : 'them',
                    senderId: senderId,
                    timestamp: m.createdAt,
                    messageType: m.messageType,
                    isRead: !!m.isRead,
                    isAdmin: isAdmin,
                    isMeeting: isMeeting
                };
            });
            setMessages(formatted);
            
            // Refresh conversations to update isFrozen status if it changed
            api.chat.getConversations().then((data: any) => {
                if (Array.isArray(data)) {
                    setChats(data);
                    const updatedChat = data.find((c: any) => c.id === activeChat.id);
                    if (updatedChat) {
                        setActiveChat(updatedChat);
                    }
                }
            }).catch(console.error);
        } catch (err: any) {
            console.error(err);
            // Check if error is due to frozen conversation
            if (err.message?.includes('frozen') || err.message?.includes('Frozen')) {
                // Refresh conversations to get updated status
                api.chat.getConversations().then((data: any) => {
                    if (Array.isArray(data)) {
                        setChats(data);
                        const updatedChat = data.find((c: any) => c.id === activeChat.id);
                        if (updatedChat) {
                            setActiveChat(updatedChat);
                        }
                    }
                }).catch(console.error);
            }
            showModal({
                title: 'Error',
                message: err.message || 'Failed to send message',
                type: 'error'
            });
        }
    };

    const handleCreateOffer = async (offerData: any) => {
        if (!activeChat || !conversationId) return;

        const receiverId = activeChat.partnerId?._id ?? activeChat.partnerId;
        if (!receiverId) {
            showModal({ title: 'Error', message: 'Cannot create offer: no recipient selected.', type: 'error' });
            return;
        }

        try {
            await api.chat.createOffer({
                conversationId,
                receiverId,
                ...offerData
            });

            // Refresh offers and messages
            const offersData = await api.chat.getOffers(conversationId);
            setOffers(offersData || []);

            const messagesData = await api.chat.getMessages(conversationId);
            const userId = resolveUserId();
            const formatted = messagesData.map((m: any) => {
                const senderId = m.senderId?._id || m.senderId;
                const isAdmin = m.isAdmin || m.content?.includes('[Engezhaly Admin]');
                return {
                    _id: m._id,
                    text: m.content,
                    sender: String(senderId) === String(userId) ? 'me' : 'them',
                    senderId: senderId,
                    timestamp: m.createdAt,
                    messageType: m.messageType,
                    isRead: !!m.isRead,
                    isAdmin: isAdmin
                };
            });
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

    const handleBookConsultation = async () => {
        if (!activeChat || !conversationId) return;

        const token = localStorage.getItem('token');
        if (!token) {
            showModal({ title: 'Login Required', message: 'Please log in to use this feature.', type: 'info' });
            return;
        }

        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const isClient = storedUser.role === 'client';

        try {
            // If we have unused payment, show date/time modal
            if (consultationStatus?.hasUnusedPayment) {
                setMeetingDate('');
                setMeetingTime('');
                setShowMeetingModal(true);
                return;
            }

            // No unused payment - client must pay first
            if (!isClient) {
                showModal({
                    title: 'Consultation Payment Required',
                    message: 'Ask the client to pay 100 EGP for a video consultation. Once paid, either party can schedule the meeting.',
                    type: 'info'
                });
                return;
            }

            const balance = await api.wallet.getBalance();
            if (balance.balance < 100) {
                showModal({
                    title: 'Insufficient Balance',
                    message: 'You need at least 100 EGP in your wallet to book a consultation.',
                    type: 'error'
                });
                return;
            }

            showModal({
                title: 'Pay for Video Consultation',
                message: 'This will deduct 100 EGP from your wallet. After payment, you can schedule a meeting date and time. Proceed?',
                type: 'confirm',
                onConfirm: async () => {
                    try {
                        await api.wallet.payConsultation(conversationId);
                        const receiverId = activeChat.partnerId?._id ?? activeChat.partnerId;
                        if (receiverId) {
                            await api.chat.sendMessage({
                                receiverId,
                                content: '[Engezhaly Meeting] A video consultation has been paid for (100 EGP). You can now schedule the meeting by clicking the video call button.',
                                messageType: 'text'
                            });
                        }
                        setConsultationStatus({ hasUnusedPayment: true });
                        showModal({ title: 'Success', message: 'Payment successful! Click the video call button again to schedule your meeting.', type: 'success' });
                        if (conversationId) {
                            const data = await api.chat.getMessages(conversationId);
                            const userId = resolveUserId();
                            const formatted = data.map((m: any) => {
                                const senderId = m.senderId?._id || m.senderId;
                                const isAdmin = m.isAdmin || m.content?.includes('[Engezhaly Admin]');
                                const isMeeting = m.messageType === 'meeting' || m.content?.includes('[Engezhaly Meeting]');
                                return {
                                    _id: m._id,
                                    text: m.content,
                                    sender: String(senderId) === String(userId) ? 'me' : 'them',
                                    senderId: senderId,
                                    timestamp: m.createdAt,
                                    messageType: m.messageType,
                                    isRead: !!m.isRead,
                                    isAdmin: isAdmin,
                                    isMeeting: isMeeting
                                };
                            });
                            setMessages(formatted);
                        }
                    } catch (err: any) {
                        showModal({ title: 'Error', message: err.message || 'Payment failed', type: 'error' });
                    }
                }
            });
        } catch (err: any) {
            showModal({ title: 'Error', message: err.message || 'Failed to check status', type: 'error' });
        }
    };

    const handleSetMeeting = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!conversationId || !meetingDate || !meetingTime || settingMeeting) return;

        setSettingMeeting(true);
        try {
            await api.chat.createConsultationMeeting({
                conversationId,
                meetingDate,
                meetingTime
            });
            setShowMeetingModal(false);
            setConsultationStatus({ hasUnusedPayment: false });
            showModal({ title: 'Success', message: 'Meeting scheduled! The link has been sent in the chat.', type: 'success' });
            const data = await api.chat.getMessages(conversationId);
            const userId = resolveUserId();
            const formatted = data.map((m: any) => {
                const senderId = m.senderId?._id || m.senderId;
                const isAdmin = m.isAdmin || m.content?.includes('[Engezhaly Admin]');
                const isMeeting = m.messageType === 'meeting' || m.content?.includes('[Engezhaly Meeting]');
                return {
                    _id: m._id,
                    text: m.content,
                    sender: String(senderId) === String(userId) ? 'me' : 'them',
                    senderId: senderId,
                    timestamp: m.createdAt,
                    messageType: m.messageType,
                    isRead: !!m.isRead,
                    isAdmin: isAdmin,
                    isMeeting: isMeeting
                };
            });
            setMessages(formatted);
        } catch (err: any) {
            showModal({ title: 'Error', message: (err as Error).message || 'Failed to create meeting', type: 'error' });
        } finally {
            setSettingMeeting(false);
        }
    };

    const toggleBusy = async () => {
        if (currentUser?.role !== 'freelancer' || !profile) return;
        try {
            const newStatus = !profile?.freelancerProfile?.isBusy;
            const updated = await api.freelancer.updateProfile({ isBusy: newStatus });
            setProfile(updated);
            showModal({
                title: 'Success',
                message: `Status updated to ${newStatus ? 'Busy' : 'Available'}`,
                type: 'success'
            });
        } catch (err: any) {
            console.error(err);
            showModal({
                title: 'Error',
                message: err.message || 'Failed to update status',
                type: 'error'
            });
        }
    };

    const getInitials = (name: string) => {
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return name[0]?.toUpperCase() || 'U';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#09BF44]"></div>
            </div>
        );
    }

    // Redirect to home if not logged in
    if (!currentUser || !currentUser.role) {
        router.push('/');
        return null;
    }

    return (
        <div className="bg-gray-50 flex font-sans text-gray-900 h-[100dvh] md:h-screen overflow-hidden">
            {/* Dashboard Sidebar */}
            {currentUser.role === 'client' ? (
                <ClientSidebar
                    user={currentUser}
                    profile={profile}
                    mobileOpen={mobileSidebarOpen}
                    onCloseMobile={() => setMobileSidebarOpen(false)}
                />
            ) : currentUser.role === 'freelancer' ? (
                <FreelancerSidebar
                    user={currentUser}
                    profile={profile}
                    onToggleBusy={toggleBusy}
                    mobileOpen={mobileSidebarOpen}
                    onCloseMobile={() => setMobileSidebarOpen(false)}
                />
            ) : null}
            {mobileSidebarOpen && (
                <button
                    aria-label="Close sidebar overlay"
                    onClick={() => setMobileSidebarOpen(false)}
                    className="fixed inset-0 bg-black/40 z-30 md:hidden"
                />
            )}

            {/* Main Content Area */}
            <div className="flex-1 md:ml-72 p-3 md:p-8 pt-3 md:pt-8 overflow-hidden h-[100dvh] md:h-screen flex flex-col">
                <DashboardMobileTopStrip />
                <div className="flex gap-3 md:gap-6 flex-1 min-h-0 overflow-hidden">
                    {/* Conversations Sidebar */}
                    <div className={`${activeChat ? 'hidden md:flex' : 'flex'} w-full md:w-80 bg-white rounded-2xl md:rounded-3xl border border-gray-200 flex-col shadow-sm overflow-hidden flex-shrink-0 h-full`}>
                        <div className="p-4 md:p-6 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50 rounded-t-2xl md:rounded-t-3xl flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setMobileSidebarOpen(true)}
                                    className="md:hidden p-2 rounded-lg border border-gray-200 bg-white text-gray-700"
                                    aria-label="Open dashboard menu"
                                >
                                    <PanelLeft className="w-4 h-4" />
                                </button>
                                <div className="p-2 bg-[#09BF44]/10 rounded-xl">
                                    <MessageSquare className="w-6 h-6 text-[#09BF44]" />
                                </div>
                                <h2 className="text-xl md:text-2xl font-black text-gray-900">Messages</h2>
                                {chats.reduce((sum, c) => sum + Number(c.unreadCount || 0), 0) > 0 && (
                                    <span className="ml-auto rounded-full bg-[#09BF44] text-white text-xs font-bold px-2.5 py-1">
                                        {chats.reduce((sum, c) => sum + Number(c.unreadCount || 0), 0)}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto min-h-0">
                            {chats.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6">
                                    <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
                                    <p className="font-bold text-lg">No conversations yet</p>
                                    <p className="text-sm mt-2">Start a conversation to see it here</p>
                                </div>
                            ) : (
                                chats.map((chat) => {
                                    const partnerName = chat.name || 'Unknown User';
                                    const partnerInitials = getInitials(partnerName);
                                    const isActive = activeChat?.id === chat.id;
                                    const unreadCount = Number(chat.unreadCount || 0);
                                    const hasUnread = unreadCount > 0;

                                    return (
                                        <div
                                            key={chat.id}
                                            onClick={() => {
                                                const openedChat = { ...chat, unreadCount: 0, hasUnread: false };
                                                setPartnerOnline(false);
                                                setActiveChat(openedChat);
                                                setChats((prev: any[]) =>
                                                    prev.map((c) => c.id === chat.id ? { ...c, unreadCount: 0, hasUnread: false } : c)
                                                );
                                            }}
                                            className={`p-4 cursor-pointer flex items-center gap-4 border-b border-gray-100 transition-all ${isActive
                                                    ? 'bg-gradient-to-r from-[#09BF44]/10 to-[#09BF44]/5 border-l-4 border-l-[#09BF44]'
                                                    : 'hover:bg-gray-50'
                                                }`}
                                        >
                                            {/* Profile Picture */}
                                            <div className="relative shrink-0">
                                                {/* Gradient Background Blur */}
                                                <div className="absolute inset-0 flex items-center justify-center -z-10">
                                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#09BF44]/30 via-[#09BF44]/15 to-transparent blur-md"></div>
                                                </div>
                                                {/* Profile Picture Container */}
                                                <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-md z-10 bg-gray-200">
                                                    {chat.profilePicture ? (
                                                        <Image
                                                            src={chat.profilePicture}
                                                            alt={partnerName}
                                                            width={56}
                                                            height={56}
                                                            className="w-full h-full object-cover rounded-full"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full rounded-full bg-gradient-to-br from-[#09BF44] to-[#07a63a] flex items-center justify-center text-white font-black text-sm">
                                                            {partnerInitials}
                                                        </div>
                                                    )}
                                                </div>
                                                {(chat.id === activeChat?.id && partnerOnline) && (
                                                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-[#09BF44] border-2 border-white rounded-full shadow-sm"></div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-gray-900 truncate text-sm">{partnerName}</h4>
                                                <p className={`${hasUnread && !isActive ? 'text-gray-800 font-semibold' : 'text-gray-500'} text-xs truncate mt-0.5`}>
                                                    {chat.lastMessage || 'No messages yet'}
                                                </p>
                                            </div>
                                            {hasUnread && !isActive && (
                                                <div className="shrink-0 min-w-5 h-5 px-1 rounded-full bg-[#09BF44] text-white text-[10px] font-bold flex items-center justify-center">
                                                    {unreadCount > 99 ? '99+' : unreadCount}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className={`${activeChat ? 'flex' : 'hidden md:flex'} flex-1 bg-white rounded-2xl md:rounded-3xl border border-gray-200 flex-col shadow-sm overflow-hidden h-full relative`} style={{ minHeight: 0 }}>
                        {activeChat ? (
                            <>
                                {/* Frozen Overlay */}
                                {activeChat.isFrozen && (
                                    <div className="absolute inset-0 bg-white/80 backdrop-blur-md z-50 flex items-center justify-center rounded-3xl">
                                        <div className="bg-white rounded-3xl p-8 shadow-2xl border-2 border-blue-200 max-w-md mx-4 text-center">
                                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                            </div>
                                            <h3 className="text-xl font-black text-gray-900 mb-2">Conversation Frozen</h3>
                                            <p className="text-gray-600 text-sm leading-relaxed">
                                                This conversation has been frozen. A support team will review the chat and unfreeze it as soon as possible.
                                            </p>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Header */}
                                <div className="h-16 md:h-20 border-b border-gray-200 flex items-center justify-between px-3 md:px-8 bg-white rounded-t-2xl md:rounded-t-3xl shadow-sm flex-shrink-0">
                                    <div className="flex items-center gap-3 md:gap-4 min-w-0">
                                        <button
                                            onClick={() => {
                                                setPartnerOnline(false);
                                                setActiveChat(null);
                                            }}
                                            className="md:hidden p-2 rounded-lg border border-gray-200 text-gray-600"
                                            aria-label="Back to conversations"
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                        </button>
                                        {/* Profile Picture */}
                                        <div className="relative">
                                            {/* Gradient Background Blur */}
                                            <div className="absolute inset-0 flex items-center justify-center -z-10">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#09BF44]/30 via-[#09BF44]/15 to-transparent blur-md"></div>
                                            </div>
                                            {/* Profile Picture Container */}
                                            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md z-10 bg-gray-200">
                                                {activeChat.profilePicture ? (
                                                    <Image
                                                        src={activeChat.profilePicture}
                                                        alt={activeChat.name}
                                                        width={48}
                                                        height={48}
                                                        className="w-full h-full object-cover rounded-full"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full rounded-full bg-gradient-to-br from-[#09BF44] to-[#07a63a] flex items-center justify-center text-white font-black text-sm">
                                                        {getInitials(activeChat.name)}
                                                    </div>
                                                )}
                                            </div>
                                            {partnerOnline && (
                                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#09BF44] border-2 border-white rounded-full"></div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-gray-900 text-base md:text-lg truncate">{activeChat.name}</h3>
                                            <span className="text-xs text-[#09BF44] font-bold flex items-center gap-1">
                                                <div className={`w-2 h-2 rounded-full ${partnerOnline ? 'bg-[#09BF44]' : 'bg-gray-300'}`}></div>
                                                {partnerOnline ? 'Online' : 'Offline'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 md:gap-4 text-gray-400">
                                        <button
                                            onClick={handleBookConsultation}
                                            className="p-2 hover:bg-gray-100 rounded-xl transition-colors hover:text-[#09BF44]"
                                            title="Book Consultation"
                                        >
                                            <Video className="w-5 h-5" />
                                        </button>
                                        <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors hover:text-gray-600">
                                            <MoreVertical className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div style={{ overflowY: 'auto', overflowX: 'hidden' }} className="flex-1 p-3 md:p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white rounded-b-2xl md:rounded-b-3xl min-h-0">
                                    {/* Display offers */}
                                    {offers.map((offer: any) => {
                                        const currentUserId = resolveUserId();
                                        const isMyOffer =
                                            String(offer.senderId?._id || offer.senderId) === String(currentUserId);
                                        const canAccept = !isMyOffer && offer.status === 'pending';

                                        return (
                                            <div key={offer._id} className={`flex ${isMyOffer ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[88%] md:max-w-[75%] p-4 md:p-5 rounded-2xl md:rounded-3xl shadow-sm border-2 ${isMyOffer
                                                        ? 'bg-[#09BF44] text-white border-[#09BF44]'
                                                        : 'bg-white border-[#09BF44]/20'
                                                    }`}>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <FileText className={`w-5 h-5 ${isMyOffer ? 'text-white' : 'text-[#09BF44]'}`} />
                                                        <span className={`font-bold text-base ${isMyOffer ? 'text-white' : 'text-gray-900'}`}>
                                                            Custom Offer
                                                        </span>
                                                        {offer.status === 'accepted' && (
                                                            <CheckCircle className={`w-5 h-5 ml-auto ${isMyOffer ? 'text-white' : 'text-green-600'}`} />
                                                        )}
                                                        {offer.status === 'rejected' && (
                                                            <XCircle className={`w-5 h-5 ml-auto ${isMyOffer ? 'text-white' : 'text-red-600'}`} />
                                                        )}
                                                    </div>

                                                    <div className={`space-y-3 mb-4 ${isMyOffer ? 'text-white/95' : 'text-gray-700'}`}>
                                                        <div className="flex items-center justify-between bg-white/10 rounded-xl p-3">
                                                            <span className="text-sm font-bold">Price:</span>
                                                            <span className="text-lg font-black">{offer.price} EGP</span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm font-bold">Delivery:</span>
                                                            <span className="text-sm font-medium">{offer.deliveryDays} days</span>
                                                        </div>
                                                        <div className="pt-3 border-t border-white/20">
                                                            <p className="text-sm font-bold mb-2">What&apos;s Included:</p>
                                                            <p className="text-sm leading-relaxed">{offer.whatsIncluded}</p>
                                                        </div>
                                                        {offer.milestones && offer.milestones.length > 0 && (
                                                            <div className="pt-3 border-t border-white/20">
                                                                <p className="text-sm font-bold mb-2">Milestones:</p>
                                                                {offer.milestones.map((milestone: any, idx: number) => (
                                                                    <div key={idx} className="text-xs mb-1.5 flex items-center gap-2">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60"></div>
                                                                        {milestone.name}: {milestone.price} EGP
                                                                        {milestone.dueDate && ` (Due: ${new Date(milestone.dueDate).toLocaleDateString()})`}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {canAccept && (
                                                        <button
                                                            onClick={() => handleAcceptOffer(offer._id)}
                                                            className="w-full bg-white text-[#09BF44] font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                                                        >
                                                            Accept Offer
                                                        </button>
                                                    )}
                                                    {offer.status === 'accepted' && (
                                                        <div className="text-center text-sm font-bold opacity-80 py-2">
                                                            ✓ Offer Accepted
                                                        </div>
                                                    )}
                                                    {offer.status === 'rejected' && (
                                                        <div className="text-center text-sm font-bold opacity-80 py-2">
                                                            ✗ Offer Rejected
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Display messages */}
                                    {messages.map((msg, idx) => {
                                        const isAdmin = msg.isAdmin || msg.text?.includes('[Engezhaly Admin]');
                                        const isMeeting = msg.isMeeting || msg.messageType === 'meeting' || msg.text?.includes('[Engezhaly Meeting]');
                                        const isCentered = isAdmin || isMeeting;
                                        let content = msg.text || '';
                                        if (isAdmin) content = content.replace('[Engezhaly Admin]', '').trim();
                                        if (isMeeting) content = content.replace('[Engezhaly Meeting]', '').trim();
                                        const linkMatch = content.match(/Join here: (https?:\/\/[^\s]+)/);
                                        const meetingLink = linkMatch ? linkMatch[1] : null;
                                        
                                        return (
                                            <div key={msg._id || idx} className={`flex w-full ${isCentered ? 'justify-center' : msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[88%] md:max-w-[70%] px-4 py-2 rounded-2xl shadow-sm ${
                                                    isAdmin
                                                        ? 'bg-yellow-100 border-2 border-yellow-300 text-gray-900'
                                                        : isMeeting
                                                            ? 'bg-green-50 border-2 border-[#09BF44]/40 text-gray-900'
                                                            : msg.sender === 'me'
                                                                ? 'bg-[#09BF44] text-white rounded-br-sm'
                                                                : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
                                                }`}>
                                                    {isAdmin && (
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Shield className="w-4 h-4 text-yellow-600" />
                                                            <span className="text-xs font-bold text-yellow-700">Engezhaly Admin</span>
                                                        </div>
                                                    )}
                                                    {isMeeting && (
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Video className="w-4 h-4 text-[#09BF44]" />
                                                            <span className="text-xs font-bold text-[#09BF44]">Video Meeting</span>
                                                        </div>
                                                    )}
                                                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{content}</p>
                                                    {meetingLink && (
                                                        <a
                                                            href={meetingLink}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-2 mt-2 px-3 py-2 bg-[#09BF44] text-white rounded-xl font-bold text-sm hover:bg-[#07a63a] transition-colors"
                                                        >
                                                            <Video className="w-4 h-4" /> Join Meeting
                                                        </a>
                                                    )}
                                                    <div className={`flex items-center justify-end mt-1 ${isAdmin ? 'text-yellow-700' : isMeeting ? 'text-[#09BF44]/80' : msg.sender === 'me' ? 'text-green-50' : 'text-gray-500'}`}>
                                                        <span className="text-[10px]">
                                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        {!isCentered && msg.sender === 'me' && (
                                                            <span className="text-[10px] ml-2 opacity-90">
                                                                {msg.isRead ? 'Read' : 'Unread'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input */}
                                <div className={`p-3 md:p-6 bg-white border-t border-gray-200 shadow-lg flex-shrink-0 ${activeChat.isFrozen ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3">
                                        {/* Create Offer Button */}
                                        <button
                                            type="button"
                                            onClick={() => setShowOfferModal(true)}
                                            disabled={activeChat.isFrozen}
                                            className="flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 bg-gradient-to-r from-[#09BF44]/10 to-[#09BF44]/5 hover:from-[#09BF44]/20 hover:to-[#09BF44]/10 border border-[#09BF44]/20 rounded-xl font-bold text-[#09BF44] transition-all text-sm whitespace-nowrap flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <FileText className="w-4 h-8" />
                                            Custom Offer
                                        </button>
                                        <form onSubmit={sendMessage} className="flex items-center gap-2 md:gap-3 bg-gray-50 p-2 rounded-2xl border-2 border-gray-200 focus-within:border-[#09BF44] focus-within:ring-2 focus-within:ring-[#09BF44]/20 transition-all flex-1 min-w-0">
                                            <button type="button" disabled={activeChat.isFrozen} className="p-2.5 text-gray-400 hover:text-[#09BF44] hover:bg-white rounded-xl transition-all flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed">
                                                <Paperclip className="w-5 h-5" />
                                            </button>
                                            <input
                                                type="text"
                                                value={input}
                                                onChange={(e) => setInput(e.target.value)}
                                                placeholder={activeChat.isFrozen ? "Conversation is frozen..." : "Type a message..."}
                                                disabled={activeChat.isFrozen}
                                                className="flex-1 bg-transparent border-none outline-none text-gray-700 placeholder-gray-400 text-sm min-w-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                            />
                                            <button type="submit" disabled={activeChat.isFrozen} className="p-3 bg-[#09BF44] text-white rounded-xl hover:bg-[#07a63a] transition-all shadow-md shadow-[#09BF44]/20 hover:shadow-lg hover:shadow-[#09BF44]/30 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed">
                                                <Send className="w-4 h-4" />
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center flex-col text-gray-400 bg-gradient-to-br from-gray-50 to-white">
                                <div className="relative mb-6">
                                    {/* Gradient Background Blur */}
                                    <div className="absolute inset-0 flex items-center justify-center -z-10">
                                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#09BF44]/20 via-[#09BF44]/10 to-transparent blur-2xl"></div>
                                    </div>
                                    <div className="w-24 h-24 bg-gradient-to-br from-[#09BF44]/10 to-[#09BF44]/5 rounded-3xl flex items-center justify-center border-2 border-[#09BF44]/20">
                                        <MessageSquare className="w-12 h-12 text-[#09BF44] opacity-60" />
                                    </div>
                                </div>
                                <p className="font-black text-xl text-gray-600 mb-2">Select a conversation</p>
                                <p className="text-sm text-gray-400">Choose a conversation from the sidebar to start chatting</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Schedule Meeting Modal */}
            {showMeetingModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Video className="w-6 h-6 text-[#09BF44]" />
                            <h3 className="text-xl font-black text-gray-900">Schedule Video Meeting</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">Choose a date and time for your video call. The meeting link will be sent in the chat.</p>
                        <form onSubmit={handleSetMeeting} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Date</label>
                                <input
                                    type="date"
                                    value={meetingDate}
                                    onChange={(e) => setMeetingDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    required
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-[#09BF44] focus:ring-2 focus:ring-[#09BF44]/20 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Time</label>
                                <input
                                    type="time"
                                    value={meetingTime}
                                    onChange={(e) => setMeetingTime(e.target.value)}
                                    required
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-[#09BF44] focus:ring-2 focus:ring-[#09BF44]/20 outline-none"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowMeetingModal(false)}
                                    className="flex-1 py-3 rounded-xl font-bold border-2 border-gray-200 text-gray-600 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={settingMeeting}
                                    className="flex-1 py-3 rounded-xl font-bold bg-[#09BF44] text-white hover:bg-[#07a63a] disabled:opacity-70 flex items-center justify-center gap-2"
                                >
                                    {settingMeeting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                                    Set Meeting
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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

