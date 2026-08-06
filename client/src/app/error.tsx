"use client";

import { useEffect } from 'react';
import { reportClientError } from '@/lib/errorReporter';

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportClientError({
      source: 'frontend',
      severity: 'critical',
      name: error.name || 'ReactError',
      message: error.message || 'The page failed to render',
      stack: error.stack
    });
  }, [error]);

  return (
    <main className="min-h-[70vh] flex items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-black text-gray-900">Something went wrong</h1>
        <p className="mt-3 text-gray-500">The issue was reported automatically. Please try again.</p>
        <button onClick={reset} className="mt-6 rounded-xl bg-[#09BF44] px-6 py-3 font-bold text-white hover:bg-[#08a83c]">
          Try again
        </button>
      </div>
    </main>
  );
}
