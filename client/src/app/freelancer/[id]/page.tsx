"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2, Award, Clock, CheckCircle, Calendar, MapPin, Globe, Star } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDateDDMMYYYY } from '@/lib/utils';
import ProjectCard from '@/components/ProjectCard';
import MainHeader from '@/components/MainHeader';

export default function FreelancerProfilePage() {
    const router = useRouter();
    const params = useParams();
    const freelancerId = params.id as string;

    const [user, setUser] = useState<any>(null);
    const [freelancer, setFreelancer] = useState<any>(null);
    const [projects, setProjects] = useState<any[]>([]);
    const [reviews, setReviews] = useState<any[]>([]);
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
                // Fetch reviews (from completed orders with client ratings)
                api.freelancer.getReviews(freelancerId).then(setReviews).catch(() => setReviews([]));
            } catch (err: any) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [freelancerId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <MainHeader user={user} showCategories={false} />
                <div className="flex items-center justify-center py-32">
                    <Loader2 className="w-8 h-8 animate-spin text-[#09BF44]" />
                </div>
            </div>
        );
    }

    if (!freelancer) {
        return (
            <div className="min-h-screen bg-gray-50">
                <MainHeader user={user} showCategories={false} />
                <div className="flex items-center justify-center py-24">
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
            </div>
        );
    }

    const profile = freelancer.freelancerProfile;

    return (
        <main className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            <MainHeader user={user} onSearch={(q) => router.push(`/offers?search=${encodeURIComponent(q)}`)} showCategories={false} />

            {/* Profile Section */}
            <div className="max-w-[95%] md:max-w-[90%] mx-auto px-4 md:px-6 py-8 md:py-12">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 md:p-8 mb-8">
                    <div className="flex flex-col sm:flex-row items-start gap-4 md:gap-6">
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden flex items-center justify-center bg-[#09BF44] text-white font-black text-2xl md:text-3xl shrink-0">
                            {profile?.profilePicture ? (
                                <img src={profile.profilePicture} alt="" className="w-full h-full object-cover" />
                            ) : (
                                freelancer.firstName?.[0]?.toUpperCase() || 'F'
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                                <h1 className="text-2xl md:text-3xl font-black text-gray-900">
                                    {freelancer.firstName} {freelancer.lastName}
                                </h1>
                                {profile?.isBusy && (
                                    <span className="px-3 py-1 bg-amber-100 text-amber-700 text-base font-bold rounded-full">FREELANCER BUSY</span>
                                )}
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
                            <div className="flex flex-wrap gap-3 md:gap-4 text-sm">
                                {freelancer.dateOfBirth && (
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        <span className="font-bold text-gray-700">
                                            {new Date().getFullYear() - new Date(freelancer.dateOfBirth).getFullYear()} years old
                                        </span>
                                    </div>
                                )}
                                {profile?.city && (
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-gray-400" />
                                        <span className="font-bold text-gray-700">{profile.city}</span>
                                    </div>
                                )}
                                {(profile?.languages?.english || profile?.languages?.arabic) && (
                                    <div className="flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-gray-400" />
                                        <span className="font-bold text-gray-700">
                                            {[profile.languages.english && `English: ${profile.languages.english}`, profile.languages.arabic && `Arabic: ${profile.languages.arabic}`].filter(Boolean).join(', ')}
                                        </span>
                                    </div>
                                )}
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

                    {profile?.certifications && profile.certifications.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <h3 className="text-sm font-bold text-gray-500 mb-3">Certifications</h3>
                            <ul className="space-y-2">
                                {profile.certifications.map((c: any, idx: number) => (
                                    <li key={idx} className="text-gray-700">
                                        <span className="font-bold">{c.name}</span>
                                        {(c.institute || c.date) && (
                                            <span className="text-gray-600 text-sm">
                                                {c.institute && ` • ${c.institute}`}
                                                {c.date && ` • ${formatDateDDMMYYYY(c.date)}`}
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {reviews.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <h3 className="text-sm font-bold text-gray-500 mb-3">Reviews ({reviews.length})</h3>
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                {reviews.map((r: any, idx: number) => (
                                    <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="flex items-center gap-2 mb-1">
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
                        </div>
                    )}

                    {profile?.portfolio && profile.portfolio.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <h3 className="text-sm font-bold text-gray-500 mb-3">Portfolio</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {profile.portfolio.map((item: any, idx: number) => (
                                    <div key={idx} className="rounded-xl overflow-hidden border border-gray-100">
                                        {item.imageUrl && (
                                            <img src={item.imageUrl} alt={item.title || 'Portfolio'} className="w-full aspect-video object-cover" />
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

                {/* Offers Section */}
                {projects.length > 0 && (
                    <div>
                        <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-5 md:mb-6">Services Offered</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {projects.map((project) => (
                                <ProjectCard key={project._id} project={project} showContactMe={true} sellerIdOverride={freelancerId} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
