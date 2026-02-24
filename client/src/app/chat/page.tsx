import { Suspense } from 'react';
import ChatPageClient from './ChatPageClient';

export default function ChatPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#09BF44]"></div>
                </div>
            }
        >
            <ChatPageClient />
        </Suspense>
    );
}
