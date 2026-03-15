"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Loader2, PanelLeft, Plus, Trash2 } from 'lucide-react';
import { MAIN_CATEGORIES, CATEGORIES } from '@/lib/categories';
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
        category: '',
        subCategory: '',
        skills: '', // space separated, displayed as tags
        budgetMin: 500,
        budgetMax: 1000,
        deadline: '' // YYYY-MM-DD date
    });
    const [showMilestones, setShowMilestones] = useState(false);
    const [milestones, setMilestones] = useState<Array<{ name: string; price: string; dueDate: string }>>([]);

    const addMilestone = () => setMilestones([...milestones, { name: '', price: '', dueDate: '' }]);
    const removeMilestone = (index: number) => setMilestones(milestones.filter((_, i) => i !== index));
    const updateMilestone = (index: number, field: 'name' | 'price' | 'dueDate', value: string) => {
        const updated = [...milestones];
        updated[index] = { ...updated[index], [field]: value };
        setMilestones(updated);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'category') {
            setJobData({ ...jobData, category: value, subCategory: '' });
        } else {
            setJobData({ ...jobData, [name]: value });
        }
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

        if (!jobData.category || !jobData.subCategory) {
            setError('Please select both category and subcategory.');
            setLoading(false);
            return;
        }

        try {
            const milestonesPayload = showMilestones && milestones.length > 0
                ? milestones.filter((m) => m.name.trim() && Number(m.price) > 0).map((m) => ({
                    name: m.name.trim(),
                    price: Number(m.price),
                    dueDate: m.dueDate || undefined
                }))
                : [];
            await api.jobs.create({
                ...jobData,
                budgetMin: Number(jobData.budgetMin),
                budgetMax: Number(jobData.budgetMax),
                skills: jobData.skills.trim().split(/\s+/).filter(Boolean),
                category: jobData.category,
                subCategory: jobData.subCategory,
                milestones: milestonesPayload
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
                                    placeholder="Describe your job details..."
                                    value={jobData.description}
                                    onChange={handleChange}
                                    className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none h-32"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                                    <select
                                        name="category"
                                        required
                                        value={jobData.category}
                                        onChange={handleChange}
                                        className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none"
                                    >
                                        <option value="">Select category</option>
                                        {MAIN_CATEGORIES.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Subcategory</label>
                                    <select
                                        name="subCategory"
                                        required
                                        value={jobData.subCategory}
                                        onChange={handleChange}
                                        disabled={!jobData.category}
                                        className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none disabled:opacity-60"
                                    >
                                        <option value="">Select subcategory</option>
                                        {(CATEGORIES[jobData.category as keyof typeof CATEGORIES] || []).map((sub) => (
                                            <option key={sub} value={sub}>{sub}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Required Skills (separate with space or Enter)</label>
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
                                                placeholder={completedTags.length === 0 ? 'e.g. React Node.js Design (space or Enter between items)' : ''}
                                                value={currentWord}
                                                onChange={(e) => setJobData({ ...jobData, skills: prefix + e.target.value })}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        setJobData({ ...jobData, skills: (prefix + currentWord).trim() + ' ' });
                                                    } else if (e.key === 'Backspace' && !currentWord && completedTags.length > 0) {
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

                            {/* Payment Milestones */}
                            <div className="p-4 rounded-xl border-2 border-gray-100 bg-gray-50/50">
                                <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-900">Payment Milestones</label>
                                        <p className="text-xs text-gray-600">Optionally split payment across milestones (e.g., Design Phase, Development)</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowMilestones(!showMilestones);
                                            if (!showMilestones) setMilestones([]);
                                        }}
                                        className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${showMilestones ? 'bg-[#09BF44] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                    >
                                        {showMilestones ? 'Enabled' : 'Enable'}
                                    </button>
                                </div>
                                {showMilestones && (
                                    <div className="mt-4 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-gray-700">Milestones</span>
                                            <button type="button" onClick={addMilestone} className="flex items-center gap-2 px-3 py-1.5 bg-[#09BF44] text-white text-sm font-bold rounded-lg hover:bg-[#07a63a]">
                                                <Plus className="w-4 h-4" /> Add
                                            </button>
                                        </div>
                                        {milestones.length === 0 ? (
                                            <p className="text-sm text-gray-500 py-4 text-center border-2 border-dashed border-gray-200 rounded-xl">Click &quot;Add&quot; to create payment milestones.</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {milestones.map((m, idx) => (
                                                    <div key={idx} className="p-3 bg-white rounded-xl border border-gray-200 flex flex-col sm:flex-row gap-3">
                                                        <input
                                                            type="text"
                                                            value={m.name}
                                                            onChange={(e) => updateMilestone(idx, 'name', e.target.value)}
                                                            placeholder="e.g. Design Phase"
                                                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:border-[#09BF44] outline-none"
                                                        />
                                                        <input
                                                            type="number"
                                                            value={m.price}
                                                            onChange={(e) => updateMilestone(idx, 'price', e.target.value)}
                                                            placeholder="EGP"
                                                            min="0"
                                                            className="w-24 px-3 py-2 border border-gray-200 rounded-lg focus:border-[#09BF44] outline-none"
                                                        />
                                                        <input
                                                            type="date"
                                                            value={m.dueDate}
                                                            onChange={(e) => updateMilestone(idx, 'dueDate', e.target.value)}
                                                            min={new Date().toISOString().split('T')[0]}
                                                            className="w-36 px-3 py-2 border border-gray-200 rounded-lg focus:border-[#09BF44] outline-none"
                                                        />
                                                        <button type="button" onClick={() => removeMilestone(idx)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                                {milestones.length > 0 && (
                                                    <p className="text-sm font-bold text-gray-700">
                                                        Total: {milestones.reduce((s, m) => s + (Number(m.price) || 0), 0)} EGP
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    className="w-full sm:w-auto bg-gray-100 text-gray-600 font-bold px-8 py-3 rounded-xl hover:bg-[#09BF44]/20 hover:text-[#09BF44] transition-colors"
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
