"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, PanelLeft, Megaphone } from 'lucide-react';
import FreelancerSidebar from '@/components/FreelancerSidebar';
import DashboardMobileTopStrip from '@/components/DashboardMobileTopStrip';
import { api } from '@/lib/api';

export default function FreelancerAnnouncementsPage() {
    const router = useRouter();
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/');
            return;
        }
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        setUser(storedUser);
        if (storedUser.role !== 'freelancer') {
            router.push('/');
            return;
        }
        api.freelancer.getProfile().then(setProfile).catch(() => {});
    }, [router]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await api.announcements.list();
                setAnnouncements(data || []);
                await api.announcements.markAllAsRead();
            } catch {
                setAnnouncements([]);
            } finally {
                setLoading(false);
            }
        };
        if (user?._id) fetchData();
    }, [user?._id]);

    if (!user) {
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
                onTabChange={() => {}}
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
                <div className="flex items-center gap-3 mb-7 md:mb-8">
                    <button
                        onClick={() => setMobileSidebarOpen(true)}
                        className="md:hidden p-2 rounded-lg border border-gray-200 bg-white text-gray-700"
                        aria-label="Open sidebar"
                    >
                        <PanelLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 flex items-center gap-2">
                        <Megaphone className="w-8 h-8 text-[#09BF44]" />
                        Announcements
                    </h1>
                </div>
                <p className="text-sm md:text-base text-gray-500 -mt-4 mb-6">Updates and messages from Engezhaly.</p>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-[#09BF44]" />
                    </div>
                ) : announcements.length === 0 ? (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
                        <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">No announcements yet.</p>
                        <p className="text-sm text-gray-400 mt-1">Check back later for updates from the team.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {announcements.map((a: any) => (
                            <div key={a._id} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-start gap-4">
                                    {a.imageUrl && (
                                        <img src={a.imageUrl} alt="" className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-xl shrink-0" />
                                    )}
                                    <div className="min-w-0 flex-1">
                                        {a.content && <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">{a.content}</p>}
                                        <p className="text-xs text-gray-500 mt-3">
                                            {a.createdBy?.firstName} {a.createdBy?.lastName} • {a.createdAt ? new Date(a.createdAt).toLocaleString() : ''}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
