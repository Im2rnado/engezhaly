/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { Loader2, ArrowLeft, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import ProjectCard from '@/components/ProjectCard';
import MainHeader from '@/components/MainHeader';

export default function OfferDetailPage() {
    const router = useRouter();
    const params = useParams();
    const projectId = params?.id as string;
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [slideshowIndex, setSlideshowIndex] = useState(0);
    const raw = (project?.images || []).filter(Boolean) as string[];
    const images = [...new Set(raw)];
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
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Offer Not Found</h2>
                        <p className="text-gray-500 mb-6">The offer you&apos;re looking for doesn&apos;t exist or has been removed.</p>
                        <Link href="/offers" className="bg-[#09BF44] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#07a63a] transition-colors inline-block">
                            Browse Offers
                        </Link>
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
                    <div className="lg:col-span-2 space-y-6">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{project.title}</h1>

                        <Link
                            href={seller?._id ? `/freelancer/${seller._id}` : '#'}
                            className="flex items-center gap-3 hover:opacity-90 transition-opacity"
                        >
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
                        </Link>

                        {images.length > 0 && (
                            <div className="relative">
                                <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-gray-200">
                                    <Image
                                        src={images[slideshowIndex]}
                                        alt={`${project.title} - ${slideshowIndex + 1}`}
                                        fill
                                        className="object-cover"
                                        priority
                                    />
                                </div>
                                <button
                                    onClick={() => setSlideshowIndex((i) => (i === 0 ? images.length - 1 : i - 1))}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/90 shadow-md hover:bg-white transition-colors"
                                    aria-label="Previous"
                                >
                                    <ChevronLeft className="w-5 h-5 text-gray-700" />
                                </button>
                                <button
                                    onClick={() => setSlideshowIndex((i) => (i === images.length - 1 ? 0 : i + 1))}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/90 shadow-md hover:bg-white transition-colors"
                                    aria-label="Next"
                                >
                                    <ChevronRight className="w-5 h-5 text-gray-700" />
                                </button>
                                {hasMultipleImages && (
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
                                )}
                            </div>
                        )}

                        {project.description && (
                            <div className="prose prose-gray max-w-none">
                                <h3 className="text-lg font-bold text-gray-900 mb-2">About This Offer</h3>
                                <p className="text-gray-600 whitespace-pre-wrap">{project.description}</p>
                            </div>
                        )}

                        {seller?.freelancerProfile?.portfolio && seller.freelancerProfile.portfolio.length > 0 && (
                            <div className="pt-6 border-t border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900 mb-3">Freelancer Portfolio</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {seller.freelancerProfile.portfolio.map((item: any, idx: number) => (
                                        <div key={idx} className="rounded-xl overflow-hidden border border-gray-100">
                                            {item.imageUrl && (
                                                <div className="relative w-full aspect-video bg-gray-100">
                                                    <Image src={item.imageUrl} alt={item.title || 'Portfolio'} fill className="object-cover" sizes="(max-width: 768px) 100vw, 400px" />
                                                </div>
                                            )}
                                            <div className="p-3">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h4 className="font-bold text-gray-900">{item.title}</h4>
                                                    {item.subCategory && (
                                                        <span className="px-2 py-0.5 bg-[#09BF44]/10 text-[#09BF44] text-xs font-bold rounded-full">{item.subCategory}</span>
                                                    )}
                                                </div>
                                                {item.description && <p className="text-sm text-gray-600 line-clamp-2 mt-1">{item.description}</p>}
                                                {item.link && (
                                                    <a href={item.link.startsWith('http') ? item.link : `https://${item.link}`} target="_blank" rel="noopener noreferrer" className="text-xs text-[#09BF44] font-bold mt-2 inline-block">
                                                        View →
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

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
