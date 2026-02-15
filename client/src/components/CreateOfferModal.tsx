"use client";

import { useState } from 'react';
import { X, Plus, Trash2, FileText } from 'lucide-react';

interface CreateOfferModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (offer: {
        price: number;
        deliveryDays: number;
        whatsIncluded: string;
        milestones: Array<{ name: string; price: number; dueDate?: string }>;
    }) => void;
}

export default function CreateOfferModal({ isOpen, onClose, onSubmit }: CreateOfferModalProps) {
    const [price, setPrice] = useState('');
    const [deliveryDays, setDeliveryDays] = useState('');
    const [whatsIncluded, setWhatsIncluded] = useState('');
    const [milestones, setMilestones] = useState<Array<{ name: string; price: string; dueDate: string }>>([]);
    const [showMilestones, setShowMilestones] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const offerData = {
            price: Number(price),
            deliveryDays: Number(deliveryDays),
            whatsIncluded: whatsIncluded.trim(),
            milestones: milestones.map(m => ({
                name: m.name.trim(),
                price: Number(m.price),
                dueDate: m.dueDate ? new Date(m.dueDate).toISOString() : undefined
            }))
        };

        if (offerData.price < 500) {
            alert('Minimum price is 500 EGP');
            return;
        }

        if (offerData.deliveryDays < 1) {
            alert('Delivery days must be at least 1');
            return;
        }

        if (!offerData.whatsIncluded) {
            alert('Please describe what\'s included');
            return;
        }

        onSubmit(offerData);
        // Reset form
        setPrice('');
        setDeliveryDays('');
        setWhatsIncluded('');
        setMilestones([]);
        setShowMilestones(false);
    };

    const addMilestone = () => {
        setMilestones([...milestones, { name: '', price: '', dueDate: '' }]);
    };

    const removeMilestone = (index: number) => {
        setMilestones(milestones.filter((_, i) => i !== index));
    };

    const updateMilestone = (index: number, field: 'name' | 'price' | 'dueDate', value: string) => {
        const updated = [...milestones];
        updated[index] = { ...updated[index], [field]: value };
        setMilestones(updated);
    };

    const totalMilestonePrice = milestones.reduce((sum, m) => sum + (Number(m.price) || 0), 0);
    const finalPrice = showMilestones && milestones.length > 0 ? totalMilestonePrice : Number(price) || 0;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl" style={{ height: '90vh', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                {/* Header - Fixed */}
                <div className="flex-shrink-0 bg-white rounded-t-3xl border-b border-gray-200 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-[#09BF44]/10 rounded-xl">
                            <FileText className="w-6 h-6 text-[#09BF44]" />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900">Create Custom Offer</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {/* Scrollable Content Area */}
                <div className="modal-scrollable-content" style={{ flex: 1 }}>
                    <div className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Price */}
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">
                                    Total Price (EGP) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    min="500"
                                    required
                                    disabled={showMilestones && milestones.length > 0}
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-[#09BF44] focus:ring-2 focus:ring-[#09BF44]/20 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    placeholder="Minimum 500 EGP"
                                />
                                {showMilestones && milestones.length > 0 && (
                                    <p className="text-xs text-gray-500 mt-2">
                                        Price will be calculated from milestones ({totalMilestonePrice} EGP)
                                    </p>
                                )}
                            </div>

                            {/* Delivery Days */}
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">
                                    Delivery Days <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={deliveryDays}
                                    onChange={(e) => setDeliveryDays(e.target.value)}
                                    min="1"
                                    required
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-[#09BF44] focus:ring-2 focus:ring-[#09BF44]/20 outline-none transition-all"
                                    placeholder="e.g., 7"
                                />
                            </div>

                            {/* What's Included */}
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">
                                    What&apos;s Included <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={whatsIncluded}
                                    onChange={(e) => setWhatsIncluded(e.target.value)}
                                    required
                                    rows={4}
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-[#09BF44] focus:ring-2 focus:ring-[#09BF44]/20 outline-none resize-none transition-all"
                                    placeholder="Describe what the client will receive..."
                                />
                            </div>

                            {/* Milestones Toggle */}
                            <div className="p-5 bg-gradient-to-r from-gray-50 to-gray-100/50 border-2 border-gray-200 rounded-xl">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-900 mb-1">
                                            Payment Milestones
                                        </label>
                                        <p className="text-xs text-gray-600">
                                            Split payment across multiple milestones
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowMilestones(!showMilestones);
                                            if (!showMilestones) {
                                                setPrice('');
                                            } else {
                                                setMilestones([]);
                                            }
                                        }}
                                        className={`px-6 py-2.5 rounded-xl font-bold transition-all ${
                                            showMilestones
                                                ? 'bg-[#09BF44] text-white shadow-md shadow-[#09BF44]/20'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                    >
                                        {showMilestones ? 'Enabled' : 'Enable'}
                                    </button>
                                </div>
                            </div>

                            {/* Milestones */}
                            {showMilestones && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-sm font-bold text-gray-900">
                                            Milestones
                                        </label>
                                        <button
                                            type="button"
                                            onClick={addMilestone}
                                            className="flex items-center gap-2 px-4 py-2 bg-[#09BF44] text-white text-sm font-bold rounded-xl hover:bg-[#07a63a] transition-colors shadow-sm"
                                        >
                                            <Plus className="w-4 h-4" /> Add Milestone
                                        </button>
                                    </div>

                                    {milestones.length === 0 ? (
                                        <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                            <p className="text-sm text-gray-500">
                                                No milestones added. Click &quot;Add Milestone&quot; to create payment milestones.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {milestones.map((milestone, index) => (
                                                <div key={index} className="p-5 bg-gray-50 rounded-xl border-2 border-gray-200">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <span className="text-sm font-bold text-gray-900">
                                                            Milestone {index + 1}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeMilestone(index)}
                                                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4 text-red-600" />
                                                        </button>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <input
                                                            type="text"
                                                            value={milestone.name}
                                                            onChange={(e) => updateMilestone(index, 'name', e.target.value)}
                                                            placeholder="Milestone name (e.g., Design Phase)"
                                                            className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-[#09BF44] focus:ring-2 focus:ring-[#09BF44]/20 outline-none transition-all"
                                                        />
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            <input
                                                                type="number"
                                                                value={milestone.price}
                                                                onChange={(e) => updateMilestone(index, 'price', e.target.value)}
                                                                placeholder="Price (EGP)"
                                                                min="0"
                                                                className="px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-[#09BF44] focus:ring-2 focus:ring-[#09BF44]/20 outline-none transition-all"
                                                            />
                                                            <input
                                                                type="date"
                                                                value={milestone.dueDate}
                                                                onChange={(e) => updateMilestone(index, 'dueDate', e.target.value)}
                                                                placeholder="Due Date"
                                                                className="px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-[#09BF44] focus:ring-2 focus:ring-[#09BF44]/20 outline-none transition-all"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="p-4 bg-gradient-to-r from-[#09BF44]/10 to-[#09BF44]/5 border-2 border-[#09BF44]/20 rounded-xl">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-gray-900">Total:</span>
                                                    <span className="font-black text-[#09BF44] text-xl">
                                                        {totalMilestonePrice} EGP
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Summary */}
                            <div className="p-5 bg-gradient-to-r from-gray-50 to-gray-100/50 border-2 border-gray-200 rounded-xl">
                                <h3 className="text-sm font-bold text-gray-900 mb-4">Offer Summary</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Price:</span>
                                        <span className="font-bold text-gray-900">{finalPrice} EGP</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Delivery:</span>
                                        <span className="font-bold text-gray-900">{deliveryDays || '—'} days</span>
                                    </div>
                                    {milestones.length > 0 && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Milestones:</span>
                                            <span className="font-bold text-gray-900">{milestones.length}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-4 pt-4 border-t-2 border-gray-100 pb-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-[#09BF44] hover:bg-[#07a63a] text-white font-bold rounded-xl transition-colors shadow-md shadow-[#09BF44]/20"
                                >
                                    Send Offer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
