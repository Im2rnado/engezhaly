"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import MainHeader from "@/components/MainHeader";

export default function RefundPage() {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (stored) {
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
                <Link href="/" className="text-[#09BF44] hover:text-[#07a63a] text-sm font-bold mb-6 inline-block">
                    ← Back to home
                </Link>
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-6">
                    Refund Policy
                </h1>
                <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-10 shadow-sm space-y-6">
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-3">Missed Deadline</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Once you pay, the freelancer has until the agreed deadline to deliver. If they miss it—no work, no excuses—we refund your full amount straight to your Engezhaly balance. We&apos;ll also match you with a new freelancer if you&apos;re interested.
                        </p>
                    </section>
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-3">Work Doesn&apos;t Match</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            If the work arrives but doesn&apos;t match what you asked for:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600">
                            <li>We get back to the chats, files, and screenshots—so make sure everything is done through the chat.</li>
                            <li>If the freelancer is right: money goes to them.</li>
                            <li>If the client is right: full refund to your account.</li>
                        </ul>
                        <p className="text-gray-600 leading-relaxed mt-4">
                            In case of any issue, email us at{" "}
                            <a href="mailto:support@engezhaly.com" className="text-[#09BF44] hover:underline font-medium">
                                support@engezhaly.com
                            </a>
                            . Attach screenshots and a brief explanation—we&apos;ll sort it fast.
                        </p>
                    </section>
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-3">Midway Refunds</h2>
                        <p className="text-gray-600 leading-relaxed">
                            No midway refunds unless the freelancer shows no progress by the halfway mark. Email{" "}
                            <a href="mailto:support@engezhaly.com" className="text-[#09BF44] hover:underline font-medium">
                                support@engezhaly.com
                            </a>
                            {" "}with your case—everything will be reviewed by the Engezhaly team and we will be as helpful as possible.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
