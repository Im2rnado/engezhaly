import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Refund Policy | Engezhaly",
    description: "Refund Policy for Engezhaly freelance marketplace.",
};

export default function RefundLayout({ children }: { children: React.ReactNode }) {
    return children;
}
