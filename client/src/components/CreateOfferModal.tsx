"use client";

import { useMemo, useState } from 'react';
import { X, Plus, Trash2, FileText } from 'lucide-react';
import { formatDateDDMMYYYY, formatRevisionsLabel, minDateYYYYMMDDForMilestone, milestoneDatesOrderError } from '@/lib/utils';
import DatePicker from '@/components/DatePicker';
import RevisionsField from '@/components/RevisionsField';

export type CreateOfferPayload = {
    price: number;
    deliveryDate?: string;
    deliveryDays?: number;
    whatsIncluded: string;
    revisions: number;
    revisionsUnlimited: boolean;
    milestones: Array<{ name: string; price: number; dueDate?: string }>;
};

interface CreateOfferModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (offer: CreateOfferPayload) => void;
}

export default function CreateOfferModal({ isOpen, onClose, onSubmit }: CreateOfferModalProps) {
    const [price, setPrice] = useState('');
    const [deliveryDate, setDeliveryDate] = useState('');
    const [whatsIncluded, setWhatsIncluded] = useState('');
    const [revisions, setRevisions] = useState('1');
    const [revisionsUnlimited, setRevisionsUnlimited] = useState(false);
    const [milestones, setMilestones] = useState<Array<{ name: string; dueDate: string }>>([]);
    const [showMilestones, setShowMilestones] = useState(false);

    const normalizedMilestones = useMemo(
        () =>
            milestones
                .filter((m) => m.name.trim())
                .map((m) => ({
                    name: m.name.trim(),
                    price: 0,
                    dueDate: m.dueDate ? new Date(m.dueDate).toISOString() : undefined
                })),
        [milestones]
    );

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const totalPrice = Number(price);
        const revUnlimited = revisionsUnlimited;
        const revNum = revUnlimited ? 0 : Number(revisions) || 0;

        if (totalPrice < 300) {
            alert('Minimum price is 300 EGP');
            return;
        }

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        if (showMilestones) {
            if (normalizedMilestones.length === 0) {
                alert('Add at least one delivery milestone with a name and due date');
                return;
            }
            for (const m of normalizedMilestones) {
                if (!m.dueDate) {
                    alert('Each milestone must have a due date');
                    return;
                }
                const d = new Date(m.dueDate);
                if (isNaN(d.getTime()) || d < todayStart) {
                    alert('Each milestone due date must be today or later');
                    return;
                }
            }
            const orderErr = milestoneDatesOrderError(
                milestones.filter((m) => m.name.trim()).map((m) => ({ dueDate: m.dueDate }))
            );
            if (orderErr) {
                alert(orderErr);
                return;
            }
        } else {
            if (!deliveryDate) {
                alert('Please select a delivery date');
                return;
            }
            const selectedDate = new Date(deliveryDate);
            if (selectedDate < todayStart) {
                alert('Delivery date must be today or later');
                return;
            }
        }

        if (!whatsIncluded.trim()) {
            alert('Please describe what\'s included');
            return;
        }

        const offerData: CreateOfferPayload = {
            price: totalPrice,
            whatsIncluded: whatsIncluded.trim(),
            revisions: revNum,
            revisionsUnlimited: revUnlimited,
            milestones: showMilestones ? normalizedMilestones : []
        };

        if (showMilestones) {
            const times = normalizedMilestones
                .map((m) => (m.dueDate ? new Date(m.dueDate).getTime() : NaN))
                .filter((t) => !Number.isNaN(t));
            if (times.length > 0) {
                offerData.deliveryDate = new Date(Math.max(...times)).toISOString();
            }
        } else {
            offerData.deliveryDate = new Date(deliveryDate).toISOString();
        }

        onSubmit(offerData);
        setPrice('');
        setDeliveryDate('');
        setWhatsIncluded('');
        setRevisions('1');
        setRevisionsUnlimited(false);
        setMilestones([]);
        setShowMilestones(false);
    };

    const addMilestone = () => {
        setMilestones([...milestones, { name: '', dueDate: '' }]);
    };

    const removeMilestone = (index: number) => {
        setMilestones(milestones.filter((_, i) => i !== index));
    };

    const updateMilestone = (index: number, field: 'name' | 'dueDate', value: string) => {
        const updated = [...milestones];
        updated[index] = { ...updated[index], [field]: value };
        setMilestones(updated);
    };

    const finalPrice = Number(price) || 0;
    const summaryDelivery =
        showMilestones && normalizedMilestones.length
            ? (() => {
                const times = normalizedMilestones
                    .map((m) => (m.dueDate ? new Date(m.dueDate).getTime() : NaN))
                    .filter((t) => !Number.isNaN(t));
                if (times.length === 0) return '—';
                return formatDateDDMMYYYY(new Date(Math.max(...times)).toISOString());
            })()
            : deliveryDate
                ? formatDateDDMMYYYY(deliveryDate)
                : '—';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl bg-white text-gray-900 rounded-3xl shadow-2xl" style={{ height: '90vh', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
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

                <div className="modal-scrollable-content" style={{ flex: 1 }}>
                    <div className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">
                                    Total Price (EGP) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-[#09BF44] focus:ring-2 focus:ring-[#09BF44]/20 outline-none transition-all"
                                    placeholder="Minimum 300 EGP"
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    The client pays this amount once when they accept the offer. Delivery milestones below are for scheduling only—not split payments.
                                </p>
                            </div>

                            {!showMilestones && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-900 mb-2">
                                        Delivery Date <span className="text-red-500">*</span>
                                    </label>
                                    <DatePicker
                                        value={deliveryDate}
                                        onChange={setDeliveryDate}
                                        min={new Date().toISOString().split('T')[0]}
                                        required
                                        placeholder="Select delivery date"
                                        className="w-full"
                                    />
                                </div>
                            )}

                            {showMilestones && (
                                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-900 font-medium">
                                    Delivery date is set automatically from the latest milestone due date. Each milestone needs a due date.
                                </div>
                            )}

                            <RevisionsField
                                variant="default"
                                label={
                                    <>
                                        Revisions <span className="text-red-500">*</span>
                                    </>
                                }
                                required
                                unlimited={revisionsUnlimited}
                                revisions={revisions}
                                onUnlimitedChange={setRevisionsUnlimited}
                                onRevisionsChange={setRevisions}
                            />

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

                            <div className="p-5 bg-gradient-to-r from-gray-50 to-gray-100/50 border-2 border-gray-200 rounded-xl">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-900 mb-1">
                                            Delivery Milestones
                                        </label>
                                        <p className="text-xs text-gray-600">
                                            Optional phases (e.g. wireframe, final files). Payment is still once at acceptance—milestones are for clarity and timing only.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowMilestones(!showMilestones);
                                            if (showMilestones) {
                                                setMilestones([]);
                                            }
                                        }}
                                        className={`px-6 py-2.5 rounded-xl font-bold transition-all ${showMilestones
                                            ? 'bg-[#09BF44] text-white shadow-md shadow-[#09BF44]/20'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                    >
                                        {showMilestones ? 'Enabled' : 'Enable'}
                                    </button>
                                </div>
                            </div>

                            {showMilestones && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-sm font-bold text-gray-900">
                                            Delivery milestones
                                        </label>
                                        <button
                                            type="button"
                                            onClick={addMilestone}
                                            className="flex items-center gap-2 px-4 py-2 bg-[#09BF44] text-white text-sm font-bold rounded-xl hover:bg-[#07a63a] transition-colors shadow-sm"
                                        >
                                            <Plus className="w-4 h-4" /> Add delivery milestone
                                        </button>
                                    </div>

                                    {milestones.length === 0 ? (
                                        <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                            <p className="text-sm text-gray-500">
                                                No milestones yet. Click &quot;Add delivery milestone&quot; to list delivery phases.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {milestones.map((milestone, index) => (
                                                <div key={index} className="p-5 bg-gray-50 rounded-xl border-2 border-gray-200">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <span className="text-sm font-bold text-gray-900">
                                                            Phase {index + 1}
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
                                                            placeholder="Delivery phase (e.g. First draft)"
                                                            className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-[#09BF44] focus:ring-2 focus:ring-[#09BF44]/20 outline-none transition-all"
                                                        />
                                                        <DatePicker
                                                            value={milestone.dueDate}
                                                            onChange={(v) => updateMilestone(index, 'dueDate', v)}
                                                            placeholder="Due date *"
                                                            min={minDateYYYYMMDDForMilestone(index, milestones)}
                                                            className="w-full"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="p-5 bg-gradient-to-r from-gray-50 to-gray-100/50 border-2 border-gray-200 rounded-xl">
                                <h3 className="text-sm font-bold text-gray-900 mb-4">Offer Summary</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Price (single payment):</span>
                                        <span className="font-bold text-gray-900">{finalPrice} EGP</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Delivery:</span>
                                        <span className="font-bold text-gray-900">{summaryDelivery}</span>
                                    </div>
                                    {showMilestones && milestones.length > 0 && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Delivery milestones:</span>
                                            <span className="font-bold text-gray-900">{milestones.length}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Revisions:</span>
                                        <span className="font-bold text-gray-900">
                                            {formatRevisionsLabel(revisionsUnlimited, revisions)}
                                        </span>
                                    </div>
                                </div>
                            </div>

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
