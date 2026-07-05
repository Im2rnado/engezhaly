import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import GlobalNotifications from "@/components/GlobalNotifications";
import LandingFooterWrapper from "@/components/LandingFooterWrapper";
import { ModalProvider } from "@/context/ModalContext";
import { LanguageProvider } from "@/context/LanguageContext";
import Script from "next/script";

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
        <LanguageProvider>
          <ModalProvider>
            {/* <PasswordGate> */}
              {children}
              <LandingFooterWrapper />
              <GlobalNotifications />
            {/* </PasswordGate> */}
          </ModalProvider>
        </LanguageProvider>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-M0QL2LTRSM"
          strategy="afterInteractive"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
            
              gtag('config', 'G-M0QL2LTRSM');
            `,
          }}
        />
        <Script
          id="tiktok-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function (w, d, t) {
                w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(
              var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script")
              ;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};

                ttq.load('D7ORAH3C77UDOFSG972G');
                ttq.page();
              }(window, document, 'ttq');
            `,
          }}
        />
      </body>
    </html>
  );
}
