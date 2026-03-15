import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Privacy Policy | Engezhaly",
    description: "Privacy Policy for Engezhaly freelance marketplace.",
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
    return children;
}
