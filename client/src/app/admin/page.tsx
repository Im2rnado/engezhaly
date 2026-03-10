"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { api } from '@/lib/api';
import { formatStatus, formatDateDDMMYYYY } from '@/lib/utils';
import { Check, X, Ban, User, Flag, MessageSquare, Award, BarChart3, TrendingUp, Search, Loader2, Briefcase, FileText, ShoppingBag, CreditCard, Trash2, Star, Edit, LogOut, ArrowLeft, Send, Shield, PanelLeft, Mail, Video, ArrowDownToLine } from 'lucide-react';
import { MAIN_CATEGORIES } from '@/lib/categories';
import { useModal } from '@/context/ModalContext';
import EditModal from '@/components/EditModal';
import DashboardMobileTopStrip from '@/components/DashboardMobileTopStrip';

function UserDetailPanel({ user, onBack, onEdit, onDelete }: { user: any; onBack: () => void; onEdit: () => void; onDelete: () => void }) {
    const fp = user.freelancerProfile;
    const cp = user.clientProfile;
    const isFreelancer = user.role === 'freelancer';
    const isClient = user.role === 'client';

    return (
        <div className="flex flex-col h-full">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-bold">
                    <ArrowLeft className="w-5 h-5" /> Back
                </button>
                <div className="flex gap-2">
                    <button onClick={onEdit} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl"><Edit className="w-5 h-5" /></button>
                    <button onClick={onDelete} className="p-2 text-red-600 hover:bg-red-50 rounded-xl"><Trash2 className="w-5 h-5" /></button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="flex items-center gap-6 mb-8">
                    {fp?.profilePicture ? (
                        <Image src={fp.profilePicture} alt="" width={96} height={96} className="w-24 h-24 rounded-full object-cover border-4 border-gray-100" />
                    ) : (
                        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-3xl font-bold text-gray-500">
                            {user.firstName?.[0]}
                        </div>
                    )}
                    <div>
                        <h2 className="text-2xl font-black text-gray-900">{user.firstName} {user.lastName}</h2>
                        <p className="text-gray-500">@{user.username}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${user.role === 'admin' ? 'bg-purple-100 text-purple-600' : user.role === 'freelancer' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{user.role}</span>
                            {fp?.category && <span className="px-3 py-1 bg-[#09BF44]/10 text-[#09BF44] text-sm font-bold rounded-full">{fp.category}</span>}
                            {fp?.isStudent && <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-bold rounded-full">STUDENT</span>}
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div>
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Personal Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-xl"><p className="text-xs font-bold text-gray-400 mb-1">Email</p><p className="font-medium text-gray-900">{user.email}</p></div>
                            <div className="bg-gray-50 p-4 rounded-xl"><p className="text-xs font-bold text-gray-400 mb-1">Phone</p><p className="font-medium text-gray-900">{user.phoneNumber || 'Not provided'}</p></div>
                            {(isFreelancer || user.dateOfBirth) && <div className="bg-gray-50 p-4 rounded-xl"><p className="text-xs font-bold text-gray-400 mb-1">Date of Birth</p><p className="font-medium text-gray-900">{user.dateOfBirth ? formatDateDDMMYYYY(user.dateOfBirth) : 'Not provided'}</p></div>}
                            {fp?.city && <div className="bg-gray-50 p-4 rounded-xl"><p className="text-xs font-bold text-gray-400 mb-1">City</p><p className="font-medium text-gray-900">{fp.city}</p></div>}
                            {(fp?.languages?.english || fp?.languages?.arabic) && (
                                <div className="bg-gray-50 p-4 rounded-xl">
                                    <p className="text-xs font-bold text-gray-400 mb-1">Languages</p>
                                    <p className="font-medium text-gray-900">{[fp.languages.english && `English: ${fp.languages.english}`, fp.languages.arabic && `Arabic: ${fp.languages.arabic}`].filter(Boolean).join(' • ')}</p>
                                </div>
                            )}
                            {fp?.extraLanguages?.length > 0 && <div className="bg-gray-50 p-4 rounded-xl md:col-span-2"><p className="text-xs font-bold text-gray-400 mb-1">Other Languages</p><p className="font-medium text-gray-900">{fp.extraLanguages.join(', ')}</p></div>}
                            <div className="bg-gray-50 p-4 rounded-xl"><p className="text-xs font-bold text-gray-400 mb-1">Joined</p><p className="font-medium text-gray-900">{formatDateDDMMYYYY(user.createdAt)}</p></div>
                            {user.role === 'freelancer' && <div className="bg-gray-50 p-4 rounded-xl"><p className="text-xs font-bold text-gray-400 mb-1">Status</p><p className="font-medium text-gray-900">{fp?.status === 'approved' ? 'Approved' : fp?.status === 'rejected' ? 'Rejected' : 'Pending'}</p></div>}
                        </div>
                    </div>

                    {isClient && cp && (
                        <div>
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Client Profile</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-xl"><p className="text-xs font-bold text-gray-400 mb-1">Business Type</p><p className="font-medium text-gray-900">{user.businessType || 'Not set'}</p></div>
                                {cp.companyName && <div className="bg-gray-50 p-4 rounded-xl"><p className="text-xs font-bold text-gray-400 mb-1">Company</p><p className="font-medium text-gray-900">{cp.companyName}</p></div>}
                                {cp.position && <div className="bg-gray-50 p-4 rounded-xl"><p className="text-xs font-bold text-gray-400 mb-1">Position</p><p className="font-medium text-gray-900">{cp.position}</p></div>}
                                {cp.companyDescription && <div className="bg-gray-50 p-4 rounded-xl md:col-span-2"><p className="text-xs font-bold text-gray-400 mb-1">Description</p><p className="font-medium text-gray-900">{cp.companyDescription}</p></div>}
                                {(cp.linkedIn || cp.instagram || cp.facebook || cp.tiktok) && (
                                    <div className="bg-gray-50 p-4 rounded-xl md:col-span-2">
                                        <p className="text-xs font-bold text-gray-400 mb-2">Social Links</p>
                                        <div className="flex flex-wrap gap-3">
                                            {cp.linkedIn && <a href={cp.linkedIn.startsWith('http') ? cp.linkedIn : `https://${cp.linkedIn}`} target="_blank" rel="noopener noreferrer" className="text-[#09BF44] hover:underline">LinkedIn</a>}
                                            {cp.instagram && <a href={cp.instagram.startsWith('http') ? cp.instagram : `https://${cp.instagram}`} target="_blank" rel="noopener noreferrer" className="text-[#09BF44] hover:underline">Instagram</a>}
                                            {cp.facebook && <a href={cp.facebook.startsWith('http') ? cp.facebook : `https://${cp.facebook}`} target="_blank" rel="noopener noreferrer" className="text-[#09BF44] hover:underline">Facebook</a>}
                                            {cp.tiktok && <a href={cp.tiktok.startsWith('http') ? cp.tiktok : `https://${cp.tiktok}`} target="_blank" rel="noopener noreferrer" className="text-[#09BF44] hover:underline">TikTok</a>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {isFreelancer && fp?.bio && (
                        <div>
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Bio</h4>
                            <p className="text-gray-700 bg-gray-50 p-4 rounded-xl leading-relaxed whitespace-pre-wrap">{fp.bio}</p>
                        </div>
                    )}

                    {isFreelancer && (
                        <>
                            <div>
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Professional Details</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-4 rounded-xl"><p className="text-xs font-bold text-gray-400 mb-1">Experience</p><p className="font-medium text-gray-900">{fp?.experienceYears != null ? `${fp.experienceYears} years` : 'Not provided'}</p></div>
                                    <div className="bg-gray-50 p-4 rounded-xl"><p className="text-xs font-bold text-gray-400 mb-1">Student</p><p className="font-medium text-gray-900">{fp?.isStudent ? 'Yes' : 'No'}</p></div>
                                </div>
                            </div>

                            {fp?.surveyResponses && (fp.surveyResponses.disagreementHandling || fp.surveyResponses.hoursPerDay || fp.surveyResponses.clientUpdates || fp.surveyResponses.biggestChallenge || fp.surveyResponses.discoverySource) && (
                                <div>
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Survey Responses</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {fp.surveyResponses.disagreementHandling && <div className="bg-gray-50 p-4 rounded-xl"><p className="text-xs font-bold text-gray-400 mb-1">Disagreement handling</p><p className="font-medium text-gray-900">{fp.surveyResponses.disagreementHandling}</p></div>}
                                        {fp.surveyResponses.hoursPerDay && <div className="bg-gray-50 p-4 rounded-xl"><p className="text-xs font-bold text-gray-400 mb-1">Hours per day</p><p className="font-medium text-gray-900">{fp.surveyResponses.hoursPerDay}</p></div>}
                                        {fp.surveyResponses.clientUpdates && <div className="bg-gray-50 p-4 rounded-xl"><p className="text-xs font-bold text-gray-400 mb-1">Client updates</p><p className="font-medium text-gray-900">{fp.surveyResponses.clientUpdates}</p></div>}
                                        {fp.surveyResponses.biggestChallenge && <div className="bg-gray-50 p-4 rounded-xl"><p className="text-xs font-bold text-gray-400 mb-1">Biggest challenge</p><p className="font-medium text-gray-900">{fp.surveyResponses.biggestChallenge}</p></div>}
                                        {fp.surveyResponses.discoverySource && <div className="bg-gray-50 p-4 rounded-xl"><p className="text-xs font-bold text-gray-400 mb-1">Discovery source</p><p className="font-medium text-gray-900">{fp.surveyResponses.discoverySource}</p></div>}
                                    </div>
                                </div>
                            )}

                            {fp?.skills?.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Skills</h4>
                                    <div className="flex flex-wrap gap-2">{fp.skills.map((s: string) => <span key={s} className="px-3 py-1 bg-[#09BF44] text-white text-sm font-medium rounded-full">{s}</span>)}</div>
                                </div>
                            )}

                            {fp?.starterOffer?.title && (
                                <div>
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Starter Offer</h4>
                                    <div className="bg-gray-50 p-4 rounded-xl mb-4">
                                        <p className="font-bold text-gray-900 text-lg">{fp.starterOffer.title}</p>
                                        {fp.starterOffer.subCategory && <span className="inline-block mt-1 px-2 py-0.5 bg-[#09BF44]/10 text-[#09BF44] text-xs font-bold rounded">{fp.starterOffer.subCategory}</span>}
                                        {fp.starterOffer.description && <p className="text-gray-600 text-sm mt-2">{fp.starterOffer.description}</p>}
                                    </div>
                                    {fp.starterOffer.packages?.length > 0 && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {fp.starterOffer.packages.map((pkg: any, i: number) => (
                                                <div key={i} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                    <h5 className="font-bold text-[#09BF44] mb-2">{pkg.type}</h5>
                                                    <p className="text-gray-900 font-bold">{pkg.price} EGP</p>
                                                    <p className="text-gray-500 text-sm">{pkg.days} day delivery</p>
                                                    {pkg.features?.filter((f: string) => f?.trim()).length > 0 && <ul className="mt-2 space-y-1 text-sm">{pkg.features.filter((f: string) => f?.trim()).map((f: string, j: number) => <li key={j} className="flex gap-1"><Check className="w-4 h-4 text-[#09BF44] shrink-0" /><span>{f}</span></li>)}</ul>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {fp?.starterPricing && !fp?.starterOffer?.title && (
                                <div>
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Starter Pricing</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {(['basic', 'standard', 'premium'] as const).map((tier) => {
                                            const pkg = fp.starterPricing[tier];
                                            return pkg ? <div key={tier} className="bg-gray-50 p-4 rounded-xl"><h5 className="font-bold text-[#09BF44] capitalize">{tier}</h5><p className="font-bold">{pkg.price} EGP</p><p className="text-sm text-gray-500">{pkg.days} days</p></div> : null;
                                        })}
                                    </div>
                                </div>
                            )}

                            {fp?.portfolio?.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Portfolio</h4>
                                    <div className="space-y-3">
                                        {fp.portfolio.filter((p: any) => p?.title?.trim()).map((item: any, i: number) => (
                                            <div key={i} className="bg-gray-50 p-4 rounded-xl">
                                                <p className="font-bold text-gray-900">{item.title}</p>
                                                {item.subCategory && <span className="text-xs text-gray-500">{item.subCategory}</span>}
                                                {item.description && <p className="text-sm text-gray-600 mt-1">{item.description}</p>}
                                                {item.link && <a href={item.link.startsWith('http') ? item.link : `https://${item.link}`} target="_blank" rel="noopener noreferrer" className="text-sm text-[#09BF44] hover:underline">View →</a>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                                    {fp?.signupNotes && (
                                <div>
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Signup Notes</h4>
                                    <p className="text-gray-700 bg-gray-50 p-4 rounded-xl whitespace-pre-wrap">{fp.signupNotes}</p>
                                </div>
                            )}

                            {user.withdrawalMethods?.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Withdrawal Methods</h4>
                                    <div className="space-y-3">
                                        {user.withdrawalMethods.map((wm: any, i: number) => (
                                            <div key={i} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                <span className="inline-block px-2 py-0.5 bg-[#09BF44]/10 text-[#09BF44] text-xs font-bold rounded capitalize">{wm.method?.replace('_', ' ')}</span>
                                                {(wm.method === 'vodafone_cash' || wm.method === 'instapay') && wm.phoneNumber && <p className="text-gray-900 font-medium mt-2">{wm.phoneNumber}</p>}
                                                {wm.method === 'bank' && (wm.accountNumber || wm.bankName) && <p className="text-gray-900 font-medium mt-2">{wm.bankName}{wm.bankName && wm.accountNumber ? ' · ' : ''}{wm.accountNumber}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Documents</h4>
                                <div className="space-y-4">
                                    <div className="bg-gray-50 p-4 rounded-xl">
                                        <p className="text-xs font-bold text-gray-400 mb-2">Government ID</p>
                                        {fp?.idDocument ? <a href={fp.idDocument} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline"><FileText className="w-4 h-4" /> View</a> : <p className="text-sm text-gray-400">None</p>}
                                    </div>
                                    {fp?.isStudent && fp?.universityId && (
                                        <div className="bg-gray-50 p-4 rounded-xl">
                                            <p className="text-xs font-bold text-gray-400 mb-2">University ID</p>
                                            <a href={fp.universityId} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline"><FileText className="w-4 h-4" /> View</a>
                                        </div>
                                    )}
                                    {fp?.certifications?.length > 0 && (
                                        <div className="space-y-2">
                                            {fp.certifications.map((c: any, i: number) => (
                                                <div key={i} className="bg-gray-50 p-4 rounded-xl flex justify-between items-center">
                                                    <span className="font-bold">{c.name}</span>
                                                    {c.documentUrl && <a href={c.documentUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline"><FileText className="w-4 h-4" /></a>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function AdminDashboard() {
    const { showModal, hideModal } = useModal();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'approvals' | 'users' | 'projects' | 'jobs' | 'orders' | 'finance' | 'withdrawals' | 'chats' | 'strikes' | 'rewards' | 'emails'>('dashboard');

    // Data States
    const [pendingFreelancers, setPendingFreelancers] = useState<any[]>([]);
    const [activeChats, setActiveChats] = useState<any[]>([]);
    const [insights, setInsights] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [jobs, setJobs] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [topFreelancers, setTopFreelancers] = useState<any>(null);
    const [emailLogs, setEmailLogs] = useState<any[]>([]);
    const [withdrawals, setWithdrawals] = useState<any[]>([]);

    // Search & UI States
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResult, setSearchResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [usersLoading, setUsersLoading] = useState(false);
    const [projectsLoading, setProjectsLoading] = useState(false);
    const [jobsLoading, setJobsLoading] = useState(false);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [financeLoading, setFinanceLoading] = useState(false);
    const [emailsLoading, setEmailsLoading] = useState(false);
    const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);
    const [chatsLoading, setChatsLoading] = useState(false);
    const [editModal, setEditModal] = useState<{ isOpen: boolean; type: 'user' | 'project' | 'job' | null; data: any }>({ isOpen: false, type: null, data: null });

    // Approvals states
    const [selectedFreelancer, setSelectedFreelancer] = useState<any>(null);
    const [approvalCategoryFilter, setApprovalCategoryFilter] = useState<string>('');
    const [approvalStarredOnly, setApprovalStarredOnly] = useState(false);

    // Users tab - selected user for detail view
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [selectedUserLoading, setSelectedUserLoading] = useState(false);

    // Chats states
    const [selectedChat, setSelectedChat] = useState<any>(null);
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [adminMessageInput, setAdminMessageInput] = useState('');
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    // Dispute resolution
    const [disputeModal, setDisputeModal] = useState<{ isOpen: boolean; order: any | null }>({ isOpen: false, order: null });
    const [disputeOutcome, setDisputeOutcome] = useState('');
    const [disputeStatus, setDisputeStatus] = useState<'completed' | 'refunded'>('completed');
    const [resolvingDispute, setResolvingDispute] = useState(false);

    // Fetch Functions
    const fetchPending = async () => {
        try {
            const data = await api.admin.getPendingFreelancers();
            setPendingFreelancers(data);
        } catch (err) {
            console.error('Failed to fetch pending freelancers', err);
        }
    };

    const fetchChats = async () => {
        setChatsLoading(true);
        try {
            const data = await api.admin.getActiveChats();
            setActiveChats(data);
        } catch (err) {
            console.error('Failed to fetch chats', err);
        } finally {
            setChatsLoading(false);
        }
    };

    const fetchChatMessages = async (conversationId: string) => {
        try {
            const data = await api.chat.getMessages(conversationId);
            // Format messages for display
            const formatted = data.map((m: any) => ({
                _id: m._id,
                content: m.content,
                senderId: m.senderId?._id || m.senderId,
                isAdmin: m.isAdmin || m.content?.includes('[Engezhaly Admin]'),
                isMeeting: m.messageType === 'meeting' || m.content?.includes('[Engezhaly Meeting]'),
                messageType: m.messageType,
                createdAt: m.createdAt
            }));
            setChatMessages(formatted);
        } catch (err) {
            console.error('Failed to fetch chat messages', err);
            showModal({ title: 'Error', message: 'Failed to load messages', type: 'error' });
        }
    };

    const handleSelectChat = async (chat: any) => {
        setSelectedChat(chat);
        await fetchChatMessages(chat._id);
    };

    const handleSendAdminMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adminMessageInput.trim() || !selectedChat) return;

        try {
            const participants = selectedChat.participants || [];
            // Send message once - it will be visible to all participants
            // Use the first participant as receiverId (required field, but message is visible to all)
            if (participants.length > 0) {
                await api.admin.sendAdminMessage({
                    conversationId: selectedChat._id,
                    receiverId: participants[0]._id,
                    content: adminMessageInput
                });
            }

            setAdminMessageInput('');
            await fetchChatMessages(selectedChat._id);
            await fetchChats(); // Refresh chat list
        } catch (err: any) {
            console.error(err);
            showModal({ title: 'Error', message: err.message || 'Failed to send message', type: 'error' });
        }
    };

    const fetchInsights = async () => {
        try {
            const data = await api.admin.getInsights();
            setInsights(data);
        } catch (err) {
            console.error('Failed to fetch insights', err);
        }
    };

    const fetchUsers = async () => {
        setUsersLoading(true);
        try {
            const data = await api.admin.getAllUsers();
            setUsers(data);
        } catch (err) {
            console.error('Failed to fetch users', err);
        } finally {
            setUsersLoading(false);
        }
    };

    const fetchProjects = async () => {
        setProjectsLoading(true);
        try {
            const data = await api.admin.getAllProjects();
            setProjects(data);
        } catch (err) {
            console.error('Failed to fetch projects', err);
        } finally {
            setProjectsLoading(false);
        }
    };

    const fetchJobs = async () => {
        setJobsLoading(true);
        try {
            const data = await api.admin.getAllJobs();
            setJobs(data);
        } catch (err) {
            console.error('Failed to fetch jobs', err);
        } finally {
            setJobsLoading(false);
        }
    };

    const fetchOrders = async () => {
        setOrdersLoading(true);
        try {
            const data = await api.admin.getAllOrders();
            setOrders(data);
        } catch (err) {
            console.error('Failed to fetch orders', err);
        } finally {
            setOrdersLoading(false);
        }
    };

    const fetchTransactions = async () => {
        setFinanceLoading(true);
        try {
            const data = await api.admin.getAllTransactions();
            setTransactions(data);
        } catch (err) {
            console.error('Failed to fetch transactions', err);
        } finally {
            setFinanceLoading(false);
        }
    };

    const fetchTopFreelancers = async () => {
        try {
            const data = await api.admin.getTopFreelancers();
            setTopFreelancers(data);
        } catch (err) {
            console.error('Failed to fetch top freelancers', err);
        }
    };

    const fetchEmailLogs = async () => {
        setEmailsLoading(true);
        try {
            const data = await api.admin.getEmailLogs();
            setEmailLogs(data);
        } catch (err) {
            console.error('Failed to fetch email logs', err);
        } finally {
            setEmailsLoading(false);
        }
    };

    const fetchWithdrawals = async () => {
        setWithdrawalsLoading(true);
        try {
            const data = await api.admin.getWithdrawals();
            setWithdrawals(data);
        } catch (err) {
            console.error('Failed to fetch withdrawals', err);
        } finally {
            setWithdrawalsLoading(false);
        }
    };

    useEffect(() => {
        hideModal(); // Clear redirect loader when admin page loads
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only on mount - hideModal is stable (memoized in ModalProvider)

    useEffect(() => {
        fetchPending();
        fetchInsights();
        // Pre-fetch counts for sidebar badges
        fetchUsers();
        fetchProjects();
        fetchJobs();
        fetchOrders();
        fetchTransactions();
        fetchWithdrawals();
        fetchChats();
        fetchEmailLogs();
    }, []);

    useEffect(() => {
        if (activeTab === 'users') fetchUsers();
        if (activeTab === 'projects') fetchProjects();
        if (activeTab === 'jobs') fetchJobs();
        if (activeTab === 'orders') fetchOrders();
        if (activeTab === 'finance') fetchTransactions();
        if (activeTab === 'withdrawals') fetchWithdrawals();
        if (activeTab === 'chats') fetchChats();
        if (activeTab === 'rewards') fetchTopFreelancers();
        if (activeTab === 'emails') fetchEmailLogs();
    }, [activeTab]);

    // Action Handlers
    const handleSearchUser = async () => {
        if (!searchQuery) return;
        setLoading(true);
        try {
            const user = await api.admin.searchUser(searchQuery);
            setSearchResult(user);
        } catch (err) {
            console.error(err);
            showModal({ title: 'Error', message: 'User not found', type: 'error' });
            setSearchResult(null);
        } finally {
            setLoading(false);
        }
    };

    const handleAddStrike = async (userId: string) => {
        try {
            await api.admin.addStrike(userId);
            showModal({ title: 'Success', message: 'Strike added successfully', type: 'success' });
            if (searchQuery) handleSearchUser();
        } catch (err) {
            console.error(err);
            showModal({ title: 'Error', message: 'Failed to add strike', type: 'error' });
        }
    };

    const handleToggleReward = async (userId: string) => {
        try {
            await api.admin.toggleEmployeeOfMonth(userId);
            showModal({ title: 'Success', message: 'Employee of Month Status Toggled', type: 'success' });
            fetchTopFreelancers(); // Refresh data
        } catch (err) {
            console.error(err);
            showModal({ title: 'Error', message: 'Failed to toggle reward', type: 'error' });
        }
    };

    const handleApprove = async (id: string) => {
        try {
            await api.admin.approveFreelancer(id);
            showModal({ title: 'Success', message: 'Freelancer Approved', type: 'success' });
            fetchPending();
        } catch (err) {
            console.error(err);
            showModal({ title: 'Error', message: 'Failed to approve', type: 'error' });
        }
    };

    const handleReject = (id: string) => {
        showModal({
            title: 'Confirm Rejection',
            message: 'Are you sure you want to reject and delete this freelancer?',
            type: 'confirm',
            confirmText: 'Reject',
            onConfirm: async () => {
                try {
                    await api.admin.rejectFreelancer(id);
                    setSelectedFreelancer(null);
                    showModal({ title: 'Success', message: 'Freelancer Rejected', type: 'success' });
                    fetchPending();
                } catch (err) {
                    console.error(err);
                    showModal({ title: 'Error', message: 'Failed to reject', type: 'error' });
                }
            }
        });
    };

    const handleSelectUser = async (user: any) => {
        setSelectedUserLoading(true);
        setSelectedUser(null);
        try {
            const full = await api.admin.getUserById(user._id);
            setSelectedUser(full);
        } catch {
            showModal({ title: 'Error', message: 'Failed to load user details', type: 'error' });
        } finally {
            setSelectedUserLoading(false);
        }
    };

    const handleEditUser = (user: any) => {
        setEditModal({
            isOpen: true,
            type: 'user',
            data: user
        });
    };

    const handleSaveUser = async (formData: any) => {
        try {
            await api.admin.updateUser(editModal.data._id, formData);
            showModal({ title: 'Success', message: 'User updated successfully', type: 'success' });
            fetchUsers();
        } catch (err) {
            console.error(err);
            showModal({ title: 'Error', message: 'Failed to update user', type: 'error' });
        }
    };

    const handleEditProject = (project: any) => {
        setEditModal({
            isOpen: true,
            type: 'project',
            data: project
        });
    };

    const handleSaveProject = async (formData: any) => {
        try {
            await api.admin.updateProject(editModal.data._id, { title: formData.title, isActive: formData.isActive === 'true' });
            showModal({ title: 'Success', message: 'Project updated successfully', type: 'success' });
            fetchProjects();
        } catch (err) {
            console.error(err);
            showModal({ title: 'Error', message: 'Failed to update project', type: 'error' });
        }
    };

    const handleEditJob = (job: any) => {
        setEditModal({
            isOpen: true,
            type: 'job',
            data: job
        });
    };

    const handleSaveJob = async (formData: any) => {
        try {
            await api.admin.updateJob(editModal.data._id, { title: formData.title, status: formData.status });
            showModal({ title: 'Success', message: 'Job updated successfully', type: 'success' });
            fetchJobs();
        } catch (err) {
            console.error(err);
            showModal({ title: 'Error', message: 'Failed to update job', type: 'error' });
        }
    };

    const handleDeleteUser = async (id: string) => {
        showModal({
            title: 'Confirm Deletion',
            message: 'Are you sure you want to permanently delete this user? This action cannot be undone.',
            type: 'confirm',
            onConfirm: async () => {
                try {
                    await api.admin.deleteUser(id);
                    showModal({ title: 'Success', message: 'User deleted successfully', type: 'success' });
                    fetchUsers();
                } catch (err) {
                    console.error(err);
                    showModal({ title: 'Error', message: 'Failed to delete user', type: 'error' });
                }
            }
        });
    };

    const handleDeleteProject = async (id: string) => {
        showModal({
            title: 'Confirm Deletion',
            message: 'Are you sure you want to permanently delete this project? This action cannot be undone.',
            type: 'confirm',
            onConfirm: async () => {
                try {
                    await api.admin.deleteProject(id);
                    showModal({ title: 'Success', message: 'Project deleted successfully', type: 'success' });
                    fetchProjects();
                } catch (err) {
                    console.error(err);
                    showModal({ title: 'Error', message: 'Failed to delete project', type: 'error' });
                }
            }
        });
    };

    const handleDeleteJob = async (id: string) => {
        showModal({
            title: 'Confirm Deletion',
            message: 'Are you sure you want to permanently delete this job? This action cannot be undone.',
            type: 'confirm',
            onConfirm: async () => {
                try {
                    await api.admin.deleteJob(id);
                    showModal({ title: 'Success', message: 'Job deleted successfully', type: 'success' });
                    fetchJobs();
                } catch (err) {
                    console.error(err);
                    showModal({ title: 'Error', message: 'Failed to delete job', type: 'error' });
                }
            }
        });
    };

    const handleFreeze = async (chatId: string) => {
        try {
            await api.admin.freezeChat(chatId);
            showModal({ title: 'Success', message: 'Chat Frozen', type: 'success' });
            fetchChats();
            if (selectedChat && selectedChat._id === chatId) {
                setSelectedChat({ ...selectedChat, isFrozen: true });
            }
        } catch (err) {
            console.error(err);
            showModal({ title: 'Error', message: 'Failed to freeze', type: 'error' });
        }
    };

    const handleUnfreeze = async (chatId: string) => {
        try {
            await api.admin.unfreezeChat(chatId);
            showModal({ title: 'Success', message: 'Chat Unfrozen', type: 'success' });
            fetchChats();
            if (selectedChat && selectedChat._id === chatId) {
                setSelectedChat({ ...selectedChat, isFrozen: false });
            }
        } catch (err) {
            console.error(err);
            showModal({ title: 'Error', message: 'Failed to unfreeze', type: 'error' });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
            {/* Sidebar */}
            <div className={`w-72 bg-white border-r border-gray-200 flex flex-col fixed h-full z-40 shadow-sm transition-transform duration-300 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
                <div className="px-8 py-4 border-b border-gray-100">
                    <div className="flex items-start justify-between">
                        <button
                            onClick={() => router.push('/')}
                            className="hover:opacity-80 transition-opacity cursor-pointer"
                        >
                            <Image
                                src="/logos/logo-green.png"
                                alt="Engezhaly"
                                width={200}
                                height={55}
                                className="h-14 -ml-1 w-auto"
                                priority
                            />
                        </button>
                        <button
                            onClick={() => setMobileSidebarOpen(false)}
                            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                            aria-label="Close sidebar"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <span className="text-xs font-bold text-gray-400 tracking-widest uppercase -mt-2 block">Admin Dashboard</span>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'dashboard' ? 'bg-[#09BF44] text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                        <BarChart3 className="w-5 h-5" /> Dashboard
                    </button>
                    <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'users' ? 'bg-[#09BF44] text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                        <User className="w-5 h-5" /> Users
                        {users.length > 0 && <span className="ml-auto bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">{users.length}</span>}
                    </button>
                    <button onClick={() => setActiveTab('projects')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'projects' ? 'bg-[#09BF44] text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                        <Briefcase className="w-5 h-5" /> Offers
                        {projects.length > 0 && <span className="ml-auto bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">{projects.length}</span>}
                    </button>
                    <button onClick={() => setActiveTab('jobs')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'jobs' ? 'bg-[#09BF44] text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                        <FileText className="w-5 h-5" /> Jobs
                        {jobs.length > 0 && <span className="ml-auto bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">{jobs.length}</span>}
                    </button>
                    <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'orders' ? 'bg-[#09BF44] text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                        <ShoppingBag className="w-5 h-5" /> Orders
                        {orders.length > 0 && <span className="ml-auto bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">{orders.length}</span>}
                    </button>
                    <button onClick={() => setActiveTab('finance')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'finance' ? 'bg-[#09BF44] text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                        <CreditCard className="w-5 h-5" /> Finance
                        {transactions.length > 0 && <span className="ml-auto bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">{transactions.length}</span>}
                    </button>
                    <button onClick={() => setActiveTab('withdrawals')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'withdrawals' ? 'bg-[#09BF44] text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                        <ArrowDownToLine className="w-5 h-5" /> Withdrawals
                        {withdrawals.filter((w: any) => w.status === 'pending').length > 0 && <span className="ml-auto bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">{withdrawals.filter((w: any) => w.status === 'pending').length}</span>}
                    </button>
                    <div className="h-px bg-gray-100 my-2"></div>
                    <button onClick={() => setActiveTab('approvals')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'approvals' ? 'bg-[#09BF44] text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                        <Check className="w-5 h-5" /> Approvals
                        {pendingFreelancers.length > 0 && <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingFreelancers.length}</span>}
                    </button>
                    <button onClick={() => setActiveTab('chats')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'chats' ? 'bg-[#09BF44] text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                        <MessageSquare className="w-5 h-5" /> Chats
                        {activeChats.length > 0 && <span className="ml-auto bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">{activeChats.length}</span>}
                    </button>
                    <button onClick={() => setActiveTab('strikes')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'strikes' ? 'bg-[#09BF44] text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                        <Ban className="w-5 h-5" /> Strikes
                    </button>
                    <button onClick={() => setActiveTab('rewards')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'rewards' ? 'bg-[#09BF44] text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                        <Award className="w-5 h-5" /> Rewards
                    </button>
                    <button onClick={() => setActiveTab('emails')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'emails' ? 'bg-[#09BF44] text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                        <Mail className="w-5 h-5" /> Email Logs
                        {emailLogs.length > 0 && <span className="ml-auto bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">{emailLogs.length}</span>}
                    </button>
                </nav>

                {/* Logout Button */}
                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={() => {
                            showModal({
                                title: 'Log out?',
                                message: 'Are you sure you want to log out?',
                                type: 'confirm',
                                onConfirm: () => {
                                    localStorage.removeItem('token');
                                    localStorage.removeItem('user');
                                    router.push('/');
                                }
                            });
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            </div>
            {mobileSidebarOpen && (
                <button
                    aria-label="Close sidebar overlay"
                    onClick={() => setMobileSidebarOpen(false)}
                    className="fixed inset-0 bg-black/40 z-30 md:hidden"
                />
            )}

            {/* Main Content */}
            <div className="flex-1 md:ml-72 px-4 sm:px-6 md:p-8 pt-3 md:pt-8 pb-8 overflow-y-auto min-h-screen">
                <DashboardMobileTopStrip />
                <header className="flex flex-wrap justify-between items-center gap-3 mb-7 md:mb-10">
                    <div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setMobileSidebarOpen(true)}
                                className="md:hidden p-2 rounded-lg border border-gray-200 bg-white text-gray-700"
                                aria-label="Open sidebar"
                            >
                                <PanelLeft className="w-5 h-5" />
                            </button>
                            <h2 className="text-2xl md:text-3xl font-black text-gray-900 capitalize">{activeTab}</h2>
                        </div>
                        <p className="text-sm md:text-base text-gray-500 mt-1">Manage platform operations.</p>
                    </div>
                </header>

                {activeTab === 'dashboard' && (
                    <div className="space-y-8">
                        {insights ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><User className="w-6 h-6" /></div>
                                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">+12%</span>
                                    </div>
                                    <h3 className="text-gray-500 font-bold text-sm">Total Users</h3>
                                    <p className="text-3xl font-black text-gray-900 mt-1">{insights.totalUsers}</p>
                                </div>
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-green-50 rounded-xl text-[#09BF44]"><Briefcase className="w-6 h-6" /></div>
                                    </div>
                                    <h3 className="text-gray-500 font-bold text-sm">Freelancers</h3>
                                    <p className="text-3xl font-black text-gray-900 mt-1">{insights.totalFreelancers}</p>
                                </div>
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-purple-50 rounded-xl text-purple-600"><User className="w-6 h-6" /></div>
                                    </div>
                                    <h3 className="text-gray-500 font-bold text-sm">Clients</h3>
                                    <p className="text-3xl font-black text-gray-900 mt-1">{insights.totalClients}</p>
                                </div>
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-yellow-50 rounded-xl text-yellow-600"><TrendingUp className="w-6 h-6" /></div>
                                    </div>
                                    <h3 className="text-gray-500 font-bold text-sm">Total Revenue</h3>
                                    <p className="text-3xl font-black text-gray-900 mt-1">{insights.totalRevenue} EGP</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-40">
                                <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
                            </div>
                        )}
                    </div>
                )}

                {/* Users Tab - Split view with detail panel */}
                {activeTab === 'users' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4 border-b border-gray-100">
                                <h3 className="font-bold text-gray-900">All Users</h3>
                                <p className="text-sm text-gray-500">{users.length} total</p>
                            </div>
                            <div className="overflow-y-auto max-h-[calc(100vh-16rem)]">
                                {usersLoading ? (
                                    <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#09BF44]" /></div>
                                ) : users.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500">No users yet.</div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {users.map(user => (
                                            <div
                                                key={user._id}
                                                onClick={() => handleSelectUser(user)}
                                                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedUser?._id === user._id ? 'bg-[#09BF44]/10 border-l-4 border-[#09BF44]' : ''}`}
                                            >
                                                <p className="font-bold text-gray-900">{user.firstName} {user.lastName}</p>
                                                <p className="text-sm text-gray-500 truncate">{user.email}</p>
                                                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold ${user.role === 'admin' ? 'bg-purple-100 text-purple-600' : user.role === 'freelancer' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {user.role}{user.role === 'freelancer' && user.freelancerProfile?.category ? ` · ${user.freelancerProfile.category}` : ''}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            {selectedUserLoading ? (
                                <div className="p-16 flex justify-center"><Loader2 className="w-12 h-12 animate-spin text-[#09BF44]" /></div>
                            ) : selectedUser ? (
                                <UserDetailPanel user={selectedUser} onBack={() => setSelectedUser(null)} onEdit={() => handleEditUser(selectedUser)} onDelete={() => handleDeleteUser(selectedUser._id)} />
                            ) : (
                                <div className="p-16 text-center text-gray-500">
                                    <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                    <p className="font-bold text-gray-700">Select a user to view details</p>
                                    <p className="text-sm mt-1">Click on a user from the list</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Management Tabs (Tables) - projects, jobs, orders, finance */}
                {(activeTab === 'projects' || activeTab === 'jobs' || activeTab === 'orders' || activeTab === 'finance') && (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-bold uppercase">
                                    <tr>
                                        {activeTab === 'projects' && <><th className="p-4">Title</th><th className="p-4">Seller</th><th className="p-4">Price Range</th><th className="p-4">Actions</th></>}
                                        {activeTab === 'jobs' && <><th className="p-4">Title</th><th className="p-4">Client</th><th className="p-4">Budget</th><th className="p-4">Actions</th></>}
                                        {activeTab === 'orders' && <><th className="p-4">ID</th><th className="p-4">Project</th><th className="p-4">Buyer</th><th className="p-4">Seller</th><th className="p-4">Amount</th><th className="p-4">Status</th><th className="p-4">Actions</th></>}
                                        {activeTab === 'finance' && <><th className="p-4">Type</th><th className="p-4">User</th><th className="p-4">Amount</th><th className="p-4">Status</th><th className="p-4">Date</th></>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {activeTab === 'projects' && projectsLoading && (
                                        <tr><td colSpan={4} className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin text-[#09BF44] mx-auto" /></td></tr>
                                    )}
                                    {activeTab === 'projects' && !projectsLoading && projects.length === 0 && (
                                        <tr><td colSpan={4} className="p-8 text-center text-gray-500">No offers yet.</td></tr>
                                    )}
                                    {activeTab === 'projects' && !projectsLoading && projects.map(project => (
                                        <tr key={project._id} className="hover:bg-gray-50">
                                            <td className="p-4 font-bold truncate max-w-xs">{project.title}</td>
                                            <td className="p-4">{project.sellerId?.firstName} {project.sellerId?.lastName}</td>
                                            <td className="p-4 text-gray-600">{project.packages?.[0]?.price} - {project.packages?.[2]?.price} EGP</td>
                                            <td className="p-4 flex gap-2">
                                                <button onClick={() => handleEditProject(project)} className="text-blue-500 hover:bg-blue-50 p-2 rounded"><Edit className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteProject(project._id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 className="w-4 h-4" /></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {activeTab === 'jobs' && jobsLoading && (
                                        <tr><td colSpan={4} className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin text-[#09BF44] mx-auto" /></td></tr>
                                    )}
                                    {activeTab === 'jobs' && !jobsLoading && jobs.length === 0 && (
                                        <tr><td colSpan={4} className="p-8 text-center text-gray-500">No jobs yet.</td></tr>
                                    )}
                                    {activeTab === 'jobs' && !jobsLoading && jobs.map(job => (
                                        <tr key={job._id} className="hover:bg-gray-50">
                                            <td className="p-4 font-bold truncate max-w-xs">{job.title}</td>
                                            <td className="p-4">{job.clientId?.firstName} {job.clientId?.lastName}</td>
                                            <td className="p-4 text-gray-600">{job.budgetRange?.min} - {job.budgetRange?.max} EGP</td>
                                            <td className="p-4 flex gap-2">
                                                <button onClick={() => handleEditJob(job)} className="text-blue-500 hover:bg-blue-50 p-2 rounded"><Edit className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteJob(job._id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 className="w-4 h-4" /></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {activeTab === 'orders' && ordersLoading && (
                                        <tr><td colSpan={7} className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin text-[#09BF44] mx-auto" /></td></tr>
                                    )}
                                    {activeTab === 'orders' && !ordersLoading && orders.length === 0 && (
                                        <tr><td colSpan={7} className="p-8 text-center text-gray-500">No orders yet.</td></tr>
                                    )}
                                    {activeTab === 'orders' && !ordersLoading && orders.map(order => (
                                        <tr key={order._id} className="hover:bg-gray-50">
                                            <td className="p-4 text-gray-400 text-xs">{order._id.substring(0, 8)}...</td>
                                            <td className="p-4 font-bold truncate max-w-xs">{order.projectId?.title}</td>
                                            <td className="p-4">{order.buyerId?.firstName}</td>
                                            <td className="p-4">{order.sellerId?.firstName}</td>
                                            <td className="p-4 font-bold text-gray-900">{order.amount} EGP</td>
                                            <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${order.status === 'completed' ? 'bg-green-100 text-green-700' : order.status === 'disputed' ? 'bg-amber-100 text-amber-700' : order.status === 'refunded' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'}`}>{formatStatus(order.status)}</span></td>
                                            <td className="p-4">
                                                {order.status === 'disputed' && (
                                                    <button
                                                        onClick={() => setDisputeModal({ isOpen: true, order })}
                                                        className="text-[#09BF44] hover:bg-green-50 px-3 py-1.5 rounded font-bold text-sm flex items-center gap-1"
                                                    >
                                                        <Shield className="w-4 h-4" /> Resolve
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {activeTab === 'finance' && financeLoading && (
                                        <tr><td colSpan={5} className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin text-[#09BF44] mx-auto" /></td></tr>
                                    )}
                                    {activeTab === 'finance' && !financeLoading && transactions.length === 0 && (
                                        <tr><td colSpan={5} className="p-8 text-center text-gray-500">No transactions yet.</td></tr>
                                    )}
                                    {activeTab === 'finance' && !financeLoading && transactions.map(tx => (
                                        <tr key={tx._id} className="hover:bg-gray-50">
                                            <td className="p-4 capitalize">{tx.type}</td>
                                            <td className="p-4">{tx.userId?.firstName} {tx.userId?.lastName}</td>
                                            <td className={`p-4 font-bold ${(tx.type === 'fee' || tx.amount > 0) ? 'text-green-600' : 'text-red-600'}`}>
                                                {tx.type === 'fee' || tx.amount > 0 ? `+${Math.abs(tx.amount)}` : tx.amount} EGP
                                            </td>
                                            <td className="p-4"><span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">{formatStatus(tx.status)}</span></td>
                                            <td className="p-4 text-gray-500">{formatDateDDMMYYYY(tx.createdAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'withdrawals' && (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">Freelancer Withdrawal Requests</h2>
                            <p className="text-sm text-gray-500 mt-1">Complete or reject pending withdrawals. Rejected requests refund the freelancer.</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-bold uppercase">
                                    <tr>
                                        <th className="p-4">Freelancer</th>
                                        <th className="p-4">Amount</th>
                                        <th className="p-4">Fee</th>
                                        <th className="p-4">Method</th>
                                        <th className="p-4">Details</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Date</th>
                                        <th className="p-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {withdrawalsLoading ? (
                                        <tr><td colSpan={8} className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin text-[#09BF44] mx-auto" /></td></tr>
                                    ) : withdrawals.length === 0 ? (
                                        <tr><td colSpan={8} className="p-8 text-center text-gray-500">No withdrawal requests yet.</td></tr>
                                    ) : (
                                        withdrawals.map((w: any) => {
                                            const user = w.userId;
                                            const acc = w.accountNumber || '';
                                            const details = w.method === 'bank' ? `${w.bankName || ''} • ${acc.length >= 4 ? '****' + acc.slice(-4) : acc || '-'}` : (w.phoneNumber || '-');
                                            return (
                                                <tr key={w._id} className="hover:bg-gray-50">
                                                    <td className="p-4">
                                                        <span className="font-bold">{user?.firstName} {user?.lastName}</span>
                                                        <span className="block text-xs text-gray-500">{user?.email}</span>
                                                    </td>
                                                    <td className="p-4 font-bold">{w.amount} EGP</td>
                                                    <td className="p-4 text-gray-600">{w.fee || 20} EGP</td>
                                                    <td className="p-4 capitalize">{w.method?.replace('_', ' ')}</td>
                                                    <td className="p-4 text-gray-600 truncate max-w-[140px]">{details}</td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                            w.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                            w.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                            'bg-amber-100 text-amber-700'
                                                        }`}>{w.status}</span>
                                                    </td>
                                                    <td className="p-4 text-gray-500">{formatDateDDMMYYYY(w.createdAt)}</td>
                                                    <td className="p-4">
                                                        {w.status === 'pending' && (
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={async () => {
                                                                        try {
                                                                            await api.admin.completeWithdrawal(w._id);
                                                                            showModal({ title: 'Completed', message: 'Withdrawal marked as completed.', type: 'success' });
                                                                            fetchWithdrawals();
                                                                        } catch (e: any) {
                                                                            showModal({ title: 'Error', message: e.message, type: 'error' });
                                                                        }
                                                                    }}
                                                                    className="text-green-600 hover:bg-green-50 px-3 py-1.5 rounded font-bold text-sm flex items-center gap-1"
                                                                >
                                                                    <Check className="w-4 h-4" /> Complete
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        showModal({
                                                                            title: 'Reject Withdrawal',
                                                                            message: 'Rejecting will refund the freelancer their amount + fee. Continue?',
                                                                            type: 'confirm',
                                                                            confirmText: 'Reject',
                                                                            onConfirm: async () => {
                                                                                try {
                                                                                    await api.admin.rejectWithdrawal(w._id);
                                                                                    showModal({ title: 'Rejected', message: 'Withdrawal rejected and freelancer refunded.', type: 'success' });
                                                                                    fetchWithdrawals();
                                                                                } catch (e: any) {
                                                                                    showModal({ title: 'Error', message: e.message, type: 'error' });
                                                                                }
                                                                            }
                                                                        });
                                                                    }}
                                                                    className="text-red-600 hover:bg-red-50 px-3 py-1.5 rounded font-bold text-sm flex items-center gap-1"
                                                                >
                                                                    <X className="w-4 h-4" /> Reject
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'emails' && (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-bold uppercase">
                                    <tr>
                                        <th className="p-4">Recipient</th>
                                        <th className="p-4">Subject</th>
                                        <th className="p-4">Template</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Sent At</th>
                                        <th className="p-4">Error</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {emailsLoading ? (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin text-[#09BF44] mx-auto" /></td>
                                        </tr>
                                    ) : emailLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-gray-500">No email logs yet.</td>
                                        </tr>
                                    ) : (
                                        emailLogs.map((log: any) => (
                                            <tr key={log._id} className="hover:bg-gray-50">
                                                <td className="p-4 text-gray-900">{log.recipient}</td>
                                                <td className="p-4 truncate max-w-xs">{log.subject}</td>
                                                <td className="p-4"><span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">{log.templateType}</span></td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${log.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {formatStatus(log.status)}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-gray-500">{log.sentAt ? new Date(log.sentAt).toLocaleString() : '-'}</td>
                                                <td className="p-4 text-red-600 text-xs max-w-xs truncate" title={log.error}>{log.error || '-'}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'approvals' && (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        {!selectedFreelancer ? (
                            <>
                                <div className="p-6 border-b border-gray-100">
                                    <h3 className="text-lg font-bold mb-4">Pending Freelancer Approvals</h3>
                                    <div className="flex flex-wrap gap-3 items-center">
                                        <select value={approvalCategoryFilter} onChange={(e) => setApprovalCategoryFilter(e.target.value)} className="px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-[#09BF44] outline-none text-sm font-bold">
                                            <option value="">All Categories</option>
                                            {MAIN_CATEGORIES.map((c) => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={approvalStarredOnly} onChange={(e) => setApprovalStarredOnly(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-[#09BF44]" />
                                            <span className="text-sm font-bold text-gray-700">Starred only</span>
                                        </label>
                                    </div>
                                </div>
                                <div className="p-6">
                                    {(() => {
                                        const filtered = pendingFreelancers.filter((f: any) => {
                                            if (approvalStarredOnly && !f.freelancerProfile?.adminStarred) return false;
                                            if (approvalCategoryFilter && f.freelancerProfile?.category !== approvalCategoryFilter) return false;
                                            return true;
                                        });
                                        return filtered.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                            {filtered.map((f: any) => (
                                                <div
                                                    key={f._id}
                                                    onClick={() => setSelectedFreelancer(f)}
                                                    className="flex flex-col p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-[#09BF44] hover:shadow-sm transition-all cursor-pointer"
                                                >
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex items-center gap-3">
                                                            {f.freelancerProfile?.profilePicture ? (
                                                                <Image src={f.freelancerProfile.profilePicture} alt="" width={48} height={48} className="w-12 h-12 rounded-full object-cover shrink-0" />
                                                            ) : (
                                                                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-xl font-bold text-gray-500 shrink-0">
                                                                    {f.firstName?.[0]}
                                                                </div>
                                                            )}
                                                            <div className="min-w-0">
                                                                <h4 className="font-bold text-gray-900 truncate">{f.firstName} {f.lastName}</h4>
                                                                <p className="text-sm text-gray-500">{f.freelancerProfile?.experienceYears != null ? `${f.freelancerProfile.experienceYears} Years Exp.` : ''}</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={async (e) => {
                                                            e.stopPropagation();
                                                            try {
                                                                if (f.freelancerProfile?.adminStarred) {
                                                                    await api.admin.unstarFreelancer(f._id);
                                                                } else {
                                                                    await api.admin.starFreelancer(f._id);
                                                                }
                                                                fetchPending();
                                                            } catch {}
                                                            }}
                                                            className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                                                        >
                                                            <Star className={`w-5 h-5 ${f.freelancerProfile?.adminStarred ? 'fill-amber-400 text-amber-500' : 'text-gray-300'}`} />
                                                        </button>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 mt-auto pt-2">
                                                        <span className="px-2 py-1 bg-[#09BF44]/10 text-[#09BF44] text-xs font-bold rounded-full uppercase truncate">{(f.freelancerProfile?.category || 'No category')}</span>
                                                        {f.freelancerProfile?.isStudent && (
                                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">STUDENT</span>
                                                        )}
                                                        <span className="text-xs font-bold text-gray-400 ml-auto">Click to review →</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        ) : (
                                        <div className="text-center py-12 text-gray-400">
                                            <Check className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                            <p>{filtered.length === 0 && pendingFreelancers.length > 0 ? 'No matching freelancers.' : 'All caught up! No pending approvals.'}</p>
                                        </div>
                                        );
                                    })()}
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Freelancer Detail View */}
                                <div className="p-6 border-b border-gray-100 flex items-center gap-4">
                                    <button onClick={() => setSelectedFreelancer(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <h3 className="text-lg font-bold">Review Application</h3>
                                </div>
                                <div className="p-8 space-y-8">
                                    {/* Profile Header */}
                                    <div className="flex items-center gap-6">
                                        {selectedFreelancer.freelancerProfile?.profilePicture ? (
                                            <Image src={selectedFreelancer.freelancerProfile.profilePicture} alt="" width={96} height={96} className="w-24 h-24 rounded-full object-cover border-4 border-gray-100" />
                                        ) : (
                                            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-3xl font-bold text-gray-500">
                                                {selectedFreelancer.firstName?.[0]}
                                            </div>
                                        )}
                                        <div>
                                            <h2 className="text-2xl font-black text-gray-900">{selectedFreelancer.firstName} {selectedFreelancer.lastName}</h2>
                                            <p className="text-gray-500 font-medium">@{selectedFreelancer.username}</p>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {selectedFreelancer.freelancerProfile?.category && (
                                                    <span className="inline-block px-3 py-1 bg-[#09BF44]/10 text-[#09BF44] text-sm font-bold rounded-full uppercase">{selectedFreelancer.freelancerProfile.category}</span>
                                                )}
                                                {selectedFreelancer.freelancerProfile?.isStudent && (
                                                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm font-bold rounded-full">STUDENT</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Personal Info */}
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Personal Information</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-gray-50 p-4 rounded-xl">
                                                <p className="text-xs font-bold text-gray-400 mb-1">Email</p>
                                                <p className="font-medium text-gray-900">{selectedFreelancer.email}</p>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-xl">
                                                <p className="text-xs font-bold text-gray-400 mb-1">Phone</p>
                                                <p className="font-medium text-gray-900">{selectedFreelancer.phoneNumber || 'Not provided'}</p>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-xl">
                                                <p className="text-xs font-bold text-gray-400 mb-1">Date of Birth</p>
                                                <p className="font-medium text-gray-900">{selectedFreelancer.dateOfBirth ? formatDateDDMMYYYY(selectedFreelancer.dateOfBirth) : 'Not provided'}</p>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-xl">
                                                <p className="text-xs font-bold text-gray-400 mb-1">City</p>
                                                <p className="font-medium text-gray-900">{selectedFreelancer.freelancerProfile?.city || 'Not provided'}</p>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-xl">
                                                <p className="text-xs font-bold text-gray-400 mb-1">Languages</p>
                                                <p className="font-medium text-gray-900">
                                                    {selectedFreelancer.freelancerProfile?.languages?.english || selectedFreelancer.freelancerProfile?.languages?.arabic
                                                        ? [selectedFreelancer.freelancerProfile.languages.english && `English: ${selectedFreelancer.freelancerProfile.languages.english}`, selectedFreelancer.freelancerProfile.languages.arabic && `Arabic: ${selectedFreelancer.freelancerProfile.languages.arabic}`].filter(Boolean).join(' • ')
                                                        : 'Not provided'}
                                                </p>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-xl">
                                                <p className="text-xs font-bold text-gray-400 mb-1">Joined</p>
                                                <p className="font-medium text-gray-900">{formatDateDDMMYYYY(selectedFreelancer.createdAt)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bio */}
                                    {selectedFreelancer.freelancerProfile?.bio && (
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Bio</h4>
                                            <p className="text-gray-700 bg-gray-50 p-4 rounded-xl leading-relaxed whitespace-pre-wrap">{selectedFreelancer.freelancerProfile.bio}</p>
                                        </div>
                                    )}

                                    {/* Professional Info */}
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Professional Details</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-gray-50 p-4 rounded-xl">
                                                <p className="text-xs font-bold text-gray-400 mb-1">Experience</p>
                                                <p className="font-medium text-gray-900">{selectedFreelancer.freelancerProfile?.experienceYears != null ? `${selectedFreelancer.freelancerProfile.experienceYears} years` : 'Not provided'}</p>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-xl">
                                                <p className="text-xs font-bold text-gray-400 mb-1">Student</p>
                                                <p className="font-medium text-gray-900">{selectedFreelancer.freelancerProfile?.isStudent ? 'Yes' : 'No'}</p>
                                            </div>
                                            {(selectedFreelancer.freelancerProfile?.extraLanguages?.length > 0) && (
                                                <div className="bg-gray-50 p-4 rounded-xl md:col-span-2">
                                                    <p className="text-xs font-bold text-gray-400 mb-1">Other Languages</p>
                                                    <p className="font-medium text-gray-900">{selectedFreelancer.freelancerProfile.extraLanguages.join(', ')}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Survey Responses (5 questions) */}
                                    {(selectedFreelancer.freelancerProfile?.surveyResponses?.disagreementHandling || selectedFreelancer.freelancerProfile?.surveyResponses?.hoursPerDay || selectedFreelancer.freelancerProfile?.surveyResponses?.clientUpdates || selectedFreelancer.freelancerProfile?.surveyResponses?.biggestChallenge || selectedFreelancer.freelancerProfile?.surveyResponses?.discoverySource) && (
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Survey Responses</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {selectedFreelancer.freelancerProfile.surveyResponses.disagreementHandling && (
                                                    <div className="bg-gray-50 p-4 rounded-xl">
                                                        <p className="text-xs font-bold text-gray-400 mb-1">Disagreement handling</p>
                                                        <p className="font-medium text-gray-900">{selectedFreelancer.freelancerProfile.surveyResponses.disagreementHandling}</p>
                                                    </div>
                                                )}
                                                {selectedFreelancer.freelancerProfile.surveyResponses.hoursPerDay && (
                                                    <div className="bg-gray-50 p-4 rounded-xl">
                                                        <p className="text-xs font-bold text-gray-400 mb-1">Hours per day</p>
                                                        <p className="font-medium text-gray-900">{selectedFreelancer.freelancerProfile.surveyResponses.hoursPerDay}</p>
                                                    </div>
                                                )}
                                                {selectedFreelancer.freelancerProfile.surveyResponses.clientUpdates && (
                                                    <div className="bg-gray-50 p-4 rounded-xl">
                                                        <p className="text-xs font-bold text-gray-400 mb-1">Client updates</p>
                                                        <p className="font-medium text-gray-900">{selectedFreelancer.freelancerProfile.surveyResponses.clientUpdates}</p>
                                                    </div>
                                                )}
                                                {selectedFreelancer.freelancerProfile.surveyResponses.biggestChallenge && (
                                                    <div className="bg-gray-50 p-4 rounded-xl">
                                                        <p className="text-xs font-bold text-gray-400 mb-1">Biggest challenge</p>
                                                        <p className="font-medium text-gray-900">{selectedFreelancer.freelancerProfile.surveyResponses.biggestChallenge}</p>
                                                    </div>
                                                )}
                                                {selectedFreelancer.freelancerProfile.surveyResponses.discoverySource && (
                                                    <div className="bg-gray-50 p-4 rounded-xl">
                                                        <p className="text-xs font-bold text-gray-400 mb-1">Discovery source</p>
                                                        <p className="font-medium text-gray-900">{selectedFreelancer.freelancerProfile.surveyResponses.discoverySource}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Skills */}
                                    {selectedFreelancer.freelancerProfile?.skills?.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Skills</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedFreelancer.freelancerProfile.skills.map((s: string) => (
                                                    <span key={s} className="px-3 py-1 bg-[#09BF44] text-white text-sm font-medium rounded-full">{s}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Starter Offer */}
                                    {selectedFreelancer.freelancerProfile?.starterOffer?.title && (
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Starter Offer</h4>
                                            <div className="bg-gray-50 p-4 rounded-xl mb-4">
                                                <p className="font-bold text-gray-900 text-lg">{selectedFreelancer.freelancerProfile.starterOffer.title}</p>
                                                {selectedFreelancer.freelancerProfile.starterOffer.subCategory && (
                                                    <span className="inline-block mt-1 px-2 py-0.5 bg-[#09BF44]/10 text-[#09BF44] text-xs font-bold rounded">{selectedFreelancer.freelancerProfile.starterOffer.subCategory}</span>
                                                )}
                                                {selectedFreelancer.freelancerProfile.starterOffer.description && (
                                                    <p className="text-gray-600 text-sm mt-2 leading-relaxed">{selectedFreelancer.freelancerProfile.starterOffer.description}</p>
                                                )}
                                            </div>
                                            {selectedFreelancer.freelancerProfile.starterOffer.packages?.length > 0 && (
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    {selectedFreelancer.freelancerProfile.starterOffer.packages.map((pkg: any, i: number) => (
                                                        <div key={i} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                            <h5 className="font-bold text-[#09BF44] mb-2">{pkg.type || ['Basic', 'Standard', 'Premium'][i]}</h5>
                                                            <p className="text-gray-900 font-bold text-lg">{pkg.price} EGP</p>
                                                            <p className="text-gray-500 text-sm">{pkg.days} day delivery</p>
                                                            {pkg.revisions != null && <p className="text-gray-500 text-sm">{pkg.revisions} revision(s)</p>}
                                                            {pkg.features?.filter((f: string) => f?.trim()).length > 0 && (
                                                                <ul className="mt-2 space-y-1 text-sm text-gray-600">
                                                                    {pkg.features.filter((f: string) => f?.trim()).map((f: string, j: number) => (
                                                                        <li key={j} className="flex items-start gap-1"><Check className="w-4 h-4 text-[#09BF44] shrink-0 mt-0.5" /><span>{f}</span></li>
                                                                    ))}
                                                                </ul>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Starter Pricing (legacy - if no starterOffer) */}
                                    {!selectedFreelancer.freelancerProfile?.starterOffer?.title && selectedFreelancer.freelancerProfile?.starterPricing && (
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Starter Pricing</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {(['basic', 'standard', 'premium'] as const).map((tier) => {
                                                    const pkg = selectedFreelancer.freelancerProfile.starterPricing[tier];
                                                    return pkg ? (
                                                        <div key={tier} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                            <h5 className="font-bold capitalize text-[#09BF44] mb-2">{tier}</h5>
                                                            <p className="text-gray-900 font-bold text-lg">{pkg.price} EGP</p>
                                                            <p className="text-gray-500 text-sm">{pkg.days} day delivery</p>
                                                            {pkg.description && <p className="text-gray-600 text-sm mt-2">{pkg.description}</p>}
                                                        </div>
                                                    ) : null;
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Portfolio */}
                                    {selectedFreelancer.freelancerProfile?.portfolio?.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Portfolio</h4>
                                            <div className="space-y-3">
                                                {selectedFreelancer.freelancerProfile.portfolio.filter((p: any) => p?.title?.trim()).map((item: any, i: number) => (
                                                    <div key={i} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                        <p className="font-bold text-gray-900">{item.title}</p>
                                                        {item.subCategory && <span className="text-xs text-gray-500">{item.subCategory}</span>}
                                                        {item.description && <p className="text-gray-600 text-sm mt-1">{item.description}</p>}
                                                        {item.link && <a href={item.link.startsWith('http') ? item.link : `https://${item.link}`} target="_blank" rel="noopener noreferrer" className="text-sm text-[#09BF44] hover:underline mt-1 inline-block">View project →</a>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Signup Notes */}
                                    {selectedFreelancer.freelancerProfile?.signupNotes && (
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Signup Notes</h4>
                                            <p className="text-gray-700 bg-gray-50 p-4 rounded-xl leading-relaxed whitespace-pre-wrap">{selectedFreelancer.freelancerProfile.signupNotes}</p>
                                        </div>
                                    )}

                                    {/* Withdrawal Methods */}
                                    {selectedFreelancer.withdrawalMethods?.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Withdrawal Methods</h4>
                                            <div className="space-y-3">
                                                {selectedFreelancer.withdrawalMethods.map((wm: any, i: number) => (
                                                    <div key={i} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                        <span className="inline-block px-2 py-0.5 bg-[#09BF44]/10 text-[#09BF44] text-xs font-bold rounded capitalize">{wm.method?.replace('_', ' ')}</span>
                                                        {(wm.method === 'vodafone_cash' || wm.method === 'instapay') && wm.phoneNumber && <p className="text-gray-900 font-medium mt-2">{wm.phoneNumber}</p>}
                                                        {wm.method === 'bank' && (wm.accountNumber || wm.bankName) && <p className="text-gray-900 font-medium mt-2">{wm.bankName}{wm.bankName && wm.accountNumber ? ' · ' : ''}{wm.accountNumber}</p>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Documents */}
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Documents</h4>
                                        <div className="space-y-4">
                                            {/* Government ID - required for all freelancers */}
                                            <div className="bg-gray-50 p-4 rounded-xl">
                                                <p className="text-xs font-bold text-gray-400 mb-2">Government ID</p>
                                                {selectedFreelancer.freelancerProfile?.idDocument ? (
                                                    <a href={selectedFreelancer.freelancerProfile.idDocument} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline font-medium">
                                                        <FileText className="w-4 h-4" /> View Document
                                                    </a>
                                                ) : (
                                                    <p className="text-sm text-gray-400">None uploaded</p>
                                                )}
                                            </div>
                                            {/* University ID - for students only */}
                                            {selectedFreelancer.freelancerProfile?.isStudent && (
                                                <div className="bg-gray-50 p-4 rounded-xl">
                                                    <p className="text-xs font-bold text-gray-400 mb-2">University ID</p>
                                                    {selectedFreelancer.freelancerProfile?.universityId ? (
                                                        <a href={selectedFreelancer.freelancerProfile.universityId} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline font-medium">
                                                            <FileText className="w-4 h-4" /> View University ID
                                                        </a>
                                                    ) : (
                                                        <p className="text-sm text-gray-400">None uploaded</p>
                                                    )}
                                                </div>
                                            )}
                                            {/* Certifications - name, date, institute, optional document */}
                                            {(selectedFreelancer.freelancerProfile?.certifications?.length > 0 || (selectedFreelancer.freelancerProfile?.certificates?.length > 0 && !selectedFreelancer.freelancerProfile?.certifications?.length)) ? (
                                                <div>
                                                    <p className="text-xs font-bold text-gray-400 mb-2">Certifications</p>
                                                    {selectedFreelancer.freelancerProfile?.certifications?.length > 0 ? (
                                                        <div className="space-y-2">
                                                            {selectedFreelancer.freelancerProfile.certifications.map((c: any, i: number) => (
                                                                <div key={i} className="bg-gray-50 p-4 rounded-xl flex flex-wrap items-center justify-between gap-2">
                                                                    <div>
                                                                        <span className="font-bold">{c.name || `Certification ${i + 1}`}</span>
                                                                        {(c.institute || c.date) && (
                                                                            <span className="text-sm text-gray-600 block mt-1">
                                                                                {c.institute}{c.date ? ` • ${formatDateDDMMYYYY(c.date)}` : ''}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {c.documentUrl && (
                                                                        <a href={c.documentUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline font-medium flex items-center gap-1 shrink-0">
                                                                            <FileText className="w-4 h-4" /> View document
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {(selectedFreelancer.freelancerProfile?.certificates || []).filter(Boolean).map((url: string, i: number) => (
                                                                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline font-medium block bg-gray-50 p-4 rounded-xl">
                                                                    <FileText className="w-4 h-4" /> Certificate {i + 1}
                                                                </a>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>

                                    {/* Approve / Reject */}
                                    <div className="flex gap-4 pt-4 border-t border-gray-100">
                                        <button
                                            onClick={async () => {
                                                await handleApprove(selectedFreelancer._id);
                                                setSelectedFreelancer(null);
                                            }}
                                            className="flex-1 bg-[#09BF44] hover:bg-[#07a63a] text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Check className="w-5 h-5" /> Approve Freelancer
                                        </button>
                                        <button
                                            onClick={() => handleReject(selectedFreelancer._id)}
                                            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                                        >
                                            <X className="w-5 h-5" /> Reject & Delete
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'rewards' && (
                    <div className="space-y-8">
                        <div className="bg-gradient-to-r from-[#09BF44] to-[#07a63a] p-8 rounded-3xl text-white shadow-xl border border-[#09BF44]/20">
                            <h2 className="text-2xl font-bold mb-2">Employee of the Month Recognition</h2>
                            <p className="opacity-90">Highlighting top talent based on real performance metrics.</p>
                        </div>

                        {topFreelancers ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Most Completed Deals */}
                                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <Briefcase className="w-24 h-24 text-gray-900" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center text-blue-600 mb-4">
                                            <TrendingUp className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-gray-500 font-bold uppercase text-xs tracking-wider mb-1">Most Deals</h3>
                                        {topFreelancers.mostDeals ? (
                                            <>
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">
                                                        {topFreelancers.mostDeals.firstName[0]}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-lg text-gray-900 leading-tight">{topFreelancers.mostDeals.firstName} {topFreelancers.mostDeals.lastName}</h4>
                                                        <p className="text-blue-600 font-black">{topFreelancers.mostDeals.value}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleToggleReward(topFreelancers.mostDeals._id)}
                                                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${topFreelancers.mostDeals.freelancerProfile?.isEmployeeOfMonth ? 'bg-green-100 text-green-700' : 'bg-[#09BF44] text-white hover:bg-[#07a63a]'}`}
                                                >
                                                    <Award className="w-4 h-4" />
                                                    {topFreelancers.mostDeals.freelancerProfile?.isEmployeeOfMonth ? 'Current Winner' : 'Select Winner'}
                                                </button>
                                            </>
                                        ) : <p className="text-gray-400 italic">No data yet</p>}
                                    </div>
                                </div>

                                {/* Top Rated */}
                                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <Star className="w-24 h-24 text-yellow-500" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="bg-yellow-50 w-12 h-12 rounded-xl flex items-center justify-center text-yellow-600 mb-4">
                                            <Star className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-gray-500 font-bold uppercase text-xs tracking-wider mb-1">Highest Rated</h3>
                                        {topFreelancers.topRated ? (
                                            <>
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">
                                                        {topFreelancers.topRated.firstName[0]}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-lg text-gray-900 leading-tight">{topFreelancers.topRated.firstName} {topFreelancers.topRated.lastName}</h4>
                                                        <p className="text-yellow-600 font-black">{topFreelancers.topRated.value}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleToggleReward(topFreelancers.topRated._id)}
                                                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${topFreelancers.topRated.freelancerProfile?.isEmployeeOfMonth ? 'bg-green-100 text-green-700' : 'bg-[#09BF44] text-white hover:bg-[#07a63a]'}`}
                                                >
                                                    <Award className="w-4 h-4" />
                                                    {topFreelancers.topRated.freelancerProfile?.isEmployeeOfMonth ? 'Current Winner' : 'Select Winner'}
                                                </button>
                                            </>
                                        ) : <p className="text-gray-400 italic">No data yet</p>}
                                    </div>
                                </div>

                                {/* On Time Delivery */}
                                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <TrendingUp className="w-24 h-24 text-green-500" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="bg-green-50 w-12 h-12 rounded-xl flex items-center justify-center text-green-600 mb-4">
                                            <Check className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-gray-500 font-bold uppercase text-xs tracking-wider mb-1">Best Reliability</h3>
                                        {topFreelancers.onTime ? (
                                            <>
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">
                                                        {topFreelancers.onTime.firstName[0]}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-lg text-gray-900 leading-tight">{topFreelancers.onTime.firstName} {topFreelancers.onTime.lastName}</h4>
                                                        <p className="text-green-600 font-black">{topFreelancers.onTime.value}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleToggleReward(topFreelancers.onTime._id)}
                                                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${topFreelancers.onTime.freelancerProfile?.isEmployeeOfMonth ? 'bg-green-100 text-green-700' : 'bg-[#09BF44] text-white hover:bg-[#07a63a]'}`}
                                                >
                                                    <Award className="w-4 h-4" />
                                                    {topFreelancers.onTime.freelancerProfile?.isEmployeeOfMonth ? 'Current Winner' : 'Select Winner'}
                                                </button>
                                            </>
                                        ) : <p className="text-gray-400 italic">No data yet</p>}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-gray-300" /></div>
                        )}
                    </div>
                )}

                {activeTab === 'chats' && (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
                        {!selectedChat ? (
                            <>
                                <div className="p-6 border-b border-gray-100 flex justify-between items-center flex-shrink-0">
                                    <h3 className="text-lg font-bold">Active Conversations</h3>
                                    <span className="text-xs font-bold bg-gray-100 px-3 py-1 rounded-full text-gray-500">{activeChats.length} Active</span>
                                </div>
                                <div className="divide-y divide-gray-100 flex-1 min-h-0 overflow-y-auto">
                                    {chatsLoading ? (
                                        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-[#09BF44]" /></div>
                                    ) : activeChats.length === 0 ? (
                                        <div className="p-12 text-center text-gray-500">No active chats yet.</div>
                                    ) : activeChats.map((chat) => {
                                        const participants = chat.participants || [];
                                        const participant1 = participants[0];
                                        const participant2 = participants[1];
                                        const participant1Initial = participant1?.firstName?.[0]?.toUpperCase() || 'U';
                                        const participant2Initial = participant2?.firstName?.[0]?.toUpperCase() || 'U';
                                        const participantNames = participants.length >= 2
                                            ? `${participant1?.firstName || 'Unknown'} & ${participant2?.firstName || 'Unknown'}`
                                            : participants.length === 1
                                                ? `${participant1?.firstName || 'Unknown'}`
                                                : 'Unknown Users';

                                        return (
                                            <div
                                                key={chat._id}
                                                onClick={() => handleSelectChat(chat)}
                                                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-3 flex-1">
                                                    <div className="flex -space-x-2">
                                                        {participants.length > 0 && (
                                                            <div className="w-10 h-10 bg-blue-100 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-blue-600">
                                                                {participant1Initial}
                                                            </div>
                                                        )}
                                                        {participants.length > 1 && (
                                                            <div className="w-10 h-10 bg-purple-100 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-purple-600">
                                                                {participant2Initial}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-sm text-gray-900 truncate">{participantNames}</h4>
                                                        <p className="text-xs text-gray-500 truncate">
                                                            {chat.updatedAt ? `Last active ${formatDateDDMMYYYY(chat.updatedAt)}` : 'No activity'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {chat.isFrozen && (
                                                        <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
                                                            <Flag className="w-3 h-3" /> Frozen
                                                        </span>
                                                    )}
                                                    {!chat.isFrozen && (
                                                        <span className="text-xs text-gray-400">Active</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Chat Detail View */}
                                <div className="p-6 border-b border-gray-100 flex items-center gap-4 flex-shrink-0">
                                    <button
                                        onClick={() => {
                                            setSelectedChat(null);
                                            setChatMessages([]);
                                        }}
                                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="flex -space-x-2">
                                            {selectedChat.participants?.map((p: any, idx: number) => (
                                                <div key={idx} className={`w-10 h-10 ${idx === 0 ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'} rounded-full border-2 border-white flex items-center justify-center text-xs font-bold`}>
                                                    {p?.firstName?.[0]?.toUpperCase() || 'U'}
                                                </div>
                                            ))}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">
                                                {selectedChat.participants?.map((p: any) => p?.firstName).filter(Boolean).join(' & ') || 'Unknown Users'}
                                            </h3>
                                            {selectedChat.isFrozen && (
                                                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1 mt-1">
                                                    <Flag className="w-3 h-3" /> Frozen
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {selectedChat.isFrozen ? (
                                            <button
                                                onClick={async () => {
                                                    await handleUnfreeze(selectedChat._id);
                                                    setSelectedChat({ ...selectedChat, isFrozen: false });
                                                }}
                                                className="px-4 py-2 bg-green-100 text-green-600 rounded-lg text-sm font-bold hover:bg-green-200 transition-colors flex items-center gap-2"
                                            >
                                                <Check className="w-4 h-4" /> Unfreeze
                                            </button>
                                        ) : (
                                            <button
                                                onClick={async () => {
                                                    await handleFreeze(selectedChat._id);
                                                    setSelectedChat({ ...selectedChat, isFrozen: true });
                                                }}
                                                className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-200 transition-colors flex items-center gap-2"
                                            >
                                                <Ban className="w-4 h-4" /> Freeze
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 bg-gray-50">
                                    {chatMessages.map((msg: any) => {
                                        const isAdmin = msg.isAdmin || msg.content?.includes('[Engezhaly Admin]');
                                        const isMeeting = msg.isMeeting || msg.messageType === 'meeting' || msg.content?.includes('[Engezhaly Meeting]');
                                        const isCentered = isAdmin || isMeeting;
                                        let content = msg.content || '';
                                        if (isAdmin) content = content.replace('[Engezhaly Admin]', '').trim();
                                        if (isMeeting) content = content.replace('[Engezhaly Meeting]', '').trim();
                                        const linkMatch = content.match(/Join here: (https?:\/\/[^\s]+)/);
                                        const meetingLink = linkMatch ? linkMatch[1] : null;
                                        const senderId = String(msg.senderId?._id || msg.senderId);
                                        const participant1Id = selectedChat.participants?.[0]?._id ? String(selectedChat.participants[0]._id) : null;
                                        const participant2Id = selectedChat.participants?.[1]?._id ? String(selectedChat.participants[1]._id) : null;
                                        const isFromParticipant1 = participant1Id && senderId === participant1Id;

                                        return (
                                            <div key={msg._id} className={`flex ${isCentered ? 'justify-center' : isFromParticipant1 ? 'justify-start' : 'justify-end'}`}>
                                                <div className={`max-w-[70%] px-4 py-2 rounded-2xl shadow-sm ${isAdmin
                                                        ? 'bg-yellow-100 border-2 border-yellow-300 text-gray-900'
                                                        : isMeeting
                                                            ? 'bg-green-50 border-2 border-[#09BF44]/40 text-gray-900'
                                                            : isFromParticipant1
                                                                ? 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
                                                                : 'bg-[#09BF44] text-white rounded-br-sm'
                                                    }`}>
                                                    {isAdmin && (
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Shield className="w-4 h-4 text-yellow-600" />
                                                            <span className="text-xs font-bold text-yellow-700">Engezhaly Admin</span>
                                                        </div>
                                                    )}
                                                    {isMeeting && (
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Video className="w-4 h-4 text-[#09BF44]" />
                                                            <span className="text-xs font-bold text-[#09BF44]">Video Meeting</span>
                                                        </div>
                                                    )}
                                                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{content}</p>
                                                    {meetingLink && (
                                                        <a
                                                            href={meetingLink}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-2 mt-2 px-3 py-2 bg-[#09BF44] text-white rounded-xl font-bold text-sm hover:bg-[#07a63a] transition-colors"
                                                        >
                                                            <Video className="w-4 h-4" /> Join Meeting
                                                        </a>
                                                    )}
                                                    <div className={`flex items-center justify-end mt-1 ${isAdmin ? 'text-yellow-700' : isMeeting ? 'text-[#09BF44]/80' : isFromParticipant1 ? 'text-gray-500' : 'text-green-50'}`}>
                                                        <span className="text-[10px]">
                                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {chatMessages.length === 0 && (
                                        <div className="text-center py-12 text-gray-400">
                                            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                            <p>No messages yet.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Admin Message Input */}
                                <div className="p-6 border-t border-gray-200 bg-white flex-shrink-0">
                                    <form onSubmit={handleSendAdminMessage} className="flex items-center gap-3">
                                        <input
                                            type="text"
                                            value={adminMessageInput}
                                            onChange={(e) => setAdminMessageInput(e.target.value)}
                                            placeholder="Type a message as admin..."
                                            className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-sm"
                                        />
                                        <button
                                            type="submit"
                                            className="px-6 py-2 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-colors font-bold flex items-center gap-2"
                                        >
                                            <Send className="w-4 h-4" />
                                            Send as Admin
                                        </button>
                                    </form>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'strikes' && (
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                            <div className="p-8 text-center border-b border-gray-100 bg-gray-50/50">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                                    <Ban className="w-8 h-8" />
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 mb-2">Manage Strikes & Bans</h2>
                                <p className="text-gray-500">Search for a user to perform this action.</p>
                            </div>

                            <div className="p-8">
                                <div className="flex gap-2 mb-6">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            placeholder="Search by Username, Email or ID"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#09BF44] transition-all"
                                        />
                                    </div>
                                    <button
                                        onClick={handleSearchUser}
                                        disabled={loading}
                                        className="bg-[#09BF44] text-white px-6 rounded-xl font-bold hover:bg-[#07a63a] transition-colors disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
                                    </button>
                                </div>

                                {searchResult && (
                                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 animate-in fade-in slide-in-from-bottom-4">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-12 h-12 bg-[#09BF44] rounded-full flex items-center justify-center text-white font-bold text-xl">
                                                {searchResult.firstName[0]}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-lg text-gray-900">{searchResult.firstName} {searchResult.lastName}</h4>
                                                <p className="text-sm text-gray-500">{searchResult.email}</p>
                                                <span className="inline-block mt-1 text-xs font-bold bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-500 capitalize">{searchResult.role}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleAddStrike(searchResult._id)}
                                            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Ban className="w-5 h-5" /> Add Strike ({searchResult.strikes || 0})
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* Edit Modal */}
            {editModal.type === 'user' && (
                <EditModal
                    isOpen={editModal.isOpen}
                    onClose={() => setEditModal({ isOpen: false, type: null, data: null })}
                    onSave={handleSaveUser}
                    title="Edit User"
                    fields={[
                        { name: 'firstName', label: 'First Name', defaultValue: editModal.data?.firstName || '' },
                        { name: 'lastName', label: 'Last Name', defaultValue: editModal.data?.lastName || '' },
                        { name: 'email', label: 'Email', defaultValue: editModal.data?.email || '' },
                        { name: 'role', label: 'Role', type: 'select', options: ['client', 'freelancer', 'admin'], defaultValue: editModal.data?.role || 'client' }
                    ]}
                />
            )}

            {editModal.type === 'project' && (
                <EditModal
                    isOpen={editModal.isOpen}
                    onClose={() => setEditModal({ isOpen: false, type: null, data: null })}
                    onSave={handleSaveProject}
                    title="Edit Project"
                    fields={[
                        { name: 'title', label: 'Title', defaultValue: editModal.data?.title || '' },
                        { name: 'isActive', label: 'Is Active', type: 'select', options: ['true', 'false'], defaultValue: String(editModal.data?.isActive ?? true) }
                    ]}
                />
            )}

            {editModal.type === 'job' && (
                <EditModal
                    isOpen={editModal.isOpen}
                    onClose={() => setEditModal({ isOpen: false, type: null, data: null })}
                    onSave={handleSaveJob}
                    title="Edit Job"
                    fields={[
                        { name: 'title', label: 'Title', defaultValue: editModal.data?.title || '' },
                        { name: 'status', label: 'Status', type: 'select', options: ['open', 'in_progress', 'completed', 'closed'], defaultValue: editModal.data?.status || 'open' }
                    ]}
                />
            )}

            {/* Dispute Resolution Modal */}
            {disputeModal.isOpen && disputeModal.order && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold mb-4">Resolve Dispute</h3>
                        <p className="text-gray-600 text-sm mb-4">
                            Order: <strong>{disputeModal.order.projectId?.title || 'Custom Offer'}</strong> ({disputeModal.order.amount} EGP)
                        </p>
                        {disputeModal.order.disputeReason && (
                            <p className="text-amber-700 bg-amber-50 p-3 rounded-xl text-sm mb-4">
                                <strong>Reason:</strong> {disputeModal.order.disputeReason}
                            </p>
                        )}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Outcome</label>
                                <select
                                    value={disputeStatus}
                                    onChange={(e) => setDisputeStatus(e.target.value as 'completed' | 'refunded')}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2"
                                >
                                    <option value="completed">Release to Freelancer</option>
                                    <option value="refunded">Refund Client</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Outcome Message (sent to both parties)</label>
                                <textarea
                                    value={disputeOutcome}
                                    onChange={(e) => setDisputeOutcome(e.target.value)}
                                    placeholder="e.g. After review, we have released funds to the freelancer."
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2 min-h-[80px]"
                                    rows={3}
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setDisputeModal({ isOpen: false, order: null });
                                    setDisputeOutcome('');
                                    setDisputeStatus('completed');
                                }}
                                className="flex-1 py-2 rounded-xl font-bold border border-gray-200 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    setResolvingDispute(true);
                                    try {
                                        await api.admin.updateOrder(disputeModal.order._id, {
                                            status: disputeStatus,
                                            disputeOutcome: disputeOutcome.trim() || undefined
                                        });
                                        showModal({ title: 'Dispute Resolved', message: 'Both parties have been notified.', type: 'success' });
                                        setDisputeModal({ isOpen: false, order: null });
                                        setDisputeOutcome('');
                                        setDisputeStatus('completed');
                                        fetchOrders();
                                    } catch (e: any) {
                                        showModal({ title: 'Error', message: e.message || 'Failed to resolve dispute', type: 'error' });
                                    } finally {
                                        setResolvingDispute(false);
                                    }
                                }}
                                disabled={resolvingDispute}
                                className="flex-1 py-2 rounded-xl font-bold bg-[#09BF44] text-white hover:bg-[#08a83a] disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {resolvingDispute ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                Resolve
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
