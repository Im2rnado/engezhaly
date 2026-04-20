"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useModal } from '@/context/ModalContext';
import { Loader2, MessageSquare, PanelLeft, Flag, ArrowLeft, CheckCircle, Clock, Star } from 'lucide-react';
import ClientSidebar from '@/components/ClientSidebar';
import DashboardMobileTopStrip from '@/components/DashboardMobileTopStrip';
import CountdownTimer from '@/components/CountdownTimer';
import {
    formatDateDDMMYYYY,
    formatOrderStatusForParty,
    formatRevisionsLabel,
    getOrderDeliveryDeadlineIso,
    orderHasClientVisibleDelivery,
    orderStatusBadgeClassForParty,
    orderStatusShowsDeliveryCountdown
} from '@/lib/utils';
import { payWithWalletIfPossible } from '@/lib/payWithWalletIfPossible';
import PaymentChoiceModal from '@/components/PaymentChoiceModal';
import PaymobCheckoutModal from '@/components/PaymobCheckoutModal';

export default function ClientOrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { showModal } = useModal();
    const id = typeof params?.id === 'string' ? params.id : '';

    const [user, setUser] = useState<any>(null);
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [disputeOpen, setDisputeOpen] = useState(false);
    const [disputeReason, setDisputeReason] = useState('');
    const [disputeSubmitting, setDisputeSubmitting] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [paymentChoiceConfig, setPaymentChoiceConfig] = useState<{ type: string; amountCents: number; callbackSuccessUrl?: string; orderId?: string } | null>(null);
    const [checkoutIframeUrl, setCheckoutIframeUrl] = useState<string | null>(null);
    const [reviewOpen, setReviewOpen] = useState(false);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewText, setReviewText] = useState('');
    const [reviewSubmitting, setReviewSubmitting] = useState(false);

    const refreshOrder = async () => {
        try {
            const o = await api.client.getOrder(id);
            setOrder(o);
        } catch {
            /* ignore */
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/');
            return;
        }
        setUser(JSON.parse(localStorage.getItem('user') || '{}'));

        const load = async () => {
            try {
                const o = await api.client.getOrder(id);
                setOrder(o);
            } catch (e: any) {
                showModal({ title: 'Error', message: e.message || 'Could not load order', type: 'error' });
                router.push('/dashboard/client?tab=orders');
            } finally {
                setLoading(false);
            }
        };
        if (id) load();
    }, [id, router, showModal]);

    const openChatWithFreelancer = async () => {
        if (!order) return;
        try {
            const sellerId = String(order?.sellerId?._id || order?.sellerId || '');
            if (!sellerId) {
                showModal({ title: 'Error', message: 'Freelancer not found', type: 'error' });
                return;
            }
            const conversations = await api.chat.getConversations();
            let conversation = (conversations || []).find((c: any) => String(c.partnerId?._id || c.partnerId) === sellerId);
            if (!conversation) {
                await api.chat.sendMessage({
                    receiverId: sellerId,
                    content: `Hi! Regarding my order: ${order.projectId?.title || 'order'}`,
                    messageType: 'text'
                });
                const updated = await api.chat.getConversations();
                conversation = (updated || []).find((c: any) => String(c.partnerId?._id || c.partnerId) === sellerId);
            }
            router.push(`/chat?conversation=${conversation?.id || sellerId}`);
        } catch (err: any) {
            showModal({ title: 'Error', message: err.message || 'Failed to open chat', type: 'error' });
        }
    };

    if (loading || !user) {
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

    const milestoneSubmission = (idx: number) => {
        const subs = order.offerMilestoneSubmissions || [];
        return subs.find((s: { milestoneIndex?: number }) => Number(s.milestoneIndex) === idx);
    };

    const canApproveDelivery = order.status === 'active' && orderHasClientVisibleDelivery(order);

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
            <ClientSidebar user={user} activeTab="orders" mobileOpen={mobileSidebarOpen} onCloseMobile={() => setMobileSidebarOpen(false)} />
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
                            onClick={() => router.push('/dashboard/client?tab=orders')}
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
                                    Freelancer: {order.sellerId?.firstName} {order.sellerId?.lastName}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {order.offerId ? 'Custom offer' : 'Bundle / marketplace offer'}
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
                                <p className="text-green-900/90 whitespace-pre-wrap break-words overflow-wrap-anywhere min-w-0">{order.disputeResolution}</p>
                                <p className="text-xs text-green-700/80 mt-2 font-bold">{formatDateDDMMYYYY(order.disputeResolvedAt)}</p>
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
                            <div>
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
                                        const sub = milestoneSubmission(i);
                                        const hasSub =
                                            sub &&
                                            ((typeof sub.message === 'string' && sub.message.trim()) ||
                                                (Array.isArray(sub.links) && sub.links.some(Boolean)) ||
                                                (Array.isArray(sub.files) && sub.files.some(Boolean)));
                                        return (
                                            <li key={i} className="rounded-xl border border-gray-100 bg-gray-50 p-3 break-words min-w-0 space-y-2">
                                                <div>
                                                    <span className="font-bold text-gray-900 break-words [overflow-wrap:anywhere]">{m.name}</span>
                                                    {m.price != null && m.price > 0 && (
                                                        <span className="text-[#09BF44] font-bold ml-2">{m.price} EGP</span>
                                                    )}
                                                    {m.dueDate && (
                                                        <span className="text-gray-500 ml-2">· Due {formatDateDDMMYYYY(m.dueDate)}</span>
                                                    )}
                                                </div>
                                                {hasSub ? (
                                                    <div className="rounded-lg bg-white border border-gray-100 p-3 text-sm">
                                                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Submitted for this phase</p>
                                                        {sub.message ? (
                                                            <p className="text-gray-800 whitespace-pre-wrap break-words [overflow-wrap:anywhere] min-w-0">{sub.message}</p>
                                                        ) : null}
                                                        {Array.isArray(sub.links) && sub.links.length > 0 && (
                                                            <ul className="mt-2 list-disc list-inside break-all">
                                                                {sub.links.map((link: string, li: number) => (
                                                                    <li key={li}>
                                                                        <a href={link} target="_blank" rel="noopener noreferrer" className="text-[#09BF44] font-bold">
                                                                            {link}
                                                                        </a>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                        {Array.isArray(sub.files) && sub.files.length > 0 && (
                                                            <ul className="mt-2 text-xs text-gray-600">
                                                                {sub.files.map((f: string, fi: number) => (
                                                                    <li key={fi}>
                                                                        <a href={f} target="_blank" rel="noopener noreferrer" className="text-[#09BF44] font-bold break-all">
                                                                            File {fi + 1}
                                                                        </a>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-gray-500">No submission for this phase yet.</p>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}

                        {!isCustomOffer && order.description && (
                            <div>
                                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Your request</h2>
                                <p className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed break-words overflow-wrap-anywhere min-w-0">
                                    {order.description}
                                </p>
                            </div>
                        )}

                        {order.workSubmission && (order.workSubmission.message || (order.workSubmission.links?.length ?? 0) > 0 || (order.workSubmission.files?.length ?? 0) > 0) && (
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 min-w-0 max-w-full">
                                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Submitted work</h2>
                                {order.workSubmission.message && (
                                    <p className="text-sm text-gray-800 whitespace-pre-wrap break-words [overflow-wrap:anywhere] min-w-0">{order.workSubmission.message}</p>
                                )}
                                {Array.isArray(order.workSubmission.links) && order.workSubmission.links.length > 0 && (
                                    <ul className="mt-2 text-sm list-disc list-inside break-all">
                                        {order.workSubmission.links.map((link: string, i: number) => (
                                            <li key={i}>
                                                <a href={link} target="_blank" rel="noopener noreferrer" className="text-[#09BF44] font-bold">
                                                    {link}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}

                        <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={openChatWithFreelancer}
                                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl font-bold hover:bg-gray-200 flex items-center gap-2"
                            >
                                <MessageSquare className="w-4 h-4" /> Message freelancer
                            </button>

                            {order.status === 'pending_approval' && (
                                <button
                                    type="button"
                                    onClick={async () => {
                                        if (!confirm('Cancel this request? The freelancer has not accepted yet.')) return;
                                        try {
                                            await api.client.cancelOrderRequest(order._id);
                                            showModal({ title: 'Cancelled', message: 'Your request was withdrawn.', type: 'success' });
                                            await refreshOrder();
                                        } catch (e: any) {
                                            showModal({ title: 'Error', message: e.message || 'Failed', type: 'error' });
                                        }
                                    }}
                                    className="px-5 py-2 rounded-xl font-bold bg-red-50 text-red-700 hover:bg-red-100"
                                >
                                    Cancel request
                                </button>
                            )}

                            {order.status === 'pending_payment' && (
                                <>
                                    {order.hasPendingInstaPay ? (
                                        <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold bg-amber-100 text-amber-800">
                                            <Clock className="w-4 h-4 shrink-0" /> Pending verification
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                const totalPays = order.amount || 0;
                                                const amountCents = Math.round(totalPays * 100);
                                                const callbackUrl =
                                                    typeof window !== 'undefined'
                                                        ? `${window.location.origin}/dashboard/client/orders/${order._id}?payment_success=1`
                                                        : undefined;
                                                const body = {
                                                    type: 'project_order' as const,
                                                    amountCents,
                                                    callbackSuccessUrl: callbackUrl,
                                                    orderId: order._id
                                                };
                                                const paid = await payWithWalletIfPossible(body, () => {
                                                    showModal({ title: 'Payment Successful', message: 'Payment deducted from your wallet.', type: 'success' });
                                                    refreshOrder();
                                                });
                                                if (paid) return;
                                                setPaymentChoiceConfig(body);
                                            }}
                                            className="bg-[#09BF44] hover:bg-[#07a63a] text-white px-4 py-2 rounded-xl text-sm font-bold"
                                        >
                                            Pay now
                                        </button>
                                    )}
                                </>
                            )}

                            {canApproveDelivery && (
                                    <button
                                        type="button"
                                        disabled={actionLoading}
                                        onClick={async () => {
                                            if (!confirm('Approve the delivered work and release payment?')) return;
                                            setActionLoading(true);
                                            try {
                                                await api.client.approveDelivery(order._id);
                                                const o = await api.client.getOrder(id);
                                                setOrder(o);
                                                if (o.rating == null) {
                                                    setReviewRating(5);
                                                    setReviewText('');
                                                    setReviewOpen(true);
                                                }
                                                showModal({
                                                    title: 'Order completed',
                                                    message:
                                                        o.rating == null
                                                            ? 'Thank you! Please leave a quick review below.'
                                                            : 'Thank you! Your order is complete.',
                                                    type: 'success'
                                                });
                                            } catch (e: any) {
                                                showModal({ title: 'Error', message: e.message || 'Failed', type: 'error' });
                                            } finally {
                                                setActionLoading(false);
                                            }
                                        }}
                                        className="bg-[#09BF44] hover:bg-[#07a63a] text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-70"
                                    >
                                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                        Approve & release payment
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

                            {order.status === 'completed' && order.rating == null && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setReviewRating(5);
                                        setReviewText('');
                                        setReviewOpen(true);
                                    }}
                                    className="bg-[#09BF44] hover:bg-[#07a63a] text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
                                >
                                    <Star className="w-4 h-4" /> Leave review
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

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
                                        await api.client.raiseDispute(order._id, r);
                                        setDisputeOpen(false);
                                        setDisputeReason('');
                                        showModal({ title: 'Dispute raised', message: 'Our team will review.', type: 'success' });
                                        await refreshOrder();
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

            {reviewOpen && order && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => !reviewSubmitting && setReviewOpen(false)}>
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold mb-2 text-gray-900">Leave a review</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            How was your experience with {order.sellerId?.firstName} {order.sellerId?.lastName}?
                        </p>
                        <div className="flex gap-1 mb-4">
                            {[1, 2, 3, 4, 5].map((n) => (
                                <button key={n} type="button" onClick={() => setReviewRating(n)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                                    <Star className={`w-8 h-8 ${n <= reviewRating ? 'fill-amber-400 text-amber-500' : 'text-gray-300'}`} />
                                </button>
                            ))}
                        </div>
                        <textarea
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            placeholder="Write your review (optional)..."
                            rows={4}
                            disabled={reviewSubmitting}
                            className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-[#09BF44] outline-none resize-none mb-4"
                        />
                        <div className="flex gap-2 justify-end">
                            <button type="button" onClick={() => setReviewOpen(false)} className="px-4 py-2 rounded-xl font-bold text-gray-600 hover:bg-gray-100" disabled={reviewSubmitting}>
                                Later
                            </button>
                            <button
                                type="button"
                                disabled={reviewSubmitting}
                                onClick={async () => {
                                    setReviewSubmitting(true);
                                    try {
                                        await api.client.submitReview(order._id, reviewRating, reviewText);
                                        showModal({ title: 'Thank you!', message: 'Your review has been submitted.', type: 'success' });
                                        setReviewOpen(false);
                                        await refreshOrder();
                                    } catch (e: any) {
                                        showModal({ title: 'Error', message: e.message || 'Failed to submit review', type: 'error' });
                                    } finally {
                                        setReviewSubmitting(false);
                                    }
                                }}
                                className="px-4 py-2 bg-[#09BF44] text-white rounded-xl font-bold disabled:opacity-70 flex items-center gap-2"
                            >
                                {reviewSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <PaymobCheckoutModal
                iframeUrl={checkoutIframeUrl}
                title="Complete Payment"
                onClose={() => {
                    setCheckoutIframeUrl(null);
                    refreshOrder();
                }}
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
                            orderId: paymentChoiceConfig.orderId
                        });
                        if (charge.paidFromWallet) {
                            setPaymentChoiceConfig(null);
                            showModal({ title: 'Payment Successful', message: 'Payment deducted from your wallet balance.', type: 'success' });
                            await refreshOrder();
                            return;
                        }
                        setCheckoutIframeUrl(charge.iframeUrl || null);
                    }}
                    onInstaPayComplete={() => {
                        showModal({
                            title: 'Payment Submitted',
                            message: 'Your payment screenshot has been submitted. We will verify and activate your order shortly.',
                            type: 'success'
                        });
                        refreshOrder();
                    }}
                />
            )}
        </div>
    );
}
