"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Check, Star, ChevronLeft, ChevronRight } from 'lucide-react';

interface ProjectCardCompactProps {
    project: any;
}

export default function ProjectCardCompact({ project }: ProjectCardCompactProps) {
    const router = useRouter();
    const [carouselIndex, setCarouselIndex] = useState(0);
    const raw = (project.images || []).filter(Boolean) as string[];
    const images = [...new Set(raw)];
    const hasMultipleImages = images.length > 1;
    const bannerImage = images[0] || null;
    const seller = project.sellerId;
    const freelancerName = seller ? `${seller.firstName || ''} ${seller.lastName || ''}`.trim() : 'Freelancer';
    const profilePicture = seller?.freelancerProfile?.profilePicture;
    const packages = project.packages || [];
    const lowestPrice = packages.length > 0
        ? Math.min(...packages.map((p: any) => Number(p.price) || 0))
        : 0;
    const skills = [project.category, project.subCategory].filter(Boolean);
    const brief = project.description ? project.description.slice(0, 120) + (project.description.length > 120 ? '...' : '') : '';

    return (
        <div
            onClick={() => router.push(`/offers/${project._id}`)}
            className="group bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer"
        >
            {/* Image carousel */}
            <div className="relative h-32 md:h-40 bg-gradient-to-br from-[#09BF44]/20 to-transparent overflow-hidden">
                {bannerImage ? (
                    <>
                        <Image
                            src={images[carouselIndex]}
                            alt={project.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {hasMultipleImages && (
                            <>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setCarouselIndex((i) => (i === 0 ? images.length - 1 : i - 1)); }}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/90 shadow-md hover:bg-white transition-colors"
                                    aria-label="Previous image"
                                >
                                    <ChevronLeft className="w-4 h-4 text-gray-700" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setCarouselIndex((i) => (i === images.length - 1 ? 0 : i + 1)); }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/90 shadow-md hover:bg-white transition-colors"
                                    aria-label="Next image"
                                >
                                    <ChevronRight className="w-4 h-4 text-gray-700" />
                                </button>
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                                    {images.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={(e) => { e.stopPropagation(); setCarouselIndex(idx); }}
                                            className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === carouselIndex ? 'bg-white' : 'bg-white/50'}`}
                                            aria-label={`Image ${idx + 1}`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                ) : null}
                <div className="absolute inset-0 bg-black/10 pointer-events-none" />
            </div>

            <div className="p-4 md:p-5 pb-2 md:pb-3">
                {/* Profile pic (left) + Title (right) */}
                <div className="flex items-start gap-3 mb-3">
                    <Link
                        href={seller?._id ? `/freelancer/${seller._id}` : '#'}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-white shadow-md shrink-0 bg-gray-200 hover:ring-2 hover:ring-[#09BF44] transition-all"
                    >
                        {profilePicture ? (
                            <Image
                                src={profilePicture}
                                alt={freelancerName}
                                width={56}
                                height={56}
                                className="object-cover w-full h-full"
                            />
                        ) : (
                            <div className="w-full h-full rounded-full bg-gradient-to-br from-[#09BF44] to-[#07a63a] flex items-center justify-center text-white font-black text-lg">
                                {freelancerName[0]?.toUpperCase() || 'F'}
                            </div>
                        )}
                    </Link>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-base md:text-lg line-clamp-2 group-hover:text-[#09BF44] transition-colors">
                            {project.title}
                        </h3>
                        <Link
                            href={seller?._id ? `/freelancer/${seller._id}` : '#'}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-gray-500 mt-0.5 hover:text-[#09BF44] transition-colors block"
                        >
                            {freelancerName}
                        </Link>
                    </div>
                </div>

                {/* Brief/summary below title */}
                {brief && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{brief}</p>
                )}

                {/* Skills as ticks */}
                {skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {skills.map((skill: string) => (
                            <span
                                key={skill}
                                className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full"
                            >
                                <Check className="w-3 h-3 text-[#09BF44]" />
                                {skill}
                            </span>
                        ))}
                    </div>
                )}

                {/* Rating + Lowest price row */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-1 text-amber-500">
                        <Star className="w-4 h-4 fill-amber-400" />
                        <span className="text-sm font-bold text-gray-700">New</span>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500">Starts From</p>
                        <p className="text-lg font-black text-[#09BF44]">{lowestPrice} EGP</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
