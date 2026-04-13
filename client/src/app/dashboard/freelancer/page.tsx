"use client";

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Briefcase, DollarSign, PlusCircle, ShoppingBag, Star, CheckCircle, Loader2, Edit, Award, PanelLeft } from 'lucide-react';
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
    const [activeTab, setActiveTab] = useState<'dashboard' | 'offers' | 'orders' | 'profile' | 'portfolio' | 'help'>('dashboard');

    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [projects, setProjects] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [profileEditModal, setProfileEditModal] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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

    if (loading || !user || !profile) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#09BF44]" />
            </div>
        );
    }

    const isPending = profile.freelancerProfile?.status === 'pending';
    const walletBalance = user.walletBalance || 0;
    const activeOrdersCount = orders.filter((o: any) =>
        ['pending_approval', 'pending_payment', 'active', 'disputed'].includes(o.status)
    ).length;
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
                                                        <p className="text-sm text-gray-500">Client: {order.buyerId?.firstName} {order.buyerId?.lastName}</p>
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

                {activeTab === 'orders' && (() => {
                    const activeList = orders.filter((o: any) =>
                        ['pending_approval', 'pending_payment', 'active', 'disputed'].includes(o.status)
                    );
                    const finishedList = orders.filter((o: any) => ['completed', 'refunded'].includes(o.status));

                    const OrderCard = ({ order }: { order: any }) => (
                        <button
                            type="button"
                            onClick={() => router.push(`/dashboard/freelancer/orders/${order._id}`)}
                            className="w-full text-left bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-[#09BF44]/40 hover:shadow-md transition-all"
                        >
                            <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="min-w-0">
                                    <h4 className="text-lg font-bold text-gray-900 truncate">{order.projectId?.title || order.offerId ? 'Custom offer' : 'Order'}</h4>
                                    <p className="text-sm text-gray-500 mt-0.5">
                                        {order.buyerId?.firstName} {order.buyerId?.lastName}
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-lg font-black text-gray-900">{order.amount} EGP</p>
                                    <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${order.status === 'completed' ? 'bg-green-100 text-green-700' : order.status === 'disputed' ? 'bg-amber-100 text-amber-700' : order.status === 'refunded' ? 'bg-gray-100 text-gray-700' : order.status === 'pending_approval' || order.status === 'pending_payment' ? 'bg-amber-100 text-amber-700' : order.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                        {formatStatus(order.status)}
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs text-gray-500 font-bold">
                                <span>{order.packageType}</span>
                                <span>·</span>
                                <span>Ordered {formatDateDDMMYYYY(order.createdAt)}</span>
                                {order.deliveryDate && (
                                    <>
                                        <span>·</span>
                                        <span>Delivery {formatDateDDMMYYYY(order.deliveryDate)}</span>
                                    </>
                                )}
                            </div>
                            <p className="text-xs font-bold text-[#09BF44] mt-3">View details →</p>
                        </button>
                    );

                    return (
                        <div className="space-y-10">
                            <section>
                                <h3 className="text-lg font-black text-gray-900 mb-4">Active</h3>
                                {activeList.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {activeList.map((order: any) => (
                                            <OrderCard key={order._id} order={order} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm font-medium">
                                        No active orders.
                                    </div>
                                )}
                            </section>
                            <section>
                                <h3 className="text-lg font-black text-gray-900 mb-4">Finished</h3>
                                {finishedList.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {finishedList.map((order: any) => (
                                            <OrderCard key={order._id} order={order} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm font-medium">
                                        No finished orders yet.
                                    </div>
                                )}
                            </section>
                        </div>
                    );
                })()}

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
