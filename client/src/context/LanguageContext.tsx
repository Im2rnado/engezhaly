"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { translations, type Lang } from "@/lib/translations";

// ─── Context Shape ───────────────────────────────────────────────────────────

interface LanguageContextValue {
  lang: Lang;
  toggleLang: () => void;
  t: typeof translations.en;
  isRTL: boolean;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined
);

// ─── Provider ────────────────────────────────────────────────────────────────

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  const [mounted, setMounted] = useState(false);

  // Load persisted preference after hydration
  useEffect(() => {
    const saved = (localStorage.getItem("engezhaly_lang") as Lang) || "en";
    setLang(saved);
    setMounted(true);
  }, []);

  // Apply RTL direction + html lang attribute whenever language changes
  useEffect(() => {
    if (!mounted) return;
    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang, mounted]);

  const toggleLang = useCallback(() => {
    setLang((prev) => {
      const next: Lang = prev === "en" ? "ar" : "en";
      localStorage.setItem("engezhaly_lang", next);
      return next;
    });
  }, []);

  const t = translations[lang];
  const isRTL = lang === "ar";

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used inside <LanguageProvider>");
  }
  return ctx;
}
