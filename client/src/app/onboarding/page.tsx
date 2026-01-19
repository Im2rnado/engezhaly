"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Loader2, CheckCircle, ChevronRight } from 'lucide-react';

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState(2); // Start at Step 2 (Step 1 is signup)
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Step 2 State
    const [professionalInfo, setProfessionalInfo] = useState({
        category: '',
        experienceYears: '',
        certificates: '', // URL string for now
        skills: '', // comma separated for now
        bio: '',
        idDocument: ''
    });

    // Step 3 State
    const [survey, setSurvey] = useState({
        isFullTime: false,
        speedQualityCommitment: 'Yes' // Default
    });

    const [pricing, setPricing] = useState({
        basic: { price: 500, days: 3 },
        standard: { price: 1000, days: 5 },
        premium: { price: 2000, days: 7 }
    });

    useEffect(() => {
        // Check auth
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!token || user.role !== 'freelancer') {
            router.push('/');
        }
    }, [router]);

    const handleProfessionalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setProfessionalInfo({ ...professionalInfo, [e.target.name]: e.target.value });
    };

    const handleStep2Submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!professionalInfo.bio) { setError('Please describe yourself'); return; }
        setStep(3);
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
                certificates: [professionalInfo.certificates],
                skills: professionalInfo.skills.split(',').map(s => s.trim()),
                bio: professionalInfo.bio,
                idDocument: professionalInfo.idDocument,
                surveyResponses: {
                    isFullTime: survey.isFullTime,
                    speedQualityCommitment: survey.speedQualityCommitment
                },
                starterPricing: pricing
            });
            setStep(4);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
                {/* Progress Bar */}
                <div className="bg-gray-100 h-2 w-full">
                    <div
                        className="bg-[#09BF44] h-full transition-all duration-500"
                        style={{ width: `${(step / 4) * 100}%` }}
                    />
                </div>

                <div className="p-8 md:p-12">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-black text-gray-900 mb-2">
                            {step === 2 && "Professional Info"}
                            {step === 3 && "Survey & Pricing"}
                            {step === 4 && "Application Under Review"}
                        </h1>
                        <p className="text-gray-500">
                            {step === 2 && "Tell us about your skills and experience."}
                            {step === 3 && "Set your commitment and base rates."}
                            {step === 4 && "Hang tight! We are checking your profile."}
                        </p>
                    </div>

                    {error && <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-6">{error}</div>}

                    {/* STEP 2: Professional Info */}
                    {step === 2 && (
                        <form onSubmit={handleStep2Submit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                                <select
                                    name="category"
                                    required
                                    value={professionalInfo.category}
                                    onChange={handleProfessionalChange}
                                    className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none"
                                >
                                    <option value="">Select a Category</option>
                                    <option value="Development">Development</option>
                                    <option value="Design">Design</option>
                                    <option value="Marketing">Marketing</option>
                                    <option value="Video">Video</option>
                                    <option value="AI">AI</option>
                                    <option value="Writing">Writing</option>
                                    <option value="Voice Over">Voice Over</option>
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
                                    className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none h-32"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Years of Experience</label>
                                <input
                                    type="number"
                                    name="experienceYears"
                                    required
                                    min="0"
                                    value={professionalInfo.experienceYears}
                                    onChange={handleProfessionalChange}
                                    className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Skills (Comma separated)</label>
                                <input
                                    type="text"
                                    name="skills"
                                    required
                                    placeholder="e.g. React, Photoshop, SEO"
                                    value={professionalInfo.skills}
                                    onChange={handleProfessionalChange}
                                    className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Certificate URL (Optional)</label>
                                    <input
                                        type="text"
                                        name="certificates"
                                        placeholder="https://..."
                                        value={professionalInfo.certificates}
                                        onChange={handleProfessionalChange}
                                        className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">ID Document URL (Hidden)</label>
                                    <input
                                        type="text"
                                        name="idDocument"
                                        placeholder="https://... (Only Admins see this)"
                                        value={professionalInfo.idDocument}
                                        onChange={handleProfessionalChange}
                                        className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none"
                                    />
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-[#09BF44] text-white font-bold text-lg p-4 rounded-xl hover:bg-[#07a63a] transition-all flex items-center justify-center gap-2">
                                Next Step <ChevronRight className="w-5 h-5" />
                            </button>
                        </form>
                    )}

                    {/* STEP 3: Survey & Pricing */}
                    {step === 3 && (
                        <div className="space-y-8">
                            {/* Video Placeholder */}
                            <div className="bg-gray-900 rounded-xl p-8 text-center text-white mb-8">
                                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer hover:bg-white/20 transition-colors">
                                    <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-white border-b-8 border-b-transparent ml-1"></div>
                                </div>
                                <h3 className="font-bold text-lg">Watch: How Packages Work</h3>
                                <p className="text-gray-400 text-sm">Sherif&apos;s Guide</p>
                            </div>

                            {/* Survey */}
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-gray-900">Availability & Commitment</h3>

                                <div className="flex items-center gap-4">
                                    <span className="font-medium text-gray-700">Are you working Full-time?</span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setSurvey({ ...survey, isFullTime: true })}
                                            className={`px-4 py-2 rounded-lg font-bold border-2 ${survey.isFullTime ? 'bg-green-100 border-[#09BF44] text-[#09BF44]' : 'bg-gray-50 border-transparent'}`}
                                        >
                                            Yes
                                        </button>
                                        <button
                                            onClick={() => setSurvey({ ...survey, isFullTime: false })}
                                            className={`px-4 py-2 rounded-lg font-bold border-2 ${!survey.isFullTime ? 'bg-green-100 border-[#09BF44] text-[#09BF44]' : 'bg-gray-50 border-transparent'}`}
                                        >
                                            No
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <span className="block font-medium text-gray-700 mb-2">Speed/Quality Commitment?</span>
                                    <select
                                        value={survey.speedQualityCommitment}
                                        onChange={(e) => setSurvey({ ...survey, speedQualityCommitment: e.target.value })}
                                        className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none"
                                    >
                                        <option value="Yes">Yes, I commit to high quality & speed</option>
                                        <option value="Maybe">Maybe</option>
                                        <option value="No">No</option>
                                    </select>
                                </div>
                            </div>

                            {/* Pricing Table */}
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">Starter Pricing Guide</h3>
                                <p className="text-sm text-gray-500 mb-4">Set your base rates for approval. Min 500 EGP.</p>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {(['basic', 'standard', 'premium'] as const).map((tier) => (
                                        <div key={tier} className="border-2 border-gray-100 p-4 rounded-xl">
                                            <h4 className="font-bold text-lg capitalize mb-3 text-[#09BF44]">{tier}</h4>

                                            <div className="space-y-3">
                                                <div>
                                                    <label className="text-xs font-bold text-gray-500">Price (EGP)</label>
                                                    <input
                                                        type="number"
                                                        min="500"
                                                        value={pricing[tier].price}
                                                        onChange={(e) => handlePricingChange(tier, 'price', e.target.value)}
                                                        className="w-full p-2 bg-gray-50 rounded-lg border focus:border-[#09BF44] outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-gray-500">Delivery (Days)</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={pricing[tier].days}
                                                        onChange={(e) => handlePricingChange(tier, 'days', e.target.value)}
                                                        className="w-full p-2 bg-gray-50 rounded-lg border focus:border-[#09BF44] outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button onClick={() => setStep(2)} className="flex-1 bg-gray-100 text-gray-600 font-bold p-4 rounded-xl hover:bg-gray-200 transition-all">
                                    Back
                                </button>
                                <button onClick={handleFinalSubmit} disabled={loading} className="flex-1 bg-[#09BF44] text-white font-bold p-4 rounded-xl hover:bg-[#07a63a] transition-all flex items-center justify-center gap-2">
                                    {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                                    Submit Application
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: Pending Review */}
                    {step === 4 && (
                        <div className="text-center py-12">
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-12 h-12 text-[#09BF44]" />
                            </div>
                            <h2 className="text-3xl font-black text-gray-900 mb-4">Profile Under Review!</h2>
                            <p className="text-xl text-gray-600 mb-8 max-w-lg mx-auto">
                                Our team is reviewing your application. You will be notified once your profile is approved and you can start creating Projects.
                            </p>
                            <button
                                onClick={() => router.push('/')}
                                className="bg-gray-900 text-white font-bold px-8 py-3 rounded-full hover:bg-gray-800 transition-colors"
                            >
                                Go to Home
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
