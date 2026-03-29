"use client";

import { useState } from "react";
import Link from "next/link";
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

export default function FreelancerHelpPage() {
    const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 rounded-xl bg-[#09BF44]/10">
                    <HelpCircle className="w-8 h-8 text-[#09BF44]" />
                </div>
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-gray-900">
                        Help & Support
                    </h1>
                    <p className="text-gray-600 mt-1">Frequently asked questions and guides</p>
                </div>
            </div>

            <section className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm mb-8">
                <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-[#09BF44]" />
                    How to Use Engezhaly — Freelancer Guide
                </h2>
                <div className="space-y-8">
                        <div className="relative pl-8 border-l-2 border-[#09BF44]/20 space-y-2">
                            <div className="absolute -left-2.25 top-0 w-4 h-4 rounded-full bg-[#09BF44] border-4 border-white shadow-sm" />
                        <h3 className="font-bold text-gray-900">Step 1 — Create Your Profile</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            Sign up as a freelancer, complete your profile with your skills, portfolio, and bio. Our team will review your application within 24-48 hours.
                        </p>
                    </div>

                        <div className="relative pl-8 border-l-2 border-[#09BF44]/20 space-y-2">
                            <div className="absolute -left-2.25 top-0 w-4 h-4 rounded-full bg-[#09BF44] border-4 border-white shadow-sm" />
                        <h3 className="font-bold text-gray-900">Step 2 — Create Offers</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            Create enticing offers for services you provide. Define your packages (Basic, Standard, Premium) and set your prices fairly.
                        </p>
                    </div>

                        <div className="relative pl-8 border-l-2 border-[#09BF44]/20 space-y-2">
                            <div className="absolute -left-2.25 top-0 w-4 h-4 rounded-full bg-[#09BF44] border-4 border-white shadow-sm" />
                        <h3 className="font-bold text-gray-900">Step 3 — Apply for Jobs</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            Browse the job board and apply for projects that match your expertise. Write compelling proposals to stand out from the competition.
                        </p>
                    </div>

                        <div className="relative pl-8 border-l-2 border-[#09BF44]/20 space-y-2">
                            <div className="absolute -left-2.25 top-0 w-4 h-4 rounded-full bg-[#09BF44] border-4 border-white shadow-sm" />
                        <h3 className="font-bold text-gray-900">Step 4 — Communicate & Deliver</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            Use the chat system to discuss details with clients. Once an order is placed, start working and deliver high-quality results within the agreed timeframe.
                        </p>
                    </div>

                        <div className="relative pl-8 border-l-2 border-[#09BF44]/20 space-y-2">
                            <div className="absolute -left-2.25 top-0 w-4 h-4 rounded-full bg-[#09BF44] border-4 border-white shadow-sm" />
                        <h3 className="font-bold text-gray-900">Step 5 — Get Paid</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            After the client approves your delivery, the funds will be added to your wallet. You can then request a withdrawal via your preferred method.
                        </p>
                    </div>

                    <div className="relative pl-8 space-y-2">
                        <div className="absolute -left-2.25 top-0 w-4 h-4 rounded-full bg-red-500 border-4 border-white shadow-sm" />
                        <h3 className="font-bold text-gray-900">Need Help?</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            Contact our support team at <a href="mailto:support@engezhaly.com" className="text-[#09BF44] font-bold hover:underline">support@engezhaly.com</a> for any assistance.
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
    );
}
