"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function DashboardMobileTopStrip({ flush = false }: { flush?: boolean }) {
    const router = useRouter();

    return (
        <button
            onClick={() => router.push('/')}
            className={`md:hidden w-screen max-w-none bg-[#09BF44] rounded-none py-2 items-center justify-center ${
                flush ? 'flex m-0' : 'flex ml-[calc(-50vw+50%)] -mt-3 sm:-mt-6 mb-4'
            }`}
            aria-label="Go to home"
        >
            <Image src="/logos/logo-white.png" alt="Engezhaly" width={140} height={32} className="h-4 w-auto" />
        </button>
    );
}
