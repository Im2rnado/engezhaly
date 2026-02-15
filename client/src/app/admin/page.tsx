"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { api } from '@/lib/api';
import { Check, X, Ban, User, Flag, MessageSquare, Award, BarChart3, TrendingUp, Search, Loader2, Briefcase, FileText, ShoppingBag, CreditCard, Trash2, Star, Edit, LogOut, ArrowLeft, Send, Shield, PanelLeft } from 'lucide-react';
import { useModal } from '@/context/ModalContext';
import EditModal from '@/components/EditModal';
import DashboardMobileTopStrip from '@/components/DashboardMobileTopStrip';

export default function AdminDashboard() {
    const { showModal } = useModal();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'approvals' | 'users' | 'projects' | 'jobs' | 'orders' | 'finance' | 'monitoring' | 'strikes' | 'rewards'>('dashboard');

    // Data States
    const [pendingFreelancers, setPendingFreelancers] = useState<any[]>([]);
    const [activeChats, setActiveChats] = useState<any[]>([]);
    const [insights, setInsights] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [jobs, setJobs] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [topFreelancers, setTopFreelancers] = useState<any>(null);

    // Search & UI States
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResult, setSearchResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [editModal, setEditModal] = useState<{ isOpen: boolean; type: 'user' | 'project' | 'job' | null; data: any }>({ isOpen: false, type: null, data: null });
    
    // Approvals states
    const [selectedFreelancer, setSelectedFreelancer] = useState<any>(null);

    // Monitoring states
    const [selectedChat, setSelectedChat] = useState<any>(null);
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [adminMessageInput, setAdminMessageInput] = useState('');
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    // Fetch Functions
    const fetchPending = async () => {
        try {
            const data = await api.admin.getPendingFreelancers();
            setPendingFreelancers(data);
        } catch (err) {
            console.error('Failed to fetch pending freelancers', err);
        }
    };

    const fetchChats = async () => {
        try {
            const data = await api.admin.getActiveChats();
            setActiveChats(data);
        } catch (err) {
            console.error('Failed to fetch chats', err);
        }
    };

    const fetchChatMessages = async (conversationId: string) => {
        try {
            const data = await api.chat.getMessages(conversationId);
            // Format messages for display
            const formatted = data.map((m: any) => ({
                _id: m._id,
                content: m.content,
                senderId: m.senderId?._id || m.senderId,
                isAdmin: m.isAdmin || m.content?.includes('[Engezhaly Admin]'),
                createdAt: m.createdAt
            }));
            setChatMessages(formatted);
        } catch (err) {
            console.error('Failed to fetch chat messages', err);
            showModal({ title: 'Error', message: 'Failed to load messages', type: 'error' });
        }
    };

    const handleSelectChat = async (chat: any) => {
        setSelectedChat(chat);
        await fetchChatMessages(chat._id);
    };

    const handleSendAdminMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adminMessageInput.trim() || !selectedChat) return;

        try {
            const participants = selectedChat.participants || [];
            // Send message once - it will be visible to all participants
            // Use the first participant as receiverId (required field, but message is visible to all)
            if (participants.length > 0) {
                await api.admin.sendAdminMessage({
                    conversationId: selectedChat._id,
                    receiverId: participants[0]._id,
                    content: adminMessageInput
                });
            }
            
            setAdminMessageInput('');
            await fetchChatMessages(selectedChat._id);
            await fetchChats(); // Refresh chat list
        } catch (err: any) {
            console.error(err);
            showModal({ title: 'Error', message: err.message || 'Failed to send message', type: 'error' });
        }
    };

    const fetchInsights = async () => {
        try {
            const data = await api.admin.getInsights();
            setInsights(data);
        } catch (err) {
            console.error('Failed to fetch insights', err);
        }
    };

    const fetchUsers = async () => {
        try {
            const data = await api.admin.getAllUsers();
            setUsers(data);
        } catch (err) {
            console.error('Failed to fetch users', err);
        }
    };

    const fetchProjects = async () => {
        try {
            const data = await api.admin.getAllProjects();
            setProjects(data);
        } catch (err) {
            console.error('Failed to fetch projects', err);
        }
    };

    const fetchJobs = async () => {
        try {
            const data = await api.admin.getAllJobs();
            setJobs(data);
        } catch (err) {
            console.error('Failed to fetch jobs', err);
        }
    };

    const fetchOrders = async () => {
        try {
            const data = await api.admin.getAllOrders();
            setOrders(data);
        } catch (err) {
            console.error('Failed to fetch orders', err);
        }
    };

    const fetchTransactions = async () => {
        try {
            const data = await api.admin.getAllTransactions();
            setTransactions(data);
        } catch (err) {
            console.error('Failed to fetch transactions', err);
        }
    };

    const fetchTopFreelancers = async () => {
        try {
            const data = await api.admin.getTopFreelancers();
            setTopFreelancers(data);
        } catch (err) {
            console.error('Failed to fetch top freelancers', err);
        }
    };

    useEffect(() => {
        fetchPending();
        fetchInsights();
        // Lazy load other tabs data when active to save bandwidth
    }, []);

    useEffect(() => {
        if (activeTab === 'users') fetchUsers();
        if (activeTab === 'projects') fetchProjects();
        if (activeTab === 'jobs') fetchJobs();
        if (activeTab === 'orders') fetchOrders();
        if (activeTab === 'finance') fetchTransactions();
        if (activeTab === 'monitoring') fetchChats();
        if (activeTab === 'rewards') fetchTopFreelancers();
    }, [activeTab]);

    // Action Handlers
    const handleSearchUser = async () => {
        if (!searchQuery) return;
        setLoading(true);
        try {
            const user = await api.admin.searchUser(searchQuery);
            setSearchResult(user);
        } catch (err) {
            console.error(err);
            showModal({ title: 'Error', message: 'User not found', type: 'error' });
            setSearchResult(null);
        } finally {
            setLoading(false);
        }
    };

    const handleAddStrike = async (userId: string) => {
        try {
            await api.admin.addStrike(userId);
            showModal({ title: 'Success', message: 'Strike added successfully', type: 'success' });
        } catch (err) {
            console.error(err);
            showModal({ title: 'Error', message: 'Failed to add strike', type: 'error' });
        }
    };

    const handleToggleReward = async (userId: string) => {
        try {
            await api.admin.toggleEmployeeOfMonth(userId);
            showModal({ title: 'Success', message: 'Employee of Month Status Toggled', type: 'success' });
            fetchTopFreelancers(); // Refresh data
        } catch (err) {
            console.error(err);
            showModal({ title: 'Error', message: 'Failed to toggle reward', type: 'error' });
        }
    };

    const handleApprove = async (id: string) => {
        try {
            await api.admin.approveFreelancer(id);
            showModal({ title: 'Success', message: 'Freelancer Approved', type: 'success' });
            fetchPending();
        } catch (err) {
            console.error(err);
            showModal({ title: 'Error', message: 'Failed to approve', type: 'error' });
        }
    };

    const handleReject = async (id: string) => {
        showModal({
            title: 'Confirm Rejection',
            message: 'Are you sure you want to reject and delete this freelancer?',
            type: 'info',
            onConfirm: async () => {
                try {
                    await api.admin.rejectFreelancer(id);
                    showModal({ title: 'Success', message: 'Freelancer Rejected', type: 'success' });
                    fetchPending();
                } catch (err) {
                    console.error(err);
                    showModal({ title: 'Error', message: 'Failed to reject', type: 'error' });
                }
            }
        });
    };

    const handleEditUser = (user: any) => {
        setEditModal({
            isOpen: true,
            type: 'user',
            data: user
        });
    };

    const handleSaveUser = async (formData: any) => {
        try {
            await api.admin.updateUser(editModal.data._id, formData);
            showModal({ title: 'Success', message: 'User updated successfully', type: 'success' });
            fetchUsers();
        } catch (err) {
            console.error(err);
            showModal({ title: 'Error', message: 'Failed to update user', type: 'error' });
        }
    };

    const handleEditProject = (project: any) => {
        setEditModal({
            isOpen: true,
            type: 'project',
            data: project
        });
    };

    const handleSaveProject = async (formData: any) => {
        try {
            await api.admin.updateProject(editModal.data._id, { title: formData.title, isActive: formData.isActive === 'true' });
            showModal({ title: 'Success', message: 'Project updated successfully', type: 'success' });
            fetchProjects();
        } catch (err) {
            console.error(err);
            showModal({ title: 'Error', message: 'Failed to update project', type: 'error' });
        }
    };

    const handleEditJob = (job: any) => {
        setEditModal({
            isOpen: true,
            type: 'job',
            data: job
        });
    };

    const handleSaveJob = async (formData: any) => {
        try {
            await api.admin.updateJob(editModal.data._id, { title: formData.title, status: formData.status });
            showModal({ title: 'Success', message: 'Job updated successfully', type: 'success' });
            fetchJobs();
        } catch (err) {
            console.error(err);
            showModal({ title: 'Error', message: 'Failed to update job', type: 'error' });
        }
    };

    const handleDeleteUser = async (id: string) => {
        showModal({
            title: 'Confirm Deletion',
            message: 'Are you sure you want to permanently delete this user? This action cannot be undone.',
            type: 'confirm',
            onConfirm: async () => {
                try {
                    await api.admin.deleteUser(id);
                    showModal({ title: 'Success', message: 'User deleted successfully', type: 'success' });
                    fetchUsers();
                } catch (err) {
                    console.error(err);
                    showModal({ title: 'Error', message: 'Failed to delete user', type: 'error' });
                }
            }
        });
    };

    const handleDeleteProject = async (id: string) => {
        showModal({
            title: 'Confirm Deletion',
            message: 'Are you sure you want to permanently delete this project? This action cannot be undone.',
            type: 'confirm',
            onConfirm: async () => {
                try {
                    await api.admin.deleteProject(id);
                    showModal({ title: 'Success', message: 'Project deleted successfully', type: 'success' });
                    fetchProjects();
                } catch (err) {
                    console.error(err);
                    showModal({ title: 'Error', message: 'Failed to delete project', type: 'error' });
                }
            }
        });
    };

    const handleDeleteJob = async (id: string) => {
        showModal({
            title: 'Confirm Deletion',
            message: 'Are you sure you want to permanently delete this job? This action cannot be undone.',
            type: 'confirm',
            onConfirm: async () => {
                try {
                    await api.admin.deleteJob(id);
                    showModal({ title: 'Success', message: 'Job deleted successfully', type: 'success' });
                    fetchJobs();
                } catch (err) {
                    console.error(err);
                    showModal({ title: 'Error', message: 'Failed to delete job', type: 'error' });
                }
            }
        });
    };

    const handleFreeze = async (chatId: string) => {
        try {
            await api.admin.freezeChat(chatId);
            showModal({ title: 'Success', message: 'Chat Frozen', type: 'success' });
            fetchChats();
            if (selectedChat && selectedChat._id === chatId) {
                setSelectedChat({ ...selectedChat, isFrozen: true });
            }
        } catch (err) {
            console.error(err);
            showModal({ title: 'Error', message: 'Failed to freeze', type: 'error' });
        }
    };

    const handleUnfreeze = async (chatId: string) => {
        try {
            await api.admin.unfreezeChat(chatId);
            showModal({ title: 'Success', message: 'Chat Unfrozen', type: 'success' });
            fetchChats();
            if (selectedChat && selectedChat._id === chatId) {
                setSelectedChat({ ...selectedChat, isFrozen: false });
            }
        } catch (err) {
            console.error(err);
            showModal({ title: 'Error', message: 'Failed to unfreeze', type: 'error' });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
            {/* Sidebar */}
            <div className={`w-72 bg-white border-r border-gray-200 flex flex-col fixed h-full z-40 shadow-sm transition-transform duration-300 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
                <div className="px-8 py-4 border-b border-gray-100">
                    <div className="flex items-start justify-between">
                        <button
                            onClick={() => router.push('/')}
                            className="hover:opacity-80 transition-opacity cursor-pointer"
                        >
                            <Image
                                src="/logos/logo-green.png"
                                alt="Engezhaly"
                                width={200}
                                height={55}
                                className="h-14 -ml-1 w-auto"
                                priority
                            />
                        </button>
                        <button
                            onClick={() => setMobileSidebarOpen(false)}
                            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                            aria-label="Close sidebar"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <span className="text-xs font-bold text-gray-400 tracking-widest uppercase -mt-2 block">Admin Dashboard</span>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'dashboard' ? 'bg-[#09BF44] text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                        <BarChart3 className="w-5 h-5" /> Dashboard
                    </button>
                    <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'users' ? 'bg-[#09BF44] text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                        <User className="w-5 h-5" /> Users
                    </button>
                    <button onClick={() => setActiveTab('projects')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'projects' ? 'bg-[#09BF44] text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                        <Briefcase className="w-5 h-5" /> Projects
                    </button>
                    <button onClick={() => setActiveTab('jobs')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'jobs' ? 'bg-[#09BF44] text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                        <FileText className="w-5 h-5" /> Jobs
                    </button>
                    <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'orders' ? 'bg-[#09BF44] text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                        <ShoppingBag className="w-5 h-5" /> Orders
                    </button>
                    <button onClick={() => setActiveTab('finance')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'finance' ? 'bg-[#09BF44] text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                        <CreditCard className="w-5 h-5" /> Finance
                    </button>
                    <div className="h-px bg-gray-100 my-2"></div>
                    <button onClick={() => setActiveTab('approvals')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'approvals' ? 'bg-[#09BF44] text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                        <Check className="w-5 h-5" /> Approvals
                        {pendingFreelancers.length > 0 && <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingFreelancers.length}</span>}
                    </button>
                    <button onClick={() => setActiveTab('monitoring')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'monitoring' ? 'bg-[#09BF44] text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                        <MessageSquare className="w-5 h-5" /> Monitoring
                    </button>
                    <button onClick={() => setActiveTab('strikes')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'strikes' ? 'bg-[#09BF44] text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                        <Ban className="w-5 h-5" /> Strikes
                    </button>
                    <button onClick={() => setActiveTab('rewards')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'rewards' ? 'bg-[#09BF44] text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                        <Award className="w-5 h-5" /> Rewards
                    </button>
                </nav>

                {/* Logout Button */}
                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={() => {
                            localStorage.removeItem('token');
                            localStorage.removeItem('user');
                            router.push('/');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            </div>
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
                        <p className="text-sm md:text-base text-gray-500 mt-1">Manage platform operations.</p>
                    </div>
                </header>

                {activeTab === 'dashboard' && (
                    <div className="space-y-8">
                        {insights ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><User className="w-6 h-6" /></div>
                                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">+12%</span>
                                    </div>
                                    <h3 className="text-gray-500 font-bold text-sm">Total Users</h3>
                                    <p className="text-3xl font-black text-gray-900 mt-1">{insights.totalUsers}</p>
                                </div>
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-green-50 rounded-xl text-[#09BF44]"><Briefcase className="w-6 h-6" /></div>
                                    </div>
                                    <h3 className="text-gray-500 font-bold text-sm">Freelancers</h3>
                                    <p className="text-3xl font-black text-gray-900 mt-1">{insights.totalFreelancers}</p>
                                </div>
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-purple-50 rounded-xl text-purple-600"><User className="w-6 h-6" /></div>
                                    </div>
                                    <h3 className="text-gray-500 font-bold text-sm">Clients</h3>
                                    <p className="text-3xl font-black text-gray-900 mt-1">{insights.totalClients}</p>
                                </div>
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-yellow-50 rounded-xl text-yellow-600"><TrendingUp className="w-6 h-6" /></div>
                                    </div>
                                    <h3 className="text-gray-500 font-bold text-sm">Total Revenue</h3>
                                    <p className="text-3xl font-black text-gray-900 mt-1">{insights.totalRevenue} EGP</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-40">
                                <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
                            </div>
                        )}
                    </div>
                )}

                {/* Management Tabs (Tables) */}
                {(activeTab === 'users' || activeTab === 'projects' || activeTab === 'jobs' || activeTab === 'orders' || activeTab === 'finance') && (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-bold uppercase">
                                    <tr>
                                        {activeTab === 'users' && <><th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4">Role</th><th className="p-4">Actions</th></>}
                                        {activeTab === 'projects' && <><th className="p-4">Title</th><th className="p-4">Seller</th><th className="p-4">Price Range</th><th className="p-4">Actions</th></>}
                                        {activeTab === 'jobs' && <><th className="p-4">Title</th><th className="p-4">Client</th><th className="p-4">Budget</th><th className="p-4">Actions</th></>}
                                        {activeTab === 'orders' && <><th className="p-4">ID</th><th className="p-4">Project</th><th className="p-4">Buyer</th><th className="p-4">Seller</th><th className="p-4">Amount</th><th className="p-4">Status</th></>}
                                        {activeTab === 'finance' && <><th className="p-4">Type</th><th className="p-4">User</th><th className="p-4">Amount</th><th className="p-4">Status</th><th className="p-4">Date</th></>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {activeTab === 'users' && users.map(user => (
                                        <tr key={user._id} className="hover:bg-gray-50">
                                            <td className="p-4 font-bold">{user.firstName} {user.lastName}</td>
                                            <td className="p-4 text-gray-600">{user.email}</td>
                                            <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${user.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'}`}>{user.role}</span></td>
                                            <td className="p-4 flex gap-2">
                                                <button onClick={() => handleEditUser(user)} className="text-blue-500 hover:bg-blue-50 p-2 rounded"><Edit className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteUser(user._id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 className="w-4 h-4" /></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {activeTab === 'projects' && projects.map(project => (
                                        <tr key={project._id} className="hover:bg-gray-50">
                                            <td className="p-4 font-bold truncate max-w-xs">{project.title}</td>
                                            <td className="p-4">{project.sellerId?.firstName} {project.sellerId?.lastName}</td>
                                            <td className="p-4 text-gray-600">{project.packages?.[0]?.price} - {project.packages?.[2]?.price} EGP</td>
                                            <td className="p-4 flex gap-2">
                                                <button onClick={() => handleEditProject(project)} className="text-blue-500 hover:bg-blue-50 p-2 rounded"><Edit className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteProject(project._id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 className="w-4 h-4" /></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {activeTab === 'jobs' && jobs.map(job => (
                                        <tr key={job._id} className="hover:bg-gray-50">
                                            <td className="p-4 font-bold truncate max-w-xs">{job.title}</td>
                                            <td className="p-4">{job.clientId?.firstName} {job.clientId?.lastName}</td>
                                            <td className="p-4 text-gray-600">{job.budgetRange?.min} - {job.budgetRange?.max} EGP</td>
                                            <td className="p-4 flex gap-2">
                                                <button onClick={() => handleEditJob(job)} className="text-blue-500 hover:bg-blue-50 p-2 rounded"><Edit className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteJob(job._id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 className="w-4 h-4" /></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {activeTab === 'orders' && orders.map(order => (
                                        <tr key={order._id} className="hover:bg-gray-50">
                                            <td className="p-4 text-gray-400 text-xs">{order._id.substring(0, 8)}...</td>
                                            <td className="p-4 font-bold truncate max-w-xs">{order.projectId?.title}</td>
                                            <td className="p-4">{order.buyerId?.firstName}</td>
                                            <td className="p-4">{order.sellerId?.firstName}</td>
                                            <td className="p-4 font-bold text-gray-900">{order.amount} EGP</td>
                                            <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{order.status}</span></td>
                                        </tr>
                                    ))}
                                    {activeTab === 'finance' && transactions.map(tx => (
                                        <tr key={tx._id} className="hover:bg-gray-50">
                                            <td className="p-4 capitalize">{tx.type}</td>
                                            <td className="p-4">{tx.userId?.firstName} {tx.userId?.lastName}</td>
                                            <td className={`p-4 font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>{tx.amount} EGP</td>
                                            <td className="p-4"><span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">{tx.status}</span></td>
                                            <td className="p-4 text-gray-500">{new Date(tx.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'approvals' && (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        {!selectedFreelancer ? (
                            <>
                                <div className="p-6 border-b border-gray-100">
                                    <h3 className="text-lg font-bold">Pending Freelancer Approvals</h3>
                                </div>
                                <div className="p-6">
                                    {pendingFreelancers.length > 0 ? (
                                        <div className="grid gap-4">
                                            {pendingFreelancers.map((f) => (
                                                <div
                                                    key={f._id}
                                                    onClick={() => setSelectedFreelancer(f)}
                                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-[#09BF44] hover:shadow-sm transition-all cursor-pointer"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        {f.freelancerProfile?.profilePicture ? (
                                                            <Image src={f.freelancerProfile.profilePicture} alt="" width={48} height={48} className="w-12 h-12 rounded-full object-cover" />
                                                        ) : (
                                                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-xl font-bold text-gray-500">
                                                                {f.firstName?.[0]}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <h4 className="font-bold text-gray-900">{f.firstName} {f.lastName}</h4>
                                                            <p className="text-sm text-gray-500">{f.freelancerProfile?.category || 'No category'} {f.freelancerProfile?.experienceYears != null ? `• ${f.freelancerProfile.experienceYears} Years Exp.` : ''}</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-400">Click to review →</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-gray-400">
                                            <Check className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                            <p>All caught up! No pending approvals.</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Freelancer Detail View */}
                                <div className="p-6 border-b border-gray-100 flex items-center gap-4">
                                    <button onClick={() => setSelectedFreelancer(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <h3 className="text-lg font-bold">Review Application</h3>
                                </div>
                                <div className="p-8 space-y-8">
                                    {/* Profile Header */}
                                    <div className="flex items-center gap-6">
                                        {selectedFreelancer.freelancerProfile?.profilePicture ? (
                                            <Image src={selectedFreelancer.freelancerProfile.profilePicture} alt="" width={96} height={96} className="w-24 h-24 rounded-full object-cover border-4 border-gray-100" />
                                        ) : (
                                            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-3xl font-bold text-gray-500">
                                                {selectedFreelancer.firstName?.[0]}
                                            </div>
                                        )}
                                        <div>
                                            <h2 className="text-2xl font-black text-gray-900">{selectedFreelancer.firstName} {selectedFreelancer.lastName}</h2>
                                            <p className="text-gray-500 font-medium">@{selectedFreelancer.username}</p>
                                            {selectedFreelancer.freelancerProfile?.category && (
                                                <span className="inline-block mt-2 px-3 py-1 bg-[#09BF44]/10 text-[#09BF44] text-sm font-bold rounded-full">{selectedFreelancer.freelancerProfile.category}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Personal Info */}
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Personal Information</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-gray-50 p-4 rounded-xl">
                                                <p className="text-xs font-bold text-gray-400 mb-1">Email</p>
                                                <p className="font-medium text-gray-900">{selectedFreelancer.email}</p>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-xl">
                                                <p className="text-xs font-bold text-gray-400 mb-1">Phone</p>
                                                <p className="font-medium text-gray-900">{selectedFreelancer.phoneNumber || 'Not provided'}</p>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-xl">
                                                <p className="text-xs font-bold text-gray-400 mb-1">Date of Birth</p>
                                                <p className="font-medium text-gray-900">{selectedFreelancer.dateOfBirth ? new Date(selectedFreelancer.dateOfBirth).toLocaleDateString() : 'Not provided'}</p>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-xl">
                                                <p className="text-xs font-bold text-gray-400 mb-1">Joined</p>
                                                <p className="font-medium text-gray-900">{new Date(selectedFreelancer.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bio */}
                                    {selectedFreelancer.freelancerProfile?.bio && (
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Bio</h4>
                                            <p className="text-gray-700 bg-gray-50 p-4 rounded-xl leading-relaxed whitespace-pre-wrap">{selectedFreelancer.freelancerProfile.bio}</p>
                                        </div>
                                    )}

                                    {/* Professional Info */}
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Professional Details</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-gray-50 p-4 rounded-xl">
                                                <p className="text-xs font-bold text-gray-400 mb-1">Experience</p>
                                                <p className="font-medium text-gray-900">{selectedFreelancer.freelancerProfile?.experienceYears != null ? `${selectedFreelancer.freelancerProfile.experienceYears} years` : 'Not provided'}</p>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-xl">
                                                <p className="text-xs font-bold text-gray-400 mb-1">Full-time</p>
                                                <p className="font-medium text-gray-900">{selectedFreelancer.freelancerProfile?.surveyResponses?.isFullTime ? 'Yes' : 'No'}</p>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-xl md:col-span-2">
                                                <p className="text-xs font-bold text-gray-400 mb-1">Speed / Quality Commitment</p>
                                                <p className="font-medium text-gray-900">{selectedFreelancer.freelancerProfile?.surveyResponses?.speedQualityCommitment || 'Not provided'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Skills */}
                                    {selectedFreelancer.freelancerProfile?.skills?.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Skills</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedFreelancer.freelancerProfile.skills.map((s: string) => (
                                                    <span key={s} className="px-3 py-1 bg-[#09BF44] text-white text-sm font-medium rounded-full">{s}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Starter Pricing */}
                                    {selectedFreelancer.freelancerProfile?.starterPricing && (
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Starter Pricing</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {(['basic', 'standard', 'premium'] as const).map((tier) => {
                                                    const pkg = selectedFreelancer.freelancerProfile.starterPricing[tier];
                                                    return pkg ? (
                                                        <div key={tier} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                            <h5 className="font-bold capitalize text-[#09BF44] mb-2">{tier}</h5>
                                                            <p className="text-gray-900 font-bold text-lg">{pkg.price} EGP</p>
                                                            <p className="text-gray-500 text-sm">{pkg.days} day delivery</p>
                                                        </div>
                                                    ) : null;
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Documents */}
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Documents</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-gray-50 p-4 rounded-xl">
                                                <p className="text-xs font-bold text-gray-400 mb-2">Certificate(s)</p>
                                                {selectedFreelancer.freelancerProfile?.certificates?.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {selectedFreelancer.freelancerProfile.certificates.filter(Boolean).map((url: string, i: number) => (
                                                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline font-medium">
                                                                <FileText className="w-4 h-4" /> Certificate {i + 1}
                                                            </a>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-400">None uploaded</p>
                                                )}
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-xl">
                                                <p className="text-xs font-bold text-gray-400 mb-2">ID Document</p>
                                                {selectedFreelancer.freelancerProfile?.idDocument ? (
                                                    <a href={selectedFreelancer.freelancerProfile.idDocument} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline font-medium">
                                                        <FileText className="w-4 h-4" /> View Document
                                                    </a>
                                                ) : (
                                                    <p className="text-sm text-gray-400">None uploaded</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Approve / Reject */}
                                    <div className="flex gap-4 pt-4 border-t border-gray-100">
                                        <button
                                            onClick={() => { handleApprove(selectedFreelancer._id); setSelectedFreelancer(null); }}
                                            className="flex-1 bg-[#09BF44] hover:bg-[#07a63a] text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Check className="w-5 h-5" /> Approve Freelancer
                                        </button>
                                        <button
                                            onClick={() => { handleReject(selectedFreelancer._id); setSelectedFreelancer(null); }}
                                            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                                        >
                                            <X className="w-5 h-5" /> Reject & Delete
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'rewards' && (
                    <div className="space-y-8">
                        <div className="bg-linear-to-r from-yellow-500 to-amber-600 p-8 rounded-3xl text-white shadow-xl">
                            <h2 className="text-2xl font-bold mb-2">Employee of the Month Recognition</h2>
                            <p className="opacity-90">Highlighting top talent based on real performance metrics.</p>
                        </div>

                        {topFreelancers ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Most Completed Deals */}
                                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <Briefcase className="w-24 h-24 text-gray-900" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center text-blue-600 mb-4">
                                            <TrendingUp className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-gray-500 font-bold uppercase text-xs tracking-wider mb-1">Most Deals</h3>
                                        {topFreelancers.mostDeals ? (
                                            <>
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">
                                                        {topFreelancers.mostDeals.firstName[0]}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-lg text-gray-900 leading-tight">{topFreelancers.mostDeals.firstName} {topFreelancers.mostDeals.lastName}</h4>
                                                        <p className="text-blue-600 font-black">{topFreelancers.mostDeals.value}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleToggleReward(topFreelancers.mostDeals._id)}
                                                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${topFreelancers.mostDeals.freelancerProfile?.isEmployeeOfMonth ? 'bg-green-100 text-green-700' : 'bg-black text-white hover:bg-gray-800'}`}
                                                >
                                                    <Award className="w-4 h-4" />
                                                    {topFreelancers.mostDeals.freelancerProfile?.isEmployeeOfMonth ? 'Current Winner' : 'Select Winner'}
                                                </button>
                                            </>
                                        ) : <p className="text-gray-400 italic">No data yet</p>}
                                    </div>
                                </div>

                                {/* Top Rated */}
                                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <Star className="w-24 h-24 text-yellow-500" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="bg-yellow-50 w-12 h-12 rounded-xl flex items-center justify-center text-yellow-600 mb-4">
                                            <Star className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-gray-500 font-bold uppercase text-xs tracking-wider mb-1">Highest Rated</h3>
                                        {topFreelancers.topRated ? (
                                            <>
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">
                                                        {topFreelancers.topRated.firstName[0]}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-lg text-gray-900 leading-tight">{topFreelancers.topRated.firstName} {topFreelancers.topRated.lastName}</h4>
                                                        <p className="text-yellow-600 font-black">{topFreelancers.topRated.value}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleToggleReward(topFreelancers.topRated._id)}
                                                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${topFreelancers.topRated.freelancerProfile?.isEmployeeOfMonth ? 'bg-green-100 text-green-700' : 'bg-black text-white hover:bg-gray-800'}`}
                                                >
                                                    <Award className="w-4 h-4" />
                                                    {topFreelancers.topRated.freelancerProfile?.isEmployeeOfMonth ? 'Current Winner' : 'Select Winner'}
                                                </button>
                                            </>
                                        ) : <p className="text-gray-400 italic">No data yet</p>}
                                    </div>
                                </div>

                                {/* On Time Delivery */}
                                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <TrendingUp className="w-24 h-24 text-green-500" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="bg-green-50 w-12 h-12 rounded-xl flex items-center justify-center text-green-600 mb-4">
                                            <Check className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-gray-500 font-bold uppercase text-xs tracking-wider mb-1">Best Reliability</h3>
                                        {topFreelancers.onTime ? (
                                            <>
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">
                                                        {topFreelancers.onTime.firstName[0]}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-lg text-gray-900 leading-tight">{topFreelancers.onTime.firstName} {topFreelancers.onTime.lastName}</h4>
                                                        <p className="text-green-600 font-black">{topFreelancers.onTime.value}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleToggleReward(topFreelancers.onTime._id)}
                                                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${topFreelancers.onTime.freelancerProfile?.isEmployeeOfMonth ? 'bg-green-100 text-green-700' : 'bg-black text-white hover:bg-gray-800'}`}
                                                >
                                                    <Award className="w-4 h-4" />
                                                    {topFreelancers.onTime.freelancerProfile?.isEmployeeOfMonth ? 'Current Winner' : 'Select Winner'}
                                                </button>
                                            </>
                                        ) : <p className="text-gray-400 italic">No data yet</p>}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-gray-300" /></div>
                        )}
                    </div>
                )}

                {activeTab === 'monitoring' && (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
                        {!selectedChat ? (
                            <>
                                <div className="p-6 border-b border-gray-100 flex justify-between items-center flex-shrink-0">
                                    <h3 className="text-lg font-bold">Active Conversations</h3>
                                    <span className="text-xs font-bold bg-gray-100 px-3 py-1 rounded-full text-gray-500">{activeChats.length} Active</span>
                                </div>
                                <div className="divide-y divide-gray-100 flex-1 min-h-0 overflow-y-auto">
                                    {activeChats.map((chat) => {
                                        const participants = chat.participants || [];
                                        const participant1 = participants[0];
                                        const participant2 = participants[1];
                                        const participant1Initial = participant1?.firstName?.[0]?.toUpperCase() || 'U';
                                        const participant2Initial = participant2?.firstName?.[0]?.toUpperCase() || 'U';
                                        const participantNames = participants.length >= 2 
                                            ? `${participant1?.firstName || 'Unknown'} & ${participant2?.firstName || 'Unknown'}`
                                            : participants.length === 1 
                                                ? `${participant1?.firstName || 'Unknown'}`
                                                : 'Unknown Users';
                                        
                                        return (
                                            <div 
                                                key={chat._id} 
                                                onClick={() => handleSelectChat(chat)}
                                                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-3 flex-1">
                                                    <div className="flex -space-x-2">
                                                        {participants.length > 0 && (
                                                            <div className="w-10 h-10 bg-blue-100 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-blue-600">
                                                                {participant1Initial}
                                                            </div>
                                                        )}
                                                        {participants.length > 1 && (
                                                            <div className="w-10 h-10 bg-purple-100 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-purple-600">
                                                                {participant2Initial}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-sm text-gray-900 truncate">{participantNames}</h4>
                                                        <p className="text-xs text-gray-500 truncate">
                                                            {chat.updatedAt ? `Last active ${new Date(chat.updatedAt).toLocaleDateString()}` : 'No activity'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {chat.isFrozen && (
                                                        <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
                                                            <Flag className="w-3 h-3" /> Frozen
                                                        </span>
                                                    )}
                                                    {!chat.isFrozen && (
                                                        <span className="text-xs text-gray-400">Active</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {activeChats.length === 0 && (
                                        <div className="text-center py-12 text-gray-400">
                                            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                            <p>No active conversations.</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Chat Detail View */}
                                <div className="p-6 border-b border-gray-100 flex items-center gap-4 flex-shrink-0">
                                    <button
                                        onClick={() => {
                                            setSelectedChat(null);
                                            setChatMessages([]);
                                        }}
                                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="flex -space-x-2">
                                            {selectedChat.participants?.map((p: any, idx: number) => (
                                                <div key={idx} className={`w-10 h-10 ${idx === 0 ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'} rounded-full border-2 border-white flex items-center justify-center text-xs font-bold`}>
                                                    {p?.firstName?.[0]?.toUpperCase() || 'U'}
                                                </div>
                                            ))}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">
                                                {selectedChat.participants?.map((p: any) => p?.firstName).filter(Boolean).join(' & ') || 'Unknown Users'}
                                            </h3>
                                            {selectedChat.isFrozen && (
                                                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1 mt-1">
                                                    <Flag className="w-3 h-3" /> Frozen
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {selectedChat.isFrozen ? (
                                            <button
                                                onClick={async () => {
                                                    await handleUnfreeze(selectedChat._id);
                                                    setSelectedChat({ ...selectedChat, isFrozen: false });
                                                }}
                                                className="px-4 py-2 bg-green-100 text-green-600 rounded-lg text-sm font-bold hover:bg-green-200 transition-colors flex items-center gap-2"
                                            >
                                                <Check className="w-4 h-4" /> Unfreeze
                                            </button>
                                        ) : (
                                            <button
                                                onClick={async () => {
                                                    await handleFreeze(selectedChat._id);
                                                    setSelectedChat({ ...selectedChat, isFrozen: true });
                                                }}
                                                className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-200 transition-colors flex items-center gap-2"
                                            >
                                                <Ban className="w-4 h-4" /> Freeze
                                            </button>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Messages */}
                                <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 bg-gray-50">
                                    {chatMessages.map((msg: any) => {
                                        const isAdmin = msg.isAdmin || msg.content?.includes('[Engezhaly Admin]');
                                        const content = isAdmin ? msg.content.replace('[Engezhaly Admin]', '').trim() : msg.content;
                                        const senderId = String(msg.senderId?._id || msg.senderId);
                                        const participant1Id = selectedChat.participants?.[0]?._id ? String(selectedChat.participants[0]._id) : null;
                                        const participant2Id = selectedChat.participants?.[1]?._id ? String(selectedChat.participants[1]._id) : null;
                                        const isFromParticipant1 = participant1Id && senderId === participant1Id;
                                        const isFromParticipant2 = participant2Id && senderId === participant2Id;
                                        
                                        return (
                                            <div key={msg._id} className={`flex ${isAdmin ? 'justify-center' : isFromParticipant1 ? 'justify-start' : 'justify-end'}`}>
                                                <div className={`max-w-[70%] px-4 py-2 rounded-2xl shadow-sm ${
                                                    isAdmin 
                                                        ? 'bg-yellow-100 border-2 border-yellow-300 text-gray-900'
                                                        : isFromParticipant1
                                                            ? 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
                                                            : 'bg-[#09BF44] text-white rounded-br-sm'
                                                }`}>
                                                    {isAdmin && (
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Shield className="w-4 h-4 text-yellow-600" />
                                                            <span className="text-xs font-bold text-yellow-700">Engezhaly Admin</span>
                                                        </div>
                                                    )}
                                                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{content}</p>
                                                    <div className={`flex items-center justify-end mt-1 ${isAdmin ? 'text-yellow-700' : isFromParticipant1 ? 'text-gray-500' : 'text-green-50'}`}>
                                                        <span className="text-[10px]">
                                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {chatMessages.length === 0 && (
                                        <div className="text-center py-12 text-gray-400">
                                            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                            <p>No messages yet.</p>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Admin Message Input */}
                                <div className="p-6 border-t border-gray-200 bg-white flex-shrink-0">
                                    <form onSubmit={handleSendAdminMessage} className="flex items-center gap-3">
                                        <input
                                            type="text"
                                            value={adminMessageInput}
                                            onChange={(e) => setAdminMessageInput(e.target.value)}
                                            placeholder="Type a message as admin..."
                                            className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-sm"
                                        />
                                        <button
                                            type="submit"
                                            className="px-6 py-2 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-colors font-bold flex items-center gap-2"
                                        >
                                            <Send className="w-4 h-4" />
                                            Send as Admin
                                        </button>
                                    </form>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'strikes' && (
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                            <div className="p-8 text-center border-b border-gray-100 bg-gray-50/50">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                                    <Ban className="w-8 h-8" />
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 mb-2">Manage Strikes & Bans</h2>
                                <p className="text-gray-500">Search for a user to perform this action.</p>
                            </div>

                            <div className="p-8">
                                <div className="flex gap-2 mb-6">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            placeholder="Search by Username, Email or ID"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#09BF44] transition-all"
                                        />
                                    </div>
                                    <button
                                        onClick={handleSearchUser}
                                        disabled={loading}
                                        className="bg-black text-white px-6 rounded-xl font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
                                    </button>
                                </div>

                                {searchResult && (
                                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 animate-in fade-in slide-in-from-bottom-4">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-12 h-12 bg-[#09BF44] rounded-full flex items-center justify-center text-white font-bold text-xl">
                                                {searchResult.firstName[0]}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-lg text-gray-900">{searchResult.firstName} {searchResult.lastName}</h4>
                                                <p className="text-sm text-gray-500">{searchResult.email}</p>
                                                <span className="inline-block mt-1 text-xs font-bold bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-500 capitalize">{searchResult.role}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleAddStrike(searchResult._id)}
                                            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Ban className="w-5 h-5" /> Add Strike ({searchResult.strikes || 0})
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* Edit Modal */}
            {editModal.type === 'user' && (
                <EditModal
                    isOpen={editModal.isOpen}
                    onClose={() => setEditModal({ isOpen: false, type: null, data: null })}
                    onSave={handleSaveUser}
                    title="Edit User"
                    fields={[
                        { name: 'firstName', label: 'First Name', defaultValue: editModal.data?.firstName || '' },
                        { name: 'lastName', label: 'Last Name', defaultValue: editModal.data?.lastName || '' },
                        { name: 'email', label: 'Email', defaultValue: editModal.data?.email || '' },
                        { name: 'role', label: 'Role', type: 'select', options: ['client', 'freelancer', 'admin'], defaultValue: editModal.data?.role || 'client' }
                    ]}
                />
            )}

            {editModal.type === 'project' && (
                <EditModal
                    isOpen={editModal.isOpen}
                    onClose={() => setEditModal({ isOpen: false, type: null, data: null })}
                    onSave={handleSaveProject}
                    title="Edit Project"
                    fields={[
                        { name: 'title', label: 'Title', defaultValue: editModal.data?.title || '' },
                        { name: 'isActive', label: 'Is Active', type: 'select', options: ['true', 'false'], defaultValue: String(editModal.data?.isActive ?? true) }
                    ]}
                />
            )}

            {editModal.type === 'job' && (
                <EditModal
                    isOpen={editModal.isOpen}
                    onClose={() => setEditModal({ isOpen: false, type: null, data: null })}
                    onSave={handleSaveJob}
                    title="Edit Job"
                    fields={[
                        { name: 'title', label: 'Title', defaultValue: editModal.data?.title || '' },
                        { name: 'status', label: 'Status', type: 'select', options: ['open', 'in_progress', 'completed', 'closed'], defaultValue: editModal.data?.status || 'open' }
                    ]}
                />
            )}
        </div>
    );
}
