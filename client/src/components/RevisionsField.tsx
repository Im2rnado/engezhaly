"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export type RevisionsFieldVariant = "default" | "compact" | "jobs" | "auth";

export interface RevisionsFieldProps {
    unlimited: boolean;
    revisions: string;
    onUnlimitedChange: (unlimited: boolean) => void;
    onRevisionsChange: (revisions: string) => void;
    label?: ReactNode;
    required?: boolean;
    disabled?: boolean;
    variant?: RevisionsFieldVariant;
    className?: string;
    defaultFixedRevisions?: string;
}

const WRAPPER: Record<RevisionsFieldVariant, string> = {
    default:
        "rounded-xl border-2 border-gray-200 bg-gray-50 focus-within:border-[#09BF44] focus-within:ring-2 focus-within:ring-[#09BF44]/15 transition-all",
    compact: "rounded-lg border border-gray-200 bg-gray-50 focus-within:border-[#09BF44] transition-all",
    jobs: "rounded-xl border-2 border-transparent bg-gray-50 focus-within:border-[#09BF44] transition-all",
    auth: "rounded-lg border border-gray-200 bg-gray-50 focus-within:border-[#09BF44] transition-all"
};

const INPUT_PAD: Record<RevisionsFieldVariant, string> = {
    default: "px-4 py-3",
    compact: "p-2",
    jobs: "p-3",
    auth: "p-2"
};

const LABEL_CLASS: Record<RevisionsFieldVariant, string> = {
    default: "block text-sm font-bold text-gray-900 mb-2",
    compact: "text-xs font-bold text-gray-500 mb-1",
    jobs: "block text-sm font-bold text-gray-700 mb-2",
    auth: "text-xs font-bold text-gray-500 mb-1"
};

/**
 * Single number input; focusing or clicking opens a menu below to choose Unlimited.
 */
export default function RevisionsField({
    unlimited,
    revisions,
    onUnlimitedChange,
    onRevisionsChange,
    label,
    required = false,
    disabled = false,
    variant = "default",
    className = "",
    defaultFixedRevisions = "1"
}: RevisionsFieldProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!menuOpen) return;
        const close = (e: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) setMenuOpen(false);
        };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, [menuOpen]);

    const wrap = WRAPPER[variant];
    const pad = INPUT_PAD[variant];
    const labelCls = LABEL_CLASS[variant];
    const placeholder =
        variant === "compact" || variant === "auth" ? "Number" : "Enter number (e.g. 3)";
    const minH = variant === "compact" || variant === "auth" ? "min-h-[2.75rem]" : "min-h-[2.75rem]";

    const pickUnlimited = () => {
        onUnlimitedChange(true);
        onRevisionsChange("0");
        setMenuOpen(false);
    };

    const pickFixed = () => {
        onUnlimitedChange(false);
        const t = revisions.trim();
        if (!t || t === "0") onRevisionsChange(defaultFixedRevisions);
        setMenuOpen(false);
    };

    return (
        <div className={className}>
            {label ? <div className={labelCls}>{label}</div> : null}
            <div ref={rootRef} className={`relative ${disabled ? "opacity-60 pointer-events-none" : ""}`}>
                <div className={`flex items-center ${wrap} ${minH}`}>
                    <input
                        type={unlimited ? "text" : "number"}
                        min={unlimited ? undefined : 0}
                        step={1}
                        required={required && !unlimited}
                        disabled={disabled}
                        readOnly={unlimited}
                        value={unlimited ? "Unlimited" : revisions}
                        onChange={(e) => !unlimited && onRevisionsChange(e.target.value)}
                        onFocus={() => !disabled && setMenuOpen(true)}
                        onClick={() => !disabled && setMenuOpen(true)}
                        placeholder={unlimited ? "Unlimited" : placeholder}
                        aria-expanded={menuOpen}
                        aria-haspopup="listbox"
                        className={`min-w-0 flex-1 rounded-xl ${pad} bg-transparent border-0 outline-none text-gray-900 font-bold placeholder:font-medium placeholder:text-gray-400 text-sm cursor-pointer`}
                    />
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={() => setMenuOpen((o) => !o)}
                        className="shrink-0 px-3 py-2 text-gray-500 hover:text-gray-800"
                        aria-label="Open revisions options"
                    >
                        <ChevronDown className={`w-5 h-5 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
                    </button>
                </div>
                {menuOpen && !disabled && (
                    <ul
                        role="listbox"
                        className="absolute z-50 left-0 right-0 top-full mt-1 rounded-xl border-2 border-gray-200 bg-white shadow-lg py-1 overflow-hidden"
                    >
                        {!unlimited && (
                            <li>
                                <button
                                    type="button"
                                    role="option"
                                    className="w-full text-left px-4 py-2.5 text-sm font-bold text-gray-900 hover:bg-gray-50"
                                    onClick={pickUnlimited}
                                >
                                    Unlimited
                                </button>
                            </li>
                        )}
                        {unlimited && (
                            <li>
                                <button
                                    type="button"
                                    role="option"
                                    className="w-full text-left px-4 py-2.5 text-sm font-bold text-gray-900 hover:bg-gray-50"
                                    onClick={pickFixed}
                                >
                                    Fixed number…
                                </button>
                            </li>
                        )}
                    </ul>
                )}
            </div>
        </div>
    );
}
