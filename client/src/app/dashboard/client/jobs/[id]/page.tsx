"use client";

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Briefcase, Clock, User, ArrowLeft, Loader2, CheckCircle, XCircle, MessageSquare, Link as LinkIcon, Paperclip, PanelLeft, Star } from 'lucide-react';
import { api } from '@/lib/api';
import { formatStatus, formatDateDDMMYYYY } from '@/lib/utils';
import { useModal } from '@/context/ModalContext';
import ClientSidebar from '@/components/ClientSidebar';
import CountdownTimer from '@/components/CountdownTimer';
import DashboardMobileTopStrip from '@/components/DashboardMobileTopStrip';
import PaymobCheckoutModal from '@/components/PaymobCheckoutModal';
import PaymentChoiceModal from '@/components/PaymentChoiceModal';
import { payWithWalletIfPossible } from '@/lib/payWithWalletIfPossible';

/** Matches server: final workSubmission OR all proposal milestones have visible submission */
function proposalReadyForClientApproval(proposal: any) {
    const ws = proposal.workSubmission;
    const hasWs =
        ws &&
        ((typeof ws.message === 'string' && ws.message.trim()) ||
            (Array.isArray(ws.links) && ws.links.some(Boolean)) ||
            (Array.isArray(ws.files) && ws.files.some(Boolean)));
    if (hasWs) return true;
    const ms = proposal.milestones;
    if (!Array.isArray(ms) || ms.length === 0) return false;
    return ms.every((m: any) => {
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
    });
}

function JobDetailPageContent() {
    const { showModal } = useModal();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const jobId = params.id as string;

    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [job, setJob] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [jobDeadline, setJobDeadline] = useState<Date | null>(null);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [checkoutIframeUrl, setCheckoutIframeUrl] = useState<string | null>(null);
    const [paymentChoiceConfig, setPaymentChoiceConfig] = useState<{ type: string; amountCents: number; callbackSuccessUrl?: string; jobId?: string; proposalId?: string } | null>(null);
    const [acceptingProposalId, setAcceptingProposalId] = useState<string | null>(null);
    const [approvingJob, setApprovingJob] = useState(false);
    const [jobReviewModal, setJobReviewModal] = useState<any>(null);
    const [jobReviewRating, setJobReviewRating] = useState(5);
    const [jobReviewText, setJobReviewText] = useState('');
    const [jobReviewSubmitting, setJobReviewSubmitting] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/');
            return;
        }

        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        setUser(storedUser);

        const loadData = async () => {
            try {
                const profileData = await api.client.getProfile();
                setProfile(profileData);
                if (profileData.role !== 'client') {
                    router.push('/');
                    return;
                }

                const jobData = await api.client.getJobById(jobId);
                setJob(jobData);

                // Calculate deadline from accepted proposal
                if (jobData.status === 'in_progress' && jobData.proposals) {
                    const acceptedProposal = jobData.proposals.find((p: any) => p.status === 'accepted');
                    if (acceptedProposal && acceptedProposal.deliveryDays) {
                        // Calculate deadline: job created date + delivery days
                        const createdDate = new Date(jobData.createdAt);
                        const deadline = new Date(createdDate);
                        deadline.setDate(deadline.getDate() + acceptedProposal.deliveryDays);
                        setJobDeadline(deadline);
                    }
                }
            } catch (err: any) {
                console.error(err);
                showModal({
                    title: 'Error',
                    message: err.message || 'Failed to load job',
                    type: 'error'
                });
                router.push('/dashboard/client');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [jobId, router, showModal]);

    // Open review modal when returning from chat (or direct link) after job completion
    useEffect(() => {
        if (searchParams.get('promptReview') !== '1' || !jobId) return;
        if (typeof window !== 'undefined') {
            window.history.replaceState({}, '', window.location.pathname);
        }
        (async () => {
            try {
                const fresh = await api.client.getJobById(jobId);
                setJob(fresh);
                if (fresh.status === 'completed' && fresh.rating == null) {
                    setJobReviewModal(fresh);
                    setJobReviewRating(5);
                    setJobReviewText('');
                }
            } catch {
                /* ignore */
            }
        })();
    }, [jobId, searchParams]);

    const refreshJob = async () => {
        try {
            const jobData = await api.client.getJobById(jobId);
            setJob(jobData);
            if (jobData.status === 'in_progress' && jobData.proposals) {
                const acceptedProposal = jobData.proposals.find((p: any) => p.status === 'accepted');
                if (acceptedProposal?.deliveryDays) {
                    const createdDate = new Date(jobData.createdAt);
                    const deadline = new Date(createdDate);
                    deadline.setDate(deadline.getDate() + acceptedProposal.deliveryDays);
                    setJobDeadline(deadline);
                }
            }
        } catch {
            // ignore
        }
    };

    // Handle payment success redirect
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        if (params.get('payment_success') === '1') {
            window.history.replaceState({}, '', window.location.pathname);
            refreshJob();
            showModal({ title: 'Success', message: 'Payment successful! Job is now in progress.', type: 'success' });
        }
    }, [jobId]);

    const handleAcceptProposal = async (proposalId: string) => {
        setAcceptingProposalId(proposalId);
        try {
            const result = await api.client.acceptProposal(jobId, proposalId);
            if (result?.requiresPayment && result?.type === 'job_proposal') {
                const callbackUrl = typeof window !== 'undefined'
                    ? `${window.location.origin}/dashboard/client/jobs/${jobId}?payment_success=1`
                    : undefined;
                const body = {
                    type: 'job_proposal' as const,
                    amountCents: result.amountCents,
                    callbackSuccessUrl: callbackUrl,
                    jobId: result.meta?.jobId,
                    proposalId: result.meta?.proposalId
                };
                const paid = await payWithWalletIfPossible(body, () => {
                    showModal({ title: 'Success', message: 'Payment successful! Job is now in progress.', type: 'success' });
                    refreshJob();
                });
                if (!paid) {
                    setPaymentChoiceConfig(body);
                }
            } else {
                setJob(result);
                showModal({ title: 'Success', message: 'Proposal accepted!', type: 'success' });
            }
        } catch (err: any) {
            console.error(err);
            showModal({
                title: 'Error',
                message: err.message || 'Failed to accept proposal',
                type: 'error'
            });
        } finally {
            setAcceptingProposalId(null);
        }
    };

    const closeCheckout = () => {
        setCheckoutIframeUrl(null);
        refreshJob();
    };

    if (loading || !user || !job) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#09BF44]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
            <ClientSidebar
                user={user}
                profile={profile}
                onTabChange={() => { }}
                activeTab="jobs"
                mobileOpen={mobileSidebarOpen}
                onCloseMobile={() => setMobileSidebarOpen(false)}
            />
            {mobileSidebarOpen && (
                <button
                    aria-label="Close sidebar overlay"
                    onClick={() => setMobileSidebarOpen(false)}
                    className="fixed inset-0 bg-black/40 z-30 md:hidden"
                />
            )}
            <div className="flex-1 md:ml-72 px-4 sm:px-6 md:p-8 overflow-y-auto min-h-screen">
                <DashboardMobileTopStrip />
                <div className="flex items-center gap-3 mb-4 pt-4 md:pt-0">
                    <button
                        onClick={() => setMobileSidebarOpen(true)}
                        className="md:hidden p-2 rounded-lg border border-gray-200 bg-white text-gray-700"
                        aria-label="Open sidebar"
                    >
                        <PanelLeft className="w-5 h-5" />
                    </button>
                </div>
                <button
                    onClick={() => router.push('/dashboard/client')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="font-bold">Back to Jobs</span>
                </button>

                {/* Countdown Timer */}
                {jobDeadline && job.status === 'in_progress' && (
                    <div className="mb-6">
                        <CountdownTimer deadline={jobDeadline} variant="detail" />
                    </div>
                )}

                {/* Job Details */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 md:p-8 mb-6">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">{job.title}</h1>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    Posted {formatDateDDMMYYYY(job.createdAt)}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${job.status === 'open' ? 'bg-green-100 text-green-700' : job.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                                    {formatStatus(job.status)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 mb-6">
                        <div>
                            <h3 className="text-sm font-bold text-gray-500 mb-2">Description</h3>
                            <p className="text-gray-700 leading-relaxed">{job.description}</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <h3 className="text-sm font-bold text-gray-500 mb-2">Budget Range</h3>
                                <p className="text-lg font-black text-gray-900">
                                    {job.budgetRange.min} - {job.budgetRange.max} EGP
                                </p>
                            </div>
                            {job.deadline && (
                                <div>
                                    <h3 className="text-sm font-bold text-gray-500 mb-2">Deadline</h3>
                                    <p className="text-lg font-black text-gray-900">{job.deadline}</p>
                                </div>
                            )}
                        </div>

                        {job.skills && job.skills.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold text-gray-500 mb-2">Required Skills</h3>
                                <div className="flex flex-wrap gap-2">
                                    {job.skills.map((skill: string, idx: number) => (
                                        <span key={idx} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-bold">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {job.milestones && job.milestones.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold text-gray-500 mb-2">Delivery Milestones</h3>
                                <p className="text-xs text-gray-500 mb-3">Expected delivery phases. You pay once when you approve the completed project.</p>
                                <div className="space-y-2">
                                    {job.milestones.map((m: any, idx: number) => (
                                        <div key={idx} className="flex flex-wrap items-center justify-between gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                                            <span className="font-bold text-gray-900">{m.name}</span>
                                            {m.dueDate && (
                                                <span className="text-sm text-gray-500">Due: {formatDateDDMMYYYY(m.dueDate)}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Proposals */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-xl font-black text-gray-900">
                            Proposals ({job.proposals?.length || 0})
                        </h2>
                    </div>

                    <div className="p-6 space-y-4">
                        {job.proposals && job.proposals.length > 0 ? (
                            job.proposals.map((proposal: any, idx: number) => (
                                <div key={idx} className="border border-gray-200 rounded-2xl p-4 md:p-6 hover:shadow-md transition-shadow">
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                                        <div className="flex items-center gap-3 md:gap-4">
                                            <div className="w-12 h-12 bg-[#09BF44] rounded-full flex items-center justify-center text-white font-black text-lg">
                                                {proposal.freelancerId?.firstName?.[0]?.toUpperCase() || 'F'}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-lg text-gray-900">
                                                    {proposal.freelancerId?.firstName} {proposal.freelancerId?.lastName}
                                                </h3>
                                                <p className="text-sm text-gray-500">{proposal.freelancerId?.email}</p>
                                                {proposal.freelancerId?.freelancerProfile?.category && (
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {proposal.freelancerId.freelancerProfile.category}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="sm:text-right">
                                            <p className="text-xl md:text-2xl font-black text-[#09BF44] mb-1">
                                                {proposal.price} EGP
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {proposal.deliveryDays} days delivery
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Revisions: {proposal.revisionsUnlimited ? 'Unlimited' : (proposal.revisions ?? 0)}
                                            </p>
                                        </div>
                                    </div>

                                    {Array.isArray(proposal.milestones) && proposal.milestones.length > 0 && (
                                        <div className="mb-4 p-4 bg-indigo-50/80 rounded-xl border border-indigo-100">
                                            <p className="text-sm font-bold text-indigo-900 mb-2">Proposal milestones</p>
                                            <ul className="space-y-3 text-sm text-indigo-900">
                                                {proposal.milestones.map((m: any, mi: number) => {
                                                    const subLinks = Array.isArray(m.submissionLinks) ? m.submissionLinks.filter(Boolean) : [];
                                                    const subFiles = Array.isArray(m.submissionFiles) ? m.submissionFiles.filter(Boolean) : [];
                                                    const subNote = typeof m.submissionNote === 'string' ? m.submissionNote.trim() : '';
                                                    const hasSubmission =
                                                        subNote.length > 0 ||
                                                        subLinks.length > 0 ||
                                                        subFiles.length > 0 ||
                                                        m.status === 'submitted' ||
                                                        m.status === 'done';
                                                    return (
                                                        <li key={mi} className="rounded-xl border border-indigo-100 bg-white/90 p-3">
                                                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                                                <span className="font-bold text-gray-900">{m.name || `Milestone ${mi + 1}`}</span>
                                                                {m.dueDate && (
                                                                    <span className="text-xs text-indigo-700">
                                                                        Due {new Date(m.dueDate).toLocaleDateString()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {m.status && (
                                                                <span className="inline-block mt-1 text-xs font-bold uppercase tracking-wide text-indigo-600">
                                                                    {m.status}
                                                                </span>
                                                            )}
                                                            {hasSubmission ? (
                                                                <div className="mt-3 pt-3 border-t border-indigo-100 space-y-2">
                                                                    <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                                                                        Submitted work
                                                                    </p>
                                                                    {subNote ? (
                                                                        <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                                                                            {subNote}
                                                                        </p>
                                                                    ) : null}
                                                                    {subLinks.length > 0 && (
                                                                        <div>
                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                <LinkIcon className="w-3.5 h-3.5 text-gray-500" />
                                                                                <span className="text-xs font-bold text-gray-600">Links</span>
                                                                            </div>
                                                                            <div className="space-y-1">
                                                                                {subLinks.map((link: string, li: number) => (
                                                                                    <a
                                                                                        key={li}
                                                                                        href={link}
                                                                                        target="_blank"
                                                                                        rel="noreferrer"
                                                                                        className="block text-sm text-[#09BF44] hover:underline break-all"
                                                                                    >
                                                                                        {link}
                                                                                    </a>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    {subFiles.length > 0 && (
                                                                        <div>
                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                <Paperclip className="w-3.5 h-3.5 text-gray-500" />
                                                                                <span className="text-xs font-bold text-gray-600">Files</span>
                                                                            </div>
                                                                            <div className="space-y-1">
                                                                                {subFiles.map((fileUrl: string, fi: number) => (
                                                                                    <a
                                                                                        key={fi}
                                                                                        href={fileUrl}
                                                                                        target="_blank"
                                                                                        rel="noreferrer"
                                                                                        className="block text-sm text-[#09BF44] hover:underline break-all"
                                                                                    >
                                                                                        {fileUrl}
                                                                                    </a>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <p className="mt-2 text-xs text-indigo-700/80">
                                                                    No delivery submitted for this milestone yet.
                                                                </p>
                                                            )}
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    )}

                                    {proposal.message && (
                                        <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                                            <div className="flex items-center gap-2 mb-2">
                                                <MessageSquare className="w-4 h-4 text-gray-500" />
                                                <span className="text-sm font-bold text-gray-700">Proposal Message</span>
                                            </div>
                                            <p className="text-gray-600 text-sm leading-relaxed">{proposal.message}</p>
                                        </div>
                                    )}

                                    {proposal.workSubmission && (
                                        <div className="mb-4 p-4 bg-green-50 rounded-xl border border-green-100">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                                    <span className="text-sm font-bold text-green-800">Work Submission</span>
                                                </div>
                                                {proposal.workSubmission.updatedAt && (
                                                    <span className="text-xs text-green-700">
                                                        {new Date(proposal.workSubmission.updatedAt).toLocaleString()}
                                                    </span>
                                                )}
                                            </div>

                                            {proposal.workSubmission.message && (
                                                <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                                                    {proposal.workSubmission.message}
                                                </p>
                                            )}

                                            {Array.isArray(proposal.workSubmission.links) && proposal.workSubmission.links.length > 0 && (
                                                <div className="mb-3">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <LinkIcon className="w-4 h-4 text-gray-500" />
                                                        <span className="text-xs font-bold text-gray-700 uppercase">Links</span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        {proposal.workSubmission.links.map((link: string, linkIdx: number) => (
                                                            <a
                                                                key={`${proposal._id || idx}-link-${linkIdx}`}
                                                                href={link}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="block text-sm text-[#09BF44] hover:underline break-all"
                                                            >
                                                                {link}
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {Array.isArray(proposal.workSubmission.files) && proposal.workSubmission.files.length > 0 && (
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <Paperclip className="w-4 h-4 text-gray-500" />
                                                        <span className="text-xs font-bold text-gray-700 uppercase">Files</span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        {proposal.workSubmission.files.map((fileUrl: string, fileIdx: number) => (
                                                            <a
                                                                key={`${proposal._id || idx}-file-${fileIdx}`}
                                                                href={fileUrl}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="block text-sm text-[#09BF44] hover:underline break-all"
                                                            >
                                                                {fileUrl}
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {proposal.freelancerId?.freelancerProfile && (
                                        <div className="mb-4 flex flex-wrap gap-2">
                                            {proposal.freelancerId.freelancerProfile.experienceYears && (
                                                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                                                    {proposal.freelancerId.freelancerProfile.experienceYears} years experience
                                                </span>
                                            )}
                                            {proposal.freelancerId.freelancerProfile.isEmployeeOfMonth && (
                                                <span className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold">
                                                    ⭐ Employee of the Month
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pt-4 border-t border-gray-100">
                                        <button
                                            onClick={() => router.push(`/freelancer/${proposal.freelancerId?._id || proposal.freelancerId}`)}
                                            className="flex-1 bg-gray-100 text-gray-700 font-bold py-2.5 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <User className="w-4 h-4" />
                                            View Profile
                                        </button>
                                        <button
                                            onClick={() => router.push(`/chat/${proposal.freelancerId?._id || proposal.freelancerId}`)}
                                            className="flex-1 bg-gray-100 text-gray-700 font-bold py-2.5 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <MessageSquare className="w-4 h-4" /> Message
                                        </button>
                                        {job.status === 'open' && proposal.status === 'pending' && (
                                            <button
                                                onClick={() => handleAcceptProposal(proposal._id)}
                                                disabled={!!acceptingProposalId}
                                                className="flex-1 bg-[#09BF44] text-white font-bold py-2.5 rounded-xl hover:bg-[#07a63a] transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                            >
                                                {acceptingProposalId === proposal._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                                Accept Proposal
                                            </button>
                                        )}
                                        {proposal.status === 'accepted' && (
                                            <>
                                                {job.status === 'in_progress' && proposalReadyForClientApproval(proposal) ? (
                                                    <button
                                                        onClick={async () => {
                                                            if (!confirm('Approve the submitted work and mark this job as completed?')) return;
                                                            setApprovingJob(true);
                                                            try {
                                                                await api.client.approveJobWork(jobId);
                                                                const fresh = await api.client.getJobById(jobId);
                                                                setJob(fresh);
                                                                setJobReviewModal(fresh);
                                                                setJobReviewRating(5);
                                                                setJobReviewText('');
                                                                showModal({
                                                                    title: 'Job Completed',
                                                                    message: 'Work approved! Payment released to freelancer. Please leave a review.',
                                                                    type: 'success'
                                                                });
                                                            } catch (e: any) {
                                                                showModal({ title: 'Error', message: e.message || 'Failed to approve work', type: 'error' });
                                                            } finally {
                                                                setApprovingJob(false);
                                                            }
                                                        }}
                                                        disabled={approvingJob}
                                                        className="flex-1 bg-[#09BF44] text-white font-bold py-2.5 rounded-xl hover:bg-[#07a63a] transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                                    >
                                                        {approvingJob ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Approve & Release Payment
                                                    </button>
                                                ) : (
                                                    <span className="flex-1 bg-green-100 text-green-700 font-bold py-2.5 rounded-xl text-center flex items-center justify-center gap-2">
                                                        <CheckCircle className="w-4 h-4" />
                                                        Accepted
                                                    </span>
                                                )}
                                            </>
                                        )}
                                        {proposal.status === 'rejected' && (
                                            <span className="flex-1 bg-red-100 text-red-700 font-bold py-2.5 rounded-xl text-center flex items-center justify-center gap-2">
                                                <XCircle className="w-4 h-4" />
                                                Rejected
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 text-gray-400">
                                <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p className="text-lg font-bold">No proposals yet</p>
                                <p className="text-sm mt-2">Freelancers will see your job and submit proposals here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <PaymobCheckoutModal
                iframeUrl={checkoutIframeUrl}
                title="Pay to Accept Proposal"
                onClose={closeCheckout}
            />

            {jobReviewModal && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setJobReviewModal(null)}>
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold mb-2 text-gray-900">Leave a Review</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            {(() => {
                                const accepted = jobReviewModal?.proposals?.find((p: any) => p.status === 'accepted');
                                const f = accepted?.freelancerId;
                                const name = f?.firstName != null ? `${f.firstName} ${f.lastName || ''}`.trim() : 'the freelancer';
                                return <>How was your experience with {name}?</>;
                            })()}
                        </p>
                        <div className="flex gap-1 mb-4">
                            {[1, 2, 3, 4, 5].map((n) => (
                                <button key={n} type="button" onClick={() => setJobReviewRating(n)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                                    <Star className={`w-8 h-8 ${n <= jobReviewRating ? 'fill-amber-400 text-amber-500' : 'text-gray-300'}`} />
                                </button>
                            ))}
                        </div>
                        <textarea
                            value={jobReviewText}
                            onChange={(e) => setJobReviewText(e.target.value)}
                            placeholder="Write your review (optional)..."
                            rows={4}
                            className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-[#09BF44] outline-none resize-none mb-4"
                        />
                        <div className="flex gap-2 justify-end">
                            <button type="button" onClick={() => setJobReviewModal(null)} className="px-4 py-2 rounded-xl font-bold text-gray-600 hover:bg-gray-100">Later</button>
                            <button
                                type="button"
                                disabled={jobReviewSubmitting}
                                onClick={async () => {
                                    setJobReviewSubmitting(true);
                                    try {
                                        await api.client.submitJobReview(jobId, jobReviewRating, jobReviewText);
                                        showModal({ title: 'Thank You!', message: 'Your review has been submitted.', type: 'success' });
                                        setJobReviewModal(null);
                                        refreshJob();
                                    } catch (err: any) {
                                        showModal({ title: 'Error', message: err.message || 'Failed to submit review', type: 'error' });
                                    } finally {
                                        setJobReviewSubmitting(false);
                                    }
                                }}
                                className="px-4 py-2 bg-[#09BF44] text-white rounded-xl font-bold disabled:opacity-70 flex items-center gap-2"
                            >
                                {jobReviewSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                Submit Review
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                            jobId: paymentChoiceConfig.jobId,
                            proposalId: paymentChoiceConfig.proposalId
                        });
                        if (charge.paidFromWallet) {
                            setPaymentChoiceConfig(null);
                            showModal({ title: 'Payment Successful', message: 'Payment deducted from your wallet balance.', type: 'success' });
                            refreshJob();
                            return;
                        }
                        setCheckoutIframeUrl(charge.iframeUrl || null);
                    }}
                    onInstaPayComplete={() => {
                        setPaymentChoiceConfig(null);
                        refreshJob();
                        showModal({ title: 'Payment Submitted', message: 'Your payment screenshot has been submitted. We will verify and activate your job shortly. You can track your job in Jobs Posted.', type: 'success' });
                        router.push(`/dashboard/client/jobs/${jobId}`);
                    }}
                />
            )}
        </div>
    );
}

export default function JobDetailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#09BF44]" />
            </div>
        }>
            <JobDetailPageContent />
        </Suspense>
    );
}
