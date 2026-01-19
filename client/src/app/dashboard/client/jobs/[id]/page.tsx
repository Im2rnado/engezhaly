"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Briefcase, Clock, DollarSign, User, ArrowLeft, Loader2, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { api } from '@/lib/api';
import { useModal } from '@/context/ModalContext';
import ClientSidebar from '@/components/ClientSidebar';
import CountdownTimer from '@/components/CountdownTimer';

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
                    // Update job status and proposal status
                    await api.client.updateJob(jobId, {
                        status: 'in_progress'
                    });
                    showModal({ title: 'Success', message: 'Proposal accepted! Job is now in progress.', type: 'success' });
                    router.push('/dashboard/client');
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
            <ClientSidebar user={user} profile={profile} onTabChange={() => { }} activeTab="jobs" />
            <div className="flex-1 ml-72 p-8 overflow-y-auto">
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
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-6">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 mb-2">{job.title}</h1>
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

                        <div className="grid grid-cols-2 gap-4">
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
                                <div key={idx} className="border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-4">
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
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-[#09BF44] mb-1">
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

                                    <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                                        <button
                                            onClick={() => router.push(`/freelancer/${proposal.freelancerId?._id || proposal.freelancerId}`)}
                                            className="flex-1 bg-gray-100 text-gray-700 font-bold py-2.5 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <User className="w-4 h-4" />
                                            View Profile
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
