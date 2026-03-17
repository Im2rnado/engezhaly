"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowDownToLine, PanelLeft, CreditCard, Smartphone, Building2, Plus, Trash2, Check } from 'lucide-react';
import { useModal } from '@/context/ModalContext';
import FreelancerSidebar from '@/components/FreelancerSidebar';
import DashboardMobileTopStrip from '@/components/DashboardMobileTopStrip';
import { api } from '@/lib/api';
import { formatDateDDMMYYYY } from '@/lib/utils';

const WITHDRAWAL_FEE = 20;

export default function FreelancerWalletPage() {
    const { showModal } = useModal();
    const router = useRouter();
    const [balance, setBalance] = useState<number>(0);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [withdrawalMethods, setWithdrawalMethods] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [showAddMethodModal, setShowAddMethodModal] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawMethod, setWithdrawMethod] = useState<'instapay' | 'vodafone_cash' | 'bank'>('vodafone_cash');
    const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
    const [withdrawPhone, setWithdrawPhone] = useState('');
    const [withdrawAccount, setWithdrawAccount] = useState('');
    const [withdrawBankName, setWithdrawBankName] = useState('');
    const [withdrawNotes, setWithdrawNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    // Add method form
    const [addMethodType, setAddMethodType] = useState<'instapay' | 'vodafone_cash' | 'bank'>('vodafone_cash');
    const [addMethodPhone, setAddMethodPhone] = useState('');
    const [addMethodAccount, setAddMethodAccount] = useState('');
    const [addMethodBankName, setAddMethodBankName] = useState('');
    const [addingMethod, setAddingMethod] = useState(false);
    const [hideManualTopUp, setHideManualTopUp] = useState(false);

    const formatMethodName = (key: string) =>
        key === 'vodafone_cash' ? 'Vodafone Cash' : key === 'instapay' ? 'Instapay' : key === 'bank' ? 'Bank' : key.replace('_', ' ');

    const fetchData = useCallback(async () => {
        try {
            const [balanceRes, txData, withdrawalsData, methodsData] = await Promise.all([
                api.wallet.getBalance().catch(() => ({ balance: 0 })),
                api.wallet.getTransactions(hideManualTopUp).catch(() => []),
                api.wallet.getWithdrawals().catch(() => []),
                api.withdrawalMethods.list().catch(() => [])
            ]);
            setBalance(balanceRes.balance ?? 0);
            setTransactions(Array.isArray(txData) ? txData : []);
            setWithdrawals(Array.isArray(withdrawalsData) ? withdrawalsData : []);
            const methods = Array.isArray(methodsData) ? methodsData : [];
            setWithdrawalMethods(methods);
            // Use saved default method when available
            const defaultMethod = methods.find((m: any) => m.isDefault) || methods[0];
            if (defaultMethod?._id) {
                setSelectedMethodId(defaultMethod._id);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [hideManualTopUp]);

    const handleAddMethod = async () => {
        if ((addMethodType === 'instapay' || addMethodType === 'vodafone_cash') && !addMethodPhone.trim()) {
            showModal({ title: 'Phone Required', message: 'Enter your phone number.', type: 'error' });
            return;
        }
        if (addMethodType === 'bank' && (!addMethodAccount.trim() || !addMethodBankName.trim())) {
            showModal({ title: 'Details Required', message: 'Enter account number and bank name.', type: 'error' });
            return;
        }
        setAddingMethod(true);
        try {
            await api.withdrawalMethods.add({
                method: addMethodType,
                phoneNumber: addMethodType !== 'bank' ? addMethodPhone.trim() : undefined,
                accountNumber: addMethodType === 'bank' ? addMethodAccount.trim() : undefined,
                bankName: addMethodType === 'bank' ? addMethodBankName.trim() : undefined
            });
            showModal({ title: 'Success', message: 'Withdrawal method added.', type: 'success' });
            setShowAddMethodModal(false);
            setAddMethodPhone('');
            setAddMethodAccount('');
            setAddMethodBankName('');
            fetchData();
        } catch (err: any) {
            showModal({ title: 'Error', message: err.message || 'Failed to add', type: 'error' });
        } finally {
            setAddingMethod(false);
        }
    };

    const handleRemoveMethod = (id: string) => {
        showModal({
            title: 'Remove Method',
            message: 'Are you sure you want to remove this withdrawal method?',
            type: 'confirm',
            onConfirm: async () => {
                try {
                    await api.withdrawalMethods.remove(id);
                    if (selectedMethodId === id) setSelectedMethodId(null);
                    fetchData();
                } catch (e: any) {
                    showModal({ title: 'Error', message: e.message, type: 'error' });
                }
            }
        });
    };

    const formatMethodDisplay = (m: any) => {
        if (m.method === 'vodafone_cash' || m.method === 'instapay') {
            return `${formatMethodName(m.method || '')} • ${m.phoneNumber || '****'}`;
        }
        const acc = m.accountNumber || '';
        return `${m.bankName || 'Bank'} • ${acc.length >= 4 ? '****' + acc.slice(-4) : acc || '****'}`;
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/');
            return;
        }
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        setUser(storedUser);
        if (storedUser.role !== 'freelancer') {
            router.push('/');
            return;
        }
        api.freelancer.getProfile().then(setProfile).catch(() => {});
        fetchData();
    }, [router, fetchData]);

    const handleWithdraw = async () => {
        const grossAmount = Number(withdrawAmount);
        const amountToReceive = grossAmount - WITHDRAWAL_FEE;
        if (isNaN(grossAmount) || grossAmount < 70) {
            showModal({ title: 'Invalid Amount', message: 'Enter at least 70 EGP (you will receive 50 EGP after fees).', type: 'error' });
            return;
        }
        if (amountToReceive < 50) {
            showModal({ title: 'Invalid Amount', message: 'After the 20 EGP fee, you must receive at least 50 EGP.', type: 'error' });
            return;
        }
        if (balance < grossAmount) {
            showModal({ title: 'Insufficient Balance', message: `You need ${grossAmount} EGP. Your balance: ${balance} EGP.`, type: 'error' });
            return;
        }

        let method = withdrawMethod;
        let phoneNumber: string | undefined;
        let accountNumber: string | undefined;
        let bankName: string | undefined;

        const saved = selectedMethodId ? withdrawalMethods.find(m => m._id === selectedMethodId) : null;
        if (saved) {
            method = saved.method;
            phoneNumber = saved.phoneNumber;
            accountNumber = saved.accountNumber;
            bankName = saved.bankName;
        } else {
            if ((withdrawMethod === 'instapay' || withdrawMethod === 'vodafone_cash') && !withdrawPhone.trim()) {
                showModal({ title: 'Phone Required', message: 'Enter your phone number or add a saved withdrawal method above.', type: 'error' });
                return;
            }
            if (withdrawMethod === 'bank' && (!withdrawAccount.trim() || !withdrawBankName.trim())) {
                showModal({ title: 'Details Required', message: 'Enter account number and bank name or add a saved withdrawal method above.', type: 'error' });
                return;
            }
            phoneNumber = withdrawMethod !== 'bank' ? withdrawPhone.trim() : undefined;
            accountNumber = withdrawMethod === 'bank' ? withdrawAccount.trim() : undefined;
            bankName = withdrawMethod === 'bank' ? withdrawBankName.trim() : undefined;
        }

        setSubmitting(true);
        try {
            await api.wallet.createWithdrawal({
                amount: amountToReceive,
                method,
                phoneNumber,
                accountNumber,
                bankName,
                notes: withdrawNotes.trim() || undefined
            });
            showModal({ title: 'Withdrawal Requested', message: `You will receive ${amountToReceive} EGP. Admin will process it shortly. (${WITHDRAWAL_FEE} EGP platform fee.)`, type: 'success' });
            setShowWithdrawModal(false);
            setWithdrawAmount('');
            setSelectedMethodId(null);
            setWithdrawPhone('');
            setWithdrawAccount('');
            setWithdrawBankName('');
            setWithdrawNotes('');
            fetchData();
        } catch (err: any) {
            showModal({ title: 'Error', message: err.message || 'Failed to request withdrawal', type: 'error' });
        } finally {
            setSubmitting(false);
        }
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
            <FreelancerSidebar
                user={user}
                profile={profile}
                onTabChange={() => {}}
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
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900">Wallet</h1>
                </div>
                <p className="text-sm md:text-base text-gray-500 -mt-4 mb-6">Your earnings and withdrawal history.</p>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-[#09BF44]" />
                    </div>
                ) : (
                    <>
                        {/* Withdrawal Methods - manage saved methods */}
                        <div className="bg-white p-5 md:p-8 rounded-3xl shadow-sm border border-gray-100 mb-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                                <Smartphone className="w-5 h-5" /> Your payout methods
                            </h2>
                            <p className="text-sm text-gray-500 mb-6">Manage Vodafone Cash, InstaPay, or bank details used for withdrawals.</p>
                            <div className="space-y-4">
                                {withdrawalMethods.length === 0 && (
                                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-xl">
                                        <Smartphone className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        <p className="font-bold">No withdrawal methods yet</p>
                                        <p className="text-sm mt-1">Add Vodafone Cash, InstaPay, or bank account to receive your earnings.</p>
                                    </div>
                                )}
                                {withdrawalMethods.map((m: any) => (
                                    <div
                                        key={m._id}
                                        className="flex items-center justify-between p-4 rounded-xl border-2 border-gray-100 hover:border-gray-200 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-8 bg-[#09BF44]/10 rounded flex items-center justify-center">
                                                {m.method === 'bank' ? <Building2 className="w-6 h-6 text-[#09BF44]" /> : <Smartphone className="w-6 h-6 text-[#09BF44]" />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{formatMethodDisplay(m)}</p>
                                                <p className="text-xs text-gray-500">{formatMethodDisplay(m)}</p>
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
                                                    onClick={() => api.withdrawalMethods.setDefault(m._id).then(fetchData).catch((e: any) => showModal({ title: 'Error', message: e.message, type: 'error' }))}
                                                    className="px-3 py-1.5 text-sm font-bold text-[#09BF44] hover:bg-[#09BF44]/10 rounded-lg transition-colors"
                                                >
                                                    Set default
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleRemoveMethod(m._id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                aria-label="Remove"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <button
                                    onClick={() => setShowAddMethodModal(true)}
                                    className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-600 font-bold hover:border-[#09BF44] hover:text-[#09BF44] transition-colors flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-5 h-5" /> Add withdrawal method
                                </button>
                            </div>
                        </div>

                        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 mb-8">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-500 mb-1">Available Balance</h2>
                                    <p className="text-3xl md:text-4xl font-black text-[#09BF44]">{balance} EGP</p>
                                </div>
                                <button
                                    onClick={() => setShowWithdrawModal(true)}
                                    disabled={balance < 50 + WITHDRAWAL_FEE}
                                    className="flex items-center justify-center gap-2 px-6 py-3 bg-[#09BF44] hover:bg-[#07a63a] text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ArrowDownToLine className="w-5 h-5" />
                                    Withdraw
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-3">20 EGP fee applies per withdrawal. Min: 50 EGP.</p>
                        </div>

                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                                <h2 className="text-xl font-bold text-gray-900">Transaction History</h2>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-600 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={hideManualTopUp}
                                        onChange={(e) => setHideManualTopUp(e.target.checked)}
                                        className="rounded border-gray-300 text-[#09BF44] focus:ring-[#09BF44]"
                                    />
                                    Hide manual admin top-ups
                                </label>
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
                                                <td className="p-4 font-bold capitalize text-gray-700">
                                                    {tx.type}
                                                    {tx.isManualAdminTopUp && (
                                                        <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">Manual Admin Top-Up</span>
                                                    )}
                                                </td>
                                                <td className={`p-4 font-black ${tx.amount >= 0 ? 'text-[#09BF44]' : 'text-red-500'}`}>
                                                    {tx.amount >= 0 ? '+' : ''}{tx.amount} EGP
                                                </td>
                                                <td className="p-4 text-gray-500 text-sm">{formatDateDDMMYYYY(tx.createdAt)}</td>
                                            </tr>
                                        ))}
                                        {transactions.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="p-8 text-center text-gray-400">No transactions yet.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100">
                                <h2 className="text-xl font-bold text-gray-900">Withdrawal Requests</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Amount</th>
                                            <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Method</th>
                                            <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                                            <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {withdrawals.map((w: any) => (
                                            <tr key={w._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                                <td className="p-4 font-bold text-gray-900">{w.amount} EGP</td>
                                                <td className="p-4 text-gray-600">{formatMethodName(w.method || '') || '-'}</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                        w.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                        w.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                        'bg-amber-100 text-amber-700'
                                                    }`}>
                                                        {w.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-gray-500 text-sm">{formatDateDDMMYYYY(w.createdAt)}</td>
                                            </tr>
                                        ))}
                                        {withdrawals.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="p-8 text-center text-gray-400">No withdrawal requests yet.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Withdraw Modal */}
            {showWithdrawModal && (
                <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" onClick={() => !submitting && setShowWithdrawModal(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Request Withdrawal</h3>
                        <p className="text-sm text-gray-500 mb-4">Enter the amount to withdraw. 20 EGP platform fee applies. Min: 70 EGP.</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Amount (EGP)</label>
                                <input
                                    type="number"
                                    min={70}
                                    value={withdrawAmount}
                                    onChange={e => setWithdrawAmount(e.target.value)}
                                    placeholder="70"
                                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-[#09BF44] outline-none"
                                />
                                {withdrawAmount && Number(withdrawAmount) >= 70 && (
                                    <p className="text-xs text-gray-600 mt-1 font-medium">
                                        You will receive: {Math.max(0, (Number(withdrawAmount) || 0) - WITHDRAWAL_FEE)} EGP. Platform Fees: {WITHDRAWAL_FEE} EGP
                                    </p>
                                )}
                            </div>

                            {withdrawalMethods.length > 0 && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Use saved method</label>
                                    <select
                                        value={selectedMethodId || ''}
                                        onChange={e => setSelectedMethodId(e.target.value || null)}
                                        className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-[#09BF44] outline-none"
                                    >
                                        <option value="">Enter details manually</option>
                                        {withdrawalMethods.map((m: any) => (
                                            <option key={m._id} value={m._id}>{formatMethodDisplay(m)}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {!selectedMethodId && (
                            <>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Withdrawal Method</label>
                                <div className="flex flex-wrap gap-2">
                                    {(['vodafone_cash', 'instapay', 'bank'] as const).map(m => (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => setWithdrawMethod(m)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-colors ${
                                                withdrawMethod === m ? 'bg-[#09BF44] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            {m === 'vodafone_cash' && <Smartphone className="w-4 h-4" />}
                                            {m === 'instapay' && <CreditCard className="w-4 h-4" />}
                                            {m === 'bank' && <Building2 className="w-4 h-4" />}
                                            {formatMethodName(m)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {(withdrawMethod === 'instapay' || withdrawMethod === 'vodafone_cash') && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={withdrawPhone}
                                        onChange={e => setWithdrawPhone(e.target.value)}
                                        placeholder="01XXXXXXXXX"
                                        className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-[#09BF44] outline-none"
                                    />
                                </div>
                            )}

                            {withdrawMethod === 'bank' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Account Number</label>
                                        <input
                                            type="text"
                                            value={withdrawAccount}
                                            onChange={e => setWithdrawAccount(e.target.value)}
                                            placeholder="Account number"
                                            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-[#09BF44] outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Bank Name</label>
                                        <input
                                            type="text"
                                            value={withdrawBankName}
                                            onChange={e => setWithdrawBankName(e.target.value)}
                                            placeholder="e.g. CIB, NBE"
                                            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-[#09BF44] outline-none"
                                        />
                                    </div>
                                </>
                            )}
                            </>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Notes (optional)</label>
                                <textarea
                                    value={withdrawNotes}
                                    onChange={e => setWithdrawNotes(e.target.value)}
                                    placeholder="Any extra details..."
                                    rows={2}
                                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-[#09BF44] outline-none resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => !submitting && setShowWithdrawModal(false)}
                                className="flex-1 py-3 rounded-xl font-bold border-2 border-gray-200 text-gray-600 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleWithdraw}
                                disabled={submitting}
                                className="flex-1 py-3 rounded-xl font-bold bg-[#09BF44] text-white hover:bg-[#07a63a] disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                                Submit Request
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Withdrawal Method Modal */}
            {showAddMethodModal && (
                <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" onClick={() => !addingMethod && setShowAddMethodModal(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Add Withdrawal Method</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Type</label>
                                <div className="flex flex-wrap gap-2">
                                    {(['vodafone_cash', 'instapay', 'bank'] as const).map(m => (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => setAddMethodType(m)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-colors ${
                                                addMethodType === m ? 'bg-[#09BF44] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            {m === 'vodafone_cash' && <Smartphone className="w-4 h-4" />}
                                            {m === 'instapay' && <CreditCard className="w-4 h-4" />}
                                            {m === 'bank' && <Building2 className="w-4 h-4" />}
                                            {formatMethodName(m)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {(addMethodType === 'instapay' || addMethodType === 'vodafone_cash') && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={addMethodPhone}
                                        onChange={e => setAddMethodPhone(e.target.value)}
                                        placeholder="01XXXXXXXXX"
                                        className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-[#09BF44] outline-none"
                                    />
                                </div>
                            )}
                            {addMethodType === 'bank' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Account Number</label>
                                        <input
                                            type="text"
                                            value={addMethodAccount}
                                            onChange={e => setAddMethodAccount(e.target.value)}
                                            placeholder="Account number"
                                            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-[#09BF44] outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Bank Name</label>
                                        <input
                                            type="text"
                                            value={addMethodBankName}
                                            onChange={e => setAddMethodBankName(e.target.value)}
                                            placeholder="e.g. CIB, NBE"
                                            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-[#09BF44] outline-none"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => !addingMethod && setShowAddMethodModal(false)}
                                className="flex-1 py-3 rounded-xl font-bold border-2 border-gray-200 text-gray-600 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddMethod}
                                disabled={addingMethod}
                                className="flex-1 py-3 rounded-xl font-bold bg-[#09BF44] text-white hover:bg-[#07a63a] disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {addingMethod ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                                Add
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
