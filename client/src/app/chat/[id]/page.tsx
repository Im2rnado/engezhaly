"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

/**
 * Redirects /chat/[id] to /chat?conversation=[id]
 * Allows links like /chat/userId or /chat/conversationId to work.
 */
export default function ChatRedirectPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    useEffect(() => {
        if (id) {
            router.replace(`/chat?conversation=${encodeURIComponent(id)}`);
        } else {
            router.replace("/chat");
        }
    }, [id, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#09BF44]" />
        </div>
    );
}
