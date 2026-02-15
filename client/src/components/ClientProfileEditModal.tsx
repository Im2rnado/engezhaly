"use client";

import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

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
        businessType: 'personal'
    });
    const prevIsOpenRef = useRef(false);

    useEffect(() => {
        if (isOpen && !prevIsOpenRef.current && profile) {
            setTimeout(() => {
                setFormData({
                    firstName: profile.firstName || '',
                    lastName: profile.lastName || '',
                    email: profile.email || '',
                    phoneNumber: profile.phoneNumber || '',
                    businessType: profile.businessType || 'personal'
                });
            }, 0);
        }
        prevIsOpenRef.current = isOpen;
    }, [isOpen, profile]);

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
