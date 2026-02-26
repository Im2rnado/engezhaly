"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ArrowRight, Code, Palette, TrendingUp, Video, Sparkles, PenTool, Mic, Search, Briefcase, ShieldCheck, Zap, Star, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import ProjectCardCompact from "@/components/ProjectCardCompact";
import { MAIN_CATEGORIES } from "@/lib/categories";
import MainHeader from "@/components/MainHeader";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [topFreelancers, setTopFreelancers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectStartIndex, setProjectStartIndex] = useState(0);
  const [jobStartIndex, setJobStartIndex] = useState(0);
  const [heroSearchQuery, setHeroSearchQuery] = useState("");
  const [heroSearchType, setHeroSearchType] = useState<"projects" | "jobs">("projects");

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      setTimeout(() => {
        setUser(storedUser);
      }, 0);
    }

    // Fetch projects, jobs, and top freelancers
    Promise.all([
      api.projects.getAll().catch(() => []),
      api.jobs.getAll().catch(() => []),
      api.freelancer.getTopFreelancers().catch(() => [])
    ]).then(([projectsData, jobsData, freelancersData]) => {
      setProjects(projectsData || []);
      setJobs(jobsData || []);
      setTopFreelancers(freelancersData || []);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  return (
    <main className="min-h-screen bg-white text-gray-900 font-sans">
      <MainHeader user={user} showCategories={true} />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-white to-[#09BF44] overflow-hidden">
        <div className="max-w-[95%] md:max-w-[90%] mx-auto px-4 md:px-6 py-12 md:py-32 flex flex-col md:flex-row items-center relative z-10">
          <div className="w-full md:w-1/2 mb-10 md:mb-0">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold leading-tight mb-5 md:mb-6 text-gray-900">
              Find the perfect <span className="text-[#09BF44] italic">freelance</span> services for your business
            </h1>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const params = new URLSearchParams();
                if (heroSearchQuery.trim()) params.set("search", heroSearchQuery.trim());
                router.push(heroSearchType === "projects" ? `/projects?${params.toString()}` : `/jobs?${params.toString()}`);
              }}
              className="bg-white rounded-md p-1 flex flex-col sm:flex-row sm:items-center max-w-lg mb-5 md:mb-6 shadow-lg gap-1"
            >
              <div className="pl-4 pt-3 sm:pt-0 flex items-center rounded-l-md">
                <Search className="text-gray-400 w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder='Try "building mobile app"'
                value={heroSearchQuery}
                onChange={(e) => setHeroSearchQuery(e.target.value)}
                className="flex-1 px-3 py-2 sm:p-3 text-gray-800 outline-none placeholder-gray-400 text-sm sm:text-base rounded-md"
              />
              <div className="flex gap-1 p-1">
                <button
                  type="button"
                  onClick={() => setHeroSearchType("projects")}
                  className={`px-2 py-2 rounded-md text-xs font-bold ${heroSearchType === "projects" ? "bg-[#09BF44] text-white" : "bg-gray-100 text-gray-600"}`}
                >
                  Projects
                </button>
                <button
                  type="button"
                  onClick={() => setHeroSearchType("jobs")}
                  className={`px-2 py-2 rounded-md text-xs font-bold ${heroSearchType === "jobs" ? "bg-[#09BF44] text-white" : "bg-gray-100 text-gray-600"}`}
                >
                  Jobs
                </button>
              </div>
              <button type="submit" className="bg-[#09BF44] hover:bg-[#07a63a] text-white px-5 sm:px-4 py-2.5 sm:py-3 rounded-md font-bold transition-colors text-sm sm:text-base">
                Search
              </button>
            </form>
            <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm font-medium text-gray-700">
              <span className="font-bold">Popular:</span>
              <span className="border border-gray-300 rounded-full px-3 py-0.5 hover:bg-[#09BF44] hover:text-white hover:border-[#09BF44] cursor-pointer transition">Website Design</span>
              <span className="border border-gray-300 rounded-full px-3 py-0.5 hover:bg-[#09BF44] hover:text-white hover:border-[#09BF44] cursor-pointer transition">WordPress</span>
              <span className="border border-gray-300 rounded-full px-3 py-0.5 hover:bg-[#09BF44] hover:text-white hover:border-[#09BF44] cursor-pointer transition">Logo Design</span>
              <span className="border border-gray-300 rounded-full px-3 py-0.5 hover:bg-[#09BF44] hover:text-white hover:border-[#09BF44] cursor-pointer transition">Video Editing</span>
            </div>
          </div>
          <div className="w-full md:w-1/2 flex justify-center md:justify-end">
            {/* Placeholder for Hero Image */}
            <div className="relative w-full max-w-md h-[260px] sm:h-[320px] md:h-[400px] bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 shadow-xl flex items-center justify-center">
              <p className="text-gray-600 font-bold text-sm sm:text-base">Hero Image / Freelancer Photo</p>
              {/* <Image src="/hero-person.png" alt="Freelancer" width={500} height={500} className="object-contain" /> */}
            </div>
          </div>
        </div>
      </section>

      {/* Popular Services Section */}
      <section className="bg-white py-16">
        <div className="max-w-[95%] md:max-w-[90%] mx-auto px-4 md:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 md:mb-8">Popular Professional Services</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {MAIN_CATEGORIES.map((category) => {
              // Map categories to icons
              const categoryIcons: { [key: string]: any } = {
                'Development & Tech': Code,
                'Design & Creativity': Palette,
                'Digital Marketing': TrendingUp,
                'Video Editor': Video,
                'AI and Automations': Sparkles,
                'Writing & Language': PenTool,
                'Voice Over': Mic
              };
              const IconComponent = categoryIcons[category] || Briefcase;

              return (
                <div
                  key={category}
                  onClick={() => router.push(`/projects?category=${encodeURIComponent(category)}`)}
                  className="relative h-48 rounded-xl bg-white border border-gray-200 overflow-hidden cursor-pointer group transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-[#09BF44]/50"
                >
                  {/* Soft green gradient centered */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#09BF44]/10 via-[#09BF44]/5 to-transparent opacity-50 group-hover:opacity-100 group-hover:from-[#09BF44]/20 group-hover:via-[#09BF44]/10 group-hover:to-[#09BF44]/5 transition-all duration-300"></div>

                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#09BF44]/0 via-[#09BF44]/0 to-[#09BF44]/0 group-hover:from-[#09BF44]/20 group-hover:via-[#09BF44]/10 group-hover:to-[#09BF44]/5 blur-xl transition-all duration-300 -z-10"></div>

                  {/* Content */}
                  <div className="relative h-full flex flex-col items-center justify-center p-4 z-10">
                    <div className="mb-3 p-4 rounded-full bg-gradient-to-br from-[#09BF44]/10 to-[#09BF44]/5 group-hover:from-[#09BF44]/20 group-hover:to-[#09BF44]/10 transition-all duration-300">
                      <IconComponent className="w-8 h-8 text-[#09BF44] group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 text-center group-hover:text-[#09BF44] transition-colors duration-300">{category}</h3>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Top Freelancers Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-[95%] md:max-w-[90%] mx-auto px-4 md:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 md:mb-8">Top Freelancers</h2>
          {loading ? (
            <div className="text-center py-12 text-gray-400">
              <p>Loading...</p>
            </div>
          ) : topFreelancers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {topFreelancers.map((freelancer: any) => (
                <div
                  key={freelancer._id}
                  onClick={() => router.push(`/freelancer/${freelancer._id}`)}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-xl hover:border-[#09BF44]/50 transition-all duration-300 cursor-pointer group"
                >
                  {/* Profile Picture with Gradient Background */}
                  <div className="relative mb-4 flex justify-center">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#09BF44]/20 via-[#09BF44]/10 to-transparent blur-md group-hover:blur-lg transition-all"></div>
                    </div>
                    <div className="relative w-20 h-20 rounded-full bg-gray-200 border-4 border-white overflow-hidden shadow-lg z-10">
                      {freelancer.freelancerProfile?.profilePicture ? (
                        <Image
                          src={freelancer.freelancerProfile.profilePicture}
                          alt={`${freelancer.firstName} ${freelancer.lastName}`}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#09BF44] to-[#07a63a] flex items-center justify-center text-white font-black text-2xl">
                          {freelancer.firstName?.[0]?.toUpperCase() || 'F'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Name */}
                  <h3 className="text-center font-bold text-gray-900 mb-2 group-hover:text-[#09BF44] transition-colors">
                    {freelancer.firstName} {freelancer.lastName}
                  </h3>

                  {/* Description/Bio */}
                  <p className="text-sm text-gray-600 text-center mb-3 line-clamp-2 min-h-[2.5rem]">
                    {freelancer.freelancerProfile?.bio || 'Professional freelancer'}
                  </p>

                  {/* Rating */}
                  {freelancer.avgRating > 0 && (
                    <div className="flex items-center justify-center gap-1 mb-3">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-bold text-gray-900">
                        {freelancer.avgRating.toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({freelancer.completedDeals || 0})
                      </span>
                    </div>
                  )}

                  {/* Starting Price */}
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Starting at</p>
                    <p className="text-lg font-black text-[#09BF44]">
                      {freelancer.startingPrice || freelancer.freelancerProfile?.starterPricing?.basic?.price || 0} EGP
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <p>No freelancers available</p>
            </div>
          )}
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects-section" className="bg-gray-50 py-16">
        <div className="max-w-[95%] md:max-w-[90%] mx-auto px-4 md:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 md:mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Services you might be interested in</h2>
              <p className="text-gray-600">Explore professional services from talented freelancers</p>
            </div>
            <button
              onClick={() => router.push('/projects')}
              className="flex items-center gap-2 text-[#09BF44] hover:text-[#07a63a] font-bold transition-colors text-sm md:text-base"
            >
              View More <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-10 h-10 animate-spin text-[#09BF44] mb-4" />
              <p className="text-gray-600 font-bold">Exploring projects...</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8 w-full max-w-5xl">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
                    <div className="h-24 bg-gray-200 rounded-t-2xl mb-4" />
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
                    <div className="flex gap-2">
                      <div className="h-8 bg-gray-200 rounded w-16" />
                      <div className="h-8 bg-gray-200 rounded w-16" />
                      <div className="h-8 bg-gray-200 rounded w-16" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : projects.length > 0 ? (
            <div className="relative">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" style={{ overflow: 'visible' }}>
                {projects.slice(projectStartIndex, projectStartIndex + 6).map((project) => (
                  <ProjectCardCompact key={project._id} project={project} />
                ))}
              </div>
              {projects.length > 6 && (
                <div className="flex items-center justify-center gap-4 mt-6">
                  <button
                    onClick={() => setProjectStartIndex(Math.max(0, projectStartIndex - 3))}
                    disabled={projectStartIndex === 0}
                    className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setProjectStartIndex(Math.min(projects.length - 6, projectStartIndex + 3))}
                    disabled={projectStartIndex >= projects.length - 6}
                    className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Projects Available</h3>
              <p className="text-gray-500">Check back later for new projects.</p>
            </div>
          )}
        </div>
      </section>

      {/* Jobs Section */}
      <section id="jobs-section" className="bg-white py-16">
        <div className="max-w-[95%] md:max-w-[90%] mx-auto px-4 md:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 md:mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Browse available jobs</h2>
              <p className="text-gray-600">Find projects that match your skills</p>
            </div>
            <button
              onClick={() => router.push('/jobs')}
              className="flex items-center gap-2 text-[#09BF44] hover:text-[#07a63a] font-bold transition-colors text-sm md:text-base"
            >
              View More <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-10 h-10 animate-spin text-[#09BF44] mb-4" />
              <p className="text-gray-600 font-bold">Finding jobs...</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8 w-full max-w-4xl">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-2/3 mb-3" />
                    <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-4/5 mb-4" />
                    <div className="flex gap-2">
                      <div className="h-6 bg-gray-200 rounded w-24" />
                      <div className="h-6 bg-gray-200 rounded w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : jobs.length > 0 ? (
            <div className="relative">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
                {jobs.slice(jobStartIndex, jobStartIndex + 4).map((job) => (
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
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{job.description}</p>
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
                            {job.skills.slice(0, 3).map((skill: string, idx: number) => (
                              <span
                                key={idx}
                                className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold"
                              >
                                {skill}
                              </span>
                            ))}
                            {job.skills.length > 3 && (
                              <span className="text-gray-500 text-xs font-bold">+{job.skills.length - 3} more</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    {user?.role === 'freelancer' && job.status === 'open' && (
                      <button
                        onClick={() => {
                          // Handle job application - could open a modal or navigate
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
              {jobs.length > 4 && (
                <div className="flex items-center justify-center gap-4 mt-6">
                  <button
                    onClick={() => setJobStartIndex(Math.max(0, jobStartIndex - 2))}
                    disabled={jobStartIndex === 0}
                    className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setJobStartIndex(Math.min(jobs.length - 4, jobStartIndex + 2))}
                    disabled={jobStartIndex >= jobs.length - 4}
                    className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Jobs Available</h3>
              <p className="text-gray-500">Check back later for new job postings.</p>
            </div>
          )}
        </div>
      </section>



      {/* Value Proposition Section */}
      <section className="bg-[#f1fdf4] py-16 md:py-24">
        <div className="max-w-[95%] md:max-w-[90%] mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center gap-8 md:gap-12">
          <div className="md:w-1/2">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8">A whole world of freelance talent at your fingertips</h2>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="mt-1"><ShieldCheck className="w-6 h-6 text-gray-600" /></div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">The best for every budget</h3>
                  <p className="text-gray-600 mt-1">Find high-quality services at every price point. No hourly rates, just project-based pricing.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="mt-1"><Zap className="w-6 h-6 text-gray-600" /></div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Quality work done quickly</h3>
                  <p className="text-gray-600 mt-1">Find the right freelancer to begin working on your project within minutes.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="mt-1"><ShieldCheck className="w-6 h-6 text-gray-600" /></div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Protected payments, every time</h3>
                  <p className="text-gray-600 mt-1">Always know what you&apos;ll pay upfront. Your payment isn&apos;t released until you approve the work.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="mt-1"><Star className="w-6 h-6 text-gray-600" /></div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">24/7 support</h3>
                  <p className="text-gray-600 mt-1">Questions? Our round-the-clock support team is available to help anytime, anywhere.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="md:w-1/2">
            <div className="relative w-full aspect-video bg-gray-200 rounded-lg overflow-hidden shadow-2xl flex items-center justify-center cursor-pointer hover:opacity-90 transition">
              <div className="w-16 h-16 bg-white/80 rounded-full flex items-center justify-center pl-1">
                <div className="w-0 h-0 border-t-10 border-t-transparent border-l-18 border-l-[#09BF44] border-b-10 border-b-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Auth Modal */}
    </main>
  );
}
