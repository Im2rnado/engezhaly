"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Loader2, ArrowLeft } from 'lucide-react';
import FreelancerSidebar from '@/components/FreelancerSidebar';
import ProjectCard from '@/components/ProjectCard';
import CountdownTimer from '@/components/CountdownTimer';

export default function ViewProjectPage() {
    const router = useRouter();
    const params = useParams();
    const projectId = params?.id as string;
    const [project, setProject] = useState<any>(null);
    const [activeOrder, setActiveOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [profileLoading, setProfileLoading] = useState(true);

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
                    setProject(projectData);

                    // Fetch active order for timer
                    try {
                        const order = await api.projects.getActiveOrder(projectId);
                        setActiveOrder(order);
                    } catch {
                        // No active order, that's fine
                        setActiveOrder(null);
                    }
                }
            } catch (err) {
                console.error(err);
                router.push('/');
            } finally {
                setLoading(false);
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
        } catch (err) {
            console.error(err);
        }
    };

    if (profileLoading || loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#09BF44]" />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Not Found</h2>
                    <p className="text-gray-500 mb-4">The project you&apos;re looking for doesn&apos;t exist.</p>
                    <button
                        onClick={() => router.push('/dashboard/freelancer?tab=projects')}
                        className="bg-[#09BF44] text-white px-6 py-2 rounded-xl font-bold hover:bg-[#07a63a] transition-colors"
                    >
                        Go Back
                    </button>
                </div>
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

                    <ProjectCard
                        project={project}
                        onEdit={() => router.push(`/dashboard/freelancer/projects/${project._id}/edit`)}
                        activeOrder={activeOrder}
                    />

                    {/* Detailed Timer */}
                    {activeOrder && (activeOrder.status === 'active' || activeOrder.status === 'pending_payment') && activeOrder.deliveryDate && (
                        <div className="mt-6">
                            <CountdownTimer deadline={activeOrder.deliveryDate} variant="detail" />
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
