"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { useModal } from '@/context/ModalContext';
import ClientSidebar from '@/components/ClientSidebar';

export default function PostJobPage() {
    const { showModal } = useModal();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);

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
        skills: '', // comma separated
        budgetMin: 500,
        budgetMax: 1000,
        deadline: ''
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
                skills: jobData.skills.split(',').map(s => s.trim())
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
            <ClientSidebar user={user} profile={profile} onTabChange={() => { }} activeTab="jobs" />
            <div className="flex-1 ml-72 p-8 overflow-y-auto h-screen">
                <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
                    <div className="p-8 md:p-12">
                        <h1 className="text-3xl font-black text-gray-900 mb-2">Post a Job</h1>
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
                                <label className="block text-sm font-bold text-gray-700 mb-2">Required Skills (Comma separated)</label>
                                <input
                                    type="text"
                                    name="skills"
                                    required
                                    placeholder="e.g. React, Node.js, Design"
                                    value={jobData.skills}
                                    onChange={handleChange}
                                    className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
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
                                <select
                                    name="deadline"
                                    required
                                    value={jobData.deadline}
                                    onChange={handleChange}
                                    className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none"
                                >
                                    <option value="">Select Deadline</option>
                                    <option value="Urgent (24h)">Urgent (24h)</option>
                                    <option value="3 Days">3 Days</option>
                                    <option value="1 Week">1 Week</option>
                                    <option value="1 Month">1 Month</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    className="bg-gray-100 text-gray-600 font-bold px-8 py-3 rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-[#09BF44] text-white font-bold px-8 py-3 rounded-xl hover:bg-[#07a63a] transition-colors flex items-center gap-2"
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
