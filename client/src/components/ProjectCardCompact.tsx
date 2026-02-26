"use client";

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Check, Star } from 'lucide-react';

interface ProjectCardCompactProps {
    project: any;
}

export default function ProjectCardCompact({ project }: ProjectCardCompactProps) {
    const router = useRouter();
    const seller = project.sellerId;
    const freelancerName = seller ? `${seller.firstName || ''} ${seller.lastName || ''}`.trim() : 'Freelancer';
    const profilePicture = seller?.freelancerProfile?.profilePicture;
    const bannerImage = project.images?.[0] || null;
    const packages = project.packages || [];
    const lowestPrice = packages.length > 0
        ? Math.min(...packages.map((p: any) => Number(p.price) || 0))
        : 0;
    const skills = [project.category, project.subCategory].filter(Boolean);
    const brief = project.description ? project.description.slice(0, 120) + (project.description.length > 120 ? '...' : '') : '';

    return (
        <div
            onClick={() => router.push(`/projects/${project._id}`)}
            className="group bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer"
        >
            {/* Banner image full width behind */}
            <div className="relative h-32 md:h-40 bg-gradient-to-br from-[#09BF44]/20 to-transparent">
                {bannerImage ? (
                    <Image
                        src={bannerImage}
                        alt={project.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : null}
                <div className="absolute inset-0 bg-black/10" />
            </div>

            <div className="p-4 md:p-5">
                {/* Profile pic (left) + Title (right) */}
                <div className="flex items-start gap-3 mb-3">
                    <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-white shadow-md shrink-0 bg-gray-200">
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
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-base md:text-lg line-clamp-2 group-hover:text-[#09BF44] transition-colors">
                            {project.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">{freelancerName}</p>
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
                        <p className="text-xs text-gray-500">From</p>
                        <p className="text-lg font-black text-[#09BF44]">{lowestPrice} EGP</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
