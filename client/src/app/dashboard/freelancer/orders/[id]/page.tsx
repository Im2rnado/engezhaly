"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useModal } from '@/context/ModalContext';
import { Loader2, MessageSquare, PanelLeft, Flag, ArrowLeft, X } from 'lucide-react';
import FreelancerSidebar from '@/components/FreelancerSidebar';
import DashboardMobileTopStrip from '@/components/DashboardMobileTopStrip';
import CountdownTimer from '@/components/CountdownTimer';
import {
    formatDateDDMMYYYY,
    formatOrderStatusForParty,
    formatRevisionsLabel,
    getOrderDeliveryDeadlineIso,
    orderStatusBadgeClassForParty,
    orderStatusShowsDeliveryCountdown
} from '@/lib/utils';

export default function FreelancerOrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { showModal } = useModal();
    const id = typeof params?.id === 'string' ? params.id : '';

    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    const [workOpen, setWorkOpen] = useState(false);
    const [submittingWork, setSubmittingWork] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [workSubmission, setWorkSubmission] = useState({ message: '', links: '', files: [] as File[] });
    const [disputeOpen, setDisputeOpen] = useState(false);
    const [disputeReason, setDisputeReason] = useState('');
    const [disputeSubmitting, setDisputeSubmitting] = useState(false);

    const [milestoneSubmitIndex, setMilestoneSubmitIndex] = useState<number | null>(null);
    const [milestoneWork, setMilestoneWork] = useState({ message: '', links: '', files: [] as File[] });
    const [milestoneSubmitting, setMilestoneSubmitting] = useState(false);
    const [milestoneUploadProgress, setMilestoneUploadProgress] = useState<number | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/');
            return;
        }
        setUser(JSON.parse(localStorage.getItem('user') || '{}'));

        const load = async () => {
            try {
                const profileData = await api.freelancer.getProfile();
                setProfile(profileData);
                if (profileData.role !== 'freelancer') {
                    router.push('/');
                    return;
                }
                const o = await api.freelancer.getOrder(id);
                setOrder(o);
            } catch (e: any) {
                showModal({ title: 'Error', message: e.message || 'Could not load order', type: 'error' });
                router.push('/dashboard/freelancer?tab=orders');
            } finally {
                setLoading(false);
            }
        };
        if (id) load();
    }, [id, router, showModal]);

    const toggleBusy = async () => {
        try {
            const newStatus = !profile?.freelancerProfile?.isBusy;
            const updated = await api.freelancer.updateProfile({ isBusy: newStatus });
            setProfile(updated);
            showModal({ title: 'Success', message: `Status updated to ${newStatus ? 'Busy' : 'Available'}`, type: 'success' });
        } catch {
            showModal({ title: 'Error', message: 'Failed to update status', type: 'error' });
        }
    };

    const refreshOrder = async () => {
        try {
            const o = await api.freelancer.getOrder(id);
            setOrder(o);
        } catch { /* ignore */ }
    };

    const openChatWithClient = async () => {
        if (!order) return;
        try {
            const clientId = String(order?.buyerId?._id || order?.buyerId || '');
            if (!clientId) {
                showModal({ title: 'Error', message: 'Client not found', type: 'error' });
                return;
            }
            const conversations = await api.chat.getConversations();
            let conversation = (conversations || []).find((c: any) =>
                String(c.partnerId?._id || c.partnerId) === clientId
            );
            if (!conversation) {
                await api.chat.sendMessage({
                    receiverId: clientId,
                    content: `Hi! Update regarding order: ${order.projectId?.title || 'your order'}`,
                    messageType: 'text'
                });
                const updated = await api.chat.getConversations();
                conversation = (updated || []).find((c: any) =>
                    String(c.partnerId?._id || c.partnerId) === clientId
                );
            }
            router.push(`/chat?conversation=${conversation?.id || clientId}`);
        } catch (err: any) {
            showModal({ title: 'Error', message: err.message || 'Failed to open chat', type: 'error' });
        }
    };

    const getMilestoneSubmission = (idx: number) => {
        const subs = order?.offerMilestoneSubmissions || [];
        return subs.find((s: { milestoneIndex?: number }) => Number(s.milestoneIndex) === idx);
    };

    const handleSubmitMilestoneWork = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!order || milestoneSubmitIndex == null) return;
        setMilestoneSubmitting(true);
        setMilestoneUploadProgress(null);
        try {
            const fileUrls: string[] = [];
            const files = milestoneWork.files;
            if (files.length > 0) {
                for (let i = 0; i < files.length; i++) {
                    const url = await api.upload.file(files[i], {
                        onProgress: (p) => setMilestoneUploadProgress(Math.round(((i + p / 100) / files.length) * 100))
                    });
                    fileUrls.push(url);
                }
            }
            setMilestoneUploadProgress(100);
            const links = milestoneWork.links.split(/[\n, ]+/).map((l) => l.trim()).filter(Boolean);
            await api.freelancer.submitOrderMilestoneWork(order._id, milestoneSubmitIndex, {
                message: milestoneWork.message,
                links,
                files: fileUrls
            });
            showModal({ title: 'Success', message: 'Phase work submitted!', type: 'success' });
            setMilestoneSubmitIndex(null);
            setMilestoneWork({ message: '', links: '', files: [] });
            await refreshOrder();
        } catch (err: any) {
            showModal({ title: 'Error', message: err.message || 'Failed to submit', type: 'error' });
        } finally {
            setMilestoneSubmitting(false);
            setMilestoneUploadProgress(null);
        }
    };

    const handleSubmitWork = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!order) return;
        setSubmittingWork(true);
        setUploadProgress(null);
        try {
            const fileUrls: string[] = [];
            const files = workSubmission.files;
            if (files.length > 0) {
                for (let i = 0; i < files.length; i++) {
                    const url = await api.upload.file(files[i], {
                        onProgress: (p) => setUploadProgress(Math.round(((i + p / 100) / files.length) * 100))
                    });
                    fileUrls.push(url);
                }
            }
            setUploadProgress(100);
            const links = workSubmission.links.split(/[\n, ]+/).map((l) => l.trim()).filter(Boolean);
            await api.freelancer.submitOrderWork(order._id, {
                message: workSubmission.message,
                links,
                files: fileUrls
            });
            showModal({ title: 'Success', message: 'Work submitted!', type: 'success' });
            setWorkOpen(false);
            setWorkSubmission({ message: '', links: '', files: [] });
            await refreshOrder();
        } catch (err: any) {
            showModal({ title: 'Error', message: err.message || 'Failed to submit', type: 'error' });
        } finally {
            setSubmittingWork(false);
            setUploadProgress(null);
        }
    };

    if (loading || !profile) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#09BF44]" />
            </div>
        );
    }

    if (!order) {
        return null;
    }

    const title = order.projectId?.title || (order.offerId ? 'Custom offer' : 'Order');
    const revLabel = formatRevisionsLabel(order.revisionsUnlimited, order.revisions, 'short');
    const orderDeadlineIso = getOrderDeliveryDeadlineIso(order);
    const showOrderTimer = orderStatusShowsDeliveryCountdown(order.status) && orderDeadlineIso;
    const offer = order.offerId && typeof order.offerId === 'object' ? order.offerId : null;
    const isCustomOffer = !!offer;
    const offerMilestones = Array.isArray(offer?.milestones) && offer.milestones.length > 0 ? offer.milestones : null;

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
            <FreelancerSidebar
                user={user}
                profile={profile}
                onToggleBusy={toggleBusy}
                activeTab="orders"
                mobileOpen={mobileSidebarOpen}
                onCloseMobile={() => setMobileSidebarOpen(false)}
            />
            {mobileSidebarOpen && (
                <button type="button" aria-label="Close sidebar" onClick={() => setMobileSidebarOpen(false)} className="fixed inset-0 bg-black/40 z-30 md:hidden" />
            )}

            <div className="flex-1 md:ml-72 px-4 sm:px-6 md:p-8 pt-3 md:pt-8 pb-8 overflow-y-auto min-h-screen">
                <DashboardMobileTopStrip />
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-3 mb-6">
                        <button type="button" onClick={() => setMobileSidebarOpen(true)} className="md:hidden p-2 rounded-lg border border-gray-200 bg-white">
                            <PanelLeft className="w-5 h-5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push('/dashboard/freelancer?tab=orders')}
                            className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-900"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back to orders
                        </button>
                    </div>

                    {showOrderTimer && orderDeadlineIso && (
                        <div className="mb-6">
                            <CountdownTimer deadline={orderDeadlineIso} variant="detail" />
                        </div>
                    )}

                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-black text-gray-900">{title}</h1>
                                <p className="text-sm text-gray-500 mt-1">
                                    Client: {order.buyerId?.firstName} {order.buyerId?.lastName}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-black text-gray-900">{order.amount} EGP</p>
                                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${orderStatusBadgeClassForParty(order.status)}`}>
                                    {formatOrderStatusForParty(order.status)}
                                </span>
                            </div>
                        </div>

                        {order.disputeResolvedAt && order.disputeResolution && (
                            <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
                                <p className="font-black text-green-800 mb-1">Dispute solved</p>
                                <p className="text-green-900/90 whitespace-pre-wrap break-words">{order.disputeResolution}</p>
                                {order.disputeResolvedAt && (
                                    <p className="text-xs text-green-700/80 mt-2 font-bold">{formatDateDDMMYYYY(order.disputeResolvedAt)}</p>
                                )}
                            </div>
                        )}

                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div>
                                <dt className="font-bold text-gray-500">Package</dt>
                                <dd className="text-gray-900 font-medium">{order.packageType}</dd>
                            </div>
                            <div>
                                <dt className="font-bold text-gray-500">Revisions</dt>
                                <dd className="text-gray-900 font-medium">{revLabel}</dd>
                            </div>
                            <div>
                                <dt className="font-bold text-gray-500">Ordered</dt>
                                <dd className="text-gray-900 font-medium">{formatDateDDMMYYYY(order.createdAt)}</dd>
                            </div>
                            {orderDeadlineIso && (
                                <div>
                                    <dt className="font-bold text-gray-500">Delivery</dt>
                                    <dd className="text-gray-900 font-medium">{formatDateDDMMYYYY(orderDeadlineIso)}</dd>
                                </div>
                            )}
                        </dl>

                        {isCustomOffer && offer?.whatsIncluded && (
                            <div className="min-w-0 max-w-full">
                                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">What&apos;s included</h2>
                                <p className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed break-words overflow-wrap-anywhere min-w-0">
                                    {offer.whatsIncluded}
                                </p>
                            </div>
                        )}

                        {isCustomOffer && offerMilestones && (
                            <div>
                                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Milestones</h2>
                                <ul className="space-y-3 text-sm">
                                    {offerMilestones.map((m: any, i: number) => {
                                        const sub = getMilestoneSubmission(i);
                                        return (
                                            <li key={i} className="rounded-xl border border-gray-100 bg-gray-50 p-3 min-w-0 space-y-2 overflow-hidden">
                                                <div className="flex flex-wrap items-start justify-between gap-2 min-w-0">
                                                    <div className="min-w-0 flex-1">
                                                        <span className="font-bold text-gray-900 break-words [overflow-wrap:anywhere]">{m.name}</span>
                                                        {m.price != null && m.price > 0 && (
                                                            <span className="text-[#09BF44] font-bold ml-2">{m.price} EGP</span>
                                                        )}
                                                        {m.dueDate && (
                                                            <span className="text-gray-500 ml-2 break-words [overflow-wrap:anywhere]">· Due {formatDateDDMMYYYY(m.dueDate)}</span>
                                                        )}
                                                    </div>
                                                    {order.status === 'active' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setMilestoneSubmitIndex(i);
                                                                setMilestoneWork({
                                                                    message: sub?.message || '',
                                                                    links: Array.isArray(sub?.links) ? sub.links.join(', ') : '',
                                                                    files: []
                                                                });
                                                            }}
                                                            className="shrink-0 px-3 py-1.5 rounded-lg bg-[#09BF44] text-white text-xs font-bold hover:bg-[#07a63a]"
                                                        >
                                                            {sub?.updatedAt || sub?.submittedAt ? 'Update phase' : 'Submit phase'}
                                                        </button>
                                                    )}
                                                </div>
                                                {sub?.updatedAt || sub?.submittedAt ? (
                                                    <p className="text-xs text-gray-500">
                                                        Last submitted {new Date(sub.updatedAt || sub.submittedAt).toLocaleString()}
                                                    </p>
                                                ) : null}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}

                        {!isCustomOffer && order.description && (
                            <div className="min-w-0 max-w-full">
                                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Your request</h2>
                                <p className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed break-words overflow-wrap-anywhere min-w-0">
                                    {order.description}
                                </p>
                            </div>
                        )}

                        {order.workSubmission?.updatedAt && (
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <p className="text-xs font-bold text-gray-500 mb-1">Last work submission</p>
                                <p className="text-sm text-gray-700">{new Date(order.workSubmission.updatedAt).toLocaleString()}</p>
                                {order.workSubmission.message && (
                                    <p className="text-sm mt-2 text-gray-800 whitespace-pre-wrap break-words overflow-wrap-anywhere min-w-0 max-w-full">
                                        {order.workSubmission.message}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={openChatWithClient}
                                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl font-bold hover:bg-gray-200 flex items-center gap-2"
                            >
                                <MessageSquare className="w-4 h-4" /> Message client
                            </button>

                            {order.status === 'pending_approval' && (
                                <>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            try {
                                                await api.freelancer.approveOrder(order._id);
                                                showModal({ title: 'Approved', message: 'The client has been notified.', type: 'success' });
                                                await refreshOrder();
                                            } catch (e: any) {
                                                showModal({ title: 'Error', message: e.message || 'Failed', type: 'error' });
                                            }
                                        }}
                                        className="px-5 py-2 rounded-xl font-bold bg-green-600 text-white hover:bg-green-700"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (!confirm('Deny this order?')) return;
                                            try {
                                                await api.freelancer.denyOrder(order._id);
                                                showModal({ title: 'Denied', message: 'The client has been notified.', type: 'success' });
                                                await refreshOrder();
                                            } catch (e: any) {
                                                showModal({ title: 'Error', message: e.message || 'Failed', type: 'error' });
                                            }
                                        }}
                                        className="px-5 py-2 rounded-xl font-bold bg-red-100 text-red-700 hover:bg-red-200"
                                    >
                                        Deny
                                    </button>
                                </>
                            )}

                            {order.status === 'active' && !offerMilestones && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setWorkOpen(true);
                                        setWorkSubmission({
                                            message: order?.workSubmission?.message || '',
                                            links: (order?.workSubmission?.links || []).join(', '),
                                            files: []
                                        });
                                    }}
                                    className="px-5 py-2 rounded-xl font-bold bg-[#09BF44] text-white hover:bg-[#07a63a]"
                                >
                                    {order?.workSubmission?.updatedAt ? 'Update submission' : 'Submit work'}
                                </button>
                            )}

                            {order.status === 'active' && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDisputeReason('');
                                        setDisputeOpen(true);
                                    }}
                                    className="text-amber-700 px-4 py-2 rounded-xl font-bold hover:bg-amber-50 flex items-center gap-2"
                                >
                                    <Flag className="w-4 h-4" /> Dispute
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {milestoneSubmitIndex != null && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white p-6 rounded-3xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-start justify-between mb-4 gap-3">
                            <h2 className="text-xl font-bold text-gray-900 break-words [overflow-wrap:anywhere] min-w-0 flex-1">Submit Milestone</h2>
                            <button
                                type="button"
                                onClick={() => setMilestoneSubmitIndex(null)}
                                className="p-2 hover:bg-gray-100 rounded-full"
                                disabled={milestoneSubmitting}
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <p className="text-sm font-medium text-gray-700 mb-4 break-words [overflow-wrap:anywhere]">
                            {offerMilestones?.[milestoneSubmitIndex]?.name || `Phase ${milestoneSubmitIndex + 1}`}
                        </p>

                        <form onSubmit={handleSubmitMilestoneWork} className="space-y-3">
                            <textarea
                                value={milestoneWork.message}
                                onChange={(e) => setMilestoneWork((p) => ({ ...p, message: e.target.value }))}
                                rows={3}
                                className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none resize-none"
                                placeholder="Notes..."
                            />
                            <textarea
                                value={milestoneWork.links}
                                onChange={(e) => setMilestoneWork((p) => ({ ...p, links: e.target.value }))}
                                rows={2}
                                className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none resize-none"
                                placeholder="Links..."
                            />
                            <input
                                type="file"
                                multiple
                                onChange={(e) => setMilestoneWork((p) => ({ ...p, files: Array.from(e.target.files || []) }))}
                                className="w-full text-sm"
                            />
                            {milestoneUploadProgress !== null && milestoneWork.files.length > 0 && (
                                <p className="text-xs font-bold text-[#09BF44]">Uploading… {milestoneUploadProgress}%</p>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setMilestoneSubmitIndex(null)}
                                    className="flex-1 bg-gray-100 font-bold py-3 rounded-xl"
                                    disabled={milestoneSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={milestoneSubmitting}
                                    className="flex-1 bg-[#09BF44] text-white font-bold py-3 rounded-xl flex justify-center gap-2"
                                >
                                    {milestoneSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Submit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {workOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white p-8 rounded-3xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-start justify-between mb-6 gap-3">
                            <h2 className="text-2xl font-bold text-gray-900 break-words [overflow-wrap:anywhere] min-w-0 flex-1">
                                Submit Work: {order?.projectId?.title || (order?.offerId ? 'Custom offer' : 'Order')}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setWorkOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full"
                                disabled={submittingWork}
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitWork} className="space-y-4">
                            <textarea
                                value={workSubmission.message}
                                onChange={(e) => setWorkSubmission((p) => ({ ...p, message: e.target.value }))}
                                className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none h-28 resize-none"
                                placeholder="Describe what you completed..."
                            />
                            <textarea
                                value={workSubmission.links}
                                onChange={(e) => setWorkSubmission((p) => ({ ...p, links: e.target.value }))}
                                className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none h-24 resize-none"
                                placeholder="Links..."
                            />
                            <input
                                type="file"
                                multiple
                                onChange={(e) => setWorkSubmission((p) => ({ ...p, files: Array.from(e.target.files || []) }))}
                                className="w-full text-sm"
                            />
                            {uploadProgress !== null && workSubmission.files.length > 0 && (
                                <p className="text-xs font-bold text-[#09BF44]">Uploading… {uploadProgress}%</p>
                            )}

                            <div className="flex gap-4 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setWorkOpen(false)}
                                    className="flex-1 bg-gray-100 font-bold p-3 rounded-xl"
                                    disabled={submittingWork}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingWork}
                                    className="flex-1 bg-[#09BF44] text-white font-bold p-3 rounded-xl flex justify-center gap-2"
                                >
                                    {submittingWork && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Submit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {disputeOpen && order && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => !disputeSubmitting && setDisputeOpen(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-6" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Raise a dispute</h3>
                        <p className="text-sm text-gray-600 mb-3">Describe the issue (minimum 10 characters).</p>
                        <textarea
                            value={disputeReason}
                            onChange={(e) => setDisputeReason(e.target.value)}
                            rows={5}
                            disabled={disputeSubmitting}
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:border-[#09BF44] outline-none resize-none mb-4"
                            placeholder="What went wrong?"
                        />
                        <div className="flex justify-end gap-2">
                            <button type="button" disabled={disputeSubmitting} onClick={() => setDisputeOpen(false)} className="px-4 py-2 rounded-xl bg-gray-100 font-bold text-gray-700">
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={disputeSubmitting}
                                onClick={async () => {
                                    const r = disputeReason.trim();
                                    if (r.length < 10) {
                                        showModal({ title: 'Reason required', message: 'Please enter at least 10 characters.', type: 'error' });
                                        return;
                                    }
                                    setDisputeSubmitting(true);
                                    try {
                                        await api.freelancer.raiseDispute(order._id, r);
                                        setDisputeOpen(false);
                                        setDisputeReason('');
                                        showModal({ title: 'Dispute raised', message: 'Our team will review.', type: 'success' });
                                        const o = await api.freelancer.getOrder(id);
                                        setOrder(o);
                                    } catch (e: any) {
                                        showModal({ title: 'Error', message: e.message || 'Failed', type: 'error' });
                                    } finally {
                                        setDisputeSubmitting(false);
                                    }
                                }}
                                className="px-4 py-2 rounded-xl bg-amber-600 text-white font-bold flex items-center gap-2 disabled:opacity-50"
                            >
                                {disputeSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
