import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Contact | Engezhaly",
    description: "Contact Engezhaly for support and inquiries.",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
    return children;
}
