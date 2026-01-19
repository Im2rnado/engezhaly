"use client";

import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

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
        <div className="fixed inset-0 bg-black/50 z-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between">
                    <h2 className="text-2xl font-black text-gray-900">Create Custom Offer</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Price */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Total Price (EGP) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            min="500"
                            required
                            disabled={showMilestones && milestones.length > 0}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#09BF44] focus:ring-2 focus:ring-green-100 outline-none"
                            placeholder="Minimum 500 EGP"
                        />
                        {showMilestones && milestones.length > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                                Price will be calculated from milestones ({totalMilestonePrice} EGP)
                            </p>
                        )}
                    </div>

                    {/* Delivery Days */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Delivery Days <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            value={deliveryDays}
                            onChange={(e) => setDeliveryDays(e.target.value)}
                            min="1"
                            required
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#09BF44] focus:ring-2 focus:ring-green-100 outline-none"
                            placeholder="e.g., 7"
                        />
                    </div>

                    {/* What's Included */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            What&apos;s Included <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={whatsIncluded}
                            onChange={(e) => setWhatsIncluded(e.target.value)}
                            required
                            rows={4}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#09BF44] focus:ring-2 focus:ring-green-100 outline-none resize-none"
                            placeholder="Describe what the client will receive..."
                        />
                    </div>

                    {/* Milestones Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">
                                Payment Milestones
                            </label>
                            <p className="text-xs text-gray-500">
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
                            className={`px-4 py-2 rounded-xl font-bold transition-colors ${showMilestones
                                ? 'bg-[#09BF44] text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            {showMilestones ? 'Enabled' : 'Enable'}
                        </button>
                    </div>

                    {/* Milestones */}
                    {showMilestones && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-bold text-gray-700">
                                    Milestones
                                </label>
                                <button
                                    type="button"
                                    onClick={addMilestone}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-[#09BF44] text-white text-sm font-bold rounded-lg hover:bg-[#07a63a] transition-colors"
                                >
                                    <Plus className="w-4 h-4" /> Add Milestone
                                </button>
                            </div>

                            {milestones.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">
                                    No milestones added. Click &quot;Add Milestone&quot; to create payment milestones.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {milestones.map((milestone, index) => (
                                        <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                            <div className="flex items-start justify-between mb-3">
                                                <span className="text-sm font-bold text-gray-700">
                                                    Milestone {index + 1}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeMilestone(index)}
                                                    className="p-1 hover:bg-red-50 rounded-lg transition-colors"
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
                                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:border-[#09BF44] outline-none text-sm"
                                                />
                                                <div className="grid grid-cols-2 gap-3">
                                                    <input
                                                        type="number"
                                                        value={milestone.price}
                                                        onChange={(e) => updateMilestone(index, 'price', e.target.value)}
                                                        placeholder="Price (EGP)"
                                                        min="0"
                                                        className="px-3 py-2 bg-white border border-gray-200 rounded-lg focus:border-[#09BF44] outline-none text-sm"
                                                    />
                                                    <input
                                                        type="date"
                                                        value={milestone.dueDate}
                                                        onChange={(e) => updateMilestone(index, 'dueDate', e.target.value)}
                                                        placeholder="Due Date"
                                                        className="px-3 py-2 bg-white border border-gray-200 rounded-lg focus:border-[#09BF44] outline-none text-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-bold text-gray-700">Total:</span>
                                            <span className="font-black text-[#09BF44] text-lg">
                                                {totalMilestonePrice} EGP
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Summary */}
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <h3 className="text-sm font-bold text-gray-700 mb-3">Offer Summary</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Price:</span>
                                <span className="font-bold text-gray-900">{finalPrice} EGP</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Delivery:</span>
                                <span className="font-bold text-gray-900">{deliveryDays || '—'} days</span>
                            </div>
                            {milestones.length > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Milestones:</span>
                                    <span className="font-bold text-gray-900">{milestones.length}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-6 py-3 bg-[#09BF44] hover:bg-[#07a63a] text-white font-bold rounded-xl transition-colors"
                        >
                            Send Offer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
