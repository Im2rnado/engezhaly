"use client";

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { api } from '@/lib/api';
import { useModal } from '@/context/ModalContext';

function ResetPasswordPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showModal } = useModal();
    const token = searchParams.get('token');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!token) {
            setError('Invalid reset link');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setLoading(true);
        try {
            await api.auth.resetPassword(token, password);
            showModal({
                title: 'Password Reset',
                message: 'Your password has been reset. You can now log in.',
                type: 'success',
                onConfirm: () => router.push('/')
            });
        } catch (err: any) {
            setError(err.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <Link href="/">
                    <Image src="/logos/logo-green.png" alt="Engezhaly" width={140} height={32} className="h-24 w-auto" />
                </Link>
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid Link</h1>
                    <p className="text-gray-600 mb-4">This password reset link is invalid or has expired.</p>
                    <Link href="/" className="text-[#09BF44] font-bold hover:underline">Return to Home</Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <Link href="/">
                <Image src="/logos/logo-green.png" alt="Engezhaly" width={140} height={32} className="h-24 w-auto" />
            </Link>
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
                <h1 className="text-xl font-bold text-gray-900 mb-2 text-center">Reset Password</h1>
                <p className="text-gray-500 text-sm text-center mb-6">Enter your new password below.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">New Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full p-3 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#09BF44] focus:border-[#09BF44] outline-none text-gray-900"
                                placeholder="At least 6 characters"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Confirm Password</label>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#09BF44] focus:border-[#09BF44] outline-none text-gray-900"
                            placeholder="Confirm your password"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#09BF44] hover:bg-[#07a63a] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                        Reset Password
                    </button>
                </form>
                <p className="text-center text-sm text-gray-500 mt-4">
                    <Link href="/" className="text-[#09BF44] hover:underline">Back to Home</Link>
                </p>
            </div>
        </main>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <Loader2 className="w-12 h-12 animate-spin text-[#09BF44]" />
            </main>
        }>
            <ResetPasswordPageContent />
        </Suspense>
    );
}
