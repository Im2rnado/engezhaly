"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ArrowRight, Code, Palette, TrendingUp, Video, Sparkles, PenTool, Mic, Search, Briefcase, ShieldCheck, Star, Loader2, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import ProjectCardCompact from "@/components/ProjectCardCompact";
import { MAIN_CATEGORIES } from "@/lib/categories";
import MainHeader from "@/components/MainHeader";
import { useModal } from "@/context/ModalContext";
import { motion, AnimatePresence, Variants } from "framer-motion";

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

const stagger: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showModal } = useModal();
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [topFreelancers, setTopFreelancers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectStartIndex, setProjectStartIndex] = useState(0);
  const [jobStartIndex, setJobStartIndex] = useState(0);
  const [heroSearchQuery, setHeroSearchQuery] = useState("");

  useEffect(() => {
    const sessionExpired = searchParams.get('session_expired');
    if (sessionExpired === '1') {
      router.replace('/');
      showModal({
        title: 'Session Expired',
        message: 'Your session has expired. Please log in again.',
        type: 'info'
      });
      return;
    }

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
  }, [searchParams, router, showModal]);

  return (
    <main className="min-h-screen bg-slate-50/50 text-gray-900 font-sans selection:bg-[#09BF44]/30">
      <MainHeader user={user} showCategories={true} />

      {/* Hero Section */}
      <section className="relative bg-white overflow-hidden border-b border-gray-100">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#09BF44]/10 to-transparent blur-3xl opacity-70"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-[#09BF44]/5 to-transparent blur-3xl opacity-50"></div>
        </div>

        <div className="max-w-[95%] md:max-w-[90%] mx-auto px-4 md:px-6 py-20 md:py-32 flex flex-col md:flex-row items-center relative z-10 gap-12">
          <motion.div 
            initial="hidden" 
            animate="visible" 
            variants={stagger} 
            className="w-full md:w-1/2 flex flex-col justify-center"
          >
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#09BF44]/10 text-[#07a63a] font-semibold text-sm w-fit mb-6 border border-[#09BF44]/20">
              <Sparkles className="w-4 h-4" />
              <span>The #1 Freelance Network in Egypt</span>
            </motion.div>
            
            <motion.h1 variants={fadeIn} className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 text-gray-900">
              Find the perfect <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#09BF44] to-[#048729] italic pr-2">freelance</span> 
              services
            </motion.h1>
            
            <motion.p variants={fadeIn} className="text-lg md:text-xl text-gray-500 mb-8 max-w-lg leading-relaxed">
              Connect with top-tier talent for your business needs. Quality work, secure payments, and amazing results.
            </motion.p>
            
            <motion.form
              variants={fadeIn}
              onSubmit={(e) => {
                e.preventDefault();
                const params = new URLSearchParams();
                if (heroSearchQuery.trim()) params.set("search", heroSearchQuery.trim());
                router.push(`/jobs?${params.toString()}`);
              }}
              className="bg-white rounded-2xl p-2 flex flex-col sm:flex-row sm:items-center w-full max-w-xl mb-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 transition-shadow focus-within:shadow-[0_8px_30px_rgba(9,191,68,0.15)] focus-within:border-[#09BF44]/30"
            >
              <div className="pl-4 pt-3 sm:pt-0 flex items-center">
                <Search className="text-gray-400 w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder='Search for "mobile app development"'
                value={heroSearchQuery}
                onChange={(e) => setHeroSearchQuery(e.target.value)}
                className="flex-1 px-4 py-3 text-gray-800 outline-none placeholder-gray-400 text-base md:text-lg bg-transparent"
              />
              <button type="submit" className="bg-[#09BF44] hover:bg-[#07a63a] text-white px-6 py-3.5 rounded-xl font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 mt-2 sm:mt-0">
                Search
              </button>
            </motion.form>
            
            <motion.div variants={fadeIn} className="flex flex-wrap items-center gap-3 text-sm font-medium text-gray-500">
              <span>Popular:</span>
              <span className="bg-gray-100/80 hover:bg-[#09BF44]/10 hover:text-[#07a63a] px-4 py-1.5 rounded-full cursor-pointer transition-colors">Web Design</span>
              <span className="bg-gray-100/80 hover:bg-[#09BF44]/10 hover:text-[#07a63a] px-4 py-1.5 rounded-full cursor-pointer transition-colors">Logo Design</span>
              <span className="bg-gray-100/80 hover:bg-[#09BF44]/10 hover:text-[#07a63a] px-4 py-1.5 rounded-full cursor-pointer transition-colors">Video Editing</span>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95, rotate: 2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="w-full md:w-1/2 flex justify-center relative"
          >
            {/* Abstract Decorative Component to look High-End */}
            <div className="relative w-full max-w-lg aspect-square">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#09BF44]/20 to-emerald-100 rounded-3xl rotate-3 scale-105 blur-sm opacity-50"></div>
              <div className="absolute inset-0 bg-white rounded-3xl shadow-2xl border border-white/40 overflow-hidden flex flex-col p-6 backdrop-blur-xl">
                 <div className="flex items-center justify-between mb-8">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="h-6 w-24 bg-gray-100 rounded-full"></div>
                 </div>
                 <div className="space-y-4 flex-1">
                    <div className="flex gap-4 items-center">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#09BF44] to-[#048729] shadow-lg"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 w-1/3 bg-gray-200 rounded-lg"></div>
                        <div className="h-3 w-1/4 bg-gray-100 rounded-lg"></div>
                      </div>
                    </div>
                    <div className="h-32 w-full border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 flex items-center justify-center">
                       <p className="text-gray-400 font-medium font-mono text-sm tracking-widest uppercase">Creative Workspace</p>
                    </div>
                    <div className="flex gap-3 pt-2">
                       <div className="h-10 w-1/2 bg-gray-100 rounded-xl"></div>
                       <div className="h-10 w-1/2 bg-[#09BF44]/10 rounded-xl"></div>
                    </div>
                 </div>
              </div>

              {/* Floating elements */}
              <motion.div animate={{ y: [-10, 10, -10] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} className="absolute -left-8 top-1/4 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3 border border-gray-100 z-20">
                <div className="bg-orange-100 p-2 rounded-full text-orange-500"><Star className="w-5 h-5" fill="currentColor" /></div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">4.9/5</p>
                  <p className="text-xs text-gray-500">Average Rating</p>
                </div>
              </motion.div>
              
              <motion.div animate={{ y: [10, -10, 10] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }} className="absolute -right-6 bottom-1/4 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3 border border-gray-100 z-20">
                <div className="bg-green-100 p-2 rounded-full text-[#09BF44]"><ShieldCheck className="w-5 h-5" /></div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">100% Secure</p>
                  <p className="text-xs text-gray-500">Payment Protection</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Popular Services Section */}
      <section className="py-24 relative overflow-hidden bg-white">
        <div className="max-w-[95%] md:max-w-[90%] mx-auto px-4 md:px-6">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeIn}
            className="text-center md:text-left mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Popular Categories</h2>
            <p className="text-gray-500 mt-3 text-lg">Explore our most demanded professional services</p>
          </motion.div>
          
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={stagger}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-6"
          >
            {MAIN_CATEGORIES.map((category) => {
              const categoryIcons: { [key: string]: any } = {
                'Development & Tech': Code,
                'Design & Creative': Palette,
                'Marketing': TrendingUp,
                'Video Editor': Video,
                'AI and Automations': Sparkles,
                'Writing & Language': PenTool,
                'Voice Over': Mic
              };
              const IconComponent = categoryIcons[category] || Briefcase;

              return (
                <motion.div
                  variants={fadeIn}
                  key={category}
                  onClick={() => router.push(`/offers?category=${encodeURIComponent(category)}`)}
                  className="group cursor-pointer relative"
                >
                  <div className="h-44 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center p-6 text-center transition-all duration-400 group-hover:bg-white group-hover:shadow-[0_20px_40px_-15px_rgba(9,191,68,0.2)] group-hover:-translate-y-2 group-hover:border-[#09BF44]/30">
                    <div className="mb-4 p-4 rounded-full bg-white shadow-sm text-gray-600 group-hover:bg-[#09BF44] group-hover:text-white transition-colors duration-300">
                      <IconComponent className="w-7 h-7" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-800 group-hover:text-[#09BF44] transition-colors">{category}</h3>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Top Freelancers Section */}
      <section className="bg-slate-50/80 py-24 border-y border-gray-100">
        <div className="max-w-[95%] md:max-w-[90%] mx-auto px-4 md:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Top Rated Freelancers</h2>
              <p className="text-gray-500 mt-3 text-lg">Work with the best talent on our platform</p>
            </div>
            <button
              onClick={() => router.push('/freelancers')}
              className="flex items-center gap-2 text-gray-600 hover:text-[#09BF44] font-semibold transition-colors group"
            >
              See all <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-10 h-10 animate-spin text-[#09BF44]" />
            </div>
          ) : topFreelancers.length > 0 ? (
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {topFreelancers.map((freelancer: any) => (
                <motion.div
                  variants={fadeIn}
                  key={freelancer._id}
                  onClick={() => router.push(`/freelancer/${freelancer._id}`)}
                  className="bg-white rounded-3xl border border-gray-100 p-6 hover:shadow-xl hover:shadow-[#09BF44]/5 hover:border-[#09BF44]/20 transition-all duration-300 cursor-pointer group flex flex-col h-full"
                >
                  <div className="relative mb-5 flex justify-center">
                    <div className="absolute -inset-2 rounded-full bg-gradient-to-b from-[#09BF44]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-md"></div>
                    <div className="relative w-20 h-20 rounded-full bg-slate-100 border-[3px] border-white shadow-sm overflow-hidden z-10 transition-transform group-hover:scale-105 duration-300">
                      {freelancer.freelancerProfile?.profilePicture ? (
                        <Image
                          src={freelancer.freelancerProfile.profilePicture}
                          alt={`${freelancer.firstName} ${freelancer.lastName}`}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#09BF44] to-[#048729] flex items-center justify-center text-white font-black text-2xl">
                          {freelancer.firstName?.[0]?.toUpperCase() || 'F'}
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className="text-center font-bold text-gray-900 group-hover:text-[#09BF44] transition-colors leading-tight">
                    {freelancer.firstName} {freelancer.lastName}
                  </h3>
                  
                  <p className="text-sm text-gray-500 text-center mt-2 mb-4 line-clamp-2 max-h-10 flex-1">
                    {freelancer.freelancerProfile?.bio || 'Professional Freelancer'}
                  </p>

                  <div className="mt-auto">
                    {freelancer.avgRating > 0 && (
                      <div className="flex items-center justify-center gap-1.5 mb-3">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-bold text-gray-900">{freelancer.avgRating.toFixed(1)}</span>
                        <span className="text-xs text-gray-400 font-medium">({freelancer.completedDeals || 0})</span>
                      </div>
                    )}
                    <div className="text-center pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-400 font-medium mb-0.5 uppercase tracking-wider">Starting at</p>
                      <p className="text-base font-black text-gray-900 group-hover:text-[#09BF44] transition-colors">
                        EGP {freelancer.startingPrice || freelancer.freelancerProfile?.starterPricing?.basic?.price || 0}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <p>No freelancers available right now.</p>
            </div>
          )}
        </div>
      </section>

      {/* Projects Section - Modified to animate properly, keeping ProjectCardCompact logic identical */}
      <section id="projects-section" className="bg-white py-24 relative">
        <div className="max-w-[95%] md:max-w-[90%] mx-auto px-4 md:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Featured Services</h2>
              <p className="text-gray-500 mt-3 text-lg">Top quality work delivered by verified pros</p>
            </div>
            <button
              onClick={() => router.push('/offers')}
              className="flex items-center gap-2 text-gray-600 hover:text-[#09BF44] font-semibold transition-colors group"
            >
              Explore all <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-10 h-10 animate-spin text-[#09BF44]" />
            </div>
          ) : projects.length > 0 ? (
            <div className="relative">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence mode="popLayout">
                  {projects.slice(projectStartIndex, projectStartIndex + 6).map((project) => (
                    <motion.div 
                      key={project._id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="h-full"
                    >
                      <ProjectCardCompact project={project} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
              
              {projects.length > 6 && (
                <div className="flex items-center justify-center gap-4 mt-12">
                  <button
                    onClick={() => setProjectStartIndex(Math.max(0, projectStartIndex - 3))}
                    disabled={projectStartIndex === 0}
                    className="p-3 rounded-full bg-white border border-gray-200 shadow-sm hover:border-[#09BF44] hover:text-[#09BF44] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setProjectStartIndex(Math.min(projects.length - 6, projectStartIndex + 3))}
                    disabled={projectStartIndex >= projects.length - 6}
                    className="p-3 rounded-full bg-white border border-gray-200 shadow-sm hover:border-[#09BF44] hover:text-[#09BF44] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16">
              <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-200" />
              <h3 className="text-lg font-bold text-gray-900 mb-1">No Services Available</h3>
              <p className="text-gray-500">Check back later for new offers.</p>
            </div>
          )}
        </div>
      </section>

      {/* Value Proposition Section - Totally revamped */}
      <section className="relative py-32 bg-[#09BF44] overflow-hidden">
        {/* Abstract pattern via SVG or CSS */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-1/4 w-[800px] h-[800px] bg-white rounded-full blur-[120px]"></div>
          <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-white rounded-full blur-[100px]"></div>
        </div>

        <div className="max-w-[95%] md:max-w-[90%] mx-auto px-4 md:px-6 relative z-10 flex flex-col lg:flex-row items-center gap-16">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="w-full lg:w-1/2">
            <motion.h2 variants={fadeIn} className="text-3xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
              A whole world of freelance talent at your fingertips
            </motion.h2>
            <motion.p variants={fadeIn} className="text-green-50 text-lg md:text-xl mb-10 max-w-lg leading-relaxed font-medium">
              We&apos;ve built Engezhaly to help you get things done securely, quickly, and professionally.
            </motion.p>
            
            <div className="space-y-6">
              {[
                { title: 'The best for every budget', desc: 'Find high-quality services at every price point. No hourly rates, just project-based pricing.' },
                { title: 'Quality work done quickly', desc: 'Find the right freelancer to begin working on your project within minutes.' },
                { title: 'Protected payments, every time', desc: 'Your money stays protected and is only released when you approve the work.' },
                { title: '24/7 Support', desc: 'Reach out to us at any time, anywhere.' }
              ].map((item, i) => (
                <motion.div variants={fadeIn} key={i} className="flex gap-4 items-start group">
                  <div className="mt-1 bg-white/20 p-1.5 rounded-full group-hover:bg-white group-hover:text-[#09BF44] text-white transition-colors">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1.5">{item.title}</h3>
                    <p className="text-green-50/90 leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Premium Right Image/Card */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }} 
            whileInView={{ opacity: 1, x: 0 }} 
            viewport={{ once: true }} 
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full lg:w-1/2 flex justify-center lg:justify-end"
          >
             <div className="relative w-full max-w-lg">
                <div className="absolute inset-0 bg-white rounded-[40px] rotate-3 opacity-20"></div>
                <div className="absolute inset-0 bg-white rounded-[40px] -rotate-3 opacity-40"></div>
                <div className="relative bg-white rounded-[40px] shadow-2xl overflow-hidden aspect-[4/3] flex flex-col justify-between">
                   {/* Top Bar mock */}
                   <div className="h-14 border-b border-gray-100 flex items-center px-6 gap-2 bg-slate-50">
                      <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                      <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                      <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                   </div>
                   {/* Body */}
                   <div className="flex-1 flex items-center justify-center p-8 bg-[url('https://patterns.dev/images/pattern-dots.svg')] bg-[length:24px_24px]">
                      <div className="w-24 h-24 rounded-full bg-[#09BF44] shadow-xl shadow-[#09BF44]/40 flex items-center justify-center text-white cursor-pointer hover:scale-105 transition-transform duration-300">
                         <div className="ml-2 w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-white border-b-[12px] border-b-transparent"></div>
                      </div>
                   </div>
                   {/* Bottom Sheet mock */}
                   <div className="h-24 bg-white border-t border-gray-100 p-6 flex items-center justify-between">
                      <div className="space-y-2">
                         <div className="h-3 w-32 bg-gray-200 rounded"></div>
                         <div className="h-2 w-20 bg-gray-100 rounded"></div>
                      </div>
                      <div className="h-10 w-24 bg-[#09BF44]/10 rounded-full"></div>
                   </div>
                </div>
             </div>
          </motion.div>
        </div>
      </section>

      {/* Jobs Section */}
      <section id="jobs-section" className="bg-slate-50 py-24 pb-32">
        <div className="max-w-[95%] md:max-w-[90%] mx-auto px-4 md:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Recent Opportunities</h2>
              <p className="text-gray-500 mt-3 text-lg">Browse available jobs and send your proposals</p>
            </div>
            <button
              onClick={() => router.push('/jobs')}
              className="flex items-center gap-2 text-gray-600 hover:text-[#09BF44] font-semibold transition-colors group"
            >
              View all jobs <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-10 h-10 animate-spin text-[#09BF44]" />
            </div>
          ) : jobs.length > 0 ? (
            <div className="relative">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AnimatePresence mode="popLayout">
                  {jobs.slice(jobStartIndex, jobStartIndex + 4).map((job) => (
                    <motion.div
                      key={job._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="bg-white border text-left border-gray-100/80 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] rounded-3xl p-8 hover:border-[#09BF44]/30 hover:shadow-xl transition-all duration-300 group"
                    >
                      <div className="flex flex-col h-full">
                        <div className="flex items-start justify-between mb-5 gap-4">
                          <h3 className="text-xl font-bold text-gray-900 leading-snug group-hover:text-[#09BF44] transition-colors">{job.title}</h3>
                          {job.status === 'open' && (
                            <span className="bg-emerald-50 text-[#09BF44] border border-emerald-100 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap">
                              Open Right Now
                            </span>
                          )}
                        </div>
                        
                        <p className="text-gray-500 text-[15px] mb-6 line-clamp-2 leading-relaxed flex-1">
                          {job.description}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-5 text-sm mb-6 pb-6 border-b border-gray-50">
                          <div>
                            <span className="text-gray-400 font-medium block mb-1 text-xs uppercase tracking-wider">Budget</span>
                            <span className="text-gray-900 font-bold whitespace-nowrap">
                              EGP {job.budgetRange?.min || 0} - {job.budgetRange?.max || 0}
                            </span>
                          </div>
                          <div className="h-8 w-px bg-gray-100"></div>
                          <div>
                            <span className="text-gray-400 font-medium block mb-1 text-xs uppercase tracking-wider">Deadline</span>
                            <span className="text-gray-900 font-bold">{job.deadline || 'N/A'}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-2">
                              {job.skills?.slice(0, 3).map((skill: string, idx: number) => (
                                <span key={idx} className="bg-slate-50 border border-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-semibold">
                                  {skill}
                                </span>
                              ))}
                              {job.skills?.length > 3 && (
                                <span className="text-gray-400 text-xs font-bold py-1.5">+{job.skills.length - 3}</span>
                              )}
                            </div>

                            {user?.role === 'freelancer' && job.status === 'open' && (
                              <button
                                onClick={() => router.push(`/jobs`)}
                                className="bg-gray-900 hover:bg-[#09BF44] text-white px-6 py-2.5 rounded-xl font-bold transition-colors shadow-md text-sm whitespace-nowrap ml-4"
                              >
                                Submit Proposal
                              </button>
                            )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
              
              {jobs.length > 4 && (
                <div className="flex items-center justify-center gap-4 mt-12">
                  <button
                    onClick={() => setJobStartIndex(Math.max(0, jobStartIndex - 2))}
                    disabled={jobStartIndex === 0}
                    className="p-3 rounded-full bg-white border border-gray-200 shadow-sm hover:border-[#09BF44] hover:text-[#09BF44] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setJobStartIndex(Math.min(jobs.length - 4, jobStartIndex + 2))}
                    disabled={jobStartIndex >= jobs.length - 4}
                    className="p-3 rounded-full bg-white border border-gray-200 shadow-sm hover:border-[#09BF44] hover:text-[#09BF44] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16">
              <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-200" />
              <h3 className="text-lg font-bold text-gray-900 mb-1">No Jobs Available</h3>
              <p className="text-gray-500">Check back later for new job postings.</p>
            </div>
          )}
        </div>
      </section>

    </main>
  );
}
