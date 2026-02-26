"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { Loader2, ArrowLeft, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import ProjectCard from '@/components/ProjectCard';
import MainHeader from '@/components/MainHeader';

export default function ProjectDetailPage() {
    const router = useRouter();
    const params = useParams();
    const projectId = params?.id as string;
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [slideshowIndex, setSlideshowIndex] = useState(0);
    const images = project?.images || [];
    const hasMultipleImages = images.length > 1;

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            queueMicrotask(() => setUser(storedUser));
        }

        if (projectId) {
            api.projects.getById(projectId)
                .then(setProject)
                .catch(() => setProject(null))
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [projectId]);

    const seller = project?.sellerId;
    const freelancerName = seller ? `${seller.firstName || ''} ${seller.lastName || ''}`.trim() : 'Freelancer';
    const profilePicture = seller?.freelancerProfile?.profilePicture;
    const bannerImage = images[0] || null;

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <MainHeader user={user} showCategories={false} />
                <div className="flex items-center justify-center py-32">
                    <Loader2 className="w-10 h-10 animate-spin text-[#09BF44]" />
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="min-h-screen bg-gray-50">
                <MainHeader user={user} showCategories={false} />
                <div className="max-w-[95%] md:max-w-[90%] mx-auto px-4 py-12">
                    <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-[#09BF44] font-bold mb-6">
                        <ArrowLeft className="w-5 h-5" /> Back
                    </button>
                    <div className="text-center py-16">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Not Found</h2>
                        <p className="text-gray-500 mb-6">The project you&apos;re looking for doesn&apos;t exist or has been removed.</p>
                        <button onClick={() => router.push('/projects')} className="bg-[#09BF44] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#07a63a] transition-colors">
                            Browse Projects
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <MainHeader user={user} showCategories={false} />

            <div className="max-w-[95%] md:max-w-[90%] mx-auto px-4 py-6 md:py-8">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-[#09BF44] font-bold mb-6 transition-colors">
                    <ArrowLeft className="w-5 h-5" /> Back
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                    {/* Left column - Fiverr-like content */}
                    <div className="lg:col-span-2 space-y-6">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{project.title}</h1>

                        {/* Freelancer info line: pfp | name | rating | reviews */}
                        <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md bg-gray-200 shrink-0">
                                {profilePicture ? (
                                    <Image src={profilePicture} alt={freelancerName} fill className="object-cover" />
                                ) : (
                                    <div className="w-full h-full rounded-full bg-gradient-to-br from-[#09BF44] to-[#07a63a] flex items-center justify-center text-white font-black text-lg">
                                        {freelancerName[0]?.toUpperCase() || 'F'}
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">{freelancerName}</p>
                                <div className="flex items-center gap-2 text-amber-500">
                                    <Star className="w-4 h-4 fill-amber-400" />
                                    <span className="text-sm font-bold text-gray-700">New seller</span>
                                </div>
                            </div>
                        </div>

                        {/* Banner image */}
                        {bannerImage && (
                            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-gray-200">
                                <Image src={bannerImage} alt={project.title} fill className="object-cover" priority />
                            </div>
                        )}

                        {/* Slideshow of project media */}
                        {images.length > 0 && (
                            <div className="relative">
                                <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-gray-200">
                                    <Image
                                        src={images[slideshowIndex]}
                                        alt={`${project.title} - ${slideshowIndex + 1}`}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                {hasMultipleImages && (
                                    <>
                                        <button
                                            onClick={() => setSlideshowIndex((i) => (i === 0 ? images.length - 1 : i - 1))}
                                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 shadow-md hover:bg-white transition-colors"
                                            aria-label="Previous"
                                        >
                                            <ChevronLeft className="w-5 h-5 text-gray-700" />
                                        </button>
                                        <button
                                            onClick={() => setSlideshowIndex((i) => (i === images.length - 1 ? 0 : i + 1))}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 shadow-md hover:bg-white transition-colors"
                                            aria-label="Next"
                                        >
                                            <ChevronRight className="w-5 h-5 text-gray-700" />
                                        </button>
                                        <div className="flex justify-center gap-2 mt-2">
                                            {images.map((_: any, idx: number) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setSlideshowIndex(idx)}
                                                    className={`w-2 h-2 rounded-full transition-colors ${idx === slideshowIndex ? 'bg-[#09BF44]' : 'bg-gray-300'}`}
                                                    aria-label={`Slide ${idx + 1}`}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Description */}
                        {project.description && (
                            <div className="prose prose-gray max-w-none">
                                <h3 className="text-lg font-bold text-gray-900 mb-2">About This Project</h3>
                                <p className="text-gray-600 whitespace-pre-wrap">{project.description}</p>
                            </div>
                        )}
                    </div>

                    {/* Right column - ProjectCard (packages, customize, contact) */}
                    <div className="lg:col-span-1">
                        <div className="lg:sticky lg:top-24">
                            <ProjectCard project={project} showContactMe={true} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
