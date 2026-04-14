"use client";

import { Suspense, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import { Send, Video, Paperclip, FileText, CheckCircle, XCircle, MessageSquare, Shield, PanelLeft, ArrowLeft, Loader2, Mic, Square, Trash2, ScrollText, Link as LinkIcon, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDateDDMMYYYY, formatRevisionsLabel, orderHasClientVisibleDelivery } from '@/lib/utils';
import { useModal } from '@/context/ModalContext';
import CreateOfferModal from '@/components/CreateOfferModal';
import PaymobCheckoutModal from '@/components/PaymobCheckoutModal';
import PaymentChoiceModal from '@/components/PaymentChoiceModal';
import ChatRulesModal from '@/components/ChatRulesModal';
import { payWithWalletIfPossible } from '@/lib/payWithWalletIfPossible';
import DatePicker from '@/components/DatePicker';
import Avatar from '@/components/Avatar';
import ClientSidebar from '@/components/ClientSidebar';
import FreelancerSidebar from '@/components/FreelancerSidebar';
import DashboardMobileTopStrip from '@/components/DashboardMobileTopStrip';

const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://api.engezhaly.com/api').replace(/\/api$/, '');
const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/api$/, '');

function resolveChatMediaUrl(url: string) {
    if (!url || typeof url !== 'string') return '';
    const u = url.trim();
    if (u.startsWith('http://') || u.startsWith('https://')) return u;
    const base = API_ORIGIN || (typeof window !== 'undefined' ? window.location.origin : '');
    if (!base) return u;
    return `${base}${u.startsWith('/') ? '' : '/'}${u}`;
}

function chatAttachmentIsImageUrl(url: string) {
    try {
        const p = new URL(url).pathname.toLowerCase();
        return /\.(jpe?g|png|gif|webp)$/.test(p);
    } catch {
        return /\.(jpe?g|png|gif|webp)(\?|$)/i.test(url);
    }
}

function chatAttachmentIsPdfUrl(url: string) {
    try {
        return new URL(url).pathname.toLowerCase().endsWith('.pdf');
    } catch {
        return /\.pdf(\?|$)/i.test(url);
    }
}

/** Conversation id for API, or partner user id when no thread exists yet (pendingNew). */
function messagesApiId(chat: { id?: string; partnerId?: any; pendingNew?: boolean } | null) {
    if (!chat) return '';
    if (chat.pendingNew) return String(chat.partnerId?._id ?? chat.partnerId ?? '');
    return String(chat.id ?? '');
}

function ChatPageContent() {
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
    const [consultationStatus, setConsultationStatus] = useState<{ hasUnusedPayment: boolean; lastMeetingLink?: string | null; isFree?: boolean } | null>(null);
    const [showMeetingModal, setShowMeetingModal] = useState(false);
    const [meetingDate, setMeetingDate] = useState('');
    const [meetingTime, setMeetingTime] = useState('');
    const [meetingDuration, setMeetingDuration] = useState(30);
    const [settingMeeting, setSettingMeeting] = useState(false);
    const [checkoutIframeUrl, setCheckoutIframeUrl] = useState<string | null>(null);
    const [checkoutTitle, setCheckoutTitle] = useState('Complete Payment');
    const [paymentChoiceConfig, setPaymentChoiceConfig] = useState<{ type: string; amountCents: number; callbackSuccessUrl?: string; orderId?: string; offerId?: string; jobId?: string; proposalId?: string; conversationId?: string; durationMinutes?: number; meetingDate?: string; meetingTime?: string } | null>(null);
    const [pendingOrderForChat, setPendingOrderForChat] = useState<any>(null);
    const [pendingApprovalOrder, setPendingApprovalOrder] = useState<any>(null);
    const [pendingPaymentOrder, setPendingPaymentOrder] = useState<any>(null);
    const [pendingWorkToApprove, setPendingWorkToApprove] = useState<{ order?: any; job?: any; activeJobForNav?: any } | null>(null);
    const [freelancerActiveJobForChat, setFreelancerActiveJobForChat] = useState<any>(null);
    const [pendingOrderAction, setPendingOrderAction] = useState<'approve' | 'deny' | null>(null);
    const [acceptingOfferId, setAcceptingOfferId] = useState<string | null>(null);
    const [denyingOfferId, setDenyingOfferId] = useState<string | null>(null);
    const [busyToggling, setBusyToggling] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingSeconds, setRecordingSeconds] = useState(0);
    const [pendingVoiceRecording, setPendingVoiceRecording] = useState<{ blob: Blob; file: File; durationSeconds: number; objectUrl: string } | null>(null);
    const [sendingVoice, setSendingVoice] = useState(false);
    const [sendingChatFile, setSendingChatFile] = useState(false);
    const [showRulesModal, setShowRulesModal] = useState(false);
    const chatFileInputRef = useRef<HTMLInputElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordingChunksRef = useRef<Blob[]>([]);
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
    const stopVoiceRecordingRef = useRef<() => void | Promise<void>>(() => {});
    const pendingVoiceUrlRef = useRef<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesScrollRef = useRef<HTMLDivElement>(null);
    const didInitialScrollRef = useRef(false);

    const VOICE_MAX_DURATION_SEC = 120; // 2 minutes
    const resolveUserId = useCallback(() => {
        const storedUser = typeof window !== 'undefined'
            ? JSON.parse(localStorage.getItem('user') || '{}')
            : {};
        return String(currentUser?._id || currentUser?.id || storedUser?._id || storedUser?.id || '');
    }, [currentUser]);

    const refreshChatMessagesAndOffers = useCallback(async () => {
        if (!conversationId) return;
        try {
            const [offersData, messagesData] = await Promise.all([
                api.chat.getOffers(conversationId),
                api.chat.getMessages(conversationId)
            ]);
            setOffers(offersData || []);
            const userId = resolveUserId();
            const formatted = (messagesData || []).map((m: any) => {
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
                    isMeeting: isMeeting,
                    isBlurred: !!m.isBlurred
                };
            });
            setMessages(formatted);
        } catch (e) {
            console.error(e);
        }
    }, [conversationId, resolveUserId]);

    const refreshConversationContext = useCallback(async () => {
        const stored = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
        const partnerId = activeChat?.partnerId ? String(activeChat.partnerId?._id ?? activeChat.partnerId) : '';

        if (stored.role === 'freelancer') {
            if (partnerId) {
                try {
                    const j = await api.freelancer.getActiveJobWithClientForChat(partnerId);
                    setFreelancerActiveJobForChat(j?.activeJobForNav || null);
                } catch {
                    setFreelancerActiveJobForChat(null);
                }
            } else {
                setFreelancerActiveJobForChat(null);
            }
        } else {
            setFreelancerActiveJobForChat(null);
        }

        if (!conversationId) return;
        await refreshChatMessagesAndOffers();
        api.chat.getConsultationStatus(conversationId).then(setConsultationStatus).catch(() => {});
        if (!partnerId) return;
        if (stored.role === 'freelancer') {
            api.freelancer.getMyOrders().then((orders: any[]) => {
                const pending = orders.find(
                    (o) => o.status === 'pending_approval' && String(o.buyerId?._id ?? o.buyerId) === partnerId
                );
                setPendingOrderForChat(pending || null);
            }).catch(() => setPendingOrderForChat(null));
        }
        if (stored.role === 'client') {
            api.client.getPendingWorkToApprove(partnerId).then((data: any) => {
                if (data?.order || data?.job || data?.activeJobForNav) {
                    setPendingWorkToApprove({
                        order: data.order || null,
                        job: data.job || null,
                        activeJobForNav: data.activeJobForNav || null
                    });
                } else {
                    setPendingWorkToApprove(null);
                }
            }).catch(() => setPendingWorkToApprove(null));
            api.client.getMyOrders().then((orders: any[]) => {
                const pendingPay = orders.find(
                    (o) => o.status === 'pending_payment' && String(o.sellerId?._id ?? o.sellerId) === partnerId
                );
                setPendingPaymentOrder(pendingPay || null);
                const pendingAppr = orders.find(
                    (o) => o.status === 'pending_approval' && String(o.sellerId?._id ?? o.sellerId) === partnerId
                );
                setPendingApprovalOrder(pendingAppr || null);
            }).catch(() => {
                setPendingPaymentOrder(null);
                setPendingApprovalOrder(null);
            });
        }
    }, [conversationId, activeChat, refreshChatMessagesAndOffers]);

    useEffect(() => {
        didInitialScrollRef.current = false;
    }, [conversationId]);

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

        void (async () => {
            let data: any[] = [];
            try {
                const d = await api.chat.getConversations();
                if (Array.isArray(d)) data = d;
            } catch {
                /* ignore */
            }
            const urlConversationId = searchParams.get('conversation');
            if (urlConversationId) {
                const u = String(urlConversationId).trim();
                let list = [...data];
                let foundChat = list.find(
                    (c: any) => String(c.id) === u || String(c.partnerId || '') === u
                );
                if (!foundChat && /^[0-9a-fA-F]{24}$/.test(u)) {
                    try {
                        const resolved = await api.chat.resolveChatTarget(u);
                        const pid = String(resolved.partnerId || '');
                        if (resolved.conversationId) {
                            const cid = String(resolved.conversationId);
                            foundChat = list.find((c: any) => String(c.id) === cid);
                            if (!foundChat) {
                                foundChat = {
                                    id: cid,
                                    partnerId: pid,
                                    name: resolved.name,
                                    profilePicture: resolved.profilePicture || null,
                                    lastMessage: '',
                                    isFrozen: !!resolved.isFrozen,
                                    partnerIsBusy: !!resolved.partnerIsBusy,
                                    unreadCount: 0,
                                    hasUnread: false,
                                    online: false,
                                    pendingNew: false
                                };
                                list = [foundChat, ...list.filter((c: any) => String(c.id) !== cid)];
                            }
                        } else if (resolved.isNew && pid) {
                            foundChat =
                                list.find((c: any) => String(c.partnerId) === pid && !c.pendingNew) ||
                                list.find((c: any) => c.pendingNew && String(c.partnerId) === pid);
                            if (!foundChat) {
                                foundChat = {
                                    id: `pending-${pid}`,
                                    partnerId: pid,
                                    name: resolved.name,
                                    profilePicture: resolved.profilePicture || null,
                                    lastMessage: '',
                                    isFrozen: false,
                                    partnerIsBusy: !!resolved.partnerIsBusy,
                                    unreadCount: 0,
                                    hasUnread: false,
                                    online: false,
                                    pendingNew: true
                                };
                                list = [foundChat, ...list];
                            }
                        }
                    } catch (e) {
                        console.error(e);
                    }
                }
                if (foundChat) {
                    setChats(
                        list.map((c: any) =>
                            String(c.id) === String(foundChat.id)
                                ? { ...c, unreadCount: 0, hasUnread: false }
                                : c
                        )
                    );
                    setPartnerOnline(false);
                    setActiveChat({ ...foundChat, unreadCount: 0, hasUnread: false });
                } else {
                    setChats(list);
                }
            } else {
                setChats(data);
            }
        })();

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

    // Handle payment success redirect
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const success = params.get('payment_success');
        if (!success) return;
        const conv = searchParams.get('conversation');
        window.history.replaceState({}, '', `/chat${conv ? `?conversation=${conv}` : ''}`);
        if (conversationId) {
            api.chat.getConsultationStatus(conversationId).then(setConsultationStatus).catch(() => {});
            api.chat.getOffers(conversationId).then((o: any) => setOffers(o || [])).catch(() => {});
        }
        if (success === '1') {
            const stored = JSON.parse(localStorage.getItem('user') || '{}');
            if (stored.role === 'client' && conv) {
                api.chat.getConversations().then((convs: any[]) => {
                    const c = convs.find((x: any) => x.id === conv || x.id === conversationId);
                    const partnerId = c?.partnerId ? String(c.partnerId) : null;
                    if (partnerId) {
                        api.client.getMyOrders().then((orders: any[]) => {
                            const pending = orders.find((o: any) => o.status === 'pending_payment' && String(o.sellerId?._id ?? o.sellerId) === partnerId);
                            setPendingPaymentOrder(pending || null);
                        }).catch(() => {});
                    }
                }).catch(() => {});
            }
        }
        showModal({
            title: 'Payment Successful',
            message: success === 'consultation'
                ? 'Consultation paid! Click the video call button again to schedule your meeting.'
                : 'Order created successfully! Payment processed.',
            type: 'success'
        });
    }, [searchParams, conversationId, showModal]);

    const closeCheckout = useCallback(() => {
        setCheckoutIframeUrl(null);
        if (conversationId) {
            api.chat.getConsultationStatus(conversationId).then(setConsultationStatus).catch(() => {});
            api.chat.getOffers(conversationId).then((o: any) => setOffers(o || [])).catch(() => {});
        }
    }, [conversationId]);

    useEffect(() => {
        if (socket) {
            socket.on('message', (msg: any) => {
                const userId = resolveUserId();
                const senderId = msg.senderId?._id || msg.senderId;
                const isMine = String(senderId) === String(userId);
                const targetConversationId = String(msg.conversationId);
                const isActive = activeChat && (conversationId === targetConversationId || String(conversationId) === targetConversationId);

                // 1. Update messages list if it belongs to current active chat
                if (isActive) {
                    // Skip our own messages - we already have optimistic update and will refetch
                    if (!isMine) {
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
                            isMeeting: isMeeting,
                            isBlurred: !!msg.isBlurred
                        };
                        setMessages((prev) => {
                            if (prev.some(m => m._id === formattedMsg._id)) return prev;
                            return [...prev, formattedMsg];
                        });
                    }
                }

                // 2. Update and re-order chats list (WhatsApp style)
                setChats((prev: any[]) => {
                    const chatIndex = prev.findIndex(c => String(c.id) === targetConversationId);
                    if (chatIndex === -1) {
                        // If chat not in list, we might want to fetch it, 
                        // but for now let's just avoid re-ordering if we don't have it.
                        // Ideally, we'd Trigger a refresh of conversations.
                        api.chat.getConversations().then(setChats).catch(() => {});
                        return prev;
                    }

                    const updatedChat = { ...prev[chatIndex] };
                    if (!isActive && !isMine) {
                        updatedChat.unreadCount = Number(updatedChat.unreadCount || 0) + 1;
                        updatedChat.hasUnread = true;
                    }
                    updatedChat.lastMessage = msg.content || updatedChat.lastMessage;
                    
                    const newChats = [...prev];
                    newChats.splice(chatIndex, 1);
                    return [updatedChat, ...newChats];
                });
            });
        }
        return () => {
            if (socket) socket.off('message');
        };
    }, [socket, activeChat, conversationId, currentUser, resolveUserId, showModal]);

    // Join/leave socket room when conversation changes
    useEffect(() => {
        if (!socket || !conversationId) return;
        socket.emit('join_chat', conversationId);
        return () => {
            socket.emit('leave_chat', conversationId);
        };
    }, [socket, conversationId]);

    // Freelancer: fetch pending_approval order for this chat partner
    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        if (stored.role !== 'freelancer' || !activeChat?.partnerId || !conversationId) {
            setPendingOrderForChat(null);
            return;
        }
        const partnerId = String(activeChat.partnerId?._id ?? activeChat.partnerId);
        api.freelancer.getMyOrders().then((orders: any[]) => {
            const pending = orders.find(
                (o) => o.status === 'pending_approval' && String(o.buyerId?._id ?? o.buyerId) === partnerId
            );
            setPendingOrderForChat(pending || null);
        }).catch(() => setPendingOrderForChat(null));
    }, [conversationId, activeChat?.partnerId, activeChat?.id]);

    // Freelancer: in-progress job with this client (chat banner)
    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        if (stored.role !== 'freelancer' || !activeChat?.partnerId) {
            setFreelancerActiveJobForChat(null);
            return;
        }
        const clientId = String(activeChat.partnerId?._id ?? activeChat.partnerId);
        api.freelancer
            .getActiveJobWithClientForChat(clientId)
            .then((data: any) => setFreelancerActiveJobForChat(data?.activeJobForNav || null))
            .catch(() => setFreelancerActiveJobForChat(null));
    }, [activeChat?.partnerId, activeChat?.id]);

    // Client: fetch order/job with submitted work awaiting approval (for chat)
    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        if (stored.role !== 'client' || !activeChat?.partnerId) {
            setPendingWorkToApprove(null);
            return;
        }
        const partnerId = String(activeChat.partnerId?._id ?? activeChat.partnerId);
        api.client.getPendingWorkToApprove(partnerId).then((data: any) => {
            if (data?.order || data?.job || data?.activeJobForNav) {
                setPendingWorkToApprove({ order: data.order || null, job: data.job || null, activeJobForNav: data.activeJobForNav || null });
            } else {
                setPendingWorkToApprove(null);
            }
        }).catch(() => setPendingWorkToApprove(null));
    }, [conversationId, activeChat?.partnerId, activeChat?.id]);

    // Client: fetch pending_payment order for this chat partner (awaiting payment)
    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        if (stored.role !== 'client' || !activeChat?.partnerId) {
            setPendingPaymentOrder(null);
            return;
        }
        const partnerId = String(activeChat.partnerId?._id ?? activeChat.partnerId);
        api.client.getMyOrders().then((orders: any[]) => {
            const pending = orders.find(
                (o) => o.status === 'pending_payment' && String(o.sellerId?._id ?? o.sellerId) === partnerId
            );
            setPendingPaymentOrder(pending || null);
        }).catch(() => setPendingPaymentOrder(null));
    }, [conversationId, activeChat?.partnerId, activeChat?.id]);

    // Client: fetch pending_approval order for this chat partner (awaiting freelancer approval)
    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        if (stored.role !== 'client' || !activeChat?.partnerId) {
            setPendingApprovalOrder(null);
            return;
        }
        const partnerId = String(activeChat.partnerId?._id ?? activeChat.partnerId);
        api.client.getMyOrders().then((orders: any[]) => {
            const pending = orders.find(
                (o) => o.status === 'pending_approval' && String(o.sellerId?._id ?? o.sellerId) === partnerId
            );
            setPendingApprovalOrder(pending || null);
        }).catch(() => setPendingApprovalOrder(null));
    }, [conversationId, activeChat?.partnerId, activeChat?.id]);

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
            const pendingNew = !!activeChat.pendingNew;
            const realConvId = pendingNew ? null : String(activeChat.id);
            setTimeout(() => {
                setConversationId(realConvId);
            }, 0);

            const fetchId = messagesApiId(activeChat);
            if (fetchId) {
                api.chat.getMessages(fetchId).then((data: any) => {
                    const userId = resolveUserId();
                    const formatted = (data || []).map((m: any) => {
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
                            isMeeting: isMeeting,
                            isBlurred: !!m.isBlurred
                        };
                    });
                    setMessages(formatted);
                }).catch(console.error);
            }

            if (!pendingNew && activeChat.id) {
                const convId = String(activeChat.id);
                api.chat.getConsultationStatus(convId).then((data: any) => {
                    setConsultationStatus(data);
                }).catch(() => setConsultationStatus(null));

                api.chat.getOffers(convId).then((data: any) => {
                    setOffers(data || []);
                }).catch(console.error);
            } else {
                setConsultationStatus(null);
                setOffers([]);
            }
        } else {
            setConsultationStatus(null);
        }
    }, [activeChat, currentUser, resolveUserId]);

    const mergedFeed = useMemo(() => {
        const offerItems = (offers || []).map((o: any) => ({
            type: 'offer' as const,
            id: `offer-${o._id}`,
            sortTime: o.createdAt ? new Date(o.createdAt).getTime() : 0,
            data: o
        }));
        const msgItems = (messages || []).map((m: any, idx: number) => ({
            type: 'message' as const,
            id: m._id || `msg-${idx}`,
            sortTime: m.timestamp ? new Date(m.timestamp).getTime() : 0,
            data: m
        }));
        return [...offerItems, ...msgItems].sort((a, b) => a.sortTime - b.sortTime);
    }, [offers, messages]);

    useEffect(() => {
        if (mergedFeed.length === 0) return;
        const el = messagesScrollRef.current;
        if (!didInitialScrollRef.current) {
            if (el) {
                const snap = () => {
                    el.scrollTop = el.scrollHeight;
                };
                snap();
                requestAnimationFrame(() => {
                    snap();
                    requestAnimationFrame(snap);
                });
                didInitialScrollRef.current = true;
            }
            return;
        }
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [mergedFeed.length, conversationId, messages, offers]);

    useEffect(() => {
        if (!socket) return;
        const onCtx = (payload: { conversationId?: string }) => {
            if (payload?.conversationId && conversationId && String(payload.conversationId) !== String(conversationId)) return;
            refreshConversationContext();
        };
        socket.on('chat_context_refresh', onCtx);
        return () => {
            socket.off('chat_context_refresh', onCtx);
        };
    }, [socket, conversationId, refreshConversationContext]);

    const startVoiceRecording = useCallback(async () => {
        if (!activeChat || activeChat.isFrozen) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
            const recorder = new MediaRecorder(stream, { mimeType });
            recordingChunksRef.current = [];
            recorder.ondataavailable = (e) => { if (e.data.size) recordingChunksRef.current.push(e.data); };
            recorder.onstop = () => stream.getTracks().forEach((t) => t.stop());
            recorder.start(500);
            mediaRecorderRef.current = recorder;
            setIsRecording(true);
            setRecordingSeconds(0);
            const startAt = Date.now();
            const timer = setInterval(() => {
                const elapsed = Math.floor((Date.now() - startAt) / 1000);
                setRecordingSeconds(elapsed);
                if (elapsed >= VOICE_MAX_DURATION_SEC) {
                    clearInterval(timer);
                    recordingTimerRef.current = null;
                    stopVoiceRecordingRef.current();
                }
            }, 1000);
            recordingTimerRef.current = timer;
        } catch (err: any) {
            showModal({ title: 'Microphone Error', message: err.message || 'Could not access microphone.', type: 'error' });
        }
    }, [activeChat, showModal]);

    const stopVoiceRecording = useCallback(() => {
        const recorder = mediaRecorderRef.current;
        if (!recorder || recorder.state === 'inactive') return;
        recorder.stop();
        mediaRecorderRef.current = null;
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
        }
        const duration = recordingSeconds;
        setIsRecording(false);
        setRecordingSeconds(0);

        const chunks = recordingChunksRef.current;
        if (chunks.length === 0) return;

        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        const ext = (recorder.mimeType || '').includes('webm') ? 'webm' : 'mp4';
        const file = new File([blob], `voice-${Date.now()}.${ext}`, { type: blob.type });
        const objectUrl = URL.createObjectURL(blob);
        pendingVoiceUrlRef.current = objectUrl;
        setPendingVoiceRecording({ blob, file, durationSeconds: duration, objectUrl });
    }, [recordingSeconds]);

    const discardVoiceRecording = useCallback(() => {
        setPendingVoiceRecording((prev) => {
            if (prev) {
                URL.revokeObjectURL(prev.objectUrl);
                pendingVoiceUrlRef.current = null;
            }
            return null;
        });
    }, []);

    const sendVoiceMessage = useCallback(async () => {
        const pending = pendingVoiceRecording;
        if (!pending || !activeChat) return;

        const receiverId = activeChat.partnerId?._id ?? activeChat.partnerId;
        const userId = resolveUserId();
        if (!receiverId) {
            showModal({ title: 'Error', message: 'Cannot send voice: no recipient selected.', type: 'error' });
            return;
        }

        setSendingVoice(true);

        const optimisticMsg = {
            _id: `temp-voice-${Date.now()}`,
            text: URL.createObjectURL(pending.blob),
            sender: 'me' as const,
            senderId: userId,
            timestamp: new Date(),
            messageType: 'voice',
            isRead: false
        };
        setMessages((prev) => [...prev, optimisticMsg]);
        setPendingVoiceRecording((prev) => {
            if (prev) {
                URL.revokeObjectURL(prev.objectUrl);
                pendingVoiceUrlRef.current = null;
            }
            return null;
        });

        try {
            const url = await api.upload.file(pending.file);
            await api.chat.sendMessage({ receiverId, content: url, messageType: 'voice' });
            const data = await api.chat.getMessages(messagesApiId(activeChat));
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
                    isMeeting: isMeeting,
                    isBlurred: !!m.isBlurred
                };
            });
            setMessages(formatted);
            api.chat.getConversations().then((dataConv: any) => {
                if (Array.isArray(dataConv)) {
                    setChats(dataConv);
                    const updatedChat = dataConv.find(
                        (c: any) =>
                            String(c.partnerId) === String(receiverId) ||
                            (!activeChat.pendingNew && String(c.id) === String(activeChat.id))
                    );
                    if (updatedChat) setActiveChat({ ...updatedChat, unreadCount: 0, hasUnread: false });
                }
            }).catch(console.error);
        } catch (err: any) {
            setMessages((prev) => prev.filter((m) => m._id !== optimisticMsg._id));
            showModal({ title: 'Error', message: err.message || 'Failed to send voice message', type: 'error' });
        } finally {
            setSendingVoice(false);
        }
    }, [activeChat, pendingVoiceRecording, resolveUserId, showModal]);

    const handleChatAttachmentSelected = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (e.target) e.target.value = '';
            if (!file || !activeChat) return;

            if (activeChat.isFrozen) {
                showModal({
                    title: 'Conversation Frozen',
                    message: 'This conversation has been frozen. You cannot send attachments.',
                    type: 'error'
                });
                return;
            }
            if (activeChat.partnerIsBusy && currentUser?.role === 'client') {
                showModal({
                    title: 'Freelancer Busy',
                    message: 'This freelancer is currently busy and cannot receive messages.',
                    type: 'error'
                });
                return;
            }

            const maxBytes = 10 * 1024 * 1024;
            if (file.size > maxBytes) {
                showModal({ title: 'File too large', message: 'Attachments must be 10MB or smaller.', type: 'error' });
                return;
            }
            const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
            const isImage = file.type.startsWith('image/');
            if (!isPdf && !isImage) {
                showModal({ title: 'Invalid file', message: 'Only PDF and image files can be sent in chat.', type: 'error' });
                return;
            }

            const receiverId = activeChat.partnerId?._id ?? activeChat.partnerId;
            const userId = resolveUserId();
            if (!receiverId) {
                showModal({ title: 'Error', message: 'Cannot send attachment: no recipient selected.', type: 'error' });
                return;
            }

            setSendingChatFile(true);
            try {
                const url = await api.upload.chatFile(file);
                await api.chat.sendMessage({ receiverId, content: url, messageType: 'file' });
                const data = await api.chat.getMessages(messagesApiId(activeChat));
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
                        isMeeting: isMeeting,
                        isBlurred: !!m.isBlurred
                    };
                });
                setMessages(formatted);
                api.chat.getConversations().then((dataConv: any) => {
                    if (Array.isArray(dataConv)) {
                        setChats(dataConv);
                        const updatedChat = dataConv.find(
                            (c: any) =>
                                String(c.partnerId) === String(receiverId) ||
                                (!activeChat.pendingNew && String(c.id) === String(activeChat.id))
                        );
                        if (updatedChat) setActiveChat({ ...updatedChat, unreadCount: 0, hasUnread: false });
                    }
                }).catch(console.error);
            } catch (err: any) {
                console.error(err);
                showModal({ title: 'Error', message: err.message || 'Failed to send attachment', type: 'error' });
            } finally {
                setSendingChatFile(false);
            }
        },
        [activeChat, currentUser?.role, resolveUserId, showModal]
    );

    useEffect(() => {
        stopVoiceRecordingRef.current = stopVoiceRecording;
    }, [stopVoiceRecording]);

    useEffect(() => {
        return () => {
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
                recordingTimerRef.current = null;
            }
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
                mediaRecorderRef.current = null;
            }
            setIsRecording(false);
            if (pendingVoiceUrlRef.current) {
                URL.revokeObjectURL(pendingVoiceUrlRef.current);
                pendingVoiceUrlRef.current = null;
            }
        };
    }, []);

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
        // Check if freelancer is busy (clients cannot message)
        if (activeChat.partnerIsBusy && currentUser?.role === 'client') {
            showModal({
                title: 'Freelancer Busy',
                message: 'This freelancer is currently busy and cannot receive messages. Try again when they are available.',
                type: 'error'
            });
            return;
        }

        const messageContent = input;
        setInput(''); // Clear input immediately for better UX

        const receiverId = activeChat.partnerId?._id ?? activeChat.partnerId;
        if (!receiverId) {
            showModal({ title: 'Error', message: 'Cannot send message: no recipient selected.', type: 'error' });
            return;
        }

        try {
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
            const data = await api.chat.getMessages(messagesApiId(activeChat));
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
                    isMeeting: isMeeting,
                    isBlurred: !!m.isBlurred
                };
            });
            setMessages(formatted);
            
            // Refresh conversations to update isFrozen status if it changed
            api.chat.getConversations().then((data: any) => {
                if (Array.isArray(data)) {
                    setChats(data);
                    const updatedChat = data.find(
                        (c: any) =>
                            String(c.partnerId) === String(receiverId) ||
                            (!activeChat.pendingNew && String(c.id) === String(activeChat.id))
                    );
                    if (updatedChat) {
                        setActiveChat({ ...updatedChat, unreadCount: 0, hasUnread: false });
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
                        const updatedChat = data.find(
                            (c: any) =>
                                String(c.partnerId) === String(receiverId) ||
                                (!activeChat.pendingNew && String(c.id) === String(activeChat.id))
                        );
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

    const handleDeleteOffer = async (offerId: string) => {
        if (!conversationId) return;
        if (!confirm('Delete this pending offer?')) return;
        try {
            await api.chat.deleteOffer(offerId);
            const offersData = await api.chat.getOffers(conversationId);
            setOffers(offersData || []);
            showModal({ title: 'Deleted', message: 'Offer removed.', type: 'success' });
        } catch (err: any) {
            showModal({ title: 'Error', message: err.message || 'Failed to delete offer', type: 'error' });
        }
    };

    const handleDenyOffer = async (offerId: string) => {
        if (!conversationId) return;
        if (!confirm('Deny this offer? The freelancer can send a new one anytime.')) return;
        setDenyingOfferId(offerId);
        try {
            await api.chat.rejectOffer(offerId);
            const offersData = await api.chat.getOffers(conversationId);
            setOffers(offersData || []);
            showModal({ title: 'Offer denied', message: 'The freelancer can send a new offer when you’re ready.', type: 'info' });
        } catch (err: any) {
            showModal({ title: 'Error', message: err.message || 'Failed to deny offer', type: 'error' });
        } finally {
            setDenyingOfferId(null);
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
            const { deliveryDate, deliveryDays, revisions, revisionsUnlimited, milestones, whatsIncluded, price } = offerData;
            await api.chat.createOffer({
                conversationId,
                receiverId,
                price,
                whatsIncluded,
                milestones,
                revisions,
                revisionsUnlimited,
                ...(deliveryDate ? { deliveryDate } : {}),
                ...(deliveryDays != null ? { deliveryDays } : {})
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
                    isAdmin: isAdmin,
                    isBlurred: !!m.isBlurred
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

    const handleAcceptOffer = async (offer: { _id: string; price: number }) => {
        setAcceptingOfferId(offer._id);
        try {
            const result = await api.chat.acceptOffer(offer._id);

            if (result?.requiresPayment && result?.type === 'custom_offer') {
                const callbackUrl = typeof window !== 'undefined' && conversationId
                    ? `${window.location.origin}/chat?conversation=${conversationId}&payment_success=1`
                    : undefined;
                const body = {
                    type: 'custom_offer' as const,
                    amountCents: result.amountCents,
                    callbackSuccessUrl: callbackUrl,
                    offerId: result.meta?.offerId,
                    conversationId: conversationId || undefined
                };
                const paid = await payWithWalletIfPossible(body, async () => {
                    setPaymentChoiceConfig(null);
                    showModal({ title: 'Success', message: 'Order created! Payment was taken from your wallet.', type: 'success' });
                    await refreshChatMessagesAndOffers();
                    if (conversationId) {
                        api.chat.getConsultationStatus(conversationId).then(setConsultationStatus).catch(() => {});
                    }
                });
                if (!paid) {
                    setPaymentChoiceConfig(body);
                }
            } else {
                if (conversationId) {
                    const offersData = await api.chat.getOffers(conversationId);
                    setOffers(offersData || []);
                }
                showModal({ title: 'Success', message: 'Order created successfully! Payment processed.', type: 'success' });
            }
        } catch (err: any) {
            console.error(err);
            showModal({ title: 'Error', message: err.message || 'Failed to accept offer', type: 'error' });
        } finally {
            setAcceptingOfferId(null);
        }
    };

    const handleBookConsultation = () => {
        if (!activeChat || !conversationId) return;

        const token = localStorage.getItem('token');
        if (!token) {
            showModal({ title: 'Login Required', message: 'Please log in to use this feature.', type: 'info' });
            return;
        }

        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const isClient = storedUser.role === 'client';

        if (!isClient && !consultationStatus?.hasUnusedPayment && !consultationStatus?.isFree) {
            showModal({
                title: 'Consultation Payment Required',
                message: 'Ask the client to pay for a video consultation or start an active job/order to get free calls. Once paid or with an active job, either party can schedule the meeting.',
                type: 'info'
            });
            return;
        }

        setMeetingDate('');
        setMeetingTime('');
        setMeetingDuration(30);
        setShowMeetingModal(true);
    };

    const handleSetMeeting = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!conversationId || !meetingDate || !meetingTime || settingMeeting) return;

        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const isClient = storedUser.role === 'client';

        if (!isClient && !consultationStatus?.isFree && !consultationStatus?.hasUnusedPayment) {
            showModal({ title: 'Info', message: 'Ask the client to pay for a video consultation or start an active job/order to get free calls.', type: 'info' });
            return;
        }

        setSettingMeeting(true);
        try {
            const projectId = searchParams.get('projectId') || undefined;
            
            // If it's already free or has unused payment, skip paying and just create the meeting
            if (consultationStatus?.isFree || consultationStatus?.hasUnusedPayment) {
                await api.chat.createConsultationMeeting({ conversationId, meetingDate, meetingTime });
                setShowMeetingModal(false);
                api.chat.getConsultationStatus(conversationId).then(setConsultationStatus).catch(() => {});
                showModal({
                    title: 'Success',
                    message: 'Meeting scheduled! The link has been sent in the chat.',
                    type: 'success'
                });
                const messagesResp = await api.chat.getMessages(conversationId);
                const userId = resolveUserId();
                setMessages(messagesResp.map((m: any) => {
                    const sId = m.senderId?._id || m.senderId;
                    return {
                        _id: m._id,
                        text: m.content,
                        sender: String(sId) === String(userId) ? 'me' : 'them',
                        senderId: sId,
                        timestamp: m.createdAt,
                        messageType: m.messageType,
                        isRead: !!m.isRead,
                        isAdmin: m.isAdmin || m.content?.includes('[Engezhaly Admin]'),
                        isMeeting: m.messageType === 'meeting' || m.content?.includes('[Engezhaly Meeting]'),
                        isBlurred: !!m.isBlurred
                    };
                }));
                return;
            }

            const result = await api.wallet.payConsultation(conversationId, projectId, meetingDuration);

            if (result?.requiresPayment && result?.type === 'consultation') {
                setShowMeetingModal(false);
                const callbackUrl = typeof window !== 'undefined' && conversationId
                    ? `${window.location.origin}/chat?conversation=${conversationId}&payment_success=consultation`
                    : undefined;
                const body = {
                    type: 'consultation' as const,
                    amountCents: result.amountCents,
                    callbackSuccessUrl: callbackUrl,
                    conversationId: conversationId || undefined,
                    durationMinutes: meetingDuration,
                    meetingDate,
                    meetingTime,
                    ...result.meta
                };
                const paid = await payWithWalletIfPossible(body, async () => {
                    setPaymentChoiceConfig(null);
                    showModal({ title: 'Success', message: 'Consultation paid from your wallet. Your meeting is scheduled.', type: 'success' });
                    if (conversationId) {
                        api.chat.getConsultationStatus(conversationId).then(setConsultationStatus).catch(() => {});
                    }
                    const data = await api.chat.getMessages(conversationId!);
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
                            isMeeting: isMeeting,
                            isBlurred: !!m.isBlurred
                        };
                    });
                    setMessages(formatted);
                });
                if (!paid) {
                    setPaymentChoiceConfig(body);
                }
                return;
            }

            await api.chat.createConsultationMeeting({ conversationId, meetingDate, meetingTime });
            setShowMeetingModal(false);
            setConsultationStatus({ hasUnusedPayment: false });
            showModal({
                title: 'Success',
                message: result?.requiresPayment === false ? 'Consultation is free! Meeting scheduled.' : 'Meeting scheduled! The link has been sent in the chat.',
                type: 'success'
            });

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
                    isMeeting: isMeeting,
                    isBlurred: !!m.isBlurred
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
        if (currentUser?.role !== 'freelancer' || !profile || busyToggling) return;
        setBusyToggling(true);
        try {
            const newStatus = !profile?.freelancerProfile?.isBusy;
            const updated = await api.freelancer.updateProfile({ isBusy: newStatus });
            setProfile(updated);
            showModal({
                title: 'Success',
                message: `Status updated to ${newStatus ? 'Busy' : 'Available'}.\nNow your account is ${newStatus ? 'not ' : ''}visible to clients.`,
                type: 'success'
            });
        } catch (err: any) {
            console.error(err);
            showModal({
                title: 'Error',
                message: err.message || 'Failed to update status',
                type: 'error'
            });
        } finally {
            setBusyToggling(false);
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
        <div className="flex h-dvh bg-slate-50 overflow-hidden font-sans antialiased text-slate-900">
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
                    toggleBusyDisabled={busyToggling}
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
            <div className="flex-1 md:ml-64 lg:ml-72 p-0 overflow-hidden h-dvh flex flex-col">
                <DashboardMobileTopStrip />
                <div className="flex gap-0 flex-1 min-h-0 overflow-hidden">
                    {/* Conversations Sidebar */}
                    <div className={`${activeChat ? 'hidden md:flex' : 'flex'} w-full md:w-80 bg-white rounded-2xl md:rounded-3xl border border-gray-200 flex-col shadow-sm overflow-hidden shrink-0 h-full`}>
                        <div className="p-4 md:p-6 border-b border-gray-200 bg-linear-to-r from-white to-gray-50 rounded-t-2xl md:rounded-t-3xl shrink-0">
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
                                                    ? 'bg-linear-to-r from-[#09BF44]/10 to-[#09BF44]/5 border-l-4 border-l-[#09BF44]'
                                                    : 'hover:bg-gray-50'
                                                }`}
                                        >
                                            {/* Profile Picture */}
                                            <div className="relative shrink-0">
                                                {/* Gradient Background Blur */}
                                                <div className="absolute inset-0 flex items-center justify-center -z-10">
                                                    <div className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-black/40 to-transparent z-0"></div>
                                                </div>
                                                {/* Profile Picture Container */}
                                                <Avatar
                                                    src={chat.profilePicture}
                                                    name={partnerName}
                                                    size={56}
                                                    className="relative z-10 border-2 border-white shadow-md"
                                                />
                                                {(chat.id === activeChat?.id && partnerOnline) && (
                                                    <div className="absolute bottom-0 right-0 z-20 w-4 h-4 bg-[#09BF44] border-2 border-white rounded-full shadow-sm"></div>
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
                                        <div className="bg-white rounded-3xl p-8 shadow-2xl border-2 border-blue-200 max-w-md w-full mx-4 text-center">
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
                                <div className="h-16 md:h-20 border-b border-gray-200 flex items-center justify-between px-3 md:px-8 bg-white rounded-t-2xl md:rounded-t-3xl shadow-sm shrink-0">
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
                                                <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-indigo-100 to-purple-100 flex items-center justify-center shrink-0 shadow-sm border border-white/50 group-hover:scale-105 transition-transform duration-300"></div>
                                            </div>
                                            {/* Profile Picture Container */}
                                            <Avatar
                                                src={activeChat.profilePicture}
                                                name={activeChat.name}
                                                size={48}
                                                className="relative z-10 border-2 border-white shadow-md"
                                            />
                                            {partnerOnline && (
                                                <div className="absolute bottom-0 right-0 z-20 w-3 h-3 bg-[#09BF44] border-2 border-white rounded-full"></div>
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
                                    <div className="flex items-center gap-2 md:gap-4">
                                        <button
                                            onClick={() => setShowRulesModal(true)}
                                            className="flex flex-col items-center gap-0.5 p-2 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"
                                            title="Chat Rules"
                                        >
                                            <ScrollText className="w-5 h-5" />
                                            <span className="text-[10px] font-bold leading-none">Rules</span>
                                        </button>
                                        <button
                                            onClick={handleBookConsultation}
                                            className="flex flex-col items-center gap-0.5 p-2 text-[#09BF44] hover:bg-[#09BF44]/10 hover:text-[#07a63a] rounded-xl transition-colors"
                                            title="Book Consultation"
                                        >
                                            <Video className="w-5 h-5" />
                                            <span className="text-[10px] font-bold leading-none">Call</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Client: Awaiting Approval from Freelancer (after order placed) */}
                                {pendingApprovalOrder && currentUser?.role === 'client' && (
                                    <div className="mx-3 md:mx-6 mt-3 p-4 rounded-xl bg-blue-50 border-2 border-slate-200 shadow-sm animate-pulse">
                                        <p className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-blue-600" /> Awaiting Freelancer Approval
                                        </p>
                                        <p className="text-gray-600 text-[11px] leading-relaxed">
                                            Your order has been submitted. The freelancer is reviewing your requirements. You will be able to pay once they approve.
                                        </p>
                                    </div>
                                )}

                                {/* Client: Awaiting Payment - freelancer approved, client needs to pay */}
                                {pendingPaymentOrder && currentUser?.role === 'client' && (
                                    <div className="mx-3 md:mx-6 mt-3 p-4 rounded-xl bg-amber-50 border-2 border-amber-200">
                                        <p className="text-sm font-bold text-amber-800 mb-2">Awaiting Payment</p>
                                        <p className="text-gray-700 text-sm mb-2">Freelancer has approved the offer. Make sure you have described everything you want in chat, in case a conflict occurs.</p>
                                        <p className="text-gray-600 text-sm mb-3">{pendingPaymentOrder.projectId?.title || 'Offer'} • {pendingPaymentOrder.amount} EGP</p>
                                        {pendingPaymentOrder.hasPendingInstaPay ? (
                                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-amber-100 text-amber-800">
                                                <Loader2 className="w-4 h-4 animate-spin" /> Pending verification
                                            </span>
                                        ) : (
                                            <button
                                                onClick={async () => {
                                                    const totalPays = pendingPaymentOrder.amount || 0;
                                                    const amountCents = Math.round(totalPays * 100);
                                                    const callbackUrl = typeof window !== 'undefined'
                                                        ? `${window.location.origin}/chat?conversation=${conversationId}&payment_success=1`
                                                        : undefined;
                                                    const body = {
                                                        type: 'project_order' as const,
                                                        amountCents,
                                                        callbackSuccessUrl: callbackUrl,
                                                        orderId: pendingPaymentOrder._id
                                                    };
                                                    const paid = await payWithWalletIfPossible(body, async () => {
                                                        showModal({ title: 'Payment Successful', message: 'Payment deducted from your wallet balance.', type: 'success' });
                                                        if (activeChat?.partnerId) {
                                                            const partnerId = String(activeChat.partnerId?._id ?? activeChat.partnerId);
                                                            const orders = await api.client.getMyOrders();
                                                            const pending = orders.find(
                                                                (o: any) => o.status === 'pending_payment' && String(o.sellerId?._id ?? o.sellerId) === partnerId
                                                            );
                                                            setPendingPaymentOrder(pending || null);
                                                        }
                                                        await refreshChatMessagesAndOffers();
                                                    });
                                                    if (!paid) {
                                                        setPaymentChoiceConfig(body);
                                                    }
                                                }}
                                                className="px-4 py-2 rounded-xl font-bold bg-[#09BF44] text-white hover:bg-[#07a63a] text-sm"
                                            >
                                                Pay Now
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Pending order - freelancer can approve/deny from chat */}
                                {pendingOrderForChat && currentUser?.role === 'freelancer' && (
                                    <div className="mx-3 md:mx-6 mt-3 p-4 rounded-xl bg-amber-50 border-2 border-amber-200">
                                        <p className="text-sm font-bold text-amber-800 mb-2">Order pending your approval</p>
                                        <p className="text-gray-700 text-sm mb-1">{pendingOrderForChat.projectId?.title || 'Offer'} • {pendingOrderForChat.amount} EGP</p>
                                        {pendingOrderForChat.description && <p className="text-gray-600 text-xs mb-3 line-clamp-2">{pendingOrderForChat.description}</p>}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={async () => {
                                                    setPendingOrderAction('approve');
                                                    try {
                                                        await api.freelancer.approveOrder(pendingOrderForChat._id);
                                                        showModal({ title: 'Order Approved', message: 'The client has been notified to pay.', type: 'success' });
                                                        setPendingOrderForChat(null);
                                                    } catch (e: any) {
                                                        showModal({ title: 'Error', message: e.message || 'Failed to approve', type: 'error' });
                                                    } finally {
                                                        setPendingOrderAction(null);
                                                    }
                                                }}
                                                disabled={!!pendingOrderAction}
                                                className="px-4 py-2 rounded-xl font-bold bg-[#09BF44] text-white hover:bg-[#07a63a] text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                                            >
                                                {pendingOrderAction === 'approve' ? <Loader2 className="w-4 h-4 animate-spin inline" /> : null} Approve
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (!confirm('Deny this order? The client will be refunded.')) return;
                                                    setPendingOrderAction('deny');
                                                    try {
                                                        await api.freelancer.denyOrder(pendingOrderForChat._id);
                                                        showModal({ title: 'Order Denied', message: 'The client has been refunded and notified.', type: 'success' });
                                                        setPendingOrderForChat(null);
                                                    } catch (e: any) {
                                                        showModal({ title: 'Error', message: e.message || 'Failed to deny', type: 'error' });
                                                    } finally {
                                                        setPendingOrderAction(null);
                                                    }
                                                }}
                                                disabled={!!pendingOrderAction}
                                                className="px-4 py-2 rounded-xl font-bold bg-red-100 text-red-700 hover:bg-red-200 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                                            >
                                                {pendingOrderAction === 'deny' ? <Loader2 className="w-4 h-4 animate-spin inline" /> : null} Deny
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Active in-progress job — client sees link to client job; freelancer sees link to freelancer job */}
                                {pendingWorkToApprove?.activeJobForNav && currentUser?.role === 'client' && (
                                    <div className="mx-3 md:mx-6 mt-3 p-4 rounded-xl bg-blue-50 border-2 border-blue-200">
                                        <p className="text-sm font-bold text-blue-800 mb-2">You have an active job with this freelancer</p>
                                        <a
                                            href={`/dashboard/client/jobs/${pendingWorkToApprove.activeJobForNav._id}`}
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold bg-[#09BF44] text-white hover:bg-[#07a63a] text-sm"
                                        >
                                            View Job
                                        </a>
                                    </div>
                                )}
                                {freelancerActiveJobForChat && currentUser?.role === 'freelancer' && (
                                    <div className="mx-3 md:mx-6 mt-3 p-4 rounded-xl bg-blue-50 border-2 border-blue-200">
                                        <p className="text-sm font-bold text-blue-800 mb-2">You have an active job with this client</p>
                                        <a
                                            href={`/dashboard/freelancer/jobs/${freelancerActiveJobForChat._id}`}
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold bg-[#09BF44] text-white hover:bg-[#07a63a] text-sm"
                                        >
                                            View Job
                                        </a>
                                    </div>
                                )}

                                {/* Client: freelancer is busy - cannot send messages */}
                                {activeChat?.partnerIsBusy && currentUser?.role === 'client' && (
                                    <div className="mx-3 md:mx-6 mt-3 p-4 rounded-xl bg-red-50 border-2 border-red-200">
                                        <p className="text-sm font-bold text-red-800">This freelancer is busy and cannot receive messages at the moment.</p>
                                    </div>
                                )}

                                {/* Client: submitted work awaiting approval (order or job) */}
                                {pendingWorkToApprove && currentUser?.role === 'client' && (pendingWorkToApprove.order || pendingWorkToApprove.job) && (
                                    <div className="mx-3 md:mx-6 mt-3 space-y-3">
                                        {pendingWorkToApprove.order && orderHasClientVisibleDelivery(pendingWorkToApprove.order) && (
                                            <div className="p-4 rounded-xl bg-green-50 border-2 border-green-200">
                                                <p className="text-sm font-bold text-green-800 mb-2 flex items-center gap-2">
                                                    <CheckCircle className="w-4 h-4" /> Work submitted — Order
                                                </p>
                                                <p className="text-gray-700 text-sm mb-2">{pendingWorkToApprove.order.projectId?.title || 'Offer'} • {pendingWorkToApprove.order.amount} EGP</p>
                                                {pendingWorkToApprove.order.workSubmission?.message && (
                                                    <p className="text-gray-600 text-xs mb-2 line-clamp-2">{pendingWorkToApprove.order.workSubmission.message}</p>
                                                )}
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {Array.isArray(pendingWorkToApprove.order.workSubmission?.links) && pendingWorkToApprove.order.workSubmission.links.slice(0, 2).map((link: string, i: number) => (
                                                        <a key={i} href={link} target="_blank" rel="noreferrer" className="text-xs text-[#09BF44] hover:underline flex items-center gap-1">
                                                            <LinkIcon className="w-3 h-3" /> Link
                                                        </a>
                                                    ))}
                                                    {Array.isArray(pendingWorkToApprove.order.workSubmission?.files) && pendingWorkToApprove.order.workSubmission.files.length > 0 && (
                                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                                            <Paperclip className="w-3 h-3" /> {pendingWorkToApprove.order.workSubmission.files.length} file(s)
                                                        </span>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={async () => {
                                                        if (!confirm('Approve the delivered work and mark this order as completed?')) return;
                                                        try {
                                                            await api.client.approveDelivery(pendingWorkToApprove.order._id);
                                                            showModal({ title: 'Order Completed', message: 'Thank you! You can now leave a review.', type: 'success' });
                                                            setPendingWorkToApprove((p: any) => p ? { ...p, order: null } : null);
                                                        } catch (e: any) {
                                                            showModal({ title: 'Error', message: e.message || 'Failed to approve', type: 'error' });
                                                        }
                                                    }}
                                                    className="px-4 py-2 rounded-xl font-bold bg-[#09BF44] text-white hover:bg-[#07a63a] text-sm"
                                                >
                                                    Approve & Release Payment
                                                </button>
                                            </div>
                                        )}
                                        {pendingWorkToApprove.job && (
                                            <div className="p-4 rounded-xl bg-green-50 border-2 border-green-200">
                                                <p className="text-sm font-bold text-green-800 mb-2 flex items-center gap-2">
                                                    <CheckCircle className="w-4 h-4" /> Work submitted — Job
                                                </p>
                                                <p className="text-gray-700 text-sm mb-2">{pendingWorkToApprove.job.title}</p>
                                                {(() => {
                                                    const p = pendingWorkToApprove.job.proposals?.find((pr: any) => pr.status === 'accepted');
                                                    const ws = p?.workSubmission;
                                                    const hasWs =
                                                        ws &&
                                                        ((ws.message && String(ws.message).trim()) ||
                                                            (Array.isArray(ws.links) && ws.links.some(Boolean)) ||
                                                            (Array.isArray(ws.files) && ws.files.some(Boolean)));
                                                    const ms = Array.isArray(p?.milestones) ? p.milestones : [];
                                                    const milestoneDone = (m: any) => {
                                                        const note = typeof m.submissionNote === 'string' ? m.submissionNote.trim() : '';
                                                        const links = Array.isArray(m.submissionLinks) ? m.submissionLinks.filter(Boolean) : [];
                                                        const files = Array.isArray(m.submissionFiles) ? m.submissionFiles.filter(Boolean) : [];
                                                        return (
                                                            m.status === 'submitted' ||
                                                            m.status === 'done' ||
                                                            note.length > 0 ||
                                                            links.length > 0 ||
                                                            files.length > 0
                                                        );
                                                    };
                                                    const allMilestonesDelivered = ms.length > 0 && ms.every(milestoneDone);
                                                    if (hasWs) {
                                                        return (
                                                            <>
                                                                {ws.message && <p className="text-gray-600 text-xs mb-2 line-clamp-2">{ws.message}</p>}
                                                                <div className="flex flex-wrap gap-2 mb-3">
                                                                    {Array.isArray(ws.links) && ws.links.slice(0, 2).map((link: string, i: number) => (
                                                                        <a key={i} href={link} target="_blank" rel="noreferrer" className="text-xs text-[#09BF44] hover:underline flex items-center gap-1">
                                                                            <LinkIcon className="w-3 h-3" /> Link
                                                                        </a>
                                                                    ))}
                                                                    {Array.isArray(ws.files) && ws.files.length > 0 && (
                                                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                                                            <Paperclip className="w-3 h-3" /> {ws.files.length} file(s)
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </>
                                                        );
                                                    }
                                                    if (allMilestonesDelivered) {
                                                        return (
                                                            <div className="text-xs text-gray-700 mb-3 space-y-1.5">
                                                                <p className="font-bold text-gray-800">Milestone deliveries</p>
                                                                {ms.map((m: any, i: number) => {
                                                                    const links = Array.isArray(m.submissionLinks) ? m.submissionLinks.filter(Boolean) : [];
                                                                    const files = Array.isArray(m.submissionFiles) ? m.submissionFiles.filter(Boolean) : [];
                                                                    const note = typeof m.submissionNote === 'string' ? m.submissionNote.trim() : '';
                                                                    return (
                                                                        <div key={i} className="rounded-lg bg-white/80 border border-green-100 px-2 py-1.5">
                                                                            <span className="font-semibold text-gray-900">{m.name || `Milestone ${i + 1}`}</span>
                                                                            {note ? <p className="text-gray-600 line-clamp-2 mt-0.5">{note}</p> : null}
                                                                            {links[0] && (
                                                                                <a href={links[0]} target="_blank" rel="noreferrer" className="text-[#09BF44] hover:underline block truncate mt-0.5">
                                                                                    {links[0]}
                                                                                </a>
                                                                            )}
                                                                            {files.length > 0 && (
                                                                                <span className="text-gray-500 flex items-center gap-1 mt-0.5">
                                                                                    <Paperclip className="w-3 h-3" /> {files.length} file(s)
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                                <p className="text-gray-500 pt-1">Open the job page to see all links and files.</p>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                })()}
                                                <button
                                                    onClick={async () => {
                                                        if (!confirm('Approve the submitted work and mark this job as completed?')) return;
                                                        try {
                                                            const jid = pendingWorkToApprove.job._id;
                                                            await api.client.approveJobWork(jid);
                                                            setPendingWorkToApprove((p: any) => (p ? { ...p, job: null } : null));
                                                            showModal({
                                                                title: 'Job Completed',
                                                                message: 'Work approved! Leave a review on the job page.',
                                                                type: 'success'
                                                            });
                                                            router.push(`/dashboard/client/jobs/${jid}?promptReview=1`);
                                                        } catch (e: any) {
                                                            showModal({ title: 'Error', message: e.message || 'Failed to approve', type: 'error' });
                                                        }
                                                    }}
                                                    className="px-4 py-2 rounded-xl font-bold bg-[#09BF44] text-white hover:bg-[#07a63a] text-sm"
                                                >
                                                    Approve & Release Payment
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Messages and offers (merged by timestamp) */}
                                <div ref={messagesScrollRef} style={{ overflowY: 'auto', overflowX: 'hidden' }} className="flex-1 p-3 md:p-6 space-y-4 bg-linear-to-b from-gray-50 to-white rounded-b-2xl md:rounded-b-3xl min-h-0">
                                    {mergedFeed.map((item) => {
                                        if (item.type === 'offer') {
                                            const offer = item.data;
                                            const currentUserId = resolveUserId();
                                            const isMyOffer =
                                                String(offer.senderId?._id || offer.senderId) === String(currentUserId);
                                            const canRespondAsClient =
                                                currentUser?.role === 'client' &&
                                                !isMyOffer &&
                                                offer.status === 'pending';
                                            const offerActionBusy = !!acceptingOfferId || !!denyingOfferId;

                                        return (
                                                <div key={item.id} className={`flex w-full min-w-0 ${isMyOffer ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`min-w-0 p-4 rounded-2xl md:rounded-3xl shadow-md relative w-full max-w-lg md:max-w-xl border-2 ${isMyOffer
                                                        ? 'bg-emerald-700 text-white border-emerald-800'
                                                        : 'bg-emerald-50/95 border-[#09BF44]/50 text-gray-900'
                                                    }`}>
                                                    <div className="flex items-center gap-2 mb-3 w-full min-w-0">
                                                        <FileText className={`w-5 h-5 shrink-0 ${isMyOffer ? 'text-white' : 'text-[#09BF44]'}`} />
                                                        <span className={`font-bold text-base truncate ${isMyOffer ? 'text-white' : 'text-gray-900'}`}>
                                                            Custom Offer
                                                        </span>
                                                        <div className="ml-auto flex items-center gap-1 shrink-0">
                                                            {isMyOffer && offer.status === 'pending' && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteOffer(offer._id)}
                                                                    className="p-2 rounded-xl transition-colors hover:bg-white/20 text-white"
                                                                    title="Delete offer"
                                                                    aria-label="Delete offer"
                                                                >
                                                                    <Trash2 className="w-5 h-5" />
                                                                </button>
                                                            )}
                                                            {offer.status === 'accepted' && (
                                                                <CheckCircle className={`w-5 h-5 ${isMyOffer ? 'text-white' : 'text-green-600'}`} />
                                                            )}
                                                            {offer.status === 'rejected' && (
                                                                <XCircle className={`w-5 h-5 ${isMyOffer ? 'text-white' : 'text-red-600'}`} />
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className={`space-y-3 mb-4 min-w-0 ${isMyOffer ? 'text-white/95' : 'text-gray-700'}`}>
                                                        <div className={`flex items-center justify-between rounded-xl p-3 ${isMyOffer ? 'bg-white/10' : 'bg-gray-50'}`}>
                                                            <span className="text-sm font-bold shrink-0">Price:</span>
                                                            <span className="text-lg font-black truncate ml-2">{offer.price} EGP</span>
                                                        </div>
                                                        <div className="flex items-center justify-between gap-2 min-w-0">
                                                            <span className="text-sm font-bold shrink-0">Delivery:</span>
                                                                <span className="text-sm font-medium text-right break-words [overflow-wrap:anywhere]">
                                                                    {offer.deliveryDate ? formatDateDDMMYYYY(offer.deliveryDate) : (offer.deliveryDays ? `${offer.deliveryDays} days` : '—')}
                                                                </span>
                                                        </div>
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="text-sm font-bold">Revisions:</span>
                                                            <span className="text-sm font-medium">
                                                                {formatRevisionsLabel(offer.revisionsUnlimited, offer.revisions, 'short')}
                                                            </span>
                                                        </div>
                                                        <div className={`pt-3 border-t min-w-0 ${isMyOffer ? 'border-white/20' : 'border-gray-200'}`}>
                                                            <p className="text-sm font-bold mb-2">What&apos;s Included:</p>
                                                            <div className={`text-sm leading-relaxed max-h-48 overflow-y-auto break-words [overflow-wrap:anywhere] ${isMyOffer ? '' : 'text-gray-800'}`}>
                                                                {offer.whatsIncluded}
                                                            </div>
                                                        </div>
                                                        {offer.milestones && offer.milestones.length > 0 && (
                                                            <div className={`pt-3 border-t min-w-0 ${isMyOffer ? 'border-white/20' : 'border-gray-200'}`}>
                                                                <p className={`text-sm font-bold mb-1 ${isMyOffer ? '' : 'text-gray-900'}`}>Delivery milestones</p>
                                                                <p className={`text-xs mb-2 ${isMyOffer ? 'opacity-90' : 'text-gray-500'}`}>For scheduling only—payment is the total above, once.</p>
                                                                <ul className={`list-disc pl-5 space-y-1.5 text-sm min-w-0 ${isMyOffer ? 'text-white/95' : 'text-gray-800'}`}>
                                                                    {offer.milestones.map((milestone: any, idx: number) => (
                                                                        <li key={idx} className="break-words [overflow-wrap:anywhere]">
                                                                            <span className="font-bold">Milestone {idx + 1}:</span>{' '}
                                                                            {milestone.name || '—'}
                                                                            {milestone.dueDate && ` · Due ${formatDateDDMMYYYY(milestone.dueDate)}`}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {canRespondAsClient && (
                                                        <div className="flex flex-col sm:flex-row gap-2 w-full">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleAcceptOffer(offer)}
                                                                disabled={offerActionBusy}
                                                                className="flex-1 bg-[#09BF44] text-white font-bold py-3 rounded-xl hover:bg-[#07a63a] transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                                                            >
                                                                {acceptingOfferId === offer._id ? (
                                                                    <span className="inline-flex items-center justify-center gap-2">
                                                                        <Loader2 className="w-4 h-4 animate-spin" /> Processing…
                                                                    </span>
                                                                ) : (
                                                                    'Accept offer'
                                                                )}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDenyOffer(offer._id)}
                                                                disabled={offerActionBusy}
                                                                className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                                                            >
                                                                {denyingOfferId === offer._id ? (
                                                                    <span className="inline-flex items-center justify-center gap-2">
                                                                        <Loader2 className="w-4 h-4 animate-spin" /> Processing…
                                                                    </span>
                                                                ) : (
                                                                    'Deny offer'
                                                                )}
                                                            </button>
                                                        </div>
                                                    )}
                                                    {offer.status === 'accepted' && (
                                                        <div className="text-center text-sm font-bold opacity-80 py-2">
                                                            ✓ Offer Accepted
                                                        </div>
                                                    )}
                                                    {offer.status === 'rejected' && (
                                                        <div
                                                            className={
                                                                isMyOffer
                                                                    ? 'rounded-xl px-3 py-2.5 text-center text-sm font-black bg-red-600 text-white border border-red-400/80 shadow-inner'
                                                                    : 'rounded-xl px-3 py-2.5 text-center text-sm font-black bg-red-50 text-red-700 border-2 border-red-200'
                                                            }
                                                        >
                                                            Offer denied by client
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                        }

                                        const msg = item.data;
                                        const isVoice = msg.messageType === 'voice';
                                        const isFile = msg.messageType === 'file';
                                        const fileSrc = isFile ? resolveChatMediaUrl(msg.text || '') : '';
                                        const isAdmin = msg.isAdmin || msg.text?.includes('[Engezhaly Admin]');
                                        const isMeeting = msg.isMeeting || msg.messageType === 'meeting' || msg.text?.includes('[Engezhaly Meeting]');
                                        const isJobNotice = msg.text?.includes('[Engezhaly Job]');
                                        const isOrder =
                                            msg.messageType === 'order' ||
                                            msg.text?.includes('[Engezhaly Order]') ||
                                            isJobNotice;
                                        const isOfferRequest = msg.text?.includes('[Engezhaly Offer Request]');
                                        const isCentered = isAdmin || isMeeting || isOrder || isOfferRequest;
                                        let content = msg.text || '';
                                        if (isAdmin) content = content.replace('[Engezhaly Admin]', '').trim();
                                        if (isMeeting) content = content.replace('[Engezhaly Meeting]', '').trim();
                                        if (isOrder) {
                                            content = content.replace('[Engezhaly Order]', '').replace('[Engezhaly Job]', '').trim();
                                        }
                                        if (isOfferRequest) content = content.replace('[Engezhaly Offer Request]', '').trim();
                                        const linkMatch = content.match(/Join here: (https?:\/\/[^\s]+)/);
                                        const meetingLink = linkMatch ? linkMatch[1] : null;
                                        
                                        return (
                                            <div key={item.id} className={`flex w-full ${isCentered ? 'justify-center' : msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[88%] md:max-w-[70%] px-4 py-2 rounded-2xl shadow-sm ${isAdmin
                                                        ? 'bg-yellow-100 border-2 border-yellow-300 text-gray-900'
                                                        : isMeeting
                                                            ? 'bg-green-50 border-2 border-[#09BF44]/40 text-gray-900'
                                                            : isOrder || isOfferRequest
                                                                ? 'bg-blue-50 border-2 border-blue-200 text-gray-900'
                                                        : msg.sender === 'me'
                                                            ? 'bg-emerald-700 text-white border border-emerald-800 rounded-br-sm'
                                                            : 'bg-slate-100 border border-slate-200/90 text-gray-900 rounded-bl-sm'
                                                }`}>
                                                    {isOrder && (
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-xs font-bold text-blue-700">{isJobNotice ? 'Job' : 'Order'}</span>
                                                        </div>
                                                    )}
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
                                                    {isVoice ? (
                                                        <audio controls src={msg.text} className="max-w-full min-w-[200px] h-10 rounded-lg" />
                                                    ) : isFile && fileSrc ? (
                                                        <div className="space-y-2">
                                                            {chatAttachmentIsImageUrl(fileSrc) ? (
                                                                <a href={fileSrc} target="_blank" rel="noopener noreferrer" className="block">
                                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                    <img
                                                                        src={fileSrc}
                                                                        alt="Attachment"
                                                                        className={`max-h-56 max-w-full rounded-lg object-contain border ${msg.sender === 'me' ? 'border-white/25' : 'border-gray-200'}`}
                                                                    />
                                                                </a>
                                                            ) : chatAttachmentIsPdfUrl(fileSrc) ? (
                                                                <a
                                                                    href={fileSrc}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-sm border ${
                                                                        msg.sender === 'me'
                                                                            ? 'bg-white/15 hover:bg-white/25 border-white/30'
                                                                            : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-900'
                                                                    }`}
                                                                >
                                                                    <FileText className="w-4 h-4 shrink-0" />
                                                                    Open PDF
                                                                </a>
                                                            ) : (
                                                                <a
                                                                    href={fileSrc}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className={`text-sm font-bold underline break-all ${msg.sender === 'me' ? '' : 'text-[#09BF44]'}`}
                                                                >
                                                                    Open file
                                                                </a>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <p className={`text-sm md:text-base leading-relaxed break-words whitespace-pre-wrap ${msg.isBlurred ? 'blur-sm select-none' : ''}`}>{content}</p>
                                                    )}
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
                                                    <div className={`flex items-center justify-end mt-1 ${isAdmin ? 'text-yellow-700' : isMeeting ? 'text-[#09BF44]/80' : isOrder ? 'text-blue-600/80' : msg.sender === 'me' ? 'text-green-50' : 'text-gray-500'}`}>
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
                                <div className={`p-3 md:p-6 bg-white border-t border-gray-200 shadow-lg shrink-0 ${activeChat.isFrozen ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3">
                                        {/* Create Offer Button - freelancers only */}
                                        {currentUser?.role === 'freelancer' && (
                                        <button
                                            type="button"
                                            onClick={() => setShowOfferModal(true)}
                                            disabled={activeChat.isFrozen || (activeChat.partnerIsBusy && currentUser?.role === 'client')}
                                                className="flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 bg-linear-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200 rounded-xl font-bold text-emerald-600 transition-all text-sm whitespace-nowrap shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                                <FileText className="w-4 h-5" />
                                            Custom Offer
                                        </button>
                                        )}
                                        {isRecording ? (
                                            <div className="flex items-center gap-2 md:gap-3 bg-red-50 p-3 rounded-2xl border-2 border-red-200 flex-1 min-w-0">
                                                <div className="w-2 h-2 md:w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                                                <span className="text-sm font-bold text-red-700 flex-1">
                                                    Recording… {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')} / 2:00
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={stopVoiceRecording}
                                                    className="p-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all shrink-0"
                                                    aria-label="Stop recording"
                                                >
                                                    <Square className="w-4 h-4 fill-current" />
                                                </button>
                                            </div>
                                        ) : pendingVoiceRecording ? (
                                            <div className="flex items-center gap-2 md:gap-3 bg-gray-50 p-3 rounded-2xl border-2 border-gray-200 flex-1 min-w-0">
                                                <audio controls src={pendingVoiceRecording.objectUrl} className="flex-1 min-w-0 h-10 max-h-10" />
                                                <span className="text-xs text-gray-500 shrink-0">
                                                    {Math.floor(pendingVoiceRecording.durationSeconds / 60)}:{(pendingVoiceRecording.durationSeconds % 60).toString().padStart(2, '0')}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={discardVoiceRecording}
                                                    className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all shrink-0"
                                                    aria-label="Delete recording"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={sendVoiceMessage}
                                                    disabled={sendingVoice}
                                                    className="p-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all shrink-0 disabled:opacity-70 flex items-center justify-center"
                                                    aria-label="Send voice message"
                                                >
                                                    {sendingVoice ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                                </button>
                                            </div>
                                        ) : (
                                            <form onSubmit={sendMessage} className="flex items-center gap-2 md:gap-3 bg-gray-50 p-2 rounded-2xl border-2 border-gray-200 focus-within:border-[#09BF44] focus-within:ring-2 focus-within:ring-[#09BF44]/20 transition-all flex-1 min-w-0">
                                            <input
                                                ref={chatFileInputRef}
                                                type="file"
                                                accept="application/pdf,image/*"
                                                className="hidden"
                                                onChange={handleChatAttachmentSelected}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => chatFileInputRef.current?.click()}
                                                disabled={
                                                    sendingChatFile ||
                                                    activeChat.isFrozen ||
                                                    (activeChat.partnerIsBusy && currentUser?.role === 'client')
                                                }
                                                className="p-2.5 text-gray-400 hover:text-[#09BF44] hover:bg-white rounded-xl transition-all shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                                aria-label="Attach PDF or image"
                                            >
                                                {sendingChatFile ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                                            </button>
                                            <input
                                                type="text"
                                                value={input}
                                                onChange={(e) => setInput(e.target.value)}
                                                placeholder={activeChat.isFrozen ? "Conversation is frozen..." : (activeChat.partnerIsBusy && currentUser?.role === 'client') ? "Freelancer is busy..." : "Type a message..."}
                                                disabled={activeChat.isFrozen || (activeChat.partnerIsBusy && currentUser?.role === 'client')}
                                                className="flex-1 bg-transparent border-none outline-none text-gray-700 placeholder-gray-400 text-sm min-w-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                            />
                                                <button
                                                    type="button"
                                                    onClick={startVoiceRecording}
                                                    disabled={activeChat.isFrozen || (activeChat.partnerIsBusy && currentUser?.role === 'client')}
                                                    className="p-2.5 text-gray-400 hover:text-[#09BF44] hover:bg-white rounded-xl transition-all shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    aria-label="Record voice message"
                                                >
                                                    <Mic className="w-5 h-5" />
                                                </button>
                                            <button type="submit" disabled={activeChat.isFrozen || (activeChat.partnerIsBusy && currentUser?.role === 'client')} className="p-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-md shadow-emerald-100/50 hover:shadow-lg hover:shadow-emerald-200/50 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed">
                                                <Send className="w-4 h-4" />
                                            </button>
                                        </form>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center flex-col text-gray-400 bg-linear-to-br from-gray-50 to-white">
                                <div className="relative mb-6">
                                    {/* Gradient Background Blur */}
                                    <div className="absolute inset-0 flex items-center justify-center -z-10">
                                        <div className="w-32 h-32 rounded-full bg-linear-to-br from-[#09BF44]/20 via-[#09BF44]/10 to-transparent blur-2xl"></div>
                                    </div>
                                    <div className="w-24 h-24 bg-linear-to-br from-[#09BF44]/10 to-[#09BF44]/5 rounded-3xl flex items-center justify-center border-2 border-[#09BF44]/20">
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
                                <DatePicker
                                    value={meetingDate}
                                    onChange={setMeetingDate}
                                    min={new Date().toISOString().split('T')[0]}
                                    required
                                    placeholder="Select date"
                                    className="w-full"
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
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Duration</label>
                                <select
                                    value={meetingDuration}
                                    onChange={(e) => setMeetingDuration(Number(e.target.value))}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-[#09BF44] focus:ring-2 focus:ring-[#09BF44]/20 outline-none"
                                >
                                    <option value={30}>30 minutes</option>
                                    <option value={60}>60 minutes</option>
                                    <option value={90}>90 minutes</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Base price is for 30 min. Price scales with duration.</p>
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

            <PaymobCheckoutModal
                iframeUrl={checkoutIframeUrl}
                title={checkoutTitle}
                onClose={closeCheckout}
            />

            {paymentChoiceConfig && (
                <PaymentChoiceModal
                    isOpen={!!paymentChoiceConfig}
                    onClose={() => setPaymentChoiceConfig(null)}
                    paymentConfig={paymentChoiceConfig}
                    onCardPay={async () => {
                        const charge = await api.paymentMethods.initCharge({
                            type: paymentChoiceConfig.type,
                            amountCents: paymentChoiceConfig.amountCents,
                            callbackSuccessUrl: paymentChoiceConfig.callbackSuccessUrl,
                            orderId: paymentChoiceConfig.orderId,
                            offerId: paymentChoiceConfig.offerId,
                            jobId: paymentChoiceConfig.jobId,
                            proposalId: paymentChoiceConfig.proposalId,
                            conversationId: paymentChoiceConfig.conversationId,
                            durationMinutes: paymentChoiceConfig.durationMinutes,
                            meetingDate: paymentChoiceConfig.meetingDate,
                            meetingTime: paymentChoiceConfig.meetingTime
                        });
                        if (charge.paidFromWallet) {
                            setPaymentChoiceConfig(null);
                            showModal({ title: 'Payment Successful', message: 'Payment deducted from your wallet balance.', type: 'success' });
                            const t = paymentChoiceConfig.type;
                            if (t === 'custom_offer' || t === 'project_order') {
                                await refreshChatMessagesAndOffers();
                            }
                            if (t === 'project_order' && activeChat?.partnerId) {
                                const partnerId = String(activeChat.partnerId?._id ?? activeChat.partnerId);
                                const orders = await api.client.getMyOrders();
                                const pending = orders.find(
                                    (o: any) => o.status === 'pending_payment' && String(o.sellerId?._id ?? o.sellerId) === partnerId
                                );
                                setPendingPaymentOrder(pending || null);
                            }
                            if (t === 'consultation' && conversationId) {
                                api.chat.getConsultationStatus(conversationId).then(setConsultationStatus).catch(() => {});
                                const data = await api.chat.getMessages(conversationId);
                                const userId = resolveUserId();
                                setMessages(data.map((m: any) => {
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
                                        isMeeting: isMeeting,
                                        isBlurred: !!m.isBlurred
                                    };
                                }));
                            }
                            if ((t === 'custom_offer' || t === 'project_order') && conversationId) {
                                api.chat.getConsultationStatus(conversationId).then(setConsultationStatus).catch(() => {});
                            }
                            return;
                        }
                        setCheckoutTitle(paymentChoiceConfig.type === 'consultation' ? 'Pay for Video Consultation' : 'Complete Payment');
                        setCheckoutIframeUrl(charge.iframeUrl || null);
                    }}
                    onInstaPayComplete={() => {
                        closeCheckout();
                        setPaymentChoiceConfig(null);
                        if (paymentChoiceConfig.type === 'consultation') {
                            showModal({ title: 'Payment Submitted', message: 'Your payment screenshot has been submitted. Your meeting will be scheduled automatically once verified by our team.', type: 'success' });
                            if (conversationId) {
                                api.chat.getConsultationStatus(conversationId).then(setConsultationStatus).catch(() => {});
                            }
                        } else {
                            showModal({ title: 'Payment Submitted', message: 'Your payment screenshot has been submitted. We will verify and activate your order shortly.', type: 'success' });
                        }
                        if (conversationId) {
                            api.chat.getOffers(conversationId).then((o: any) => setOffers(o || [])).catch(() => {});
                        }
                    }}
                />
            )}

            <ChatRulesModal
                isOpen={showRulesModal}
                onClose={() => setShowRulesModal(false)}
            />
        </div>
    );
}

export default function ChatPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-[#09BF44]" />
            </div>
        }>
            <ChatPageContent />
        </Suspense>
    );
}
