"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Loader2, PanelLeft } from 'lucide-react';
import { useModal } from '@/context/ModalContext';
import ClientSidebar from '@/components/ClientSidebar';
import DashboardMobileTopStrip from '@/components/DashboardMobileTopStrip';

export default function PostJobPage() {
    const { showModal } = useModal();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/');
            return;
        }
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        setUser(storedUser);
        api.client.getProfile().then(setProfile).catch(() => { });
    }, [router]);

    const [jobData, setJobData] = useState({
        title: '',
        description: '',
        skills: '', // space separated, displayed as tags
        budgetMin: 500,
        budgetMax: 1000,
        deadline: '' // YYYY-MM-DD date
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setJobData({ ...jobData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (Number(jobData.budgetMin) < 500) {
            setError('Minimum budget allowed is 500 EGP.');
            setLoading(false);
            return;
        }

        try {
            await api.jobs.create({
                ...jobData,
                budgetMin: Number(jobData.budgetMin),
                budgetMax: Number(jobData.budgetMax),
                skills: jobData.skills.trim().split(/\s+/).filter(Boolean)
            });
            showModal({ title: 'Success', message: 'Job Posted Successfully!', type: 'success' });
            router.push('/dashboard/client');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!user) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#09BF44]" /></div>;

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
            <div className="flex-1 md:ml-72 px-4 sm:px-6 md:p-8 pt-3 md:pt-8 pb-8 overflow-y-auto min-h-screen">
                <DashboardMobileTopStrip />
                <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
                    <div className="p-5 md:p-12">
                        <div className="flex items-center gap-3 mb-2">
                            <button
                                onClick={() => setMobileSidebarOpen(true)}
                                className="md:hidden p-2 rounded-lg border border-gray-200 bg-white text-gray-700"
                                aria-label="Open sidebar"
                            >
                                <PanelLeft className="w-5 h-5" />
                            </button>
                            <h1 className="text-2xl md:text-3xl font-black text-gray-900">Post a Job</h1>
                        </div>
                        <p className="text-gray-500 mb-8">Tell us what you need done.</p>

                        {error && <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-6">{error}</div>}

                        <form onSubmit={handleSubmit} className="space-y-6">

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Job Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    required
                                    placeholder="e.g. Build a Shopify Store"
                                    value={jobData.title}
                                    onChange={handleChange}
                                    className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                                <textarea
                                    name="description"
                                    required
                                    placeholder="Describe your project details..."
                                    value={jobData.description}
                                    onChange={handleChange}
                                    className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none h-32"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Required Skills (space separated)</label>
                                {(() => {
                                    const parts = jobData.skills.split(/\s+/);
                                    const completedTags = parts.slice(0, -1).filter(Boolean);
                                    const currentWord = parts.length > 0 ? (parts[parts.length - 1] ?? '') : '';
                                    const prefix = completedTags.length ? completedTags.join(' ') + ' ' : '';
                                    return (
                                        <div className="flex flex-wrap items-center gap-2 w-full p-3 py-2.5 min-h-[52px] bg-gray-50 rounded-xl border-2 border-transparent focus-within:border-[#09BF44] focus-within:bg-white outline-none transition-all font-medium text-gray-900">
                                            {completedTags.map((tag) => (
                                                <span key={tag} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#09BF44] text-white">
                                                    {tag}
                                                </span>
                                            ))}
                                            <input
                                                type="text"
                                                name="skills"
                                                required={jobData.skills.trim().split(/\s+/).filter(Boolean).length === 0}
                                                placeholder={completedTags.length === 0 ? 'e.g. React Node.js Design' : ''}
                                                value={currentWord}
                                                onChange={(e) => setJobData({ ...jobData, skills: prefix + e.target.value })}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Backspace' && !currentWord && completedTags.length > 0) {
                                                        e.preventDefault();
                                                        setJobData({ ...jobData, skills: completedTags.slice(0, -1).join(' ') });
                                                    }
                                                }}
                                                className="flex-1 min-w-[120px] py-1 bg-transparent border-0 outline-none placeholder:text-gray-400"
                                            />
                                        </div>
                                    );
                                })()}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Min Budget (EGP)</label>
                                    <input
                                        type="number"
                                        name="budgetMin"
                                        required
                                        min="500"
                                        value={jobData.budgetMin}
                                        onChange={handleChange}
                                        className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Max Budget (EGP)</label>
                                    <input
                                        type="number"
                                        name="budgetMax"
                                        required
                                        min="500"
                                        value={jobData.budgetMax}
                                        onChange={handleChange}
                                        className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Deadline</label>
                                <input
                                    type="date"
                                    name="deadline"
                                    required
                                    value={jobData.deadline}
                                    onChange={handleChange}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none"
                                />
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    className="w-full sm:w-auto bg-gray-100 text-gray-600 font-bold px-8 py-3 rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full sm:w-auto bg-[#09BF44] text-white font-bold px-8 py-3 rounded-xl hover:bg-[#07a63a] transition-colors flex items-center justify-center gap-2"
                                >
                                    {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                                    Post Job
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
