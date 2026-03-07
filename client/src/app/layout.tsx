import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import GlobalNotifications from "@/components/GlobalNotifications";
import LandingFooterWrapper from "@/components/LandingFooterWrapper";
import { ModalProvider } from "@/context/ModalContext";
import PasswordGate from "@/components/PasswordGate";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://engezhaly.com";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: "Engezhaly | Freelance Marketplace Egypt",
  description: "The simplest way to hire freelancers or find work in Egypt. Secure, fast, and teenager-friendly.",
  icons: {
    icon: "/logos/logo-green.png",
    apple: "/logos/logo-green.png",
  },
  openGraph: {
    title: "Engezhaly | Freelance Marketplace Egypt",
    description: "The simplest way to hire freelancers or find work in Egypt. Secure, fast, and teenager-friendly.",
    url: APP_URL,
    siteName: "Engezhaly",
    images: [{ url: "/logos/logo-green.png", width: 512, height: 512, alt: "Engezhaly" }],
    locale: "en_EG",
  },
  twitter: {
    card: "summary_large_image",
    title: "Engezhaly | Freelance Marketplace Egypt",
    description: "The simplest way to hire freelancers or find work in Egypt.",
    images: ["/logos/logo-green.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased text-[#333333] bg-white`}>
        <ModalProvider>
          <PasswordGate>
            {children}
            <LandingFooterWrapper />
            <GlobalNotifications />
          </PasswordGate>
        </ModalProvider>
      </body>
    </html>
  );
}
