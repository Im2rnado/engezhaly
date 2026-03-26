"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import MainHeader from "@/components/MainHeader";
import { HelpCircle, FileText, ChevronDown } from "lucide-react";

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

export default function HelpAndRulesPage() {
    const [user, setUser] = useState<any>(null);
    const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (stored) {
            // Using a microtask decouples the state update from the initial render cycle,
            // satisfying the requirement to avoid synchronous cascading renders.
            queueMicrotask(() => {
                try {
                    setUser(JSON.parse(stored));
                } catch (e) {
                    console.error("Failed to parse user from localStorage", e);
                }
            });
        }
    }, []);

    return (
        <div className="min-h-screen bg-linear-to-br from-white to-[#09BF44]">
            <MainHeader user={user} showCategories={false} />
            <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
                <Link
                    href="/"
                    className="text-[#09BF44] hover:text-[#07a63a] text-sm font-bold mb-6 inline-block"
                >
                    ← Back to home
                </Link>

                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 rounded-xl bg-[#09BF44]/10">
                        <HelpCircle className="w-8 h-8 text-[#09BF44]" />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-gray-900">
                            How it works
                        </h1>
                        <p className="text-gray-600 mt-1">How Engezhaly works and common questions</p>
                    </div>
                </div>

                <section className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm mb-8">
                    <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-[#09BF44]" />
                        How to Use Engezhaly — Client Guide
                    </h2>
                    <div className="space-y-8">
                        <div className="relative pl-8 border-l-2 border-[#09BF44]/20 space-y-2">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#09BF44] border-4 border-white shadow-sm" />
                            <h3 className="font-bold text-gray-900">Step 1 — Create Your Account</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                Click “Sign Up” on the homepage. Choose “I’m Hiring.” Fill in your name, email, password, and profile photo. Verify your email and you’re in.
                            </p>
                        </div>

                        <div className="relative pl-8 border-l-2 border-[#09BF44]/20 space-y-2">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#09BF44] border-4 border-white shadow-sm" />
                            <h3 className="font-bold text-gray-900">Step 2 — Find the Right Freelancer</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                Browse by category or use the search bar. Filter by rating, price, and reviews. Click on any freelancer to see their full profile, portfolio, and packages.
                            </p>
                        </div>

                        <div className="relative pl-8 border-l-2 border-[#09BF44]/20 space-y-2">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#09BF44] border-4 border-white shadow-sm" />
                            <h3 className="font-bold text-gray-900">Step 3 — Choose How to Work Together</h3>
                            <p className="text-gray-600 text-sm leading-relaxed mb-2">You have 3 options:</p>
                            <ul className="list-disc list-inside text-gray-600 text-sm space-y-1 ml-2">
                                <li>Pick a ready-made package (Basic, Standard, or Premium) and pay instantly</li>
                                <li>Click “Customized” to open a chat and discuss a custom deal—after deciding what you need, the freelancer will send you an offer in chat.</li>
                                <li>Click “Post a Job” and let freelancers apply to your job post and pick the best fit for you and your business.</li>
                            </ul>
                        </div>

                        <div className="relative pl-8 border-l-2 border-[#09BF44]/20 space-y-2">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#09BF44] border-4 border-white shadow-sm" />
                            <h3 className="font-bold text-gray-900">Step 4 — Pay Safely</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                Once you agree on the work, pay through the platform. Your money is held securely—the freelancer doesn’t receive anything until you’re satisfied and press release funds.
                            </p>
                        </div>

                        <div className="relative pl-8 border-l-2 border-[#09BF44]/20 space-y-2">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#09BF44] border-4 border-white shadow-sm" />
                            <h3 className="font-bold text-gray-900">Step 5 — Track Your Order</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                Follow your project’s progress in your dashboard. Chat with your freelancer anytime, share files, and send voice messages.
                            </p>
                        </div>

                        <div className="relative pl-8 border-l-2 border-[#09BF44]/20 space-y-2">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#09BF44] border-4 border-white shadow-sm" />
                            <h3 className="font-bold text-gray-900">Step 6 — Release Payment</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                When the work is done and you’re happy, press “Release Payment.” The freelancer gets paid. Then rate your experience and leave a review.
                            </p>
                        </div>

                        <div className="relative pl-8 space-y-2">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-red-500 border-4 border-white shadow-sm" />
                            <h3 className="font-bold text-gray-900">Step 7 — Something Went Wrong?</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                Contact support directly <a href="mailto:support@engezhaly.com" className="text-[#09BF44] font-bold hover:underline">support@engezhaly.com</a>. We’ll step in, review the situation, and make it right.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <h2 className="text-xl font-bold text-gray-900 p-6 border-b border-gray-100">
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

                <div className="mt-8 text-center">
                    <p className="text-gray-500 text-sm">
                        Need more help?{" "}
                        <Link href="/contact" className="text-[#09BF44] font-bold hover:underline">
                            Contact us
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
