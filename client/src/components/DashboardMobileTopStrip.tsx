"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function DashboardMobileTopStrip() {
    const router = useRouter();

    return (
        <button
            onClick={() => router.push('/')}
            className="md:hidden block w-screen max-w-none ml-[calc(-50vw+50%)] -mt-3 sm:-mt-6 mb-4 bg-[#09BF44] rounded-none py-2 flex items-center justify-center"
            aria-label="Go to home"
        >
            <Image src="/logos/logo-white.png" alt="Engezhaly" width={140} height={32} className="h-4 w-auto" />
        </button>
    );
}
