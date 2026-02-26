"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const STORAGE_KEY = "engezhaly_site_access";
const PASSWORD = process.env.NEXT_PUBLIC_SITE_PASSWORD || "EngezhalyxWebicco2026";

export default function PasswordGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!PASSWORD) {
      setTimeout(() => setUnlocked(true), 0);
      return;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === PASSWORD) {
      setTimeout(() => setUnlocked(true), 0);
    }
  }, [mounted]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password === PASSWORD) {
      localStorage.setItem(STORAGE_KEY, password);
      setUnlocked(true);
    } else {
      setError("Incorrect password");
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-linear-to-br from-white to-[#09BF44] flex items-center justify-center">
        <div className="animate-pulse text-white/80">Loading...</div>
      </div>
    );
  }

  if (!PASSWORD || unlocked) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-white to-[#09BF44]  flex flex-col items-center justify-center px-4">
      {/* Frosted glass card - Apple-style */}
      <div className="flex flex-col items-center max-w-sm w-full p-8 md:p-10 pt-0 md:pt-0 rounded-3xl bg-white/20 backdrop-blur-2xl border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
        <Image
          src="/logos/logo-green.png"
          alt="Engezhaly"
          width={300}
          height={0}
          className="w-auto drop-shadow-sm"
          priority
        />
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            placeholder="Enter password"
            className="w-full px-4 py-3.5 rounded-2xl border border-white/40 bg-white/25 backdrop-blur-md text-gray-900 placeholder-gray-600 outline-none focus:border-white/80 focus:ring-2 focus:ring-white/40 font-medium transition-all"
            autoFocus
          />
          {error && (
            <p className="text-red-500 text-sm font-medium text-center drop-shadow-sm">{error}</p>
          )}
          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-white/90 backdrop-blur-sm text-[#09BF44] font-bold hover:bg-white transition-all shadow-lg hover:shadow-xl border border-white/40"
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  );
}
