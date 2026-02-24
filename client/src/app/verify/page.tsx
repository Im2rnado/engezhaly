"use client";

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import Link from 'next/link';

function VerifyPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid verification link');
            return;
        }
        api.auth.verify(token)
            .then(() => {
                setStatus('success');
                setMessage('Your email has been verified. You can now log in.');
                setTimeout(() => router.push('/'), 2000);
            })
            .catch((err: Error) => {
                setStatus('error');
                setMessage(err.message || 'Verification failed');
            });
    }, [token, router]);

    return (
        <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <Link href="/" className="mb-8">
                <Image src="/logos/logo-green.png" alt="Engezhaly" width={140} height={32} className="h-8 w-auto" />
            </Link>
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
                {status === 'loading' && (
                    <>
                        <Loader2 className="w-12 h-12 animate-spin text-[#09BF44] mx-auto mb-4" />
                        <h1 className="text-xl font-bold text-gray-900 mb-2">Verifying your email...</h1>
                        <p className="text-gray-500">Please wait.</p>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <CheckCircle className="w-16 h-16 text-[#09BF44] mx-auto mb-4" />
                        <h1 className="text-xl font-bold text-gray-900 mb-2">Email Verified!</h1>
                        <p className="text-gray-600 mb-4">{message}</p>
                        <p className="text-sm text-gray-500">Redirecting you to the home page...</p>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h1 className="text-xl font-bold text-gray-900 mb-2">Verification Failed</h1>
                        <p className="text-gray-600 mb-6">{message}</p>
                        <Link href="/" className="text-[#09BF44] font-bold hover:underline">
                            Return to Home
                        </Link>
                    </>
                )}
            </div>
        </main>
    );
}

export default function VerifyPage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <Loader2 className="w-12 h-12 animate-spin text-[#09BF44]" />
            </main>
        }>
            <VerifyPageContent />
        </Suspense>
    );
}
