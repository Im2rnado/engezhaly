"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import Image from 'next/image';
import { api } from '@/lib/api';
import { formatStatus, formatDateDDMMYYYY, formatRevisionsLabel, getOrderDeliveryDeadlineIso, orderStatusShowsDeliveryCountdown } from '@/lib/utils';
import { Check, X, Ban, User, Flag, MessageSquare, Award, BarChart3, TrendingUp, Search, Loader2, Briefcase, FileText, ShoppingBag, CreditCard, Trash2, Star, Edit, LogOut, ArrowLeft, Send, Shield, PanelLeft, Mail, Video, ArrowDownToLine, Smartphone, Megaphone, ImagePlus, AlertTriangle, UserPlus, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { MAIN_CATEGORIES } from '@/lib/categories';
import { useModal } from '@/context/ModalContext';
import EditModal from '@/components/EditModal';
import DashboardMobileTopStrip from '@/components/DashboardMobileTopStrip';
import CountdownTimer from '@/components/CountdownTimer';
import AnnouncementContent from '@/components/AnnouncementContent';
import ClientJobViewForAdmin from '@/components/ClientJobViewForAdmin';

const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://api.engezhaly.com/api').replace(/\/api$/, '');
const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/api$/, '');

const ADMIN_SEEN_KEY = 'engezhaly_admin_sidebar_seen_v1';

type AdminSeenSnapshot = {
    users: number;
    projects: number;
    disputes: number;
    transactions: number;
    emailLogs: number;
    withdrawalsPending: number;
    instapay: number;
};

function resolveMediaUrl(url: string) {
    if (!url || typeof url !== 'string') return '';
    const u = url.trim();
    if (u.startsWith('http://') || u.startsWith('https://')) return u;
    const base = API_ORIGIN || (typeof window !== 'undefined' ? window.location.origin : '');
    if (!base) return u;
    return `${base}${u.startsWith('/') ? '' : '/'}${u}`;
}

function AdminAvatarWithPresence({
    src,
    initial,
    alt = '',
    online,
    sizeClass = 'w-10 h-10',
    initialBgClass = 'bg-blue-100 text-blue-600'
}: {
    src?: string | null;
    initial: string;
    alt?: string;
    online: boolean;
    sizeClass?: string;
    initialBgClass?: string;
}) {
    const ring = 'ring-2 ring-white';
    return (
        <div className="relative shrink-0 inline-block">
            {src ? (
                <Image
                    src={resolveMediaUrl(src)}
                    alt={alt}
                    width={40}
                    height={40}
                    className={`${sizeClass} rounded-full object-cover ${ring}`}
                    unoptimized
                />
            ) : (
                <div className={`${sizeClass} rounded-full ${ring} ${initialBgClass} flex items-center justify-center text-xs font-bold`}>
                    {initial}
                </div>
            )}
            <span
                aria-hidden
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white ${online ? 'bg-[#09BF44]' : 'bg-gray-300'}`}
                title={online ? 'Online' : 'Offline'}
            />
        </div>
    );
}

function AdminChatMessageRow({ msg, selectedChat }: { msg: any; selectedChat: any }) {
    const raw = msg.content || '';
    const isVoice = msg.messageType === 'voice';
    const isFile = msg.messageType === 'file';
    const fileSrc = isFile ? resolveMediaUrl(raw) : '';
    const isAdmin = msg.isAdmin || raw.includes('[Engezhaly Admin]');
    const isMeeting = msg.isMeeting || msg.messageType === 'meeting' || raw.includes('[Engezhaly Meeting]');
    const isJobNotice = raw.includes('[Engezhaly Job]');
    const isOrder = msg.messageType === 'order' || raw.includes('[Engezhaly Order]') || isJobNotice;
    const isOfferRequest = raw.includes('[Engezhaly Offer Request]');
    const isCentered = isAdmin || isMeeting || isOrder || isOfferRequest;
    let content = raw;
    if (isAdmin) content = content.replace('[Engezhaly Admin]', '').trim();
    if (isMeeting) content = content.replace('[Engezhaly Meeting]', '').trim();
    if (isOrder) content = content.replace('[Engezhaly Order]', '').replace('[Engezhaly Job]', '').trim();
    if (isOfferRequest) content = content.replace('[Engezhaly Offer Request]', '').trim();
    const linkMatch = content.match(/Join here: (https?:\/\/[^\s]+)/);
    const meetingLink = linkMatch ? linkMatch[1] : null;
    const senderId = String(msg.senderId?._id || msg.senderId);
    const participant1Id = selectedChat.participants?.[0]?._id ? String(selectedChat.participants[0]._id) : null;
    const isFromParticipant1 = participant1Id && senderId === participant1Id;
    const voiceSrc = isVoice ? resolveMediaUrl(content) : '';

    return (
        <div className={`flex ${isCentered ? 'justify-center' : isFromParticipant1 ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[70%] px-4 py-2 rounded-2xl shadow-sm ${isAdmin
                ? 'bg-yellow-100 border-2 border-yellow-300 text-gray-900'
                : isMeeting
                    ? 'bg-green-50 border-2 border-[#09BF44]/40 text-gray-900'
                    : isOrder || isOfferRequest
                        ? 'bg-blue-50 border-2 border-blue-200 text-gray-900'
                        : isFromParticipant1
                            ? 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
                            : 'bg-[#a7f3d0] text-gray-900 rounded-br-sm'
                }`}>
                {!isCentered && (
                    <div className="flex items-center gap-1 mb-1">
                        <span className={`text-[10px] font-black uppercase ${isFromParticipant1 ? 'text-gray-400' : 'text-emerald-800'}`}>
                            {isFromParticipant1 ? (selectedChat.participants?.[0]?.firstName || 'User 1') : (selectedChat.participants?.[1]?.firstName || 'User 2')} ({isFromParticipant1 ? (selectedChat.participants?.[0]?.role || 'client') : (selectedChat.participants?.[1]?.role || 'freelancer')})
                        </span>
                    </div>
                )}
                {isOrder && (
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-blue-700">{isJobNotice ? 'Job' : 'Order'}</span>
                    </div>
                )}
                {isOfferRequest && (
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-blue-700">Offer request</span>
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
                    <audio controls src={voiceSrc} className="max-w-full min-w-[200px] h-10 rounded-lg" />
                ) : isFile && fileSrc ? (
                    <div className="space-y-2">
                        {/\.(jpe?g|png|gif|webp)(\?|$)/i.test(fileSrc) ? (
                            <a href={fileSrc} target="_blank" rel="noopener noreferrer" className="block">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={fileSrc} alt="Attachment" className="max-h-56 max-w-full rounded-lg border border-gray-200 object-contain" />
                            </a>
                        ) : /\.pdf(\?|$)/i.test(fileSrc) ? (
                            <a
                                href={fileSrc}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-sm bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-900"
                            >
                                <FileText className="w-4 h-4 shrink-0" />
                                Open PDF
                            </a>
                        ) : (
                            <a href={fileSrc} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-[#09BF44] underline break-all">
                                Open file
                            </a>
                        )}
                    </div>
                ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{content}</p>
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
                <div className={`flex items-center justify-end mt-1 ${isAdmin ? 'text-yellow-700' : isMeeting ? 'text-[#09BF44]/80' : isOrder || isOfferRequest ? 'text-blue-600/80' : isFromParticipant1 ? 'text-gray-500' : 'text-emerald-900'}`}>
                    <span className="text-[10px]">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>
        </div>
    );
}

function AdminChatMergedFeed({ messages, offers, selectedChat }: { messages: any[]; offers: any[]; selectedChat: any }) {
    const items = useMemo(() => {
        const offerItems = (offers || []).map((o: any) => ({
            type: 'offer' as const,
            id: `offer-${o._id}`,
            sortTime: o.createdAt ? new Date(o.createdAt).getTime() : 0,
            data: o
        }));
        const msgItems = (messages || []).map((m: any) => ({
            type: 'message' as const,
            id: String(m._id),
            sortTime: m.createdAt ? new Date(m.createdAt).getTime() : 0,
            data: m
        }));
        return [...offerItems, ...msgItems].sort((a, b) => a.sortTime - b.sortTime);
    }, [offers, messages]);

    if (!selectedChat) return null;

    return (
        <>
            {items.map((item) => {
                if (item.type === 'offer') {
                    const offer = item.data;
                    const from = offer.senderId;
                    const to = offer.receiverId;
                    return (
                        <div key={item.id} className="flex justify-center w-full">
                            <div className="w-full max-w-xl p-4 rounded-2xl border-2 border-[#09BF44]/25 bg-white shadow-sm">
                                <div className="flex items-center gap-2 mb-2 w-full min-w-0">
                                    <FileText className="w-5 h-5 shrink-0 text-[#09BF44]" />
                                    <span className="font-bold text-base text-gray-900 truncate">Custom offer</span>
                                    <div className="ml-auto flex items-center gap-1 shrink-0">
                                        {offer.status === 'accepted' && <CheckCircle className="w-5 h-5 text-green-600" />}
                                        {offer.status === 'rejected' && <XCircle className="w-5 h-5 text-red-600" />}
                                        {offer.status === 'pending' && (
                                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Pending</span>
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mb-3">
                                    From {from?.firstName || '—'} {from?.lastName || ''} → {to?.firstName || '—'} {to?.lastName || ''}
                                </p>
                                <div className="space-y-3 mb-2 text-gray-700 overflow-x-hidden">
                                    <div className="flex items-center justify-between rounded-xl p-3 bg-gray-50">
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
                                    <div className="pt-3 border-t border-gray-200 min-w-0">
                                        <p className="text-sm font-bold mb-2 text-gray-900">What&apos;s included:</p>
                                        <div className="text-sm leading-relaxed max-h-48 overflow-y-auto break-words [overflow-wrap:anywhere] text-gray-800">
                                            {offer.whatsIncluded}
                                        </div>
                                    </div>
                                    {offer.milestones && offer.milestones.length > 0 && (
                                        <div className="pt-3 border-t border-gray-200">
                                            <p className="text-sm font-bold mb-1 text-gray-900">Delivery milestones</p>
                                            <p className="text-xs text-gray-500 mb-2">For scheduling only—payment is the total above, once.</p>
                                            {offer.milestones.map((milestone: any, idx: number) => (
                                                <div
                                                    key={idx}
                                                    className="text-xs mb-1.5 text-gray-700 break-all overflow-wrap-anywhere min-w-0 whitespace-pre-wrap"
                                                >
                                                    <span className="break-all overflow-wrap-anywhere min-w-0">{milestone.name}</span>
                                                    {milestone.dueDate && (
                                                        <span className="break-all overflow-wrap-anywhere min-w-0">
                                                            {' '}· Due {formatDateDDMMYYYY(milestone.dueDate)}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {offer.status === 'accepted' && (
                                    <p className="text-center text-sm font-bold text-green-700 py-2">Offer accepted</p>
                                )}
                                {offer.status === 'rejected' && (
                                    <p className="text-center text-sm font-black py-2.5 rounded-xl bg-red-50 text-red-700 border-2 border-red-200">
                                        Offer denied by client
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                }
                return <AdminChatMessageRow key={item.id} msg={item.data} selectedChat={selectedChat} />;
            })}
        </>
    );
}

function UserDetailPanel({ user, onBack, onEdit, onDelete, onRefresh }: { user: any; onBack: () => void; onEdit: () => void; onDelete: () => void; onRefresh?: () => void }) {
    const { showModal } = useModal();
    const [topUpAmount, setTopUpAmount] = useState('');
    const [topUpLoading, setTopUpLoading] = useState(false);
    const [deductAmount, setDeductAmount] = useState('');
    const [deductLoading, setDeductLoading] = useState(false);
    const fp = user.freelancerProfile;
    const cp = user.clientProfile;
    const isFreelancer = user.role === 'freelancer';
    const isClient = user.role === 'client';
    const balance = user.walletBalance ?? 0;

    const handleTopUp = async () => {
        const amount = Number(topUpAmount);
        if (!Number.isFinite(amount) || amount <= 0) {
            showModal({ title: 'Invalid Amount', message: 'Please enter a positive number.', type: 'error' });
            return;
        }
        setTopUpLoading(true);
        try {
            await api.admin.topUpUserBalance(user._id, amount);
            setTopUpAmount('');
            showModal({ title: 'Success', message: `${amount} EGP added to wallet. New balance: ${balance + amount} EGP`, type: 'success' });
            onRefresh?.();
        } catch (err: any) {
            showModal({ title: 'Error', message: err.message || 'Failed to top up', type: 'error' });
        } finally {
            setTopUpLoading(false);
        }
    };

    const handleDeduct = async () => {
        const amount = Number(deductAmount);
        if (!Number.isFinite(amount) || amount <= 0) {
            showModal({ title: 'Invalid Amount', message: 'Please enter a positive number.', type: 'error' });
            return;
        }
        if (amount > balance) {
            showModal({ title: 'Invalid Amount', message: 'Deduction cannot exceed current balance.', type: 'error' });
            return;
        }
        setDeductLoading(true);
        try {
            await api.admin.deductUserBalance(user._id, amount);
            setDeductAmount('');
            showModal({ title: 'Success', message: `${amount} EGP deducted from wallet. New balance: ${Math.max(0, balance - amount)} EGP`, type: 'success' });
            onRefresh?.();
        } catch (err: any) {
            showModal({ title: 'Error', message: err.message || 'Failed to deduct', type: 'error' });
        } finally {
            setDeductLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-bold">
                    <ArrowLeft className="w-5 h-5" /> Back
                </button>
                <div className="flex gap-2">
                    <button onClick={onEdit} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl"><Edit className="w-5 h-5" /></button>
                    <button onClick={onDelete} className="p-2 text-red-600 hover:bg-red-50 rounded-xl"><Trash2 className="w-5 h-5" /></button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="flex items-center gap-6 mb-8">
                    {fp?.profilePicture ? (
                        <Image src={fp.profilePicture} alt="" width={96} height={96} className="w-24 h-24 rounded-full object-cover border-4 border-gray-100" />
                    ) : (
                        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-3xl font-bold text-gray-500">
                            {user.firstName?.[0]}
                        </div>
                    )}
                    <div>
                        <h2 className="text-2xl font-black text-gray-900">{user.firstName} {user.lastName}</h2>
                        <p className="text-gray-500">@{user.username}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${user.role === 'admin' ? 'bg-purple-100 text-purple-600' : user.role === 'freelancer' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{user.role}</span>
                            {fp?.category && <span className="px-3 py-1 bg-[#09BF44]/10 text-[#09BF44] text-sm font-bold rounded-full">{fp.category}</span>}
                            {fp?.isStudent && <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-bold rounded-full">STUDENT</span>}
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div>
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Personal Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <p className="text-xs font-bold text-gray-400 mb-1">Email</p>
                                <p className="font-medium text-gray-900">{user.email}</p>
                                {user.emailVerified === false && (
                                    <button
                                        onClick={async () => {
                                            try {
                                                await api.admin.resendVerificationEmail(user._id);
                                                showModal({ title: 'Success', message: 'Verification email resent successfully.', type: 'success' });
                                            } catch (err: any) {
                                                showModal({ title: 'Error', message: err.message || 'Failed to resend email.', type: 'error' });
                                            }
                                        }}
                                        className="mt-2 text-xs font-bold text-[#09BF44] hover:underline"
                                    >
                                        Resend Verification Email
                                    </button>
                                )}
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl"><p className="text-xs font-bold text-gray-400 mb-1">Phone</p><p className="font-medium text-gray-900">{user.phoneNumber || 'Not provided'}</p></div>
                            {(isFreelancer || user.dateOfBirth) && <div className="bg-gray-50 p-4 rounded-xl"><p className="text-xs font-bold text-gray-400 mb-1">Date of Birth</p><p className="font-medium text-gray-900">{user.dateOfBirth ? formatDateDDMMYYYY(user.dateOfBirth) : 'Not provided'}</p></div>}
                            {fp?.city && <div className="bg-gray-50 p-4 rounded-xl"><p className="text-xs font-bold text-gray-400 mb-1">City</p><p className="font-medium text-gray-900">{fp.city}</p></div>}
                            {(fp?.languages?.english || fp?.languages?.arabic) && (
                                <div className="bg-gray-50 p-4 rounded-xl">
                                    <p className="text-xs font-bold text-gray-400 mb-1">Languages</p>
                                    <p className="font-medium text-gray-900">{[fp.languages.english && `English: ${fp.languages.english}`, fp.languages.arabic && `Arabic: ${fp.languages.arabic}`].filter(Boolean).join(' • ')}</p>
                                </div>
                            )}
                            {fp?.extraLanguages?.length > 0 && <div className="bg-gray-50 p-4 rounded-xl md:col-span-2"><p className="text-xs font-bold text-gray-400 mb-1">Other Languages</p><p className="font-medium text-gray-900">{fp.extraLanguages.join(', ')}</p></div>}
                            <div className="bg-gray-50 p-4 rounded-xl"><p className="text-xs font-bold text-gray-400 mb-1">Joined</p><p className="font-medium text-gray-900">{formatDateDDMMYYYY(user.createdAt)}</p></div>
                            {user.role === 'freelancer' && <div className="bg-gray-50 p-4 rounded-xl"><p className="text-xs font-bold text-gray-400 mb-1">Status</p><p className="font-medium text-gray-900">{fp?.status === 'approved' ? 'Approved' : fp?.status === 'rejected' ? 'Rejected' : 'Pending'}</p></div>}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Wallet Balance</h4>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <p className="text-xs font-bold text-gray-400 mb-1">Current balance</p>
                            <p className="text-2xl font-black text-[#09BF44]">{balance} EGP</p>
                            <div className="flex flex-wrap items-end gap-3 mt-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Top up amount (EGP)</label>
                                    <input
                                        type="number"
                                        value={topUpAmount}
                                        onChange={(e) => setTopUpAmount(e.target.value)}
                                        placeholder="e.g. 100"
                                        className="w-32 p-2 rounded-lg border-2 border-gray-200 focus:border-[#09BF44] outline-none"
                                    />
                                </div>
                                <button
                                    onClick={handleTopUp}
                                    disabled={topUpLoading}
                                    className="px-4 py-2 bg-[#09BF44] hover:bg-[#07a63a] text-white font-bold rounded-lg disabled:opacity-70 flex items-center gap-2"
                                >
                                    {topUpLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Top Up
                                </button>
                                <div className="h-8 w-px bg-gray-200 hidden sm:block" aria-hidden />
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Deduct amount (EGP)</label>
                                    <input
                                        type="number"
                                        value={deductAmount}
                                        onChange={(e) => setDeductAmount(e.target.value)}
                                        placeholder="e.g. 50"
                                        className="w-32 p-2 rounded-lg border-2 border-gray-200 focus:border-red-400 outline-none"
                                    />
                                </div>
                                <button
                                    onClick={handleDeduct}
                                    disabled={deductLoading}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg disabled:opacity-70 flex items-center gap-2"
                                >
                                    {deductLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Deduct
                                </button>
                            </div>
                        </div>
                    </div>

                    {isClient && cp && (
                        <div>
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Client Profile</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-xl"><p className="text-xs font-bold text-gray-400 mb-1">Business Type</p><p className="font-medium text-gray-900">{user.businessType || 'Not set'}</p></div>
                                {cp.companyName && <div className="bg-gray-50 p-4 rounded-xl"><p className="text-xs font-bold text-gray-400 mb-1">Company</p><p className="font-medium text-gray-900">{cp.companyName}</p></div>}
                                {cp.position && <div className="bg-gray-50 p-4 rounded-xl"><p className="text-xs font-bold text-gray-400 mb-1">Position</p><p className="font-medium text-gray-900">{cp.position}</p></div>}
                                {cp.companyDescription && <div className="bg-gray-50 p-4 rounded-xl md:col-span-2"><p className="text-xs font-bold text-gray-400 mb-1">Description</p><p className="font-medium text-gray-900">{cp.companyDescription}</p></div>}
                                {(cp.linkedIn || cp.instagram || cp.facebook || cp.tiktok) && (
                                    <div className="bg-gray-50 p-4 rounded-xl md:col-span-2">
                                        <p className="text-xs font-bold text-gray-400 mb-2">Social Links</p>
                                        <div className="flex flex-wrap gap-3">
                                            {cp.linkedIn && <a href={cp.linkedIn.startsWith('http') ? cp.linkedIn : `https://${cp.linkedIn}`} target="_blank" rel="noopener noreferrer" className="text-[#09BF44] hover:underline">LinkedIn</a>}
                                            {cp.instagram && <a href={cp.instagram.startsWith('http') ? cp.instagram : `https://${cp.instagram}`} target="_blank" rel="noopener noreferrer" className="text-[#09BF44] hover:underline">Instagram</a>}
                                            {cp.facebook && <a href={cp.facebook.startsWith('http') ? cp.facebook : `https://${cp.facebook}`} target="_blank" rel="noopener noreferrer" className="text-[#09BF44] hover:underline">Facebook</a>}
                                            {cp.tiktok && <a href={cp.tiktok.startsWith('http') ? cp.tiktok : `https://${cp.tiktok}`} target="_blank" rel="noopener noreferrer" className="text-[#09BF44] hover:underline">TikTok</a>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {isFreelancer && fp?.bio && (
                        <div>
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Bio</h4>
                            <p className="text-gray-700 bg-gray-50 p-4 rounded-xl leading-relaxed whitespace-pre-wrap">{fp.bio}</p>
                        </div>
                    )}

                    {isFreelancer && (
                        <>
                            <div>
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Professional Details</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-4 rounded-xl"><p className="text-xs font-bold text-gray-400 mb-1">Experience</p><p className="font-medium text-gray-900">{fp?.experienceYears != null ? `${fp.experienceYears} years` : 'Not provided'}</p></div>
                                    <div className="bg-gray-50 p-4 rounded-xl"><p className="text-xs font-bold text-gray-400 mb-1">Student</p><p className="font-medium text-gray-900">{fp?.isStudent ? 'Yes' : 'No'}</p></div>
                                    {fp?.cvUrl && (
                                        <div className="bg-gray-50 p-4 rounded-xl md:col-span-2">
                                            <p className="text-xs font-bold text-gray-400 mb-1">CV (admin only, not public)</p>
                                            <a href={`${fp.cvUrl}?token=${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`} target="_blank" rel="noopener noreferrer" className="text-[#09BF44] hover:underline font-medium flex items-center gap-1">
                                                <FileText className="w-4 h-4" /> View CV
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {fp?.surveyResponses && (fp.surveyResponses.disagreementHandling || fp.surveyResponses.hoursPerDay || fp.surveyResponses.clientUpdates || fp.surveyResponses.biggestChallenge || fp.surveyResponses.discoverySource) && (
                                <div>
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Survey Responses</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {fp.surveyResponses.disagreementHandling && <div className="bg-gray-50 p-4 rounded-xl"><p className="text-xs font-bold text-gray-400 mb-1">Disagreement handling</p><p className="font-medium text-gray-900">{fp.surveyResponses.disagreementHandling}</p></div>}
                                        {fp.surveyResponses.hoursPerDay && <div className="bg-gray-50 p-4 rounded-xl"><p className="text-xs font-bold text-gray-400 mb-1">Hours per day</p><p className="font-medium text-gray-900">{fp.surveyResponses.hoursPerDay}</p></div>}
                                        {fp.surveyResponses.clientUpdates && <div className="bg-gray-50 p-4 rounded-xl"><p className="text-xs font-bold text-gray-400 mb-1">Client updates</p><p className="font-medium text-gray-900">{fp.surveyResponses.clientUpdates}</p></div>}
                                        {fp.surveyResponses.biggestChallenge && <div className="bg-gray-50 p-4 rounded-xl"><p className="text-xs font-bold text-gray-400 mb-1">Biggest challenge</p><p className="font-medium text-gray-900">{fp.surveyResponses.biggestChallenge}</p></div>}
                                        {fp.surveyResponses.discoverySource && <div className="bg-gray-50 p-4 rounded-xl"><p className="text-xs font-bold text-gray-400 mb-1">Discovery source</p><p className="font-medium text-gray-900">{fp.surveyResponses.discoverySource}</p></div>}
                                        {fp.surveyResponses.aiUsage && <div className="bg-gray-50 p-4 rounded-xl"><p className="text-xs font-bold text-gray-400 mb-1">Uses AI in work</p><p className="font-medium text-gray-900">{fp.surveyResponses.aiUsage}</p></div>}
                                    </div>
                                </div>
                            )}

                            {((fp?.technicalSkills?.length > 0) || (fp?.softSkills?.length > 0) || (fp?.skills?.length > 0)) && (
                                <div>
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Skills</h4>
                                    {fp?.technicalSkills?.length > 0 && (
                                        <div className="mb-2">
                                            <span className="text-xs font-bold text-gray-500 uppercase">Technical: </span>
                                            <span className="flex flex-wrap gap-2">{fp.technicalSkills.map((s: string) => <span key={s} className="px-3 py-1 bg-green-600 text-white text-sm font-medium rounded-full">{s}</span>)}</span>
                                        </div>
                                    )}
                                    {fp?.softSkills?.length > 0 && (
                                        <div>
                                            <span className="text-xs font-bold text-gray-500 uppercase">Soft: </span>
                                            <span className="flex flex-wrap gap-2">{fp.softSkills.map((s: string) => <span key={s} className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-full">{s}</span>)}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {fp?.starterOffer?.title && (
                                <div>
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Starter Offer</h4>
                                    <div className="bg-gray-50 p-4 rounded-xl mb-4">
                                        <p className="font-bold text-gray-900 text-lg">{fp.starterOffer.title}</p>
                                        {fp.starterOffer.subCategory && <span className="inline-block mt-1 px-2 py-0.5 bg-[#09BF44]/10 text-[#09BF44] text-xs font-bold rounded">{fp.starterOffer.subCategory}</span>}
                                        {fp.starterOffer.description && <p className="text-gray-600 text-sm mt-2">{fp.starterOffer.description}</p>}
                                    </div>
                                    {fp.starterOffer.packages?.length > 0 && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {fp.starterOffer.packages.map((pkg: any, i: number) => (
                                                <div key={i} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                    <h5 className="font-bold text-[#09BF44] mb-2">{pkg.type}</h5>
                                                    <p className="text-gray-900 font-bold">{pkg.price} EGP</p>
                                                    <p className="text-gray-500 text-sm">{pkg.days} day delivery</p>
                                                    {pkg.features?.filter((f: string) => f?.trim()).length > 0 && <ul className="mt-2 space-y-1 text-sm">{pkg.features.filter((f: string) => f?.trim()).map((f: string, j: number) => <li key={j} className="flex gap-1"><Check className="w-4 h-4 text-[#09BF44] shrink-0" /><span>{f}</span></li>)}</ul>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {fp?.starterPricing && !fp?.starterOffer?.title && (
                                <div>
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Starter Pricing</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {(['basic', 'standard', 'premium'] as const).map((tier) => {
                                            const pkg = fp.starterPricing[tier];
                                            return pkg ? <div key={tier} className="bg-gray-50 p-4 rounded-xl"><h5 className="font-bold text-[#09BF44] capitalize">{tier}</h5><p className="font-bold">{pkg.price} EGP</p><p className="text-sm text-gray-500">{pkg.days} days</p></div> : null;
                                        })}
                                    </div>
                                </div>
                            )}

                            {fp?.portfolio?.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Portfolio</h4>
                                    <div className="space-y-3">
                                        {fp.portfolio.filter((p: any) => p?.title?.trim()).map((item: any, i: number) => (
                                            <div key={i} className="bg-gray-50 p-4 rounded-xl">
                                                <p className="font-bold text-gray-900">{item.title}</p>
                                                {item.subCategory && <span className="text-xs text-gray-500">{item.subCategory}</span>}
                                                {item.description && <p className="text-sm text-gray-600 mt-1">{item.description}</p>}
                                                {item.link && <a href={item.link.startsWith('http') ? item.link : `https://${item.link}`} target="_blank" rel="noopener noreferrer" className="text-sm text-[#09BF44] hover:underline">View →</a>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {fp?.signupNotes && (
                                <div>
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Signup Notes</h4>
                                    <p className="text-gray-700 bg-gray-50 p-4 rounded-xl whitespace-pre-wrap">{fp.signupNotes}</p>
                                </div>
                            )}

                            {user.withdrawalMethods?.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Withdrawal Methods</h4>
                                    <div className="space-y-3">
                                        {user.withdrawalMethods.map((wm: any, i: number) => (
                                            <div key={i} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                <span className="inline-block px-2 py-0.5 bg-[#09BF44]/10 text-[#09BF44] text-xs font-bold rounded capitalize">{wm.method?.replace('_', ' ')}</span>
                                                {(wm.method === 'vodafone_cash' || wm.method === 'instapay') && wm.phoneNumber && <p className="text-gray-900 font-medium mt-2">{wm.phoneNumber}</p>}
                                                {wm.method === 'bank' && (wm.accountNumber || wm.bankName) && <p className="text-gray-900 font-medium mt-2">{wm.bankName}{wm.bankName && wm.accountNumber ? ' · ' : ''}{wm.accountNumber}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Documents</h4>
                                <div className="space-y-4">
                                    <div className="bg-gray-50 p-4 rounded-xl">
                                        <p className="text-xs font-bold text-gray-400 mb-2">Government ID</p>
                                        {fp?.idDocument ? <a href={`${fp.idDocument}?token=${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline"><FileText className="w-4 h-4" /> View</a> : <p className="text-sm text-gray-400">None</p>}
                                    </div>
                                    {fp?.isStudent && fp?.universityId && (
                                        <div className="bg-gray-50 p-4 rounded-xl">
                                            <p className="text-xs font-bold text-gray-400 mb-2">University ID</p>
                                            <a href={`${fp.universityId}?token=${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline"><FileText className="w-4 h-4" /> View</a>
                                        </div>
                                    )}
                                    {fp?.certifications?.length > 0 && (
                                        <div className="space-y-2">
                                            {fp.certifications.map((c: any, i: number) => (
                                                <div key={i} className="bg-gray-50 p-4 rounded-xl flex justify-between items-center">
                                                    <span className="font-bold">{c.name}</span>
                                                    {c.documentUrl && <a href={c.documentUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline"><FileText className="w-4 h-4" /></a>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function AdminDashboard() {
    const { showModal, hideModal } = useModal();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'approvals' | 'users' | 'projects' | 'jobs' | 'orders' | 'disputes' | 'finance' | 'withdrawals' | 'instapay' | 'chats' | 'strikes' | 'rewards' | 'emails' | 'announcements'>('dashboard');

    // Data States
    const [pendingFreelancers, setPendingFreelancers] = useState<any[]>([]);
    const [activeChats, setActiveChats] = useState<any[]>([]);
    const [insights, setInsights] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [unverifiedUsers, setUnverifiedUsers] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [jobs, setJobs] = useState<any[]>([]);
    const [adminJobClientView, setAdminJobClientView] = useState<any | null>(null);
    const [adminJobClientViewLoading, setAdminJobClientViewLoading] = useState(false);
    const [orders, setOrders] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [topFreelancers, setTopFreelancers] = useState<any>(null);
    const [emailLogs, setEmailLogs] = useState<any[]>([]);
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [instaPayPending, setInstaPayPending] = useState<any[]>([]);
    const [announcements, setAnnouncements] = useState<any[]>([]);

    // Search & UI States
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResult, setSearchResult] = useState<any>(null);
    const [strikeSearchMatches, setStrikeSearchMatches] = useState<any[]>([]);
    const strikeSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [loading, setLoading] = useState(false);
    const [usersLoading, setUsersLoading] = useState(false);
    const [projectsLoading, setProjectsLoading] = useState(false);
    const [jobsLoading, setJobsLoading] = useState(false);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [financeLoading, setFinanceLoading] = useState(false);
    const [emailsLoading, setEmailsLoading] = useState(false);
    const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);
    const [instaPayLoading, setInstaPayLoading] = useState(false);
    const [instaPayActionId, setInstaPayActionId] = useState<string | null>(null);
    const [chatsLoading, setChatsLoading] = useState(false);
    const [announcementsLoading, setAnnouncementsLoading] = useState(false);
    const [editModal, setEditModal] = useState<{ isOpen: boolean; type: 'user' | 'project' | 'job' | null; data: any }>({ isOpen: false, type: null, data: null });

    // Approvals states
    const [selectedFreelancer, setSelectedFreelancer] = useState<any>(null);
    const [approvalCategoryFilter, setApprovalCategoryFilter] = useState<string>('');
    const [approvalStarredOnly, setApprovalStarredOnly] = useState(false);

    // Users tab - selected user for detail view
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [selectedUserLoading, setSelectedUserLoading] = useState(false);

    // Chats states
    const [selectedChat, setSelectedChat] = useState<any>(null);
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [chatOffers, setChatOffers] = useState<any[]>([]);
    const [adminMessageInput, setAdminMessageInput] = useState('');
    const [socket, setSocket] = useState<any>(null);
    const [userPresenceById, setUserPresenceById] = useState<Record<string, boolean>>({});
    const selectedConversationIdRef = useRef<string | null>(null);
    selectedConversationIdRef.current = selectedChat?._id ?? null;
    const adminChatMessagesScrollRef = useRef<HTMLDivElement | null>(null);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    const [financeHideManualTopUp, setFinanceHideManualTopUp] = useState(false);

    // Dispute resolution
    const [disputeModal, setDisputeModal] = useState<{ isOpen: boolean; order: any | null }>({ isOpen: false, order: null });
    const [disputeOutcome, setDisputeOutcome] = useState('');
    const [disputeResolveMode, setDisputeResolveMode] = useState<'release' | 'refund' | 'manual' | 'reopen'>('release');
    const [freelancerSplitPct, setFreelancerSplitPct] = useState(50);
    const [resolvingDispute, setResolvingDispute] = useState(false);

    // Announcements create form
    const [announcementContent, setAnnouncementContent] = useState('');
    const [announcementImageUrl, setAnnouncementImageUrl] = useState('');
    const [announcementVideoLink, setAnnouncementVideoLink] = useState('');
    const [creatingAnnouncement, setCreatingAnnouncement] = useState(false);

    const [withdrawRejectTarget, setWithdrawRejectTarget] = useState<any | null>(null);
    const [withdrawRejectReason, setWithdrawRejectReason] = useState('');

    const [disputes, setDisputes] = useState<any[]>([]);
    const [disputesLoading, setDisputesLoading] = useState(false);
    const [selectedDispute, setSelectedDispute] = useState<any | null>(null);
    const [disputeChatMessages, setDisputeChatMessages] = useState<any[]>([]);
    const [disputeChatOffers, setDisputeChatOffers] = useState<any[]>([]);
    const [disputeChatLoading, setDisputeChatLoading] = useState(false);
    const [disputeConversationId, setDisputeConversationId] = useState<string | null>(null);
    const [disputeConvoResolving, setDisputeConvoResolving] = useState(false);

    const [adminSeen, setAdminSeen] = useState<AdminSeenSnapshot | null>(null);
    const adminSeenSeedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const adminSeenCountsRef = useRef({
        users: 0,
        projects: 0,
        disputes: 0,
        transactions: 0,
        emailLogs: 0,
        withdrawalsPending: 0,
        instapay: 0
    });

    const [supportChatModalOpen, setSupportChatModalOpen] = useState(false);
    const [supportUserQuery, setSupportUserQuery] = useState('');
    const [supportUserSearchLoading, setSupportUserSearchLoading] = useState(false);
    const [supportUserPick, setSupportUserPick] = useState<any | null>(null);

    const [managementDetail, setManagementDetail] = useState<{ kind: 'project' | 'job' | 'order'; item: any } | null>(null);

    // Fetch Functions
    const fetchPending = async () => {
        try {
            const data = await api.admin.getPendingFreelancers();
            setPendingFreelancers(data);
        } catch (err) {
            console.error('Failed to fetch pending freelancers', err);
        }
    };

    const fetchChats = useCallback(async () => {
        setChatsLoading(true);
        try {
            const data = await api.admin.getActiveChats();
            setActiveChats(data);
        } catch (err) {
            console.error('Failed to fetch chats', err);
        } finally {
            setChatsLoading(false);
        }
    }, []);

    const fetchChatMessages = useCallback(async (conversationId: string) => {
        try {
            const data = await api.chat.getMessages(conversationId);
            const formatted = (data || []).map((m: any) => ({
                _id: m._id,
                content: m.content,
                senderId: m.senderId?._id || m.senderId,
                isAdmin: m.isAdmin || m.content?.includes('[Engezhaly Admin]'),
                isMeeting: m.messageType === 'meeting' || m.content?.includes('[Engezhaly Meeting]'),
                messageType: m.messageType,
                createdAt: m.createdAt
            }));
            setChatMessages(formatted);
        } catch (err) {
            console.error('Failed to fetch chat messages', err);
            showModal({ title: 'Error', message: 'Failed to load messages', type: 'error' });
            return;
        }
        try {
            const offersData = await api.admin.getChatOffers(conversationId);
            setChatOffers(Array.isArray(offersData) ? offersData : []);
        } catch (err) {
            console.error('Failed to fetch chat offers (admin)', err);
            setChatOffers([]);
        }
    }, [showModal]);

    const handleSelectChat = async (chat: any) => {
        setSelectedChat(chat);
        await fetchChatMessages(chat._id);
        try {
            await api.admin.markConversationAdminRead(chat._id);
            await fetchChats();
        } catch (e) {
            console.error(e);
        }
    };

    const handleSendAdminMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adminMessageInput.trim() || !selectedChat) return;

        try {
            const participants = selectedChat.participants || [];
            let receiverId: string | undefined;
            if (selectedChat.kind === 'support' && participants.length >= 2) {
                const nonTeam = participants.find(
                    (p: any) => !(p?.firstName === 'Engezhaly' && p?.lastName === 'Team')
                );
                receiverId = nonTeam?._id || participants[1]?._id;
            } else if (participants.length >= 2) {
                receiverId = participants[1]._id;
            } else {
                receiverId = participants[0]?._id;
            }
            if (receiverId) {
                await api.admin.sendAdminMessage({
                    conversationId: selectedChat._id,
                    receiverId,
                    content: adminMessageInput
                });
            }

            setAdminMessageInput('');
            await fetchChatMessages(selectedChat._id);
            await fetchChats(); // Refresh chat list
        } catch (err: any) {
            console.error(err);
            showModal({ title: 'Error', message: err.message || 'Failed to send message', type: 'error' });
        }
    };

    const openOrderPartyChat = async (
        buyerId: string | undefined,
        sellerId: string | undefined,
        party?: { buyer?: any; seller?: any }
    ) => {
        const a = buyerId != null ? String(buyerId) : '';
        const b = sellerId != null ? String(sellerId) : '';
        if (!a || !b) {
            showModal({ title: 'Missing users', message: 'Could not resolve buyer or freelancer for this order.', type: 'error' });
            return;
        }
        try {
            const { conversationId } = await api.admin.findConversationBetweenUsers(a, b);
            if (!conversationId) {
                showModal({
                    title: 'No conversation',
                    message: 'No direct chat exists yet between this client and freelancer.',
                    type: 'error'
                });
                return;
            }
            setManagementDetail(null);
            setActiveTab('chats');
            const list = await api.admin.getActiveChats().catch(() => []);
            setActiveChats(Array.isArray(list) ? list : []);
            let chat = (Array.isArray(list) ? list : []).find((c: any) => String(c._id) === String(conversationId));
            if (!chat) {
                const buyer = party?.buyer;
                const seller = party?.seller;
                chat = {
                    _id: conversationId,
                    participants: buyer && seller ? [buyer, seller] : [],
                    kind: 'direct',
                    isFrozen: false,
                    adminHasUnread: false
                };
            }
            await handleSelectChat(chat);
        } catch (e: any) {
            showModal({ title: 'Error', message: e.message || 'Failed to open chat', type: 'error' });
        }
    };

    const fetchInsights = async () => {
        try {
            const data = await api.admin.getInsights();
            setInsights(data);
        } catch (err) {
            console.error('Failed to fetch insights', err);
        }
    };

    const fetchUsers = async () => {
        setUsersLoading(true);
        try {
            const data = await api.admin.getAllUsers();
            setUsers(data);
            const unverifiedData = await api.admin.getUnverifiedUsers();
            setUnverifiedUsers(unverifiedData);
        } catch (err) {
            console.error('Failed to fetch users', err);
        } finally {
            setUsersLoading(false);
        }
    };

    const fetchProjects = async () => {
        setProjectsLoading(true);
        try {
            const data = await api.admin.getAllProjects();
            setProjects(data);
        } catch (err) {
            console.error('Failed to fetch projects', err);
        } finally {
            setProjectsLoading(false);
        }
    };

    const fetchJobs = async () => {
        setJobsLoading(true);
        try {
            const data = await api.admin.getAllJobs();
            setJobs(data);
        } catch (err) {
            console.error('Failed to fetch jobs', err);
        } finally {
            setJobsLoading(false);
        }
    };

    const fetchOrders = async () => {
        setOrdersLoading(true);
        try {
            const data = await api.admin.getAllOrders();
            setOrders(data);
        } catch (err) {
            console.error('Failed to fetch orders', err);
        } finally {
            setOrdersLoading(false);
        }
    };

    const fetchDisputes = async () => {
        setDisputesLoading(true);
        try {
            const data = await api.admin.getDisputes();
            setDisputes(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch disputes', err);
        } finally {
            setDisputesLoading(false);
        }
    };

    const fetchTransactions = async () => {
        setFinanceLoading(true);
        try {
            const data = await api.admin.getAllTransactions(financeHideManualTopUp);
            setTransactions(data);
        } catch (err) {
            console.error('Failed to fetch transactions', err);
        } finally {
            setFinanceLoading(false);
        }
    };

    const fetchTopFreelancers = async () => {
        try {
            const data = await api.admin.getTopFreelancers();
            setTopFreelancers(data);
        } catch (err) {
            console.error('Failed to fetch top freelancers', err);
        }
    };

    const fetchEmailLogs = async () => {
        setEmailsLoading(true);
        try {
            const data = await api.admin.getEmailLogs();
            setEmailLogs(data);
        } catch (err) {
            console.error('Failed to fetch email logs', err);
        } finally {
            setEmailsLoading(false);
        }
    };

    const fetchWithdrawals = async () => {
        setWithdrawalsLoading(true);
        try {
            const data = await api.admin.getWithdrawals();
            setWithdrawals(data);
        } catch (err) {
            console.error('Failed to fetch withdrawals', err);
        } finally {
            setWithdrawalsLoading(false);
        }
    };

    const fetchInstaPayPending = async (opts?: { silent?: boolean }) => {
        const silent = !!opts?.silent;
        if (!silent) setInstaPayLoading(true);
        try {
            const data = await api.admin.getInstaPayPending();
            setInstaPayPending(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch InstaPay pending', err);
        } finally {
            if (!silent) setInstaPayLoading(false);
        }
    };

    const fetchAnnouncements = async () => {
        setAnnouncementsLoading(true);
        try {
            const data = await api.announcements.admin.list();
            setAnnouncements(data || []);
        } catch (err) {
            console.error('Failed to fetch announcements', err);
        } finally {
            setAnnouncementsLoading(false);
        }
    };

    useEffect(() => {
        hideModal(); // Clear redirect loader when admin page loads
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only on mount - hideModal is stable (memoized in ModalProvider)

    useEffect(() => {
        fetchPending();
        fetchInsights();
        // Pre-fetch counts for sidebar badges
        fetchUsers();
        fetchProjects();
        fetchJobs();
        fetchOrders();
        fetchTransactions();
        fetchWithdrawals();
        fetchChats();
        fetchEmailLogs();
        fetchDisputes();
        fetchInstaPayPending({ silent: true });
    }, []);

    useEffect(() => {
        if (activeTab === 'users') fetchUsers();
        if (activeTab === 'projects') fetchProjects();
        if (activeTab === 'jobs') fetchJobs();
        if (activeTab === 'orders') fetchOrders();
        if (activeTab === 'finance') fetchTransactions();
        if (activeTab === 'withdrawals') fetchWithdrawals();
        if (activeTab === 'instapay') fetchInstaPayPending();
        if (activeTab === 'chats') fetchChats();
        if (activeTab === 'rewards') fetchTopFreelancers();
        if (activeTab === 'emails') fetchEmailLogs();
        if (activeTab === 'announcements') fetchAnnouncements();
        if (activeTab === 'disputes') fetchDisputes();
    }, [activeTab, financeHideManualTopUp]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const raw = localStorage.getItem(ADMIN_SEEN_KEY);
            if (raw) setAdminSeen(JSON.parse(raw));
        } catch {
            /* ignore */
        }
    }, []);

    adminSeenCountsRef.current = {
        users: users.length,
        projects: projects.length,
        disputes: disputes.length,
        transactions: transactions.length,
        emailLogs: emailLogs.length,
        withdrawalsPending: withdrawals.filter((w: any) => w.status === 'pending').length,
        instapay: instaPayPending.length
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (localStorage.getItem(ADMIN_SEEN_KEY)) return;
        if (adminSeenSeedTimeoutRef.current != null) return;
        adminSeenSeedTimeoutRef.current = setTimeout(() => {
            adminSeenSeedTimeoutRef.current = null;
            if (localStorage.getItem(ADMIN_SEEN_KEY)) return;
            const c = adminSeenCountsRef.current;
            const snap: AdminSeenSnapshot = {
                users: c.users,
                projects: c.projects,
                disputes: c.disputes,
                transactions: c.transactions,
                emailLogs: c.emailLogs,
                withdrawalsPending: c.withdrawalsPending,
                instapay: c.instapay
            };
            localStorage.setItem(ADMIN_SEEN_KEY, JSON.stringify(snap));
            setAdminSeen(snap);
        }, 1200);
        return () => {
            if (adminSeenSeedTimeoutRef.current != null) {
                clearTimeout(adminSeenSeedTimeoutRef.current);
                adminSeenSeedTimeoutRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        setAdminSeen((prev) => {
            if (!prev) return prev;
            const next = { ...prev };
            let changed = false;
            const wPending = withdrawals.filter((w: any) => w.status === 'pending').length;
            if (activeTab === 'users' && prev.users !== users.length) {
                next.users = users.length;
                changed = true;
            }
            if (activeTab === 'projects' && prev.projects !== projects.length) {
                next.projects = projects.length;
                changed = true;
            }
            if (activeTab === 'disputes' && prev.disputes !== disputes.length) {
                next.disputes = disputes.length;
                changed = true;
            }
            if (activeTab === 'finance' && prev.transactions !== transactions.length) {
                next.transactions = transactions.length;
                changed = true;
            }
            if (activeTab === 'emails' && prev.emailLogs !== emailLogs.length) {
                next.emailLogs = emailLogs.length;
                changed = true;
            }
            if (activeTab === 'withdrawals' && prev.withdrawalsPending !== wPending) {
                next.withdrawalsPending = wPending;
                changed = true;
            }
            if (activeTab === 'instapay' && prev.instapay !== instaPayPending.length) {
                next.instapay = instaPayPending.length;
                changed = true;
            }
            if (!changed) return prev;
            localStorage.setItem(ADMIN_SEEN_KEY, JSON.stringify(next));
            return next;
        });
    }, [
        activeTab,
        users.length,
        projects.length,
        disputes.length,
        transactions.length,
        emailLogs.length,
        withdrawals,
        instaPayPending.length
    ]);

    const activePostedJobsCount = useMemo(
        () => jobs.filter((j: any) => j.status === 'open' || j.status === 'in_progress').length,
        [jobs]
    );
    const activeAdminOrdersCount = useMemo(
        () =>
            orders.filter((o: any) =>
                ['pending_approval', 'pending_payment', 'active', 'disputed'].includes(o.status)
            ).length,
        [orders]
    );
    const adminChatsUnreadCount = useMemo(
        () => activeChats.filter((c: any) => c.adminHasUnread).length,
        [activeChats]
    );

    const newUsersCount = adminSeen ? Math.max(0, users.length - adminSeen.users) : 0;
    const newProjectsCount = adminSeen ? Math.max(0, projects.length - adminSeen.projects) : 0;
    const newDisputesCount = adminSeen ? Math.max(0, disputes.length - adminSeen.disputes) : 0;
    const newFinanceCount = adminSeen ? Math.max(0, transactions.length - adminSeen.transactions) : 0;
    const newEmailLogsCount = adminSeen ? Math.max(0, emailLogs.length - adminSeen.emailLogs) : 0;
    const pendingWithdrawals = withdrawals.filter((w: any) => w.status === 'pending').length;
    const newWithdrawalsCount = adminSeen ? Math.max(0, pendingWithdrawals - adminSeen.withdrawalsPending) : 0;
    const newInstapayCount = adminSeen ? Math.max(0, instaPayPending.length - adminSeen.instapay) : 0;

    useEffect(() => {
        let cancelled = false;
        setDisputeConversationId(null);
        if (!selectedDispute) {
            setDisputeConvoResolving(false);
            return undefined;
        }
        const rawCid = selectedDispute.conversationId;
        let cid = '';
        if (rawCid) {
            cid =
                typeof rawCid === 'object' && (rawCid as { _id?: string })._id
                    ? String((rawCid as { _id: string })._id)
                    : String(rawCid);
        }
        if (cid && cid !== 'undefined' && cid !== 'null') {
            setDisputeConversationId(cid);
            setDisputeConvoResolving(false);
            return undefined;
        }
        const buyer = selectedDispute.buyerId?._id || selectedDispute.buyerId;
        const seller = selectedDispute.sellerId?._id || selectedDispute.sellerId;
        if (!buyer || !seller) {
            setDisputeConvoResolving(false);
            return undefined;
        }
        setDisputeConvoResolving(true);
        api.admin
            .findConversationBetweenUsers(String(buyer), String(seller))
            .then(({ conversationId }) => {
                if (!cancelled && conversationId) setDisputeConversationId(String(conversationId));
            })
            .catch(() => {
                if (!cancelled) setDisputeConversationId(null);
            })
            .finally(() => {
                if (!cancelled) setDisputeConvoResolving(false);
            });
        return () => {
            cancelled = true;
        };
    }, [selectedDispute]);

    useEffect(() => {
        if (!['projects', 'jobs', 'orders'].includes(activeTab)) setManagementDetail(null);
    }, [activeTab]);

    useEffect(() => {
        if (managementDetail?.kind !== 'job' || !managementDetail.item?._id) {
            setAdminJobClientView(null);
            setAdminJobClientViewLoading(false);
            return;
        }
        const jobId = String(managementDetail.item._id);
        setAdminJobClientViewLoading(true);
        setAdminJobClientView(null);
        api.admin
            .getJobClientView(jobId)
            .then((j) => setAdminJobClientView(j))
            .catch(() => setAdminJobClientView(null))
            .finally(() => setAdminJobClientViewLoading(false));
    }, [managementDetail?.kind, managementDetail?.item?._id]);

    useEffect(() => {
        const convId = disputeConversationId;
        if (!convId) {
            setDisputeChatMessages([]);
            setDisputeChatOffers([]);
            return;
        }
        let cancelled = false;
        setDisputeChatLoading(true);
        setDisputeChatOffers([]);
        api.chat
            .getMessages(String(convId))
            .then((data: any[]) => {
                if (cancelled) return;
                const formatted = (data || []).map((m: any) => ({
                    _id: m._id,
                    content: m.content,
                    senderId: m.senderId?._id || m.senderId,
                    isAdmin: m.isAdmin || m.content?.includes('[Engezhaly Admin]'),
                    isMeeting: m.messageType === 'meeting' || m.content?.includes('[Engezhaly Meeting]'),
                    messageType: m.messageType,
                    createdAt: m.createdAt
                }));
                setDisputeChatMessages(formatted);
            })
            .catch(() => {
                if (!cancelled) setDisputeChatMessages([]);
            })
            .finally(() => {
                if (!cancelled) setDisputeChatLoading(false);
            });
        api.admin
            .getChatOffers(String(convId))
            .then((offersData: any) => {
                if (cancelled) return;
                setDisputeChatOffers(Array.isArray(offersData) ? offersData : []);
            })
            .catch((err) => {
                if (!cancelled) {
                    console.error('Failed to fetch dispute chat offers', err);
                    setDisputeChatOffers([]);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [disputeConversationId]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const token = localStorage.getItem('token') || '';
        if (!token) return;
        const newSocket = io(SOCKET_URL, {
            auth: { token },
            extraHeaders: { 'x-auth-token': token }
        });
        setSocket(newSocket);
        return () => {
            newSocket.disconnect();
        };
    }, []);

    useEffect(() => {
        if (!socket || !selectedChat?._id) return;
        const id = selectedChat._id;
        socket.emit('join_chat', id);
        return () => {
            socket.emit('leave_chat', id);
        };
    }, [socket, selectedChat?._id]);

    useEffect(() => {
        if (!socket) return;
        const formatIncoming = (msg: any) => ({
            _id: msg._id,
            content: msg.content,
            senderId: msg.senderId?._id || msg.senderId,
            isAdmin: msg.isAdmin || String(msg.content || '').includes('[Engezhaly Admin]'),
            isMeeting: msg.messageType === 'meeting' || String(msg.content || '').includes('[Engezhaly Meeting]'),
            messageType: msg.messageType,
            createdAt: msg.createdAt || new Date().toISOString()
        });
        const onMessage = (msg: any) => {
            void fetchChats();
            const conv = String(msg.conversationId || '');
            if (!selectedConversationIdRef.current || conv !== String(selectedConversationIdRef.current)) return;
            setChatMessages((prev) => {
                if (prev.some((m) => String(m._id) === String(msg._id))) return prev;
                return [...prev, formatIncoming(msg)];
            });
        };
        socket.on('message', onMessage);
        return () => {
            socket.off('message', onMessage);
        };
    }, [socket, fetchChats]);

    useEffect(() => {
        if (!socket) return;
        const onAdminChatsHint = () => {
            void fetchChats();
        };
        socket.on('admin_chats_refresh_hint', onAdminChatsHint);
        return () => {
            socket.off('admin_chats_refresh_hint', onAdminChatsHint);
        };
    }, [socket, fetchChats]);

    useEffect(() => {
        setUserPresenceById((prev) => {
            const next = { ...prev };
            for (const u of users) {
                if (u?._id != null && u.isOnline !== undefined) next[String(u._id)] = !!u.isOnline;
            }
            for (const c of activeChats) {
                for (const p of c.participants || []) {
                    if (p?._id != null && p.isOnline !== undefined) next[String(p._id)] = !!p.isOnline;
                }
            }
            return next;
        });
    }, [users, activeChats]);

    useEffect(() => {
        if (!socket) return;
        const onAdminUserPresence = (payload: { userId?: string; online?: boolean }) => {
            const id = payload?.userId != null ? String(payload.userId) : '';
            if (!id) return;
            setUserPresenceById((prev) => ({ ...prev, [id]: !!payload.online }));
        };
        socket.on('admin_user_presence', onAdminUserPresence);
        return () => {
            socket.off('admin_user_presence', onAdminUserPresence);
        };
    }, [socket]);

    useEffect(() => {
        if (!socket) return;
        const onCtx = (payload: { conversationId?: string }) => {
            const cid = selectedConversationIdRef.current;
            if (!cid || !payload?.conversationId || String(payload.conversationId) !== String(cid)) return;
            fetchChatMessages(cid);
        };
        socket.on('chat_context_refresh', onCtx);
        return () => {
            socket.off('chat_context_refresh', onCtx);
        };
    }, [socket, fetchChatMessages]);

    useEffect(() => {
        const el = adminChatMessagesScrollRef.current;
        if (!el || !selectedChat?._id || activeTab !== 'chats') return;
        el.scrollTop = el.scrollHeight;
    }, [selectedChat?._id, chatMessages, chatOffers, activeTab]);

    useEffect(() => {
        if (activeTab !== 'strikes') {
            setStrikeSearchMatches([]);
            return;
        }
        const q = searchQuery.trim();
        if (q.length < 2) {
            setStrikeSearchMatches([]);
            return;
        }
        if (strikeSearchDebounceRef.current) clearTimeout(strikeSearchDebounceRef.current);
        strikeSearchDebounceRef.current = setTimeout(async () => {
            try {
                const rows = await api.admin.searchUsersPartial(q);
                setStrikeSearchMatches(Array.isArray(rows) ? rows : []);
            } catch {
                setStrikeSearchMatches([]);
            }
        }, 320);
        return () => {
            if (strikeSearchDebounceRef.current) clearTimeout(strikeSearchDebounceRef.current);
        };
    }, [searchQuery, activeTab]);

    // Action Handlers
    const handleSearchUser = async () => {
        if (!searchQuery) return;
        setLoading(true);
        try {
            const user = await api.admin.searchUser(searchQuery);
            setSearchResult(user);
        } catch (err) {
            console.error(err);
            showModal({ title: 'Error', message: 'User not found', type: 'error' });
            setSearchResult(null);
        } finally {
            setLoading(false);
        }
    };

    const handleAddStrike = async (userId: string) => {
        try {
            await api.admin.addStrike(userId);
            showModal({ title: 'Success', message: 'Strike added successfully', type: 'success' });
            if (searchQuery) handleSearchUser();
        } catch (err) {
            console.error(err);
            showModal({ title: 'Error', message: 'Failed to add strike', type: 'error' });
        }
    };

    const handleToggleReward = async (userId: string, award: 'mostDeals' | 'topRated' | 'onTime') => {
        try {
            await api.admin.toggleFreelancerReward(userId, award);
            showModal({ title: 'Success', message: 'Reward updated.', type: 'success' });
            fetchTopFreelancers();
        } catch (err) {
            console.error(err);
            showModal({ title: 'Error', message: 'Failed to toggle reward', type: 'error' });
        }
    };

    const handleApprove = async (id: string) => {
        try {
            await api.admin.approveFreelancer(id);
            showModal({ title: 'Success', message: 'Freelancer Approved', type: 'success' });
            fetchPending();
        } catch (err) {
            console.error(err);
            showModal({ title: 'Error', message: 'Failed to approve', type: 'error' });
        }
    };

    const handleReject = (id: string) => {
        showModal({
            title: 'Confirm Rejection',
            message: 'Are you sure you want to reject and delete this freelancer?',
            type: 'confirm',
            confirmText: 'Reject',
            onConfirm: async () => {
                try {
                    await api.admin.rejectFreelancer(id);
                    setSelectedFreelancer(null);
                    showModal({ title: 'Success', message: 'Freelancer Rejected', type: 'success' });
                    fetchPending();
                } catch (err) {
                    console.error(err);
                    showModal({ title: 'Error', message: 'Failed to reject', type: 'error' });
                }
            }
        });
    };

    const handleSelectUser = async (user: any) => {
        setSelectedUserLoading(true);
        setSelectedUser(null);
        try {
            const full = await api.admin.getUserById(user._id);
            setSelectedUser(full);
        } catch {
            showModal({ title: 'Error', message: 'Failed to load user details', type: 'error' });
        } finally {
            setSelectedUserLoading(false);
        }
    };

    const openBuyerFromDisputeInUsersTab = (buyer: any) => {
        if (!buyer?._id) return;
        setSelectedDispute(null);
        setActiveTab('users');
        void handleSelectUser(buyer);
    };

    const handleEditUser = (user: any) => {
        setEditModal({
            isOpen: true,
            type: 'user',
            data: user
        });
    };

    const handleSaveUser = async (formData: any) => {
        try {
            await api.admin.updateUser(editModal.data._id, formData);
            showModal({ title: 'Success', message: 'User updated successfully', type: 'success' });
            fetchUsers();
        } catch (err) {
            console.error(err);
            showModal({ title: 'Error', message: 'Failed to update user', type: 'error' });
        }
    };

    const handleEditProject = (project: any) => {
        setEditModal({
            isOpen: true,
            type: 'project',
            data: project
        });
    };

    const handleSaveProject = async (formData: any) => {
        try {
            await api.admin.updateProject(editModal.data._id, { title: formData.title, isActive: formData.isActive === 'true' });
            showModal({ title: 'Success', message: 'Project updated successfully', type: 'success' });
            fetchProjects();
        } catch (err) {
            console.error(err);
            showModal({ title: 'Error', message: 'Failed to update project', type: 'error' });
        }
    };

    const handleEditJob = (job: any) => {
        setEditModal({
            isOpen: true,
            type: 'job',
            data: job
        });
    };

    const handleSaveJob = async (formData: any) => {
        try {
            await api.admin.updateJob(editModal.data._id, { title: formData.title, status: formData.status });
            showModal({ title: 'Success', message: 'Job updated successfully', type: 'success' });
            fetchJobs();
        } catch (err) {
            console.error(err);
            showModal({ title: 'Error', message: 'Failed to update job', type: 'error' });
        }
    };

    const handleDeleteUser = async (id: string) => {
        showModal({
            title: 'Confirm Deletion',
            message: 'Are you sure you want to permanently delete this user? This action cannot be undone.',
            type: 'confirm',
            onConfirm: async () => {
                try {
                    await api.admin.deleteUser(id);
                    showModal({ title: 'Success', message: 'User deleted successfully', type: 'success' });
                    fetchUsers();
                } catch (err) {
                    console.error(err);
                    showModal({ title: 'Error', message: 'Failed to delete user', type: 'error' });
                }
            }
        });
    };

    const handleDeleteProject = async (id: string) => {
        showModal({
            title: 'Confirm Deletion',
            message: 'Are you sure you want to permanently delete this project? This action cannot be undone.',
            type: 'confirm',
            onConfirm: async () => {
                try {
                    await api.admin.deleteProject(id);
                    showModal({ title: 'Success', message: 'Project deleted successfully', type: 'success' });
                    fetchProjects();
                } catch (err) {
                    console.error(err);
                    showModal({ title: 'Error', message: 'Failed to delete project', type: 'error' });
                }
            }
        });
    };

    const handleDeleteJob = async (id: string) => {
        showModal({
            title: 'Confirm Deletion',
            message: 'Are you sure you want to permanently delete this job? This action cannot be undone.',
            type: 'confirm',
            onConfirm: async () => {
                try {
                    await api.admin.deleteJob(id);
                    showModal({ title: 'Success', message: 'Job deleted successfully', type: 'success' });
                    fetchJobs();
                } catch (err) {
                    console.error(err);
                    showModal({ title: 'Error', message: 'Failed to delete job', type: 'error' });
                }
            }
        });
    };

    const handleDeleteOrder = async (id: string) => {
        showModal({
            title: 'Confirm Deletion',
            message: 'Are you sure you want to permanently delete this order? This action cannot be undone.',
            type: 'confirm',
            onConfirm: async () => {
                try {
                    await api.admin.deleteOrder(id);
                    showModal({ title: 'Success', message: 'Order deleted successfully', type: 'success' });
                    setManagementDetail(null);
                    fetchOrders();
                } catch (err) {
                    console.error(err);
                    showModal({ title: 'Error', message: 'Failed to delete order', type: 'error' });
                }
            }
        });
    };

    const handleFreeze = async (chatId: string) => {
        try {
            await api.admin.freezeChat(chatId);
            showModal({ title: 'Success', message: 'Chat Frozen', type: 'success' });
            fetchChats();
            if (selectedChat && selectedChat._id === chatId) {
                setSelectedChat({ ...selectedChat, isFrozen: true });
            }
        } catch (err) {
            console.error(err);
            showModal({ title: 'Error', message: 'Failed to freeze', type: 'error' });
        }
    };

    const handleUnfreeze = async (chatId: string) => {
        try {
            await api.admin.unfreezeChat(chatId);
            showModal({ title: 'Success', message: 'Chat Unfrozen', type: 'success' });
            fetchChats();
            if (selectedChat && selectedChat._id === chatId) {
                setSelectedChat({ ...selectedChat, isFrozen: false });
            }
        } catch (err) {
            console.error(err);
            showModal({ title: 'Error', message: 'Failed to unfreeze', type: 'error' });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
            {/* Sidebar */}
            <div className={`w-72 bg-white border-r border-gray-200 flex flex-col fixed h-full z-40 shadow-sm transition-transform duration-300 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
                <div className="px-8 py-4 border-b border-gray-100">
                    <div className="flex items-start justify-between">
                        <button
                            onClick={() => router.push('/')}
                            className="hover:opacity-80 transition-opacity cursor-pointer"
                        >
                            <Image
                                src="/logos/logo-green.png"
                                alt="Engezhaly"
                                width={200}
                                height={55}
                                className="h-14 -ml-1 w-auto"
                                priority
                            />
                        </button>
                        <button
                            onClick={() => setMobileSidebarOpen(false)}
                            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                            aria-label="Close sidebar"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <span className="text-xs font-bold text-gray-400 tracking-widest uppercase -mt-2 block">Admin Dashboard</span>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'dashboard' ? 'bg-[#09BF44] text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                        <BarChart3 className="w-5 h-5" /> Dashboard
                    </button>
                    <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'users' ? 'bg-[#09BF44] text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                        <User className="w-5 h-5" /> Users
                        {newUsersCount > 0 && <span className="ml-auto bg-red-600 text-white text-xs min-w-[1.25rem] h-5 px-1.5 inline-flex items-center justify-center rounded-full font-black">{newUsersCount}</span>}
                    </button>
                    <button onClick={() => setActiveTab('projects')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'projects' ? 'bg-[#09BF44] text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                        <Briefcase className="w-5 h-5" /> Offers
                        {newProjectsCount > 0 && <span className="ml-auto bg-red-600 text-white text-xs min-w-[1.25rem] h-5 px-1.5 inline-flex items-center justify-center rounded-full font-black">{newProjectsCount}</span>}
                    </button>
                    <button onClick={() => setActiveTab('jobs')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'jobs' ? 'bg-[#09BF44] text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                        <FileText className="w-5 h-5" /> Posted jobs
                        {activePostedJobsCount > 0 && <span className="ml-auto bg-red-600 text-white text-xs min-w-[1.25rem] h-5 px-1.5 inline-flex items-center justify-center rounded-full font-black">{activePostedJobsCount}</span>}
                    </button>
                    <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'orders' ? 'bg-[#09BF44] text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                        <ShoppingBag className="w-5 h-5" /> Orders
                        {activeAdminOrdersCount > 0 && <span className="ml-auto bg-red-600 text-white text-xs min-w-[1.25rem] h-5 px-1.5 inline-flex items-center justify-center rounded-full font-black">{activeAdminOrdersCount}</span>}
                    </button>
                    <button onClick={() => setActiveTab('disputes')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'disputes' ? 'bg-[#09BF44] text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                        <AlertTriangle className="w-5 h-5" /> Disputes
                        {newDisputesCount > 0 && <span className="ml-auto bg-red-600 text-white text-xs min-w-[1.25rem] h-5 px-1.5 inline-flex items-center justify-center rounded-full font-black">{newDisputesCount}</span>}
                    </button>
                    <button onClick={() => setActiveTab('finance')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'finance' ? 'bg-[#09BF44] text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                        <CreditCard className="w-5 h-5" /> Finance
                        {newFinanceCount > 0 && <span className="ml-auto bg-red-600 text-white text-xs min-w-[1.25rem] h-5 px-1.5 inline-flex items-center justify-center rounded-full font-black">{newFinanceCount}</span>}
                    </button>
                    <button onClick={() => setActiveTab('withdrawals')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'withdrawals' ? 'bg-[#09BF44] text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                        <ArrowDownToLine className="w-5 h-5" /> Withdrawals
                        {newWithdrawalsCount > 0 && <span className="ml-auto bg-red-600 text-white text-xs min-w-[1.25rem] h-5 px-1.5 inline-flex items-center justify-center rounded-full font-black">{newWithdrawalsCount}</span>}
                    </button>
                    <button onClick={() => setActiveTab('instapay')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'instapay' ? 'bg-[#09BF44] text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                        <Smartphone className="w-5 h-5" /> InstaPay Pending
                        {newInstapayCount > 0 && <span className="ml-auto bg-red-600 text-white text-xs min-w-[1.25rem] h-5 px-1.5 inline-flex items-center justify-center rounded-full font-black">{newInstapayCount}</span>}
                    </button>
                    <div className="h-px bg-gray-100 my-2"></div>
                    <button onClick={() => setActiveTab('approvals')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'approvals' ? 'bg-[#09BF44] text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                        <Check className="w-5 h-5" /> Approvals
                        {pendingFreelancers.length > 0 && <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingFreelancers.length}</span>}
                    </button>
                    <button onClick={() => setActiveTab('chats')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'chats' ? 'bg-[#09BF44] text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                        <MessageSquare className="w-5 h-5" /> Chats
                        {adminChatsUnreadCount > 0 ? (
                            <span className="ml-auto bg-red-600 text-white text-xs min-w-[1.25rem] h-5 px-1.5 inline-flex items-center justify-center rounded-full font-black">{adminChatsUnreadCount}</span>
                        ) : null}
                    </button>
                    <button onClick={() => setActiveTab('announcements')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'announcements' ? 'bg-[#09BF44] text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                        <Megaphone className="w-5 h-5" /> Announcements
                    </button>
                    <button onClick={() => setActiveTab('strikes')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'strikes' ? 'bg-[#09BF44] text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                        <Ban className="w-5 h-5" /> Strikes
                    </button>
                    <button onClick={() => setActiveTab('rewards')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'rewards' ? 'bg-[#09BF44] text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                        <Award className="w-5 h-5" /> Rewards
                    </button>
                    <button onClick={() => setActiveTab('emails')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'emails' ? 'bg-[#09BF44] text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                        <Mail className="w-5 h-5" /> Email Logs
                        {newEmailLogsCount > 0 && <span className="ml-auto bg-red-600 text-white text-xs min-w-[1.25rem] h-5 px-1.5 inline-flex items-center justify-center rounded-full font-black">{newEmailLogsCount}</span>}
                    </button>
                </nav>

                {/* Logout Button */}
                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={() => {
                            showModal({
                                title: 'Log out?',
                                message: 'Are you sure you want to log out?',
                                type: 'confirm',
                                onConfirm: () => {
                                    localStorage.removeItem('token');
                                    localStorage.removeItem('user');
                                    router.push('/');
                                }
                            });
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            </div>
            {mobileSidebarOpen && (
                <button
                    aria-label="Close sidebar overlay"
                    onClick={() => setMobileSidebarOpen(false)}
                    className="fixed inset-0 bg-black/40 z-30 md:hidden"
                />
            )}

            {/* Main Content */}
            <div className="flex-1 md:ml-72 px-4 sm:px-6 md:p-8 pt-3 md:pt-8 pb-8 overflow-y-auto min-h-screen">
                <DashboardMobileTopStrip />
                <header className="flex flex-wrap justify-between items-center gap-3 mb-7 md:mb-10">
                    <div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setMobileSidebarOpen(true)}
                                className="md:hidden p-2 rounded-lg border border-gray-200 bg-white text-gray-700"
                                aria-label="Open sidebar"
                            >
                                <PanelLeft className="w-5 h-5" />
                            </button>
                            <h2 className="text-2xl md:text-3xl font-black text-gray-900 capitalize">{activeTab}</h2>
                        </div>
                        <p className="text-sm md:text-base text-gray-500 mt-1">Manage platform operations.</p>
                    </div>
                </header>

                {activeTab === 'dashboard' && (
                    <div className="space-y-8">
                        {insights ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><User className="w-6 h-6" /></div>
                                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">+12%</span>
                                    </div>
                                    <h3 className="text-gray-500 font-bold text-sm">Total Users</h3>
                                    <p className="text-3xl font-black text-gray-900 mt-1">{insights.totalUsers}</p>
                                </div>
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-green-50 rounded-xl text-[#09BF44]"><Briefcase className="w-6 h-6" /></div>
                                    </div>
                                    <h3 className="text-gray-500 font-bold text-sm">Freelancers</h3>
                                    <p className="text-3xl font-black text-gray-900 mt-1">{insights.totalFreelancers}</p>
                                </div>
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-purple-50 rounded-xl text-purple-600"><User className="w-6 h-6" /></div>
                                    </div>
                                    <h3 className="text-gray-500 font-bold text-sm">Clients</h3>
                                    <p className="text-3xl font-black text-gray-900 mt-1">{insights.totalClients}</p>
                                </div>
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-yellow-50 rounded-xl text-yellow-600"><TrendingUp className="w-6 h-6" /></div>
                                    </div>
                                    <h3 className="text-gray-500 font-bold text-sm">Total Revenue (completed orders)</h3>
                                    <p className="text-3xl font-black text-gray-900 mt-1">{insights.totalRevenue} EGP</p>
                                    {insights.totalFeesCollected != null && (
                                        <p className="text-xs text-gray-500 font-bold mt-2">Platform fees collected: {insights.totalFeesCollected} EGP</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-40">
                                <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
                            </div>
                        )}
                    </div>
                )}

                {/* Users Tab - Split view with detail panel */}
                {activeTab === 'users' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column: Lists */}
                        <div className={`lg:col-span-1 flex flex-col gap-6 overflow-y-auto h-[calc(100vh-16rem)] pr-2 ${selectedUser ? "hidden lg:flex" : "flex"}`}>
                            {/* User list */}
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden shrink-0">
                                <div className="p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                                    <h3 className="font-bold text-gray-900">Verified Users</h3>
                                <p className="text-sm text-gray-500">{users.length} total</p>
                            </div>
                            <div>
                                {usersLoading ? (
                                    <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#09BF44]" /></div>
                                ) : users.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500">No users yet.</div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {users.map(user => {
                                            const uid = user._id != null ? String(user._id) : '';
                                            const listPic = user.freelancerProfile?.profilePicture || user.clientProfile?.profilePicture;
                                            const listInitial = (user.firstName?.[0] || user.email?.[0] || '?').toUpperCase();
                                            const listOnline = uid ? (userPresenceById[uid] ?? !!user.isOnline) : false;
                                            return (
                                                <div
                                                    key={user._id}
                                                    onClick={() => handleSelectUser(user)}
                                                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedUser?._id === user._id ? 'bg-[#09BF44]/10 border-l-4 border-[#09BF44]' : ''}`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <AdminAvatarWithPresence
                                                            src={listPic}
                                                            initial={listInitial}
                                                            alt={`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email}
                                                            online={listOnline}
                                                        />
                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-bold text-gray-900">{user.firstName} {user.lastName}</p>
                                                            <p className="text-sm text-gray-500 truncate">{user.email}</p>
                                                            <p className="text-xs text-gray-400 truncate">{user.phoneNumber || ''}</p>
                                                            <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold ${user.role === 'admin' ? 'bg-purple-100 text-purple-600' : user.role === 'freelancer' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                                {user.role}{user.role === 'freelancer' && user.freelancerProfile?.category ? ` · ${user.freelancerProfile.category}` : ''}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                            {/* Unverified Users list */}
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden shrink-0 mb-4">
                                <div className="p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                                    <h3 className="font-bold text-gray-900">Unverified Users</h3>
                                <p className="text-sm text-gray-500">{unverifiedUsers.length} total</p>
                            </div>
                            <div>
                                {usersLoading ? (
                                    <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#09BF44]" /></div>
                                ) : unverifiedUsers.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500">No unverified users.</div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {unverifiedUsers.map(user => {
                                            const uid = user._id != null ? String(user._id) : '';
                                            const listPic = user.freelancerProfile?.profilePicture || user.clientProfile?.profilePicture;
                                            const listInitial = (user.firstName?.[0] || user.email?.[0] || '?').toUpperCase();
                                            const listOnline = uid ? (userPresenceById[uid] ?? !!user.isOnline) : false;
                                            return (
                                                <div
                                                    key={user._id}
                                                    onClick={() => handleSelectUser(user)}
                                                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedUser?._id === user._id ? 'bg-[#09BF44]/10 border-l-4 border-[#09BF44]' : ''}`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <AdminAvatarWithPresence
                                                            src={listPic}
                                                            initial={listInitial}
                                                            alt={`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email}
                                                            online={listOnline}
                                                        />
                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-bold text-gray-900">{user.firstName} {user.lastName}</p>
                                                            <p className="text-sm text-gray-500 truncate">{user.email}</p>
                                                            <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700">Unverified</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                        </div>
                        {/* Detail panel — full width on mobile when user is selected */}
                        <div className={`lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden ${selectedUser || selectedUserLoading ? 'block' : 'hidden lg:block'}`}>
                            {selectedUserLoading ? (
                                <div className="p-16 flex justify-center"><Loader2 className="w-12 h-12 animate-spin text-[#09BF44]" /></div>
                            ) : selectedUser ? (
                                <UserDetailPanel user={selectedUser} onBack={() => setSelectedUser(null)} onEdit={() => handleEditUser(selectedUser)} onDelete={() => handleDeleteUser(selectedUser._id)} onRefresh={async () => { const full = await api.admin.getUserById(selectedUser._id); setSelectedUser(full); }} />
                            ) : (
                                <div className="p-16 text-center text-gray-500">
                                    <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                    <p className="font-bold text-gray-700">Select a user to view details</p>
                                    <p className="text-sm mt-1">Click on a user from the list</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}


                {activeTab === 'finance' && (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                            <h2 className="text-lg font-bold text-gray-900">All Transactions</h2>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-600 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={financeHideManualTopUp}
                                    onChange={(e) => setFinanceHideManualTopUp(e.target.checked)}
                                    className="rounded border-gray-300 text-[#09BF44] focus:ring-[#09BF44]"
                                />
                                Hide manual admin top-ups
                            </label>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-bold uppercase">
                                    <tr>
                                        <th className="p-4">Type</th>
                                        <th className="p-4">User</th>
                                        <th className="p-4">Amount</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {financeLoading && (
                                        <tr><td colSpan={5} className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin text-[#09BF44] mx-auto" /></td></tr>
                                    )}
                                    {!financeLoading && transactions.length === 0 && (
                                        <tr><td colSpan={5} className="p-8 text-center text-gray-500">No transactions yet.</td></tr>
                                    )}
                                    {!financeLoading && transactions.map(tx => (
                                        <tr key={tx._id} className="hover:bg-gray-50">
                                            <td className="p-4 capitalize">
                                                {tx.type}
                                                {tx.isManualAdminTopUp && (
                                                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">Manual Admin Top-Up</span>
                                                )}
                                            </td>
                                            <td className="p-4">{tx.userId?.firstName} {tx.userId?.lastName}</td>
                                            <td className={`p-4 font-bold ${(tx.type === 'fee' || tx.amount > 0) ? 'text-green-600' : 'text-red-600'}`}>
                                                {tx.type === 'fee' || tx.amount > 0 ? `+${Math.abs(tx.amount)}` : tx.amount} EGP
                                            </td>
                                            <td className="p-4"><span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">{formatStatus(tx.status)}</span></td>
                                            <td className="p-4 text-gray-500">{formatDateDDMMYYYY(tx.createdAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'projects' && (
                    <div className="space-y-6">
                        {!managementDetail || managementDetail.kind !== 'project' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                {projectsLoading && (
                                    <div className="col-span-full flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-[#09BF44]" /></div>
                                )}
                                {!projectsLoading && projects.length === 0 && (
                                    <p className="col-span-full text-center text-gray-500 py-12">No offers yet.</p>
                                )}
                                {!projectsLoading && projects.map((project: any) => (
                                    <button
                                        key={project._id}
                                        type="button"
                                        onClick={() => setManagementDetail({ kind: 'project', item: project })}
                                        className="text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-[#09BF44]/50 hover:shadow-md transition-all"
                                    >
                                        <h3 className="font-black text-gray-900 mb-2 line-clamp-2">{project.title}</h3>
                                        <p className="text-sm text-gray-600">{project.sellerId?.firstName} {project.sellerId?.lastName}</p>
                                        <p className="text-xs text-gray-500 mt-1">{project.category} · {project.subCategory}</p>
                                        <p className="text-sm font-bold text-[#09BF44] mt-3">
                                            {project.packages?.[0]?.price} – {(project.packages?.[2]?.price ?? project.packages?.[1]?.price ?? project.packages?.[0]?.price)} EGP
                                        </p>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
                                <button type="button" onClick={() => setManagementDetail(null)} className="flex items-center gap-2 text-gray-600 font-bold mb-6 hover:text-gray-900">
                                    <ArrowLeft className="w-5 h-5" /> Back to offers
                                </button>
                                {(() => {
                                    const project = managementDetail.item;
                                    const seller = project.sellerId;
                                    const freelancerName = seller
                                        ? `${seller.firstName || ''} ${seller.lastName || ''}`.trim()
                                        : 'Freelancer';
                                    const profilePicture = seller?.freelancerProfile?.profilePicture;
                                    const rawImages = ((project.images || []) as string[]).filter(Boolean);
                                    const galleryImages = [...new Set(rawImages)];
                                    return (
                                        <>
                                            <h2 className="text-2xl font-black text-gray-900 mb-2">{project.title}</h2>
                                            <p className="text-gray-600 mb-4">{project.description || '—'}</p>
                                            <div className="flex flex-wrap items-center gap-2 mb-4">
                                                <span
                                                    className={`text-xs font-black px-2 py-1 rounded-full ${project.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                                                        }`}
                                                >
                                                    {project.isActive ? 'Active listing' : 'Inactive'}
                                                </span>
                                                <span className="text-xs font-bold text-gray-500">
                                                    {project.category} · {project.subCategory}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-3 mb-6">
                                                <button
                                                    type="button"
                                                    onClick={() => window.open(`/offers/${project._id}`, '_blank', 'noopener,noreferrer')}
                                                    className="text-sm font-bold text-[#09BF44] hover:underline flex items-center gap-1"
                                                >
                                                    <ExternalLink className="w-4 h-4" /> View as client (public offer)
                                                </button>
                                                <button type="button" onClick={() => router.push(`/freelancer/${project.sellerId?._id || project.sellerId}`)} className="text-sm font-bold text-[#09BF44] hover:underline">
                                                    View freelancer profile
                                                </button>
                                                <button type="button" onClick={() => handleEditProject(project)} className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1"><Edit className="w-4 h-4" /> Edit</button>
                                                <button type="button" onClick={() => handleDeleteProject(project._id)} className="text-sm font-bold text-red-600 hover:underline flex items-center gap-1"><Trash2 className="w-4 h-4" /> Delete</button>
                                            </div>
                                            {seller && (
                                                <div className="flex items-start gap-4 py-4 border-y border-gray-100 mb-6">
                                                    <div className="relative w-14 h-14 rounded-full overflow-hidden border border-gray-100 bg-gray-100 shrink-0">
                                                        {profilePicture ? (
                                                            <Image src={resolveMediaUrl(profilePicture)} alt="" fill className="object-cover" sizes="56px" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-white font-black bg-[#09BF44]">
                                                                {freelancerName[0]?.toUpperCase() || 'F'}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-black text-gray-900">{freelancerName}</p>
                                                        <p className="text-xs text-gray-500">{seller.email}</p>
                                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                                            <span className="inline-flex items-center gap-1 text-amber-600 text-sm font-bold">
                                                                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                                                                {project.reviewStats?.reviewCount > 0
                                                                    ? `Rated ${project.reviewStats.avgRating} · ${project.reviewStats.reviewCount} review${project.reviewStats.reviewCount === 1 ? '' : 's'}`
                                                                    : 'New seller'}
                                                            </span>
                                                        </div>
                                                        {seller.freelancerProfile?.bio && (
                                                            <p className="text-sm text-gray-600 mt-2 line-clamp-3">{seller.freelancerProfile.bio}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            {galleryImages.length > 0 && (
                                                <div className="mb-6">
                                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Photos & media</h4>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                        {galleryImages.map((src: string, i: number) => (
                                                            <a
                                                                key={i}
                                                                href={resolveMediaUrl(src)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 block"
                                                            >
                                                                <Image
                                                                    src={resolveMediaUrl(src)}
                                                                    alt=""
                                                                    fill
                                                                    className="object-cover"
                                                                    sizes="(max-width: 640px) 50vw, 33vw"
                                                                />
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            <div className="mb-6 text-sm">
                                                <span className="font-bold text-gray-500">Video / voice consultation (EGP): </span>
                                                <span className="font-bold text-gray-900">
                                                    {project.consultationPrice != null ? project.consultationPrice : '—'}
                                                </span>
                                            </div>
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Packages</h4>
                                            <div className="grid gap-3 sm:grid-cols-3">
                                                {(project.packages || []).map((pkg: any, i: number) => (
                                                    <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                                        <p className="font-black text-gray-900">{pkg.type}</p>
                                                        <p className="text-[#09BF44] font-bold mt-1">{pkg.price} EGP</p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {pkg.days} days · rev. {formatRevisionsLabel(pkg.revisionsUnlimited, pkg.revisions)}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'jobs' && (
                    <div className="space-y-6">
                        {!managementDetail || managementDetail.kind !== 'job' ? (
                            (() => {
                                const activeJobList = jobs.filter((j: any) => j.status === 'open' || j.status === 'in_progress');
                                const finishedJobList = jobs.filter((j: any) => j.status === 'completed' || j.status === 'closed');
                                const renderJobCard = (job: any) => (
                                    <button
                                        key={job._id}
                                        type="button"
                                        onClick={() => setManagementDetail({ kind: 'job', item: job })}
                                        className="text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-[#09BF44]/50 hover:shadow-md transition-all w-full"
                                    >
                                        <span
                                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${job.status === 'open'
                                                    ? 'bg-green-100 text-green-700'
                                                    : job.status === 'in_progress'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : job.status === 'completed'
                                                            ? 'bg-purple-100 text-purple-700'
                                                            : 'bg-gray-100 text-gray-600'
                                                }`}
                                        >
                                            {job.status}
                                        </span>
                                        <h3 className="font-black text-gray-900 mt-2 line-clamp-2">{job.title}</h3>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {job.clientId?.firstName} {job.clientId?.lastName}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-2">
                                            Posted {formatDateDDMMYYYY(job.createdAt)} · Due: {job.deadline || '—'}
                                        </p>
                                        <p className="text-sm font-bold text-[#09BF44] mt-2">
                                            {job.budgetRange?.min} – {job.budgetRange?.max} EGP
                                        </p>
                                    </button>
                                );
                                return (
                                    <div className="space-y-10">
                                        {jobsLoading && (
                                            <div className="flex justify-center p-12">
                                                <Loader2 className="w-8 h-8 animate-spin text-[#09BF44]" />
                                            </div>
                                        )}
                                        {!jobsLoading && jobs.length === 0 && (
                                            <p className="text-center text-gray-500 py-12">No jobs yet.</p>
                                        )}
                                        {!jobsLoading && jobs.length > 0 && (
                                            <>
                                                <section>
                                                    <h3 className="text-lg font-black text-gray-900 mb-4">Active (open / in progress)</h3>
                                                    {activeJobList.length > 0 ? (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                                            {activeJobList.map(renderJobCard)}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-gray-500 bg-white rounded-2xl border border-gray-100 p-8 text-center">
                                                            No active posted jobs.
                                                        </p>
                                                    )}
                                                </section>
                                                <section>
                                                    <h3 className="text-lg font-black text-gray-900 mb-4">Finished (completed / closed)</h3>
                                                    {finishedJobList.length > 0 ? (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                                            {finishedJobList.map(renderJobCard)}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-gray-500 bg-white rounded-2xl border border-gray-100 p-8 text-center">
                                                            No finished jobs yet.
                                                        </p>
                                                    )}
                                                </section>
                                            </>
                                        )}
                                    </div>
                                );
                            })()
                        ) : (
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-6">
                                <button type="button" onClick={() => setManagementDetail(null)} className="flex items-center gap-2 text-gray-600 font-bold hover:text-gray-900">
                                    <ArrowLeft className="w-5 h-5" /> Back to jobs
                                </button>
                                {(() => {
                                    const job = managementDetail.item;
                                    const viewJob = adminJobClientView || job;
                                    const accepted = (viewJob.proposals || []).find((p: any) => p.status === 'accepted');
                                    let inProgressDeadline: Date | null = null;
                                    if (viewJob.status === 'in_progress' && accepted?.deliveryDays != null && viewJob.createdAt) {
                                        const d = new Date(viewJob.createdAt);
                                        d.setDate(d.getDate() + Number(accepted.deliveryDays));
                                        inProgressDeadline = d;
                                    }
                                    return (
                                        <>
                                            <div className="flex flex-wrap items-start justify-between gap-4">
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                                                    Client view (read-only){' '}
                                                    <span className="text-gray-500 font-medium normal-case">— Edit/delete job below</span>
                                                </p>
                                                <div className="flex gap-2">
                                                    <button type="button" onClick={() => handleEditJob(job)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl">
                                                        <Edit className="w-5 h-5" />
                                                    </button>
                                                    <button type="button" onClick={() => handleDeleteJob(job._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-xl">
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                            {adminJobClientViewLoading && (
                                                <div className="flex justify-center py-16">
                                                    <Loader2 className="w-10 h-10 animate-spin text-[#09BF44]" />
                                                </div>
                                            )}
                                            {!adminJobClientViewLoading && adminJobClientView && (
                                                <ClientJobViewForAdmin job={adminJobClientView} jobDeadline={inProgressDeadline} router={router} />
                                            )}
                                            {!adminJobClientViewLoading && !adminJobClientView && (
                                                <p className="text-center text-red-600 font-bold py-8">Could not load full job details. Try again.</p>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div className="space-y-6">
                        {!managementDetail || managementDetail.kind !== 'order' ? (
                            (() => {
                                const finishedOrderStatuses = ['completed', 'refunded'];
                                const finishedOrderList = orders.filter((o: any) => finishedOrderStatuses.includes(o.status));
                                const activeOrderList = orders.filter((o: any) => !finishedOrderStatuses.includes(o.status));
                                const renderOrderCard = (order: any) => (
                                    <button
                                        key={order._id}
                                        type="button"
                                        onClick={() => setManagementDetail({ kind: 'order', item: order })}
                                        className="text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-[#09BF44]/50 hover:shadow-md transition-all"
                                    >
                                        <p className="text-xs text-gray-400 font-mono">#{order.orderNumber ?? String(order._id || '').slice(-6)}</p>
                                        <h3 className="font-black text-gray-900 mt-1 line-clamp-2">
                                            {order.projectId?.title || (order.offerId ? 'Custom offer' : 'Order')}
                                        </h3>
                                        <p className="text-[10px] font-black uppercase text-gray-400 mt-2 tracking-wide">
                                            {order.offerId ? 'Custom offer' : 'Marketplace bundle'}
                                        </p>
                                        <p className="text-sm text-gray-600 mt-1">{order.buyerId?.firstName} → {order.sellerId?.firstName}</p>
                                        <p className="text-sm font-bold text-[#09BF44] mt-2">{order.amount} EGP · {order.packageType}</p>
                                        <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-bold ${order.status === 'completed' ? 'bg-green-100 text-green-700' : order.status === 'disputed' ? 'bg-amber-100 text-amber-700' : order.status === 'refunded' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'}`}>{formatStatus(order.status)}</span>
                                    </button>
                                );
                                return (
                                    <div className="space-y-10">
                                        {ordersLoading && (
                                            <div className="flex justify-center p-12">
                                                <Loader2 className="w-8 h-8 animate-spin text-[#09BF44]" />
                                            </div>
                                        )}
                                        {!ordersLoading && orders.length === 0 && (
                                            <p className="text-center text-gray-500 py-12">No orders yet.</p>
                                        )}
                                        {!ordersLoading && orders.length > 0 && (
                                            <>
                                                <section>
                                                    <h3 className="text-lg font-black text-gray-900 mb-4">
                                                        Active (pending approval / payment, active, disputed, …)
                                                    </h3>
                                                    {activeOrderList.length > 0 ? (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                                            {activeOrderList.map(renderOrderCard)}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-gray-500 bg-white rounded-2xl border border-gray-100 p-8 text-center">
                                                            No active orders.
                                                        </p>
                                                    )}
                                                </section>
                                                <section>
                                                    <h3 className="text-lg font-black text-gray-900 mb-4">Finished (completed / refunded)</h3>
                                                    {finishedOrderList.length > 0 ? (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                                            {finishedOrderList.map(renderOrderCard)}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-gray-500 bg-white rounded-2xl border border-gray-100 p-8 text-center">
                                                            No finished orders yet.
                                                        </p>
                                                    )}
                                                </section>
                                            </>
                                        )}
                                    </div>
                                );
                            })()
                        ) : (
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-6">
                                <button type="button" onClick={() => setManagementDetail(null)} className="flex items-center gap-2 text-gray-600 font-bold hover:text-gray-900">
                                    <ArrowLeft className="w-5 h-5" /> Back to orders
                                </button>
                                {(() => {
                                    const order = managementDetail.item;
                                    const offer = order.offerId;
                                    const orderDeadlineIso = getOrderDeliveryDeadlineIso(order);
                                    const showOrderCountdown =
                                        orderDeadlineIso && orderStatusShowsDeliveryCountdown(order.status);
                                    return (
                                        <>
                                            {showOrderCountdown && (
                                                <div className="mb-4">
                                                    <CountdownTimer deadline={orderDeadlineIso} variant="detail" />
                                                </div>
                                            )}
                                            <div className="flex flex-wrap justify-between gap-4">
                                                <div>
                                                    <h2 className="text-2xl font-black text-gray-900">{order.projectId?.title || (order.offerId ? 'Custom offer' : 'Order')}</h2>
                                                    <p className="text-sm text-gray-500 mt-1">Order #{order.orderNumber} · {order.packageType}</p>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <span className={`px-3 py-1 rounded-full text-sm font-bold h-fit ${order.status === 'completed' ? 'bg-green-100 text-green-700' : order.status === 'disputed' ? 'bg-amber-100 text-amber-700' : order.status === 'refunded' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'}`}>{formatStatus(order.status)}</span>
                                                    <button type="button" onClick={() => handleDeleteOrder(order._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-xl" title="Delete Order">
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-gray-100 text-gray-700 tracking-wide">
                                                    {offer ? 'Custom offer' : 'Marketplace bundle'}
                                                </span>
                                                {order.projectId && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            window.open(
                                                                `/offers/${order.projectId._id || order.projectId}`,
                                                                '_blank',
                                                                'noopener,noreferrer'
                                                            )
                                                        }
                                                        className="text-xs font-bold text-[#09BF44] hover:underline inline-flex items-center gap-1"
                                                    >
                                                        <ExternalLink className="w-3.5 h-3.5" /> Public offer page
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openOrderPartyChat(
                                                            order.buyerId?._id || order.buyerId,
                                                            order.sellerId?._id || order.sellerId,
                                                            { buyer: order.buyerId, seller: order.sellerId }
                                                        )
                                                    }
                                                    className="text-xs font-bold text-blue-700 hover:underline inline-flex items-center gap-1"
                                                >
                                                    <MessageSquare className="w-3.5 h-3.5" /> Open buyer–seller chat
                                                </button>
                                            </div>
                                            {!offer && order.projectId && (
                                                <div className="rounded-2xl border-2 border-[#09BF44]/40 bg-linear-to-br from-[#09BF44]/12 to-white p-5 space-y-3">
                                                    <div className="flex flex-wrap items-center gap-2 justify-between gap-y-1">
                                                        <p className="text-xs font-black uppercase tracking-wider text-[#09BF44] flex items-center gap-2">
                                                            <ShoppingBag className="w-4 h-4 shrink-0" /> Bundle purchased
                                                        </p>
                                                        {(order.projectId.subCategory || order.projectId.category) && (
                                                            <span className="text-xs font-bold text-gray-500">
                                                                {order.projectId.subCategory || order.projectId.category}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap items-start gap-4">
                                                        <span className="inline-flex items-center px-4 py-2.5 rounded-2xl bg-[#09BF44] text-white text-xl font-black shadow-md shadow-green-200/40 shrink-0">
                                                            {order.packageType}
                                                        </span>
                                                        {(() => {
                                                            const packages = order.projectId.packages || [];
                                                            const pkg = packages.find((p: any) => p?.type === order.packageType);
                                                            if (!pkg) {
                                                                return (
                                                                    <p className="text-sm text-gray-600 font-bold">
                                                                        {order.amount} EGP · details not loaded for this package type
                                                                    </p>
                                                                );
                                                            }
                                                            return (
                                                                <div className="text-sm min-w-0 flex-1">
                                                                    <p className="font-black text-gray-900 text-base">{order.amount} EGP</p>
                                                                    <p className="text-gray-700 font-bold mt-0.5">{pkg.days} days delivery</p>
                                                                    {Array.isArray(pkg.features) && pkg.features.length > 0 && (
                                                                        <ul className="mt-2 text-gray-700 text-sm list-disc pl-5 space-y-0.5 max-w-2xl">
                                                                            {pkg.features.map((f: string, i: number) => (
                                                                                <li key={i}>{f}</li>
                                                                            ))}
                                                                        </ul>
                                                                    )}
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                    {order.projectId.title && (
                                                        <p className="text-xs text-gray-600">
                                                            Listing:{' '}
                                                            <span className="font-bold text-gray-900">{order.projectId.title}</span>
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                            {offer && (
                                                <div className="rounded-2xl border-2 border-violet-300 bg-violet-50/70 p-5 space-y-2">
                                                    <p className="text-xs font-black uppercase tracking-wider text-violet-900 flex items-center gap-2">
                                                        <FileText className="w-4 h-4 shrink-0" /> Custom offer (paid)
                                                    </p>
                                                    <p className="text-lg font-black text-gray-900">{order.amount} EGP</p>
                                                    {offer.deliveryDate && (
                                                        <p className="text-sm text-gray-800 font-bold">
                                                            Delivery target: {formatDateDDMMYYYY(offer.deliveryDate)}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                            {(() => {
                                                const clientBrief =
                                                    typeof order.description === 'string' ? order.description.trim() : '';
                                                const offerScope =
                                                    typeof offer?.whatsIncluded === 'string' ? offer.whatsIncluded.trim() : '';
                                                if (!clientBrief && !offerScope) {
                                                    return (
                                                        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                                                            <span className="font-bold text-gray-800">No stored brief. </span>
                                                            There is no client requirements text and no offer scope text on this order.
                                                        </div>
                                                    );
                                                }
                                                const sameCopy = clientBrief && offerScope && clientBrief === offerScope;
                                                return (
                                                    <div className="rounded-2xl border border-gray-200 bg-gray-50/90 p-5 space-y-4">
                                                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">
                                                            Client brief and scope
                                                        </h3>
                                                        {sameCopy ? (
                                                            <div className="rounded-xl bg-white border border-gray-100 p-4 min-w-0">
                                                                <p className="text-[10px] font-black uppercase text-gray-400 mb-2">
                                                                    {offer
                                                                        ? 'Offer scope (same text on the order record)'
                                                                        : 'Client requirements for this bundle'}
                                                                </p>
                                                                <p className="text-sm text-gray-800 whitespace-pre-wrap break-words overflow-wrap-anywhere min-w-0">
                                                                    {clientBrief}
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {clientBrief && (
                                                                    <div className="rounded-xl bg-white border border-gray-100 p-4 min-w-0">
                                                                        <p className="text-[10px] font-black uppercase text-gray-400 mb-2">
                                                                            {offer
                                                                                ? 'Text on the order record'
                                                                                : 'Client requirements for this bundle'}
                                                                        </p>
                                                                        <p className="text-sm text-gray-800 whitespace-pre-wrap break-words overflow-wrap-anywhere min-w-0">
                                                                            {clientBrief}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                                {offerScope && (
                                                                    <div className="rounded-xl bg-white border border-gray-100 p-4 min-w-0">
                                                                        <p className="text-[10px] font-black uppercase text-gray-400 mb-2">
                                                                            {"What's included (accepted custom offer)"}
                                                                        </p>
                                                                        <p className="text-sm text-gray-800 whitespace-pre-wrap break-words overflow-wrap-anywhere min-w-0">
                                                                            {offerScope}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                            <div className="grid sm:grid-cols-2 gap-4">
                                                <div className="bg-gray-50 rounded-xl p-4">
                                                    <p className="text-xs font-bold text-gray-400 uppercase">Client</p>
                                                    <p className="font-bold">{order.buyerId?.firstName} {order.buyerId?.lastName}</p>
                                                    <p className="text-sm text-gray-500">{order.buyerId?.email}</p>
                                                </div>
                                                <div className="bg-gray-50 rounded-xl p-4">
                                                    <p className="text-xs font-bold text-gray-400 uppercase">Freelancer</p>
                                                    <button type="button" onClick={() => router.push(`/freelancer/${order.sellerId?._id || order.sellerId}`)} className="flex items-center gap-3 mt-1 text-left w-full hover:opacity-90">
                                                        {order.sellerId?.freelancerProfile?.profilePicture ? (
                                                            <Image src={resolveMediaUrl(order.sellerId.freelancerProfile.profilePicture)} alt="" width={40} height={40} className="rounded-full object-cover" unoptimized />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-[#09BF44]/20 flex items-center justify-center font-bold text-[#09BF44]">{order.sellerId?.firstName?.[0]}</div>
                                                        )}
                                                        <span className="font-bold text-gray-900">{order.sellerId?.firstName} {order.sellerId?.lastName}</span>
                                                    </button>
                                                    <p className="text-sm text-gray-500">{order.sellerId?.email}</p>
                                                </div>
                                            </div>
                                            <div className="grid sm:grid-cols-3 gap-3 text-sm">
                                                <div className="bg-gray-50 rounded-xl p-3"><span className="text-gray-400 font-bold text-xs uppercase">Amount</span><p className="font-black text-[#09BF44]">{order.amount} EGP</p></div>
                                                <div className="bg-gray-50 rounded-xl p-3"><span className="text-gray-400 font-bold text-xs uppercase">Created</span><p className="font-bold">{formatDateDDMMYYYY(order.createdAt)}</p></div>
                                                <div className="bg-gray-50 rounded-xl p-3"><span className="text-gray-400 font-bold text-xs uppercase">Delivery due</span><p className="font-bold">{order.deliveryDate ? formatDateDDMMYYYY(order.deliveryDate) : '—'}</p></div>
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                <span className="font-bold">Revisions:</span> {formatRevisionsLabel(order.revisionsUnlimited, order.revisions)}
                                            </p>
                                            {offer?.milestones?.length > 0 && (
                                                <div>
                                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Offer milestones</h4>
                                                    <ul className="space-y-2 min-w-0">
                                                        {offer.milestones.map((m: any, i: number) => {
                                                            const sub = (order.offerMilestoneSubmissions || []).find((s: any) => Number(s.milestoneIndex) === i);
                                                            return (
                                                                <li key={i} className="bg-gray-50 rounded-xl p-3 text-sm break-words overflow-wrap-anywhere min-w-0">
                                                                    <div className="flex justify-between items-start gap-2">
                                                                        <span className="font-bold text-gray-900 break-words overflow-wrap-anywhere min-w-0 whitespace-pre-wrap">{m.name}</span>
                                                                        {m.dueDate && <span className="text-xs text-gray-500 shrink-0">· Due {formatDateDDMMYYYY(m.dueDate)}</span>}
                                                                    </div>
                                                                    {sub ? (
                                                                        <div className="mt-2 bg-white rounded-lg border border-gray-100 p-3 space-y-2">
                                                                            <p className="text-[10px] font-black uppercase text-[#09BF44] tracking-wide">Milestone Submission</p>
                                                                            {sub.message && <p className="text-gray-800 whitespace-pre-wrap break-words min-w-0">{sub.message}</p>}
                                                                            {(sub.links || []).map((l: string, li: number) => (
                                                                                <a key={li} href={l} target="_blank" rel="noreferrer" className="text-[#09BF44] font-bold block truncate">{l}</a>
                                                                            ))}
                                                                            {(sub.files || []).map((f: string, fi: number) => (
                                                                                <a key={fi} href={resolveMediaUrl(f)} target="_blank" rel="noreferrer" className="text-blue-600 font-bold block">File {fi + 1}</a>
                                                                            ))}
                                                                            {sub.submittedAt && <p className="text-[10px] text-gray-400">Submitted {formatDateDDMMYYYY(sub.submittedAt)}</p>}
                                                                        </div>
                                                                    ) : (
                                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">No submission yet</p>
                                                                    )}
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                </div>
                                            )}
                                            {order.disputeResolvedAt && order.disputeResolution && (
                                                <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm">
                                                    <p className="font-black text-green-800 mb-1">Solved</p>
                                                    <p className="text-green-900 whitespace-pre-wrap break-words overflow-wrap-anywhere min-w-0">{order.disputeResolution}</p>
                                                    {order.disputeResolutionType && (
                                                        <p className="text-xs font-bold text-green-700/90 mt-2 uppercase tracking-wide">Resolution type: {String(order.disputeResolutionType).replace(/_/g, ' ')}</p>
                                                    )}
                                                    <p className="text-xs text-green-700/80 mt-1">{formatDateDDMMYYYY(order.disputeResolvedAt)}</p>
                                                </div>
                                            )}
                                            {(() => {
                                                const hasWork = order.workSubmission?.message || (order.workSubmission?.links || []).length > 0 || (order.workSubmission?.files || []).length > 0;
                                                const hasMilestoneSubmissions = (order.offerMilestoneSubmissions || []).length > 0;

                                                if (hasWork) {
                                                    return (
                                                        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 min-w-0 max-w-full">
                                                            <h4 className="font-bold text-gray-900 mb-2">Final work submission</h4>
                                                            {order.workSubmission?.message && (
                                                                <p className="text-sm text-gray-700 whitespace-pre-wrap break-words overflow-wrap-anywhere min-w-0 max-w-full">{order.workSubmission.message}</p>
                                                            )}
                                                            {(order.workSubmission?.links || []).map((l: string, i: number) => (
                                                                <a key={i} href={l} target="_blank" rel="noreferrer" className="text-[#09BF44] text-sm block mt-2 truncate">{l}</a>
                                                            ))}
                                                            {(order.workSubmission?.files || []).map((f: string, i: number) => (
                                                                <a key={i} href={resolveMediaUrl(f)} target="_blank" rel="noreferrer" className="text-blue-600 text-sm block mt-1">File {i + 1}</a>
                                                            ))}
                                                            {order.workSubmission?.submittedAt && (
                                                                <p className="text-xs text-gray-500 mt-2">Submitted {formatDateDDMMYYYY(order.workSubmission.submittedAt)}</p>
                                                            )}
                                                        </div>
                                                    );
                                                } else if (hasMilestoneSubmissions) {
                                                    return (
                                                        <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4">
                                                            <h4 className="font-bold text-gray-900 mb-1">Work progress</h4>
                                                            <p className="text-sm text-emerald-800">Final work not submitted yet, but milestone work has been recorded above.</p>
                                                        </div>
                                                    );
                                                } else {
                                                    return <p className="text-sm text-gray-500">No work submission recorded yet.</p>;
                                                }
                                            })()}
                                            {order.status === 'disputed' && (
                                                <button
                                                    type="button"
                                                    onClick={() => setDisputeModal({ isOpen: true, order })}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#09BF44] text-white rounded-xl font-bold text-sm hover:bg-[#07a63a]"
                                                >
                                                    <Shield className="w-4 h-4" /> Resolve dispute
                                                </button>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'disputes' && (
                    <div className="space-y-6">
                        {!selectedDispute ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                {disputesLoading && (
                                    <div className="col-span-full flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-[#09BF44]" /></div>
                                )}
                                {!disputesLoading && disputes.length === 0 && (
                                    <p className="col-span-full text-center text-gray-500 py-12">No active disputes.</p>
                                )}
                                {!disputesLoading && disputes.map((d: any) => (
                                    <button
                                        key={d._id}
                                        type="button"
                                        onClick={() => setSelectedDispute(d)}
                                        className="text-left bg-white rounded-2xl border border-amber-200 shadow-sm p-5 hover:border-amber-400 hover:shadow-md transition-all"
                                    >
                                        <div className="flex items-center gap-2 text-amber-700 font-bold text-sm mb-2">
                                            <AlertTriangle className="w-4 h-4" /> Disputed order
                                        </div>
                                        <p className="text-xs text-gray-400 font-mono">#{d.orderNumber}</p>
                                        <h3 className="font-black text-gray-900 mt-1 line-clamp-2">{d.projectId?.title || 'Custom offer'}</h3>
                                        <p className="text-sm text-gray-600 mt-2">{d.buyerId?.firstName} vs {d.sellerId?.firstName}</p>
                                        <p className="text-sm font-bold text-gray-900 mt-2">{d.amount} EGP</p>
                                        {d.disputeReason && (
                                            <p className="text-xs text-amber-800 bg-amber-50 rounded-lg p-2 mt-3 line-clamp-3">{d.disputeReason}</p>
                                        )}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-6">
                                <button type="button" onClick={() => setSelectedDispute(null)} className="flex items-center gap-2 text-gray-600 font-bold hover:text-gray-900">
                                    <ArrowLeft className="w-5 h-5" /> Back to disputes
                                </button>
                                <div className="flex flex-wrap justify-between gap-4">
                                    <div>
                                        <h2 className="text-2xl font-black text-gray-900">{selectedDispute.projectId?.title || 'Custom offer'}</h2>
                                        <p className="text-sm text-gray-500 mt-1">Order #{selectedDispute.orderNumber}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setDisputeModal({ isOpen: true, order: selectedDispute })}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#09BF44] text-white rounded-xl font-bold text-sm hover:bg-[#07a63a] h-fit"
                                    >
                                        <Shield className="w-4 h-4" /> Resolve dispute
                                    </button>
                                </div>
                                {selectedDispute.disputeReason && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
                                        <span className="font-bold text-amber-900">Dispute reason: </span>
                                        <span className="text-amber-900">{selectedDispute.disputeReason}</span>
                                    </div>
                                )}
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <p className="text-xs font-bold text-gray-400 uppercase">Client</p>
                                        <button
                                            type="button"
                                            onClick={() => openBuyerFromDisputeInUsersTab(selectedDispute.buyerId)}
                                            className="mt-1 flex items-center gap-3 text-left w-full rounded-xl hover:bg-gray-100/80 p-2 -m-2 transition-colors"
                                        >
                                            {selectedDispute.buyerId?.clientProfile?.profilePicture ? (
                                                <Image
                                                    src={resolveMediaUrl(selectedDispute.buyerId.clientProfile.profilePicture)}
                                                    alt=""
                                                    width={44}
                                                    height={44}
                                                    className="rounded-full object-cover shrink-0"
                                                    unoptimized
                                                />
                                            ) : (
                                                <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 shrink-0">
                                                    {selectedDispute.buyerId?.firstName?.[0]}
                                                </div>
                                            )}
                                            <span className="min-w-0">
                                                <span className="font-bold text-gray-900 block">
                                                    {selectedDispute.buyerId?.firstName} {selectedDispute.buyerId?.lastName}
                                                </span>
                                                <span className="text-sm text-gray-500 block">{selectedDispute.buyerId?.email}</span>
                                                {selectedDispute.buyerId?.phoneNumber ? (
                                                    <span className="text-sm font-bold text-gray-800 block mt-0.5">{selectedDispute.buyerId.phoneNumber}</span>
                                                ) : null}
                                                <span className="text-xs font-bold text-[#09BF44] mt-1 inline-block">Open in Users →</span>
                                            </span>
                                        </button>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <p className="text-xs font-bold text-gray-400 uppercase">Freelancer</p>
                                        <button type="button" onClick={() => router.push(`/freelancer/${selectedDispute.sellerId?._id || selectedDispute.sellerId}`)} className="flex items-center gap-3 mt-1 text-left w-full hover:opacity-90">
                                            {selectedDispute.sellerId?.freelancerProfile?.profilePicture ? (
                                                <Image src={resolveMediaUrl(selectedDispute.sellerId.freelancerProfile.profilePicture)} alt="" width={44} height={44} className="rounded-full object-cover" unoptimized />
                                            ) : (
                                                <div className="w-11 h-11 rounded-full bg-[#09BF44]/20 flex items-center justify-center font-bold text-[#09BF44]">{selectedDispute.sellerId?.firstName?.[0]}</div>
                                            )}
                                            <span className="font-bold text-gray-900">{selectedDispute.sellerId?.firstName} {selectedDispute.sellerId?.lastName}</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="grid sm:grid-cols-3 gap-3 text-sm">
                                    <div className="bg-gray-50 rounded-xl p-3"><span className="text-gray-400 font-bold text-xs uppercase">Amount</span><p className="font-black">{selectedDispute.amount} EGP</p></div>
                                    <div className="bg-gray-50 rounded-xl p-3"><span className="text-gray-400 font-bold text-xs uppercase">Package</span><p className="font-bold">{selectedDispute.packageType}</p></div>
                                    <div className="bg-gray-50 rounded-xl p-3"><span className="text-gray-400 font-bold text-xs uppercase">Delivery</span><p className="font-bold">{selectedDispute.deliveryDate ? formatDateDDMMYYYY(selectedDispute.deliveryDate) : '—'}</p></div>
                                </div>
                                {selectedDispute.offerId?.milestones?.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Milestones (offer)</h4>
                                        <ul className="space-y-2 min-w-0">
                                            {selectedDispute.offerId.milestones.map((m: any, i: number) => {
                                                const sub = (selectedDispute.offerMilestoneSubmissions || []).find((s: any) => Number(s.milestoneIndex) === i);
                                                return (
                                                    <li
                                                        key={i}
                                                        className="bg-gray-50 rounded-xl p-3 text-sm break-words overflow-wrap-anywhere min-w-0"
                                                    >
                                                        <div className="flex justify-between items-start gap-2">
                                                            <span className="font-bold text-gray-900 break-words overflow-wrap-anywhere min-w-0 whitespace-pre-wrap">{m.name}</span>
                                                            {m.dueDate && <span className="text-xs text-gray-500 shrink-0">· Due {formatDateDDMMYYYY(m.dueDate)}</span>}
                                                        </div>
                                                        {sub ? (
                                                            <div className="mt-2 bg-white rounded-lg border border-gray-100 p-3 space-y-2">
                                                                <p className="text-[10px] font-black uppercase text-[#09BF44] tracking-wide">Milestone Submission</p>
                                                                {sub.message && <p className="text-gray-800 whitespace-pre-wrap break-words min-w-0">{sub.message}</p>}
                                                                {(sub.links || []).map((l: string, li: number) => (
                                                                    <a key={li} href={l} target="_blank" rel="noreferrer" className="text-[#09BF44] font-bold block truncate">{l}</a>
                                                                ))}
                                                                {(sub.files || []).map((f: string, fi: number) => (
                                                                    <a key={fi} href={resolveMediaUrl(f)} target="_blank" rel="noreferrer" className="text-blue-600 font-bold block">File {fi + 1}</a>
                                                                ))}
                                                                {sub.submittedAt && <p className="text-[10px] text-gray-400">Submitted {formatDateDDMMYYYY(sub.submittedAt)}</p>}
                                                            </div>
                                                        ) : (
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">No submission yet</p>
                                                        )}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                )}
                                {(() => {
                                    const hasWork = selectedDispute.workSubmission?.message || (selectedDispute.workSubmission?.links || []).length > 0 || (selectedDispute.workSubmission?.files || []).length > 0;
                                    const hasMilestoneSubmissions = (selectedDispute.offerMilestoneSubmissions || []).length > 0;

                                    if (hasWork) {
                                        return (
                                            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                                                <h4 className="font-bold text-gray-900 mb-2">Final work submission</h4>
                                                {selectedDispute.workSubmission?.message && <p className="text-sm text-gray-700 whitespace-pre-wrap break-words overflow-wrap-anywhere">{selectedDispute.workSubmission.message}</p>}
                                                {(selectedDispute.workSubmission?.links || []).map((l: string, i: number) => (
                                                    <a key={i} href={l} target="_blank" rel="noreferrer" className="text-[#09BF44] text-sm block mt-2 truncate">{l}</a>
                                                ))}
                                                {(selectedDispute.workSubmission?.files || []).map((f: string, i: number) => (
                                                    <a key={i} href={resolveMediaUrl(f)} target="_blank" rel="noreferrer" className="text-blue-600 text-sm block mt-1">File {i + 1}</a>
                                                ))}
                                            </div>
                                        );
                                    } else if (hasMilestoneSubmissions) {
                                        return (
                                            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4">
                                                <h4 className="font-bold text-gray-900 mb-1">Work progress</h4>
                                                <p className="text-sm text-emerald-800">Final work not submitted yet, but milestone work has been recorded above.</p>
                                            </div>
                                        );
                                    } else {
                                        return <p className="text-sm text-gray-500">No work submission recorded yet.</p>;
                                    }
                                })()}
                                <div>
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Chat between parties</h4>
                                    {disputeConvoResolving || disputeChatLoading ? (
                                        <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-[#09BF44]" /></div>
                                    ) : !disputeConversationId ? (
                                        <p className="text-sm text-gray-500 bg-gray-50 rounded-2xl border border-gray-100 p-4">
                                            No chat was found between this client and freelancer yet.
                                        </p>
                                    ) : (
                                        <div className="max-h-[420px] overflow-y-auto p-4 space-y-4 bg-gray-50 rounded-2xl border border-gray-100">
                                            {disputeChatMessages.length === 0 && disputeChatOffers.length === 0 ? (
                                                <p className="text-center text-gray-400 text-sm py-8">No messages or offers.</p>
                                            ) : (
                                                <AdminChatMergedFeed
                                                    messages={disputeChatMessages}
                                                    offers={disputeChatOffers}
                                                    selectedChat={{ participants: [selectedDispute.buyerId, selectedDispute.sellerId] }}
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'withdrawals' && (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">Freelancer Withdrawal Requests</h2>
                            <p className="text-sm text-gray-500 mt-1">Complete or reject pending withdrawals. Rejected requests refund the freelancer.</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-bold uppercase">
                                    <tr>
                                        <th className="p-4">Freelancer</th>
                                        <th className="p-4">Amount</th>
                                        <th className="p-4">Fee</th>
                                        <th className="p-4">Method</th>
                                        <th className="p-4">Details</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Rejection reason</th>
                                        <th className="p-4">Date</th>
                                        <th className="p-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {withdrawalsLoading ? (
                                        <tr><td colSpan={9} className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin text-[#09BF44] mx-auto" /></td></tr>
                                    ) : withdrawals.length === 0 ? (
                                        <tr><td colSpan={9} className="p-8 text-center text-gray-500">No withdrawal requests yet.</td></tr>
                                    ) : (
                                        withdrawals.map((w: any) => {
                                            const user = w.userId;
                                            const acc = w.accountNumber || '';
                                            const details = w.method === 'bank' ? `${w.bankName || ''} • ${acc.length >= 4 ? '****' + acc.slice(-4) : acc || '-'}` : (w.phoneNumber || '-');
                                            return (
                                                <tr key={w._id} className="hover:bg-gray-50">
                                                    <td className="p-4">
                                                        <span className="font-bold">{user?.firstName} {user?.lastName}</span>
                                                        <span className="block text-xs text-gray-500">{user?.email}</span>
                                                    </td>
                                                    <td className="p-4 font-bold">{w.amount} EGP</td>
                                                    <td className="p-4 text-gray-600">{Number(w.fee ?? 0)} EGP</td>
                                                    <td className="p-4 capitalize">{w.method?.replace('_', ' ')}</td>
                                                    <td className="p-4 text-gray-600 truncate max-w-[140px]">{details}</td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold ${w.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                            w.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                                'bg-amber-100 text-amber-700'
                                                            }`}>{w.status === 'rejected' ? 'REJECTED' : w.status}</span>
                                                    </td>
                                                    <td className="p-4 max-w-xs align-top">
                                                        {w.status === 'rejected' && w.rejectReason ? (
                                                            <div className="rounded-xl border-2 border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 font-medium whitespace-pre-wrap break-words">
                                                                {w.rejectReason}
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400 text-xs">—</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-gray-500">{formatDateDDMMYYYY(w.createdAt)}</td>
                                                    <td className="p-4">
                                                        {w.status === 'pending' && (
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={async () => {
                                                                        try {
                                                                            await api.admin.completeWithdrawal(w._id);
                                                                            showModal({ title: 'Completed', message: 'Withdrawal marked as completed.', type: 'success' });
                                                                            fetchWithdrawals();
                                                                        } catch (e: any) {
                                                                            showModal({ title: 'Error', message: e.message, type: 'error' });
                                                                        }
                                                                    }}
                                                                    className="text-green-600 hover:bg-green-50 px-3 py-1.5 rounded font-bold text-sm flex items-center gap-1"
                                                                >
                                                                    <Check className="w-4 h-4" /> Complete
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setWithdrawRejectTarget(w);
                                                                        setWithdrawRejectReason('');
                                                                    }}
                                                                    className="text-red-600 hover:bg-red-50 px-3 py-1.5 rounded font-bold text-sm flex items-center gap-1"
                                                                >
                                                                    <X className="w-4 h-4" /> Reject
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'instapay' && (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">InstaPay Pending Payments</h2>
                            <p className="text-sm text-gray-500 mt-1">Review and approve/deny InstaPay payment screenshots.</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-bold uppercase">
                                    <tr>
                                        <th className="p-4">User</th>
                                        <th className="p-4">Amount</th>
                                        <th className="p-4">Type</th>
                                        <th className="p-4">Screenshot</th>
                                        <th className="p-4">Date</th>
                                        <th className="p-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {instaPayLoading ? (
                                        <tr><td colSpan={6} className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin text-[#09BF44] mx-auto" /></td></tr>
                                    ) : instaPayPending.length === 0 ? (
                                        <tr><td colSpan={6} className="p-8 text-center text-gray-500">No pending InstaPay payments.</td></tr>
                                    ) : (
                                        instaPayPending.map((p: any) => {
                                            const user = p.userId || p.user;
                                            return (
                                                <tr key={p._id} className="hover:bg-gray-50">
                                                    <td className="p-4">
                                                        <span className="font-bold">{user?.firstName} {user?.lastName}</span>
                                                        <span className="block text-xs text-gray-500">{user?.email}</span>
                                                    </td>
                                                    <td className="p-4 font-bold text-[#09BF44]">{p.amountEGP ?? (p.amountCents / 100)} EGP</td>
                                                    <td className="p-4"><span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs capitalize">{p.meta?.type || 'payment'}</span></td>
                                                    <td className="p-4">
                                                        {p.screenshotUrl ? (
                                                            <a href={p.screenshotUrl} target="_blank" rel="noopener noreferrer" className="text-[#09BF44] hover:underline font-bold">
                                                                View
                                                            </a>
                                                        ) : (
                                                            <span className="text-gray-400">—</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-gray-500">{formatDateDDMMYYYY(p.createdAt)}</td>
                                                    <td className="p-4">
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={async () => {
                                                                    setInstaPayActionId(p._id);
                                                                    try {
                                                                        await api.admin.approveInstaPay(p._id);
                                                                        showModal({ title: 'Approved', message: 'InstaPay payment approved.', type: 'success' });
                                                                        fetchInstaPayPending();
                                                                    } catch (e: any) {
                                                                        showModal({ title: 'Error', message: e.message || 'Failed to approve', type: 'error' });
                                                                    } finally {
                                                                        setInstaPayActionId(null);
                                                                    }
                                                                }}
                                                                disabled={!!instaPayActionId}
                                                                className="text-green-600 hover:bg-green-50 px-3 py-1.5 rounded font-bold text-sm flex items-center gap-1 disabled:opacity-70 disabled:cursor-not-allowed"
                                                            >
                                                                {instaPayActionId === p._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Approve
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    showModal({
                                                                        title: 'Deny InstaPay Payment',
                                                                        message: 'Deny this payment? The user will be notified.',
                                                                        type: 'confirm',
                                                                        confirmText: 'Deny',
                                                                        onConfirm: async () => {
                                                                            setInstaPayActionId(p._id);
                                                                            try {
                                                                                await api.admin.denyInstaPay(p._id);
                                                                                showModal({ title: 'Denied', message: 'InstaPay payment denied.', type: 'success' });
                                                                                fetchInstaPayPending();
                                                                            } catch (e: any) {
                                                                                showModal({ title: 'Error', message: e.message || 'Failed to deny', type: 'error' });
                                                                            } finally {
                                                                                setInstaPayActionId(null);
                                                                            }
                                                                        }
                                                                    });
                                                                }}
                                                                disabled={!!instaPayActionId}
                                                                className="text-red-600 hover:bg-red-50 px-3 py-1.5 rounded font-bold text-sm flex items-center gap-1 disabled:opacity-70 disabled:cursor-not-allowed"
                                                            >
                                                                {instaPayActionId === p._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />} Deny
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'emails' && (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-bold uppercase">
                                    <tr>
                                        <th className="p-4">Recipient</th>
                                        <th className="p-4">Subject</th>
                                        <th className="p-4">Template</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Sent At</th>
                                        <th className="p-4">Error</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {emailsLoading ? (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin text-[#09BF44] mx-auto" /></td>
                                        </tr>
                                    ) : emailLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-gray-500">No email logs yet.</td>
                                        </tr>
                                    ) : (
                                        emailLogs.map((log: any) => (
                                            <tr key={log._id} className="hover:bg-gray-50">
                                                <td className="p-4 text-gray-900">{log.recipient}</td>
                                                <td className="p-4 truncate max-w-xs">{log.subject}</td>
                                                <td className="p-4"><span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">{log.templateType}</span></td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${log.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {formatStatus(log.status)}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-gray-500">{log.sentAt ? new Date(log.sentAt).toLocaleString() : '-'}</td>
                                                <td className="p-4 text-red-600 text-xs max-w-xs truncate" title={log.error}>{log.error || '-'}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'announcements' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-bold mb-4">Create Announcement</h3>
                            <p className="text-sm text-gray-500 mb-4">Send a message to all freelancers. You can include text, a photo, or both.</p>
                            <form
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    if ((!announcementContent?.trim() && !announcementImageUrl?.trim() && !announcementVideoLink?.trim())) {
                                        showModal({ title: 'Required', message: 'Add text, a photo, or a video link.', type: 'error' });
                                        return;
                                    }
                                    setCreatingAnnouncement(true);
                                    try {
                                        await api.announcements.admin.create({
                                            content: announcementContent.trim() || undefined,
                                            imageUrl: announcementImageUrl.trim() || undefined,
                                            videoLink: announcementVideoLink.trim() || undefined
                                        });
                                        setAnnouncementContent('');
                                        setAnnouncementImageUrl('');
                                        setAnnouncementVideoLink('');
                                        showModal({ title: 'Sent', message: 'Announcement published to freelancers.', type: 'success' });
                                        fetchAnnouncements();
                                    } catch (err: any) {
                                        showModal({ title: 'Error', message: err.message || 'Failed to create', type: 'error' });
                                    } finally {
                                        setCreatingAnnouncement(false);
                                    }
                                }}
                                className="space-y-4"
                            >
                                <textarea
                                    value={announcementContent}
                                    onChange={(e) => setAnnouncementContent(e.target.value)}
                                    placeholder="Write your announcement (optional if you add a photo/video)"
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#09BF44] outline-none resize-none"
                                />
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Video Link (YouTube/Vimeo - optional)</label>
                                    <input
                                        type="url"
                                        value={announcementVideoLink}
                                        onChange={(e) => setAnnouncementVideoLink(e.target.value)}
                                        placeholder="e.g. https://www.youtube.com/watch?v=..."
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#09BF44] outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Photo (optional)</label>
                                    <div className="flex flex-wrap gap-3 items-center">
                                        {announcementImageUrl ? (
                                            <div className="relative">
                                                <img src={announcementImageUrl} alt="" className="h-24 w-24 object-cover rounded-xl border" />
                                                <button type="button" onClick={() => setAnnouncementImageUrl('')} className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">×</button>
                                            </div>
                                        ) : (
                                            <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-gray-200 hover:border-[#09BF44] transition-colors">
                                                <ImagePlus className="w-5 h-5 text-gray-400" />
                                                <span className="text-sm font-bold text-gray-600">Upload image</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            try {
                                                                const url = await api.upload.file(file);
                                                                setAnnouncementImageUrl(url);
                                                            } catch (er: any) {
                                                                showModal({ title: 'Upload Failed', message: er.message || 'Could not upload', type: 'error' });
                                                            }
                                                        }
                                                    }}
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>
                                <button type="submit" disabled={creatingAnnouncement} className="px-6 py-3 bg-[#09BF44] text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
                                    {creatingAnnouncement ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                                    Publish Announcement
                                </button>
                            </form>
                        </div>
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            <h3 className="p-6 font-bold text-lg border-b border-gray-100">Recent Announcements</h3>
                            {announcementsLoading ? (
                                <div className="p-12 text-center"><Loader2 className="w-10 h-10 animate-spin text-[#09BF44] mx-auto" /></div>
                            ) : announcements.length === 0 ? (
                                <div className="p-12 text-center text-gray-500">No announcements yet.</div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {announcements.map((a: any) => (
                                        <div key={a._id} className="p-6 flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-4 min-w-0 flex-1">
                                                {a.imageUrl && <img src={a.imageUrl} alt="" className="w-24 h-24 object-cover rounded-xl shrink-0" />}
                                                <div className="min-w-0 flex-1">
                                                    <AnnouncementContent content={a.content} videoLink={a.videoLink} />
                                                    <p className="text-xs text-gray-500 mt-2">
                                                        {a.createdBy?.firstName} {a.createdBy?.lastName} • {a.createdAt ? new Date(a.createdAt).toLocaleString() : ''}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    showModal({
                                                        title: 'Delete Announcement',
                                                        message: 'Are you sure you want to delete this announcement?',
                                                        type: 'confirm',
                                                        confirmText: 'Delete',
                                                        onConfirm: async () => {
                                                            try {
                                                                await api.announcements.admin.delete(a._id);
                                                                showModal({ title: 'Deleted', message: 'Announcement deleted.', type: 'success' });
                                                                fetchAnnouncements();
                                                            } catch (e: any) {
                                                                showModal({ title: 'Error', message: e.message || 'Failed to delete', type: 'error' });
                                                            }
                                                        }
                                                    });
                                                }}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg shrink-0"
                                                aria-label="Delete announcement"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'approvals' && (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        {!selectedFreelancer ? (
                            <>
                                <div className="p-6 border-b border-gray-100">
                                    <h3 className="text-lg font-bold mb-4">Pending Freelancer Approvals</h3>
                                    <div className="flex flex-wrap gap-3 items-center">
                                        <select value={approvalCategoryFilter} onChange={(e) => setApprovalCategoryFilter(e.target.value)} className="px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-[#09BF44] outline-none text-sm font-bold">
                                            <option value="">All Categories</option>
                                            {MAIN_CATEGORIES.map((c) => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={approvalStarredOnly} onChange={(e) => setApprovalStarredOnly(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-[#09BF44]" />
                                            <span className="text-sm font-bold text-gray-700">Starred only</span>
                                        </label>
                                    </div>
                                </div>
                                <div className="p-6">
                                    {(() => {
                                        const filtered = pendingFreelancers.filter((f: any) => {
                                            if (approvalStarredOnly && !f.freelancerProfile?.adminStarred) return false;
                                            if (approvalCategoryFilter && f.freelancerProfile?.category !== approvalCategoryFilter) return false;
                                            return true;
                                        });
                                        return filtered.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                                {filtered.map((f: any) => (
                                                    <div
                                                        key={f._id}
                                                        onClick={() => setSelectedFreelancer(f)}
                                                        className="flex flex-col p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-[#09BF44] hover:shadow-sm transition-all cursor-pointer"
                                                    >
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex items-center gap-3">
                                                                {f.freelancerProfile?.profilePicture ? (
                                                                    <Image src={f.freelancerProfile.profilePicture} alt="" width={48} height={48} className="w-12 h-12 rounded-full object-cover shrink-0" />
                                                                ) : (
                                                                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-xl font-bold text-gray-500 shrink-0">
                                                                        {f.firstName?.[0]}
                                                                    </div>
                                                                )}
                                                                <div className="min-w-0">
                                                                    <h4 className="font-bold text-gray-900 truncate">{f.firstName} {f.lastName}</h4>
                                                                    <p className="text-sm text-gray-500">{f.freelancerProfile?.experienceYears != null ? `${f.freelancerProfile.experienceYears} Years Exp.` : ''}</p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    try {
                                                                        if (f.freelancerProfile?.adminStarred) {
                                                                            await api.admin.unstarFreelancer(f._id);
                                                                        } else {
                                                                            await api.admin.starFreelancer(f._id);
                                                                        }
                                                                        fetchPending();
                                                                    } catch { }
                                                                }}
                                                                className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                                                            >
                                                                <Star className={`w-5 h-5 ${f.freelancerProfile?.adminStarred ? 'fill-amber-400 text-amber-500' : 'text-gray-300'}`} />
                                                            </button>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2 mt-auto pt-2">
                                                            <span className="px-2 py-1 bg-[#09BF44]/10 text-[#09BF44] text-xs font-bold rounded-full uppercase truncate">{(f.freelancerProfile?.category || 'No category')}</span>
                                                            {f.freelancerProfile?.isStudent && (
                                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">STUDENT</span>
                                                            )}
                                                            <span className="text-xs font-bold text-gray-400 ml-auto">Click to review →</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 text-gray-400">
                                                <Check className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                                <p>{filtered.length === 0 && pendingFreelancers.length > 0 ? 'No matching freelancers.' : 'All caught up! No pending approvals.'}</p>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Freelancer Detail View */}
                                <div className="p-6 border-b border-gray-100 flex items-center gap-4">
                                    <button onClick={() => setSelectedFreelancer(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <h3 className="text-lg font-bold">Review Application</h3>
                                </div>
                                <div className="p-8 space-y-8">
                                    {/* Profile Header */}
                                    <div className="flex items-center gap-6">
                                        {selectedFreelancer.freelancerProfile?.profilePicture ? (
                                            <Image src={selectedFreelancer.freelancerProfile.profilePicture} alt="" width={96} height={96} className="w-24 h-24 rounded-full object-cover border-4 border-gray-100" />
                                        ) : (
                                            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-3xl font-bold text-gray-500">
                                                {selectedFreelancer.firstName?.[0]}
                                            </div>
                                        )}
                                        <div>
                                            <h2 className="text-2xl font-black text-gray-900">{selectedFreelancer.firstName} {selectedFreelancer.lastName}</h2>
                                            <p className="text-gray-500 font-medium">@{selectedFreelancer.username}</p>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {selectedFreelancer.freelancerProfile?.category && (
                                                    <span className="inline-block px-3 py-1 bg-[#09BF44]/10 text-[#09BF44] text-sm font-bold rounded-full uppercase">{selectedFreelancer.freelancerProfile.category}</span>
                                                )}
                                                {selectedFreelancer.freelancerProfile?.isStudent && (
                                                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm font-bold rounded-full">STUDENT</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Personal Info */}
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Personal Information</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-gray-50 p-4 rounded-xl">
                                                <p className="text-xs font-bold text-gray-400 mb-1">Email</p>
                                                <p className="font-medium text-gray-900">{selectedFreelancer.email}</p>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-xl">
                                                <p className="text-xs font-bold text-gray-400 mb-1">Phone</p>
                                                <p className="font-medium text-gray-900">{selectedFreelancer.phoneNumber || 'Not provided'}</p>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-xl">
                                                <p className="text-xs font-bold text-gray-400 mb-1">Date of Birth</p>
                                                <p className="font-medium text-gray-900">{selectedFreelancer.dateOfBirth ? formatDateDDMMYYYY(selectedFreelancer.dateOfBirth) : 'Not provided'}</p>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-xl">
                                                <p className="text-xs font-bold text-gray-400 mb-1">City</p>
                                                <p className="font-medium text-gray-900">{selectedFreelancer.freelancerProfile?.city || 'Not provided'}</p>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-xl">
                                                <p className="text-xs font-bold text-gray-400 mb-1">Languages</p>
                                                <p className="font-medium text-gray-900">
                                                    {selectedFreelancer.freelancerProfile?.languages?.english || selectedFreelancer.freelancerProfile?.languages?.arabic
                                                        ? [selectedFreelancer.freelancerProfile.languages.english && `English: ${selectedFreelancer.freelancerProfile.languages.english}`, selectedFreelancer.freelancerProfile.languages.arabic && `Arabic: ${selectedFreelancer.freelancerProfile.languages.arabic}`].filter(Boolean).join(' • ')
                                                        : 'Not provided'}
                                                </p>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-xl">
                                                <p className="text-xs font-bold text-gray-400 mb-1">Joined</p>
                                                <p className="font-medium text-gray-900">{formatDateDDMMYYYY(selectedFreelancer.createdAt)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bio */}
                                    {selectedFreelancer.freelancerProfile?.bio && (
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Bio</h4>
                                            <p className="text-gray-700 bg-gray-50 p-4 rounded-xl leading-relaxed whitespace-pre-wrap">{selectedFreelancer.freelancerProfile.bio}</p>
                                        </div>
                                    )}

                                    {/* Professional Info */}
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Professional Details</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-gray-50 p-4 rounded-xl">
                                                <p className="text-xs font-bold text-gray-400 mb-1">Experience</p>
                                                <p className="font-medium text-gray-900">{selectedFreelancer.freelancerProfile?.experienceYears != null ? `${selectedFreelancer.freelancerProfile.experienceYears} years` : 'Not provided'}</p>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-xl">
                                                <p className="text-xs font-bold text-gray-400 mb-1">Student</p>
                                                <p className="font-medium text-gray-900">{selectedFreelancer.freelancerProfile?.isStudent ? 'Yes' : 'No'}</p>
                                            </div>
                                            {selectedFreelancer.freelancerProfile?.cvUrl && (
                                                <div className="bg-gray-50 p-4 rounded-xl md:col-span-2">
                                                    <p className="text-xs font-bold text-gray-400 mb-1">CV (admin only, not public)</p>
                                                    <a href={`${selectedFreelancer.freelancerProfile.cvUrl}?token=${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`} target="_blank" rel="noopener noreferrer" className="text-[#09BF44] hover:underline font-medium flex items-center gap-1">
                                                        <FileText className="w-4 h-4" /> View CV
                                                    </a>
                                                </div>
                                            )}
                                            {(selectedFreelancer.freelancerProfile?.extraLanguages?.length > 0) && (
                                                <div className="bg-gray-50 p-4 rounded-xl md:col-span-2">
                                                    <p className="text-xs font-bold text-gray-400 mb-1">Other Languages</p>
                                                    <p className="font-medium text-gray-900">{selectedFreelancer.freelancerProfile.extraLanguages.join(', ')}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Survey Responses (5 questions) */}
                                    {(selectedFreelancer.freelancerProfile?.surveyResponses?.disagreementHandling || selectedFreelancer.freelancerProfile?.surveyResponses?.hoursPerDay || selectedFreelancer.freelancerProfile?.surveyResponses?.clientUpdates || selectedFreelancer.freelancerProfile?.surveyResponses?.biggestChallenge || selectedFreelancer.freelancerProfile?.surveyResponses?.discoverySource) && (
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Survey Responses</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {selectedFreelancer.freelancerProfile.surveyResponses.disagreementHandling && (
                                                    <div className="bg-gray-50 p-4 rounded-xl">
                                                        <p className="text-xs font-bold text-gray-400 mb-1">Disagreement handling</p>
                                                        <p className="font-medium text-gray-900">{selectedFreelancer.freelancerProfile.surveyResponses.disagreementHandling}</p>
                                                    </div>
                                                )}
                                                {selectedFreelancer.freelancerProfile.surveyResponses.hoursPerDay && (
                                                    <div className="bg-gray-50 p-4 rounded-xl">
                                                        <p className="text-xs font-bold text-gray-400 mb-1">Hours per day</p>
                                                        <p className="font-medium text-gray-900">{selectedFreelancer.freelancerProfile.surveyResponses.hoursPerDay}</p>
                                                    </div>
                                                )}
                                                {selectedFreelancer.freelancerProfile.surveyResponses.clientUpdates && (
                                                    <div className="bg-gray-50 p-4 rounded-xl">
                                                        <p className="text-xs font-bold text-gray-400 mb-1">Client updates</p>
                                                        <p className="font-medium text-gray-900">{selectedFreelancer.freelancerProfile.surveyResponses.clientUpdates}</p>
                                                    </div>
                                                )}
                                                {selectedFreelancer.freelancerProfile.surveyResponses.biggestChallenge && (
                                                    <div className="bg-gray-50 p-4 rounded-xl">
                                                        <p className="text-xs font-bold text-gray-400 mb-1">Biggest challenge</p>
                                                        <p className="font-medium text-gray-900">{selectedFreelancer.freelancerProfile.surveyResponses.biggestChallenge}</p>
                                                    </div>
                                                )}
                                                {selectedFreelancer.freelancerProfile.surveyResponses.discoverySource && (
                                                    <div className="bg-gray-50 p-4 rounded-xl">
                                                        <p className="text-xs font-bold text-gray-400 mb-1">Discovery source</p>
                                                        <p className="font-medium text-gray-900">{selectedFreelancer.freelancerProfile.surveyResponses.discoverySource}</p>
                                                    </div>
                                                )}
                                                {selectedFreelancer.freelancerProfile.surveyResponses.aiUsage && (
                                                    <div className="bg-gray-50 p-4 rounded-xl">
                                                        <p className="text-xs font-bold text-gray-400 mb-1">Uses AI in work</p>
                                                        <p className="font-medium text-gray-900">{selectedFreelancer.freelancerProfile.surveyResponses.aiUsage}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Skills */}
                                    {(() => {
                                        const fp = selectedFreelancer.freelancerProfile;
                                        const tech = fp?.technicalSkills || (fp?.skills?.length > 0 && !fp?.technicalSkills?.length ? fp.skills : []);
                                        const soft = fp?.softSkills || [];
                                        const hasSkills = (Array.isArray(tech) && tech.length > 0) || (Array.isArray(soft) && soft.length > 0);
                                        if (!hasSkills) return null;
                                        return (
                                            <div>
                                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Skills</h4>
                                                {tech?.length > 0 && (
                                                    <div className="mb-2">
                                                        <span className="text-xs font-bold text-gray-500 uppercase">Technical: </span>
                                                        <div className="flex flex-wrap gap-2 mt-1">{tech.map((s: string) => <span key={s} className="px-3 py-1 bg-[#09BF44] text-white text-sm font-medium rounded-full">{s}</span>)}</div>
                                                    </div>
                                                )}
                                                {soft?.length > 0 && (
                                                    <div>
                                                        <span className="text-xs font-bold text-gray-500 uppercase">Soft: </span>
                                                        <div className="flex flex-wrap gap-2 mt-1">{soft.map((s: string) => <span key={s} className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-full">{s}</span>)}</div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}

                                    {/* Starter Offer */}
                                    {selectedFreelancer.freelancerProfile?.starterOffer?.title && (
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Starter Offer</h4>
                                            <div className="bg-gray-50 p-4 rounded-xl mb-4">
                                                <p className="font-bold text-gray-900 text-lg">{selectedFreelancer.freelancerProfile.starterOffer.title}</p>
                                                {selectedFreelancer.freelancerProfile.starterOffer.subCategory && (
                                                    <span className="inline-block mt-1 px-2 py-0.5 bg-[#09BF44]/10 text-[#09BF44] text-xs font-bold rounded">{selectedFreelancer.freelancerProfile.starterOffer.subCategory}</span>
                                                )}
                                                {selectedFreelancer.freelancerProfile.starterOffer.description && (
                                                    <p className="text-gray-600 text-sm mt-2 leading-relaxed">{selectedFreelancer.freelancerProfile.starterOffer.description}</p>
                                                )}
                                            </div>
                                            {selectedFreelancer.freelancerProfile.starterOffer.packages?.length > 0 && (
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    {selectedFreelancer.freelancerProfile.starterOffer.packages.map((pkg: any, i: number) => (
                                                        <div key={i} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                            <h5 className="font-bold text-[#09BF44] mb-2">{pkg.type || ['Basic', 'Standard', 'Premium'][i]}</h5>
                                                            <p className="text-gray-900 font-bold text-lg">{pkg.price} EGP</p>
                                                            <p className="text-gray-500 text-sm">{pkg.days} day delivery</p>
                                                            <p className="text-gray-500 text-sm">
                                                                Revisions: {formatRevisionsLabel(pkg.revisionsUnlimited, pkg.revisions)}
                                                            </p>
                                                            {pkg.features?.filter((f: string) => f?.trim()).length > 0 && (
                                                                <ul className="mt-2 space-y-1 text-sm text-gray-600">
                                                                    {pkg.features.filter((f: string) => f?.trim()).map((f: string, j: number) => (
                                                                        <li key={j} className="flex items-start gap-1"><Check className="w-4 h-4 text-[#09BF44] shrink-0 mt-0.5" /><span>{f}</span></li>
                                                                    ))}
                                                                </ul>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Starter Pricing (legacy - if no starterOffer) */}
                                    {!selectedFreelancer.freelancerProfile?.starterOffer?.title && selectedFreelancer.freelancerProfile?.starterPricing && (
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Starter Pricing</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {(['basic', 'standard', 'premium'] as const).map((tier) => {
                                                    const pkg = selectedFreelancer.freelancerProfile.starterPricing[tier];
                                                    return pkg ? (
                                                        <div key={tier} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                            <h5 className="font-bold capitalize text-[#09BF44] mb-2">{tier}</h5>
                                                            <p className="text-gray-900 font-bold text-lg">{pkg.price} EGP</p>
                                                            <p className="text-gray-500 text-sm">{pkg.days} day delivery</p>
                                                            {pkg.description && <p className="text-gray-600 text-sm mt-2">{pkg.description}</p>}
                                                        </div>
                                                    ) : null;
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Portfolio */}
                                    {selectedFreelancer.freelancerProfile?.portfolio?.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Portfolio</h4>
                                            <div className="space-y-3">
                                                {selectedFreelancer.freelancerProfile.portfolio.filter((p: any) => p?.title?.trim()).map((item: any, i: number) => (
                                                    <div key={i} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                        <p className="font-bold text-gray-900">{item.title}</p>
                                                        {item.subCategory && <span className="text-xs text-gray-500">{item.subCategory}</span>}
                                                        {item.description && <p className="text-gray-600 text-sm mt-1">{item.description}</p>}
                                                        {item.link && <a href={item.link.startsWith('http') ? item.link : `https://${item.link}`} target="_blank" rel="noopener noreferrer" className="text-sm text-[#09BF44] hover:underline mt-1 inline-block">View project →</a>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Signup Notes */}
                                    {selectedFreelancer.freelancerProfile?.signupNotes && (
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Signup Notes</h4>
                                            <p className="text-gray-700 bg-gray-50 p-4 rounded-xl leading-relaxed whitespace-pre-wrap">{selectedFreelancer.freelancerProfile.signupNotes}</p>
                                        </div>
                                    )}

                                    {/* Withdrawal Methods */}
                                    {selectedFreelancer.withdrawalMethods?.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Withdrawal Methods</h4>
                                            <div className="space-y-3">
                                                {selectedFreelancer.withdrawalMethods.map((wm: any, i: number) => (
                                                    <div key={i} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                        <span className="inline-block px-2 py-0.5 bg-[#09BF44]/10 text-[#09BF44] text-xs font-bold rounded capitalize">{wm.method?.replace('_', ' ')}</span>
                                                        {(wm.method === 'vodafone_cash' || wm.method === 'instapay') && wm.phoneNumber && <p className="text-gray-900 font-medium mt-2">{wm.phoneNumber}</p>}
                                                        {wm.method === 'bank' && (wm.accountNumber || wm.bankName) && <p className="text-gray-900 font-medium mt-2">{wm.bankName}{wm.bankName && wm.accountNumber ? ' · ' : ''}{wm.accountNumber}</p>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Documents */}
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Documents</h4>
                                        <div className="space-y-4">
                                            {/* Government ID - required for all freelancers */}
                                            <div className="bg-gray-50 p-4 rounded-xl">
                                                <p className="text-xs font-bold text-gray-400 mb-2">Government ID</p>
                                                {selectedFreelancer.freelancerProfile?.idDocument ? (
                                                    <a href={`${selectedFreelancer.freelancerProfile.idDocument}?token=${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline font-medium">
                                                        <FileText className="w-4 h-4" /> View Document
                                                    </a>
                                                ) : (
                                                    <p className="text-sm text-gray-400">None uploaded</p>
                                                )}
                                            </div>
                                            {/* University ID - for students only */}
                                            {selectedFreelancer.freelancerProfile?.isStudent && (
                                                <div className="bg-gray-50 p-4 rounded-xl">
                                                    <p className="text-xs font-bold text-gray-400 mb-2">University ID</p>
                                                    {selectedFreelancer.freelancerProfile?.universityId ? (
                                                        <a href={`${selectedFreelancer.freelancerProfile.universityId}?token=${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline font-medium">
                                                            <FileText className="w-4 h-4" /> View University ID
                                                        </a>
                                                    ) : (
                                                        <p className="text-sm text-gray-400">None uploaded</p>
                                                    )}
                                                </div>
                                            )}
                                            {/* Certifications - name, date, institute, optional document */}
                                            {(selectedFreelancer.freelancerProfile?.certifications?.length > 0 || (selectedFreelancer.freelancerProfile?.certificates?.length > 0 && !selectedFreelancer.freelancerProfile?.certifications?.length)) ? (
                                                <div>
                                                    <p className="text-xs font-bold text-gray-400 mb-2">Certifications</p>
                                                    {selectedFreelancer.freelancerProfile?.certifications?.length > 0 ? (
                                                        <div className="space-y-2">
                                                            {selectedFreelancer.freelancerProfile.certifications.map((c: any, i: number) => (
                                                                <div key={i} className="bg-gray-50 p-4 rounded-xl flex flex-wrap items-center justify-between gap-2">
                                                                    <div>
                                                                        <span className="font-bold">{c.name || `Certification ${i + 1}`}</span>
                                                                        {(c.institute || c.date) && (
                                                                            <span className="text-sm text-gray-600 block mt-1">
                                                                                {c.institute}{c.date ? ` • ${formatDateDDMMYYYY(c.date)}` : ''}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {c.documentUrl && (
                                                                        <a href={c.documentUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline font-medium flex items-center gap-1 shrink-0">
                                                                            <FileText className="w-4 h-4" /> View document
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {(selectedFreelancer.freelancerProfile?.certificates || []).filter(Boolean).map((url: string, i: number) => (
                                                                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline font-medium block bg-gray-50 p-4 rounded-xl">
                                                                    <FileText className="w-4 h-4" /> Certificate {i + 1}
                                                                </a>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>

                                    {/* Approve / Reject */}
                                    <div className="flex gap-4 pt-4 border-t border-gray-100">
                                        <button
                                            onClick={async () => {
                                                await handleApprove(selectedFreelancer._id);
                                                setSelectedFreelancer(null);
                                            }}
                                            className="flex-1 bg-[#09BF44] hover:bg-[#07a63a] text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Check className="w-5 h-5" /> Approve Freelancer
                                        </button>
                                        <button
                                            onClick={() => handleReject(selectedFreelancer._id)}
                                            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                                        >
                                            <X className="w-5 h-5" /> Reject & Delete
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'rewards' && (
                    <div className="space-y-8">
                        <div className="bg-gradient-to-r from-[#09BF44] to-[#07a63a] p-8 rounded-3xl text-white shadow-xl border border-[#09BF44]/20">
                            <h2 className="text-2xl font-bold mb-2">Employee of the Month Recognition</h2>
                            <p className="opacity-90">Highlighting top talent based on real performance metrics.</p>
                        </div>

                        {topFreelancers ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Most Completed Deals */}
                                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <Briefcase className="w-24 h-24 text-gray-900" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center text-blue-600 mb-4">
                                            <TrendingUp className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-gray-500 font-bold uppercase text-xs tracking-wider mb-1">Most Deals</h3>
                                        {topFreelancers.mostDeals ? (
                                            <>
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">
                                                        {topFreelancers.mostDeals.firstName[0]}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-lg text-gray-900 leading-tight">{topFreelancers.mostDeals.firstName} {topFreelancers.mostDeals.lastName}</h4>
                                                        <p className="text-blue-600 font-black">{topFreelancers.mostDeals.value}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleToggleReward(topFreelancers.mostDeals._id, 'mostDeals')}
                                                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${topFreelancers.mostDeals.freelancerProfile?.rewardMostDeals ? 'bg-green-100 text-green-700' : 'bg-[#09BF44] text-white hover:bg-[#07a63a]'}`}
                                                >
                                                    <Award className="w-4 h-4" />
                                                    {topFreelancers.mostDeals.freelancerProfile?.rewardMostDeals ? 'Current Winner' : 'Select Winner'}
                                                </button>
                                            </>
                                        ) : <p className="text-gray-400 italic">No data yet</p>}
                                    </div>
                                </div>

                                {/* Top Rated */}
                                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <Star className="w-24 h-24 text-yellow-500" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="bg-yellow-50 w-12 h-12 rounded-xl flex items-center justify-center text-yellow-600 mb-4">
                                            <Star className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-gray-500 font-bold uppercase text-xs tracking-wider mb-1">Highest Rated</h3>
                                        {topFreelancers.topRated ? (
                                            <>
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">
                                                        {topFreelancers.topRated.firstName[0]}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-lg text-gray-900 leading-tight">{topFreelancers.topRated.firstName} {topFreelancers.topRated.lastName}</h4>
                                                        <p className="text-yellow-600 font-black">{topFreelancers.topRated.value}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleToggleReward(topFreelancers.topRated._id, 'topRated')}
                                                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${topFreelancers.topRated.freelancerProfile?.rewardTopRated ? 'bg-green-100 text-green-700' : 'bg-[#09BF44] text-white hover:bg-[#07a63a]'}`}
                                                >
                                                    <Award className="w-4 h-4" />
                                                    {topFreelancers.topRated.freelancerProfile?.rewardTopRated ? 'Current Winner' : 'Select Winner'}
                                                </button>
                                            </>
                                        ) : <p className="text-gray-400 italic">No data yet</p>}
                                    </div>
                                </div>

                                {/* On Time Delivery */}
                                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <TrendingUp className="w-24 h-24 text-green-500" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="bg-green-50 w-12 h-12 rounded-xl flex items-center justify-center text-green-600 mb-4">
                                            <Check className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-gray-500 font-bold uppercase text-xs tracking-wider mb-1">Best Reliability</h3>
                                        {topFreelancers.onTime ? (
                                            <>
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">
                                                        {topFreelancers.onTime.firstName[0]}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-lg text-gray-900 leading-tight">{topFreelancers.onTime.firstName} {topFreelancers.onTime.lastName}</h4>
                                                        <p className="text-green-600 font-black">{topFreelancers.onTime.value}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleToggleReward(topFreelancers.onTime._id, 'onTime')}
                                                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${topFreelancers.onTime.freelancerProfile?.rewardOnTime ? 'bg-green-100 text-green-700' : 'bg-[#09BF44] text-white hover:bg-[#07a63a]'}`}
                                                >
                                                    <Award className="w-4 h-4" />
                                                    {topFreelancers.onTime.freelancerProfile?.rewardOnTime ? 'Current Winner' : 'Select Winner'}
                                                </button>
                                            </>
                                        ) : <p className="text-gray-400 italic">No data yet</p>}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-gray-300" /></div>
                        )}
                    </div>
                )}

                {activeTab === 'chats' && (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
                        {!selectedChat ? (
                            <>
                                <div className="p-6 border-b border-gray-100 flex flex-wrap justify-between items-center gap-3 flex-shrink-0">
                                    <h3 className="text-lg font-bold">Active Conversations</h3>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSupportChatModalOpen(true);
                                                setSupportUserQuery('');
                                                setSupportUserPick(null);
                                            }}
                                            className="px-4 py-2 rounded-xl bg-[#09BF44] text-white text-sm font-bold hover:bg-[#07a63a] flex items-center gap-2"
                                        >
                                            <UserPlus className="w-4 h-4" /> New support chat
                                        </button>
                                        <span className="text-xs font-bold bg-gray-100 px-3 py-1 rounded-full text-gray-500">{activeChats.length} Active</span>
                                    </div>
                                </div>
                                <div className="divide-y divide-gray-100 flex-1 min-h-0 overflow-y-auto">
                                    {chatsLoading ? (
                                        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-[#09BF44]" /></div>
                                    ) : activeChats.length === 0 ? (
                                        <div className="p-12 text-center text-gray-500">No active chats yet.</div>
                                    ) : activeChats.map((chat) => {
                                        const participants = chat.participants || [];
                                        const participant1 = participants[0];
                                        const participant2 = participants[1];
                                        const participant1Initial = participant1?.firstName?.[0]?.toUpperCase() || 'U';
                                        const participant2Initial = participant2?.firstName?.[0]?.toUpperCase() || 'U';
                                        const p1Pic = participant1?.freelancerProfile?.profilePicture || participant1?.clientProfile?.profilePicture;
                                        const p2Pic = participant2?.freelancerProfile?.profilePicture || participant2?.clientProfile?.profilePicture;
                                        const p1Id = participant1?._id != null ? String(participant1._id) : '';
                                        const p2Id = participant2?._id != null ? String(participant2._id) : '';
                                        const p1Online = p1Id ? (userPresenceById[p1Id] ?? !!participant1?.isOnline) : false;
                                        const p2Online = p2Id ? (userPresenceById[p2Id] ?? !!participant2?.isOnline) : false;
                                        const participantNames = chat.kind === 'support' && participants.length >= 2
                                            ? `Engezhaly Team & ${participants.find((p: any) => !(p?.firstName === 'Engezhaly' && p?.lastName === 'Team'))?.firstName || 'User'}`
                                            : participants.length >= 2
                                                ? `${participant1?.firstName || 'Unknown'} & ${participant2?.firstName || 'Unknown'}`
                                                : participants.length === 1
                                                    ? `${participant1?.firstName || 'Unknown'}`
                                                    : 'Unknown Users';

                                        return (
                                            <div
                                                key={chat._id}
                                                onClick={() => handleSelectChat(chat)}
                                                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-3 flex-1">
                                                    <div className="flex -space-x-2">
                                                        {participants.length > 0 && (
                                                            <AdminAvatarWithPresence
                                                                src={p1Pic}
                                                                initial={participant1Initial}
                                                                online={p1Online}
                                                                initialBgClass="bg-blue-100 text-blue-600"
                                                            />
                                                        )}
                                                        {participants.length > 1 && (
                                                            <AdminAvatarWithPresence
                                                                src={p2Pic}
                                                                initial={participant2Initial}
                                                                online={p2Online}
                                                                initialBgClass="bg-purple-100 text-purple-600"
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-sm text-gray-900 truncate">{participantNames}</h4>
                                                        <p className="text-xs text-gray-500 truncate">
                                                            {chat.kind === 'support' && <span className="font-bold text-[#09BF44] mr-1">Support</span>}
                                                            {chat.updatedAt ? `Last active ${formatDateDDMMYYYY(chat.updatedAt)}` : 'No activity'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {chat.adminHasUnread && (
                                                        <span className="bg-red-600 text-white text-[10px] font-black uppercase px-2 py-1 rounded-full">
                                                            Unread
                                                        </span>
                                                    )}
                                                    {chat.isFrozen && (
                                                        <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
                                                            <Flag className="w-3 h-3" /> Frozen
                                                        </span>
                                                    )}
                                                    {!chat.isFrozen && !chat.adminHasUnread && (
                                                        <span className="text-xs text-gray-400">Active</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Chat Detail View */}
                                <div className="p-6 border-b border-gray-100 flex items-center gap-4 flex-shrink-0">
                                    <button
                                        onClick={() => {
                                            setSelectedChat(null);
                                            setChatMessages([]);
                                            setChatOffers([]);
                                        }}
                                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="flex -space-x-2">
                                            {selectedChat.participants?.map((p: any, idx: number) => {
                                                const pic = p?.freelancerProfile?.profilePicture || p?.clientProfile?.profilePicture;
                                                const pid = p?._id != null ? String(p._id) : '';
                                                const pOnline = pid ? (userPresenceById[pid] ?? !!p.isOnline) : false;
                                                const initialBg = idx === 0 ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600';
                                                return (
                                                    <AdminAvatarWithPresence
                                                        key={pid || idx}
                                                        src={pic}
                                                        initial={p?.firstName?.[0]?.toUpperCase() || 'U'}
                                                        online={pOnline}
                                                        initialBgClass={initialBg}
                                                    />
                                                );
                                            })}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">
                                                {selectedChat.kind === 'support' && selectedChat.participants?.length >= 2
                                                    ? `Engezhaly Team & ${selectedChat.participants.find((p: any) => !(p?.firstName === 'Engezhaly' && p?.lastName === 'Team'))?.firstName || 'User'}`
                                                    : selectedChat.participants?.map((p: any) => p?.firstName).filter(Boolean).join(' & ') || 'Unknown Users'}
                                            </h3>
                                            {selectedChat.participants && selectedChat.participants.length > 0 && (
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {selectedChat.participants.map((p: any) => {
                                                        const pid = p?._id != null ? String(p._id) : '';
                                                        const on = pid ? (userPresenceById[pid] ?? !!p.isOnline) : false;
                                                        const label = p?.firstName || 'User';
                                                        return `${label}: ${on ? 'Online' : 'Offline'}`;
                                                    }).join(' · ')}
                                                </p>
                                            )}
                                            {selectedChat.isFrozen && (
                                                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1 mt-1">
                                                    <Flag className="w-3 h-3" /> Frozen
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {selectedChat.isFrozen ? (
                                            <button
                                                onClick={async () => {
                                                    await handleUnfreeze(selectedChat._id);
                                                    setSelectedChat({ ...selectedChat, isFrozen: false });
                                                }}
                                                className="px-4 py-2 bg-green-100 text-green-600 rounded-lg text-sm font-bold hover:bg-green-200 transition-colors flex items-center gap-2"
                                            >
                                                <Check className="w-4 h-4" /> Unfreeze
                                            </button>
                                        ) : (
                                            <button
                                                onClick={async () => {
                                                    await handleFreeze(selectedChat._id);
                                                    setSelectedChat({ ...selectedChat, isFrozen: true });
                                                }}
                                                className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-200 transition-colors flex items-center gap-2"
                                            >
                                                <Ban className="w-4 h-4" /> Freeze
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Messages */}
                                <div ref={adminChatMessagesScrollRef} className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 bg-gray-50">
                                    <AdminChatMergedFeed messages={chatMessages} offers={chatOffers} selectedChat={selectedChat} />
                                    {chatMessages.length === 0 && chatOffers.length === 0 && (
                                        <div className="text-center py-12 text-gray-400">
                                            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                            <p>No messages yet.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Admin Message Input */}
                                <div className="p-6 border-t border-gray-200 bg-white flex-shrink-0">
                                    <form onSubmit={handleSendAdminMessage} className="flex items-center gap-3">
                                        <input
                                            type="text"
                                            value={adminMessageInput}
                                            onChange={(e) => setAdminMessageInput(e.target.value)}
                                            placeholder="Type a message as admin..."
                                            className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-sm"
                                        />
                                        <button
                                            type="submit"
                                            className="px-6 py-2 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-colors font-bold flex items-center gap-2"
                                        >
                                            <Send className="w-4 h-4" />
                                            Send as Admin
                                        </button>
                                    </form>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'strikes' && (
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                            <div className="p-8 text-center border-b border-gray-100 bg-gray-50/50">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                                    <Ban className="w-8 h-8" />
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 mb-2">Manage Strikes & Bans</h2>
                                <p className="text-gray-500">Search for a user to perform this action.</p>
                            </div>

                            <div className="p-8">
                                <div className="flex gap-2 mb-6">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            placeholder="Search by name, username, email, or ID"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#09BF44] transition-all"
                                        />
                                    </div>
                                    <button
                                        onClick={handleSearchUser}
                                        disabled={loading}
                                        className="bg-[#09BF44] text-white px-6 rounded-xl font-bold hover:bg-[#07a63a] transition-colors disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
                                    </button>
                                </div>

                                {strikeSearchMatches.length > 0 && (
                                    <div className="mb-6 rounded-xl border border-gray-200 bg-white max-h-56 overflow-y-auto divide-y divide-gray-100">
                                        {strikeSearchMatches.map((u: any) => (
                                            <button
                                                key={u._id}
                                                type="button"
                                                onClick={() => {
                                                    setSearchResult(u);
                                                    setStrikeSearchMatches([]);
                                                }}
                                                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                                            >
                                                <p className="font-bold text-gray-900">
                                                    {u.firstName} {u.lastName}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {u.email} · @{u.username} · {u.role}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {searchResult && (
                                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 animate-in fade-in slide-in-from-bottom-4">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-12 h-12 bg-[#09BF44] rounded-full flex items-center justify-center text-white font-bold text-xl">
                                                {searchResult.firstName[0]}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-lg text-gray-900">{searchResult.firstName} {searchResult.lastName}</h4>
                                                <p className="text-sm text-gray-500">{searchResult.email}</p>
                                                <span className="inline-block mt-1 text-xs font-bold bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-500 capitalize">{searchResult.role}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleAddStrike(searchResult._id)}
                                            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Ban className="w-5 h-5" /> Add Strike ({searchResult.strikes || 0})
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* Edit Modal */}
            {editModal.type === 'user' && (
                <EditModal
                    isOpen={editModal.isOpen}
                    onClose={() => setEditModal({ isOpen: false, type: null, data: null })}
                    onSave={handleSaveUser}
                    title="Edit User"
                    fields={[
                        { name: 'firstName', label: 'First Name', defaultValue: editModal.data?.firstName || '' },
                        { name: 'lastName', label: 'Last Name', defaultValue: editModal.data?.lastName || '' },
                        { name: 'email', label: 'Email', defaultValue: editModal.data?.email || '' },
                        { name: 'role', label: 'Role', type: 'select', options: ['client', 'freelancer', 'admin'], defaultValue: editModal.data?.role || 'client' }
                    ]}
                />
            )}

            {editModal.type === 'project' && (
                <EditModal
                    isOpen={editModal.isOpen}
                    onClose={() => setEditModal({ isOpen: false, type: null, data: null })}
                    onSave={handleSaveProject}
                    title="Edit Project"
                    fields={[
                        { name: 'title', label: 'Title', defaultValue: editModal.data?.title || '' },
                        { name: 'isActive', label: 'Is Active', type: 'select', options: ['true', 'false'], defaultValue: String(editModal.data?.isActive ?? true) }
                    ]}
                />
            )}

            {editModal.type === 'job' && (
                <EditModal
                    isOpen={editModal.isOpen}
                    onClose={() => setEditModal({ isOpen: false, type: null, data: null })}
                    onSave={handleSaveJob}
                    title="Edit Job"
                    fields={[
                        { name: 'title', label: 'Title', defaultValue: editModal.data?.title || '' },
                        { name: 'status', label: 'Status', type: 'select', options: ['open', 'in_progress', 'completed', 'closed'], defaultValue: editModal.data?.status || 'open' }
                    ]}
                />
            )}

            {supportChatModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold mb-2">New support chat</h3>
                        <p className="text-sm text-gray-600 mb-4">Search by username, email, or user ID. A conversation will open between Engezhaly Team and this user.</p>
                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={supportUserQuery}
                                onChange={(e) => setSupportUserQuery(e.target.value)}
                                placeholder="Search query"
                                className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm"
                            />
                            <button
                                type="button"
                                disabled={supportUserSearchLoading || !supportUserQuery.trim()}
                                onClick={async () => {
                                    setSupportUserSearchLoading(true);
                                    try {
                                        const u = await api.admin.searchUser(supportUserQuery.trim());
                                        setSupportUserPick(u);
                                    } catch {
                                        setSupportUserPick(null);
                                        showModal({ title: 'Not found', message: 'No user matched that search.', type: 'error' });
                                    } finally {
                                        setSupportUserSearchLoading(false);
                                    }
                                }}
                                className="px-4 py-2 bg-gray-900 text-white rounded-xl font-bold text-sm disabled:opacity-50"
                            >
                                {supportUserSearchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Find'}
                            </button>
                        </div>
                        {supportUserPick && (
                            <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100">
                                <p className="font-bold text-gray-900">{supportUserPick.firstName} {supportUserPick.lastName}</p>
                                <p className="text-sm text-gray-500">{supportUserPick.email}</p>
                                <p className="text-xs text-gray-400 mt-1">@{supportUserPick.username} · {supportUserPick.role}</p>
                            </div>
                        )}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setSupportChatModalOpen(false);
                                    setSupportUserPick(null);
                                    setSupportUserQuery('');
                                }}
                                className="flex-1 py-2 rounded-xl font-bold border border-gray-200 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={!supportUserPick?._id}
                                onClick={async () => {
                                    if (!supportUserPick?._id) return;
                                    try {
                                        const conv = await api.admin.createSupportConversation(supportUserPick._id);
                                        setSupportChatModalOpen(false);
                                        setSupportUserPick(null);
                                        setSupportUserQuery('');
                                        await fetchChats();
                                        await handleSelectChat(conv);
                                        setActiveTab('chats');
                                    } catch (e: any) {
                                        showModal({ title: 'Error', message: e.message || 'Failed to create chat', type: 'error' });
                                    }
                                }}
                                className="flex-1 py-2 rounded-xl font-bold bg-[#09BF44] text-white hover:bg-[#07a63a] disabled:opacity-50"
                            >
                                Open chat
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {withdrawRejectTarget && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold mb-2">Reject withdrawal</h3>
                        <p className="text-gray-600 text-sm mb-4">
                            The freelancer will be refunded their amount plus fee. A reason is required and will be shown on their wallet page.
                        </p>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Rejection reason</label>
                        <textarea
                            value={withdrawRejectReason}
                            onChange={(e) => setWithdrawRejectReason(e.target.value)}
                            placeholder="Explain why this withdrawal was rejected"
                            className="w-full border border-gray-200 rounded-xl px-4 py-2 min-h-[100px] text-sm mb-4"
                            rows={4}
                        />
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setWithdrawRejectTarget(null);
                                    setWithdrawRejectReason('');
                                }}
                                className="flex-1 py-2 rounded-xl font-bold border border-gray-200 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    const r = withdrawRejectReason.trim();
                                    if (!r) {
                                        showModal({ title: 'Reason required', message: 'Please enter a rejection reason.', type: 'error' });
                                        return;
                                    }
                                    try {
                                        await api.admin.rejectWithdrawal(withdrawRejectTarget._id, r);
                                        showModal({ title: 'Rejected', message: 'Withdrawal rejected and freelancer refunded.', type: 'success' });
                                        setWithdrawRejectTarget(null);
                                        setWithdrawRejectReason('');
                                        fetchWithdrawals();
                                    } catch (e: any) {
                                        showModal({ title: 'Error', message: e.message || 'Failed to reject', type: 'error' });
                                    }
                                }}
                                className="flex-1 py-2 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700"
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Dispute Resolution Modal */}
            {disputeModal.isOpen && disputeModal.order && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-bold mb-4">Resolve Dispute</h3>
                        <p className="text-gray-600 text-sm mb-4">
                            Order: <strong>{disputeModal.order.projectId?.title || 'Custom Offer'}</strong> ({disputeModal.order.amount} EGP)
                        </p>
                        {disputeModal.order.disputeReason && (
                            <p className="text-amber-700 bg-amber-50 p-3 rounded-xl text-sm mb-4 break-words">
                                <strong>Reason:</strong> {disputeModal.order.disputeReason}
                            </p>
                        )}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Outcome</label>
                                <select
                                    value={disputeResolveMode}
                                    onChange={(e) => setDisputeResolveMode(e.target.value as 'release' | 'refund' | 'manual' | 'reopen')}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2"
                                >
                                    <option value="release">Release money to freelancer</option>
                                    <option value="refund">Refund money to client</option>
                                    <option value="manual">Split (manual %) — net after platform fee</option>
                                    <option value="reopen">Solve manually — reopen order (active)</option>
                                </select>
                            </div>
                            {disputeResolveMode === 'manual' && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Freelancer share of net payout (% after platform fee): {freelancerSplitPct}%
                                    </label>
                                    <input
                                        type="range"
                                        min={0}
                                        max={100}
                                        value={freelancerSplitPct}
                                        onChange={(e) => setFreelancerSplitPct(Number(e.target.value))}
                                        className="w-full"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Client receives the remainder (after fee) as wallet credit.</p>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Resolution (shown to client & freelancer; use admin notes for internal detail)</label>
                                <textarea
                                    value={disputeOutcome}
                                    onChange={(e) => setDisputeOutcome(e.target.value)}
                                    placeholder="e.g. After review, we released funds / issued a partial refund."
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2 min-h-[80px]"
                                    rows={3}
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => {
                                    setDisputeModal({ isOpen: false, order: null });
                                    setDisputeOutcome('');
                                    setDisputeResolveMode('release');
                                    setFreelancerSplitPct(50);
                                }}
                                className="flex-1 py-2 rounded-xl font-bold border border-gray-200 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    setResolvingDispute(true);
                                    try {
                                        const out = disputeOutcome.trim();
                                        const base: Record<string, unknown> = { disputeOutcome: out || undefined };
                                        if (disputeResolveMode === 'reopen') {
                                            base.status = 'active';
                                        } else if (disputeResolveMode === 'refund') {
                                            base.status = 'refunded';
                                        } else if (disputeResolveMode === 'manual') {
                                            base.status = 'completed';
                                            base.disputeResolutionType = 'manual_split';
                                            base.freelancerSplitPercent = freelancerSplitPct;
                                        } else {
                                            base.status = 'completed';
                                            base.disputeResolutionType = 'release';
                                        }
                                        await api.admin.updateOrder(disputeModal.order._id, base);
                                        showModal({ title: 'Dispute Resolved', message: 'Both parties have been notified.', type: 'success' });
                                        setDisputeModal({ isOpen: false, order: null });
                                        setDisputeOutcome('');
                                        setDisputeResolveMode('release');
                                        setFreelancerSplitPct(50);
                                        fetchOrders();
                                        fetchDisputes();
                                    } catch (e: any) {
                                        showModal({ title: 'Error', message: e.message || 'Failed to resolve dispute', type: 'error' });
                                    } finally {
                                        setResolvingDispute(false);
                                    }
                                }}
                                disabled={resolvingDispute}
                                className="flex-1 py-2 rounded-xl font-bold bg-[#09BF44] text-white hover:bg-[#08a83a] disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {resolvingDispute ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                Resolve
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
