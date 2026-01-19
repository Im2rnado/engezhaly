"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, X as XIcon, Upload } from 'lucide-react';
import Image from 'next/image';

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
        skills: [] as string[]
    });
    const [skillInput, setSkillInput] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [profilePicture, setProfilePicture] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const prevIsOpenRef = useRef(false);

    useEffect(() => {
        // Only update form data when modal opens (transitions from closed to open)
        if (isOpen && !prevIsOpenRef.current && profile) {
            // Use setTimeout to defer state updates outside the effect
            setTimeout(() => {
                setFormData({
                    bio: profile.freelancerProfile?.bio || '',
                    category: profile.freelancerProfile?.category || '',
                    experienceYears: String(profile.freelancerProfile?.experienceYears || 0),
                    skills: profile.freelancerProfile?.skills || []
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
            newErrors.experienceYears = 'Experience must be a number between 0 and 100';
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
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setErrors({ ...errors, profilePicture: 'Image size must be less than 5MB' });
                return;
            }
            if (!file.type.startsWith('image/')) {
                setErrors({ ...errors, profilePicture: 'Please upload an image file' });
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePicture(reader.result as string);
                setErrors({ ...errors, profilePicture: '' });
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }

        onSave({
            bio: formData.bio,
            category: formData.category || undefined,
            experienceYears: Number(formData.experienceYears),
            skills: formData.skills,
            profilePicture: profilePicture || undefined
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                    {/* Profile Picture */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Profile Picture</label>
                        {profilePicture ? (
                            <div className="relative inline-block">
                                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#09BF44]">
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
                                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                >
                                    <XIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                    className="w-24 h-24 mx-auto p-6 border-2 border-dashed border-gray-200 rounded-full text-center text-gray-500 hover:border-[#09BF44] hover:bg-green-50 transition-colors cursor-pointer flex flex-col items-center justify-center"
                            >
                                <Upload className="w-8 h-8 mb-2 text-gray-400" />
                                <p className="text-xs font-bold">Upload</p>
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                        {errors.profilePicture && (
                            <p className="text-red-500 text-xs mt-1">{errors.profilePicture}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">Optional. Max 5MB</p>
                    </div>

                    {/* Bio */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Bio</label>
                        <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            rows={4}
                            placeholder="Describe yourself, your expertise, and what makes you unique..."
                            className="w-full p-3 h-16 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all resize-none"
                        />
                    </div>

                    {/* Category */}
                    <div className="flex justify-between gap-4">
                        <div className="w-[40%]">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all"
                            >
                                <option value="">Select Category</option>
                                {mainCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        {/* Experience */}
                        <div className="w-[40%]">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Experience (Years)</label>
                            <input
                                type="number"
                                name="experienceYears"
                                min="0"
                                max="100"
                                required
                                value={formData.experienceYears}
                                onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                                className={`w-full p-3 bg-gray-50 rounded-xl border-2 ${errors.experienceYears ? 'border-red-300' : 'border-transparent'} focus:border-[#09BF44] focus:bg-white outline-none transition-all`}
                            />
                            {errors.experienceYears && (
                                <p className="text-red-500 text-xs mt-1">{errors.experienceYears}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">Must be between 0 and 100</p>
                        </div>
                    </div>

                    {/* Skills */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Skills</label>
                        <div className="flex gap-2 mb-3">
                            <input
                                type="text"
                                value={skillInput}
                                onChange={(e) => setSkillInput(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddSkill();
                                    }
                                }}
                                placeholder="Add a skill and press Enter"
                                className="flex-1 p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all"
                            />
                            <button
                                type="button"
                                onClick={handleAddSkill}
                                className="bg-[#09BF44] text-white px-4 py-3 rounded-xl font-bold hover:bg-[#07a63a] transition-colors flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> Add
                            </button>
                        </div>
                        {formData.skills.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {formData.skills.map((skill, idx) => (
                                    <span
                                        key={idx}
                                        className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2"
                                    >
                                        {skill}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveSkill(skill)}
                                            className="hover:bg-gray-200 rounded-full p-0.5 transition-colors"
                                        >
                                            <XIcon className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 border-2 border-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 bg-black text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
