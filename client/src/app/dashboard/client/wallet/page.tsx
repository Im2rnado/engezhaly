"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Loader2, CreditCard, DollarSign, PanelLeft } from 'lucide-react';
import { useModal } from '@/context/ModalContext';
import ClientSidebar from '@/components/ClientSidebar';
import DashboardMobileTopStrip from '@/components/DashboardMobileTopStrip';

export default function WalletPage() {
    const { showModal } = useModal();
    const router = useRouter();
    const [balance, setBalance] = useState(0);
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/');
            return;
        }
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        setUser(storedUser);
        api.client.getProfile().then(setProfile).catch(() => { });
        fetchData();
    }, [router]);

    const fetchData = async () => {
        try {
            const balanceData = await api.wallet.getBalance();
            setBalance(balanceData.balance);

            const txData = await api.wallet.getTransactions();
            setTransactions(txData);
        } catch (err) {
            console.error(err);
        }
    };

    const handleTopUp = async (e: React.FormEvent) => {
        e.preventDefault();
        const amt = Number(amount);
        if (amt < 50) return;

        const fee = 20;
        const netCredit = amt - fee;
        if (netCredit <= 0) {
            showModal({ title: 'Invalid Amount', message: 'Amount must be greater than 20 EGP to cover the platform fee.', type: 'error' });
            return;
        }

        showModal({
            title: 'Confirm Top-Up',
            message: `You will add ${amt} EGP. A 20 EGP platform fee applies. Net credit: ${netCredit} EGP. Confirm?`,
            type: 'confirm',
            onConfirm: async () => {
                setLoading(true);
                try {
                    await api.wallet.topUp({ amount: amt });
                    showModal({ title: 'Success', message: 'Top Up Successful!', type: 'success' });
                    setAmount('');
                    fetchData();
                } catch (err) {
                    console.error(err);
                    showModal({ title: 'Error', message: 'Top Up Failed', type: 'error' });
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    if (!user) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#09BF44]" /></div>;

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
            <ClientSidebar
                user={user}
                profile={profile}
                onTabChange={() => { }}
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
                <div className="max-w-4xl mx-auto">
                    <DashboardMobileTopStrip />
                    <div className="flex items-center gap-3 mb-7 md:mb-8">
                        <button
                            onClick={() => setMobileSidebarOpen(true)}
                            className="md:hidden p-2 rounded-lg border border-gray-200 bg-white text-gray-700"
                            aria-label="Open sidebar"
                        >
                            <PanelLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-2xl md:text-3xl font-black text-gray-900">My Wallet</h1>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        {/* Balance Card */}
                        <div className="bg-white p-5 md:p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between">
                            <div>
                                <h2 className="text-gray-500 font-bold mb-2">Current Balance</h2>
                                <div className="text-3xl md:text-5xl font-black text-[#09BF44]">{balance} EGP</div>
                            </div>
                            <div className="mt-8">
                                <p className="text-sm text-gray-400">Funds are held securely in Escrow until job completion.</p>
                            </div>
                        </div>

                        {/* Top Up Form */}
                        <div className="bg-white p-5 md:p-8 rounded-3xl shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <CreditCard className="w-5 h-5" /> Top Up Wallet
                            </h2>
                            <form onSubmit={handleTopUp} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Amount (EGP)</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                                        <input
                                            type="number"
                                            required
                                            min="50"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="w-full pl-10 p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none font-bold"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">+ 20 EGP Platform Fee will be deducted.</p>
                                </div>
                                <button disabled={loading} type="submit" className="w-full bg-black text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2">
                                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Confirm Payment
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Transactions */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">Transaction History</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Type</th>
                                        <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Amount</th>
                                        <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                                        <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((tx) => (
                                        <tr key={tx._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                            <td className="p-4 font-bold capitalize text-gray-700">{tx.type}</td>
                                            <td className={`p-4 font-black ${tx.amount > 0 ? 'text-[#09BF44]' : 'text-red-500'}`}>
                                                {tx.amount > 0 ? '+' : ''}{tx.amount} EGP
                                            </td>
                                            <td className="p-4">
                                                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold uppercase">{tx.status}</span>
                                            </td>
                                            <td className="p-4 text-gray-500 text-sm">
                                                {new Date(tx.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                    {transactions.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-gray-400">No transactions yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
