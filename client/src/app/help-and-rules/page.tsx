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
        if (stored) setUser(JSON.parse(stored));
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-white to-[#09BF44]">
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
                            Help and Rules
                        </h1>
                        <p className="text-gray-600 mt-1">How Engezhaly works and common questions</p>
                    </div>
                </div>

                <section className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#09BF44]" />
                        How Engezhaly Works
                    </h2>
                    <div className="space-y-4 text-gray-700">
                        <p>
                            Engezhaly connects clients with skilled freelancers across Egypt. Clients can browse pre-made offers (fixed-price services) or post jobs for custom work. Freelancers create offers, submit proposals, and get paid securely through the platform.
                        </p>
                        <p>
                            All payments go through Engezhaly. Never pay or receive payment outside the platform — it protects both parties and ensures fair resolution of any issues.
                        </p>
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
