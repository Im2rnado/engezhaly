"use client";

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api';
import { Loader2, Upload, Plus, Trash2, ImageIcon, Save } from 'lucide-react';
import { useModal } from '@/context/ModalContext';
import { CATEGORIES } from '@/lib/categories';

export type PortfolioItem = { title: string; description: string; imageUrl: string; link: string; subCategory: string };

function PortfolioCard({
    item,
    index,
    isNew,
    subCategories,
    imageUploading,
    imageProgress,
    onImageUpload,
    onUpdate,
    onRemove,
    onNewItemChange,
    onSave,
    saving,
}: {
    item: PortfolioItem;
    index: number;
    isNew: boolean;
    subCategories: string[];
    imageUploading: number | null;
    imageProgress: number;
    onImageUpload: (e: React.ChangeEvent<HTMLInputElement>, index: number | 'new') => void;
    onUpdate: (index: number, field: keyof PortfolioItem, value: string) => void;
    onRemove: (index: number) => void;
    onNewItemChange: (updates: Partial<PortfolioItem>) => void;
    onSave?: () => void;
    saving?: boolean;
}) {
    return (
        <div className="group bg-white rounded-2xl border-2 border-gray-100 overflow-hidden hover:border-[#09BF44]/30 transition-all duration-200 shadow-sm hover:shadow-md">
            <div className="relative aspect-video bg-gray-100">
                {item.imageUrl ? (
                    <>
                        <Image src={item.imageUrl} alt={item.title || 'Portfolio'} fill className="object-cover" sizes="(max-width: 768px) 100vw, 400px" />
                        <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => onImageUpload(e, isNew ? 'new' : index)} disabled={imageUploading !== null} />
                            <Upload className="w-8 h-8 text-white mb-1" />
                            <span className="text-xs font-bold text-white">Change</span>
                        </label>
                    </>
                ) : (
                    <label className={`absolute inset-0 flex flex-col items-center justify-center cursor-pointer transition-colors ${imageUploading === (isNew ? -1 : index) ? 'bg-[#09BF44]/10' : 'hover:bg-gray-50'}`}>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => onImageUpload(e, isNew ? 'new' : index)} disabled={imageUploading !== null} />
                        {imageUploading === (isNew ? -1 : index) ? (
                            <div className="text-center">
                                <Loader2 className="w-10 h-10 animate-spin text-[#09BF44] mx-auto" />
                                <span className="text-sm font-bold text-[#09BF44] block mt-2">{imageProgress}%</span>
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
                    <span className="absolute top-2 left-2 px-2 py-1 bg-black/60 text-white text-xs font-bold rounded-lg">
                        {item.subCategory}
                    </span>
                )}
                {!isNew && (
                    <button
                        onClick={() => onRemove(index)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/90 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        aria-label="Remove"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>
            <div className="p-4 space-y-3">
                <input
                    value={item.title}
                    onChange={(e) => isNew ? onNewItemChange({ title: e.target.value }) : onUpdate(index, 'title', e.target.value)}
                    placeholder="Project title"
                    className="w-full px-3 py-2 rounded-xl border-2 border-transparent bg-gray-50 focus:bg-white focus:border-[#09BF44] outline-none font-bold text-gray-900 placeholder:text-gray-400 transition-colors"
                />
                {subCategories.length > 0 && (
                    <select
                        value={item.subCategory}
                        onChange={(e) => isNew ? onNewItemChange({ subCategory: e.target.value }) : onUpdate(index, 'subCategory', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border-2 border-transparent bg-gray-50 focus:bg-white focus:border-[#09BF44] outline-none text-sm text-gray-700"
                    >
                        <option value="">Select subcategory</option>
                        {subCategories.map((sub) => (
                            <option key={sub} value={sub}>{sub}</option>
                        ))}
                    </select>
                )}
                <textarea
                    value={item.description}
                    onChange={(e) => isNew ? onNewItemChange({ description: e.target.value }) : onUpdate(index, 'description', e.target.value)}
                    placeholder="Brief description of this work..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl border-2 border-transparent bg-gray-50 focus:bg-white focus:border-[#09BF44] outline-none text-sm text-gray-700 resize-none placeholder:text-gray-400"
                />
                <input
                    value={item.link}
                    onChange={(e) => isNew ? onNewItemChange({ link: e.target.value }) : onUpdate(index, 'link', e.target.value)}
                    placeholder="Project link (optional)"
                    className="w-full px-3 py-2 rounded-xl border-2 border-transparent bg-gray-50 focus:bg-white focus:border-[#09BF44] outline-none text-sm text-gray-600 placeholder:text-gray-400"
                />
                {!isNew && onSave && (
                    <button
                        onClick={onSave}
                        disabled={saving}
                        className="w-full mt-2 py-2.5 bg-[#09BF44] text-white font-bold rounded-xl hover:bg-[#07a63a] disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                )}
            </div>
        </div>
    );
}

interface PortfolioSectionProps {
    profile: any;
    onProfileUpdate: (updated: any) => void;
}

export default function PortfolioSection({ profile, onProfileUpdate }: PortfolioSectionProps) {
    const { showModal } = useModal();
    const [saving, setSaving] = useState(false);
    const [imageUploading, setImageUploading] = useState<number | null>(null);
    const [imageProgress, setImageProgress] = useState(0);
    const [portfolio, setPortfolio] = useState<PortfolioItem[]>(
        (profile?.freelancerProfile?.portfolio || []).map((p: any) => ({ ...p, subCategory: p.subCategory || '' }))
    );
    const [newItem, setNewItem] = useState<PortfolioItem>({ title: '', description: '', imageUrl: '', link: '', subCategory: '' });
    const [showAddForm, setShowAddForm] = useState(false);

    const lockedCategory = profile?.freelancerProfile?.category;
    const subCategories: string[] = lockedCategory && CATEGORIES[lockedCategory as keyof typeof CATEGORIES]
        ? [...CATEGORIES[lockedCategory as keyof typeof CATEGORIES]]
        : [];

    const savePortfolio = useCallback(async (items: PortfolioItem[]) => {
        setSaving(true);
        try {
            const updated = await api.freelancer.updateProfile({ portfolio: items });
            onProfileUpdate(updated);
            setPortfolio((updated.freelancerProfile?.portfolio || []).map((p: any) => ({ ...p, subCategory: p.subCategory || '' })));
            showModal({ title: 'Saved', message: 'Portfolio updated successfully.', type: 'success' });
        } catch (err: any) {
            showModal({ title: 'Error', message: err.message || 'Failed to save', type: 'error' });
        } finally {
            setSaving(false);
        }
    }, [showModal, onProfileUpdate]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number | 'new') => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            showModal({ title: 'Error', message: 'Image must be under 5MB', type: 'error' });
            return;
        }
        setImageUploading(index === 'new' ? -1 : index);
        setImageProgress(0);
        try {
            const url = await api.upload.file(file, { onProgress: (p) => setImageProgress(p) });
            if (index === 'new') {
                setNewItem(prev => ({ ...prev, imageUrl: url }));
            } else {
                const next = [...portfolio];
                next[index] = { ...next[index], imageUrl: url };
                setPortfolio(next);
            }
        } catch (err: any) {
            showModal({ title: 'Upload Failed', message: err.message || 'Failed to upload', type: 'error' });
        } finally {
            setImageUploading(null);
            e.target.value = '';
        }
    };

    const addItem = async () => {
        if (!newItem.title.trim()) {
            showModal({ title: 'Error', message: 'Title is required', type: 'error' });
            return;
        }
        const updatedPortfolio = [...portfolio, { ...newItem }];
        setPortfolio(updatedPortfolio);
        setNewItem({ title: '', description: '', imageUrl: '', link: '', subCategory: '' });
        setShowAddForm(false);
        await savePortfolio(updatedPortfolio);
    };

    const updateItem = useCallback((index: number, field: keyof PortfolioItem, value: string) => {
        setPortfolio(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    }, []);

    const removeItem = async (index: number) => {
        const updatedPortfolio = portfolio.filter((_, i) => i !== index);
        setPortfolio(updatedPortfolio);
        await savePortfolio(updatedPortfolio);
    };

    const handleNewItemChange = useCallback((updates: Partial<PortfolioItem>) => {
        setNewItem(prev => ({ ...prev, ...updates }));
    }, []);

    return (
        <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Portfolio</h3>
                <div className="flex items-center gap-3">
                    {saving && <span className="text-sm text-[#09BF44] font-medium flex items-center gap-1"><Loader2 className="w-4 h-4 animate-spin" /> Saving...</span>}
                    <p className="text-sm text-gray-500">
                        {portfolio.length} {portfolio.length === 1 ? 'item' : 'items'}
                        {lockedCategory && subCategories.length > 0 && (
                            <span className="text-gray-400"></span>
                        )}
                    </p>
                </div>
            </div>

            {portfolio.length === 0 && !showAddForm ? (
                <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-4">Add your best projects to show clients what you can do.</p>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#09BF44] text-white font-bold rounded-xl hover:bg-[#07a63a] transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Add first project
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {portfolio.map((item, idx) => (
                            <PortfolioCard
                                key={idx}
                                item={item}
                                index={idx}
                                isNew={false}
                                subCategories={subCategories}
                                imageUploading={imageUploading}
                                imageProgress={imageProgress}
                                onImageUpload={handleImageUpload}
                                onUpdate={updateItem}
                                onRemove={removeItem}
                                onNewItemChange={handleNewItemChange}
                                onSave={() => savePortfolio(portfolio)}
                                saving={saving}
                            />
                        ))}
                        {showAddForm && (
                            <PortfolioCard
                                item={newItem}
                                index={-1}
                                isNew
                                subCategories={subCategories}
                                imageUploading={imageUploading}
                                imageProgress={imageProgress}
                                onImageUpload={handleImageUpload}
                                onUpdate={updateItem}
                                onRemove={removeItem}
                                onNewItemChange={handleNewItemChange}
                            />
                        )}
                    </div>

                    {showAddForm ? (
                        <div className="flex gap-3">
                            <button
                                onClick={addItem}
                                disabled={!newItem.title.trim()}
                                className="px-6 py-3 bg-[#09BF44] text-white font-bold rounded-xl hover:bg-[#07a63a] disabled:opacity-50 flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" /> Add to Portfolio
                            </button>
                            <button
                                onClick={() => { setShowAddForm(false); setNewItem({ title: '', description: '', imageUrl: '', link: '', subCategory: '' }); }}
                                className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 font-bold hover:border-[#09BF44] hover:text-[#09BF44] hover:bg-[#09BF44]/5 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus className="w-5 h-5" /> Add another project
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
