"use client";

import { ScrollText, X } from "lucide-react";

interface ChatRulesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CHAT_RULES = [
    "Be respectful and professional at all times.",
    "Do not share personal contact information (phone, email, social media) before completing a deal through Engezhaly.",
    "All payments must be processed through Engezhaly — do not accept or request payments outside the platform.",
    "Do not spam, harass, or send unsolicited messages.",
    "Keep conversations focused on work-related topics.",
    "Report any suspicious or inappropriate behavior to the support team.",
    "You can submit your work using: a link to your project, a Google Drive or Dropbox link, or by uploading the deliverable directly.",
    "Violations may result in account suspension or termination.",
];

export default function ChatRulesModal({ isOpen, onClose }: ChatRulesModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <ScrollText className="w-5 h-5 text-[#09BF44]" />
                        Chat Rules
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6">
                    <ul className="space-y-3">
                        {CHAT_RULES.map((rule, idx) => (
                            <li key={idx} className="flex gap-3 text-sm text-gray-700">
                                <span className="shrink-0 w-6 h-6 rounded-full bg-[#09BF44]/10 text-[#09BF44] flex items-center justify-center text-xs font-bold">
                                    {idx + 1}
                                </span>
                                <span>{rule}</span>
                            </li>
                        ))}
                    </ul>
                    <button
                        onClick={onClose}
                        className="mt-6 w-full py-3 rounded-xl bg-[#09BF44] text-white font-bold hover:bg-[#07a63a] transition-colors"
                    >
                        Got it
                    </button>
                </div>
            </div>
        </div>
    );
}
