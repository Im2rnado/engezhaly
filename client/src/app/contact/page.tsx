"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import MainHeader from "@/components/MainHeader";

export default function ContactPage() {
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
        <div className="min-h-screen bg-gray-50">
            <MainHeader user={user} showCategories={false} />
            <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
                <Link href="/" className="text-[#09BF44] hover:text-[#07a63a] text-sm font-bold mb-6 inline-block">
                    ← Back to home
                </Link>
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-6">
                    Contact Us
                </h1>
                <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-10 shadow-sm space-y-8">
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-2">Address</h2>
                        <p className="text-gray-600">
                            6th of October, 4 El Syahya El Shamlya El 3
                        </p>
                    </section>
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-2">Email</h2>
                        <a href="mailto:support@engezhaly.com" className="text-[#09BF44] hover:underline font-medium">
                            support@engezhaly.com
                        </a>
                    </section>
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-2">Phone</h2>
                        <a href="tel:+2001098611731" className="text-[#09BF44] hover:underline font-medium">
                            +201098611731 
                        </a>
                    </section>
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-3">Social Media</h2>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <a
                                href="https://www.instagram.com/engezhaly"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#09BF44] hover:underline font-medium"
                            >
                                Instagram
                            </a>
                            <a
                                href="https://www.tiktok.com/@engezhaly"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#09BF44] hover:underline font-medium"
                            >
                                TikTok
                            </a>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
