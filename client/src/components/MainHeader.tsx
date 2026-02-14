"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Search, User, Plus, ChevronDown } from "lucide-react";
import { MAIN_CATEGORIES, CATEGORIES } from "@/lib/categories";
import AuthModal from "@/components/AuthModal";

interface MainHeaderProps {
    user?: any;
    onSearch?: (query: string) => void;
    searchPlaceholder?: string;
    showCategories?: boolean;
}

export default function MainHeader({ user, onSearch, searchPlaceholder = "What service are you looking for?", showCategories = true }: MainHeaderProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState("");
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authStep, setAuthStep] = useState<'role-selection' | 'login'>('role-selection');
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedSubCategory, setSelectedSubCategory] = useState("");
    const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const [searchType, setSearchType] = useState<'projects' | 'jobs'>('projects');
    const searchDropdownRef = useRef<HTMLDivElement>(null);

    // Sync with URL params
    useEffect(() => {
        if (showCategories && pathname === '/projects') {
            setTimeout(() => {
                setSelectedCategory(searchParams.get('category') || '');
                setSelectedSubCategory(searchParams.get('subCategory') || '');
                setSearchQuery(searchParams.get('search') || '');
            }, 0);
        }
    }, [searchParams, pathname, showCategories]);

    // Close search dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target as Node)) {
                setShowSearchDropdown(false);
            }
        };

        if (showSearchDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showSearchDropdown]);

    // Update search type based on current page
    useEffect(() => {
        setTimeout(() => {
            if (pathname === '/jobs') {
                setSearchType('jobs');
            } else if (pathname === '/projects') {
                setSearchType('projects');
            }
        }, 0);
    }, [pathname]);

    const getDashboardPath = () => {
        if (!user) return '/';
        if (user.role === 'admin') return '/admin';
        if (user.role === 'freelancer') return '/dashboard/freelancer';
        if (user.role === 'client') return '/dashboard/client';
        return '/';
    };


    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (onSearch) {
            onSearch(searchQuery);
        } else {
            const params = new URLSearchParams();
            if (searchQuery) params.set('search', searchQuery);
            if (pathname === '/projects' || searchType === 'projects') {
                if (selectedCategory) params.set('category', selectedCategory);
                if (selectedSubCategory) params.set('subCategory', selectedSubCategory);
                router.push(`/projects?${params.toString()}`);
            } else if (pathname === '/jobs' || searchType === 'jobs') {
                router.push(`/jobs?${params.toString()}`);
            } else {
                // Homepage - use searchType
                if (searchType === 'projects') {
                    if (selectedCategory) params.set('category', selectedCategory);
                    if (selectedSubCategory) params.set('subCategory', selectedSubCategory);
                    router.push(`/projects?${params.toString()}`);
                } else {
                    router.push(`/jobs?${params.toString()}`);
                }
            }
        }
        setShowSearchDropdown(false);
    };

    const handleCategoryClick = (category: string) => {
        if (selectedCategory === category) {
            setSelectedCategory('');
            setSelectedSubCategory('');
        } else {
            setSelectedCategory(category);
            setSelectedSubCategory('');
        }
        const params = new URLSearchParams();
        if (searchQuery) params.set('search', searchQuery);
        if (selectedCategory !== category) {
            params.set('category', category);
        }
        router.push(`/projects?${params.toString()}`);
    };

    const handleSubCategoryClick = (subCategory: string) => {
        setSelectedSubCategory(subCategory);
        const params = new URLSearchParams();
        if (searchQuery) params.set('search', searchQuery);
        if (selectedCategory) params.set('category', selectedCategory);
        params.set('subCategory', subCategory);
        router.push(`/projects?${params.toString()}`);
        setHoveredCategory(null);
    };

    const openAuthModal = (step: 'role-selection' | 'login') => {
        setAuthStep(step);
        setIsAuthModalOpen(true);
    };

    return (
        <>
            <header className="border-b border-gray-200 sticky top-0 bg-white/95 backdrop-blur-sm z-50 transition-all duration-300 shadow-sm" style={{ overflow: 'visible' }}>
                {/* Main Header */}
                <div className="max-w-[90%] mx-auto px-6 h-20 flex items-center justify-between" style={{ overflow: 'visible' }}>
                    <div className="flex items-center gap-12 flex-1">
                        {/* Logo */}
                        <div
                            onClick={() => router.push('/')}
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                        >
                            <Image
                                src="/logos/logo-green.png"
                                alt="Engezhaly"
                                width={260}
                                height={66}
                                className="h-20 w-auto"
                                priority
                            />
                        </div>

                        {/* Search Bar */}
                        <form onSubmit={handleSearch} className="hidden lg:flex items-center relative w-full max-w-md">
                            {pathname === '/' && (
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowSearchDropdown(!showSearchDropdown)}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium z-10 flex items-center gap-1"
                                    >
                                        {searchType === 'projects' ? 'Projects' : 'Jobs'}
                                        <ChevronDown className="w-3 h-3" />
                                    </button>
                                    {showSearchDropdown && (
                                        <div className="absolute top-full left-0 mt-4 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[140px] z-500">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSearchType('projects');
                                                    setShowSearchDropdown(false);
                                                }}
                                                className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${searchType === 'projects' ? 'bg-[#09BF44]/10 text-[#09BF44]' : 'text-gray-700 hover:bg-gray-50'}`}
                                            >
                                                Search Projects
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSearchType('jobs');
                                                    setShowSearchDropdown(false);
                                                }}
                                                className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors border-t border-gray-100 ${searchType === 'jobs' ? 'bg-[#09BF44]/10 text-[#09BF44]' : 'text-gray-700 hover:bg-gray-50'}`}
                                            >
                                                Search Jobs
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden w-full transition-shadow focus-within:ring-2 focus-within:ring-[#09BF44] focus-within:border-transparent">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={pathname === '/' ? (searchType === 'projects' ? 'Search projects...' : 'Search jobs...') : (pathname === '/jobs' ? 'Search jobs...' : (pathname === '/projects' ? 'Search projects...' : searchPlaceholder))}
                                    className={`flex-1 px-4 py-2 text-sm text-gray-700 placeholder-gray-400 outline-none ${pathname === '/' ? 'pl-24' : ''}`}
                                />
                                <button type="submit" className="bg-black hover:bg-gray-800 text-white px-4 py-2 transition-colors">
                                    <Search className="w-4 h-4" />
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Navigation & Auth */}
                    <div className="flex items-center gap-6">
                        <nav className="hidden md:flex gap-6 text-sm font-semibold text-gray-600">
                            <button
                                onClick={() => router.push('/projects')}
                                className={`hover:text-[#09BF44] transition-colors ${pathname === '/projects' ? 'text-[#09BF44]' : ''}`}
                            >
                                Explore Projects
                            </button>
                            <button
                                onClick={() => router.push('/jobs')}
                                className={`hover:text-[#09BF44] transition-colors ${pathname === '/jobs' ? 'text-[#09BF44]' : ''}`}
                            >
                                Browse Jobs
                            </button>
                        </nav>
                        {user ? (
                            <div className="flex items-center gap-3">
                                {user.role === 'client' ? (
                                    <>
                                        <button
                                            onClick={() => router.push('/dashboard/client/jobs/create')}
                                            className="flex items-center gap-2 border border-[#09BF44] text-[#09BF44] hover:bg-[#09BF44] hover:text-white text-sm font-bold px-4 py-2 rounded-md transition-all bg-transparent"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Post Job
                                        </button>
                                        <button
                                            onClick={() => router.push(getDashboardPath())}
                                            className="flex items-center gap-2 bg-[#09BF44] hover:bg-[#07a63a] text-white text-sm font-bold px-4 py-2 rounded-md transition-all shadow-md hover:shadow-lg"
                                        >
                                            <User className="w-4 h-4" />
                                            Profile
                                        </button>
                                    </>
                                ) : user.role === 'freelancer' ? (
                                    <>
                                        <button
                                            onClick={() => router.push('/dashboard/freelancer/projects/create')}
                                            className="flex items-center gap-2 border border-[#09BF44] text-[#09BF44] hover:bg-[#09BF44] hover:text-white text-sm font-bold px-4 py-2 rounded-md transition-all bg-transparent"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Create Project
                                        </button>
                                        <button
                                            onClick={() => router.push(getDashboardPath())}
                                            className="flex items-center gap-2 bg-[#09BF44] hover:bg-[#07a63a] text-white text-sm font-bold px-4 py-2 rounded-md transition-all shadow-md hover:shadow-lg"
                                        >
                                            <User className="w-4 h-4" />
                                            Profile
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => router.push(getDashboardPath())}
                                        className="flex items-center gap-2 bg-[#09BF44] hover:bg-[#07a63a] text-white text-sm font-bold px-4 py-2 rounded-md transition-all shadow-md hover:shadow-lg"
                                    >
                                        <User className="w-4 h-4" />
                                        Profile
                                    </button>
                                )}
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={() => openAuthModal('login')}
                                    className="hidden md:block border border-[#09BF44] text-[#09BF44] hover:bg-[#09BF44] hover:text-white text-sm font-bold px-6 py-2 rounded-md transition-all"
                                >
                                    Sign In
                                </button>
                                <button
                                    onClick={() => openAuthModal('role-selection')}
                                    className="bg-[#09BF44] hover:bg-[#07a63a] text-white text-sm font-bold px-6 py-2 rounded-md transition-all shadow-md hover:shadow-lg"
                                >
                                    Join
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Category Navigation Bar - Sleek Design */}
                {showCategories && (
                    <div className="border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white relative" style={{ overflow: 'visible' }}>
                        <div className="max-w-[90%] mx-auto px-6" style={{ overflow: 'visible' }}>
                            <div className="flex items-center gap-1 overflow-x-auto py-3 hide-scrollbar relative" style={{ overflowY: 'visible' }}>
                                <button
                                    onClick={() => {
                                        setSelectedCategory('');
                                        setSelectedSubCategory('');
                                        router.push(`/projects${searchQuery ? `?search=${searchQuery}` : ''}`);
                                    }}
                                    className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${!selectedCategory
                                        ? 'bg-[#09BF44] text-white shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                        }`}
                                >
                                    All Categories
                                </button>
                                {MAIN_CATEGORIES.map((category) => (
                                    <div
                                        key={category}
                                        className="relative z-[60]"
                                        style={{ overflow: 'visible' }}
                                        onMouseEnter={() => setHoveredCategory(category)}
                                        onMouseLeave={() => setHoveredCategory(null)}
                                    >
                                        <button
                                            onClick={() => handleCategoryClick(category)}
                                            className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${selectedCategory === category
                                                ? 'bg-[#09BF44] text-white shadow-sm'
                                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                                }`}
                                        >
                                            {category}
                                        </button>

                                        {/* Subcategory Dropdown Menu */}
                                        {hoveredCategory === category && CATEGORIES[category as keyof typeof CATEGORIES] && (
                                            <div
                                                className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl min-w-[220px] py-2 max-h-[400px] overflow-y-auto"
                                                style={{
                                                    position: 'absolute',
                                                    top: '100%',
                                                    left: 0,
                                                    marginTop: '0.15rem',
                                                    zIndex: 9999
                                                }}
                                            >
                                                {CATEGORIES[category as keyof typeof CATEGORIES].map((subCategory) => (
                                                    <button
                                                        key={subCategory}
                                                        onClick={() => handleSubCategoryClick(subCategory)}
                                                        className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${selectedSubCategory === subCategory
                                                            ? 'bg-[#09BF44]/10 text-[#09BF44]'
                                                            : 'text-gray-700 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        {subCategory}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </header>

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                initialStep={authStep}
            />
        </>
    );
}
