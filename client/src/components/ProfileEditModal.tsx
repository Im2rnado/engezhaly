"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, X as XIcon, Upload, Trash2, User, Briefcase, Award } from 'lucide-react';
import Image from 'next/image';
import { api } from '@/lib/api';

interface ProfileEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    profile: any;
    mainCategories: string[];
}

export default function ProfileEditModal({ isOpen, onClose, onSave, profile, mainCategories }: ProfileEditModalProps) {
    const [formData, setFormData] = useState({
        bio: '',
        category: '',
        experienceYears: '',
        skills: [] as string[],
        certifications: [] as { name: string; date: string; institute: string; documentUrl: string }[]
    });
    const [skillInput, setSkillInput] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [profilePicture, setProfilePicture] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const prevIsOpenRef = useRef(false);

    useEffect(() => {
        if (isOpen && !prevIsOpenRef.current && profile) {
            setTimeout(() => {
                const certs = profile.freelancerProfile?.certifications || [];
                setFormData({
                    bio: profile.freelancerProfile?.bio || '',
                    category: profile.freelancerProfile?.category || '',
                    experienceYears: String(profile.freelancerProfile?.experienceYears || 0),
                    skills: profile.freelancerProfile?.skills || [],
                    certifications: certs.map((c: any) => ({
                        name: c.name || '',
                        date: c.date ? (typeof c.date === 'string' ? c.date : c.date?.slice?.(0, 10)) : '',
                        institute: c.institute || '',
                        documentUrl: c.documentUrl || ''
                    }))
                });
                setProfilePicture(profile.freelancerProfile?.profilePicture || null);
                setSkillInput('');
                setErrors({});
            }, 0);
        }
        prevIsOpenRef.current = isOpen;
    }, [isOpen, profile]);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        const experienceNum = Number(formData.experienceYears);
        if (isNaN(experienceNum) || experienceNum < 0 || experienceNum > 100) {
            newErrors.experienceYears = 'Experience must be 0–100';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleAddSkill = () => {
        const skill = skillInput.trim();
        if (skill && !formData.skills.includes(skill)) {
            setFormData({ ...formData, skills: [...formData.skills, skill] });
            setSkillInput('');
        }
    };

    const handleRemoveSkill = (skillToRemove: string) => {
        setFormData({ ...formData, skills: formData.skills.filter(s => s !== skillToRemove) });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setErrors(prev => ({ ...prev, profilePicture: 'Image must be under 5MB' }));
                return;
            }
            if (!file.type.startsWith('image/')) {
                setErrors(prev => ({ ...prev, profilePicture: 'Please upload an image' }));
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePicture(reader.result as string);
                setErrors(prev => ({ ...prev, profilePicture: '' }));
            };
            reader.readAsDataURL(file);
        }
    };

    const removeProfilePicture = () => {
        setProfilePicture(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        onSave({
            bio: formData.bio,
            category: formData.category || undefined,
            experienceYears: Number(formData.experienceYears),
            skills: formData.skills,
            profilePicture: profilePicture || undefined,
            certifications: formData.certifications.filter(c => c.name?.trim())
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                    <h2 className="text-xl font-black text-gray-900">Edit Profile</h2>
                    <button onClick={onClose} className="p-2 hover:bg-[#09BF44]/10 rounded-xl transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Section: Profile Photo */}
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <User className="w-4 h-4 text-gray-500" />
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Photo</h3>
                        </div>
                        <div className="flex items-center gap-4">
                            {profilePicture ? (
                                <div className="relative shrink-0">
                                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#09BF44]">
                                        <Image src={profilePicture} alt="Profile" width={80} height={80} className="w-full h-full object-cover" />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={removeProfilePicture}
                                        className="absolute -top-1 -right-1 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                                    >
                                        <XIcon className="w-3 h-3" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-20 h-20 rounded-full border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-[#09BF44] hover:bg-[#09BF44]/5 transition-colors shrink-0"
                                >
                                    <Upload className="w-6 h-6 mb-0.5" />
                                    <span className="text-[10px] font-bold">Add</span>
                                </button>
                            )}
                            <div>
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                <p className="text-sm text-gray-500">Optional. Max 5MB. JPG, PNG.</p>
                                {errors.profilePicture && <p className="text-red-500 text-xs mt-1">{errors.profilePicture}</p>}
                            </div>
                        </div>
                    </section>

                    {/* Section: About */}
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <User className="w-4 h-4 text-gray-500" />
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">About You</h3>
                        </div>
                        <textarea
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            rows={4}
                            placeholder="Describe yourself, your expertise, and what makes you unique..."
                            className="w-full p-3 rounded-xl border-2 border-gray-100 focus:border-[#09BF44] focus:bg-white bg-gray-50 outline-none resize-none text-gray-900 placeholder:text-gray-400"
                        />
                    </section>

                    {/* Section: Professional */}
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <Briefcase className="w-4 h-4 text-gray-500" />
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Professional</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full p-3 rounded-xl border-2 border-gray-100 focus:border-[#09BF44] bg-gray-50 outline-none text-gray-900"
                                    >
                                        <option value="">Select</option>
                                        {mainCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5">Experience (Years)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        required
                                        value={formData.experienceYears}
                                        onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                                        className={`w-full p-3 rounded-xl border-2 ${errors.experienceYears ? 'border-red-300' : 'border-gray-100'} focus:border-[#09BF44] bg-gray-50 outline-none text-gray-900`}
                                    />
                                    {errors.experienceYears && <p className="text-red-500 text-xs mt-1">{errors.experienceYears}</p>}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5">Skills</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={skillInput}
                                        onChange={(e) => setSkillInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                                        placeholder="Type and press Enter"
                                        className="flex-1 p-3 rounded-xl border-2 border-gray-100 focus:border-[#09BF44] bg-gray-50 outline-none text-gray-900 placeholder:text-gray-400"
                                    />
                                    <button type="button" onClick={handleAddSkill} className="px-4 py-3 bg-[#09BF44] text-white rounded-xl font-bold hover:bg-[#07a63a] shrink-0">
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                                {formData.skills.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {formData.skills.map((skill, idx) => (
                                            <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                                                {skill}
                                                <button type="button" onClick={() => handleRemoveSkill(skill)} className="hover:bg-gray-200 rounded-full p-0.5">
                                                    <XIcon className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Section: Certifications */}
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <Award className="w-4 h-4 text-gray-500" />
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Certifications</h3>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">Name, date, institute. Optional document upload.</p>
                        <div className="space-y-3">
                            {formData.certifications.map((cert, idx) => (
                                <div key={idx} className="p-4 bg-gray-50 rounded-xl space-y-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        <input
                                            value={cert.name}
                                            onChange={(e) => {
                                                const next = [...formData.certifications];
                                                next[idx] = { ...next[idx], name: e.target.value };
                                                setFormData({ ...formData, certifications: next });
                                            }}
                                            placeholder="Name"
                                            className="sm:col-span-2 p-2.5 rounded-lg border border-gray-200 bg-white text-sm"
                                        />
                                        <input
                                            type="date"
                                            value={cert.date}
                                            onChange={(e) => {
                                                const next = [...formData.certifications];
                                                next[idx] = { ...next[idx], date: e.target.value };
                                                setFormData({ ...formData, certifications: next });
                                            }}
                                            className="p-2.5 rounded-lg border border-gray-200 bg-white text-sm"
                                        />
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                        <input
                                            value={cert.institute}
                                            onChange={(e) => {
                                                const next = [...formData.certifications];
                                                next[idx] = { ...next[idx], institute: e.target.value };
                                                setFormData({ ...formData, certifications: next });
                                            }}
                                            placeholder="Institute"
                                            className="flex-1 min-w-[120px] p-2.5 rounded-lg border border-gray-200 bg-white text-sm"
                                        />
                                        <label className="px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium cursor-pointer hover:bg-gray-100 shrink-0">
                                            <input type="file" accept="image/*,.pdf" className="hidden" onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                try {
                                                    const url = await api.upload.file(file);
                                                    const next = [...formData.certifications];
                                                    next[idx] = { ...next[idx], documentUrl: url };
                                                    setFormData({ ...formData, certifications: next });
                                                } catch (err: any) {
                                                    setErrors(prev => ({ ...prev, certDoc: err.message }));
                                                }
                                                e.target.value = '';
                                            }} />
                                            {cert.documentUrl ? '✓ Document' : 'Upload doc'}
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, certifications: formData.certifications.filter((_, i) => i !== idx) })}
                                            className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, certifications: [...formData.certifications, { name: '', date: '', institute: '', documentUrl: '' }] })}
                                className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm font-bold text-[#09BF44] hover:border-[#09BF44] hover:bg-[#09BF44]/5 transition-colors flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> Add Certification
                            </button>
                        </div>
                    </section>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl font-bold border-2 border-gray-200 text-gray-700 hover:bg-[#09BF44]/10 hover:border-[#09BF44]/30 hover:text-[#09BF44]">
                            Cancel
                        </button>
                        <button type="submit" className="flex-1 py-3 rounded-xl font-bold bg-[#09BF44] text-white hover:bg-[#07a63a]">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
