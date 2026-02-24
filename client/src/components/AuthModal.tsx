"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { X, User, Briefcase, ChevronRight, Loader2, Eye, EyeOff, Upload, X as XIcon, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useModal } from '@/context/ModalContext';
import { MAIN_CATEGORIES } from '@/lib/categories';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialStep?: 'role-selection' | 'client-auth' | 'freelancer-step-1' | 'login' | 'forgot-password';
}

type ModalStep = 'role-selection' | 'client-auth' | 'freelancer-step-1' | 'freelancer-step-2' | 'freelancer-step-3' | 'freelancer-step-4' | 'login' | 'forgot-password';

export default function AuthModal({ isOpen, onClose, initialStep = 'role-selection' }: AuthModalProps) {
    const router = useRouter();
    const { showModal } = useModal();
    const [step, setStep] = useState<ModalStep>('role-selection');
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
        dob: '', // date of birth YYYY-MM-DD
        username: '',
        identifier: '', // for login
        businessType: 'personal' // default
    });
    const [profilePicture, setProfilePicture] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Step 2: Professional Info
    const [professionalInfo, setProfessionalInfo] = useState({
        category: '',
        experienceYears: '',
        skills: '', // space-separated, displayed as tags
        bio: '',
        certificateUrls: [] as string[], // from file uploads
        idDocumentUrl: '' as string // from file upload
    });

    // Step 3: Survey & Pricing
    const [survey, setSurvey] = useState({
        isFullTime: false,
        speedQualityCommitment: 'Yes'
    });
    const [pricing, setPricing] = useState({
        basic: { price: 500, days: 3 },
        standard: { price: 1000, days: 5 },
        premium: { price: 2000, days: 7 }
    });

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
                dob: '',
                username: '',
                identifier: '',
                businessType: 'personal'
            });
            setForgotPasswordEmail('');
            setShowPassword(false);
            setProfilePicture(null);
            setProfessionalInfo({ category: '', experienceYears: '', skills: '', bio: '', certificateUrls: [], idDocumentUrl: '' });
            setSurvey({ isFullTime: false, speedQualityCommitment: 'Yes' });
            setPricing({ basic: { price: 500, days: 3 }, standard: { price: 1000, days: 5 }, premium: { price: 2000, days: 7 } });
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

            // If freelancer with incomplete onboarding, stay in modal
            if (data.user.role === 'freelancer' && data.user.freelancerProfile?.status === 'pending' && !data.user.freelancerProfile?.category) {
                setError('');
                setStep('freelancer-step-2');
            } else {
                onClose();
                showModal({
                    title: 'Login Successful',
                    message: `Welcome back, ${data.user.firstName}!`,
                    type: 'success',
                    onConfirm: () => {
                        if (data.user.role === 'client') {
                            router.push('/dashboard/client');
                        } else if (data.user.role === 'freelancer') {
                            router.push('/dashboard/freelancer');
                        } else if (data.user.role === 'admin') {
                            router.push('/admin');
                        }
                    }
                });
            }
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
                message: 'Please check your email to verify your account. You must verify before accessing the dashboard.',
                type: 'success',
                onConfirm: () => router.push('/')
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
                phoneNumber: formData.phoneNumber
            };
            if (formData.dob) registerData.dateOfBirth = formData.dob;

            // Add profile picture if uploaded
            if (profilePicture) {
                registerData.profilePicture = profilePicture;
            }

            const data = await api.auth.register(registerData);
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Move to next step in modal instead of redirecting
            setError('');
            setStep('freelancer-step-2');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleProfessionalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setProfessionalInfo({ ...professionalInfo, [e.target.name]: e.target.value });
    };

    const handleStep2Submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!professionalInfo.bio) { setError('Please describe yourself'); return; }
        setError('');
        setStep('freelancer-step-3');
    };

    const handlePricingChange = (tier: 'basic' | 'standard' | 'premium', field: 'price' | 'days', value: string) => {
        setPricing({
            ...pricing,
            [tier]: { ...pricing[tier], [field]: Number(value) }
        });
    };

    const handleFinalSubmit = async () => {
        setLoading(true);
        setError('');
        try {
            await api.freelancer.updateProfile({
                category: professionalInfo.category,
                experienceYears: Number(professionalInfo.experienceYears),
                certificates: professionalInfo.certificateUrls,
                skills: professionalInfo.skills.trim().split(/\s+/).filter(Boolean),
                bio: professionalInfo.bio,
                idDocument: professionalInfo.idDocumentUrl || undefined,
                surveyResponses: {
                    isFullTime: survey.isFullTime,
                    speedQualityCommitment: survey.speedQualityCommitment
                },
                starterPricing: pricing
            });
            setStep('freelancer-step-4');
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
            <div className="relative w-full max-w-2xl bg-white rounded-2xl md:rounded-3xl shadow-2xl max-h-[92vh] md:max-h-[90vh] flex flex-col overflow-hidden">
                <div className="sticky top-0 bg-white z-10 flex justify-end p-2 md:p-4 pb-0 shrink-0 rounded-t-2xl md:rounded-t-3xl">
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>
                <div className="overflow-y-auto flex-1 px-4 md:px-8 pb-6 md:pb-8 min-h-0">

                    {step === 'role-selection' && (
                        <div className="text-center py-4 md:py-8">
                            <div className="flex items-center justify-center gap-3">
                                <h2 className="text-2xl md:text-4xl font-black text-gray-900">Join</h2>
                                <Image
                                    src="/logos/logo-green.png"
                                    alt="Engezhaly"
                                    width={240}
                                    height={66}
                                    className="h-14 md:h-20 w-auto"
                                    priority
                                />
                            </div>
                            <p className="text-base md:text-xl text-gray-600 mb-6 md:mb-12">How do you want to use the platform?</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                <button
                                    onClick={() => { setStep('client-auth'); }}
                                    className="group flex flex-col items-center justify-center p-6 md:p-10 border-2 border-gray-100 rounded-2xl md:rounded-3xl hover:border-[#09BF44] hover:bg-green-50/50 transition-all duration-300"
                                >
                                    <div className="w-16 h-16 md:w-24 md:h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4 md:mb-6 group-hover:bg-[#09BF44] transition-colors">
                                        <User className="w-8 h-8 md:w-12 md:h-12 text-gray-600 group-hover:text-white" />
                                    </div>
                                    <h3 className="text-xl md:text-2xl font-bold text-gray-900">I&apos;m Hiring</h3>
                                    <p className="text-sm md:text-base text-gray-500 mt-2 font-medium">Find talent & get work done</p>
                                </button>

                                <button
                                    onClick={() => { setStep('freelancer-step-1'); }}
                                    className="group flex flex-col items-center justify-center p-6 md:p-10 border-2 border-gray-100 rounded-2xl md:rounded-3xl hover:border-[#09BF44] hover:bg-green-50/50 transition-all duration-300"
                                >
                                    <div className="w-16 h-16 md:w-24 md:h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4 md:mb-6 group-hover:bg-[#09BF44] transition-colors">
                                        <Briefcase className="w-8 h-8 md:w-12 md:h-12 text-gray-600 group-hover:text-white" />
                                    </div>
                                    <h3 className="text-xl md:text-2xl font-bold text-gray-900">I Want to Freelance</h3>
                                    <p className="text-sm md:text-base text-gray-500 mt-2 font-medium">Sell your services & earn</p>
                                </button>
                            </div>

                            <div className="mt-6 md:mt-8">
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
                        <div className="py-3 md:py-4">
                            <div className="flex items-center justify-center gap-3 mb-8">
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Welcome Back</h2>
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
                                        className="w-full p-3 md:p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400"
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
                                        className="w-full p-3 md:p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all font-medium pr-12 text-gray-900 placeholder:text-gray-400"
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

                                <button disabled={loading} type="submit" className="w-full bg-[#09BF44] hover:bg-[#07a63a] text-white font-bold text-base md:text-lg p-3 md:p-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg">
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
                        <div className="py-3 md:py-4">
                            <div className="flex justify-center mb-6">
                                <Image
                                    src="/logos/logo-green.png"
                                    alt="Engezhaly"
                                    width={200}
                                    height={55}
                                    className="h-14 md:h-20 w-auto"
                                    priority
                                />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">Forgot Password?</h2>
                            <p className="text-center text-gray-600 mb-8">Enter your email address and we&apos;ll send you a link to reset your password.</p>

                            <form onSubmit={handleForgotPassword} className="space-y-5">
                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    required
                                    value={forgotPasswordEmail}
                                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                                    className="w-full p-3 md:p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400"
                                />

                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
                                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                        {error}
                                    </div>
                                )}

                                <button disabled={loading} type="submit" className="w-full bg-[#09BF44] hover:bg-[#07a63a] text-white font-bold text-base md:text-lg p-3 md:p-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg">
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
                        <div className="py-3 md:py-4">
                            <div className="flex items-center justify-center gap-3">
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Join</h2>
                                <Image
                                    src="/logos/logo-green.png"
                                    alt="Engezhaly"
                                    width={200}
                                    height={55}
                                    className="h-14 md:h-20 w-auto"
                                    priority
                                />
                            </div>
                            <p className="text-center text-gray-600 mb-8">Create your client account to start posting jobs and hiring freelancers.</p>

                            <form onSubmit={handleClientSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <input name="firstName" placeholder="First Name" required onChange={handleChange} className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400" />
                                    <input name="lastName" placeholder="Last Name" required onChange={handleChange} className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400" />
                                </div>
                                <input name="username" placeholder="Username" required onChange={handleChange} className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400" />
                                <input name="email" type="email" placeholder="Email Address" required onChange={handleChange} className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400" />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                                <button disabled={loading} type="submit" className="w-full bg-[#09BF44] hover:bg-[#07a63a] text-white font-bold text-base md:text-lg p-3 md:p-4 rounded-xl transition-all flex items-center justify-center gap-2">
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
                        <div className="py-3 md:py-4">
                            <div className="flex items-center justify-center gap-3">
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Join</h2>
                                <Image
                                    src="/logos/logo-green.png"
                                    alt="Engezhaly"
                                    width={200}
                                    height={55}
                                    className="h-14 md:h-20 w-auto"
                                    priority
                                />
                            </div>
                            {/* Progress Bar */}
                            <div className="bg-gray-100 h-2 w-full rounded-full mb-6">
                                <div className="bg-[#09BF44] h-full rounded-full transition-all duration-500" style={{ width: '25%' }} />
                            </div>
                            <div className="flex items-center justify-center gap-2 mb-4 text-sm font-bold text-gray-400 uppercase tracking-wider">
                                <span className="text-[#09BF44]">Step 1</span>
                                <span>/</span>
                                <span>4</span>
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold text-center mb-2">Personal Information</h3>
                            <p className="text-center text-gray-600 mb-8">Let&apos;s get your profile started.</p>

                            <form onSubmit={handleFreelancerStep1Submit} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <input name="firstName" placeholder="First Name" required onChange={handleChange} className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400" />
                                    <input name="lastName" placeholder="Last Name" required onChange={handleChange} className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400" />
                                </div>
                                <input name="username" placeholder="Username" required onChange={handleChange} className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400" />
                                <input name="email" type="email" placeholder="Email Address" required onChange={handleChange} className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400" />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Date of Birth</label>
                                        <input name="dob" type="date" required onChange={handleChange} value={formData.dob} className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400" />
                                    </div>
                                    <input name="phoneNumber" placeholder="Phone Number" required onChange={handleChange} className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400" />
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

                                <button disabled={loading} type="submit" className="w-full bg-[#09BF44] hover:bg-[#07a63a] text-white font-bold text-base md:text-lg p-3 md:p-4 rounded-xl transition-all flex items-center justify-center gap-2">
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

                    {/* FREELANCER STEP 2: Professional Info */}
                    {step === 'freelancer-step-2' && (
                        <div className="py-3 md:py-4">
                            {/* Progress Bar */}
                            <div className="bg-gray-100 h-2 w-full rounded-full mb-6">
                                <div className="bg-[#09BF44] h-full rounded-full transition-all duration-500" style={{ width: '50%' }} />
                            </div>
                            <div className="flex items-center justify-center gap-2 mb-4 text-sm font-bold text-gray-400 uppercase tracking-wider">
                                <span className="text-[#09BF44]">Step 2</span>
                                <span>/</span>
                                <span>4</span>
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold text-center mb-2">Professional Info</h3>
                            <p className="text-center text-gray-600 mb-8">Tell us about your skills and experience.</p>

                            {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2 text-sm mb-4"><div className="w-2 h-2 bg-red-500 rounded-full"></div>{error}</div>}

                            <form onSubmit={handleStep2Submit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                                    <select
                                        name="category"
                                        required
                                        value={professionalInfo.category}
                                        onChange={handleProfessionalChange}
                                        className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all font-medium text-gray-900"
                                    >
                                        <option value="">Select a Category</option>
                                        {MAIN_CATEGORIES.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Describe Yourself</label>
                                    <textarea
                                        name="bio"
                                        required
                                        placeholder="Tell clients about your expertise..."
                                        value={professionalInfo.bio}
                                        onChange={(e) => setProfessionalInfo({ ...professionalInfo, bio: e.target.value })}
                                        className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400 h-32 resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Years of Experience</label>
                                    <input type="number" name="experienceYears" required min="0" value={professionalInfo.experienceYears} onChange={handleProfessionalChange} className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400" />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Skills (space separated)</label>
                                    {(() => {
                                        const parts = professionalInfo.skills.split(/\s+/);
                                        const completedTags = parts.slice(0, -1).filter(Boolean);
                                        const currentWord = parts.length > 0 ? (parts[parts.length - 1] ?? '') : '';
                                        const prefix = completedTags.length ? completedTags.join(' ') + ' ' : '';
                                        return (
                                            <div className="flex flex-wrap items-center gap-2 w-full p-3 py-2.5 min-h-[52px] bg-gray-50 rounded-xl border-2 border-transparent focus-within:border-[#09BF44] focus-within:bg-white outline-none transition-all font-medium text-gray-900">
                                                {completedTags.map((tag) => (
                                                    <span key={tag} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#09BF44] text-white">
                                                        {tag}
                                                    </span>
                                                ))}
                                                <input
                                                    type="text"
                                                    name="skills"
                                                    required={professionalInfo.skills.trim().split(/\s+/).filter(Boolean).length === 0}
                                                    placeholder={completedTags.length === 0 ? 'e.g. React Photoshop SEO' : ''}
                                                    value={currentWord}
                                                    onChange={(e) => setProfessionalInfo({ ...professionalInfo, skills: prefix + e.target.value })}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Backspace' && !currentWord && completedTags.length > 0) {
                                                            e.preventDefault();
                                                            setProfessionalInfo({ ...professionalInfo, skills: completedTags.slice(0, -1).join(' ') });
                                                        }
                                                    }}
                                                    className="flex-1 min-w-[120px] py-1 bg-transparent border-0 outline-none placeholder:text-gray-400"
                                                />
                                            </div>
                                        );
                                    })()}
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Certificates – upload image or PDF</label>
                                        <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            required
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                setError('');
                                                try {
                                                    const url = await api.upload.file(file);
                                                    setProfessionalInfo((prev) => ({ ...prev, certificateUrls: [...prev.certificateUrls, url] }));
                                                } catch (err: any) {
                                                    setError(err.message || 'Upload failed');
                                                }
                                                e.target.value = '';
                                            }}
                                            className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none transition-all text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#09BF44] file:text-white file:font-bold file:cursor-pointer"
                                        />
                                        {professionalInfo.certificateUrls.length > 0 && (
                                            <p className="mt-1 text-xs text-gray-500">{professionalInfo.certificateUrls.length} file(s) uploaded</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">ID Document (only admins see this) – upload image or PDF</label>
                                        <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                setError('');
                                                try {
                                                    const url = await api.upload.file(file);
                                                    setProfessionalInfo((prev) => ({ ...prev, idDocumentUrl: url }));
                                                } catch (err: any) {
                                                    setError(err.message || 'Upload failed');
                                                }
                                                e.target.value = '';
                                            }}
                                            className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none transition-all text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#09BF44] file:text-white file:font-bold file:cursor-pointer"
                                        />
                                        {professionalInfo.idDocumentUrl && <p className="mt-1 text-xs text-gray-500">Document uploaded</p>}
                                    </div>
                                </div>

                                <button type="submit" className="w-full bg-[#09BF44] hover:bg-[#07a63a] text-white font-bold text-base md:text-lg p-3 md:p-4 rounded-xl transition-all flex items-center justify-center gap-2">
                                    Next: Survey & Pricing <ChevronRight className="w-5 h-5" />
                                </button>
                            </form>
                        </div>
                    )}

                    {/* FREELANCER STEP 3: Survey & Pricing */}
                    {step === 'freelancer-step-3' && (
                        <div className="py-3 md:py-4">
                            {/* Progress Bar */}
                            <div className="bg-gray-100 h-2 w-full rounded-full mb-6">
                                <div className="bg-[#09BF44] h-full rounded-full transition-all duration-500" style={{ width: '75%' }} />
                            </div>
                            <div className="flex items-center justify-center gap-2 mb-4 text-sm font-bold text-gray-400 uppercase tracking-wider">
                                <span className="text-[#09BF44]">Step 3</span>
                                <span>/</span>
                                <span>4</span>
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold text-center mb-2">Survey & Pricing</h3>
                            <p className="text-center text-gray-600 mb-8">Set your commitment and base rates.</p>

                            {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2 text-sm mb-4"><div className="w-2 h-2 bg-red-500 rounded-full"></div>{error}</div>}

                            <div className="space-y-8">
                                {/* Survey */}
                                <div className="space-y-4">
                                    <h4 className="text-lg font-bold text-gray-900">Availability & Commitment</h4>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                                        <span className="font-medium text-gray-700">Are you working Full-time?</span>
                                        <div className="flex gap-2">
                                            <button type="button" onClick={() => setSurvey({ ...survey, isFullTime: true })} className={`px-4 py-2 rounded-lg font-bold border-2 transition-all ${survey.isFullTime ? 'bg-green-100 border-[#09BF44] text-[#09BF44]' : 'bg-gray-50 border-transparent hover:border-gray-200'}`}>Yes</button>
                                            <button type="button" onClick={() => setSurvey({ ...survey, isFullTime: false })} className={`px-4 py-2 rounded-lg font-bold border-2 transition-all ${!survey.isFullTime ? 'bg-green-100 border-[#09BF44] text-[#09BF44]' : 'bg-gray-50 border-transparent hover:border-gray-200'}`}>No</button>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="block font-medium text-gray-700 mb-2">Speed/Quality Commitment?</span>
                                        <select value={survey.speedQualityCommitment} onChange={(e) => setSurvey({ ...survey, speedQualityCommitment: e.target.value })} className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all font-medium text-gray-900">
                                            <option value="Yes">Yes, I commit to high quality & speed</option>
                                            <option value="Maybe">Maybe</option>
                                            <option value="No">No</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Pricing Table */}
                                <div>
                                    <h4 className="text-lg font-bold text-gray-900 mb-2">Starter Pricing Guide</h4>
                                    <p className="text-sm text-gray-500 mb-4">Set your base rates. These can be changed later on. Min 500 EGP.</p>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {(['basic', 'standard', 'premium'] as const).map((tier) => (
                                            <div key={tier} className="border-2 border-gray-100 p-4 rounded-xl">
                                                <h5 className="font-bold text-lg capitalize mb-3 text-[#09BF44]">{tier}</h5>
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="text-xs font-bold text-gray-500">Price (EGP)</label>
                                                        <input type="number" min="500" value={pricing[tier].price} onChange={(e) => handlePricingChange(tier, 'price', e.target.value)} className="w-full p-2 bg-gray-50 rounded-lg border-2 border-transparent focus:border-[#09BF44] outline-none transition-all" />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold text-gray-500">Delivery (Days)</label>
                                                        <input type="number" min="1" value={pricing[tier].days} onChange={(e) => handlePricingChange(tier, 'days', e.target.value)} className="w-full p-2 bg-gray-50 rounded-lg border-2 border-transparent focus:border-[#09BF44] outline-none transition-all" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                    <button onClick={() => setStep('freelancer-step-2')} className="flex-1 bg-gray-100 text-gray-600 font-bold p-4 rounded-xl hover:bg-gray-200 transition-all">Back</button>
                                    <button onClick={handleFinalSubmit} disabled={loading} className="flex-1 bg-[#09BF44] text-white font-bold p-4 rounded-xl hover:bg-[#07a63a] transition-all flex items-center justify-center gap-2">
                                        {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                                        Submit Application
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* FREELANCER STEP 4: Under Review */}
                    {step === 'freelancer-step-4' && (
                        <div className="text-center py-12">
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-12 h-12 text-[#09BF44]" />
                            </div>
                            <h2 className="text-3xl font-black text-gray-900 mb-4">Profile Under Review!</h2>
                            <p className="text-lg text-gray-600 mb-4 max-w-lg mx-auto">
                                Our team is reviewing your application. You will be notified once your profile is approved and you can start creating Projects.
                            </p>
                            <p className="text-sm text-gray-500 mb-8 max-w-lg mx-auto">
                                Please check your email to verify your account. You must verify before accessing the dashboard.
                            </p>
                            <button
                                onClick={() => { onClose(); router.push('/dashboard/freelancer'); }}
                                className="bg-gray-900 text-white font-bold px-8 py-3 rounded-full hover:bg-gray-800 transition-colors"
                            >
                                Go to Dashboard
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
