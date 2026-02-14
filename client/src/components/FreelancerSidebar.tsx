"use client";

import { useRouter, usePathname } from 'next/navigation';
import { Briefcase, BarChart3, ShoppingBag, User, Clock, LogOut, MessageSquare } from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api';

interface FreelancerSidebarProps {
    user?: any;
    profile?: any;
    onToggleBusy?: () => void;
    onTabChange?: (tab: 'dashboard' | 'projects' | 'orders' | 'profile') => void;
    activeTab?: 'dashboard' | 'projects' | 'orders' | 'profile';
}

export default function FreelancerSidebar({ user, profile, onToggleBusy, onTabChange, activeTab }: FreelancerSidebarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [projects, setProjects] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);

    useEffect(() => {
        if (user?._id) {
            api.projects.getMyProjects().then(setProjects).catch(() => { });
            // Try to fetch orders (may fail if not admin)
            api.admin.getAllOrders().then(allOrders => {
                const myOrders = allOrders.filter((order: any) =>
                    order.sellerId?._id === user._id ||
                    order.sellerId === user._id ||
                    String(order.sellerId?._id) === String(user._id)
                );
                setOrders(myOrders);
            }).catch(() => setOrders([]));
        }
    }, [user?._id]);

    const isActive = (path: string) => pathname === path || pathname?.startsWith(path);
    const isPending = profile?.freelancerProfile?.status === 'pending';
    const isBusy = profile?.freelancerProfile?.isBusy;
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
                <span className="text-xs font-bold text-gray-400 tracking-widest uppercase -mt-2 block">Freelancer Dashboard</span>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                <button
                    onClick={() => {
                        router.push('/dashboard/freelancer?tab=dashboard');
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'dashboard' ? 'bg-[#09BF44] text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                    <BarChart3 className="w-5 h-5" /> Dashboard
                </button>
                <button
                    onClick={() => {
                        router.push('/dashboard/freelancer?tab=projects');
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'projects' ? 'bg-[#09BF44] text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                    <Briefcase className="w-5 h-5" /> My Projects
                    {projects.length > 0 && <span className="ml-auto bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">{projects.length}</span>}
                </button>
                <button
                    onClick={() => {
                        router.push('/dashboard/freelancer?tab=orders');
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'orders' ? 'bg-[#09BF44] text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                    <ShoppingBag className="w-5 h-5" /> Orders
                    {activeOrders > 0 && <span className="ml-auto bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">{activeOrders}</span>}
                </button>
                <button
                    onClick={() => {
                        router.push('/dashboard/freelancer?tab=profile');
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
                </button>
                <div className="h-px bg-gray-100 my-2"></div>
                <button
                    onClick={() => router.push('/jobs')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${pathname === '/' ? 'bg-[#09BF44] text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                    <Briefcase className="w-5 h-5" /> Browse Jobs
                </button>
            </nav>

            {/* Status Toggle */}
            <div className="p-4 border-t border-gray-100 space-y-4">
                {!isPending && (
                    <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-bold text-gray-700">Status</span>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${isBusy ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                {isBusy ? 'Busy' : 'Available'}
                            </span>
                        </div>
                        <button
                            onClick={onToggleBusy}
                            className={`w-16 h-8 rounded-full p-1 transition-colors relative ${isBusy ? 'bg-red-500' : 'bg-[#09BF44]'}`}
                        >
                            <div className={`w-6 h-6 bg-white rounded-full transition-transform shadow-sm ${isBusy ? 'translate-x-0' : 'translate-x-8'}`} />
                        </button>
                    </div>
                )}
                {isPending && (
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-orange-600" />
                            <span className="text-xs font-bold text-orange-800">Under Review</span>
                        </div>
                        <p className="text-xs text-orange-600">Your profile is being reviewed by admin.</p>
                    </div>
                )}
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
