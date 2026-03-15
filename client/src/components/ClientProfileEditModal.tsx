"use client";

import { useState, useEffect, useRef } from 'react';
import { X, Upload, Loader2, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';
import Image from 'next/image';

interface ClientProfileEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    profile: any;
    onSave: (data: any) => void;
}

export default function ClientProfileEditModal({ isOpen, onClose, profile, onSave }: ClientProfileEditModalProps) {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        businessType: 'personal',
        profilePicture: '' as string
    });
    const [pfpUploading, setPfpUploading] = useState(false);
    const prevIsOpenRef = useRef(false);

    useEffect(() => {
        if (isOpen && !prevIsOpenRef.current && profile) {
            setTimeout(() => {
                setFormData({
                    firstName: profile.firstName || '',
                    lastName: profile.lastName || '',
                    email: profile.email || '',
                    phoneNumber: profile.phoneNumber || '',
                    businessType: profile.businessType || 'personal',
                    profilePicture: profile.clientProfile?.profilePicture || ''
                });
            }, 0);
        }
        prevIsOpenRef.current = isOpen;
    }, [isOpen, profile]);

    const handlePfpUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) return;
        if (!file.type.startsWith('image/')) return;
        setPfpUploading(true);
        try {
            const url = await api.upload.file(file);
            setFormData((prev) => ({ ...prev, profilePicture: url }));
        } catch {
            // ignore
        } finally {
            setPfpUploading(false);
            e.target.value = '';
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex justify-between items-center">
                    <h2 className="text-2xl font-black text-gray-900">Edit Profile</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Profile Picture</label>
                        <div className="flex items-center gap-4">
                            <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-gray-300 rounded-full cursor-pointer hover:border-[#09BF44] transition-colors bg-gray-50 overflow-hidden shrink-0">
                                <input type="file" accept="image/*" className="hidden" onChange={handlePfpUpload} />
                                {pfpUploading ? (
                                    <Loader2 className="w-8 h-8 text-[#09BF44] animate-spin" />
                                ) : formData.profilePicture ? (
                                    <Image src={formData.profilePicture} alt="Profile" width={96} height={96} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center text-gray-400">
                                        <Upload className="w-8 h-8 mb-1" />
                                        <span className="text-xs">Add photo</span>
                                    </div>
                                )}
                            </label>
                            {formData.profilePicture && !pfpUploading && (
                                <button type="button" onClick={() => setFormData((p) => ({ ...p, profilePicture: '' }))} className="text-sm text-red-600 font-bold hover:underline">
                                    Remove
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">First Name</label>
                            <input
                                type="text"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                required
                                className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Last Name</label>
                            <input
                                type="text"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                required
                                className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                        <input
                            type="tel"
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                            className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Business Type</label>
                        <select
                            value={formData.businessType}
                            onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                            className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none"
                        >
                            <option value="personal">Personal</option>
                            <option value="company">Company</option>
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 bg-[#09BF44] text-white font-bold py-3 rounded-xl hover:bg-[#07a63a] transition-colors"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
