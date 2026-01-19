"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useModal } from '@/context/ModalContext';
import { Briefcase, Loader2, X } from 'lucide-react';
import FreelancerSidebar from '@/components/FreelancerSidebar';

export default function BrowseJobsPage() {
    const { showModal } = useModal();
    const router = useRouter();
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [profileLoading, setProfileLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [proposal, setProposal] = useState({ price: '', days: '', message: '' });
    const [selectedJob, setSelectedJob] = useState<any>(null);

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
                const jobsData = await api.jobs.getAll();
                setJobs(jobsData);
            } catch {
                // Handle error silently
            } finally {
                setLoading(false);
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

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedJob) return;

        try {
            await api.jobs.apply(selectedJob._id, {
                price: Number(proposal.price),
                deliveryDays: Number(proposal.days),
                message: proposal.message
            });
            showModal({ title: 'Success', message: 'Application Sent!', type: 'success' });
            setSelectedJob(null);
            setProposal({ price: '', days: '', message: '' });
        } catch (err: any) {
            showModal({ title: 'Error', message: err.message || 'Failed to send application', type: 'error' });
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
                    <h1 className="text-3xl font-black text-gray-900 mb-2">Browse Jobs</h1>
                    <p className="text-gray-500">Find opportunities that match your skills.</p>
                </header>

                {loading ? (
                    <div className="flex items-center justify-center h-40">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {jobs.map(job => (
                            <div key={job._id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">{job.title}</h3>
                                        <p className="text-gray-500 text-sm mb-2">Posted by {job.clientId?.firstName} • {job.deadline}</p>
                                        <p className="text-gray-600">{job.description}</p>
                                    </div>
                                    <div className="bg-green-50 text-[#09BF44] font-bold px-4 py-2 rounded-xl ml-4">
                                        {job.budgetRange.min} - {job.budgetRange.max} EGP
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex gap-2 flex-wrap">
                                        {job.skills.map((s: string) => (
                                            <span key={s} className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full">{s}</span>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => setSelectedJob(job)}
                                        className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center gap-2"
                                    >
                                        <Briefcase className="w-4 h-4" /> Apply Now
                                    </button>
                                </div>
                            </div>
                        ))}
                        {jobs.length === 0 && (
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
                                <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-400 opacity-20" />
                                <p className="text-gray-500">No jobs available right now.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Application Modal */}
                {selectedJob && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white p-8 rounded-3xl max-w-lg w-full shadow-2xl">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Apply to {selectedJob.title}</h2>
                                <button
                                    onClick={() => setSelectedJob(null)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                            <form onSubmit={handleApply} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Your Price (EGP)</label>
                                        <input
                                            required
                                            type="number"
                                            value={proposal.price}
                                            onChange={e => setProposal({ ...proposal, price: e.target.value })}
                                            className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Delivery (Days)</label>
                                        <input
                                            required
                                            type="number"
                                            value={proposal.days}
                                            onChange={e => setProposal({ ...proposal, days: e.target.value })}
                                            className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Cover Letter</label>
                                    <textarea
                                        required
                                        value={proposal.message}
                                        onChange={e => setProposal({ ...proposal, message: e.target.value })}
                                        className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none h-32 resize-none"
                                        placeholder="Tell the client why you're the perfect fit..."
                                    />
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedJob(null)}
                                        className="flex-1 bg-gray-100 text-gray-700 font-bold p-3 rounded-xl hover:bg-gray-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-[#09BF44] text-white font-bold p-3 rounded-xl hover:bg-[#07a63a] transition-colors"
                                    >
                                        Send Proposal
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
