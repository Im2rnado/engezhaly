"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { Search, Loader2, Award, Clock, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';
import ProjectCard from '@/components/ProjectCard';
import AuthModal from '@/components/AuthModal';

export default function FreelancerProfilePage() {
    const router = useRouter();
    const params = useParams();
    const freelancerId = params.id as string;

    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authStep, setAuthStep] = useState<'role-selection' | 'login'>('role-selection');
    const [user, setUser] = useState<any>(null);
    const [freelancer, setFreelancer] = useState<any>(null);
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            setTimeout(() => {
                setUser(storedUser);
            }, 0);
        }

        const loadData = async () => {
            try {
                const freelancerData = await api.freelancer.getPublicProfile(freelancerId);
                setFreelancer(freelancerData);

                // Fetch freelancer's projects
                const allProjects = await api.projects.getAll();
                const freelancerProjects = allProjects.filter((project: any) =>
                    project.sellerId?._id === freelancerId || project.sellerId === freelancerId
                );
                setProjects(freelancerProjects);
            } catch (err: any) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [freelancerId]);

    const openAuthModal = (step: 'role-selection' | 'login') => {
        setAuthStep(step);
        setIsAuthModalOpen(true);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        router.push('/');
    };

    const getDashboardPath = () => {
        if (!user) return '/';
        if (user.role === 'admin') return '/admin';
        if (user.role === 'freelancer') return '/dashboard/freelancer';
        if (user.role === 'client') return '/dashboard/client';
        return '/';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#09BF44]" />
            </div>
        );
    }

    if (!freelancer) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl font-bold text-gray-900 mb-2">Freelancer not found</p>
                    <button
                        onClick={() => router.push('/')}
                        className="text-[#09BF44] hover:underline"
                    >
                        Go back home
                    </button>
                </div>
            </div>
        );
    }

    const profile = freelancer.freelancerProfile;

    return (
        <main className="min-h-screen bg-white text-gray-900 font-sans">
            {/* Header - Same as home page */}
            <header className="border-b border-gray-200 sticky top-0 bg-white/95 backdrop-blur-sm z-50 transition-all duration-300">
                <div className="max-w-[90%] mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-12 flex-1">
                        <div
                            onClick={() => router.push('/')}
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                        >
                            <Image
                                src="/logos/logo-green.png"
                                alt="Engezhaly"
                                width={240}
                                height={66}
                                className="h-12 w-auto"
                                priority
                            />
                        </div>
                        <div className="hidden lg:flex items-center bg-white border border-gray-300 rounded-md overflow-hidden w-full max-w-xl transition-shadow focus-within:ring-2 focus-within:ring-[#09BF44] focus-within:border-transparent">
                            <input
                                type="text"
                                placeholder="What service are you looking for?"
                                className="flex-1 px-4 py-2.5 text-gray-700 placeholder-gray-400 outline-none"
                            />
                            <button className="bg-black hover:bg-gray-800 text-white px-5 py-2.5 transition-colors">
                                <Search className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <nav className="hidden md:flex gap-6 text-sm font-semibold text-gray-600">
                            <button
                                onClick={() => router.push('/projects')}
                                className="hover:text-[#09BF44] transition-colors"
                            >
                                Explore Projects
                            </button>
                            <button
                                onClick={() => router.push('/jobs')}
                                className="hover:text-[#09BF44] transition-colors"
                            >
                                Browse Jobs
                            </button>
                        </nav>
                        {user ? (
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => router.push(getDashboardPath())}
                                    className="text-sm font-bold text-gray-600 hover:text-[#09BF44] transition-colors"
                                >
                                    Profile
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="bg-black text-white px-6 py-2.5 rounded-full font-bold hover:bg-gray-800 transition-colors"
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => openAuthModal('login')}
                                    className="text-sm font-bold text-gray-600 hover:text-[#09BF44] transition-colors"
                                >
                                    Sign In
                                </button>
                                <button
                                    onClick={() => openAuthModal('role-selection')}
                                    className="bg-black text-white px-6 py-2.5 rounded-full font-bold hover:bg-gray-800 transition-colors"
                                >
                                    Join
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Profile Section */}
            <div className="max-w-[90%] mx-auto px-6 py-12">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-8">
                    <div className="flex items-start gap-6">
                        <div className="w-24 h-24 bg-[#09BF44] rounded-full flex items-center justify-center text-white font-black text-3xl">
                            {freelancer.firstName?.[0]?.toUpperCase() || 'F'}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-black text-gray-900">
                                    {freelancer.firstName} {freelancer.lastName}
                                </h1>
                                {profile?.isEmployeeOfMonth && (
                                    <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                        <Award className="w-3 h-3" />
                                        Employee of the Month
                                    </span>
                                )}
                            </div>
                            {profile?.category && (
                                <p className="text-lg text-gray-600 font-bold mb-2">{profile.category}</p>
                            )}
                            {profile?.bio && (
                                <p className="text-gray-700 leading-relaxed mb-4">{profile.bio}</p>
                            )}
                            <div className="flex flex-wrap gap-4 text-sm">
                                {profile?.experienceYears && (
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        <span className="font-bold text-gray-700">{profile.experienceYears} years experience</span>
                                    </div>
                                )}
                                {profile?.status === 'approved' && (
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        <span className="font-bold text-green-700">Verified Freelancer</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {profile?.skills && profile.skills.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <h3 className="text-sm font-bold text-gray-500 mb-3">Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {profile.skills.map((skill: string, idx: number) => (
                                    <span key={idx} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-bold">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Projects Section */}
                {projects.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 mb-6">Services Offered</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {projects.map((project) => (
                                <ProjectCard key={project._id} project={project} showContactMe={true} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Auth Modal */}
            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                initialStep={authStep}
            />
        </main>
    );
}
