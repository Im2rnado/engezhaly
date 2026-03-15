"use client";

import Image from "next/image";
import Link from "next/link";
import { Instagram } from "lucide-react";

export default function LandingFooter() {
    const year = new Date().getFullYear();

    return (
        <footer className="w-full border-t border-gray-200 bg-white pb-4 md:py-8">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 py-6 border-b border-gray-100">
                    <div className="flex justify-center order-first md:order-none">
                        <Link href="/" className="block">
                            <Image
                                src="/logos/logo-green.png"
                                alt="Engezhaly"
                                width={120}
                                height={28}
                                className="w-24 h-auto"
                            />
                        </Link>
                    </div>
                    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
                        <Link href="/terms" className="text-gray-600 hover:text-[#09BF44] transition-colors">Terms and Conditions</Link>
                        <Link href="/privacy" className="text-gray-600 hover:text-[#09BF44] transition-colors">Privacy Policy</Link>
                        <Link href="/refund" className="text-gray-600 hover:text-[#09BF44] transition-colors">Refund Policy</Link>
                        <Link href="/contact" className="text-gray-600 hover:text-[#09BF44] transition-colors">Contact</Link>
                        <a
                            href="https://www.instagram.com/engezhaly"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-[#09BF44] transition-colors flex items-center gap-1"
                            aria-label="Instagram"
                        >
                            <Instagram className="w-4 h-4" /> Instagram
                        </a>
                        <a
                            href="https://www.tiktok.com/@engezhaly"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-[#09BF44] transition-colors"
                            aria-label="TikTok"
                        >
                            TikTok
                        </a>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-0 items-center text-center md:text-left pt-4">
                    <div className="md:text-left">
                        <p className="text-sm text-gray-600">
                            © {year} Engezhaly.
                        </p>
                    </div>
                    <div className="hidden md:block" />
                    <div className="md:text-right">
                        <a
                            href="https://www.webicco.studio"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-gray-600 hover:text-[#09BF44] transition-colors"
                        >
                            Developed by Webicco
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
