"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import MainHeader from "@/components/MainHeader";

const SECTIONS = [
    {
        title: "1. General Rules",
        items: [
            "Be honest—no fake profiles, reviews, or scams.",
            "Be respectful—treat everyone like you'd want to be treated.",
            "Pay and deliver on time.",
            "Adult content, spam, or any illegal activity is not allowed.",
        ],
    },
    {
        title: "2. Communication & Disputes",
        items: [
            "All communication must stay on the platform.",
            "All chats and calls made through the platform may be recorded or monitored to ensure safety and fairness.",
            "In case of any conflict, only communication and files shared on the platform will be reviewed.",
            "No sharing personal information (phone numbers, emails, addresses) in chats.",
        ],
    },
    {
        title: "3. Payments & Protection",
        items: [
            "Money is held securely until both sides confirm the job is completed.",
            "No job is considered done until both sides are satisfied.",
        ],
    },
    {
        title: "4. Fees",
        items: [
            "Engezhaly is completely free for both clients and freelancers.",
            "We do not charge any platform fees.",
            "Our goal is to keep the platform simple, fair, and accessible for everyone.",
            "Engezhaly reserves the right to introduce or update fees in the future if needed.",
        ],
    },
    {
        title: "5. Payment Methods",
        items: [
            "InstaPay: No fees are charged by Engezhaly. Transfers are free and usually completed within 1 hour (may take up to 1 working day).",
            "Card (via PayMob): Any additional fees are applied by the payment provider only, not by Engezhaly, and will be shown before payment.",
        ],
    },
    {
        title: "6. Account Actions",
        intro: "We can freeze or ban accounts for:",
        subItems: ["Rudeness", "Harassment", "Suspicion of cheating"],
        footer: "If you break the rules, your account may be terminated without warning.",
    },
    {
        title: "7. Updates",
        items: [
            "We may update these terms at any time.",
            "By continuing to use Engezhaly, you automatically agree to any updates.",
        ],
    },
    {
        title: "8. Privacy",
        items: [
            "We collect only what's needed: name, email, phone, and payment details.",
            "Your data is used only for your account, chats, and payments.",
            "We do not sell or share your information.",
            "Your data is stored securely.",
        ],
    },
];

export default function TermsPage() {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (stored) {
            queueMicrotask(() => setUser(JSON.parse(stored)));
        }
    }, []);

    return (
        <div className="min-h-screen bg-linear-to-br from-white to-[#09BF44]">
            <MainHeader user={user} showCategories={false} />
            <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
                <Link href="/" className="text-[#09BF44] hover:text-[#07a63a] text-sm font-bold mb-6 inline-block">
                    ← Back to home
                </Link>
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-6">
                    Terms and Conditions
                </h1>
                <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-10 shadow-sm max-w-none space-y-8">
                    <p className="text-gray-600">
                        By using Engezhaly, you agree to the following terms and conditions.
                    </p>
                    {SECTIONS.map((section) => (
                        <section key={section.title}>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">{section.title}</h2>
                            {"items" in section && section.items && (
                                <ul className="list-disc list-inside space-y-2 text-gray-600">
                                    {section.items.map((item, i) => (
                                        <li key={i}>{item}</li>
                                    ))}
                                </ul>
                            )}
                            {"intro" in section && section.intro && (
                                <div className="text-gray-600 space-y-2">
                                    <p>{section.intro}</p>
                                    <ul className="list-disc list-inside ml-4 space-y-1">
                                        {section.subItems?.map((item, i) => (
                                            <li key={i}>{item}</li>
                                        ))}
                                    </ul>
                                    {section.footer && <p className="mt-3">{section.footer}</p>}
                                </div>
                            )}
                        </section>
                    ))}
                </div>
            </div>
        </div>
    );
}
