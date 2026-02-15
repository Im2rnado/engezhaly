"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Briefcase, Clock, User, ArrowLeft, Loader2, CheckCircle, XCircle, MessageSquare, Link as LinkIcon, Paperclip, PanelLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { useModal } from '@/context/ModalContext';
import ClientSidebar from '@/components/ClientSidebar';
import CountdownTimer from '@/components/CountdownTimer';
import DashboardMobileTopStrip from '@/components/DashboardMobileTopStrip';

export default function JobDetailPage() {
    const { showModal } = useModal();
    const router = useRouter();
    const params = useParams();
    const jobId = params.id as string;

    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [job, setJob] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [jobDeadline, setJobDeadline] = useState<Date | null>(null);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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

    const handleAcceptProposal = async (proposalId: string) => {
        showModal({
            title: 'Accept Proposal',
            message: 'Are you sure you want to accept this proposal? This will start the job.',
            type: 'confirm',
            onConfirm: async () => {
                try {
                    const updatedJob = await api.client.acceptProposal(jobId, proposalId);
                    setJob(updatedJob);
                    if (updatedJob.status === 'in_progress' && updatedJob.proposals) {
                        const acceptedProposal = updatedJob.proposals.find((p: any) => p.status === 'accepted');
                        if (acceptedProposal?.deliveryDays) {
                            const createdDate = new Date(updatedJob.createdAt);
                            const deadline = new Date(createdDate);
                            deadline.setDate(deadline.getDate() + acceptedProposal.deliveryDays);
                            setJobDeadline(deadline);
                        }
                    }
                    showModal({ title: 'Success', message: 'Proposal accepted! Job is now in progress.', type: 'success' });
                } catch (err: any) {
                    console.error(err);
                    showModal({
                        title: 'Error',
                        message: err.message || 'Failed to accept proposal',
                        type: 'error'
                    });
                }
            }
        });
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
                                    Posted {new Date(job.createdAt).toLocaleDateString()}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${job.status === 'open' ? 'bg-green-100 text-green-700' : job.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                                    {job.status}
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
                                        </div>
                                    </div>

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
                                                className="flex-1 bg-[#09BF44] text-white font-bold py-2.5 rounded-xl hover:bg-[#07a63a] transition-colors flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                Accept Proposal
                                            </button>
                                        )}
                                        {proposal.status === 'accepted' && (
                                            <span className="flex-1 bg-green-100 text-green-700 font-bold py-2.5 rounded-xl text-center flex items-center justify-center gap-2">
                                                <CheckCircle className="w-4 h-4" />
                                                Accepted
                                            </span>
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
        </div>
    );
}
