import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Terms and Conditions | Engezhaly",
    description: "Terms and Conditions for Engezhaly freelance marketplace.",
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
    return children;
}
