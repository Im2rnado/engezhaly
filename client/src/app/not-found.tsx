"use client";

import Link from "next/link";
import MainHeader from "@/components/MainHeader";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50">
      <MainHeader user={null} showCategories={false} />
      <div className="max-w-[95%] md:max-w-[90%] mx-auto px-4 py-16 md:py-24 flex flex-col items-center justify-center text-center">
        <h1 className="text-6xl md:text-8xl font-black text-gray-200 mb-4">404</h1>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Page Not Found</h2>
        <p className="text-gray-500 mb-8 max-w-md">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="bg-[#09BF44] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#07a63a] transition-colors inline-block"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
}
