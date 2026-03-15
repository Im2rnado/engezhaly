"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Loader2, Upload, PanelLeft, X as XIcon } from 'lucide-react';
import { useModal } from '@/context/ModalContext';
import FreelancerSidebar from '@/components/FreelancerSidebar';
import { CATEGORIES } from '@/lib/categories';
import DashboardMobileTopStrip from '@/components/DashboardMobileTopStrip';

export default function CreateOfferPage() {
    const { showModal } = useModal();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    const [imageUploading, setImageUploading] = useState(false);
    const [imageUploadProgress, setImageUploadProgress] = useState(0);
    const [projectData, setProjectData] = useState({
        title: '',
        description: '',
        category: '',
        subCategory: '',
        consultationPrice: 100,
        images: [] as string[],
        packages: [
            { type: 'Basic', price: 500, days: 3, features: [''], revisions: 0 },
            { type: 'Standard', price: 1000, days: 5, features: [''], revisions: 1 },
            { type: 'Premium', price: 2000, days: 7, features: [''], revisions: 2 }
        ]
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/');
            return;
        }

        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        setUser(storedUser);

        api.freelancer.getProfile().then(data => {
            setProfile(data);
            if (data.role !== 'freelancer') {
                router.push('/');
            } else if (data.freelancerProfile?.category) {
                setProjectData(prev => ({ ...prev, category: data.freelancerProfile.category }));
            }
        }).catch(() => {
            router.push('/');
        }).finally(() => {
            setProfileLoading(false);
        });
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
        newPackages[index] = { ...newPackages[index], features: features.length ? features : [''] };
        setProjectData({ ...projectData, packages: newPackages });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const lockedCategory = profile?.freelancerProfile?.category;
        if (!lockedCategory) {
            setError('You must complete your profile with a category before creating offers.');
            setLoading(false);
            return;
        }
        if (projectData.category !== lockedCategory) {
            setError('Category must match your profile. Please refresh the page.');
            setLoading(false);
            return;
        }
        if (projectData.packages.some(p => p.price < 500)) {
            setError('Minimum price for any package is 500 EGP.');
            setLoading(false);
            return;
        }

        try {
            await api.projects.create({
                ...projectData,
                consultationPrice: Number(projectData.consultationPrice) || 100,
                packages: projectData.packages.map(p => ({
                    ...p,
                    price: Number(p.price),
                    days: Number(p.days),
                    revisions: Number(p.revisions),
                    features: Array.isArray(p.features) ? p.features.filter((f: string) => f?.trim()) : []
                }))
            });
            showModal({ title: 'Success', message: 'Offer Created Successfully!', type: 'success' });
            router.push('/dashboard/freelancer?tab=offers');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
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
            <FreelancerSidebar
                user={user}
                profile={profile}
                onToggleBusy={toggleBusy}
                activeTab="offers"
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
                <div className="max-w-4xl mx-auto">
                    <header className="mb-6 md:mb-10 pt-4 md:pt-0">
                        <div className="flex items-center gap-3 mb-2">
                            <button
                                onClick={() => setMobileSidebarOpen(true)}
                                className="md:hidden p-2 rounded-lg border border-gray-200 bg-white text-gray-700"
                                aria-label="Open sidebar"
                            >
                                <PanelLeft className="w-5 h-5" />
                            </button>
                            <h1 className="text-2xl md:text-3xl font-black text-gray-900">Create New Offer</h1>
                        </div>
                        <p className="text-gray-500">Set up your service and start selling.</p>
                    </header>

                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-5 md:p-12">
                            {error && <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-6">{error}</div>}

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="space-y-4">
                                    <h2 className="text-xl font-bold text-gray-900">Offer Overview</h2>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Offer Title</label>
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
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Offer Description</label>
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
                                            <div className="w-full p-4 bg-gray-100 rounded-xl border-2 border-gray-200 text-gray-700 font-medium">
                                                {projectData.category || (profile?.freelancerProfile?.category ? profile.freelancerProfile.category : '—')}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">Your main category is locked and cannot be changed.</p>
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
                                    {!profile?.freelancerProfile?.category && (
                                        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-sm">
                                            You need to complete your profile with a category before creating offers. Go to Profile to add your category.
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Consultation Price (EGP)</label>
                                        <p className="text-xs text-gray-500 mb-1">Price for video/voice calls when clients book a consultation. This amount goes to your balance.</p>
                                        <input
                                            type="number"
                                            min="0"
                                            value={projectData.consultationPrice}
                                            onChange={(e) => setProjectData({ ...projectData, consultationPrice: Number(e.target.value) || 100 })}
                                            className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none max-w-xs"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Banner Images (Up to 7)</label>
                                        {projectData.images.length > 0 && (
                                            <div className="flex flex-wrap gap-3 mb-3">
                                                {projectData.images.map((url, idx) => (
                                                    <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-200 group">
                                                        <img src={url} alt={`Banner ${idx + 1}`} className="w-full h-full object-cover" />
                                                        <button
                                                            type="button"
                                                            onClick={() => setProjectData({ ...projectData, images: projectData.images.filter((_, i) => i !== idx) })}
                                                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                                        >
                                                            <XIcon className="w-6 h-6 text-white" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {projectData.images.length < 7 && (
                                            <label className={`block border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${imageUploading ? 'border-[#09BF44] bg-green-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    className="hidden"
                                                    disabled={imageUploading}
                                                    onChange={async (e) => {
                                                        const files = Array.from(e.target.files || []).slice(0, 7 - projectData.images.length);
                                                        if (!files.length) return;
                                                        setImageUploading(true);
                                                        for (let i = 0; i < files.length; i++) {
                                                            setImageUploadProgress(0);
                                                            try {
                                                                const url = await api.upload.file(files[i], { onProgress: (p) => setImageUploadProgress(p) });
                                                                setProjectData(prev => ({ ...prev, images: [...prev.images, url] }));
                                                            } catch (err: any) {
                                                                showModal({ title: 'Upload Failed', message: err.message || 'Failed to upload image', type: 'error' });
                                                            }
                                                        }
                                                        setImageUploading(false);
                                                        e.target.value = '';
                                                    }}
                                                />
                                                {imageUploading ? (
                                                    <>
                                                        <Loader2 className="w-8 h-8 text-[#09BF44] mx-auto mb-2 animate-spin" />
                                                        <p className="text-sm font-bold text-[#09BF44]">Uploading... {imageUploadProgress}%</p>
                                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden mt-2 max-w-[200px] mx-auto">
                                                            <div className="h-full bg-[#09BF44] transition-all" style={{ width: `${imageUploadProgress}%` }} />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                                        <p className="text-gray-500 font-bold">Click to Upload Images</p>
                                                        <p className="text-xs text-gray-400 mt-1">Max 7 images. JPG, PNG, WebP</p>
                                                    </>
                                                )}
                                            </label>
                                        )}
                                    </div>
                                </div>

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
                                                        <label className="text-xs font-bold text-gray-500">Features (press Enter for new line)</label>
                                                        <textarea
                                                            placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                                                            value={(Array.isArray(pkg.features) ? pkg.features : ['']).join('\n')}
                                                            onChange={(e) => {
                                                                const arr = e.target.value.split('\n');
                                                                handleFeaturesChange(idx, arr?.length ? arr : ['']);
                                                            }}
                                                            className="w-full p-3 bg-gray-50 rounded-lg border focus:border-[#09BF44] outline-none text-sm min-h-[88px] resize-y"
                                                        />
                                                        {Array.isArray(pkg.features) && pkg.features.filter(Boolean).length > 0 && (
                                                            <div className="flex flex-wrap gap-2 mt-2">
                                                                {pkg.features.filter(Boolean).map((f, i) => (
                                                                    <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-[#09BF44]/10 text-[#09BF44] rounded-lg text-xs font-medium">
                                                                        {f}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => router.push('/dashboard/freelancer?tab=offers')}
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
                                        Publish Offer
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
