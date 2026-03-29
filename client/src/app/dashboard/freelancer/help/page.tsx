import { useEffect, useState } from "react";
import Link from "next/link";
import { HelpCircle, FileText, ChevronDown, PanelLeft, Loader2 } from "lucide-react";
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import FreelancerSidebar from '@/components/FreelancerSidebar';
import DashboardMobileTopStrip from '@/components/DashboardMobileTopStrip';

const FAQ_ITEMS = [
    {
        q: "How do I find a freelancer?",
        a: "Browse offers by category on the Find a Freelancer page, or search for specific skills. You can also post a job and receive proposals from freelancers.",
    },
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

                <div className="max-w-4xl">
                    <section className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm mb-8">
                        <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
                            <FileText className="w-6 h-6 text-[#09BF44]" />
                            How to Use Engezhaly — Freelancer Guide
                        </h2>
                        <div className="space-y-6">
                            <div className="relative pl-8 border-l-2 border-[#09BF44]/20 space-y-1">
                                <div className="absolute -left-2.25 top-0 w-4 h-4 rounded-full bg-[#09BF44] border-4 border-white shadow-sm" />
                                <h3 className="font-bold text-gray-900">Step 1 — Create Your Profile</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    Sign up, complete your skills and portfolio. Our team reviews applications within 24-48 hours.
                                </p>
                            </div>

                            <div className="relative pl-8 border-l-2 border-[#09BF44]/20 space-y-1">
                                <div className="absolute -left-2.25 top-0 w-4 h-4 rounded-full bg-[#09BF44] border-4 border-white shadow-sm" />
                                <h3 className="font-bold text-gray-900">Step 2 — Create Offers</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    Create enticing offers for services you provide. Define your packages and set fair prices.
                                </p>
                            </div>

                            <div className="relative pl-8 border-l-2 border-[#09BF44]/20 space-y-1">
                                <div className="absolute -left-2.25 top-0 w-4 h-4 rounded-full bg-[#09BF44] border-4 border-white shadow-sm" />
                                <h3 className="font-bold text-gray-900">Step 3 — Apply for Jobs</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    Browse the job board and apply for projects. Write compelling proposals to stand out.
                                </p>
                            </div>

                            <div className="relative pl-8 border-l-2 border-[#09BF44]/20 space-y-1">
                                <div className="absolute -left-2.25 top-0 w-4 h-4 rounded-full bg-[#09BF44] border-4 border-white shadow-sm" />
                                <h3 className="font-bold text-gray-900">Step 4 — Communicate & Deliver</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    Discuss details in chat. Once ordered, deliver high-quality results within the timeframe.
                                </p>
                            </div>

                            <div className="relative pl-8 border-l-2 border-[#09BF44]/20 space-y-1">
                                <div className="absolute -left-2.25 top-0 w-4 h-4 rounded-full bg-[#09BF44] border-4 border-white shadow-sm" />
                                <h3 className="font-bold text-gray-900">Step 5 — Get Paid</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    After approval, funds are added to your wallet for withdrawal.
                                </p>
                            </div>

                            <div className="relative pl-8 space-y-1">
                                <div className="absolute -left-2.25 top-0 w-4 h-4 rounded-full bg-red-500 border-4 border-white shadow-sm" />
                                <h3 className="font-bold text-gray-900">Need Help?</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    Contact <a href="mailto:support@engezhaly.com" className="text-[#09BF44] font-bold hover:underline">support@engezhaly.com</a>.
                                </p>
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
