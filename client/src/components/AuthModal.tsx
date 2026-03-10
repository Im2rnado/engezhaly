"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { X, User, Briefcase, ChevronRight, Loader2, Eye, EyeOff, Upload, X as XIcon, CheckCircle, Plus, ImageIcon, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useModal } from '@/context/ModalContext';
import { MAIN_CATEGORIES, CATEGORIES } from '@/lib/categories';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialStep?: 'role-selection' | 'client-auth' | 'freelancer-step-1' | 'login' | 'forgot-password';
}

type ModalStep = 'role-selection' | 'client-auth' | 'freelancer-step-1' | 'freelancer-step-2' | 'freelancer-step-3-offer' | 'freelancer-step-3-survey' | 'freelancer-step-3a' | 'freelancer-step-3b' | 'freelancer-step-4' | 'login' | 'forgot-password';

export default function AuthModal({ isOpen, onClose, initialStep = 'role-selection' }: AuthModalProps) {
    const router = useRouter();
    const { showModal, showRedirectLoader } = useModal();
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

    useEffect(() => {
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, [step, error]);

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
        businessType: 'personal', // default
        companyName: '',
        companyDescription: '',
        position: '',
        linkedIn: '',
        instagram: '',
        facebook: '',
        tiktok: ''
    });
    const [profilePicture, setProfilePicture] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Step 2: Professional Info
    const [professionalInfo, setProfessionalInfo] = useState({
        category: '',
        experienceYears: '',
        skills: '', // space-separated, displayed as tags
        bio: '',
        isStudent: false,
        certifications: [] as { name: string; date: string; institute: string; documentUrl: string }[],
        universityIdUrl: '' as string, // for students
        idDocumentUrl: '' as string, // from file upload
        city: '',
        english: 'Fluent',
        arabic: 'Fluent',
        extraLanguages: '' // Other languages (space or Enter), no fluency
    });

    // Step 3: Survey & Pricing
    const [survey, setSurvey] = useState({
        disagreementHandling: '',
        hoursPerDay: '',
        clientUpdates: '',
        biggestChallenge: '',
        discoverySource: ''
    });
    const [withdrawalMethod, setWithdrawalMethod] = useState<{ method: 'vodafone_cash' | 'instapay' | 'bank'; phoneNumber: string; accountNumber: string; bankName: string }>({
        method: 'vodafone_cash',
        phoneNumber: '',
        accountNumber: '',
        bankName: ''
    });
    const [signupNotes, setSignupNotes] = useState('');
    const [surveyStep, setSurveyStep] = useState(1);
    const [starterOffer, setStarterOffer] = useState({
        title: '',
        description: '',
        subCategory: '',
        images: [] as string[],
        packages: [
            { type: 'Basic', price: 500, days: 3, revisions: 0, features: [''] },
            { type: 'Standard', price: 1000, days: 5, revisions: 1, features: [''] },
            { type: 'Premium', price: 2000, days: 7, revisions: 2, features: [''] }
        ]
    });
    const [portfolioItems, setPortfolioItems] = useState<{ title: string; description: string; imageUrl: string; link: string; subCategory: string }[]>([{ title: '', description: '', imageUrl: '', link: '', subCategory: '' }]);

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
                businessType: 'personal',
                companyName: '',
                companyDescription: '',
                position: '',
                linkedIn: '',
                instagram: '',
                facebook: '',
                tiktok: ''
            });
            setForgotPasswordEmail('');
            setShowPassword(false);
            setProfilePicture(null);
            setProfilePictureUploading(false);
            setProfilePictureProgress(0);
            setDocumentUploadProgress(null);
            setDocumentUploadingLabel(null);
            setPortfolioImageUploading(null);
            setPortfolioImageProgress(0);
            setProfessionalInfo({ category: '', experienceYears: '', skills: '', bio: '', isStudent: false, certifications: [], universityIdUrl: '', idDocumentUrl: '', city: '', english: 'Fluent', arabic: 'Fluent', extraLanguages: '' });
            setSurvey({ disagreementHandling: '', hoursPerDay: '', clientUpdates: '', biggestChallenge: '', discoverySource: '' });
            setWithdrawalMethod({ method: 'vodafone_cash', phoneNumber: '', accountNumber: '', bankName: '' });
            setSignupNotes('');
            setSurveyStep(1);
            setStarterOffer({ title: '', description: '', subCategory: '', images: [], packages: [{ type: 'Basic', price: 500, days: 3, revisions: 0, features: [''] }, { type: 'Standard', price: 1000, days: 5, revisions: 1, features: [''] }, { type: 'Premium', price: 2000, days: 7, revisions: 2, features: [''] }] });
            setPortfolioItems([{ title: '', description: '', imageUrl: '', link: '', subCategory: '' }]);
        }
    }, [isOpen]);

    const [profilePictureUploading, setProfilePictureUploading] = useState(false);
    const [profilePictureProgress, setProfilePictureProgress] = useState(0);
    const [documentUploadProgress, setDocumentUploadProgress] = useState<number | null>(null);
    const [documentUploadingLabel, setDocumentUploadingLabel] = useState<string | null>(null);
    const [portfolioImageUploading, setPortfolioImageUploading] = useState<number | null>(null);
    const [portfolioImageProgress, setPortfolioImageProgress] = useState(0);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setError('Image size must be less than 5MB');
            return;
        }
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file');
            return;
        }
        setError('');
        setProfilePictureUploading(true);
        setProfilePictureProgress(0);
        try {
            const url = await api.upload.file(file, {
                forSignup: true,
                onProgress: (p) => setProfilePictureProgress(p)
            });
            setProfilePicture(url);
        } catch (err: any) {
            setError(err.message || 'Profile picture upload failed');
        } finally {
            setProfilePictureUploading(false);
            setProfilePictureProgress(0);
            e.target.value = '';
        }
    };

    const removeProfilePicture = () => {
        setProfilePicture(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    if (!isOpen) return null;

    const validatePhoneEG = (phone: string) => {
        const cleaned = (phone || '').replace(/\s/g, '').replace(/^\+20/, '0');
        return /^0?1[0-9]{9}$/.test(cleaned);
    };
    const validateUsername = (u: string) => !(u || '').includes(' ');
    const validatePassword = (p: string) => (p || '').length >= 6;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validatePassword(formData.password)) {
            setError('Password must be at least 6 characters');
            return;
        }
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
            } else if (data.user.role === 'admin') {
                onClose();
                showRedirectLoader('Redirecting to admin dashboard...');
                router.push('/admin');
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
        if (!validatePhoneEG(formData.phoneNumber)) {
            setError('Please enter a valid Egyptian phone number (e.g. 01XXXXXXXXX)');
            return;
        }
        if (!validateUsername(formData.username)) {
            setError('Username cannot contain spaces');
            return;
        }
        if (!validatePassword(formData.password)) {
            setError('Password must be at least 6 characters');
            return;
        }
        if (formData.businessType === 'company' && !formData.companyName?.trim()) {
            setError('Company name is required for company accounts');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const payload: any = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                username: formData.username,
                email: formData.email,
                password: formData.password,
                role: 'client',
                businessType: formData.businessType,
                phoneNumber: formData.phoneNumber
            };
            if (formData.businessType === 'company') {
                payload.clientProfile = {
                    companyName: formData.companyName?.trim(),
                    companyDescription: formData.companyDescription?.trim() || undefined,
                    position: formData.position?.trim() || undefined,
                    linkedIn: formData.linkedIn?.trim() || undefined,
                    instagram: formData.instagram?.trim() || undefined,
                    facebook: formData.facebook?.trim() || undefined,
                    tiktok: formData.tiktok?.trim() || undefined
                };
            }
            const data = await api.auth.register(payload);
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

    const handleFreelancerStep1Submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validatePhoneEG(formData.phoneNumber)) {
            setError('Please enter a valid Egyptian phone number (e.g. 01XXXXXXXXX)');
            return;
        }
        if (!validateUsername(formData.username)) {
            setError('Username cannot contain spaces');
            return;
        }
        if (!validatePassword(formData.password)) {
            setError('Password must be at least 6 characters');
            return;
        }
        setError('');
        setStep('freelancer-step-2');
    };

    const handleProfessionalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setProfessionalInfo({ ...professionalInfo, [e.target.name]: e.target.value });
    };

    const handleStep2Submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!professionalInfo.bio) { setError('Please describe yourself'); return; }
        if (professionalInfo.isStudent && !professionalInfo.universityIdUrl) {
            setError('Please upload your University ID');
            return;
        }
        if (!professionalInfo.isStudent && professionalInfo.certifications.filter(c => c.name?.trim()).length === 0) {
            setError('Please add at least one certification with a name');
            return;
        }
        if (!professionalInfo.idDocumentUrl) {
            setError('Please upload your Government ID');
            return;
        }
        setError('');
        setStep('freelancer-step-3a');
    };

    const handleStarterOfferChange = (field: string, value: any) => {
        setStarterOffer(prev => ({ ...prev, [field]: value }));
    };
    const handleStarterOfferPackage = (idx: number, field: string, value: any) => {
        const next = [...starterOffer.packages];
        next[idx] = { ...next[idx], [field]: value };
        setStarterOffer(prev => ({ ...prev, packages: next }));
    };
    const handleStarterOfferFeatures = (idx: number, features: string[]) => {
        const next = [...starterOffer.packages];
        next[idx] = { ...next[idx], features: features?.length ? features : [''] };
        setStarterOffer(prev => ({ ...prev, packages: next }));
    };

    const handlePortfolioImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            showModal({ title: 'Error', message: 'Image must be under 5MB', type: 'error' });
            return;
        }
        setPortfolioImageUploading(index);
        setPortfolioImageProgress(0);
        try {
            const url = await api.upload.file(file, { forSignup: true, onProgress: (p) => setPortfolioImageProgress(p) });
            setPortfolioItems(prev => {
                const n = [...prev];
                n[index] = { ...n[index], imageUrl: url };
                return n;
            });
        } catch (err: any) {
            showModal({ title: 'Upload Failed', message: err.message || 'Failed to upload', type: 'error' });
        } finally {
            setPortfolioImageUploading(null);
            e.target.value = '';
        }
    };

    const SURVEY_QUESTIONS: { key: keyof typeof survey; label: string; type: 'text' | 'select'; options?: string[] }[] = [
        { key: 'disagreementHandling', label: 'What happens if you have a disagreement with the client?', type: 'text' },
        { key: 'hoursPerDay', label: 'On average, how many hours per day can you dedicate to Engezhaly?', type: 'text' },
        { key: 'clientUpdates', label: 'How do you keep clients updated? Will you be able to update them through chats and online calls?', type: 'text' },
        { key: 'biggestChallenge', label: "What's the biggest challenge you could face in a project?", type: 'text' },
        { key: 'discoverySource', label: 'Where did you find out about Engezhaly from?', type: 'select', options: ['TikTok', 'Instagram', 'Google', 'Friends & Family', 'Other'] }
    ];

    const handleFinalSubmit = async () => {
        setLoading(true);
        setError('');
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const profilePayload: Record<string, unknown> = {
            category: professionalInfo.category,
            experienceYears: Number(professionalInfo.experienceYears),
            isStudent: professionalInfo.isStudent,
            certifications: professionalInfo.isStudent ? [] : professionalInfo.certifications.filter(c => c.name?.trim()).map(c => ({ name: c.name.trim(), date: c.date || '', institute: c.institute || '', documentUrl: c.documentUrl || '' })),
            universityId: professionalInfo.isStudent ? professionalInfo.universityIdUrl || undefined : undefined,
            skills: professionalInfo.skills.trim().split(/\s+/).filter(Boolean),
            bio: professionalInfo.bio,
            idDocument: professionalInfo.idDocumentUrl || undefined,
            surveyResponses: {
                disagreementHandling: survey.disagreementHandling?.trim() || undefined,
                hoursPerDay: survey.hoursPerDay?.trim() || undefined,
                clientUpdates: survey.clientUpdates?.trim() || undefined,
                biggestChallenge: survey.biggestChallenge?.trim() || undefined,
                discoverySource: survey.discoverySource?.trim() || undefined
            },
            starterOffer: {
                title: starterOffer.title?.trim() || undefined,
                description: starterOffer.description?.trim() || undefined,
                subCategory: starterOffer.subCategory || undefined,
                images: starterOffer.images || [],
                packages: starterOffer.packages.map(p => ({
                    type: p.type,
                    price: Number(p.price) || 500,
                    days: Number(p.days) || 3,
                    revisions: Number(p.revisions) || 0,
                    features: Array.isArray(p.features) ? p.features.filter((f: string) => f?.trim()) : []
                }))
            },
            portfolio: portfolioItems.filter(p => p.title?.trim()).map(p => ({ title: p.title.trim(), description: p.description?.trim() || '', imageUrl: p.imageUrl || '', link: p.link?.trim() || '', subCategory: p.subCategory || '' })),
            signupNotes: signupNotes?.trim() || undefined
        };
        if (professionalInfo.city) profilePayload.city = professionalInfo.city;
        if (professionalInfo.english || professionalInfo.arabic) {
            profilePayload.languages = {};
            if (professionalInfo.english) (profilePayload.languages as Record<string, string>).english = professionalInfo.english;
            if (professionalInfo.arabic) (profilePayload.languages as Record<string, string>).arabic = professionalInfo.arabic;
        }
        const extraLangs = professionalInfo.extraLanguages.trim().split(/\s+/).filter(Boolean);
        if (extraLangs.length > 0) profilePayload.extraLanguages = extraLangs;
        try {
            if (token) {
                await api.freelancer.updateProfile(profilePayload);
                if (withdrawalMethod.method && ((withdrawalMethod.method !== 'bank' && withdrawalMethod.phoneNumber?.trim()) || (withdrawalMethod.method === 'bank' && withdrawalMethod.accountNumber?.trim() && withdrawalMethod.bankName?.trim()))) {
                    try {
                        await api.withdrawalMethods.add({
                            method: withdrawalMethod.method,
                            phoneNumber: withdrawalMethod.method !== 'bank' ? withdrawalMethod.phoneNumber?.trim() : undefined,
                            accountNumber: withdrawalMethod.method === 'bank' ? withdrawalMethod.accountNumber?.trim() : undefined,
                            bankName: withdrawalMethod.method === 'bank' ? withdrawalMethod.bankName?.trim() : undefined
                        });
                    } catch { /* ignore */ }
                }
                const updated = await api.freelancer.getProfile();
                if (updated?.freelancerProfile?.status === 'pending') {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            } else {
                const registerData: any = {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    role: 'freelancer',
                    phoneNumber: formData.phoneNumber,
                    ...profilePayload
                };
                if (formData.dob) registerData.dateOfBirth = formData.dob;
                if (profilePicture) registerData.profilePicture = profilePicture;
                if (withdrawalMethod.method && ((withdrawalMethod.method !== 'bank' && withdrawalMethod.phoneNumber?.trim()) || (withdrawalMethod.method === 'bank' && withdrawalMethod.accountNumber?.trim() && withdrawalMethod.bankName?.trim()))) {
                    registerData.withdrawalMethod = {
                        method: withdrawalMethod.method,
                        phoneNumber: withdrawalMethod.method !== 'bank' ? withdrawalMethod.phoneNumber?.trim() : undefined,
                        accountNumber: withdrawalMethod.method === 'bank' ? withdrawalMethod.accountNumber?.trim() : undefined,
                        bankName: withdrawalMethod.method === 'bank' ? withdrawalMethod.bankName?.trim() : undefined
                    };
                }
                await api.auth.register(registerData);
                // Don't save token/user - freelancer is pending. Header would show Dashboard but it doesn't work until approved.
            }
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
            <div className={`relative w-full bg-white rounded-2xl md:rounded-3xl shadow-2xl max-h-[92vh] md:max-h-[90vh] flex flex-col overflow-hidden ${step === 'freelancer-step-3-offer' ? 'max-w-4xl' : 'max-w-2xl'}`}>
                <div ref={scrollContainerRef} className="overflow-y-auto flex-1 px-4 md:px-8 pb-6 md:pb-8 min-h-0 pt-2">

                    {step === 'role-selection' && (
                        <div className="text-center py-2 md:py-4">
                            <div className="flex items-center justify-between gap-3 mb-4">
                                <div className="flex-1" />
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
                                <div className="flex-1 flex justify-end">
                                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors -m-2">
                                        <X className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>
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
                            <div className="flex items-center justify-between gap-3 mb-6">
                                <div className="flex-1" />
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Welcome Back</h2>
                                <div className="flex-1 flex justify-end">
                                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors -m-2">
                                        <X className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>
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
                            <div className="flex items-center justify-between gap-3 mb-4">
                                <div className="flex-1" />
                                <Image
                                    src="/logos/logo-green.png"
                                    alt="Engezhaly"
                                    width={200}
                                    height={55}
                                    className="h-12 md:h-16 w-auto"
                                    priority
                                />
                                <div className="flex-1 flex justify-end">
                                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors -m-2">
                                        <X className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>
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
                            <div className="flex items-center justify-between gap-3 mb-4">
                                <div className="flex-1" />
                                <div className="flex items-center gap-3">
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
                                <div className="flex-1 flex justify-end">
                                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors -m-2">
                                        <X className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>
                            </div>
                            <p className="text-center text-gray-600 mb-8">Create your client account to start posting jobs and hiring freelancers.</p>

                            <form onSubmit={handleClientSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <input name="firstName" placeholder="First Name" required onChange={handleChange} value={formData.firstName} className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400" />
                                    <input name="lastName" placeholder="Last Name" required onChange={handleChange} value={formData.lastName} className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400" />
                                </div>
                                <input name="username" placeholder="Username" required onChange={handleChange} value={formData.username} className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400" />
                                <input name="email" type="email" placeholder="Email Address" required onChange={handleChange} value={formData.email} className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400" />
                                <input name="phoneNumber" placeholder="Phone (01XXXXXXXX)" required onChange={handleChange} value={formData.phoneNumber} className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400" />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="relative">
                                        <input name="password" type={showPassword ? "text" : "password"} placeholder="Password (min 6 chars)" required minLength={6} onChange={handleChange} value={formData.password} className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400 pr-12" />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    <select name="businessType" onChange={handleChange} value={formData.businessType} className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all font-medium text-gray-900">
                                        <option value="personal">Personal</option>
                                        <option value="company">Company</option>
                                    </select>
                                </div>
                                {formData.businessType === 'company' && (
                                    <div className="space-y-4 p-4 bg-gray-50 rounded-xl border-2 border-gray-100">
                                        <input name="companyName" placeholder="Company Name *" required onChange={handleChange} value={formData.companyName} className="w-full p-4 bg-white rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400" />
                                        <textarea name="companyDescription" placeholder="Company Description (optional)" rows={2} onChange={handleChange} value={formData.companyDescription} className="w-full p-4 bg-white rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400 resize-none" />
                                        <input name="position" placeholder="Your Position (optional)" onChange={handleChange} value={formData.position} className="w-full p-4 bg-white rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400" />
                                        <div className="grid grid-cols-2 gap-2">
                                            <input name="linkedIn" placeholder="LinkedIn URL" onChange={handleChange} value={formData.linkedIn} className="w-full p-3 bg-white rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400 text-sm" />
                                            <input name="instagram" placeholder="Instagram URL" onChange={handleChange} value={formData.instagram} className="w-full p-3 bg-white rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400 text-sm" />
                                            <input name="facebook" placeholder="Facebook URL" onChange={handleChange} value={formData.facebook} className="w-full p-3 bg-white rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400 text-sm" />
                                            <input name="tiktok" placeholder="TikTok URL" onChange={handleChange} value={formData.tiktok} className="w-full p-3 bg-white rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400 text-sm" />
                                        </div>
                                    </div>
                                )}

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
                            <div className="flex items-center justify-between gap-3 mb-4">
                                <div className="flex-1" />
                                <div className="flex items-center gap-3">
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
                                <div className="flex-1 flex justify-end">
                                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors -m-2">
                                        <X className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>
                            </div>
                            {/* Progress Bar */}
                            <div className="bg-gray-100 h-2 w-full rounded-full mb-6">
                                <div className="bg-[#09BF44] h-full rounded-full transition-all duration-500" style={{ width: '16.67%' }} />
                            </div>
                            <div className="flex items-center justify-center gap-2 mb-4 text-sm font-bold text-gray-400 uppercase tracking-wider">
                                <span className="text-[#09BF44]">Step 1</span>
                                <span>/</span>
                                <span>6</span>
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
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
                                        <input name="phoneNumber" placeholder="01XXXXXXXX" required onChange={handleChange} className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400" />
                                    </div>
                                </div>
                                <div className="relative">
                                    <input name="password" type={showPassword ? "text" : "password"} placeholder="Password (min 6 chars)" required minLength={6} onChange={handleChange} value={formData.password} className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400 pr-12" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>

                                {/* Profile Picture Upload */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Profile Picture (Optional)</label>
                                    {profilePicture ? (
                                        <div className="relative">
                                            <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-[#09BF44] bg-gray-100">
                                                <Image
                                                    src={profilePicture}
                                                    alt="Profile preview"
                                                    width={128}
                                                    height={128}
                                                    className="w-full h-full object-cover"
                                                    unoptimized
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
                                            onClick={() => !profilePictureUploading && fileInputRef.current?.click()}
                                            className={`relative p-6 border-2 border-dashed rounded-xl text-center transition-colors ${profilePictureUploading ? 'border-[#09BF44] bg-green-50 cursor-wait' : 'border-gray-200 text-gray-500 hover:border-[#09BF44] hover:bg-green-50 cursor-pointer'}`}
                                        >
                                            {profilePictureUploading ? (
                                                <>
                                                    <Loader2 className="w-8 h-8 mx-auto mb-2 text-[#09BF44] animate-spin" />
                                                    <p className="text-sm font-bold text-[#09BF44] mb-2">Uploading... {profilePictureProgress}%</p>
                                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                        <div className="h-full bg-[#09BF44] transition-all duration-300" style={{ width: `${profilePictureProgress}%` }} />
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                                    <p className="text-sm font-bold">Click to upload profile photo</p>
                                                    <p className="text-xs text-gray-400 mt-1">Max 5MB</p>
                                                </>
                                            )}
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
                            <div className="flex items-center justify-between gap-3 mb-4">
                                <Image src="/logos/logo-green.png" alt="Engezhaly" width={120} height={33} className="h-8 w-auto" priority />
                                <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors shrink-0 -m-2 ml-auto">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                            {/* Progress Bar */}
                            <div className="bg-gray-100 h-2 w-full rounded-full mb-6">
                                <div className="bg-[#09BF44] h-full rounded-full transition-all duration-500" style={{ width: '33.33%' }} />
                            </div>
                            <div className="flex items-center justify-center gap-2 mb-4 text-sm font-bold text-gray-400 uppercase tracking-wider">
                                <span className="text-[#09BF44]">Step 2</span>
                                <span>/</span>
                                <span>6</span>
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
                                    <label className="block text-sm font-bold text-gray-700 mb-2">City</label>
                                    <input
                                        type="text"
                                        name="city"
                                        placeholder="e.g. Cairo, Alexandria"
                                        value={professionalInfo.city}
                                        onChange={(e) => setProfessionalInfo({ ...professionalInfo, city: e.target.value })}
                                        className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Languages</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <span className="block text-sm text-gray-500 mb-1">English</span>
                                            <select
                                                name="english"
                                                value={professionalInfo.english}
                                                onChange={(e) => setProfessionalInfo({ ...professionalInfo, english: e.target.value })}
                                                className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all font-medium text-gray-900"
                                            >
                                                <option value="Fluent">Fluent</option>
                                                <option value="Intermediate">Intermediate</option>
                                                <option value="Basic">Basic</option>
                                                <option value="None">None</option>
                                            </select>
                                        </div>
                                        <div>
                                            <span className="block text-sm text-gray-500 mb-1">Arabic</span>
                                            <select
                                                name="arabic"
                                                value={professionalInfo.arabic}
                                                onChange={(e) => setProfessionalInfo({ ...professionalInfo, arabic: e.target.value })}
                                                className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all font-medium text-gray-900"
                                            >
                                                <option value="Fluent">Fluent</option>
                                                <option value="Intermediate">Intermediate</option>
                                                <option value="Basic">Basic</option>
                                                <option value="None">None</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <span className="block text-sm text-gray-500 mb-1">Other languages (optional, no fluency level)</span>
                                        {(() => {
                                            const parts = professionalInfo.extraLanguages.split(/\s+/);
                                            const completedTags = parts.slice(0, -1).filter(Boolean);
                                            const currentWord = parts.length > 0 ? (parts[parts.length - 1] ?? '') : '';
                                            const prefix = completedTags.length ? completedTags.join(' ') + ' ' : '';
                                            return (
                                                <div className="flex flex-wrap items-center gap-2 w-full p-3 py-2.5 min-h-[44px] bg-gray-50 rounded-xl border-2 border-transparent focus-within:border-[#09BF44] focus-within:bg-white outline-none transition-all font-medium text-gray-900">
                                                    {completedTags.map((tag) => (
                                                        <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. French, German (space or Enter to add)"
                                                        value={currentWord}
                                                        onChange={(e) => setProfessionalInfo({ ...professionalInfo, extraLanguages: prefix + e.target.value })}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                setProfessionalInfo({ ...professionalInfo, extraLanguages: (prefix + currentWord).trim() + ' ' });
                                                            } else if (e.key === 'Backspace' && !currentWord && completedTags.length > 0) {
                                                                e.preventDefault();
                                                                setProfessionalInfo({ ...professionalInfo, extraLanguages: completedTags.slice(0, -1).join(' ') });
                                                            }
                                                        }}
                                                        className="flex-1 min-w-[120px] py-1 bg-transparent border-0 outline-none placeholder:text-gray-400 text-sm"
                                                    />
                                                </div>
                                            );
                                        })()}
                                    </div>
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
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Skills (separate with space or Enter)</label>
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
                                                    placeholder={completedTags.length === 0 ? 'e.g. React Photoshop SEO (space or Enter between items)' : ''}
                                                    value={currentWord}
                                                    onChange={(e) => setProfessionalInfo({ ...professionalInfo, skills: prefix + e.target.value })}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            setProfessionalInfo({ ...professionalInfo, skills: (prefix + currentWord).trim() + ' ' });
                                                        } else if (e.key === 'Backspace' && !currentWord && completedTags.length > 0) {
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

                                <div className="flex items-center gap-3">
                                    <span className="font-medium text-gray-700">Are you a student?</span>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setProfessionalInfo((prev) => ({ ...prev, isStudent: true, certifications: [] }))}
                                            className={`px-4 py-1 text-sm rounded-lg font-bold border-2 transition-all ${professionalInfo.isStudent ? 'bg-green-100 border-[#09BF44] text-[#09BF44]' : 'bg-gray-50 border-transparent hover:border-gray-200'}`}
                                        >
                                            Yes
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setProfessionalInfo((prev) => ({ ...prev, isStudent: false, universityIdUrl: '' }))}
                                            className={`px-4 py-1 text-sm rounded-lg font-bold border-2 transition-all ${!professionalInfo.isStudent ? 'bg-green-100 border-[#09BF44] text-[#09BF44]' : 'bg-gray-50 border-transparent hover:border-gray-200'}`}
                                        >
                                            No
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {professionalInfo.isStudent ? (
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Upload University ID (image/pdf)</label>
                                            {professionalInfo.universityIdUrl ? (
                                                <div className="flex items-center gap-3 p-4 bg-green-50 border-2 border-[#09BF44]/40 rounded-xl">
                                                    <CheckCircle className="w-6 h-6 text-[#09BF44] shrink-0" />
                                                    <span className="flex-1 text-sm font-bold text-gray-800">University ID uploaded successfully</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setProfessionalInfo((prev) => ({ ...prev, universityIdUrl: '' }))}
                                                        className="p-1.5 rounded-lg hover:bg-red-100 text-red-600"
                                                        aria-label="Remove file"
                                                    >
                                                        <XIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <label className={`block p-4 rounded-xl border-2 border-dashed transition-colors ${documentUploadingLabel === 'universityId' ? 'border-[#09BF44] bg-green-50 cursor-wait' : 'bg-gray-50 border-gray-200 hover:border-[#09BF44]/50 cursor-pointer'}`}>
                                                    <input
                                                        type="file"
                                                        accept="image/*,.pdf"
                                                        onChange={async (e) => {
                                                            const file = e.target.files?.[0];
                                                            if (!file) return;
                                                            setError('');
                                                            setDocumentUploadingLabel('universityId');
                                                            setDocumentUploadProgress(0);
                                                            try {
                                                                const url = await api.upload.file(file, { onProgress: (p) => setDocumentUploadProgress(p) });
                                                                setProfessionalInfo((prev) => ({ ...prev, universityIdUrl: url }));
                                                            } catch (err: any) {
                                                                setError(err.message || 'Upload failed');
                                                            } finally {
                                                                setDocumentUploadingLabel(null);
                                                                setDocumentUploadProgress(null);
                                                            }
                                                            e.target.value = '';
                                                        }}
                                                        disabled={!!documentUploadingLabel}
                                                        className="hidden"
                                                    />
                                                    {documentUploadingLabel === 'universityId' ? (
                                                        <div className="flex flex-col gap-2">
                                                            <span className="flex items-center gap-2 text-sm font-medium text-[#09BF44]">
                                                                <Loader2 className="w-5 h-5 animate-spin" /> Uploading... {documentUploadProgress ?? 0}%
                                                            </span>
                                                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                                <div className="h-full bg-[#09BF44] transition-all duration-300" style={{ width: `${documentUploadProgress ?? 0}%` }} />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="flex items-center gap-2 text-sm font-medium text-gray-600">
                                                            <Upload className="w-5 h-5" /> Click to upload University ID
                                                        </span>
                                                    )}
                                                </label>
                                            )}
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Certifications</label>
                                            <p className="text-xs text-gray-500 mb-2">Name, date, institute. Optional: upload document (visible to admins only).</p>
                                            {professionalInfo.certifications.map((cert, idx) => (
                                                <div key={idx} className="flex flex-wrap gap-2 mb-3 p-3 bg-gray-50 rounded-xl">
                                                    <input
                                                        value={cert.name}
                                                        onChange={(e) => {
                                                            const next = [...professionalInfo.certifications];
                                                            next[idx] = { ...next[idx], name: e.target.value };
                                                            setProfessionalInfo({ ...professionalInfo, certifications: next });
                                                        }}
                                                        placeholder="Certification name"
                                                        className="flex-1 min-w-[120px] p-2 rounded-lg border border-gray-200 text-sm"
                                                    />
                                                    <input
                                                        type="date"
                                                        value={cert.date}
                                                        onChange={(e) => {
                                                            const next = [...professionalInfo.certifications];
                                                            next[idx] = { ...next[idx], date: e.target.value };
                                                            setProfessionalInfo({ ...professionalInfo, certifications: next });
                                                        }}
                                                        placeholder="Date"
                                                        className="w-36 p-2 rounded-lg border border-gray-200 text-sm"
                                                    />
                                                    <input
                                                        value={cert.institute}
                                                        onChange={(e) => {
                                                            const next = [...professionalInfo.certifications];
                                                            next[idx] = { ...next[idx], institute: e.target.value };
                                                            setProfessionalInfo({ ...professionalInfo, certifications: next });
                                                        }}
                                                        placeholder="Institute"
                                                        className="flex-1 min-w-[120px] p-2 rounded-lg border border-gray-200 text-sm"
                                                    />
                                                    <label className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium cursor-pointer hover:bg-gray-100">
                                                        <input
                                                            type="file"
                                                            accept="image/*,.pdf"
                                                            className="hidden"
                                                            onChange={async (e) => {
                                                                const file = e.target.files?.[0];
                                                                if (!file) return;
                                                                setError('');
                                                                setDocumentUploadingLabel('certificate');
                                                                setDocumentUploadProgress(0);
                                                                try {
                                                                    const url = await api.upload.file(file, { forSignup: true, onProgress: (p) => setDocumentUploadProgress(p) });
                                                                    const next = [...professionalInfo.certifications];
                                                                    next[idx] = { ...next[idx], documentUrl: url };
                                                                    setProfessionalInfo({ ...professionalInfo, certifications: next });
                                                                } catch (err: any) {
                                                                    setError(err.message || 'Upload failed');
                                                                } finally {
                                                                    setDocumentUploadingLabel(null);
                                                                    setDocumentUploadProgress(null);
                                                                }
                                                                e.target.value = '';
                                                            }}
                                                        />
                                                        {cert.documentUrl ? '✓ Doc' : 'Upload'}
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={() => setProfessionalInfo({ ...professionalInfo, certifications: professionalInfo.certifications.filter((_, i) => i !== idx) })}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                    >
                                                        <XIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => setProfessionalInfo({ ...professionalInfo, certifications: [...professionalInfo.certifications, { name: '', date: '', institute: '', documentUrl: '' }] })}
                                                className="text-sm font-bold text-[#09BF44] hover:text-[#07a63a] flex items-center gap-1"
                                            >
                                                <Plus className="w-4 h-4" /> Add Certification
                                            </button>
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Government ID (required, only admins see this) (image/pdf)</label>
                                        {professionalInfo.idDocumentUrl ? (
                                            <div className="flex items-center gap-3 p-4 bg-green-50 border-2 border-[#09BF44]/40 rounded-xl">
                                                <CheckCircle className="w-6 h-6 text-[#09BF44] shrink-0" />
                                                <span className="flex-1 text-sm font-bold text-gray-800">Government ID uploaded</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setProfessionalInfo((prev) => ({ ...prev, idDocumentUrl: '' }))}
                                                    className="p-1.5 rounded-lg hover:bg-red-100 text-red-600"
                                                    aria-label="Remove"
                                                >
                                                    <XIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className={`block p-4 rounded-xl border-2 border-dashed transition-colors ${documentUploadingLabel === 'idDocument' ? 'border-[#09BF44] bg-green-50 cursor-wait' : 'bg-gray-50 border-gray-200 hover:border-[#09BF44]/50 cursor-pointer'}`}>
                                                <input
                                                    type="file"
                                                    accept="image/*,.pdf"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;
                                                        setError('');
                                                        setDocumentUploadingLabel('idDocument');
                                                        setDocumentUploadProgress(0);
                                                        try {
                                                            const url = await api.upload.file(file, { onProgress: (p) => setDocumentUploadProgress(p) });
                                                            setProfessionalInfo((prev) => ({ ...prev, idDocumentUrl: url }));
                                                        } catch (err: any) {
                                                            setError(err.message || 'Upload failed');
                                                        } finally {
                                                            setDocumentUploadingLabel(null);
                                                            setDocumentUploadProgress(null);
                                                        }
                                                        e.target.value = '';
                                                    }}
                                                    disabled={!!documentUploadingLabel}
                                                    className="hidden"
                                                />
                                                {documentUploadingLabel === 'idDocument' ? (
                                                    <div className="flex flex-col gap-2">
                                                        <span className="flex items-center gap-2 text-sm font-medium text-[#09BF44]">
                                                            <Loader2 className="w-5 h-5 animate-spin" /> Uploading... {documentUploadProgress ?? 0}%
                                                        </span>
                                                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                            <div className="h-full bg-[#09BF44] transition-all duration-300" style={{ width: `${documentUploadProgress ?? 0}%` }} />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="flex items-center gap-2 text-sm font-medium text-gray-600">
                                                        <Upload className="w-5 h-5" /> Click to upload ID Document
                                                    </span>
                                                )}
                                            </label>
                                        )}
                                    </div>
                                </div>

                                <button type="submit" className="w-full bg-[#09BF44] hover:bg-[#07a63a] text-white font-bold text-base md:text-lg p-3 md:p-4 rounded-xl transition-all flex items-center justify-center gap-2">
                                    Next: Portfolio <ChevronRight className="w-5 h-5" />
                                </button>
                            </form>
                        </div>
                    )}

                    {/* FREELANCER STEP 5: Starter Offer */}
                    {step === 'freelancer-step-3-offer' && (
                        <div className="py-3 md:py-4">
                            <div className="flex items-center justify-between gap-3 mb-4">
                                <Image src="/logos/logo-green.png" alt="Engezhaly" width={120} height={33} className="h-8 w-auto" priority />
                                <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors shrink-0 -m-2 ml-auto">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                            <div className="bg-gray-100 h-2 w-full rounded-full mb-6">
                                <div className="bg-[#09BF44] h-full rounded-full transition-all" style={{ width: '83.33%' }} />
                            </div>
                            <div className="flex items-center justify-center gap-2 mb-4 text-sm font-bold text-gray-400 uppercase tracking-wider">
                                <span className="text-[#09BF44]">Step 5</span><span>/</span><span>6</span>
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold text-center mb-2">Starter Offer</h3>
                            <p className="text-center text-gray-600 mb-6">Create your first offer. It will be published once your account is verified and approved.</p>

                            {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2 text-sm mb-4"><div className="w-2 h-2 bg-red-500 rounded-full"></div>{error}</div>}

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Offer Title</label>
                                    <input type="text" value={starterOffer.title} onChange={(e) => handleStarterOfferChange('title', e.target.value)} placeholder="I will design a professional logo..." className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">About this offer</label>
                                    <textarea value={starterOffer.description} onChange={(e) => handleStarterOfferChange('description', e.target.value)} placeholder="Describe what you will deliver..." rows={3} className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none resize-none" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                                        <div className="w-full p-3 bg-gray-100 rounded-xl text-gray-700 font-medium">{professionalInfo.category || '—'}</div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Sub Category</label>
                                        <select value={starterOffer.subCategory} onChange={(e) => handleStarterOfferChange('subCategory', e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none">
                                            <option value="">Select subcategory</option>
                                            {(() => {
                                                const subs = professionalInfo.category ? (CATEGORIES as Record<string, readonly string[]>)[professionalInfo.category] : null;
                                                return Array.isArray(subs) ? subs.map((sub: string) => <option key={sub} value={sub}>{sub}</option>) : null;
                                            })()}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Packages (min 500 EGP)</label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {starterOffer.packages.map((pkg, idx) => (
                                            <div key={pkg.type} className="border-2 border-gray-100 p-4 rounded-xl">
                                                <h5 className="font-bold text-sm text-[#09BF44] mb-3 uppercase">{pkg.type}</h5>
                                                <div className="space-y-2">
                                                    <input type="number" min={500} placeholder="Price" value={pkg.price || ''} onChange={(e) => handleStarterOfferPackage(idx, 'price', Number(e.target.value))} className="w-full p-2 bg-gray-50 rounded-lg border focus:border-[#09BF44] outline-none text-sm" />
                                                    <input type="number" min={1} placeholder="Days" value={pkg.days || ''} onChange={(e) => handleStarterOfferPackage(idx, 'days', Number(e.target.value))} className="w-full p-2 bg-gray-50 rounded-lg border focus:border-[#09BF44] outline-none text-sm" />
                                                    <input type="number" min={0} placeholder="Revisions" value={pkg.revisions ?? ''} onChange={(e) => handleStarterOfferPackage(idx, 'revisions', Number(e.target.value))} className="w-full p-2 bg-gray-50 rounded-lg border focus:border-[#09BF44] outline-none text-sm" />
                                                    <div>
                                                    <label className="text-xs font-bold text-gray-500">Features (press Enter for new line)</label>
                                                    <textarea
                                                        placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                                                        value={(Array.isArray(pkg.features) ? pkg.features : ['']).join('\n')}
                                                        onChange={(e) => {
                                                            const arr = e.target.value.split('\n');
                                                            handleStarterOfferFeatures(idx, arr.length ? arr : ['']);
                                                        }}
                                                        rows={2}
                                                        className="w-full p-2 bg-gray-50 rounded-lg border focus:border-[#09BF44] outline-none text-sm min-h-[72px] resize-y"
                                                    />
                                                    {Array.isArray(pkg.features) && pkg.features.filter(Boolean).length > 0 && (
                                                        <div className="flex flex-wrap gap-2 mt-2">
                                                            {pkg.features.filter(Boolean).map((f, i) => (
                                                                <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-[#09BF44]/10 text-[#09BF44] rounded-lg text-xs font-medium">{f}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500">This will be published once your account is verified and approved.</p>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button type="button" onClick={() => setStep('freelancer-step-3b')} className="flex-1 bg-gray-100 text-gray-600 font-bold p-4 rounded-xl hover:bg-gray-200">Back</button>
                                    <button type="button" onClick={() => { setSurveyStep(1); setStep('freelancer-step-3-survey'); }} className="flex-1 bg-[#09BF44] text-white font-bold p-4 rounded-xl hover:bg-[#07a63a] flex items-center justify-center gap-2">
                                        Next: Survey <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* FREELANCER STEP 6: Survey (last step) */}
                    {step === 'freelancer-step-3-survey' && (
                        <div className="py-3 md:py-4">
                            <div className="flex items-center justify-between gap-3 mb-4">
                                <Image src="/logos/logo-green.png" alt="Engezhaly" width={120} height={33} className="h-8 w-auto" priority />
                                <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors shrink-0 -m-2 ml-auto">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                            <div className="bg-gray-100 h-2 w-full rounded-full mb-6">
                                <div className="bg-[#09BF44] h-full rounded-full transition-all" style={{ width: '100%' }} />
                            </div>
                            <div className="flex items-center justify-center gap-2 mb-4 text-sm font-bold text-gray-400 uppercase tracking-wider">
                                <span className="text-[#09BF44]">Step 6</span><span>/</span><span>6</span> · Question {surveyStep}/5
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold text-center mb-2">Survey</h3>

                            {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2 text-sm mb-4"><div className="w-2 h-2 bg-red-500 rounded-full"></div>{error}</div>}

                            <div className="space-y-6">
                                {SURVEY_QUESTIONS.slice(surveyStep - 1, surveyStep).map((q) => (
                                    <div key={q.key}>
                                        <label className="block font-medium text-gray-700 mb-3">{q.label}</label>
                                        {q.type === 'select' ? (
                                            <select value={survey[q.key]} onChange={(e) => setSurvey({ ...survey, [q.key]: e.target.value })} className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none">
                                                <option value="">Select...</option>
                                                {q.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        ) : (
                                            <input type="text" value={survey[q.key]} onChange={(e) => setSurvey({ ...survey, [q.key]: e.target.value })} placeholder="Your answer..." className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none" />
                                        )}
                                    </div>
                                ))}
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button type="button" onClick={() => surveyStep > 1 ? setSurveyStep(s => s - 1) : setStep('freelancer-step-3-offer')} className="flex-1 bg-gray-100 text-gray-600 font-bold p-4 rounded-xl hover:bg-gray-200">Back</button>
                                    {surveyStep < 5 ? (
                                        <button type="button" onClick={() => setSurveyStep(s => s + 1)} className="flex-1 bg-[#09BF44] text-white font-bold p-4 rounded-xl hover:bg-[#07a63a] flex items-center justify-center gap-2">
                                            Next <ChevronRight className="w-5 h-5" />
                                        </button>
                                    ) : (
                                        <button type="button" onClick={handleFinalSubmit} disabled={loading} className="flex-1 bg-[#09BF44] text-white font-bold p-4 rounded-xl hover:bg-[#07a63a] flex items-center justify-center gap-2">
                                            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                                            Submit Application
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* FREELANCER STEP 3: Portfolio */}
                    {step === 'freelancer-step-3a' && (
                        <div className="py-3 md:py-4">
                            <div className="flex items-center justify-between gap-3 mb-4">
                                <Image src="/logos/logo-green.png" alt="Engezhaly" width={120} height={33} className="h-8 w-auto" priority />
                                <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors shrink-0 -m-2 ml-auto">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                            <div className="bg-gray-100 h-2 w-full rounded-full mb-6">
                                <div className="bg-[#09BF44] h-full rounded-full transition-all" style={{ width: '50%' }} />
                            </div>
                            <div className="flex items-center justify-center gap-2 mb-4 text-sm font-bold text-gray-400 uppercase tracking-wider">
                                <span className="text-[#09BF44]">Step 3</span><span>/</span><span>6</span>
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold text-center mb-2">Portfolio</h3>
                            <p className="text-center text-gray-600 mb-6">Add 1–3 projects to showcase your work. (Optional)</p>

                            {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2 text-sm mb-4"><div className="w-2 h-2 bg-red-500 rounded-full"></div>{error}</div>}

                            {(() => {
                                const subCategories: string[] = professionalInfo.category && (CATEGORIES as Record<string, readonly string[]>)[professionalInfo.category]
                                    ? [...(CATEGORIES as Record<string, readonly string[]>)[professionalInfo.category]]
                                    : [];
                                return (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {portfolioItems.map((item, idx) => (
                                                <div key={idx} className="group bg-white rounded-2xl border-2 border-gray-100 overflow-hidden hover:border-[#09BF44]/30 transition-all duration-200 shadow-sm hover:shadow-md">
                                                    <div className="relative aspect-video bg-gray-100">
                                                        {item.imageUrl ? (
                                                            <>
                                                                <Image src={item.imageUrl} alt={item.title || 'Portfolio'} fill className="object-cover" sizes="(max-width: 768px) 100vw, 400px" />
                                                                <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePortfolioImageUpload(e, idx)} disabled={portfolioImageUploading !== null} />
                                                                    <Upload className="w-8 h-8 text-white mb-1" />
                                                                    <span className="text-xs font-bold text-white">Change</span>
                                                                </label>
                                                            </>
                                                        ) : (
                                                            <label className={`absolute inset-0 flex flex-col items-center justify-center cursor-pointer transition-colors ${portfolioImageUploading === idx ? 'bg-[#09BF44]/10' : 'hover:bg-gray-50'}`}>
                                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePortfolioImageUpload(e, idx)} disabled={portfolioImageUploading !== null} />
                                                                {portfolioImageUploading === idx ? (
                                                                    <div className="text-center">
                                                                        <Loader2 className="w-10 h-10 animate-spin text-[#09BF44] mx-auto" />
                                                                        <span className="text-sm font-bold text-[#09BF44] block mt-2">{portfolioImageProgress}%</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-center text-gray-400">
                                                                        <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                                                                        <span className="text-sm font-bold">Click to upload</span>
                                                                    </div>
                                                                )}
                                                            </label>
                                                        )}
                                                        {item.subCategory && (
                                                            <span className="absolute top-2 left-2 px-2 py-1 bg-black/60 text-white text-xs font-bold rounded-lg">{item.subCategory}</span>
                                                        )}
                                                        {portfolioItems.length > 1 && (
                                                            <button type="button" onClick={() => setPortfolioItems(prev => prev.filter((_, i) => i !== idx))} className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/90 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600" aria-label="Remove">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="p-4 space-y-3">
                                                        <input value={item.title} onChange={(e) => setPortfolioItems(prev => { const n = [...prev]; n[idx] = { ...n[idx], title: e.target.value }; return n; })} placeholder="Project title" className="w-full px-3 py-2 rounded-xl border-2 border-transparent bg-gray-50 focus:bg-white focus:border-[#09BF44] outline-none font-bold text-gray-900 placeholder:text-gray-400 transition-colors" />
                                                        {subCategories.length > 0 && (
                                                            <select value={item.subCategory} onChange={(e) => setPortfolioItems(prev => { const n = [...prev]; n[idx] = { ...n[idx], subCategory: e.target.value }; return n; })} className="w-full px-3 py-2 rounded-xl border-2 border-transparent bg-gray-50 focus:bg-white focus:border-[#09BF44] outline-none text-sm text-gray-700">
                                                                <option value="">Select subcategory</option>
                                                                {subCategories.map((sub) => <option key={sub} value={sub}>{sub}</option>)}
                                                            </select>
                                                        )}
                                                        <textarea value={item.description} onChange={(e) => setPortfolioItems(prev => { const n = [...prev]; n[idx] = { ...n[idx], description: e.target.value }; return n; })} placeholder="Brief description of this work..." rows={2} className="w-full px-3 py-2 rounded-xl border-2 border-transparent bg-gray-50 focus:bg-white focus:border-[#09BF44] outline-none text-sm text-gray-700 resize-none placeholder:text-gray-400" />
                                                        <input value={item.link} onChange={(e) => setPortfolioItems(prev => { const n = [...prev]; n[idx] = { ...n[idx], link: e.target.value }; return n; })} placeholder="Project link (optional)" className="w-full px-3 py-2 rounded-xl border-2 border-transparent bg-gray-50 focus:bg-white focus:border-[#09BF44] outline-none text-sm text-gray-600 placeholder:text-gray-400" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {portfolioItems.length < 3 && (
                                            <button type="button" onClick={() => setPortfolioItems(prev => [...prev, { title: '', description: '', imageUrl: '', link: '', subCategory: '' }])} className="w-full py-4 border-2 border-dashed border-[#07a63a] rounded-xl text-[#07a63a] font-bold text-lg hover:border-[#09BF44] hover:text-[#09BF44] hover:bg-[#09BF44]/10 transition-all flex items-center justify-center gap-3">
                                                <Plus className="w-6 h-6" /> Add another project
                                            </button>
                                        )}
                                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                            <button type="button" onClick={() => setStep('freelancer-step-2')} className="flex-1 bg-gray-100 text-gray-600 font-bold p-4 rounded-xl hover:bg-gray-200">Back</button>
                                            <button type="button" onClick={() => setStep('freelancer-step-3b')} className="flex-1 bg-[#09BF44] text-white font-bold p-4 rounded-xl hover:bg-[#07a63a] flex items-center justify-center gap-2">
                                                Next: Withdrawal <ChevronRight className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {/* FREELANCER STEP 4: Withdrawal Method */}
                    {step === 'freelancer-step-3b' && (
                        <div className="py-3 md:py-4">
                            <div className="flex items-center justify-between gap-3 mb-4">
                                <Image src="/logos/logo-green.png" alt="Engezhaly" width={120} height={33} className="h-8 w-auto" priority />
                                <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors shrink-0 -m-2 ml-auto">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                            <div className="bg-gray-100 h-2 w-full rounded-full mb-6">
                                <div className="bg-[#09BF44] h-full rounded-full transition-all duration-500" style={{ width: '66.67%' }} />
                            </div>
                            <div className="flex items-center justify-center gap-2 mb-4 text-sm font-bold text-gray-400 uppercase tracking-wider">
                                <span className="text-[#09BF44]">Step 4</span>
                                <span>/</span>
                                <span>6</span>
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold text-center mb-2">Where would you like your money transferred?</h3>
                            <p className="text-center text-gray-600 mb-6">Add Vodafone Cash, InstaPay, or bank account to receive withdrawals.</p>

                            {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2 text-sm mb-4"><div className="w-2 h-2 bg-red-500 rounded-full"></div>{error}</div>}

                            <div className="space-y-6 mb-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Type</label>
                                    <div className="flex flex-wrap gap-2">
                                        {(['vodafone_cash', 'instapay', 'bank'] as const).map(m => (
                                            <button key={m} type="button" onClick={() => setWithdrawalMethod({ ...withdrawalMethod, method: m })} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-colors ${withdrawalMethod.method === m ? 'bg-[#09BF44] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                                {m.replace('_', ' ').toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {(withdrawalMethod.method === 'instapay' || withdrawalMethod.method === 'vodafone_cash') && (
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
                                        <input type="tel" value={withdrawalMethod.phoneNumber} onChange={(e) => setWithdrawalMethod({ ...withdrawalMethod, phoneNumber: e.target.value })} placeholder="01XXXXXXXXX" className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none" />
                                    </div>
                                )}
                                {withdrawalMethod.method === 'bank' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Account Number</label>
                                            <input type="text" value={withdrawalMethod.accountNumber} onChange={(e) => setWithdrawalMethod({ ...withdrawalMethod, accountNumber: e.target.value })} placeholder="Account number" className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Bank Name</label>
                                            <input type="text" value={withdrawalMethod.bankName} onChange={(e) => setWithdrawalMethod({ ...withdrawalMethod, bankName: e.target.value })} placeholder="e.g. CIB, NBE" className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none" />
                                        </div>
                                    </>
                                )}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Do you have any notes? (optional)</label>
                                    <textarea value={signupNotes} onChange={(e) => setSignupNotes(e.target.value)} placeholder="Anything else you'd like us to know..." rows={3} className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none resize-none" />
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                <button onClick={() => setStep('freelancer-step-3a')} className="flex-1 bg-gray-100 text-gray-600 font-bold p-4 rounded-xl hover:bg-gray-200 transition-all">Back</button>
                                <button onClick={() => setStep('freelancer-step-3-offer')} className="flex-1 bg-[#09BF44] text-white font-bold p-4 rounded-xl hover:bg-[#07a63a] transition-all flex items-center justify-center gap-2">
                                    Next: Starter Offer <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* FREELANCER STEP 4: Under Review */}
                    {step === 'freelancer-step-4' && (
                        <div className="text-center py-12">
                            <div className="flex justify-end mb-4">
                                <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors -m-2">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-12 h-12 text-[#09BF44]" />
                            </div>
                            <h2 className="text-3xl font-black text-gray-900 mb-4">Profile Under Review!</h2>
                            <p className="text-lg text-gray-600 mb-4 max-w-lg mx-auto">
                                Our team is reviewing your application. You will be notified once your profile is approved and you can start creating offers.
                            </p>
                            <p className="text-sm text-gray-500 mb-8 max-w-lg mx-auto">
                                Please check your email to verify your account. Once approved, log in again to access your dashboard.
                            </p>
                            <button
                                onClick={() => {
                                    onClose();
                                    // Reload so header re-reads from localStorage (we cleared it for pending freelancers)
                                    window.location.href = '/';
                                }}
                                className="bg-[#09BF44] text-white font-bold px-8 py-3 rounded-full hover:bg-[#07a63a] transition-colors"
                            >
                                Go Home
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
