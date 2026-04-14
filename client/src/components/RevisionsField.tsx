"use client";

import type { ReactNode } from "react";
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
    /** When switching to fixed and the field is empty, prefill with this (default "1"). */
    defaultFixedRevisions?: string;
}

const WRAPPER: Record<RevisionsFieldVariant, string> = {
    default:
        "rounded-xl border-2 border-gray-200 bg-gray-50 focus-within:border-[#09BF44] focus-within:ring-2 focus-within:ring-[#09BF44]/15 transition-all",
    compact:
        "rounded-lg border border-gray-200 bg-gray-50 focus-within:border-[#09BF44] transition-all",
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

const SELECT_PAD: Record<RevisionsFieldVariant, string> = {
    default: "min-w-[8.75rem] px-3 pr-2",
    compact: "min-w-[7rem] px-2 pr-1",
    jobs: "min-w-[8.75rem] px-3 pr-2",
    auth: "min-w-[7.25rem] px-2 pr-1"
};

/**
 * Single control: type a number for fixed revisions, or choose Unlimited from the dropdown on the right.
 * Backend: revisionsUnlimited + numeric revisions (0 when unlimited).
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
    const handleMode = (nextUnlimited: boolean) => {
        onUnlimitedChange(nextUnlimited);
        if (nextUnlimited) {
            onRevisionsChange("0");
        } else {
            const t = revisions.trim();
            if (!t || t === "0") onRevisionsChange(defaultFixedRevisions);
        }
    };

    const wrap = WRAPPER[variant];
    const pad = INPUT_PAD[variant];
    const labelCls = LABEL_CLASS[variant];
    const selPad = SELECT_PAD[variant];

    const placeholder =
        variant === "compact" || variant === "auth" ? "Number" : "Enter number (e.g. 3)";

    return (
        <div className={className}>
            {label ? <div className={labelCls}>{label}</div> : null}
            <div className={`flex ${wrap} ${disabled ? "opacity-60 pointer-events-none" : ""}`}>
                {!unlimited ? (
                    <input
                        type="number"
                        min={0}
                        step={1}
                        required={required && !unlimited}
                        disabled={disabled}
                        value={revisions}
                        onChange={(e) => onRevisionsChange(e.target.value)}
                        placeholder={placeholder}
                        className={`flex-1 min-w-0 ${pad} bg-gray-50 border-0 outline-none text-gray-900 font-bold placeholder:font-medium placeholder:text-gray-400 text-sm`}
                    />
                ) : (
                    <div className={`flex-1 min-w-0 ${pad} flex items-center font-bold text-gray-700 text-sm`}>Unlimited</div>
                )}
                <div className={`relative flex min-h-[2.75rem] shrink-0 items-stretch border-l border-gray-200 bg-white ${selPad}`}>
                    <select
                        value={unlimited ? "unlimited" : "fixed"}
                        onChange={(e) => handleMode(e.target.value === "unlimited")}
                        disabled={disabled}
                        aria-label="Revision type: fixed count or unlimited"
                        className="h-full min-h-[2.75rem] w-full min-w-0 cursor-pointer appearance-none bg-transparent py-2 pl-1 pr-7 text-[10px] font-black uppercase tracking-wide text-gray-700 outline-none"
                    >
                        <option value="fixed">Fixed</option>
                        <option value="unlimited">Unlimited</option>
                    </select>
                    <ChevronDown
                        className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 shrink-0 -translate-y-1/2 text-gray-500"
                        aria-hidden
                    />
                </div>
            </div>
        </div>
    );
}
