"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Loader2, PanelLeft, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { MAIN_CATEGORIES, CATEGORIES } from '@/lib/categories';
import { useModal } from '@/context/ModalContext';
import ClientSidebar from '@/components/ClientSidebar';
import DashboardMobileTopStrip from '@/components/DashboardMobileTopStrip';

export default function EditJobPage() {
    const { showModal } = useModal();
    const router = useRouter();
    const params = useParams();
    const jobId = params.id as string;

    const [loading, setLoading] = useState(false);
    const [loadingJob, setLoadingJob] = useState(true);
    const [error, setError] = useState('');
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    const [jobData, setJobData] = useState({
        title: '',
        description: '',
        category: '',
        subCategory: '',
        skills: '',
        budgetMin: 500,
        budgetMax: 1000,
        deadline: ''
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

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/');
            return;
        }
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        setUser(storedUser);
        api.client.getProfile().then(setProfile).catch(() => {});
    }, [router]);

    useEffect(() => {
        if (!jobId) return;
        setLoadingJob(true);
        api.client.getJobById(jobId)
            .then((job: any) => {
                setJobData({
                    title: job.title || '',
                    description: job.description || '',
                    category: job.category || '',
                    subCategory: job.subCategory || '',
                    skills: Array.isArray(job.skills) ? job.skills.join(' ') : '',
                    budgetMin: job.budgetRange?.min ?? 500,
                    budgetMax: job.budgetRange?.max ?? 1000,
                    deadline: job.deadline ? (typeof job.deadline === 'string' && job.deadline.match(/^\d{4}-\d{2}-\d{2}$/) ? job.deadline : new Date(job.deadline).toISOString().split('T')[0]) : ''
                });
                const ms = job.milestones || [];
                setShowMilestones(ms.length > 0);
                setMilestones(ms.map((m: any) => ({
                    name: m.name || '',
                    price: String(m.price ?? ''),
                    dueDate: m.dueDate ? new Date(m.dueDate).toISOString().split('T')[0] : ''
                })));
            })
            .catch(() => router.push('/dashboard/client'))
            .finally(() => setLoadingJob(false));
    }, [jobId, router]);

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
            await api.client.updateJob(jobId, {
                title: jobData.title,
                description: jobData.description,
                skills: jobData.skills.trim().split(/\s+/).filter(Boolean),
                category: jobData.category,
                subCategory: jobData.subCategory,
                budgetMin: Number(jobData.budgetMin),
                budgetMax: Number(jobData.budgetMax),
                deadline: jobData.deadline || undefined,
                milestones: milestonesPayload
            });
            showModal({ title: 'Success', message: 'Job updated successfully!', type: 'success' });
            router.push('/dashboard/client');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!user) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#09BF44]" /></div>;
    if (loadingJob) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#09BF44]" /></div>;

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
            <ClientSidebar user={user} profile={profile} onTabChange={() => {}} activeTab="jobs" mobileOpen={mobileSidebarOpen} onCloseMobile={() => setMobileSidebarOpen(false)} />
            {mobileSidebarOpen && <button aria-label="Close sidebar overlay" onClick={() => setMobileSidebarOpen(false)} className="fixed inset-0 bg-black/40 z-30 md:hidden" />}
            <div className="flex-1 md:ml-72 px-4 sm:px-6 md:p-8 pt-3 md:pt-8 pb-8 overflow-y-auto min-h-screen">
                <DashboardMobileTopStrip />
                <div className="max-w-3xl mx-auto">
                    <button onClick={() => router.push('/dashboard/client')} className="flex items-center gap-2 text-gray-600 hover:text-[#09BF44] mb-6">
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </button>
                    <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                        <div className="p-5 md:p-12">
                            <div className="flex items-center gap-3 mb-2">
                                <button onClick={() => setMobileSidebarOpen(true)} className="md:hidden p-2 rounded-lg border border-gray-200 bg-white text-gray-700" aria-label="Open sidebar"><PanelLeft className="w-5 h-5" /></button>
                                <h1 className="text-2xl md:text-3xl font-black text-gray-900">Edit Job</h1>
                            </div>
                            <p className="text-gray-500 mb-8">Update your job details and milestones.</p>

                            {error && <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-6">{error}</div>}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Job Title</label>
                                    <input type="text" name="title" required placeholder="e.g. Build a Shopify Store" value={jobData.title} onChange={handleChange} className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                                    <textarea name="description" required placeholder="Describe your job details..." value={jobData.description} onChange={handleChange} className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none h-32" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                                        <select name="category" required value={jobData.category} onChange={handleChange} className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none">
                                            <option value="">Select category</option>
                                            {MAIN_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Subcategory</label>
                                        <select name="subCategory" required value={jobData.subCategory} onChange={handleChange} disabled={!jobData.category} className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none disabled:opacity-60">
                                            <option value="">Select subcategory</option>
                                            {(CATEGORIES[jobData.category as keyof typeof CATEGORIES] || []).map((sub) => <option key={sub} value={sub}>{sub}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Required Skills (space separated)</label>
                                    <input type="text" name="skills" value={jobData.skills} onChange={handleChange} placeholder="e.g. React Node.js Design" className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Min Budget (EGP)</label>
                                        <input type="number" name="budgetMin" required min="500" value={jobData.budgetMin} onChange={handleChange} className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Max Budget (EGP)</label>
                                        <input type="number" name="budgetMax" required min="500" value={jobData.budgetMax} onChange={handleChange} className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Deadline</label>
                                    <input type="date" name="deadline" value={jobData.deadline} onChange={handleChange} min={new Date().toISOString().split('T')[0]} className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none" />
                                </div>
                                <div className="p-4 rounded-xl border-2 border-gray-100 bg-gray-50/50">
                                    <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-900">Payment Milestones</label>
                                            <p className="text-xs text-gray-600">Optionally split payment across milestones</p>
                                        </div>
                                        <button type="button" onClick={() => { setShowMilestones(!showMilestones); if (!showMilestones) setMilestones([]); }} className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${showMilestones ? 'bg-[#09BF44] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>{showMilestones ? 'Enabled' : 'Enable'}</button>
                                    </div>
                                    {showMilestones && (
                                        <div className="mt-4 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-bold text-gray-700">Milestones</span>
                                                <button type="button" onClick={addMilestone} className="flex items-center gap-2 px-3 py-1.5 bg-[#09BF44] text-white text-sm font-bold rounded-lg hover:bg-[#07a63a]"><Plus className="w-4 h-4" /> Add</button>
                                            </div>
                                            {milestones.length === 0 ? (
                                                <p className="text-sm text-gray-500 py-4 text-center border-2 border-dashed border-gray-200 rounded-xl">Click &quot;Add&quot; to create payment milestones.</p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {milestones.map((m, idx) => (
                                                        <div key={idx} className="p-3 bg-white rounded-xl border border-gray-200 flex flex-col sm:flex-row gap-3">
                                                            <input type="text" value={m.name} onChange={(e) => updateMilestone(idx, 'name', e.target.value)} placeholder="e.g. Design Phase" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:border-[#09BF44] outline-none" />
                                                            <input type="number" value={m.price} onChange={(e) => updateMilestone(idx, 'price', e.target.value)} placeholder="EGP" min="0" className="w-24 px-3 py-2 border border-gray-200 rounded-lg focus:border-[#09BF44] outline-none" />
                                                            <input type="date" value={m.dueDate} onChange={(e) => updateMilestone(idx, 'dueDate', e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-36 px-3 py-2 border border-gray-200 rounded-lg focus:border-[#09BF44] outline-none" />
                                                            <button type="button" onClick={() => removeMilestone(idx)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                                        </div>
                                                    ))}
                                                    {milestones.length > 0 && <p className="text-sm font-bold text-gray-700">Total: {milestones.reduce((s, m) => s + (Number(m.price) || 0), 0)} EGP</p>}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 pt-4 border-t border-gray-100">
                                    <button type="button" onClick={() => router.back()} className="w-full sm:w-auto bg-gray-100 text-gray-600 font-bold px-8 py-3 rounded-xl hover:bg-[#09BF44]/20 hover:text-[#09BF44] transition-colors">Cancel</button>
                                    <button type="submit" disabled={loading} className="w-full sm:w-auto bg-[#09BF44] text-white font-bold px-8 py-3 rounded-xl hover:bg-[#07a63a] transition-colors flex items-center justify-center gap-2">{loading && <Loader2 className="w-5 h-5 animate-spin" />} Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
