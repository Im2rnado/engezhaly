"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CreditCard, Plus, Trash2, Check, PanelLeft } from 'lucide-react';
import { useModal } from '@/context/ModalContext';
import ClientSidebar from '@/components/ClientSidebar';
import DashboardMobileTopStrip from '@/components/DashboardMobileTopStrip';
import { api } from '@/lib/api';
import { formatDateDDMMYYYY } from '@/lib/utils';

export default function PaymentMethodsPage() {
    const { showModal } = useModal();
    const router = useRouter();
    const [methods, setMethods] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [addingCard, setAddingCard] = useState(false);
    const [iframeUrl, setIframeUrl] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [methodsData, txData] = await Promise.all([
                api.paymentMethods.list().catch(() => []),
                api.wallet.getTransactions().catch(() => [])
            ]);
            setMethods(Array.isArray(methodsData) ? methodsData : []);
            setTransactions(Array.isArray(txData) ? txData : []);
        } catch (err) {
            console.error(err);
            setMethods([]);
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/');
            return;
        }
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        setUser(storedUser);
        if (storedUser.role !== 'client') {
            router.push('/');
            return;
        }
        api.client.getProfile().then(setProfile).catch(() => {});
        fetchData();
    }, [router, fetchData]);

    const handleAddCard = async () => {
        setAddingCard(true);
        try {
            const callbackUrl = typeof window !== 'undefined' ? `${window.location.origin}/dashboard/client/wallet?success=1` : undefined;
            const result = await api.paymentMethods.add(callbackUrl);
            setIframeUrl(result.iframeUrl || null);
            if (!result.iframeUrl) {
                showModal({ title: 'Success', message: 'Card added successfully. Refreshing...', type: 'success' });
                fetchData();
            }
        } catch (err: any) {
            showModal({ title: 'Error', message: err.message || 'Failed to add card', type: 'error' });
        } finally {
            setAddingCard(false);
        }
    };

    const handleRemoveCard = (id: string) => {
        showModal({
            title: 'Remove Card',
            message: 'Are you sure you want to remove this payment method?',
            type: 'confirm',
            onConfirm: async () => {
                try {
                    await api.paymentMethods.remove(id);
                    showModal({ title: 'Success', message: 'Card removed', type: 'success' });
                    fetchData();
                } catch (err: any) {
                    showModal({ title: 'Error', message: err.message || 'Failed to remove', type: 'error' });
                }
            }
        });
    };

    const handleSetDefault = async (id: string) => {
        try {
            await api.paymentMethods.setDefault(id);
            fetchData();
        } catch (err: any) {
            showModal({ title: 'Error', message: err.message || 'Failed to set default', type: 'error' });
        }
    };

    // Check for success redirect after Paymob callback
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        if (params.get('success') === '1') {
            window.history.replaceState({}, '', window.location.pathname);
            fetchData();
            showModal({ title: 'Success', message: 'Payment method added successfully.', type: 'success' });
        }
    }, [fetchData]);

    const closeIframe = () => {
        setIframeUrl(null);
        fetchData();
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#09BF44]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
            <ClientSidebar
                user={user}
                profile={profile}
                onTabChange={() => {}}
                activeTab="wallet"
                mobileOpen={mobileSidebarOpen}
                onCloseMobile={() => setMobileSidebarOpen(false)}
            />
            {mobileSidebarOpen && (
                <button
                    aria-label="Close sidebar overlay"
                    onClick={() => setMobileSidebarOpen(false)}
                    className="fixed inset-0 bg-black/40 z-30 md:hidden"
                />
            )}
            <div className="flex-1 md:ml-72 px-4 sm:px-6 md:p-8 pt-3 md:pt-8 pb-8 overflow-y-auto min-h-screen">
                    <DashboardMobileTopStrip />
                    <div className="flex items-center gap-3 mb-7 md:mb-8">
                        <button
                            onClick={() => setMobileSidebarOpen(true)}
                            className="md:hidden p-2 rounded-lg border border-gray-200 bg-white text-gray-700"
                            aria-label="Open sidebar"
                        >
                            <PanelLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-2xl md:text-3xl font-black text-gray-900">Payment Methods</h1>
                    </div>
                    <p className="text-sm md:text-base text-gray-500 -mt-4 mb-6">Add and manage your saved cards for secure payments when ordering.</p>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-[#09BF44]" />
                        </div>
                    ) : (
                        <>
                            <div className="bg-white p-5 md:p-8 rounded-3xl shadow-sm border border-gray-100 mb-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <CreditCard className="w-5 h-5" /> Saved Cards
                                </h2>
                                <div className="space-y-4">
                                    {methods.length === 0 && (
                                        <div className="text-center py-8 text-gray-500">
                                            <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                            <p className="font-bold">No saved cards yet</p>
                                            <p className="text-sm mt-1">Add a card to make payments when you order offers or accept freelancers.</p>
                                        </div>
                                    )}
                                    {methods.map((m: any) => (
                                        <div
                                            key={m._id}
                                            className="flex items-center justify-between p-4 rounded-xl border-2 border-gray-100 hover:border-gray-200 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center">
                                                    <CreditCard className="w-6 h-6 text-gray-500" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">
                                                        {m.brand || 'Card'} ****{m.last4 || '****'}
                                                    </p>
                                                    <p className="text-xs text-gray-500">Expires securely with Paymob</p>
                                                </div>
                                                {m.isDefault && (
                                                    <span className="px-2 py-1 bg-[#09BF44]/10 text-[#09BF44] text-xs font-bold rounded-full flex items-center gap-1">
                                                        <Check className="w-3 h-3" /> Default
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {!m.isDefault && (
                                                    <button
                                                        onClick={() => handleSetDefault(m._id)}
                                                        className="px-3 py-1.5 text-sm font-bold text-[#09BF44] hover:bg-[#09BF44]/10 rounded-lg transition-colors"
                                                    >
                                                        Set default
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleRemoveCard(m._id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    aria-label="Remove card"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        onClick={handleAddCard}
                                        disabled={addingCard}
                                        className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-600 font-bold hover:border-[#09BF44] hover:text-[#09BF44] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                                    >
                                        {addingCard ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                                        Add new card
                                    </button>
                                </div>
                            </div>

                            {/* Payment History */}
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-6 border-b border-gray-100">
                                    <h2 className="text-xl font-bold text-gray-900">Payment History</h2>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Type</th>
                                                <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Amount</th>
                                                <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {transactions.map((tx: any) => (
                                                <tr key={tx._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                                    <td className="p-4 font-bold capitalize text-gray-700">{tx.type}</td>
                                                    <td className={`p-4 font-black ${tx.amount >= 0 ? 'text-[#09BF44]' : 'text-red-500'}`}>
                                                        {tx.amount >= 0 ? '+' : ''}{tx.amount} EGP
                                                    </td>
                                                    <td className="p-4 text-gray-500 text-sm">{formatDateDDMMYYYY(tx.createdAt)}</td>
                                                </tr>
                                            ))}
                                            {transactions.length === 0 && (
                                                <tr>
                                                    <td colSpan={3} className="p-8 text-center text-gray-400">No payments yet.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
            </div>

            {/* Paymob iframe modal */}
            {iframeUrl && (
                <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="font-bold text-gray-900">Add Payment Method</h3>
                            <button
                                onClick={closeIframe}
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
            )}
        </div>
    );
}
