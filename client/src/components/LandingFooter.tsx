"use client";

import Image from "next/image";
import Link from "next/link";

export default function LandingFooter() {
    const year = new Date().getFullYear();

    return (
        <footer className="w-full border-t border-gray-200 bg-white pb-4 md:py-8">
            <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-0 items-center text-center md:text-left">
                <div className="md:text-left">
                    <p className="text-sm text-gray-600">
                        © {year} Engezhaly.
                    </p>
                </div>
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
        </footer>
    );
}
