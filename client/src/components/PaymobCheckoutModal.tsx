"use client";

interface PaymobCheckoutModalProps {
    iframeUrl: string | null;
    title: string;
    onClose: () => void;
}

export default function PaymobCheckoutModal({ iframeUrl, title, onClose }: PaymobCheckoutModalProps) {
    if (!iframeUrl) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                        Close
                    </button>
                </div>
                <div className="flex-1 min-h-[400px]">
                    <iframe
                        src={iframeUrl}
                        className="w-full h-full min-h-[400px] border-0"
                        title="Paymob Payment"
                    />
                </div>
            </div>
        </div>
    );
}
