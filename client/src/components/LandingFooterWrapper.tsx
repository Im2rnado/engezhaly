"use client";

import { usePathname } from "next/navigation";
import LandingFooter from "./LandingFooter";

const LANDING_PATHS = ["/", "/jobs", "/projects"];
const LANDING_PREFIX = "/freelancer/";

export default function LandingFooterWrapper() {
    const pathname = usePathname();

    const isLandingPage =
        LANDING_PATHS.includes(pathname) ||
        (pathname.startsWith(LANDING_PREFIX) && pathname !== LANDING_PREFIX);

    if (!isLandingPage) return null;

    return <LandingFooter />;
}
