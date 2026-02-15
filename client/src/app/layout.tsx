import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import GlobalNotifications from "@/components/GlobalNotifications";
import LandingFooterWrapper from "@/components/LandingFooterWrapper";
import { ModalProvider } from "@/context/ModalContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Engezhaly | Freelance Marketplace Egypt",
  description: "The simplest way to hire freelancers or find work in Egypt. Secure, fast, and teenager-friendly.",
  icons: {
    icon: '/favicon.ico',
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
          {children}
          <LandingFooterWrapper />
          <GlobalNotifications />
        </ModalProvider>
      </body>
    </html>
  );
}
