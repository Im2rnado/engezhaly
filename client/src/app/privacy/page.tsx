"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import MainHeader from "@/components/MainHeader";

export default function PrivacyPage() {
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
                    Privacy Policy
                </h1>
                <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-10 shadow-sm">
                    <p className="text-gray-600 leading-relaxed">
                        Engezhaly collects only the information needed to provide our service: name, email, phone, and payment details.
                    </p>
                    <p className="text-gray-600 leading-relaxed mt-4">
                        We never sell or share it with anyone. Data is stored securely and used only for your account, chats, and payments.
                    </p>
                </div>
            </div>
        </div>
    );
}
