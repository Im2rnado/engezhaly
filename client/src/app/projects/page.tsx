"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, ChevronDown } from "lucide-react";
import { api } from "@/lib/api";
import ProjectCard from "@/components/ProjectCard";
import MainHeader from "@/components/MainHeader";

export default function ProjectsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [projects, setProjects] = useState<any[]>([]);
    const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
    const [selectedSubCategory, setSelectedSubCategory] = useState(searchParams.get('subCategory') || '');
    const [sortBy, setSortBy] = useState('best-selling');
    const [filters, setFilters] = useState({
        budget: '',
        deliveryTime: '',
        sellerLevel: ''
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

        api.projects.getAll()
            .then(data => {
                setProjects(data || []);
                setFilteredProjects(data || []);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });
    }, []);


    useEffect(() => {
        let filtered = [...projects];

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(project =>
                project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                project.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Category filter
        if (selectedCategory) {
            filtered = filtered.filter(project => project.category === selectedCategory);
        }

        // Subcategory filter
        if (selectedSubCategory) {
            filtered = filtered.filter(project => project.subCategory === selectedSubCategory);
        }

        // Budget filter
        if (filters.budget) {
            const [min, max] = filters.budget.split('-').map(Number);
            filtered = filtered.filter(project => {
                const minPrice = Math.min(...project.packages.map((p: any) => p.price));
                return minPrice >= min && minPrice <= max;
            });
        }

        // Delivery time filter
        if (filters.deliveryTime) {
            const maxDays = parseInt(filters.deliveryTime);
            filtered = filtered.filter(project => {
                const maxDelivery = Math.max(...project.packages.map((p: any) => p.days));
                return maxDelivery <= maxDays;
            });
        }

        // Sort
        if (sortBy === 'price-low') {
            filtered.sort((a, b) => {
                const aMin = Math.min(...a.packages.map((p: any) => p.price));
                const bMin = Math.min(...b.packages.map((p: any) => p.price));
                return aMin - bMin;
            });
        } else if (sortBy === 'price-high') {
            filtered.sort((a, b) => {
                const aMin = Math.min(...a.packages.map((p: any) => p.price));
                const bMin = Math.min(...b.packages.map((p: any) => p.price));
                return bMin - aMin;
            });
        } else if (sortBy === 'newest') {
            filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }

        setTimeout(() => {
            setFilteredProjects(filtered);
        }, 0);
    }, [projects, searchQuery, selectedCategory, selectedSubCategory, filters, sortBy]);

    const handleHeaderSearch = (query: string) => {
        setSearchQuery(query);
        const params = new URLSearchParams();
        if (query) params.set('search', query);
        if (selectedCategory) params.set('category', selectedCategory);
        if (selectedSubCategory) params.set('subCategory', selectedSubCategory);
        router.push(`/projects?${params.toString()}`);
    };

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedCategory('');
        setSelectedSubCategory('');
        setFilters({ budget: '', deliveryTime: '', sellerLevel: '' });
        router.push('/projects');
    };

    return (
        <main className="min-h-screen bg-gray-50">
            <MainHeader
                user={user}
                onSearch={handleHeaderSearch}
                searchPlaceholder="What service are you looking for?"
                showCategories={true}
            />

            <div className="max-w-[90%] mx-auto px-6 py-8">
                {/* Page Title */}
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Browse Projects</h1>
                {/* Filters Bar */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                    {/* Other Filters */}
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="relative">
                            <select
                                value={filters.budget}
                                onChange={(e) => setFilters({ ...filters, budget: e.target.value })}
                                className="pl-3 pr-8 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 font-bold text-sm outline-none focus:border-[#09BF44] appearance-none w-full"
                            >
                                <option value="">Budget</option>
                                <option value="500-1000" className="text-gray-900">500 - 1,000 EGP</option>
                                <option value="1000-2500" className="text-gray-900">1,000 - 2,500 EGP</option>
                                <option value="2500-5000" className="text-gray-900">2,500 - 5,000 EGP</option>
                                <option value="5000-10000" className="text-gray-900">5,000 - 10,000 EGP</option>
                                <option value="10000-999999" className="text-gray-900">10,000+ EGP</option>
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                        </div>

                        <div className="relative">
                            <select
                                value={filters.deliveryTime}
                                onChange={(e) => setFilters({ ...filters, deliveryTime: e.target.value })}
                                className="pl-3 pr-8 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 font-bold text-sm outline-none focus:border-[#09BF44] appearance-none w-full"
                            >
                                <option value="">Delivery Time</option>
                                <option value="1" className="text-gray-900">1 day</option>
                                <option value="3" className="text-gray-900">3 days</option>
                                <option value="7" className="text-gray-900">7 days</option>
                                <option value="14" className="text-gray-900">14 days</option>
                                <option value="30" className="text-gray-900">30+ days</option>
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
                                    <option value="best-selling" className="text-gray-900">Best Selling</option>
                                    <option value="newest" className="text-gray-900">Newest Arrivals</option>
                                    <option value="price-low" className="text-gray-900">Price: Low to High</option>
                                    <option value="price-high" className="text-gray-900">Price: High to Low</option>
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                            </div>
                        </div>

                        {(selectedCategory || selectedSubCategory || filters.budget || filters.deliveryTime || searchQuery) && (
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
                        {filteredProjects.length} {filteredProjects.length === 1 ? 'result' : 'results'}
                    </p>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-400">Loading...</p>
                    </div>
                ) : filteredProjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProjects.map((project) => (
                            <ProjectCard key={project._id} project={project} showContactMe={true} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white rounded-xl">
                        <p className="text-gray-400 text-lg font-bold">No projects found</p>
                        <p className="text-gray-500 text-sm mt-2">Try adjusting your filters</p>
                    </div>
                )}
            </div>

        </main>
    );
}
