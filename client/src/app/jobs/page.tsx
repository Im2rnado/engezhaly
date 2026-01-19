"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, ChevronDown, Briefcase } from "lucide-react";
import { api } from "@/lib/api";
import MainHeader from "@/components/MainHeader";

export default function JobsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
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

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            setTimeout(() => {
                setUser(storedUser);
            }, 0);
        }

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

    return (
        <main className="min-h-screen bg-gray-50">
            <MainHeader
                user={user}
                onSearch={handleHeaderSearch}
                searchPlaceholder="Search for jobs..."
                showCategories={true}
            />

            <div className="max-w-[90%] mx-auto px-6 py-8">
                {/* Page Title */}
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Browse Jobs</h1>
                {/* Filters Bar */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="relative">
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                className="pl-3 pr-8 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 font-bold text-sm outline-none focus:border-[#09BF44] appearance-none w-full"
                            >
                                <option value="open" className="text-gray-900">Open Jobs</option>
                                <option value="in_progress" className="text-gray-900">In Progress</option>
                                <option value="completed" className="text-gray-900">Completed</option>
                                <option value="" className="text-gray-900">All Status</option>
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                        </div>

                        <div className="relative">
                            <select
                                value={filters.budget}
                                onChange={(e) => setFilters({ ...filters, budget: e.target.value })}
                                className="pl-3 pr-8 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 font-bold text-sm outline-none focus:border-[#09BF44] appearance-none w-full"
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

                        <div className="ml-auto flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-600">Sort by:</span>
                            <div className="relative">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="pl-3 pr-8 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 font-bold text-sm outline-none focus:border-[#09BF44] appearance-none"
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
                                className="flex items-center gap-1 px-3 py-2 text-sm font-bold text-gray-600 hover:text-gray-900"
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
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredJobs.map((job) => (
                            <div
                                key={job._id}
                                className="bg-white border-2 border-gray-100 rounded-2xl p-6 hover:border-[#09BF44] hover:shadow-xl transition-all"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
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
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {user?.role === 'freelancer' && job.status === 'open' && (
                                    <button
                                        onClick={() => {
                                            // Handle job application
                                            alert('Job application feature coming soon');
                                        }}
                                        className="w-full bg-[#09BF44] hover:bg-[#07a63a] text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-md hover:shadow-lg"
                                    >
                                        Apply Now
                                    </button>
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

        </main>
    );
}
