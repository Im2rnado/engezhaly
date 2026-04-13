"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import MainHeader from "@/components/MainHeader";
import { MapPin, Mail, Phone, Instagram, Send, Loader2, MessageSquare } from "lucide-react";
import { api } from "@/lib/api";

export default function ContactPage() {
    const [user, setUser] = useState<any>(null);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (stored) {
            queueMicrotask(() => {
                try {
                    const u = JSON.parse(stored);
                    setUser(u);
                    if (u?.firstName || u?.lastName) {
                        setName(`${u.firstName || ""} ${u.lastName || ""}`.trim());
                    }
                    if (u?.email) setEmail(u.email);
                } catch (e) {
                    console.error("Failed to parse user from localStorage", e);
                }
            });
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        setFormSuccess(null);
        setSubmitting(true);
        try {
            const res = await api.contact.submit({
                name: name.trim(),
                email: email.trim(),
                subject: subject.trim(),
                message: message.trim()
            });
            setFormSuccess(res.msg || "Message sent.");
            setSubject("");
            setMessage("");
        } catch (err: any) {
            setFormError(err?.message || "Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <MainHeader user={user} showCategories={false} />

            {/* Top gradient band */}
            <div className="relative overflow-hidden bg-linear-to-r from-[#09BF44] via-[#07a63a] to-emerald-800 text-white">
                <div
                    className="absolute inset-0 opacity-30"
                    style={{
                        backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.35) 0%, transparent 45%),
              radial-gradient(circle at 80% 30%, rgba(255,255,255,0.2) 0%, transparent 40%)`
                    }}
                    aria-hidden
                />
                <div className="relative max-w-6xl mx-auto px-4 py-14 md:py-20">
                    <Link
                        href="/"
                        className="inline-flex text-sm font-bold text-white/90 hover:text-white mb-6 transition-colors"
                    >
                        ← Back to home
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-bold uppercase tracking-wider mb-4">
                                <MessageSquare className="w-3.5 h-3.5" />
                                We&apos;re here to help
                            </div>
                            <h1 className="text-3xl md:text-5xl font-black tracking-tight">Contact us</h1>
                            <p className="mt-3 text-base md:text-lg text-white/90 max-w-xl leading-relaxed">
                                Questions, feedback, or support — send a message and the Engezhaly team will reply by email.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-10 md:py-14 -mt-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-10">
                    {/* Form */}
                    <div className="lg:col-span-3">
                        <div className="bg-white backdrop-blur-md rounded-3xl border border-emerald-100 shadow-xl shadow-emerald-900/5 p-6 md:p-8">
                            <h2 className="text-xl font-black text-gray-900 mb-1">Send a message</h2>
                            <p className="text-sm text-gray-600 mb-6">
                                Delivered to{" "}
                                <a href="mailto:support@engezhaly.com" className="font-bold text-[#09BF44] hover:underline">
                                    support@engezhaly.com
                                </a>
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="contact-name" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                                            Name
                                        </label>
                                        <input
                                            id="contact-name"
                                            type="text"
                                            required
                                            maxLength={120}
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50/80 text-gray-900 placeholder:text-gray-400 focus:border-[#09BF44] focus:bg-white focus:ring-0 outline-none transition-all"
                                            placeholder="Your name"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="contact-email" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                                            Email
                                        </label>
                                        <input
                                            id="contact-email"
                                            type="email"
                                            required
                                            maxLength={254}
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50/80 text-gray-900 placeholder:text-gray-400 focus:border-[#09BF44] focus:bg-white focus:ring-0 outline-none transition-all"
                                            placeholder="you@example.com"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="contact-subject" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                                        Subject
                                    </label>
                                    <input
                                        id="contact-subject"
                                        type="text"
                                        required
                                        maxLength={200}
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50/80 text-gray-900 placeholder:text-gray-400 focus:border-[#09BF44] focus:bg-white focus:ring-0 outline-none transition-all"
                                        placeholder="What is this about?"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="contact-message" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                                        Message
                                    </label>
                                    <textarea
                                        id="contact-message"
                                        required
                                        rows={6}
                                        maxLength={8000}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50/80 text-gray-900 placeholder:text-gray-400 focus:border-[#09BF44] focus:bg-white focus:ring-0 outline-none transition-all resize-y min-h-[140px]"
                                        placeholder="Tell us how we can help…"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">{message.length} / 8000</p>
                                </div>

                                {formError && (
                                    <div className="rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm font-medium px-4 py-3">
                                        {formError}
                                    </div>
                                )}
                                {formSuccess && (
                                    <div className="rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm font-medium px-4 py-3">
                                        {formSuccess}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white bg-linear-to-r from-[#09BF44] to-emerald-600 hover:from-[#07a63a] hover:to-emerald-700 shadow-lg shadow-[#09BF44]/25 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Sending…
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5" />
                                            Send message
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Sidebar cards */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="rounded-2xl bg-white p-5 shadow-md shadow-emerald-900/5">
                            <div className="flex items-start gap-3">
                                <div className="p-2.5 rounded-xl bg-[#09BF44]/10 text-[#09BF44] shrink-0">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Address</h3>
                                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                                        6th of October, 4 El Syahya El Shamlya El 3
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl bg-white border border-emerald-200/60 p-5 shadow-md">
                            <div className="flex items-start gap-3">
                                <div className="p-2.5 rounded-xl bg-[#09BF44] text-white shrink-0">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Email</h3>
                                    <a
                                        href="mailto:support@engezhaly.com"
                                        className="text-sm font-bold text-[#09BF44] hover:underline mt-1 inline-block"
                                    >
                                        support@engezhaly.com
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl bg-white border border-emerald-100/80 p-5 shadow-md shadow-emerald-900/5">
                            <div className="flex items-start gap-3">
                                <div className="p-2.5 rounded-xl bg-[#09BF44]/10 text-[#09BF44] shrink-0">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Phone</h3>
                                    <a href="tel:+2001098611731" className="text-sm font-bold text-[#09BF44] hover:underline mt-1 inline-block">
                                        +20 109 861 1731
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border-2 border-dashed border-[#09BF44]/30 bg-white p-5">
                            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <Instagram className="w-5 h-5 text-[#09BF44]" />
                                Social
                            </h3>
                            <div className="flex flex-col gap-2">
                                <a
                                    href="https://www.instagram.com/engezhaly"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-bold text-[#09BF44] hover:underline"
                                >
                                    Instagram
                                </a>
                                <a
                                    href="https://www.tiktok.com/@engezhaly"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-bold text-[#09BF44] hover:underline"
                                >
                                    TikTok
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
