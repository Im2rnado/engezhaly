/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { Loader2, ArrowLeft, Star, ChevronLeft, ChevronRight, Video } from 'lucide-react';
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
    const [reviews, setReviews] = useState<any[]>([]);
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
                .then((p) => {
                    setProject(p);
                    const sellerId = p?.sellerId?._id || p?.sellerId;
                    if (sellerId) {
                        api.freelancer.getReviews(typeof sellerId === 'string' ? sellerId : sellerId.toString()).then(setReviews).catch(() => setReviews([]));
                    }
                })
                .catch(() => setProject(null))
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [projectId]);

    const seller = project?.sellerId;
    const freelancerName = seller ? `${seller.firstName || ''} ${seller.lastName || ''}`.trim() : 'Freelancer';
    const profilePicture = seller?.freelancerProfile?.profilePicture;
    const profile = seller?.freelancerProfile;
    const category = project?.category;
    const subCategory = project?.subCategory;
    const packages = project?.packages || [];
    const firstPackage = packages[0];

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
        <div className="min-h-screen bg-white">
            <MainHeader user={user} showCategories={false} />

            <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-bold mb-6 transition-colors text-sm">
                    <ArrowLeft className="w-4 h-4" /> Back to offers
                </button>

                {/* Fiverr-style two-column layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                    {/* Left column - content */}
                    <div className="lg:col-span-7 space-y-8">
                        {/* Title */}
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                            {project.title}
                        </h1>

                        {/* Freelancer card - Get to know */}
                        <div className="flex items-start gap-4 py-4 border-y border-gray-200">
                            <Link
                                href={seller?._id ? `/freelancer/${seller._id}` : '#'}
                                className="shrink-0"
                            >
                                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-gray-100 bg-gray-100">
                                    {profilePicture ? (
                                        <Image src={profilePicture} alt={freelancerName} fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full rounded-full bg-gradient-to-br from-[#09BF44] to-[#07a63a] flex items-center justify-center text-white font-black text-xl">
                                            {freelancerName[0]?.toUpperCase() || 'F'}
                                        </div>
                                    )}
                                </div>
                            </Link>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-lg font-bold text-gray-900 mb-1">{freelancerName}</h2>
                                {profile?.isBusy && (
                                    <span className="inline-block mb-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-sm font-bold rounded-full">FREELANCER BUSY</span>
                                )}
                                {profile?.bio && (
                                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 mb-3">
                                        {profile.bio}
                                    </p>
                                )}
                                <div className="flex flex-wrap items-center gap-3 mb-3">
                                    <div className="flex items-center gap-1.5 text-amber-500">
                                        <Star className="w-4 h-4 fill-amber-400" />
                                        <span className="text-sm font-bold text-gray-700">New seller</span>
                                    </div>
                                    {(category || subCategory) && (
                                        <span className="text-gray-400">|</span>
                                    )}
                                    {subCategory && (
                                        <span className="text-sm font-bold text-gray-600">{subCategory}</span>
                                    )}
                                    {category && !subCategory && (
                                        <span className="text-sm font-bold text-gray-600">{category}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Media gallery */}
                        {images.length > 0 && (
                            <div className="relative">
                                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100">
                                    <Image
                                        src={images[slideshowIndex]}
                                        alt={`${project.title} - ${slideshowIndex + 1}`}
                                        fill
                                        className="object-cover"
                                        priority
                                    />
                                </div>
                                {hasMultipleImages && (
                                    <>
                                        <button
                                            onClick={() => setSlideshowIndex((i) => (i === 0 ? images.length - 1 : i - 1))}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                                            aria-label="Previous"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => setSlideshowIndex((i) => (i === images.length - 1 ? 0 : i + 1))}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                                            aria-label="Next"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                        <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                                            {images.map((img: string, idx: number) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setSlideshowIndex(idx)}
                                                    className={`relative w-20 h-14 shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${idx === slideshowIndex ? 'border-gray-900' : 'border-transparent hover:border-gray-300'}`}
                                                >
                                                    <Image src={img} alt="" fill className="object-cover" sizes="80px" />
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* About this project */}
                        {project.description && (
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">About this offer</h3>
                                <div className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                                    {project.description}
                                </div>
                            </div>
                        )}

                        {/* Portfolio - My Portfolio */}
                        {seller?.freelancerProfile?.portfolio && seller.freelancerProfile.portfolio.length > 0 && (
                            <div className="pt-8 border-t border-gray-200">
                                <h3 className="text-xl font-bold text-gray-900 mb-4">My Portfolio</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {seller.freelancerProfile.portfolio.slice(0, 6).map((item: any, idx: number) => (
                                        <div key={idx} className="rounded-xl overflow-hidden border border-gray-200 hover:border-gray-300 transition-colors">
                                            {item.imageUrl && (
                                                <div className="relative w-full aspect-video bg-gray-100">
                                                    <Image src={item.imageUrl} alt={item.title || 'Portfolio'} fill className="object-cover" sizes="(max-width: 640px) 100vw, 50vw" />
                                                </div>
                                            )}
                                            <div className="p-4">
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    <h4 className="font-bold text-gray-900">{item.title}</h4>
                                                    {item.subCategory && (
                                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-bold rounded">{item.subCategory}</span>
                                                    )}
                                                </div>
                                                {item.description && <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>}
                                                {item.link && (
                                                    <a href={item.link.startsWith('http') ? item.link : `https://${item.link}`} target="_blank" rel="noopener noreferrer" className="text-sm text-[#09BF44] font-bold mt-2 inline-block hover:underline">
                                                        View project →
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {seller.freelancerProfile.portfolio.length > 6 && (
                                    <p className="text-sm text-gray-500 mt-4">+{seller.freelancerProfile.portfolio.length - 6} more projects</p>
                                )}
                            </div>
                        )}

                        {/* Reviews */}
                        <div className="pt-8 border-t border-gray-200">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Reviews</h3>
                            {reviews.length > 0 ? (
                                <div className="space-y-4">
                                    {reviews.map((r: any, idx: number) => (
                                        <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="flex gap-0.5">
                                                    {[1, 2, 3, 4, 5].map((n) => (
                                                        <Star key={n} className={`w-4 h-4 ${n <= (r.rating || 0) ? 'fill-amber-400 text-amber-500' : 'text-gray-300'}`} />
                                                    ))}
                                                </div>
                                                <span className="text-xs text-gray-500">{r.buyerName}</span>
                                                {r.completedAt && (
                                                    <span className="text-xs text-gray-400">{new Date(r.completedAt).toLocaleDateString()}</span>
                                                )}
                                            </div>
                                            {r.review && <p className="text-gray-700 text-sm">{r.review}</p>}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm">No reviews yet.</p>
                            )}
                        </div>
                    </div>

                    {/* Right column - sticky pricing card */}
                    <div className="lg:col-span-5">
                        <div className="lg:sticky lg:top-24">
                            <ProjectCard project={project} showContactMe={true} variant="bundle" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
