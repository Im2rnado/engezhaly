"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useModal } from '@/context/ModalContext';
import { Loader2, MessageSquare, X } from 'lucide-react';
import FreelancerSidebar from '@/components/FreelancerSidebar';
import CountdownTimer from '@/components/CountdownTimer';

export default function MyJobsPage() {
    const { showModal } = useModal();
    const router = useRouter();
    const [myJobs, setMyJobs] = useState<any[]>([]);
    const [myJobsLoading, setMyJobsLoading] = useState(true);
    const [profileLoading, setProfileLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [workJob, setWorkJob] = useState<any>(null);
    const [submittingWork, setSubmittingWork] = useState(false);
    const [workSubmission, setWorkSubmission] = useState({
        message: '',
        links: '',
        files: [] as File[]
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/');
            return;
        }

        const loadData = async () => {
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            setUser(storedUser);

            try {
                const profileData = await api.freelancer.getProfile();
                setProfile(profileData);
                if (profileData.role !== 'freelancer') {
                    router.push('/');
                    return;
                }
            } catch {
                router.push('/');
            } finally {
                setProfileLoading(false);
            }

            try {
                const myJobsData = await api.jobs.getFreelancerJobs();
                setMyJobs(myJobsData || []);
            } catch {
                setMyJobs([]);
            } finally {
                setMyJobsLoading(false);
            }
        };

        loadData();
    }, [router]);

    const toggleBusy = async () => {
        try {
            const newStatus = !profile?.freelancerProfile?.isBusy;
            const updated = await api.freelancer.updateProfile({ isBusy: newStatus });
            setProfile(updated);
            showModal({ title: 'Success', message: `Status updated to ${newStatus ? 'Busy' : 'Available'}`, type: 'success' });
        } catch (err) {
            console.error(err);
            showModal({ title: 'Error', message: 'Failed to update status', type: 'error' });
        }
    };

    const handleSubmitWork = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!workJob) return;
        setSubmittingWork(true);
        try {
            const fileUrls: string[] = [];
            if (workSubmission.files.length > 0) {
                for (const f of workSubmission.files) {
                    const url = await api.upload.file(f);
                    fileUrls.push(url);
                }
            }

            const links = workSubmission.links
                .split(/[\n, ]+/)
                .map((l) => l.trim())
                .filter(Boolean);

            await api.jobs.submitWork(workJob._id, {
                message: workSubmission.message,
                links,
                files: fileUrls
            });

            showModal({ title: 'Success', message: 'Work submitted successfully!', type: 'success' });
            setWorkJob(null);
            setWorkSubmission({ message: '', links: '', files: [] });
            const myJobsData = await api.jobs.getFreelancerJobs().catch(() => []);
            setMyJobs(myJobsData);
        } catch (err: any) {
            showModal({ title: 'Error', message: err.message || 'Failed to submit work', type: 'error' });
        } finally {
            setSubmittingWork(false);
        }
    };

    const openChatWithClient = async (job: any) => {
        try {
            const clientId = String(job?.clientId?._id || job?.clientId || '');
            if (!clientId) {
                showModal({ title: 'Error', message: 'Client not found for this job', type: 'error' });
                return;
            }

            const conversations = await api.chat.getConversations();
            let conversation = (conversations || []).find((c: any) =>
                String(c.partnerId?._id || c.partnerId) === clientId
            );

            if (!conversation) {
                await api.chat.sendMessage({
                    receiverId: clientId,
                    content: `Hi! I have an update regarding your job: ${job.title}`,
                    messageType: 'text'
                });
                const updatedConversations = await api.chat.getConversations();
                conversation = (updatedConversations || []).find((c: any) =>
                    String(c.partnerId?._id || c.partnerId) === clientId
                );
            }

            router.push(`/chat?conversation=${conversation?.id || clientId}`);
        } catch (err: any) {
            showModal({ title: 'Error', message: err.message || 'Failed to open chat', type: 'error' });
        }
    };

    if (profileLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#09BF44]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
            <FreelancerSidebar user={user} profile={profile} onToggleBusy={toggleBusy} />

            <div className="flex-1 ml-72 p-8 overflow-y-auto h-screen">
                <header className="mb-10">
                    <h1 className="text-3xl font-black text-gray-900 mb-2">My Jobs</h1>
                    <p className="text-gray-500">My applications and active jobs.</p>
                </header>

                <section className="mb-10">
                    {myJobsLoading ? (
                        <div className="flex items-center justify-center h-24">
                            <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
                        </div>
                    ) : myJobs.length === 0 ? (
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 text-gray-500">
                            You have not applied to any jobs yet.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {myJobs.map((job) => {
                                const myProposal = job.myProposal;
                                const acceptedAndActive = myProposal?.status === 'accepted' && job.status === 'in_progress';
                                const hasDeadline = !!job.deadline && !Number.isNaN(new Date(job.deadline).getTime());
                                return (
                                    <div key={job._id} className="relative bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                                        {acceptedAndActive && hasDeadline && (
                                            <CountdownTimer deadline={job.deadline} variant="card" />
                                        )}
                                        <div className="flex justify-between items-start gap-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Client: {job.clientId?.firstName} {job.clientId?.lastName}
                                                    {job.deadline ? ` • Deadline: ${job.deadline}` : ''}
                                                </p>
                                                <p className="text-gray-600 mt-2 line-clamp-2">{job.description}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                                                    myProposal?.status === 'accepted'
                                                        ? 'bg-green-100 text-green-700'
                                                        : myProposal?.status === 'rejected'
                                                            ? 'bg-red-100 text-red-700'
                                                            : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                    {myProposal?.status || 'pending'}
                                                </span>
                                                <p className="text-sm font-bold text-[#09BF44] mt-2">
                                                    Your offer: {myProposal?.price || '-'} EGP
                                                </p>
                                            </div>
                                        </div>
                                        {acceptedAndActive && (
                                            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                                                <div className="text-sm text-gray-600">
                                                    {myProposal?.workSubmission?.updatedAt
                                                        ? `Last submitted: ${new Date(myProposal.workSubmission.updatedAt).toLocaleString()}`
                                                        : 'No work submitted yet'}
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => openChatWithClient(job)}
                                                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center gap-2"
                                                    >
                                                        <MessageSquare className="w-4 h-4" /> Message Client
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setWorkJob(job);
                                                            setWorkSubmission({
                                                                message: myProposal?.workSubmission?.message || '',
                                                                links: (myProposal?.workSubmission?.links || []).join(', '),
                                                                files: []
                                                            });
                                                        }}
                                                        className="bg-black text-white px-5 py-2 rounded-xl font-bold hover:bg-gray-800 transition-colors"
                                                    >
                                                        {myProposal?.workSubmission?.updatedAt ? 'Update Submission' : 'Submit Work'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        {!acceptedAndActive && (
                                            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                                                <button
                                                    onClick={() => openChatWithClient(job)}
                                                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center gap-2"
                                                >
                                                    <MessageSquare className="w-4 h-4" /> Chat Client
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Work Submission Modal */}
                {workJob && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white p-8 rounded-3xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Submit Work: {workJob.title}</h2>
                                <button
                                    onClick={() => setWorkJob(null)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmitWork} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Work Notes</label>
                                    <textarea
                                        value={workSubmission.message}
                                        onChange={(e) => setWorkSubmission((prev) => ({ ...prev, message: e.target.value }))}
                                        className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none h-28 resize-none text-gray-900 placeholder:text-gray-500"
                                        placeholder="Describe what you completed..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Links (comma, space, or new line separated)</label>
                                    <textarea
                                        value={workSubmission.links}
                                        onChange={(e) => setWorkSubmission((prev) => ({ ...prev, links: e.target.value }))}
                                        className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none h-24 resize-none text-gray-900 placeholder:text-gray-500"
                                        placeholder="https://drive.google.com/... , https://github.com/..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Upload Files / Images</label>
                                    <input
                                        type="file"
                                        multiple
                                        onChange={(e) => setWorkSubmission((prev) => ({
                                            ...prev,
                                            files: Array.from(e.target.files || [])
                                        }))}
                                        className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none text-gray-900"
                                    />
                                    {workSubmission.files.length > 0 && (
                                        <p className="text-xs text-gray-500 mt-2">{workSubmission.files.length} file(s) selected</p>
                                    )}
                                </div>

                                <div className="flex gap-4 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setWorkJob(null)}
                                        className="flex-1 bg-gray-100 text-gray-700 font-bold p-3 rounded-xl hover:bg-gray-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submittingWork}
                                        className="flex-1 bg-[#09BF44] text-white font-bold p-3 rounded-xl hover:bg-[#07a63a] transition-colors disabled:opacity-70"
                                    >
                                        {submittingWork ? 'Submitting...' : 'Submit Work'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
