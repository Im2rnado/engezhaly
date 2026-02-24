"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, ChevronDown, Briefcase } from "lucide-react";
import { api } from "@/lib/api";
import MainHeader from "@/components/MainHeader";
import AuthModal from "@/components/AuthModal";
import { useModal } from "@/context/ModalContext";

function JobsPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showModal } = useModal();
    const [jobs, setJobs] = useState<any[]>([]);
    const [filteredJobs, setFilteredJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const [sortBy, setSortBy] = useState('newest');
    const [filters, setFilters] = useState({
        budget: '',
        status: 'open'
    });
    const [user, setUser] = useState<any>(null);
    const [applyJob, setApplyJob] = useState<any>(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [proposal, setProposal] = useState({ price: '', days: '', message: '' });
    const [applyLoading, setApplyLoading] = useState(false);

    const refreshUser = () => {
        const token = localStorage.getItem('token');
        if (token) {
            setUser(JSON.parse(localStorage.getItem('user') || '{}'));
        } else {
            setUser(null);
        }
    };

    useEffect(() => {
        refreshUser();

        api.jobs.getAll()
            .then(data => {
                setJobs(data || []);
                setFilteredJobs(data || []);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });
    }, []);

    const handleHeaderSearch = (query: string) => {
        setSearchQuery(query);
        const params = new URLSearchParams();
        if (query) params.set('search', query);
        router.push(`/jobs?${params.toString()}`);
    };

    useEffect(() => {
        let filtered = [...jobs];

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(job =>
                job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                job.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                job.skills?.some((skill: string) => skill.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        // Status filter
        if (filters.status) {
            filtered = filtered.filter(job => job.status === filters.status);
        }

        // Budget filter
        if (filters.budget) {
            const [min, max] = filters.budget.split('-').map(Number);
            filtered = filtered.filter(job => {
                const jobMin = job.budgetRange?.min || 0;
                const jobMax = job.budgetRange?.max || 0;
                return (jobMin >= min && jobMin <= max) || (jobMax >= min && jobMax <= max);
            });
        }

        // Sort
        if (sortBy === 'budget-low') {
            filtered.sort((a, b) => (a.budgetRange?.min || 0) - (b.budgetRange?.min || 0));
        } else if (sortBy === 'budget-high') {
            filtered.sort((a, b) => (b.budgetRange?.max || 0) - (a.budgetRange?.max || 0));
        } else if (sortBy === 'newest') {
            filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }

        setTimeout(() => {
            setFilteredJobs(filtered);
        }, 0);
    }, [jobs, searchQuery, filters, sortBy]);

    const clearFilters = () => {
        setSearchQuery('');
        setFilters({ budget: '', status: 'open' });
        router.push('/jobs');
    };

    const handleApplyClick = (job: any) => {
        if (!user) {
            setApplyJob(job);
            setShowAuthModal(true);
            return;
        }
        if (user.role === 'client') {
            showModal({ title: 'Client Account', message: 'Switch to freelancer account to apply for jobs.', type: 'info' });
            return;
        }
        if (user.role === 'freelancer') {
            setApplyJob(job);
            setProposal({ price: '', days: '', message: '' });
        }
    };

    const handleApplySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!applyJob) return;
        setApplyLoading(true);
        try {
            await api.jobs.apply(applyJob._id, {
                price: Number(proposal.price),
                deliveryDays: Number(proposal.days),
                message: proposal.message
            });
            showModal({ title: 'Success', message: 'Application sent!', type: 'success' });
            setApplyJob(null);
            setProposal({ price: '', days: '', message: '' });
        } catch (err: any) {
            showModal({ title: 'Error', message: err.message || 'Failed to apply', type: 'error' });
        } finally {
            setApplyLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50">
            <MainHeader
                user={user}
                onSearch={handleHeaderSearch}
                searchPlaceholder="Search for jobs..."
                showCategories={true}
            />

            <div className="max-w-[95%] md:max-w-[90%] mx-auto px-4 md:px-6 py-6 md:py-8">
                {/* Page Title */}
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-5 md:mb-6">Browse Jobs</h1>
                {/* Filters Bar */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                    <div className="space-y-3 lg:space-y-0 lg:flex lg:items-end lg:gap-4">
                        <div className="w-full lg:w-auto">
                            <label className="block text-xs font-bold text-gray-500 mb-1">Status</label>
                            <div className="relative w-full sm:w-auto">
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                    className="pl-3 pr-8 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 font-bold text-sm outline-none focus:border-[#09BF44] appearance-none w-full sm:min-w-[170px]"
                                >
                                    <option value="open" className="text-gray-900">Open Jobs</option>
                                    <option value="in_progress" className="text-gray-900">In Progress</option>
                                    <option value="completed" className="text-gray-900">Completed</option>
                                    <option value="" className="text-gray-900">All Status</option>
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                            </div>
                        </div>
                        <div className="w-full lg:w-auto">
                            <label className="block text-xs font-bold text-gray-500 mb-1">Budget</label>
                            <div className="relative w-full sm:w-auto">
                                <select
                                    value={filters.budget}
                                    onChange={(e) => setFilters({ ...filters, budget: e.target.value })}
                                    className="pl-3 pr-8 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 font-bold text-sm outline-none focus:border-[#09BF44] appearance-none w-full sm:min-w-[170px]"
                                >
                                    <option value="">Budget Range</option>
                                    <option value="500-1000" className="text-gray-900">500 - 1,000 EGP</option>
                                    <option value="1000-2500" className="text-gray-900">1,000 - 2,500 EGP</option>
                                    <option value="2500-5000" className="text-gray-900">2,500 - 5,000 EGP</option>
                                    <option value="5000-10000" className="text-gray-900">5,000 - 10,000 EGP</option>
                                    <option value="10000-999999" className="text-gray-900">10,000+ EGP</option>
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                            </div>
                        </div>
                        <div className="w-full lg:w-auto lg:ml-auto">
                            <label className="block text-xs font-bold text-gray-500 mb-1">Sorting</label>
                            <div className="relative flex-1 lg:flex-none">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full lg:w-auto pl-3 pr-8 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 font-bold text-sm outline-none focus:border-[#09BF44] appearance-none lg:min-w-[180px]"
                                >
                                    <option value="newest" className="text-gray-900">Newest First</option>
                                    <option value="budget-low" className="text-gray-900">Budget: Low to High</option>
                                    <option value="budget-high" className="text-gray-900">Budget: High to Low</option>
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                            </div>
                        </div>
                        {(filters.budget || searchQuery) && (
                            <button
                                onClick={clearFilters}
                                className="w-full lg:w-auto flex items-center justify-center gap-1 px-3 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg"
                            >
                                <X className="w-4 h-4" /> Clear
                            </button>
                        )}
                    </div>
                </div>

                {/* Results */}
                <div className="mb-4">
                    <p className="text-gray-600 font-bold">
                        {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'} found
                    </p>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-400">Loading...</p>
                    </div>
                ) : filteredJobs.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                        {filteredJobs.map((job) => (
                            <div
                                key={job._id}
                                className="bg-white border-2 border-gray-100 rounded-2xl p-4 md:p-6 hover:border-[#09BF44] hover:shadow-xl transition-all"
                            >
                                <div className="flex items-start justify-between gap-3 mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <h3 className="text-lg md:text-xl font-bold text-gray-900">{job.title}</h3>
                                            {job.status === 'open' && (
                                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                                                    Open
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">{job.description}</p>
                                        <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-500 font-bold">Budget:</span>
                                                <span className="text-gray-900 font-bold">
                                                    {job.budgetRange?.min || 0} - {job.budgetRange?.max || 0} EGP
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-500 font-bold">Deadline:</span>
                                                <span className="text-gray-900 font-bold">{job.deadline || 'N/A'}</span>
                                            </div>
                                        </div>
                                        {job.skills && job.skills.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {job.skills.slice(0, 5).map((skill: string, idx: number) => (
                                                    <span
                                                        key={idx}
                                                        className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                                {job.skills.length > 5 && (
                                                    <span className="text-gray-500 text-xs font-bold">+{job.skills.length - 5} more</span>
                                                )}
                                                {job.hasApplied && (
                                                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">Applied</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {(user?.role === 'freelancer' || !user) && job.status === 'open' && (
                                    job.hasApplied ? (
                                        <span className="w-full bg-gray-100 text-gray-500 px-6 py-3 rounded-xl font-bold text-center block">
                                            Already Applied
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => handleApplyClick(job)}
                                            className="w-full bg-[#09BF44] hover:bg-[#07a63a] text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-md hover:shadow-lg"
                                        >
                                            Apply Now
                                        </button>
                                    )
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white rounded-xl">
                        <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-20 text-gray-400" />
                        <p className="text-gray-400 text-lg font-bold">No jobs found</p>
                        <p className="text-gray-500 text-sm mt-2">Try adjusting your filters</p>
                    </div>
                )}
            </div>

            {/* Auth Modal - when not logged in and trying to apply */}
            <AuthModal
                isOpen={showAuthModal}
                onClose={() => {
                    setShowAuthModal(false);
                    refreshUser();
                    if (!localStorage.getItem('token')) {
                        setApplyJob(null);
                    } else {
                        api.jobs.getAll().then(data => setJobs(data || [])).catch(() => {});
                    }
                }}
                initialStep="login"
            />

            {/* Apply Modal */}
            {applyJob && user?.role === 'freelancer' && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-8 rounded-3xl max-w-lg w-full shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Apply to {applyJob.title}</h2>
                            <button
                                onClick={() => { setApplyJob(null); setProposal({ price: '', days: '', message: '' }); }}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <form onSubmit={handleApplySubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Your Price (EGP)</label>
                                    <input
                                        required
                                        type="number"
                                        min="500"
                                        value={proposal.price}
                                        onChange={e => setProposal({ ...proposal, price: e.target.value })}
                                        className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none text-gray-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Delivery (Days)</label>
                                    <input
                                        required
                                        type="number"
                                        min="1"
                                        value={proposal.days}
                                        onChange={e => setProposal({ ...proposal, days: e.target.value })}
                                        className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none text-gray-900"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Cover Letter</label>
                                <textarea
                                    required
                                    value={proposal.message}
                                    onChange={e => setProposal({ ...proposal, message: e.target.value })}
                                    className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none h-32 resize-none text-gray-900 placeholder:text-gray-500"
                                    placeholder="Tell the client why you're the perfect fit..."
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setApplyJob(null); setProposal({ price: '', days: '', message: '' }); }}
                                    className="flex-1 bg-gray-100 text-gray-700 font-bold p-3 rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={applyLoading}
                                    className="flex-1 bg-[#09BF44] text-white font-bold p-3 rounded-xl hover:bg-[#07a63a] transition-colors disabled:opacity-70"
                                >
                                    {applyLoading ? 'Sending...' : 'Send Proposal'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}

export default function JobsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-8 h-8 border-2 border-[#09BF44] border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <JobsPageContent />
        </Suspense>
    );
}
