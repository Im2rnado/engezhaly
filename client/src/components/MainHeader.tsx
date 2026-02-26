"use client";

import { Suspense, useState, useEffect, useRef, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Search, User, Plus, ChevronDown, Menu, X } from "lucide-react";
import { MAIN_CATEGORIES, CATEGORIES } from "@/lib/categories";
import AuthModal from "@/components/AuthModal";

// Flatten categories and subcategories for search suggestions
const SEARCH_SUGGESTIONS = [
    ...MAIN_CATEGORIES,
    ...Object.values(CATEGORIES).flat()
];

interface MainHeaderProps {
    user?: any;
    onSearch?: (query: string) => void;
    searchPlaceholder?: string;
    showCategories?: boolean;
}

function MainHeaderContent({ user, onSearch, searchPlaceholder = "What service are you looking for?", showCategories = true }: MainHeaderProps) {
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
    const [showAutofill, setShowAutofill] = useState(false);
    const [searchType, setSearchType] = useState<'projects' | 'jobs'>('projects');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mobileSelectedCategory, setMobileSelectedCategory] = useState('');
    const searchDropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const filteredSuggestions = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return SEARCH_SUGGESTIONS.slice(0, 10);
        return SEARCH_SUGGESTIONS
            .filter((s) => s.toLowerCase().includes(q))
            .slice(0, 10);
    }, [searchQuery]);

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

    // Close search dropdown and autofill when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target as Node)) {
                setShowSearchDropdown(false);
                setShowAutofill(false);
            }
        };

        if (showSearchDropdown || showAutofill) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showSearchDropdown, showAutofill]);

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


    const performSearch = (query: string) => {
        if (onSearch) {
            onSearch(query);
        } else {
            const params = new URLSearchParams();
            if (query) params.set('search', query);
            if (pathname === '/projects' || searchType === 'projects') {
                if (selectedCategory) params.set('category', selectedCategory);
                if (selectedSubCategory) params.set('subCategory', selectedSubCategory);
                router.push(`/projects?${params.toString()}`);
            } else if (pathname === '/jobs' || searchType === 'jobs') {
                router.push(`/jobs?${params.toString()}`);
            } else {
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
        setShowAutofill(false);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        performSearch(searchQuery);
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
                {/* Mobile Header */}
                <div className="md:hidden max-w-[95%] mx-auto px-3 py-2.5">
                    <div className="grid grid-cols-3 items-center gap-2">
                        <div className="flex justify-start">
                            <button
                                onClick={() => setMobileMenuOpen((prev) => !prev)}
                                className="p-2 rounded-lg border border-gray-200 text-gray-700"
                                aria-label="Toggle mobile menu"
                            >
                                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                        <button
                            onClick={() => router.push('/')}
                            className="justify-self-center hover:opacity-80 transition-opacity"
                            aria-label="Go to home"
                        >
                            <Image src="/logos/logo-green.png" alt="Engezhaly" width={170} height={42} className="w-28 h-auto" priority />
                        </button>
                        <div className="flex justify-end">
                            {user ? (
                                <button
                                    onClick={() => router.push(getDashboardPath())}
                                    className="text-xs font-bold bg-[#09BF44] text-white px-3 py-2 rounded-md"
                                >
                                    Dashboard
                                </button>
                            ) : (
                                <button
                                    onClick={() => openAuthModal('role-selection')}
                                    className="text-xs font-bold bg-[#09BF44] text-white px-3 py-2 rounded-md"
                                >
                                    Join
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="mt-2">
                        <form onSubmit={handleSearch} className="flex items-center relative w-full">
                            <div className="flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden w-full transition-shadow focus-within:ring-2 focus-within:ring-[#09BF44] focus-within:border-transparent relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setShowAutofill(true);
                                    }}
                                    onFocus={() => setShowAutofill(true)}
                                    placeholder={pathname === '/jobs' ? 'Search jobs...' : 'Search projects...'}
                                    className="flex-1 px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 outline-none rounded-l-lg"
                                />
                                <button type="submit" className="bg-black hover:bg-gray-800 text-white px-3 py-2.5 transition-colors rounded-r-lg">
                                    <Search className="w-4 h-4" />
                                </button>
                                {showAutofill && filteredSuggestions.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-[100]">
                                        {filteredSuggestions.map((suggestion) => (
                                            <button
                                                key={suggestion}
                                                type="button"
                                                onClick={() => {
                                                    setSearchQuery(suggestion);
                                                    setShowAutofill(false);
                                                    performSearch(suggestion);
                                                }}
                                                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-[#09BF44]/10 hover:text-[#09BF44] transition-colors first:rounded-t-lg last:rounded-b-lg"
                                            >
                                                {suggestion}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </form>
                    </div>
                </div>

                {/* Main Header */}
                <div className="hidden md:flex max-w-[95%] md:max-w-[90%] mx-auto px-3 sm:px-4 md:px-6 h-14 sm:h-16 md:h-20 items-center justify-between gap-3" style={{ overflow: 'visible' }}>
                    <div className="flex items-center gap-4 md:gap-12 flex-1 min-w-0">
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
                                className="h-9 sm:h-10 md:h-20 w-auto"
                                priority
                            />
                        </div>

                        {/* Search Bar */}
                        <div ref={searchDropdownRef} className="hidden lg:flex items-center relative w-full max-w-md">
                        <form onSubmit={handleSearch} className="flex items-center relative w-full">
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
                            <div className="flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden w-full transition-shadow focus-within:ring-2 focus-within:ring-[#09BF44] focus-within:border-transparent relative">
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setShowAutofill(true);
                                    }}
                                    onFocus={() => setShowAutofill(true)}
                                    placeholder={pathname === '/' ? (searchType === 'projects' ? 'Search projects...' : 'Search jobs...') : (pathname === '/jobs' ? 'Search jobs...' : (pathname === '/projects' ? 'Search projects...' : searchPlaceholder))}
                                    className={`flex-1 px-4 py-2 text-sm text-gray-700 placeholder-gray-400 outline-none rounded-l-lg ${pathname === '/' ? 'pl-24' : ''}`}
                                />
                                <button type="submit" className="bg-black hover:bg-gray-800 text-white px-4 py-2 transition-colors rounded-r-lg">
                                    <Search className="w-4 h-4" />
                                </button>
                                {showAutofill && filteredSuggestions.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-[100]">
                                        {filteredSuggestions.map((suggestion) => (
                                            <button
                                                key={suggestion}
                                                type="button"
                                                onClick={() => {
                                                    setSearchQuery(suggestion);
                                                    setShowAutofill(false);
                                                    performSearch(suggestion);
                                                }}
                                                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-[#09BF44]/10 hover:text-[#09BF44] transition-colors first:rounded-t-lg last:rounded-b-lg"
                                            >
                                                {suggestion}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </form>
                        </div>
                    </div>

                    {/* Navigation & Auth */}
                    <div className="flex items-center gap-3 md:gap-6 shrink-0">
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
                                            Dashboard
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
                                            Dashboard
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => router.push(getDashboardPath())}
                                        className="flex items-center gap-2 bg-[#09BF44] hover:bg-[#07a63a] text-white text-sm font-bold px-4 py-2 rounded-md transition-all shadow-md hover:shadow-lg"
                                    >
                                        <User className="w-4 h-4" />
                                        Dashboard
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
                                    className="hidden md:block bg-[#09BF44] hover:bg-[#07a63a] text-white text-sm font-bold px-6 py-2 rounded-md transition-all shadow-md hover:shadow-lg"
                                >
                                    Join
                                </button>
                            </>
                        )}
                    </div>
                </div>
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-100 bg-white">
                        <div className="max-w-[95%] mx-auto px-3 py-3 space-y-2">
                            <button onClick={() => { router.push('/projects'); setMobileMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50">Explore Projects</button>
                            <button onClick={() => { router.push('/jobs'); setMobileMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50">Browse Jobs</button>
                            {user?.role === 'client' && (
                                <button onClick={() => { router.push('/dashboard/client/jobs/create'); setMobileMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50">Post Job</button>
                            )}
                            {user?.role === 'freelancer' && (
                                <button onClick={() => { router.push('/dashboard/freelancer/projects/create'); setMobileMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50">Create Project</button>
                            )}
                            <div className="pt-2 border-t border-gray-100">
                                <p className="text-xs font-bold text-gray-500 mb-2 px-1">Categories</p>
                                <select
                                    value={mobileSelectedCategory}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setMobileSelectedCategory(value);
                                        if (value) {
                                            setSelectedCategory(value);
                                            setSelectedSubCategory('');
                                            router.push(`/projects?category=${encodeURIComponent(value)}`);
                                        }
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700"
                                >
                                    <option value="">Select category</option>
                                    {MAIN_CATEGORIES.map((category) => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                                {mobileSelectedCategory && (
                                    <div className="mt-2 max-h-44 overflow-y-auto space-y-1">
                                        {CATEGORIES[mobileSelectedCategory as keyof typeof CATEGORIES]?.map((subCategory) => (
                                            <button
                                                key={subCategory}
                                                onClick={() => {
                                                    setSelectedCategory(mobileSelectedCategory);
                                                    setSelectedSubCategory(subCategory);
                                                    setMobileMenuOpen(false);
                                                    router.push(`/projects?category=${encodeURIComponent(mobileSelectedCategory)}&subCategory=${encodeURIComponent(subCategory)}`);
                                                }}
                                                className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                {subCategory}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {!user && (
                                <div className="flex gap-2 pt-1">
                                    <button onClick={() => { openAuthModal('login'); setMobileMenuOpen(false); }} className="flex-1 border border-[#09BF44] text-[#09BF44] text-sm font-bold px-3 py-2 rounded-md">Sign In</button>
                                    <button onClick={() => { openAuthModal('role-selection'); setMobileMenuOpen(false); }} className="flex-1 bg-[#09BF44] text-white text-sm font-bold px-3 py-2 rounded-md">Join</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Category Navigation Bar - Sleek Design */}
                {showCategories && (
                    <div className="hidden md:block border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white relative" style={{ overflow: 'visible' }}>
                        <div className="max-w-[95%] md:max-w-[90%] mx-auto px-3 sm:px-4 md:px-6" style={{ overflow: 'visible' }}>
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

export default function MainHeader(props: MainHeaderProps) {
    return (
        <Suspense fallback={
            <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center">
                    <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
            </header>
        }>
            <MainHeaderContent {...props} />
        </Suspense>
    );
}
