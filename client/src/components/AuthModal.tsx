"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { X, User, Briefcase, ChevronRight, Loader2, Eye, EyeOff, Upload, X as XIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { useModal } from '@/context/ModalContext';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialStep?: 'role-selection' | 'client-auth' | 'freelancer-step-1' | 'login' | 'forgot-password';
}

export default function AuthModal({ isOpen, onClose, initialStep = 'role-selection' }: AuthModalProps) {
    const router = useRouter();
    const { showModal } = useModal();
    const [step, setStep] = useState<'role-selection' | 'client-auth' | 'freelancer-step-1' | 'login' | 'forgot-password'>('role-selection');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');

    useEffect(() => {
        if (isOpen && initialStep) {
            setStep(initialStep);
        }
    }, [isOpen, initialStep]);

    // Form States
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phoneNumber: '',
        age: '',
        username: '',
        identifier: '', // for login
        businessType: 'personal' // default
    });
    const [profilePicture, setProfilePicture] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setError('');
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                password: '',
                phoneNumber: '',
                age: '',
                username: '',
                identifier: '',
                businessType: 'personal'
            });
            setForgotPasswordEmail('');
            setShowPassword(false);
            setProfilePicture(null);
        }
    }, [isOpen]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setError('Image size must be less than 5MB');
                return;
            }
            if (!file.type.startsWith('image/')) {
                setError('Please upload an image file');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePicture(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeProfilePicture = () => {
        setProfilePicture(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const data = await api.auth.login({
                identifier: formData.identifier,
                password: formData.password
            });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            onClose();
            showModal({
                title: 'Login Successful',
                message: `Welcome back, ${data.user.firstName}!`,
                type: 'success',
                onConfirm: () => {
                    if (data.user.role === 'client') {
                        router.push('/dashboard/client');
                    } else if (data.user.role === 'freelancer') {
                        // Check if onboarding is complete
                        if (data.user.freelancerProfile?.status === 'pending' && !data.user.freelancerProfile?.category) {
                            router.push('/onboarding');
                        } else {
                            router.push('/dashboard/freelancer');
                        }
                    } else if (data.user.role === 'admin') {
                        router.push('/admin');
                    }
                }
            });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClientSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const data = await api.auth.register({
                firstName: formData.firstName,
                lastName: formData.lastName,
                username: formData.username,
                email: formData.email,
                password: formData.password,
                role: 'client',
                businessType: formData.businessType
            });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            onClose();
            showModal({
                title: 'Account Created',
                message: 'Your client account has been created successfully. Redirecting to dashboard...',
                type: 'success',
                onConfirm: () => router.push('/dashboard/client')
            });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFreelancerStep1Submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const registerData: any = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                username: formData.username,
                email: formData.email,
                password: formData.password,
                role: 'freelancer',
                phoneNumber: formData.phoneNumber,
                age: formData.age
            };

            // Add profile picture if uploaded
            if (profilePicture) {
                registerData.profilePicture = profilePicture;
            }

            const data = await api.auth.register(registerData);
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            onClose();
            showModal({
                title: 'Account Created',
                message: 'Your freelancer account has been created. Please complete your profile to start selling.',
                type: 'success',
                onConfirm: () => router.push('/onboarding')
            });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!forgotPasswordEmail) {
            setError('Please enter your email address');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await api.auth.forgotPassword(forgotPasswordEmail);
            showModal({
                title: 'Reset Link Sent',
                message: 'If an account exists with this email, a password reset link has been sent. Please check your inbox.',
                type: 'success',
                onConfirm: () => {
                    setStep('login');
                    setForgotPasswordEmail('');
                }
            });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <X className="w-6 h-6 text-gray-500" />
                </button>

                {step === 'role-selection' && (
                    <div className="text-center py-8">
                        <div className="flex items-center justify-center gap-3">
                            <h2 className="text-4xl font-black text-gray-900">Join</h2>
                            <Image
                                src="/logos/logo-green.png"
                                alt="Engezhaly"
                                width={240}
                                height={66}
                                className="h-20 w-auto"
                                priority
                            />
                        </div>
                        <p className="text-xl text-gray-600 mb-12">How do you want to use the platform?</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <button
                                onClick={() => { setStep('client-auth'); }}
                                className="group flex flex-col items-center justify-center p-10 border-2 border-gray-100 rounded-3xl hover:border-[#09BF44] hover:bg-green-50/50 transition-all duration-300"
                            >
                                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-[#09BF44] transition-colors">
                                    <User className="w-12 h-12 text-gray-600 group-hover:text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900">I&apos;m Hiring</h3>
                                <p className="text-gray-500 mt-2 font-medium">Find talent & get work done</p>
                            </button>

                            <button
                                onClick={() => { setStep('freelancer-step-1'); }}
                                className="group flex flex-col items-center justify-center p-10 border-2 border-gray-100 rounded-3xl hover:border-[#09BF44] hover:bg-green-50/50 transition-all duration-300"
                            >
                                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-[#09BF44] transition-colors">
                                    <Briefcase className="w-12 h-12 text-gray-600 group-hover:text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900">I Want to Freelance</h3>
                                <p className="text-gray-500 mt-2 font-medium">Sell your services & earn</p>
                            </button>
                        </div>

                        <div className="mt-8">
                            <p className="text-gray-600">
                                Already have an account?{' '}
                                <button onClick={() => setStep('login')} className="text-[#09BF44] font-bold hover:underline">
                                    Log In
                                </button>
                            </p>
                        </div>
                    </div>
                )}

                {step === 'login' && (
                    <div className="py-4">
                        <div className="flex items-center justify-center gap-3 mb-8">
                            <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
                        </div>
                        <p className="text-center text-gray-600 mb-8">Sign in to your account to continue</p>

                        <form onSubmit={handleLoginSubmit} className="space-y-5">
                            <div>
                                <input
                                    name="identifier"
                                    placeholder="Email, Username, or Phone"
                                    required
                                    value={formData.identifier}
                                    onChange={handleChange}
                                    className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400"
                                />
                            </div>
                            <div className="relative">
                                <input
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all font-medium pr-12 text-gray-900 placeholder:text-gray-400"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={() => setStep('forgot-password')}
                                    className="text-sm text-[#09BF44] font-bold hover:underline"
                                >
                                    Forgot Password?
                                </button>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    {error}
                                </div>
                            )}

                            <button disabled={loading} type="submit" className="w-full bg-[#09BF44] hover:bg-[#07a63a] text-white font-bold text-lg p-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg">
                                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                                {loading ? 'Signing in...' : 'Sign In'}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-gray-600">
                                Don&apos;t have an account?{' '}
                                <button onClick={() => setStep('role-selection')} className="text-[#09BF44] font-bold hover:underline">
                                    Sign Up
                                </button>
                            </p>
                        </div>
                    </div>
                )}

                {step === 'forgot-password' && (
                    <div className="py-4">
                        <div className="flex justify-center mb-6">
                            <Image
                                src="/logos/logo-green.png"
                                alt="Engezhaly"
                                width={200}
                                height={55}
                                className="h-20 w-auto"
                                priority
                            />
                        </div>
                        <h2 className="text-3xl font-bold text-center mb-2">Forgot Password?</h2>
                        <p className="text-center text-gray-600 mb-8">Enter your email address and we&apos;ll send you a link to reset your password.</p>

                        <form onSubmit={handleForgotPassword} className="space-y-5">
                            <input
                                type="email"
                                placeholder="Email Address"
                                required
                                value={forgotPasswordEmail}
                                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                                className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400"
                            />

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    {error}
                                </div>
                            )}

                            <button disabled={loading} type="submit" className="w-full bg-[#09BF44] hover:bg-[#07a63a] text-white font-bold text-lg p-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg">
                                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                                {loading ? 'Sending...' : 'Send Reset Link'}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <button onClick={() => { setStep('login'); setError(''); setForgotPasswordEmail(''); }} className="text-gray-600 hover:text-gray-900 font-medium">
                                ← Back to Sign In
                            </button>
                        </div>
                    </div>
                )}

                {step === 'client-auth' && (
                    <div className="py-4">
                        <div className="flex items-center justify-center gap-3">
                            <h2 className="text-3xl font-bold text-gray-900">Join</h2>
                            <Image
                                src="/logos/logo-green.png"
                                alt="Engezhaly"
                                width={200}
                                height={55}
                                className="h-20 w-auto"
                                priority
                            />
                        </div>
                        <p className="text-center text-gray-600 mb-8">Create your client account to start posting jobs and hiring freelancers.</p>

                        <form onSubmit={handleClientSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <input name="firstName" placeholder="First Name" required onChange={handleChange} className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400" />
                                <input name="lastName" placeholder="Last Name" required onChange={handleChange} className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400" />
                            </div>
                            <input name="username" placeholder="Username" required onChange={handleChange} className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400" />
                            <input name="email" type="email" placeholder="Email Address" required onChange={handleChange} className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400" />
                            <div className="grid grid-cols-2 gap-4">
                                <input name="password" type="password" placeholder="Password" required onChange={handleChange} className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400" />
                                <select name="businessType" onChange={handleChange} className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all font-medium text-gray-900">
                                    <option value="personal">Personal Project</option>
                                    <option value="company">Company</option>
                                </select>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    {error}
                                </div>
                            )}

                            <button disabled={loading} type="submit" className="w-full bg-[#09BF44] hover:bg-[#07a63a] text-white font-bold text-lg p-4 rounded-xl transition-all flex items-center justify-center gap-2">
                                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                                Create Account
                            </button>
                        </form>
                        <div className="mt-4 text-center">
                            <p className="text-gray-600">
                                Already have an account?{' '}
                                <button onClick={() => setStep('login')} className="text-[#09BF44] font-bold hover:underline">
                                    Log In
                                </button>
                            </p>
                        </div>
                        <button onClick={() => setStep('role-selection')} className="mt-6 text-gray-500 hover:text-gray-900 font-medium">Back to Selection</button>
                    </div>
                )}

                {step === 'freelancer-step-1' && (
                    <div className="py-4">
                        <div className="flex items-center justify-center gap-3">
                            <h2 className="text-3xl font-bold text-gray-900">Join</h2>
                            <Image
                                src="/logos/logo-green.png"
                                alt="Engezhaly"
                                width={200}
                                height={55}
                                className="h-20 w-auto"
                                priority
                            />
                        </div>
                        <div className="flex items-center justify-center gap-2 mb-6 text-sm font-bold text-gray-400 uppercase tracking-wider">
                            <span className="text-[#09BF44]">Step 1</span>
                            <span>/</span>
                            <span>Step 5</span>
                        </div>
                        <h3 className="text-2xl font-bold text-center mb-2">Personal Information</h3>
                        <p className="text-center text-gray-600 mb-8">Let&apos;s get your profile started.</p>

                        <form onSubmit={handleFreelancerStep1Submit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <input name="firstName" placeholder="First Name" required onChange={handleChange} className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400" />
                                <input name="lastName" placeholder="Last Name" required onChange={handleChange} className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400" />
                            </div>
                            <input name="username" placeholder="Username" required onChange={handleChange} className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400" />
                            <input name="email" type="email" placeholder="Email Address" required onChange={handleChange} className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400" />
                            <div className="grid grid-cols-2 gap-4">
                                <input name="age" type="number" placeholder="Age" required onChange={handleChange} className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400" />
                                <input name="phoneNumber" placeholder="Phone Number (Hidden)" required onChange={handleChange} className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400" />
                            </div>
                            <input name="password" type="password" placeholder="Password" required onChange={handleChange} className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400" />

                            {/* Profile Picture Upload */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Profile Picture (Optional)</label>
                                {profilePicture ? (
                                    <div className="relative">
                                        <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-[#09BF44]">
                                            <Image
                                                src={profilePicture}
                                                alt="Profile preview"
                                                width={128}
                                                height={128}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={removeProfilePicture}
                                            className="absolute top-0 right-1/2 translate-x-16 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                        >
                                            <XIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-6 border-2 border-dashed border-gray-200 rounded-xl text-center text-gray-500 hover:border-[#09BF44] hover:bg-green-50 transition-colors cursor-pointer"
                                    >
                                        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                        <p className="text-sm font-bold">Click to upload profile photo</p>
                                        <p className="text-xs text-gray-400 mt-1">Max 5MB</p>
                                    </div>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    {error}
                                </div>
                            )}

                            <button disabled={loading} type="submit" className="w-full bg-[#09BF44] hover:bg-[#07a63a] text-white font-bold text-lg p-4 rounded-xl transition-all flex items-center justify-center gap-2">
                                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                                Next: Professional Info
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </form>
                        <div className="mt-4 text-center">
                            <p className="text-gray-600">
                                Already have an account?{' '}
                                <button onClick={() => setStep('login')} className="text-[#09BF44] font-bold hover:underline">
                                    Log In
                                </button>
                            </p>
                        </div>
                        <button onClick={() => setStep('role-selection')} className="mt-6 text-gray-500 hover:text-gray-900 font-medium">Back to Selection</button>
                    </div>
                )}

            </div>
        </div>
    );
}
