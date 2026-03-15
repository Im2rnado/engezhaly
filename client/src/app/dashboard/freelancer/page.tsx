"use client";

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Briefcase, DollarSign, PlusCircle, ShoppingBag, Star, CheckCircle, Loader2, Edit, Award, MessageSquare, X, PanelLeft, Flag } from 'lucide-react';
import { api } from '@/lib/api';
import { formatStatus, formatDateDDMMYYYY } from '@/lib/utils';
import { useModal } from '@/context/ModalContext';
import ProjectCard from '@/components/ProjectCard';
import { MAIN_CATEGORIES } from '@/lib/categories';
import ProfileEditModal from '@/components/ProfileEditModal';
import PortfolioSection from '@/components/PortfolioSection';
import FreelancerSidebar from '@/components/FreelancerSidebar';
import DashboardMobileTopStrip from '@/components/DashboardMobileTopStrip';
import CountdownTimer from '@/components/CountdownTimer';

function FreelancerDashboardContent() {
    const { showModal } = useModal();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'offers' | 'orders' | 'profile' | 'portfolio'>('dashboard');

    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [projects, setProjects] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [profileEditModal, setProfileEditModal] = useState(false);
    const [workOrder, setWorkOrder] = useState<any>(null);
    const [submittingWork, setSubmittingWork] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [workSubmission, setWorkSubmission] = useState({
        message: '',
        links: '',
        files: [] as File[]
    });

    const fetchProjects = useCallback(async () => {
        try {
            const data = await api.projects.getMyProjects();
            setProjects(data);
        } catch (err) {
            console.error(err);
        }
    }, []);

    const fetchOrders = useCallback(async () => {
        try {
            const data = await api.freelancer.getMyOrders();
            setOrders(data || []);
        } catch {
            setOrders([]);
        }
    }, []);

    // Read tab from URL on mount and when URL changes
    useEffect(() => {
        const tab = searchParams.get('tab') as 'dashboard' | 'offers' | 'orders' | 'profile' | null;
        if (tab && ['dashboard', 'offers', 'orders', 'profile'].includes(tab)) {
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
                const profileData = await api.freelancer.getProfile();
                setProfile(profileData);
                if (profileData.role !== 'freelancer') {
                    router.push('/');
                    return;
                }
                const projectsData = await api.projects.getMyProjects();
                setProjects(projectsData);

                // Fetch freelancer orders
                try {
                    const myOrdersData = await api.freelancer.getMyOrders();
                    setOrders(myOrdersData || []);
                } catch {
                    setOrders([]);
                }

            } catch (err) {
                console.error(err);
                router.push('/');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [router]);

    useEffect(() => {
        if (activeTab === 'offers') {
            fetchProjects();
        }
        if (activeTab === 'orders' && user?._id) {
            fetchOrders();
        }
    }, [activeTab, user?._id, fetchProjects, fetchOrders]);

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

    const handleSaveProfile = async (formData: any) => {
        try {
            const updated = await api.freelancer.updateProfile(formData);
            setProfile(updated);
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

    const openChatWithClientOrder = async (order: any) => {
        try {
            const clientId = String(order?.buyerId?._id || order?.buyerId || '');
            if (!clientId) {
                showModal({ title: 'Error', message: 'Client not found for this order', type: 'error' });
                return;
            }

            const conversations = await api.chat.getConversations();
            let conversation = (conversations || []).find((c: any) =>
                String(c.partnerId?._id || c.partnerId) === clientId
            );

            if (!conversation) {
                await api.chat.sendMessage({
                    receiverId: clientId,
                    content: `Hi! I have an update regarding your order for: ${order.projectId?.title || 'your offer'}`,
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

    const openSubmitOrderWork = (order: any) => {
        setWorkOrder(order);
        setWorkSubmission({
            message: order?.workSubmission?.message || '',
            links: (order?.workSubmission?.links || []).join(', '),
            files: []
        });
    };

    const handleSubmitOrderWork = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!workOrder) return;
        setSubmittingWork(true);
        setUploadProgress(null);
        try {
            const fileUrls: string[] = [];
            const files = workSubmission.files;
            if (files.length > 0) {
                for (let i = 0; i < files.length; i++) {
                    const url = await api.upload.file(files[i], {
                        onProgress: (p) => setUploadProgress(Math.round(((i + p / 100) / files.length) * 100))
                    });
                    fileUrls.push(url);
                }
            }
            setUploadProgress(100);

            const links = workSubmission.links
                .split(/[\n, ]+/)
                .map((l) => l.trim())
                .filter(Boolean);

            await api.freelancer.submitOrderWork(workOrder._id, {
                message: workSubmission.message,
                links,
                files: fileUrls
            });

            showModal({ title: 'Success', message: 'Work submitted successfully!', type: 'success' });
            setWorkOrder(null);
            setWorkSubmission({ message: '', links: '', files: [] });
            await fetchOrders();
        } catch (err: any) {
            showModal({ title: 'Error', message: err.message || 'Failed to submit work', type: 'error' });
        } finally {
            setSubmittingWork(false);
            setUploadProgress(null);
        }
    };

    if (loading || !user || !profile) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#09BF44]" />
            </div>
        );
    }

    const isPending = profile.freelancerProfile?.status === 'pending';
    const walletBalance = user.walletBalance || 0;
    const activeOrdersCount = orders.filter((o: any) => o.status === 'active').length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const avgRating = orders.filter(o => o.rating).length > 0
        ? (orders.filter(o => o.rating).reduce((sum: number, o: any) => sum + o.rating, 0) / orders.filter(o => o.rating).length).toFixed(1)
        : 'N/A';
    const orderCountByProject = orders.reduce((acc: Record<string, number>, order: any) => {
        const projectId = String(order?.projectId?._id || order?.projectId || '');
        if (!projectId) return acc;
        acc[projectId] = (acc[projectId] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
            {/* Sidebar */}
            <FreelancerSidebar
                user={user}
                profile={profile}
                onToggleBusy={toggleBusy}
                onTabChange={(tab) => {
                    setActiveTab(tab);
                    router.push(`/dashboard/freelancer?tab=${tab}`);
                }}
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
                        <p className="text-xs md:text-sm text-gray-400 mt-0.5">
                            {activeTab === 'dashboard' && 'Overview of your offers, orders, and earnings.'}
                            {activeTab === 'offers' && 'Manage your service offers and pricing.'}
                            {activeTab === 'orders' && 'View and fulfill orders from clients.'}
                            {activeTab === 'profile' && 'Edit your profile and professional details.'}
                        </p>
                    </div>
                </header>

                {/* Busy status banner - visible in main dashboard area */}
                {profile?.freelancerProfile?.status !== 'pending' && (
                    <div className={`mb-6 rounded-2xl border-2 p-4 flex flex-wrap items-center justify-between gap-3 ${profile?.freelancerProfile?.isBusy ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                        <div className="flex items-center gap-3">
                            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold ${profile?.freelancerProfile?.isBusy ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                {profile?.freelancerProfile?.isBusy ? 'Busy' : 'Available'}
                            </span>
                            <span className="text-sm text-gray-600">
                                {profile?.freelancerProfile?.isBusy ? 'Clients cannot place new orders.' : 'You are accepting orders.'}
                            </span>
                        </div>
                    </div>
                )}

                {activeTab === 'dashboard' && (
                    <div className="space-y-8">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                            <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-2 md:mb-4">
                                    <div className="p-2 md:p-3 bg-green-50 rounded-xl text-[#09BF44]"><DollarSign className="w-5 h-5 md:w-6 md:h-6" /></div>
                                </div>
                                <h3 className="text-gray-500 font-bold text-xs md:text-sm">Wallet Balance</h3>
                                <p className="text-xl md:text-3xl font-black text-gray-900 mt-1">{walletBalance} EGP</p>
                            </div>
                            <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-2 md:mb-4">
                                    <div className="p-2 md:p-3 bg-blue-50 rounded-xl text-blue-600"><ShoppingBag className="w-5 h-5 md:w-6 md:h-6" /></div>
                                </div>
                                <h3 className="text-gray-500 font-bold text-xs md:text-sm">Active Orders</h3>
                                <p className="text-xl md:text-3xl font-black text-gray-900 mt-1">{activeOrdersCount}</p>
                            </div>
                            <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-2 md:mb-4">
                                    <div className="p-2 md:p-3 bg-purple-50 rounded-xl text-purple-600"><CheckCircle className="w-5 h-5 md:w-6 md:h-6" /></div>
                                </div>
                                <h3 className="text-gray-500 font-bold text-xs md:text-sm">Completed</h3>
                                <p className="text-xl md:text-3xl font-black text-gray-900 mt-1">{completedOrders}</p>
                            </div>
                            <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-2 md:mb-4">
                                    <div className="p-2 md:p-3 bg-yellow-50 rounded-xl text-yellow-600"><Star className="w-5 h-5 md:w-6 md:h-6" /></div>
                                </div>
                                <h3 className="text-gray-500 font-bold text-xs md:text-sm">Average Rating</h3>
                                <p className="text-xl md:text-3xl font-black text-gray-900 mt-1">{avgRating}</p>
                            </div>
                        </div>

                        {/* Recent Offers */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="text-lg font-bold">My Offers</h3>
                                <button onClick={() => {
                                    setActiveTab('offers');
                                    router.push('/dashboard/freelancer?tab=offers');
                                }} className="text-[#09BF44] font-bold text-sm hover:underline">View All</button>
                            </div>
                            <div className="p-6">
                                {projects.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {projects.slice(0, 6).map((project) => (
                                            <div key={project._id} className="space-y-2">
                                                <ProjectCard
                                                    project={project}
                                                    onEdit={() => router.push(`/dashboard/freelancer/offers/${project._id}/edit`)}
                                                />
                                                <div className="px-2 text-xs font-bold text-gray-500">
                                                    Orders received: {orderCountByProject[project._id] || 0}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-gray-400">
                                        <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p>No offers yet. Create your first offer to start earning!</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent Orders */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="text-lg font-bold">Recent Orders</h3>
                                <button onClick={() => {
                                    setActiveTab('orders');
                                    router.push('/dashboard/freelancer?tab=orders');
                                }} className="text-[#09BF44] font-bold text-sm hover:underline">View All</button>
                            </div>
                            <div className="p-6">
                                {orders.length > 0 ? (
                                    <div className="space-y-4">
                                        {orders.slice(0, 5).map((order) => (
                                            <div key={order._id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h4 className="font-bold text-gray-900">{order.projectId?.title || 'Offer'}</h4>
                                                        <p className="text-sm text-gray-500">Buyer: {order.buyerId?.firstName} {order.buyerId?.lastName}</p>
                                                        {order.status === 'active' && order.deliveryDate && (
                                                            <div className="mt-2">
                                                                <CountdownTimer deadline={order.deliveryDate} variant="inline" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-black text-gray-900">{order.amount} EGP</p>
                                                        <span className={`px-2 py-1 rounded text-xs font-bold ${order.status === 'completed' ? 'bg-green-100 text-green-700' : order.status === 'active' ? 'bg-blue-100 text-blue-700' : order.status === 'pending_approval' || order.status === 'pending_payment' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                                            {formatStatus(order.status)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-gray-200">
                                                    <span className="text-xs text-gray-500 font-bold">
                                                        Ordered {formatDateDDMMYYYY(order.createdAt)}
                                                    </span>
                                                    {order.deliveryDate && (
                                                        <span className="text-xs text-gray-500 font-bold">
                                                            Delivery {formatDateDDMMYYYY(order.deliveryDate)}
                                                        </span>
                                                    )}
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

                {activeTab === 'offers' && (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold">My Offers ({projects.length})</h3>
                            {!isPending && (
                                <button
                                    onClick={() => router.push('/dashboard/freelancer/offers/create')}
                                    className="bg-[#09BF44] hover:bg-[#07a63a] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors"
                                >
                                    <PlusCircle className="w-4 h-4" /> New Offer
                                </button>
                            )}
                        </div>
                        <div className="p-6">
                            {projects.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {projects.map((project) => (
                                        <div key={project._id} className="space-y-2">
                                            <ProjectCard
                                                project={project}
                                                onEdit={() => router.push(`/dashboard/freelancer/offers/${project._id}/edit`)}
                                            />
                                            <div className="px-2 text-xs font-bold text-gray-500">
                                                Orders received: {orderCountByProject[project._id] || 0}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-400">
                                    <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Offers Yet</h3>
                                    <p className="text-gray-500 mb-6">Start selling your services to clients.</p>
                                    {!isPending && (
                                        <button
                                            onClick={() => router.push('/dashboard/freelancer/offers/create')}
                                            className="bg-[#09BF44] hover:bg-[#07a63a] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors mx-auto"
                                        >
                                            <PlusCircle className="w-5 h-5" /> Create your first Offer
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div className="space-y-4">
                        {orders.length > 0 ? (
                            orders.map((order) => (
                                <div key={order._id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                        <div className="flex-1">
                                            <h4 className="text-xl font-bold text-gray-900">{order.projectId?.title || 'Offer'}</h4>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Buyer: {order.buyerId?.firstName} {order.buyerId?.lastName}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-black text-gray-900">{order.amount} EGP</p>
                                            <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold ${order.status === 'completed' ? 'bg-green-100 text-green-700' : order.status === 'disputed' ? 'bg-amber-100 text-amber-700' : order.status === 'refunded' ? 'bg-gray-100 text-gray-700' : order.status === 'pending_approval' || order.status === 'pending_payment' ? 'bg-amber-100 text-amber-700' : order.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                                {formatStatus(order.status)}
                                            </span>
                                        </div>
                                    </div>
                                    {order.status === 'active' && order.deliveryDate && (
                                        <div className="mb-3">
                                            <CountdownTimer deadline={order.deliveryDate} variant="inline" />
                                        </div>
                                    )}
                                    <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                                        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">
                                            {order.packageType}
                                            {order.projectId?.subCategory && ` • ${order.projectId.subCategory}`}
                                        </span>
                                        <span className="text-xs text-gray-500 font-bold">
                                            Ordered {formatDateDDMMYYYY(order.createdAt)}
                                        </span>
                                        {order.deliveryDate && (
                                            <span className="text-xs text-gray-500 font-bold">
                                                Delivery {formatDateDDMMYYYY(order.deliveryDate)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                                        <div className="text-sm text-gray-600">
                                            {order.status === 'pending_approval' && order.description && (
                                                <p className="text-gray-700 mb-2"><strong>Description:</strong> {order.description}</p>
                                            )}
                                            {order?.workSubmission?.updatedAt
                                                ? `Last submitted: ${new Date(order.workSubmission.updatedAt).toLocaleString()}`
                                                : order.status !== 'pending_approval' && 'No work submitted yet'}
                                        </div>
                                        <div className="flex gap-2 flex-wrap">
                                            <button
                                                onClick={() => openChatWithClientOrder(order)}
                                                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center gap-2"
                                            >
                                                <MessageSquare className="w-4 h-4" /> Message Client
                                            </button>
                                            {order.status === 'pending_approval' ? (
                                                <>
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                await api.freelancer.approveOrder(order._id);
                                                                showModal({ title: 'Order Approved', message: 'The client has been notified.', type: 'success' });
                                                                fetchOrders();
                                                            } catch (e: any) {
                                                                showModal({ title: 'Error', message: e.message || 'Failed to approve', type: 'error' });
                                                            }
                                                        }}
                                                        className="px-5 py-2 rounded-xl font-bold bg-green-600 text-white hover:bg-green-700 transition-colors"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            if (!confirm('Deny this order? The client will be refunded.')) return;
                                                            try {
                                                                await api.freelancer.denyOrder(order._id);
                                                                showModal({ title: 'Order Denied', message: 'The client has been refunded and notified.', type: 'success' });
                                                                fetchOrders();
                                                            } catch (e: any) {
                                                                showModal({ title: 'Error', message: e.message || 'Failed to deny', type: 'error' });
                                                            }
                                                        }}
                                                        className="px-5 py-2 rounded-xl font-bold bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                                                    >
                                                        Deny
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => openSubmitOrderWork(order)}
                                                        disabled={order.status !== 'active'}
                                                        className={`px-5 py-2 rounded-xl font-bold transition-colors ${order.status === 'active'
                                                            ? 'bg-[#09BF44] text-white hover:bg-[#07a63a]'
                                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                            }`}
                                                    >
                                                        {order?.workSubmission?.updatedAt ? 'Update Submission' : 'Submit Work'}
                                                    </button>
                                                    {order.status === 'active' && (
                                                        <button
                                                            onClick={async () => {
                                                                if (!confirm('Raise a dispute? Our team will review and resolve it.')) return;
                                                                try {
                                                                    await api.freelancer.raiseDispute(order._id);
                                                                    showModal({ title: 'Dispute Raised', message: 'Our team will review and resolve it shortly.', type: 'success' });
                                                                    fetchOrders();
                                                                } catch (e: any) {
                                                                    showModal({ title: 'Error', message: e.message || 'Failed to raise dispute', type: 'error' });
                                                                }
                                                            }}
                                                            className="text-amber-600 hover:text-amber-700 px-4 py-2 rounded-xl font-bold hover:bg-amber-50 transition-colors flex items-center gap-2"
                                                        >
                                                            <Flag className="w-4 h-4" /> Raise Dispute
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center text-gray-400">
                                <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>No orders yet.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'profile' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="text-lg font-bold">Profile Information</h3>
                                <button
                                    onClick={() => setProfileEditModal(true)}
                                    className="bg-[#09BF44] text-white text-sm px-3 py-1.5 rounded-xl font-bold flex items-center gap-2 hover:bg-[#07a63a] transition-colors"
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
                                        <label className="text-sm font-bold text-gray-500 mb-2 block">Category</label>
                                        <p className="text-gray-900 font-bold">{profile.freelancerProfile?.category || 'Not set'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold text-gray-500 mb-2 block">Experience</label>
                                        <p className="text-gray-900 font-bold">{profile.freelancerProfile?.experienceYears || 0} Years</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold text-gray-500 mb-2 block">Status</label>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${profile.freelancerProfile?.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {profile.freelancerProfile?.status === 'approved' ? 'Approved' : 'Pending Review'}
                                        </span>
                                    </div>
                                    {profile.freelancerProfile?.isEmployeeOfMonth && (
                                        <div>
                                            <label className="text-sm font-bold text-gray-500 mb-2 block">Achievement</label>
                                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 flex items-center gap-1 w-fit">
                                                <Award className="w-3 h-3" /> Employee of the Month
                                            </span>
                                        </div>
                                    )}
                                </div>
                                {profile.freelancerProfile?.bio && (
                                    <div>
                                        <label className="text-sm font-bold text-gray-500 mb-2 block">Bio</label>
                                        <p className="text-gray-700">{profile.freelancerProfile.bio}</p>
                                    </div>
                                )}
                                {(() => {
                                    const fp = profile.freelancerProfile;
                                    const techSkills = (fp?.technicalSkills?.length > 0) ? fp.technicalSkills : (fp?.skills || []);
                                    const softSkills = fp?.softSkills || [];
                                    const hasSkills = techSkills.length > 0 || softSkills.length > 0;
                                    if (!hasSkills && !(fp?.certifications?.filter((c: any) => c.name?.trim()).length)) return null;
                                    return (
                                        <div className="space-y-3">
                                            {techSkills.length > 0 && (
                                                <div>
                                                    <label className="text-sm font-bold text-gray-500 mb-2 block">Technical Skills</label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {techSkills.map((skill: string, idx: number) => (
                                                            <span key={idx} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">{skill}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {softSkills.length > 0 && (
                                                <div>
                                                    <label className="text-sm font-bold text-gray-500 mb-2 block">Soft Skills</label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {softSkills.map((skill: string, idx: number) => (
                                                            <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">{skill}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {fp?.certifications && fp.certifications.filter((c: any) => c.name?.trim()).length > 0 && (
                                                <div>
                                                    <label className="text-sm font-bold text-gray-500 mb-2 block">Certifications</label>
                                                    <ul className="space-y-2">
                                                        {fp.certifications.map((c: any, idx: number) => (
                                                            <li key={idx} className="bg-gray-50 px-4 py-3 rounded-xl">
                                                                <span className="font-bold text-gray-900">{c.name}</span>
                                                                {(c.institute || c.date) && (
                                                                    <span className="text-gray-600 text-sm">
                                                                        {c.institute && ` • ${c.institute}`}
                                                                        {c.date && ` • ${formatDateDDMMYYYY(c.date)}`}
                                                                    </span>
                                                                )}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>

                        <PortfolioSection
                            profile={profile}
                            onProfileUpdate={(updated) => setProfile(updated)}
                        />
                    </div>
                )}
            </div>

            {/* Work Submission Modal */}
            {workOrder && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">
                                Submit Work - {workOrder.title || workOrder.projectId?.title || 'Order'}
                            </h3>
                            <button
                                onClick={() => setWorkOrder(null)}
                                className="text-gray-400 hover:text-gray-600"
                                disabled={submittingWork}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmitOrderWork} className="space-y-4 p-6">
                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                You can submit your work using: a link to your project, a Google Drive or Dropbox link, or by uploading the deliverable directly.
                            </p>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Message / Notes</label>
                                <textarea
                                    value={workSubmission.message}
                                    onChange={(e) => setWorkSubmission((prev) => ({ ...prev, message: e.target.value }))}
                                    rows={4}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#09BF44]"
                                    placeholder="Describe what you completed..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Links (optional)</label>
                                <input
                                    type="text"
                                    value={workSubmission.links}
                                    onChange={(e) => setWorkSubmission((prev) => ({ ...prev, links: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#09BF44]"
                                    placeholder="https://drive.google.com/... , https://figma.com/..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Files (optional)</label>
                                <input
                                    type="file"
                                    multiple
                                    onChange={(e) => setWorkSubmission((prev) => ({ ...prev, files: Array.from(e.target.files || []) }))}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700 file:font-semibold"
                                />
                                {workSubmission.files.length > 0 && (
                                    <p className="text-xs text-gray-500 mt-2">{workSubmission.files.length} file(s) selected</p>
                                )}
                            </div>
                            {uploadProgress !== null && workSubmission.files.length > 0 && (
                                <div className="space-y-1.5">
                                    <p className="text-sm font-medium text-[#09BF44]">
                                        Uploading files... {uploadProgress}%
                                    </p>
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#09BF44] transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                                    </div>
                                </div>
                            )}
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setWorkOrder(null)}
                                    className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-colors"
                                    disabled={submittingWork}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingWork}
                                    className="px-5 py-2 rounded-xl bg-[#09BF44] text-white font-bold hover:bg-[#07a63a] transition-colors disabled:opacity-60 flex items-center gap-2"
                                >
                                    {submittingWork && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {submittingWork ? 'Submitting...' : 'Submit Work'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Profile Edit Modal */}
            {profileEditModal && (
                <ProfileEditModal
                    isOpen={profileEditModal}
                    onClose={() => setProfileEditModal(false)}
                    onSave={handleSaveProfile}
                    profile={profile}
                    mainCategories={MAIN_CATEGORIES}
                />
            )}
        </div>
    );
}

export default function FreelancerDashboard() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-[#09BF44]" />
            </div>
        }>
            <FreelancerDashboardContent />
        </Suspense>
    );
}
