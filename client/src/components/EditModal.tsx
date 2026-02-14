"use client";

import React, { useState } from 'react';
import { X } from 'lucide-react';

interface EditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    title: string;
    fields: Array<{
        name: string;
        label: string;
        type?: 'text' | 'select' | 'textarea';
        options?: string[];
        defaultValue: string | boolean;
    }>;
}

export default function EditModal({ isOpen, onClose, onSave, title, fields }: EditModalProps) {
    const [formData, setFormData] = useState<Record<string, any>>({});

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        setFormData({});
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {fields.map((field) => (
                        <div key={field.name}>
                            <label className="block text-sm font-bold text-gray-700 mb-2">{field.label}</label>
                            {field.type === 'select' ? (
                                <select
                                    name={field.name}
                                    defaultValue={field.defaultValue ? String(field.defaultValue) : ''}
                                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                                    className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all"
                                >
                                    {field.options?.map(opt => (
                                        <option key={opt} value={opt}>{opt || '(None)'}</option>
                                    ))}
                                </select>
                            ) : field.type === 'textarea' ? (
                                <textarea
                                    name={field.name}
                                    defaultValue={String(field.defaultValue)}
                                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                                    className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all h-20 resize-none"
                                />
                            ) : (
                                <input
                                    type={field.type || 'text'}
                                    name={field.name}
                                    defaultValue={String(field.defaultValue)}
                                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                                    className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] focus:bg-white outline-none transition-all"
                                />
                            )}
                        </div>
                    ))}

                    <div className="flex gap-3 mt-6">
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
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
