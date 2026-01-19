"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Loader2, Upload, ArrowLeft } from 'lucide-react';
import { useModal } from '@/context/ModalContext';
import FreelancerSidebar from '@/components/FreelancerSidebar';
import { CATEGORIES, MAIN_CATEGORIES } from '@/lib/categories';

export default function EditProjectPage() {
    const { showModal } = useModal();
    const router = useRouter();
    const params = useParams();
    const projectId = params?.id as string;

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState('');
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [profileLoading, setProfileLoading] = useState(true);

    const [projectData, setProjectData] = useState({
        title: '',
        description: '',
        category: '',
        subCategory: '',
        images: [] as string[],
        packages: [
            { type: 'Basic', price: 500, days: 3, features: [''], revisions: 0 },
            { type: 'Standard', price: 1000, days: 5, features: [''], revisions: 1 },
            { type: 'Premium', price: 2000, days: 7, features: [''], revisions: 2 }
        ],
        isActive: true
    });

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
                const profileData = await api.freelancer.getProfile();
                setProfile(profileData);
                if (profileData.role !== 'freelancer') {
                    router.push('/');
                    return;
                }

                if (projectId) {
                    const projectData = await api.projects.getById(projectId);
                    setProjectData({
                        title: projectData.title || '',
                        description: projectData.description || '',
                        category: projectData.category || '',
                        subCategory: projectData.subCategory || '',
                        images: projectData.images || [],
                        packages: projectData.packages || [
                            { type: 'Basic', price: 500, days: 3, features: [''], revisions: 0 },
                            { type: 'Standard', price: 1000, days: 5, features: [''], revisions: 1 },
                            { type: 'Premium', price: 2000, days: 7, features: [''], revisions: 2 }
                        ],
                        isActive: projectData.isActive !== undefined ? projectData.isActive : true
                    });
                }
            } catch (err) {
                console.error(err);
                router.push('/');
            } finally {
                setFetching(false);
                setProfileLoading(false);
            }
        };

        loadData();
    }, [router, projectId]);

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setProjectData({ ...projectData, [e.target.name]: e.target.value });
    };

    const handlePackageChange = (index: number, field: string, value: any) => {
        const newPackages = [...projectData.packages];
        newPackages[index] = { ...newPackages[index], [field]: value };
        setProjectData({ ...projectData, packages: newPackages });
    };

    const handleFeaturesChange = (index: number, features: string[]) => {
        const newPackages = [...projectData.packages];
        newPackages[index] = { ...newPackages[index], features };
        setProjectData({ ...projectData, packages: newPackages });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (projectData.packages.some(p => p.price < 500)) {
            setError('Minimum price for any package is 500 EGP.');
            setLoading(false);
            return;
        }

        try {
            await api.projects.update(projectId, {
                ...projectData,
                packages: projectData.packages.map(p => ({
                    ...p,
                    price: Number(p.price),
                    days: Number(p.days),
                    revisions: Number(p.revisions),
                    features: Array.isArray(p.features) ? p.features.filter((f: string) => f && f.trim()) : []
                }))
            });
            showModal({ title: 'Success', message: 'Project Updated Successfully!', type: 'success' });
            router.push('/dashboard/freelancer?tab=projects');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (profileLoading || fetching) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#09BF44]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
            <FreelancerSidebar user={user} profile={profile} onToggleBusy={toggleBusy} activeTab="projects" />

            <div className="flex-1 ml-72 p-8 overflow-y-auto h-screen">
                <div className="max-w-4xl mx-auto">
                    <button
                        onClick={() => router.push('/dashboard/freelancer?tab=projects')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-bold transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </button>

                    <header className="mb-10">
                        <h1 className="text-3xl font-black text-gray-900 mb-2">Edit Project</h1>
                        <p className="text-gray-500">Update your service details.</p>
                    </header>

                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-8 md:p-12">
                            {error && <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-6">{error}</div>}

                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* 1. Overview */}
                                <div className="space-y-4">
                                    <h2 className="text-xl font-bold text-gray-900">Project Overview</h2>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Project Title</label>
                                        <input
                                            type="text"
                                            name="title"
                                            required
                                            placeholder="I will design a professional logo for your brand"
                                            value={projectData.title}
                                            onChange={handleChange}
                                            className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Project Description</label>
                                        <textarea
                                            name="description"
                                            required
                                            placeholder="Describe what you will deliver, your expertise, and what makes your service unique..."
                                            value={projectData.description}
                                            onChange={handleChange}
                                            rows={4}
                                            className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none resize-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                                            <select
                                                name="category"
                                                required
                                                value={projectData.category}
                                                onChange={(e) => {
                                                    setProjectData({ ...projectData, category: e.target.value, subCategory: '' });
                                                }}
                                                className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none"
                                            >
                                                <option value="">Select Category</option>
                                                {MAIN_CATEGORIES.map((cat: string) => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Sub Category</label>
                                            <select
                                                name="subCategory"
                                                required
                                                value={projectData.subCategory}
                                                onChange={(e) => setProjectData({ ...projectData, subCategory: e.target.value })}
                                                disabled={!projectData.category}
                                                className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <option value="">Select Sub Category</option>
                                                {projectData.category && CATEGORIES[projectData.category as keyof typeof CATEGORIES]?.map((sub: string) => (
                                                    <option key={sub} value={sub}>{sub}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Banner Images (Up to 3)</label>
                                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer">
                                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                            <p className="text-gray-500 font-bold">Click to Upload Images</p>
                                            <p className="text-xs text-gray-400 mt-1">(Placeholder for File Upload)</p>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Packages */}
                                <div className="space-y-4">
                                    <h2 className="text-xl font-bold text-gray-900">Pricing Packages</h2>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {projectData.packages.map((pkg, idx) => (
                                            <div key={pkg.type} className="border-2 border-gray-100 rounded-xl p-4">
                                                <div className="bg-gray-100 text-gray-600 font-black text-center py-2 rounded-lg mb-4 uppercase text-sm">
                                                    {pkg.type}
                                                </div>

                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="text-xs font-bold text-gray-500">Price (EGP)</label>
                                                        <input
                                                            type="number"
                                                            min="500"
                                                            required
                                                            value={pkg.price}
                                                            onChange={(e) => handlePackageChange(idx, 'price', Number(e.target.value))}
                                                            className="w-full p-2 bg-gray-50 rounded-lg border focus:border-[#09BF44] outline-none font-bold text-gray-900"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-xs font-bold text-gray-500">Delivery (Days)</label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            required
                                                            value={pkg.days}
                                                            onChange={(e) => handlePackageChange(idx, 'days', Number(e.target.value))}
                                                            className="w-full p-2 bg-gray-50 rounded-lg border focus:border-[#09BF44] outline-none"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-xs font-bold text-gray-500">Revisions</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            required
                                                            value={pkg.revisions}
                                                            onChange={(e) => handlePackageChange(idx, 'revisions', Number(e.target.value))}
                                                            className="w-full p-2 bg-gray-50 rounded-lg border focus:border-[#09BF44] outline-none"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-xs font-bold text-gray-500">Features (one per line)</label>
                                                        <textarea
                                                            placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                                                            value={Array.isArray(pkg.features) ? pkg.features.join('\n') : pkg.features || ''}
                                                            onChange={(e) => {
                                                                const features = e.target.value.split('\n').filter(f => f.trim());
                                                                handleFeaturesChange(idx, features);
                                                            }}
                                                            className="w-full p-2 bg-gray-50 rounded-lg border focus:border-[#09BF44] outline-none text-sm h-20 resize-none"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 4. Status */}
                                <div className="space-y-4">
                                    <h2 className="text-xl font-bold text-gray-900">Status</h2>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={projectData.isActive}
                                            onChange={(e) => setProjectData({ ...projectData, isActive: e.target.checked })}
                                            className="w-5 h-5 rounded border-gray-300 text-[#09BF44] focus:ring-[#09BF44]"
                                        />
                                        <span className="text-sm font-bold text-gray-700">Active (Project is visible to clients)</span>
                                    </label>
                                </div>

                                <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => router.push('/dashboard/freelancer?tab=projects')}
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
                                        Update Project
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
