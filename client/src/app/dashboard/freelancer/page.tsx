"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Briefcase, DollarSign, PlusCircle, ShoppingBag, Star, CheckCircle, Loader2, Edit, Award } from 'lucide-react';
import { api } from '@/lib/api';
import { useModal } from '@/context/ModalContext';
import ProjectCard from '@/components/ProjectCard';
import { MAIN_CATEGORIES } from '@/lib/categories';
import ProfileEditModal from '@/components/ProfileEditModal';
import FreelancerSidebar from '@/components/FreelancerSidebar';

export default function FreelancerDashboard() {
    const { showModal } = useModal();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'projects' | 'orders' | 'profile'>('dashboard');

    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [projects, setProjects] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [activeOrders, setActiveOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [profileEditModal, setProfileEditModal] = useState(false);

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
            // Note: This requires admin access. In production, add a dedicated /freelancer/orders endpoint
            // For now, we'll just show empty state if this fails
            if (user?._id) {
                try {
                    const allOrders = await api.admin.getAllOrders();
                    const myOrders = allOrders.filter((order: any) =>
                        order.sellerId?._id === user._id ||
                        order.sellerId === user._id ||
                        String(order.sellerId?._id) === String(user._id)
                    );
                    setOrders(myOrders);
                } catch {
                    // If admin endpoint fails (expected for non-admins), just set empty array
                    setOrders([]);
                }
            }
        } catch {
            setOrders([]);
        }
    }, [user?._id]);

    // Read tab from URL on mount and when URL changes
    useEffect(() => {
        const tab = searchParams.get('tab') as 'dashboard' | 'projects' | 'orders' | 'profile' | null;
        if (tab && ['dashboard', 'projects', 'orders', 'profile'].includes(tab)) {
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

                // Fetch active orders for timers
                try {
                    const activeOrdersData = await api.projects.getAllActiveOrders();
                    setActiveOrders(activeOrdersData);
                } catch {
                    setActiveOrders([]);
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
        if (activeTab === 'projects') {
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
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const avgRating = orders.filter(o => o.rating).length > 0
        ? (orders.filter(o => o.rating).reduce((sum: number, o: any) => sum + o.rating, 0) / orders.filter(o => o.rating).length).toFixed(1)
        : 'N/A';

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
            />

            {/* Main Content */}
            <div className="flex-1 ml-72 p-8 overflow-y-auto h-screen">
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 capitalize">{activeTab}</h2>
                        <p className="text-gray-500 mt-1">Welcome back, {user.firstName}!</p>
                    </div>
                    {!isPending && (
                        <button
                            onClick={() => router.push('/dashboard/freelancer/projects/create')}
                            className="bg-[#09BF44] hover:bg-[#07a63a] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-green-200"
                        >
                            <PlusCircle className="w-5 h-5" /> Create New Project
                        </button>
                    )}
                </header>

                {activeTab === 'dashboard' && (
                    <div className="space-y-8">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-green-50 rounded-xl text-[#09BF44]"><DollarSign className="w-6 h-6" /></div>
                                </div>
                                <h3 className="text-gray-500 font-bold text-sm">Wallet Balance</h3>
                                <p className="text-3xl font-black text-gray-900 mt-1">{walletBalance} EGP</p>
                            </div>
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><ShoppingBag className="w-6 h-6" /></div>
                                </div>
                                <h3 className="text-gray-500 font-bold text-sm">Active Orders</h3>
                                <p className="text-3xl font-black text-gray-900 mt-1">{activeOrders}</p>
                            </div>
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-purple-50 rounded-xl text-purple-600"><CheckCircle className="w-6 h-6" /></div>
                                </div>
                                <h3 className="text-gray-500 font-bold text-sm">Completed</h3>
                                <p className="text-3xl font-black text-gray-900 mt-1">{completedOrders}</p>
                            </div>
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-yellow-50 rounded-xl text-yellow-600"><Star className="w-6 h-6" /></div>
                                </div>
                                <h3 className="text-gray-500 font-bold text-sm">Average Rating</h3>
                                <p className="text-3xl font-black text-gray-900 mt-1">{avgRating}</p>
                            </div>
                        </div>

                        {/* Recent Projects */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="text-lg font-bold">My Projects</h3>
                                <button onClick={() => {
                                    setActiveTab('projects');
                                    router.push('/dashboard/freelancer?tab=projects');
                                }} className="text-[#09BF44] font-bold text-sm hover:underline">View All</button>
                            </div>
                            <div className="p-6">
                                {projects.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {projects.slice(0, 6).map((project) => {
                                            const activeOrder = activeOrders.find((o: any) =>
                                                o.projectId?._id === project._id || o.projectId === project._id
                                            );
                                            return (
                                                <ProjectCard
                                                    key={project._id}
                                                    project={project}
                                                    onEdit={() => router.push(`/dashboard/freelancer/projects/${project._id}/edit`)}
                                                    activeOrder={activeOrder}
                                                />
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-gray-400">
                                        <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p>No projects yet. Create your first project to start earning!</p>
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
                                            <div key={order._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                                <div>
                                                    <h4 className="font-bold text-gray-900">{order.projectId?.title || 'Project'}</h4>
                                                    <p className="text-sm text-gray-500">Buyer: {order.buyerId?.firstName} {order.buyerId?.lastName}</p>
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

                {activeTab === 'projects' && (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold">My Projects ({projects.length})</h3>
                            {!isPending && (
                                <button
                                    onClick={() => router.push('/dashboard/freelancer/projects/create')}
                                    className="bg-[#09BF44] hover:bg-[#07a63a] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors"
                                >
                                    <PlusCircle className="w-4 h-4" /> New Project
                                </button>
                            )}
                        </div>
                        <div className="p-6">
                            {projects.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {projects.map((project) => {
                                        const activeOrder = activeOrders.find((o: any) =>
                                            o.projectId?._id === project._id || o.projectId === project._id
                                        );
                                        return (
                                            <ProjectCard
                                                key={project._id}
                                                project={project}
                                                onEdit={() => router.push(`/dashboard/freelancer/projects/${project._id}/edit`)}
                                                activeOrder={activeOrder}
                                            />
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-400">
                                    <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Projects Yet</h3>
                                    <p className="text-gray-500 mb-6">Start selling your services to clients.</p>
                                    {!isPending && (
                                        <button
                                            onClick={() => router.push('/dashboard/freelancer/projects/create')}
                                            className="bg-[#09BF44] hover:bg-[#07a63a] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors mx-auto"
                                        >
                                            <PlusCircle className="w-5 h-5" /> Create your first Project
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-bold">My Orders ({orders.length})</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-bold uppercase">
                                    <tr>
                                        <th className="p-4">Project</th><th className="p-4">Buyer</th><th className="p-4">Package</th><th className="p-4">Amount</th><th className="p-4">Status</th><th className="p-4">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {orders.map((order) => (
                                        <tr key={order._id} className="hover:bg-gray-50">
                                            <td className="p-4 font-bold truncate max-w-xs">{order.projectId?.title || 'N/A'}</td>
                                            <td className="p-4">{order.buyerId?.firstName} {order.buyerId?.lastName}</td>
                                            <td className="p-4"><span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">{order.packageType}</span></td>
                                            <td className="p-4 font-bold text-gray-900">{order.amount} EGP</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${order.status === 'completed' ? 'bg-green-100 text-green-700' : order.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                    {orders.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-gray-400">
                                                <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                                <p>No orders yet.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
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
                                    className="bg-black text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-800 transition-colors"
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
                                {profile.freelancerProfile?.skills && profile.freelancerProfile.skills.length > 0 && (
                                    <div>
                                        <label className="text-sm font-bold text-gray-500 mb-2 block">Skills</label>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.freelancerProfile.skills.map((skill: string, idx: number) => (
                                                <span key={idx} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-bold">{skill}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
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
