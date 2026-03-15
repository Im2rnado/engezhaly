"use client";

import { useState } from "react";
import { CreditCard, Smartphone, Upload, Loader2, ExternalLink } from "lucide-react";
import { api } from "@/lib/api";

export interface PaymentConfig {
    type: string;
    amountCents: number;
    callbackSuccessUrl?: string;
    orderId?: string;
    offerId?: string;
    jobId?: string;
    proposalId?: string;
    conversationId?: string;
}

interface PaymentChoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    paymentConfig: PaymentConfig;
    onCardPay: () => Promise<void>;
    onInstaPayComplete?: () => void;
}

export default function PaymentChoiceModal({
    isOpen,
    onClose,
    paymentConfig,
    onCardPay,
    onInstaPayComplete
}: PaymentChoiceModalProps) {
    const [step, setStep] = useState<"choice" | "instapay_instructions" | "instapay_upload" | "instapay_pending">("choice");
    const [instaPayId, setInstaPayId] = useState<string | null>(null);
    const [instructions, setInstructions] = useState<{ phone: string; link: string; amount: number } | null>(null);
    const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [cardLoading, setCardLoading] = useState(false);

    if (!isOpen) return null;

    const amountEGP = (paymentConfig.amountCents / 100).toFixed(2);

    const handleCardPay = async () => {
        setCardLoading(true);
        try {
            await onCardPay();
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setCardLoading(false);
        }
    };

    const handleInstaPayStart = async () => {
        try {
            const result = await api.payments.createInstaPay({
                amountCents: paymentConfig.amountCents,
                type: paymentConfig.type,
                orderId: paymentConfig.orderId,
                offerId: paymentConfig.offerId,
                jobId: paymentConfig.jobId,
                proposalId: paymentConfig.proposalId,
                conversationId: paymentConfig.conversationId
            });
            setInstaPayId(result.id);
            setInstructions(result.instructions);
            setStep("instapay_instructions");
        } catch (e: any) {
            alert(e.message || "Failed to create InstaPay payment");
        }
    };

    const handleInstaPayContinue = () => {
        setStep("instapay_upload");
    };

    const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && (file.type.startsWith("image/") || file.type === "application/pdf")) {
            setScreenshotFile(file);
        }
    };

    const handleInstaPayUpload = async () => {
        if (!instaPayId || !screenshotFile) {
            alert("Please select a payment screenshot to upload");
            return;
        }
        setUploading(true);
        try {
            const url = await api.upload.file(screenshotFile);
            await api.payments.uploadInstaPayScreenshot(instaPayId, url);
            setStep("instapay_pending");
            onInstaPayComplete?.();
        } catch (e: any) {
            alert(e.message || "Failed to upload screenshot");
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        setStep("choice");
        setInstaPayId(null);
        setInstructions(null);
        setScreenshotFile(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">
                        {step === "choice" && "Choose Payment Method"}
                        {step === "instapay_instructions" && "InstaPay Instructions"}
                        {step === "instapay_upload" && "Upload Payment Screenshot"}
                        {step === "instapay_pending" && "Payment Submitted"}
                    </h3>
                    <button onClick={handleClose} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                        &times;
                    </button>
                </div>
                <div className="p-6">
                    {step === "choice" && (
                        <div className="space-y-3">
                            <p className="text-gray-600 text-sm mb-4">Amount to pay: <strong>{amountEGP} EGP</strong></p>
                            <button
                                onClick={handleCardPay}
                                disabled={cardLoading}
                                className="w-full flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-[#09BF44] bg-[#09BF44] text-white font-bold hover:bg-[#07a63a] transition-colors disabled:opacity-70"
                            >
                                {cardLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                                Pay with Card
                            </button>
                            <button
                                onClick={handleInstaPayStart}
                                className="w-full flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-gray-300 text-gray-700 font-bold hover:border-[#09BF44] hover:bg-[#09BF44]/5 transition-colors"
                            >
                                <Smartphone className="w-5 h-5" />
                                Pay with InstaPay
                            </button>
                        </div>
                    )}

                    {step === "instapay_instructions" && instructions && (
                        <div className="space-y-4">
                            <p className="text-gray-600 text-sm">Please transfer <strong>{instructions.amount} EGP</strong> via InstaPay:</p>
                            <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                                <p><strong>Phone:</strong> {instructions.phone}</p>
                                <a
                                    href={instructions.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[#09BF44] font-bold hover:underline"
                                >
                                    InstaPay Link <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>
                            <p className="text-gray-500 text-xs">After you complete the transfer, click Continue to upload your payment screenshot.</p>
                            <div className="flex gap-2">
                                <button onClick={() => setStep("choice")} className="flex-1 py-3 rounded-xl border-2 border-gray-200 font-bold text-gray-600">
                                    Back
                                </button>
                                <button onClick={handleInstaPayContinue} className="flex-1 py-3 rounded-xl bg-[#09BF44] text-white font-bold hover:bg-[#07a63a]">
                                    Continue
                                </button>
                            </div>
                        </div>
                    )}

                    {step === "instapay_upload" && (
                        <div className="space-y-4">
                            <p className="text-gray-600 text-sm">Upload a screenshot of your InstaPay payment:</p>
                            <input
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={handleScreenshotChange}
                                className="w-full p-3 border-2 border-dashed border-gray-200 rounded-xl"
                            />
                            {screenshotFile && <p className="text-sm text-gray-500">Selected: {screenshotFile.name}</p>}
                            <div className="flex gap-2">
                                <button onClick={() => setStep("instapay_instructions")} className="flex-1 py-3 rounded-xl border-2 border-gray-200 font-bold text-gray-600">
                                    Back
                                </button>
                                <button
                                    onClick={handleInstaPayUpload}
                                    disabled={!screenshotFile || uploading}
                                    className="flex-1 py-3 rounded-xl bg-[#09BF44] text-white font-bold hover:bg-[#07a63a] disabled:opacity-70 flex items-center justify-center gap-2"
                                >
                                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                                    Submit
                                </button>
                            </div>
                        </div>
                    )}

                    {step === "instapay_pending" && (
                        <div className="text-center py-4">
                            <p className="text-gray-700 font-medium mb-2">Waiting for admin to verify your payment.</p>
                            <p className="text-gray-500 text-sm">You will be notified once the payment is verified.</p>
                            <button onClick={handleClose} className="mt-4 px-6 py-2 bg-[#09BF44] text-white font-bold rounded-xl hover:bg-[#07a63a]">
                                Close
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
