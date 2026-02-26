"use client";

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Briefcase, Clock, PlusCircle, ShoppingBag, Wallet, Edit, Loader2, X, Eye, PanelLeft, Flag } from 'lucide-react';
import { api } from '@/lib/api';
import { useModal } from '@/context/ModalContext';
import ClientSidebar from '@/components/ClientSidebar';
import ClientProfileEditModal from '@/components/ClientProfileEditModal';
import EditModal from '@/components/EditModal';
import DashboardMobileTopStrip from '@/components/DashboardMobileTopStrip';
import CountdownTimer from '@/components/CountdownTimer';

function ClientDashboardContent() {
    const { showModal } = useModal();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'jobs' | 'orders' | 'wallet' | 'profile'>('dashboard');

    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [jobs, setJobs] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [walletBalance, setWalletBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [profileEditModal, setProfileEditModal] = useState(false);
    const [editJobModal, setEditJobModal] = useState<any>(null);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    const fetchJobs = useCallback(async () => {
        try {
            const data = await api.client.getMyJobs();
            setJobs(data);
        } catch (err) {
            console.error(err);
        }
    }, []);

    const fetchOrders = useCallback(async () => {
        try {
            const data = await api.client.getMyOrders();
            setOrders(data);
        } catch (err) {
            console.error(err);
        }
    }, []);

    const fetchWallet = useCallback(async () => {
        try {
            const data = await api.wallet.getBalance();
            setWalletBalance(data.balance);
        } catch (err) {
            console.error(err);
        }
    }, []);

    // Read tab from URL on mount and when URL changes
    useEffect(() => {
        const tab = searchParams.get('tab') as 'dashboard' | 'jobs' | 'orders' | 'wallet' | 'profile' | null;
        if (tab && ['dashboard', 'jobs', 'orders', 'wallet', 'profile'].includes(tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

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
                await Promise.all([fetchJobs(), fetchOrders(), fetchWallet()]);
            } catch (err) {
                console.error(err);
                router.push('/');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [router, fetchJobs, fetchOrders, fetchWallet]);

    useEffect(() => {
        if (activeTab === 'jobs') {
            fetchJobs();
        }
        if (activeTab === 'orders') {
            fetchOrders();
        }
        if (activeTab === 'wallet') {
            fetchWallet();
        }
    }, [activeTab, fetchJobs, fetchOrders, fetchWallet]);

    const handleTabChange = (tab: 'dashboard' | 'jobs' | 'orders' | 'wallet' | 'profile') => {
        setActiveTab(tab);
        router.push(`/dashboard/client?tab=${tab}`);
    };

    const handleSaveProfile = async (formData: any) => {
        try {
            const updated = await api.client.updateProfile(formData);
            setProfile(updated);
            setUser(updated);
            showModal({ title: 'Success', message: 'Profile updated successfully', type: 'success' });
            setProfileEditModal(false);
        } catch (err: any) {
            console.error(err);
            showModal({
                title: 'Error',
                message: err.message || 'Failed to update profile',
                type: 'error'
            });
        }
    };

    const handleDeleteJob = async (jobId: string) => {
        showModal({
            title: 'Delete Job',
            message: 'Are you sure you want to delete this job? This action cannot be undone.',
            type: 'confirm',
            onConfirm: async () => {
                try {
                    await api.client.deleteJob(jobId);
                    showModal({ title: 'Success', message: 'Job deleted successfully', type: 'success' });
                    fetchJobs();
                } catch (err: any) {
                    console.error(err);
                    showModal({
                        title: 'Error',
                        message: err.message || 'Failed to delete job',
                        type: 'error'
                    });
                }
            }
        });
    };

    const handleUpdateJob = async (data: any) => {
        if (!editJobModal) return;
        try {
            await api.client.updateJob(editJobModal._id, data);
            showModal({ title: 'Success', message: 'Job updated successfully', type: 'success' });
            setEditJobModal(null);
            fetchJobs();
        } catch (err: any) {
            console.error(err);
            showModal({
                title: 'Error',
                message: err.message || 'Failed to update job',
                type: 'error'
            });
        }
    };

    if (loading || !user || !profile) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#09BF44]" />
            </div>
        );
    }

    const activeJobs = jobs.filter(j => j.status === 'open' || j.status === 'in_progress').length;
    const completedJobs = jobs.filter(j => j.status === 'completed').length;
    const activeOrders = orders.filter(o => o.status === 'active').length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
            {/* Sidebar */}
            <ClientSidebar
                user={user}
                profile={profile}
                onTabChange={handleTabChange}
                activeTab={activeTab}
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

            {/* Main Content */}
            <div className="flex-1 md:ml-72 px-4 sm:px-6 md:p-8 pt-3 md:pt-8 pb-8 overflow-y-auto min-h-screen">
                <DashboardMobileTopStrip />
                <header className="flex flex-wrap justify-between items-center gap-3 mb-7 md:mb-10">
                    <div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setMobileSidebarOpen(true)}
                                className="md:hidden p-2 rounded-lg border border-gray-200 bg-white text-gray-700"
                                aria-label="Open sidebar"
                            >
                                <PanelLeft className="w-5 h-5" />
                            </button>
                            <h2 className="text-2xl md:text-3xl font-black text-gray-900 capitalize">{activeTab}</h2>
                        </div>
                        <p className="text-sm md:text-base text-gray-500 mt-1">Welcome back, {user.firstName}!</p>
                    </div>
                    {activeTab === 'jobs' && (
                        <button
                            onClick={() => router.push('/dashboard/client/jobs/create')}
                            className="w-full sm:w-auto bg-[#09BF44] hover:bg-[#07a63a] text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-200"
                        >
                            <PlusCircle className="w-5 h-5" /> Post New Job
                        </button>
                    )}
                </header>

                {activeTab === 'dashboard' && (
                    <div className="space-y-8">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                            <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-2 md:mb-4">
                                    <div className="p-2 md:p-3 bg-green-50 rounded-xl text-[#09BF44]"><Wallet className="w-5 h-5 md:w-6 md:h-6" /></div>
                                </div>
                                <h3 className="text-gray-500 font-bold text-xs md:text-sm">Wallet Balance</h3>
                                <p className="text-xl md:text-3xl font-black text-gray-900 mt-1">{walletBalance} EGP</p>
                            </div>
                            <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-2 md:mb-4">
                                    <div className="p-2 md:p-3 bg-blue-50 rounded-xl text-blue-600"><Briefcase className="w-5 h-5 md:w-6 md:h-6" /></div>
                                </div>
                                <h3 className="text-gray-500 font-bold text-xs md:text-sm">Active Jobs</h3>
                                <p className="text-xl md:text-3xl font-black text-gray-900 mt-1">{activeJobs}</p>
                            </div>
                            <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-2 md:mb-4">
                                    <div className="p-2 md:p-3 bg-purple-50 rounded-xl text-purple-600"><ShoppingBag className="w-5 h-5 md:w-6 md:h-6" /></div>
                                </div>
                                <h3 className="text-gray-500 font-bold text-xs md:text-sm">Active Orders</h3>
                                <p className="text-xl md:text-3xl font-black text-gray-900 mt-1">{activeOrders}</p>
                            </div>
                            <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-2 md:mb-4">
                                    <div className="p-2 md:p-3 bg-yellow-50 rounded-xl text-yellow-600"><Clock className="w-5 h-5 md:w-6 md:h-6" /></div>
                                </div>
                                <h3 className="text-gray-500 font-bold text-xs md:text-sm">Completed</h3>
                                <p className="text-xl md:text-3xl font-black text-gray-900 mt-1">{completedJobs + completedOrders}</p>
                            </div>
                        </div>

                        {/* Recent Jobs */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="text-lg font-bold">My Jobs</h3>
                                <button onClick={() => handleTabChange('jobs')} className="text-[#09BF44] font-bold text-sm hover:underline">View All</button>
                            </div>
                            <div className="p-6">
                                {jobs.length > 0 ? (
                                    <div className="space-y-4">
                                        {jobs.slice(0, 5).map((job) => (
                                            <div key={job._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-gray-900">{job.title}</h4>
                                                    <p className="text-sm text-gray-500 mt-1">{job.description.substring(0, 100)}...</p>
                                                    <div className="flex items-center gap-4 mt-2">
                                                        <span className="text-xs font-bold text-gray-500">
                                                            Budget: {job.budgetRange.min} - {job.budgetRange.max} EGP
                                                        </span>
                                                        <span className={`px-2 py-1 rounded text-xs font-bold ${job.status === 'open' ? 'bg-green-100 text-green-700' : job.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                                                            {job.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-gray-400">
                                        <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p>No jobs yet. Post your first job to get started!</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent Orders */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="text-lg font-bold">Recent Orders</h3>
                                <button onClick={() => handleTabChange('orders')} className="text-[#09BF44] font-bold text-sm hover:underline">View All</button>
                            </div>
                            <div className="p-6">
                                {orders.length > 0 ? (
                                    <div className="space-y-4">
                                        {orders.slice(0, 5).map((order) => (
                                            <div key={order._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                                <div>
                                                    <h4 className="font-bold text-gray-900">{order.projectId?.title || 'Project'}</h4>
                                                    <p className="text-sm text-gray-500">Seller: {order.sellerId?.firstName} {order.sellerId?.lastName}</p>
                                                    {order.status === 'active' && order.deliveryDate && (
                                                        <div className="mt-2">
                                                            <CountdownTimer deadline={order.deliveryDate} variant="inline" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-black text-gray-900">{order.amount} EGP</p>
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${order.status === 'completed' ? 'bg-green-100 text-green-700' : order.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                                        {order.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-gray-400">
                                        <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p>No orders yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'jobs' && (
                    <div className="space-y-4">
                        {jobs.length > 0 ? (
                            jobs.map((job) => (
                                <div key={job._id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start gap-4 mb-4">
                                        <div className="flex-1">
                                            <button
                                                onClick={() => router.push(`/dashboard/client/jobs/${job._id}`)}
                                                className="text-left text-xl font-bold text-gray-900 hover:text-[#09BF44] transition-colors"
                                            >
                                                {job.title}
                                            </button>
                                            <p className="text-gray-600 mt-2">{job.description.substring(0, 120)}...</p>
                                        </div>
                                        <div className="bg-green-50 text-[#09BF44] font-bold px-4 py-2 rounded-xl shrink-0">
                                            {job.budgetRange.min} - {job.budgetRange.max} EGP
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 mb-4">
                                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                                            {job.proposals?.length || 0} proposal(s)
                                        </span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${job.status === 'open' ? 'bg-green-100 text-green-700' : job.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : job.status === 'completed' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                                            {job.status}
                                        </span>
                                        <span className="text-xs text-gray-500 font-bold">
                                            Posted {new Date(job.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                                        <button
                                            onClick={() => setEditJobModal(job)}
                                            className="bg-gray-100 text-gray-700 font-bold px-4 py-2 rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2"
                                            title="Edit"
                                        >
                                            <Edit className="w-4 h-4" /> Edit
                                        </button>
                                        <button
                                            onClick={() => router.push(`/dashboard/client/jobs/${job._id}`)}
                                            className="bg-gray-100 text-gray-700 font-bold px-4 py-2 rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2"
                                            title="View"
                                        >
                                            <Eye className="w-4 h-4" /> View
                                        </button>
                                        {job.status === 'open' && (
                                            <button
                                                onClick={() => handleDeleteJob(job._id)}
                                                className="bg-red-50 text-red-600 font-bold px-4 py-2 rounded-xl hover:bg-red-100 transition-colors flex items-center gap-2"
                                                title="Delete"
                                            >
                                                <X className="w-4 h-4" /> Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
                                <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <h3 className="text-xl font-bold text-gray-900 mb-2">No Jobs Yet</h3>
                                <p className="text-gray-500 mb-6">Post your first job to find talented freelancers.</p>
                                <button
                                    onClick={() => router.push('/dashboard/client/jobs/create')}
                                    className="bg-[#09BF44] hover:bg-[#07a63a] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors mx-auto"
                                >
                                    <PlusCircle className="w-5 h-5" /> Post your first Job
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div className="space-y-4">
                        {orders.length > 0 ? (
                            orders.map((order) => (
                                <div key={order._id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start gap-4 mb-4">
                                        <div className="flex-1">
                                            <h4 className="text-xl font-bold text-gray-900">{order.projectId?.title || 'Project'}</h4>
                                            <p className="text-gray-500 text-sm mt-1">
                                                Seller: {order.sellerId?.firstName} {order.sellerId?.lastName}
                                            </p>
                                            {order.status === 'active' && order.deliveryDate && (
                                                <div className="mt-2">
                                                    <CountdownTimer deadline={order.deliveryDate} variant="inline" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-xl font-black text-gray-900">{order.amount} EGP</p>
                                            <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold ${order.status === 'completed' ? 'bg-green-100 text-green-700' : order.status === 'disputed' ? 'bg-amber-100 text-amber-700' : order.status === 'refunded' ? 'bg-gray-100 text-gray-700' : order.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-100">
                                        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">
                                            {order.packageType}
                                        </span>
                                        <span className="text-xs text-gray-500 font-bold">
                                            Ordered {new Date(order.createdAt).toLocaleDateString()}
                                        </span>
                                        {order.status === 'active' && (
                                            <button
                                                onClick={async () => {
                                                    if (!confirm('Raise a dispute? Our team will review and resolve it.')) return;
                                                    try {
                                                        await api.client.raiseDispute(order._id);
                                                        showModal({ title: 'Dispute Raised', message: 'Our team will review and resolve it shortly.', type: 'success' });
                                                        fetchOrders();
                                                    } catch (e: any) {
                                                        showModal({ title: 'Error', message: e.message || 'Failed to raise dispute', type: 'error' });
                                                    }
                                                }}
                                                className="text-amber-600 hover:text-amber-700 text-xs font-bold flex items-center gap-1"
                                            >
                                                <Flag className="w-3.5 h-3.5" /> Raise Dispute
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
                                <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>No orders yet.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'wallet' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-2xl font-black text-gray-900">Wallet Balance</h3>
                                    <p className="text-gray-500 mt-1">Funds are held securely in Escrow until job completion.</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-5xl font-black text-[#09BF44]">{walletBalance} EGP</p>
                                </div>
                            </div>
                            <button
                                onClick={() => router.push('/dashboard/client/wallet')}
                                className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors"
                            >
                                Manage Wallet
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'profile' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="text-lg font-bold">Profile Information</h3>
                                <button
                                    onClick={() => setProfileEditModal(true)}
                                    className="bg-black text-white text-sm px-3 py-1.5 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-800 transition-colors"
                                >
                                    <Edit className="w-4 h-4" /> Edit Profile
                                </button>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-sm font-bold text-gray-500 mb-2 block">Full Name</label>
                                        <p className="text-gray-900 font-bold">{profile.firstName} {profile.lastName}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold text-gray-500 mb-2 block">Email</label>
                                        <p className="text-gray-900 font-bold">{profile.email}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold text-gray-500 mb-2 block">Phone Number</label>
                                        <p className="text-gray-900 font-bold">{profile.phoneNumber || 'Not set'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold text-gray-500 mb-2 block">Business Type</label>
                                        <p className="text-gray-900 font-bold capitalize">{profile.businessType || 'Personal'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Profile Edit Modal */}
            {profileEditModal && (
                <ClientProfileEditModal
                    isOpen={profileEditModal}
                    onClose={() => setProfileEditModal(false)}
                    onSave={handleSaveProfile}
                    profile={profile}
                />
            )}

            {/* Job Edit Modal */}
            {editJobModal && (
                <EditModal
                    isOpen={!!editJobModal}
                    onClose={() => setEditJobModal(null)}
                    title="Edit Job"
                    fields={[
                        { name: 'title', label: 'Title', type: 'text', defaultValue: editJobModal.title || '' },
                        { name: 'description', label: 'Description', type: 'textarea', defaultValue: editJobModal.description || '' },
                        { name: 'budgetMin', label: 'Min Budget (EGP)', type: 'text', defaultValue: String(editJobModal.budgetRange?.min || 500) },
                        { name: 'budgetMax', label: 'Max Budget (EGP)', type: 'text', defaultValue: String(editJobModal.budgetRange?.max || 1000) },
                        {
                            name: 'status',
                            label: 'Status',
                            type: 'select',
                            options: ['open', 'in_progress', 'completed', 'closed'],
                            defaultValue: editJobModal.status || 'open'
                        }
                    ]}
                    onSave={(data) => {
                        handleUpdateJob({
                            ...data,
                            budgetMin: Number(data.budgetMin),
                            budgetMax: Number(data.budgetMax)
                        });
                    }}
                />
            )}
        </div>
    );
}

export default function ClientDashboard() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-[#09BF44]" />
            </div>
        }>
            <ClientDashboardContent />
        </Suspense>
    );
}
