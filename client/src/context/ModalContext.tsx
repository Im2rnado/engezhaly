"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

type ModalType = 'success' | 'error' | 'info' | 'confirm';

interface ModalOptions {
    title: string;
    message: string;
    type?: ModalType;
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
}

interface ModalContextType {
    showModal: (options: ModalOptions) => void;
    hideModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState<ModalOptions>({ title: '', message: '' });

    const showModal = (options: ModalOptions) => {
        setModalConfig(options);
        setIsOpen(true);
    };

    const hideModal = () => {
        setIsOpen(false);
    };

    const handleConfirm = () => {
        setIsOpen(false);
        if (modalConfig.onConfirm) {
            modalConfig.onConfirm();
        }
    };

    const handleCancel = () => {
        setIsOpen(false);
        if (modalConfig.onCancel) {
            modalConfig.onCancel();
        }
    };

    return (
        <ModalContext.Provider value={{ showModal, hideModal }}>
            {children}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full mx-4 transform transition-all scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center">
                            {modalConfig.type === 'success' && (
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle className="w-8 h-8 text-[#09BF44]" />
                                </div>
                            )}
                            {modalConfig.type === 'error' && (
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                    <AlertCircle className="w-8 h-8 text-red-500" />
                                </div>
                            )}
                            {(modalConfig.type === 'info' || modalConfig.type === 'confirm') && (
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                    <Info className="w-8 h-8 text-blue-500" />
                                </div>
                            )}

                            <h3 className="text-xl font-bold text-gray-900 mb-2">{modalConfig.title}</h3>
                            <p className="text-gray-600 mb-6">{modalConfig.message}</p>

                            <div className="w-full flex gap-3">
                                {modalConfig.type === 'confirm' ? (
                                    <>
                                        <button
                                            onClick={handleCancel}
                                            className="flex-1 border-2 border-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors"
                                        >
                                            {modalConfig.cancelText || 'Cancel'}
                                        </button>
                                        <button
                                            onClick={handleConfirm}
                                            className="flex-1 bg-black text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors"
                                        >
                                            {modalConfig.confirmText || 'Confirm'}
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={handleConfirm}
                                        className="w-full bg-black text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors"
                                    >
                                        OK
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </ModalContext.Provider>
    );
}

export function useModal() {
    const context = useContext(ModalContext);
    if (context === undefined) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
}
