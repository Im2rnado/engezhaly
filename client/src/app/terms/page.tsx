"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import MainHeader from "@/components/MainHeader";

export default function TermsPage() {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (stored) setUser(JSON.parse(stored));
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            <MainHeader user={user} showCategories={false} />
            <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
                <Link href="/" className="text-[#09BF44] hover:text-[#07a63a] text-sm font-bold mb-6 inline-block">
                    ← Back to home
                </Link>
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-6">
                    Terms and Conditions
                </h1>
                <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-10 shadow-sm prose prose-gray max-w-none">
                    <p className="text-gray-600 mb-6">
                        By using ENGEZHALY, you agree to:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-gray-600 mb-6">
                        <li>Be honest—no fake profiles, reviews, or scams.</li>
                        <li>Pay and deliver on time.</li>
                        <li>Money stays with us until both sides confirm the job&apos;s done.</li>
                        <li>We can freeze or ban accounts for rudeness, harassment, or suspicion of cheating.</li>
                        <li>No sharing personal info (phone numbers, emails, addresses) in chats—keep it professional.</li>
                        <li>Be respectful—treat everyone like you&apos;d want to be treated.</li>
                        <li>We don&apos;t allow adult content, spam, or illegal stuff.</li>
                        <li>If you break these rules, we can end your account with no warning.</li>
                    </ul>
                    <p className="text-gray-600 mb-6">
                        We may update these Terms anytime. By continuing to use Engezhaly after changes, you automatically agree to the new rules—no extra click needed.
                    </p>
                    <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Fees</h2>
                    <p className="text-gray-600 mb-4">
                        ENGEZHALY charges a fixed <strong>20 EGP</strong> from the client upon payment, and <strong>20 EGP</strong> from the freelancer upon completion.
                    </p>
                    <p className="text-gray-600 mb-4">
                        We hold your money securely until both sides confirm the job is done—no job is done until both sides are satisfied.
                    </p>
                    <p className="text-gray-600 mb-4">
                        If you pay by card via PayMob, they add an estimated fee of 3% and a 3 EGP fixed fee—that&apos;s theirs, not ours. You&apos;ll see it up front.
                    </p>
                    <p className="text-gray-600 mb-4">
                        <strong>If you pay through InstaPay, no extra fees</strong> will be deducted—only the Engezhaly fee. With InstaPay, money will be added within 1 working day (usually it will take 1 hour).
                    </p>
                </div>
            </div>
        </div>
    );
}
