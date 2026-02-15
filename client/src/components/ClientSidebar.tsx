"use client";

import { useRouter, usePathname } from 'next/navigation';
import { Briefcase, BarChart3, ShoppingBag, User, Wallet, Plus, LogOut, MessageSquare } from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api';

interface ClientSidebarProps {
    user?: any;
    profile?: any;
    onTabChange?: (tab: 'dashboard' | 'jobs' | 'orders' | 'wallet' | 'profile') => void;
    activeTab?: 'dashboard' | 'jobs' | 'orders' | 'wallet' | 'profile';
}

export default function ClientSidebar({ user, activeTab }: ClientSidebarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [jobs, setJobs] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [unreadChats, setUnreadChats] = useState(0);

    useEffect(() => {
        const userId = user?._id || user?.id;
        if (userId) {
            api.client.getMyJobs().then(setJobs).catch(() => { });
            api.client.getMyOrders().then(setOrders).catch(() => { });
            api.chat.getConversations().then((conversations: any[]) => {
                const unread = (conversations || []).reduce((sum: number, c: any) => sum + Number(c.unreadCount || 0), 0);
                setUnreadChats(unread);
            }).catch(() => setUnreadChats(0));
        }
    }, [user?._id, user?.id]);

    const activeJobs = jobs.filter((j: any) => j.status === 'open' || j.status === 'in_progress').length;
    const activeOrders = orders.filter((o: any) => o.status === 'active').length;

    return (
        <div className="w-72 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10 shadow-sm">
            <div className="px-8 py-4 border-b border-gray-100">
                <button
                    onClick={() => router.push('/')}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                >
                    <Image
                        src="/logos/logo-green.png"
                        alt="Engezhaly"
                        width={300}
                        height={40}
                        className="h-14 w-auto -ml-1"
                        priority
                    />
                </button>
                <span className="text-xs font-bold text-gray-400 tracking-widest uppercase block -mt-2">Client Dashboard</span>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                <button
                    onClick={() => {
                        router.push('/dashboard/client?tab=dashboard');
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'dashboard' ? 'bg-[#09BF44] text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                    <BarChart3 className="w-5 h-5" /> Dashboard
                </button>
                <button
                    onClick={() => {
                        router.push('/dashboard/client?tab=jobs');
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'jobs' ? 'bg-[#09BF44] text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                    <Briefcase className="w-5 h-5" /> My Jobs
                    {activeJobs > 0 && <span className="ml-auto bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">{activeJobs}</span>}
                </button>
                <button
                    onClick={() => {
                        router.push('/dashboard/client?tab=orders');
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'orders' ? 'bg-[#09BF44] text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                    <ShoppingBag className="w-5 h-5" /> Orders
                    {activeOrders > 0 && <span className="ml-auto bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">{activeOrders}</span>}
                </button>
                <button
                    onClick={() => {
                        router.push('/dashboard/client/wallet');
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'wallet' || pathname?.includes('/wallet') ? 'bg-[#09BF44] text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                    <Wallet className="w-5 h-5" /> Wallet
                </button>
                <button
                    onClick={() => {
                        router.push('/dashboard/client?tab=profile');
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'profile' ? 'bg-[#09BF44] text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                    <User className="w-5 h-5" /> Profile
                </button>
                <button
                    onClick={() => {
                        router.push('/chat');
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${pathname === '/chat' || pathname?.includes('/chat') ? 'bg-[#09BF44] text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                    <MessageSquare className="w-5 h-5" /> Chats
                    {unreadChats > 0 && (
                        <span className="ml-auto bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                            {unreadChats > 99 ? '99+' : unreadChats}
                        </span>
                    )}
                </button>
                <div className="h-px bg-gray-100 my-2"></div>
                <button
                    onClick={() => router.push('/dashboard/client/jobs/create')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${pathname?.includes('/jobs/create') ? 'bg-[#09BF44] text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                    <Plus className="w-5 h-5" /> Post a Job
                </button>
                <button
                    onClick={() => router.push('/projects')}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                >
                    <Briefcase className="w-5 h-5" /> Browse Projects
                </button>
            </nav>

            {/* User Info */}
            <div className="p-4 border-t border-gray-100 space-y-3">
                <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-[#09BF44] rounded-full flex items-center justify-center text-white font-black">
                            {user?.firstName?.[0]?.toUpperCase() || 'C'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-gray-900 truncate">
                                {user?.firstName} {user?.lastName}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Wallet: {user?.walletBalance || 0} EGP
                    </div>
                </div>
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
    );
}
