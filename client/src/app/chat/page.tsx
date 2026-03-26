"use client";

import { Suspense, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import { Send, Video, Paperclip, FileText, CheckCircle, XCircle, MessageSquare, Shield, PanelLeft, ArrowLeft, Loader2, Mic, Square, Trash2, ScrollText, Link as LinkIcon } from 'lucide-react';
import Image from 'next/image';
import { api } from '@/lib/api';
import { formatDateDDMMYYYY } from '@/lib/utils';
import { useModal } from '@/context/ModalContext';
import CreateOfferModal from '@/components/CreateOfferModal';
import PaymobCheckoutModal from '@/components/PaymobCheckoutModal';
import PaymentChoiceModal from '@/components/PaymentChoiceModal';
import ChatRulesModal from '@/components/ChatRulesModal';
import ClientSidebar from '@/components/ClientSidebar';
import FreelancerSidebar from '@/components/FreelancerSidebar';
import DashboardMobileTopStrip from '@/components/DashboardMobileTopStrip';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

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
    const [pendingPaymentOrder, setPendingPaymentOrder] = useState<any>(null);
    const [pendingWorkToApprove, setPendingWorkToApprove] = useState<{ order?: any; job?: any; activeJobForNav?: any } | null>(null);
    const [pendingOrderAction, setPendingOrderAction] = useState<'approve' | 'deny' | null>(null);
    const [acceptingOfferId, setAcceptingOfferId] = useState<string | null>(null);
    const [busyToggling, setBusyToggling] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingSeconds, setRecordingSeconds] = useState(0);
    const [pendingVoiceRecording, setPendingVoiceRecording] = useState<{ blob: Blob; file: File; durationSeconds: number; objectUrl: string } | null>(null);
    const [sendingVoice, setSendingVoice] = useState(false);
    const [showRulesModal, setShowRulesModal] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordingChunksRef = useRef<Blob[]>([]);
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
    const stopVoiceRecordingRef = useRef<() => void | Promise<void>>(() => {});
    const pendingVoiceUrlRef = useRef<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const VOICE_MAX_DURATION_SEC = 120; // 2 minutes
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
                        isMeeting: isMeeting,
                        isBlurred: !!m.isBlurred
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
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, offers]);

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
                    isMeeting: isMeeting,
                    isBlurred: !!m.isBlurred
                };
            });
            setMessages(formatted);
        } catch (err: any) {
            setMessages((prev) => prev.filter((m) => m._id !== optimisticMsg._id));
            showModal({ title: 'Error', message: err.message || 'Failed to send voice message', type: 'error' });
        } finally {
            setSendingVoice(false);
        }
    }, [activeChat, pendingVoiceRecording, resolveUserId, showModal]);

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
                    isMeeting: isMeeting,
                    isBlurred: !!m.isBlurred
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
                        setPaymentChoiceConfig({
                            type: 'custom_offer',
                            amountCents: result.amountCents,
                            callbackSuccessUrl: callbackUrl,
                            offerId: result.meta?.offerId,
                            conversationId: conversationId || undefined
                        });
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
                setPaymentChoiceConfig({
                    type: 'consultation',
                    amountCents: result.amountCents,
                    callbackSuccessUrl: callbackUrl,
                    conversationId: conversationId || undefined,
                    durationMinutes: meetingDuration,
                    meetingDate,
                    meetingTime,
                    ...result.meta
                });
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
                                                        <div className="w-full h-full rounded-full bg-linear-to-br from-[#09BF44] to-[#07a63a] flex items-center justify-center text-white font-black text-sm">
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
                                                    <div className="w-full h-full rounded-full bg-linear-to-br from-[#09BF44] to-[#07a63a] flex items-center justify-center text-white font-black text-sm">
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
                                            onClick={() => setShowRulesModal(true)}
                                            className="p-2 hover:bg-gray-100 rounded-xl transition-colors hover:text-[#09BF44]"
                                            title="Chat Rules"
                                        >
                                            <ScrollText className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={handleBookConsultation}
                                            className="p-2 hover:bg-gray-100 rounded-xl transition-colors hover:text-[#09BF44]"
                                            title="Book Consultation"
                                        >
                                            <Video className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

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
                                                onClick={() => {
                                                    const clientFee = 20;
                                                    const totalPays = (pendingPaymentOrder.amount || 0) + clientFee;
                                                    const amountCents = Math.round(totalPays * 100);
                                                    const callbackUrl = typeof window !== 'undefined'
                                                        ? `${window.location.origin}/chat?conversation=${conversationId}&payment_success=1`
                                                        : undefined;
                                                    setPaymentChoiceConfig({
                                                        type: 'project_order',
                                                        amountCents,
                                                        callbackSuccessUrl: callbackUrl,
                                                        orderId: pendingPaymentOrder._id
                                                    });
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

                                {/* Client: active job with this freelancer - link to view */}
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

                                {/* Client: freelancer is busy - cannot send messages */}
                                {activeChat?.partnerIsBusy && currentUser?.role === 'client' && (
                                    <div className="mx-3 md:mx-6 mt-3 p-4 rounded-xl bg-red-50 border-2 border-red-200">
                                        <p className="text-sm font-bold text-red-800">This freelancer is busy and cannot receive messages at the moment.</p>
                                    </div>
                                )}

                                {/* Client: submitted work awaiting approval (order or job) */}
                                {pendingWorkToApprove && currentUser?.role === 'client' && (pendingWorkToApprove.order || pendingWorkToApprove.job) && (
                                    <div className="mx-3 md:mx-6 mt-3 space-y-3">
                                        {pendingWorkToApprove.order && (
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
                                                    Approve & Complete
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
                                                    return ws && (
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
                                                })()}
                                                <button
                                                    onClick={async () => {
                                                        if (!confirm('Approve the submitted work and mark this job as completed?')) return;
                                                        try {
                                                            await api.client.approveJobWork(pendingWorkToApprove.job._id);
                                                            showModal({ title: 'Job Completed', message: 'Work approved! Payment released to freelancer.', type: 'success' });
                                                            setPendingWorkToApprove((p: any) => p ? { ...p, job: null } : null);
                                                        } catch (e: any) {
                                                            showModal({ title: 'Error', message: e.message || 'Failed to approve', type: 'error' });
                                                        }
                                                    }}
                                                    className="px-4 py-2 rounded-xl font-bold bg-[#09BF44] text-white hover:bg-[#07a63a] text-sm"
                                                >
                                                    Approve & Complete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Messages and offers (merged by timestamp) */}
                                <div style={{ overflowY: 'auto', overflowX: 'hidden' }} className="flex-1 p-3 md:p-6 space-y-4 bg-linear-to-b from-gray-50 to-white rounded-b-2xl md:rounded-b-3xl min-h-0">
                                    {mergedFeed.map((item) => {
                                        if (item.type === 'offer') {
                                            const offer = item.data;
                                            const currentUserId = resolveUserId();
                                            const isMyOffer =
                                                String(offer.senderId?._id || offer.senderId) === String(currentUserId);
                                        const canAccept = !isMyOffer && offer.status === 'pending';

                                        return (
                                                <div key={item.id} className={`flex ${isMyOffer ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`p-4 rounded-2xl md:rounded-3xl shadow-sm relative min-w-50 max-w-[85%] md:max-w-[70%] ${isMyOffer
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
                                                            {canAccept && (
                                                                <div className="relative group shrink-0">
                                                                    + 20 EGP fee = {offer.price + 20} EGP total to pay
                                                                </div>
                                                            )}
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm font-bold">Delivery:</span>
                                                                <span className="text-sm font-medium">
                                                                    {offer.deliveryDate ? formatDateDDMMYYYY(offer.deliveryDate) : (offer.deliveryDays ? `${offer.deliveryDays} days` : '—')}
                                                                </span>
                                                        </div>
                                                        <div className="pt-3 border-t border-white/20">
                                                            <p className="text-sm font-bold mb-2">What&apos;s Included:</p>
                                                            <p className="text-sm leading-relaxed">{offer.whatsIncluded}</p>
                                                        </div>
                                                        {offer.milestones && offer.milestones.length > 0 && (
                                                            <div className="pt-3 border-t border-white/20">
                                                                <p className="text-sm font-bold mb-2">Milestones:</p>
                                                                {offer.milestones.map((milestone: any, idx: number) => (
                                                                    <div key={idx} className="text-xs mb-1.5 flex items-center gap-1">
                                                                        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-indigo-100/50 shadow-lg border border-white/20"></div>
                                                                        {milestone.name}: {milestone.price} EGP
                                                                            {milestone.dueDate && ` (Due: ${formatDateDDMMYYYY(milestone.dueDate)})`}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {canAccept && (
                                                        <button
                                                                onClick={() => handleAcceptOffer(offer)}
                                                            disabled={!!acceptingOfferId}
                                                            className="w-full bg-white text-[#09BF44] font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
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
                                        }

                                        const msg = item.data;
                                        const isVoice = msg.messageType === 'voice';
                                        const isAdmin = msg.isAdmin || msg.text?.includes('[Engezhaly Admin]');
                                        const isMeeting = msg.isMeeting || msg.messageType === 'meeting' || msg.text?.includes('[Engezhaly Meeting]');
                                        const isOrder = msg.messageType === 'order' || msg.text?.includes('[Engezhaly Order]');
                                        const isCentered = isAdmin || isMeeting || isOrder;
                                        let content = msg.text || '';
                                        if (isAdmin) content = content.replace('[Engezhaly Admin]', '').trim();
                                        if (isMeeting) content = content.replace('[Engezhaly Meeting]', '').trim();
                                        if (isOrder) content = content.replace('[Engezhaly Order]', '').trim();
                                        const linkMatch = content.match(/Join here: (https?:\/\/[^\s]+)/);
                                        const meetingLink = linkMatch ? linkMatch[1] : null;
                                        
                                        return (
                                            <div key={item.id} className={`flex w-full ${isCentered ? 'justify-center' : msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[88%] md:max-w-[70%] px-4 py-2 rounded-2xl shadow-sm ${isAdmin
                                                        ? 'bg-yellow-100 border-2 border-yellow-300 text-gray-900'
                                                        : isMeeting
                                                            ? 'bg-green-50 border-2 border-[#09BF44]/40 text-gray-900'
                                                            : isOrder
                                                                ? 'bg-blue-50 border-2 border-blue-200 text-gray-900'
                                                        : msg.sender === 'me'
                                                            ? 'bg-[#09BF44] text-white rounded-br-sm'
                                                            : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
                                                }`}>
                                                    {isOrder && (
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-xs font-bold text-blue-700">Order</span>
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
                                            <button type="button" disabled={activeChat.isFrozen || (activeChat.partnerIsBusy && currentUser?.role === 'client')} className="p-2.5 text-gray-400 hover:text-[#09BF44] hover:bg-white rounded-xl transition-all shrink-0 disabled:opacity-50 disabled:cursor-not-allowed">
                                                <Paperclip className="w-5 h-5" />
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
