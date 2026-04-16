"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HelpCircle, FileText, ChevronDown, PanelLeft, Loader2, Video } from "lucide-react";
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import FreelancerSidebar from '@/components/FreelancerSidebar';
import DashboardMobileTopStrip from '@/components/DashboardMobileTopStrip';
import VimeoStarterOfferEmbed from '@/components/VimeoStarterOfferEmbed';

const FAQ_ITEMS = [
    {
        q: "How does payment work?",
        a: "Payments are processed securely through Engezhaly. Clients pay when ordering an offer or accepting a proposal. Funds are held until work is delivered and approved.",
    },
    {
        q: "How do I get paid as a freelancer?",
        a: "Once a client approves your delivered work, funds are released to your wallet. You can withdraw to Vodafone Cash, InstaPay, or your bank account.",
    },
    {
        q: "What if I have a dispute?",
        a: "Both parties can raise a dispute from the order page. Our support team will review and help resolve the issue fairly.",
    },
];

export default function FreelancerHelpPage() {
    const router = useRouter();
    const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);
    const [user, setUser] = useState<any>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('user');
            return stored ? JSON.parse(stored) : null;
        }
        return null;
    });
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    useEffect(() => {
        api.freelancer.getProfile().then((data) => {
            setProfile(data);
            setLoading(false);
            if (!user && data?._id) {
                setUser(data);
            }
        }).catch(() => {
            router.push('/');
        });
    }, [router, user]);

    const toggleBusy = async () => {
        try {
            const newStatus = !profile?.freelancerProfile?.isBusy;
            const updated = await api.freelancer.updateProfile({ isBusy: newStatus });
            setProfile(updated);
        } catch (err) {
            console.error(err);
        }
    };

    if (loading || !user || !profile) {
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
                onToggleBusy={toggleBusy}
                onTabChange={(tab) => router.push(`/dashboard/freelancer?tab=${tab}`)}
                activeTab="help"
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

                <header className="flex flex-wrap justify-between items-center gap-3 mb-7 md:mb-10">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setMobileSidebarOpen(true)}
                            className="md:hidden p-2 rounded-lg border border-gray-200 bg-white text-gray-700"
                            aria-label="Open sidebar"
                        >
                            <PanelLeft className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-[#09BF44]/10">
                                <HelpCircle className="w-6 h-6 text-[#09BF44]" />
                            </div>
                            <h1 className="text-2xl md:text-3xl font-black text-gray-900">
                                Help & Support
                            </h1>
                        </div>
                    </div>
                </header>

                <div className="max-w-7xl">
                    <section className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm mb-8">
                        <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
                            <FileText className="w-6 h-6 text-[#09BF44]" />
                            How to Use Engezhaly — Freelancer Guide
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4 mb-10">
                            <div className="rounded-2xl border-2 border-[#09BF44]/35 bg-linear-to-br from-[#09BF44]/12 to-emerald-50 p-4 md:p-5 shadow-sm flex flex-col">
                                <span className="inline-flex self-start px-2.5 py-1 rounded-lg bg-[#09BF44] text-white text-xs font-black mb-3">
                                    Step 1
                                </span>
                                <h3 className="font-bold text-gray-900 text-sm md:text-base mb-2">Create Your Profile</h3>
                                <p className="text-gray-700 text-xs md:text-sm leading-relaxed flex-1">
                                    Sign up, complete your skills and portfolio. Our team reviews applications within 24-48 hours.
                                </p>
                            </div>

                            <div className="rounded-2xl border-2 border-[#09BF44]/35 bg-linear-to-br from-[#09BF44]/12 to-emerald-50 p-4 md:p-5 shadow-sm flex flex-col">
                                <span className="inline-flex self-start px-2.5 py-1 rounded-lg bg-[#09BF44] text-white text-xs font-black mb-3">
                                    Step 2
                                </span>
                                <h3 className="font-bold text-gray-900 text-sm md:text-base mb-2">Create Offers</h3>
                                <p className="text-gray-700 text-xs md:text-sm leading-relaxed flex-1">
                                    Create enticing offers for services you provide. Define your packages and set fair prices.
                                </p>
                            </div>

                            <div className="rounded-2xl border-2 border-[#09BF44]/35 bg-linear-to-br from-[#09BF44]/12 to-emerald-50 p-4 md:p-5 shadow-sm flex flex-col">
                                <span className="inline-flex self-start px-2.5 py-1 rounded-lg bg-[#09BF44] text-white text-xs font-black mb-3">
                                    Step 3
                                </span>
                                <h3 className="font-bold text-gray-900 text-sm md:text-base mb-2">Custom Offer Through Chat</h3>
                                <p className="text-gray-700 text-xs md:text-sm leading-relaxed flex-1">
                                    A client opens a chat with you to discuss their needs. Once you understand what they want, press the &quot;Custom Offer&quot; button inside the chat. Set your price, delivery days, revisions, and milestones if needed.
                                </p>
                            </div>

                            <div className="rounded-2xl border-2 border-[#09BF44]/35 bg-linear-to-br from-[#09BF44]/12 to-emerald-50 p-4 md:p-5 shadow-sm flex flex-col">
                                <span className="inline-flex self-start px-2.5 py-1 rounded-lg bg-[#09BF44] text-white text-xs font-black mb-3">
                                    Step 4
                                </span>
                                <h3 className="font-bold text-gray-900 text-sm md:text-base mb-2">Bundle Purchase</h3>
                                <p className="text-gray-700 text-xs md:text-sm leading-relaxed flex-1">
                                    A client buys one of your ready-made packages (Basic, Standard, or Premium) directly. You&apos;ll receive a notification to approve the order first. Once you approve, work begins.
                                </p>
                            </div>

                            <div className="rounded-2xl border-2 border-[#09BF44]/35 bg-linear-to-br from-[#09BF44]/12 to-emerald-50 p-4 md:p-5 shadow-sm flex flex-col">
                                <span className="inline-flex self-start px-2.5 py-1 rounded-lg bg-[#09BF44] text-white text-xs font-black mb-3">
                                    Step 5
                                </span>
                                <h3 className="font-bold text-gray-900 text-sm md:text-base mb-2">Apply for Posted Jobs</h3>
                                <p className="text-gray-700 text-xs md:text-sm leading-relaxed flex-1">
                                    Clients can post a job describing what they need. Browse open jobs and apply with a custom offer tailored to their project. If they choose you, work begins.
                                </p>
                            </div>

                            <div className="rounded-2xl border-2 border-[#09BF44]/35 bg-linear-to-br from-[#09BF44]/12 to-emerald-50 p-4 md:p-5 shadow-sm flex flex-col">
                                <span className="inline-flex self-start px-2.5 py-1 rounded-lg bg-[#09BF44] text-white text-xs font-black mb-3">
                                    Step 6
                                </span>
                                <h3 className="font-bold text-gray-900 text-sm md:text-base mb-2">Busy? Set Your Status</h3>
                                <p className="text-gray-700 text-xs md:text-sm leading-relaxed flex-1">
                                    If you&apos;re fully booked, toggle your status to &quot;Busy.&quot; Clients won&apos;t be able to send new orders until you switch back to available. Don&apos;t leave clients waiting and keep your status updated at all times. (If busy for no reason, you will get a call from Engezhaly)
                                </p>
                            </div>
                        </div>

                        <div className="rounded-2xl border-2 border-[#09BF44]/40 bg-[#09BF44]/5 p-4 md:p-6 mb-10">
                            <h3 className="font-black text-gray-900 text-sm md:text-base mb-3">Important:</h3>
                            <ul className="list-disc pl-5 space-y-2 text-gray-700 text-xs md:text-sm leading-relaxed">
                                <li>All deals must be agreed and paid through Engezhaly</li>
                                <li>Never accept payments outside the platform</li>
                                <li>If the client&apos;s description after buying the bundle does not match the bundle features, deny it and customize an offer for them in chat (it&apos;s your responsibility to make a client want to work with you).</li>
                                <li>Keep all communication through the chat; this protects you in case of dispute. Any contact outside of the website will result in all money being held.</li>
                            </ul>
                        </div>

                        <div className="relative pl-8 space-y-1">
                            <div className="absolute -left-2.25 top-0 w-4 h-4 rounded-full bg-red-500 border-4 border-white shadow-sm" />
                            <h3 className="font-bold text-gray-900">Need Help?</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                Contact <a href="mailto:support@engezhaly.com" className="text-[#09BF44] font-bold hover:underline">support@engezhaly.com</a>.
                            </p>
                        </div>
                    </section>

                    <section className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm mb-8">
                        <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-2 flex items-center gap-2">
                            <Video className="w-6 h-6 text-[#09BF44]" />
                            Starter offer — video guide
                        </h2>
                        <p className="text-gray-600 text-sm md:text-base mb-5 max-w-3xl">
                            Step-by-step walkthrough for building your first offer when you sign up (same video as in registration).
                        </p>
                        <div className="max-w-3xl">
                            <VimeoStarterOfferEmbed title="" />
                        </div>
                    </section>

                    <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm mb-8">
                        <h2 className="text-lg font-bold text-gray-900 p-6 border-b border-gray-100">
                            Freelancer guide — video
                        </h2>
                        <div className="p-6">
                            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-gray-200 bg-black">
                                <iframe
                                    src="https://player.vimeo.com/video/1183454770?h=3c2270a5b2"
                                    title="Freelancer guide"
                                    allow="autoplay; fullscreen; picture-in-picture"
                                    className="absolute inset-0 w-full h-full"
                                    allowFullScreen
                                />
                            </div>
                        </div>
                    </section>

                    <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 p-6 border-b border-gray-100">
                            Frequently Asked Questions
                        </h2>
                        <div className="divide-y divide-gray-100">
                            {FAQ_ITEMS.map((item, idx) => (
                                <div key={idx} className="border-b border-gray-100 last:border-0">
                                    <button
                                        onClick={() => setOpenFaqIdx(openFaqIdx === idx ? null : idx)}
                                        className="w-full flex items-center justify-between p-4 md:p-6 text-left hover:bg-gray-50 transition-colors"
                                    >
                                        <span className="font-bold text-gray-900 pr-4">{item.q}</span>
                                        <ChevronDown
                                            className={`w-5 h-5 shrink-0 text-gray-500 transition-transform ${openFaqIdx === idx ? "rotate-180" : ""}`}
                                        />
                                    </button>
                                    {openFaqIdx === idx && (
                                        <div className="px-4 md:px-6 pb-4 md:pb-6 text-gray-600 text-sm md:text-base">
                                            {item.a}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    <div className="mt-8 text-center md:text-left">
                        <p className="text-gray-500 text-sm">
                            Need more help?{" "}
                            <Link href="/contact" className="text-[#09BF44] font-bold hover:underline">
                                Contact us
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
