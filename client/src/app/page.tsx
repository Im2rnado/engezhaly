"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ArrowRight, Code, Palette, TrendingUp, Video, Sparkles, PenTool, Mic, Search, Briefcase, ShieldCheck, Star, Loader2, CheckCircle2, Zap } from "lucide-react";
import { api } from "@/lib/api";
import ProjectCardCompact from "@/components/ProjectCardCompact";
import { MAIN_CATEGORIES } from "@/lib/categories";
import MainHeader from "@/components/MainHeader";
import { useModal } from "@/context/ModalContext";
import { motion, Variants, useScroll, useTransform } from "framer-motion";
import HeroVimeoEmbed from "@/components/HeroVimeoEmbed";
import JoinPopup from "@/components/JoinPopup";
import { useLanguage } from "@/context/LanguageContext";

// High-performance animations (no blurs, no box-shadow animations)
const fadeIn: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const stagger: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const staggerSlow: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

const slideInRight: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const ParallaxLogo = () => {
  const { scrollYProgress } = useScroll();
  // Stronger parallax: starts high up (hidden under the previous section) and moves down to center
  const y = useTransform(scrollYProgress, [0.8, 1], ["-60%", "0%"]);
  const opacity = useTransform(scrollYProgress, [0.8, 1], [0, 1]);
  const scale = useTransform(scrollYProgress, [0.8, 1], [0.8, 1.05]);

  return (
    <section className="relative h-[40vh] md:h-[60vh] bg-linear-to-b from-gray-50 to-emerald-50 overflow-hidden flex items-center justify-center -mt-10 pt-10 z-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#09BF44]/15 via-transparent to-transparent pointer-events-none opacity-60"></div>
      <motion.div style={{ y, opacity, scale }} className="relative z-10 flex flex-col items-center justify-center">
        <Image
          src="/logos/logo-green.png"
          alt="Engezhaly"
          width={600}
          height={165}
          className="w-[280px] md:w-[450px] lg:w-[600px] h-auto drop-shadow-xl"
          priority
        />
      </motion.div>
    </section>
  );
};

/**
 * Tiny component that owns useSearchParams.
 * Must be isolated here so it can be wrapped in <Suspense> —
 * using useSearchParams directly in a page component causes a
 * build-time prerender failure in Next.js App Router.
 */
function SessionHandler({
  onSessionExpired,
}: {
  onSessionExpired: () => void;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const handledRef = useRef(false);

  useEffect(() => {
    if (searchParams.get('session_expired') === '1' && !handledRef.current) {
      handledRef.current = true;
      router.replace('/');
      onSessionExpired();
    }
  }, [searchParams, router, onSessionExpired]);

  return null;
}

export default function Home() {
  const router = useRouter();
  const { showModal } = useModal();
  const { t, isRTL } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [topFreelancers, setTopFreelancers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectStartIndex, setProjectStartIndex] = useState(0);
  const [jobStartIndex, setJobStartIndex] = useState(0);
  const [heroSearchQuery, setHeroSearchQuery] = useState("");
  const [showSecret, setShowSecret] = useState(false);

  const handleSessionExpired = () => {
    showModal({
      title: t.misc.sessionExpiredTitle,
      message: t.misc.sessionExpiredMsg,
      type: 'info'
    });
  };

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
    <main className="min-h-screen bg-white text-gray-900 font-sans selection:bg-[#09BF44]/30">
      {/* SessionHandler reads useSearchParams — must be in Suspense per Next.js App Router rules */}
      <Suspense fallback={null}>
        <SessionHandler onSessionExpired={handleSessionExpired} />
      </Suspense>

      <MainHeader user={user} showCategories={true} />

      {/* Hero Section - Restored original gradient but modernized */}
      <section className="relative bg-linear-to-br from-white to-[#09BF44] overflow-hidden border-b border-[#09BF44]/10">

        {/* Fast Radial Backgrounds (No CSS Blur filters for max performance) */}
        <div className="absolute top-0 right-[-10%] w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#09BF44]/15 via-transparent to-transparent pointer-events-none"></div>
        <div className="absolute bottom-[-20%] left-[-5%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/40 via-transparent to-transparent pointer-events-none"></div>

        <div className="max-w-[95%] md:max-w-[90%] mx-auto px-4 md:px-6 py-16 md:py-26 flex flex-col md:flex-row items-center relative z-10 gap-12">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="w-full md:w-1/2 flex flex-col justify-center"
          >
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 text-[#07a63a] font-bold text-sm w-fit mb-6 border border-gray-100 shadow-sm">
              <Sparkles className="w-4 h-4 text-[#09BF44]" />
              <span>{t.hero.badge}</span>
            </motion.div>

            <motion.h1 variants={fadeIn} className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6 text-gray-900 drop-shadow-sm">
              {t.hero.heading1} <br />
              <span className="text-[#09BF44] italic pr-2 drop-shadow-sm">{t.hero.heading2}</span>
            </motion.h1>

            <motion.p variants={fadeIn} className="text-lg md:text-xl text-gray-700 mb-8 max-w-lg leading-relaxed font-medium">
              {t.hero.subtext}
            </motion.p>

            <motion.form
              variants={fadeIn}
              onSubmit={(e) => {
                e.preventDefault();
                const params = new URLSearchParams();
                if (heroSearchQuery.trim()) params.set("search", heroSearchQuery.trim());
                router.push(`/jobs?${params.toString()}`);
              }}
              className="bg-white rounded-2xl p-2 flex flex-col sm:flex-row sm:items-center w-full max-w-xl mb-8 shadow-xl border border-gray-100 focus-within:ring-4 focus-within:ring-[#09BF44]/20 transition-all"
            >
              <div className="pl-4 pt-3 sm:pt-0 flex items-center">
                <Search className="text-gray-400 w-6 h-6" />
              </div>
              <input
                type="text"
                placeholder={t.search.heroPlaceholder}
                value={heroSearchQuery}
                onChange={(e) => setHeroSearchQuery(e.target.value)}
                className="flex-1 px-4 py-3 text-gray-900 outline-none placeholder-gray-400 text-base md:text-lg bg-transparent font-medium"
              />
              <button type="submit" className="bg-[#09BF44] hover:bg-[#07a63a] text-white px-8 py-3.5 rounded-xl font-bold transition-transform hover:scale-105 mt-2 sm:mt-0 shadow-md">
                {t.search.searchBtn}
              </button>
            </motion.form>

            <motion.div variants={fadeIn} className="flex flex-wrap items-center gap-3 text-sm font-bold text-gray-700">
              <span>{t.hero.popular}</span>
              <span className="bg-white/60 hover:bg-white px-4 py-1.5 rounded-full cursor-pointer transition-colors border border-white/50 shadow-sm">{t.hero.tag1}</span>
              <span className="bg-white/60 hover:bg-white px-4 py-1.5 rounded-full cursor-pointer transition-colors border border-white/50 shadow-sm">{t.hero.tag2}</span>
              <span className="bg-white/60 hover:bg-white px-4 py-1.5 rounded-full cursor-pointer transition-colors border border-white/50 shadow-sm">{t.hero.tag3}</span>
            </motion.div>
          </motion.div>

          {/* Hero video + trust chips */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            className="w-full md:w-1/2 flex justify-center relative min-h-0"
          >
            <div className="relative w-full max-w-2xl py-4 md:py-0">
              <HeroVimeoEmbed />

              {/* <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="hidden sm:flex absolute -left-2 md:-left-6 top-[10%] md:top-1/10 bg-white p-3 md:p-4 rounded-2xl shadow-xl items-center gap-3 border border-gray-100 z-20 hover:-translate-y-1 transition-transform max-w-[calc(100vw-2rem)]"
              >
                <div className="bg-orange-100 p-2.5 rounded-full text-orange-500 shrink-0">
                  <Star className="w-5 h-5" fill="currentColor" />
                </div>
                <div className="min-w-0">
                  <p className="font-black text-gray-900 text-sm">4.9/5 Rating</p>
                  <p className="text-xs text-gray-500 font-bold">Client Average</p>
                </div>
              </motion.div> */}

              {/* <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="hidden sm:flex absolute -right-1 md:-right-4 bottom-[12%] md:bottom-1/4 bg-white p-3 md:p-4 rounded-2xl shadow-xl items-center gap-3 border border-gray-100 z-20 hover:-translate-y-1 transition-transform max-w-[calc(100vw-2rem)]"
              >
                <div className="bg-green-100 p-2.5 rounded-full text-[#09BF44] shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-black text-gray-900 text-sm">100% Secure</p>
                  <p className="text-xs text-gray-500 font-bold">Payments</p>
                </div>
              </motion.div>
 */}
              <div className="flex sm:hidden justify-center gap-3 mt-6">
                <div className="flex-1 min-w-0 bg-white p-3 rounded-2xl shadow-md border border-gray-100 flex items-center gap-2">
                  <div className="bg-orange-100 p-2 rounded-full text-orange-500 shrink-0">
                    <Star className="w-4 h-4" fill="currentColor" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-gray-900 text-xs">{t.hero.ratingLabel}</p>
                    <p className="text-[10px] text-gray-500 font-bold truncate">{t.hero.ratingSub}</p>
                  </div>
                </div>
                <div className="flex-1 min-w-0 bg-white p-3 rounded-2xl shadow-md border border-gray-100 flex items-center gap-2">
                  <div className="bg-green-100 p-2 rounded-full text-[#09BF44] shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-gray-900 text-xs">{t.hero.secureLabel}</p>
                    <p className="text-[10px] text-gray-500 font-bold truncate">{t.hero.secureSub}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section className="relative bg-gray-50 py-24 md:py-24 overflow-hidden border-y border-gray-200">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#09BF44]/5 to-transparent"></div>
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#09BF44]/5 to-transparent"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row gap-12 md:gap-20 items-center">
            <div className="flex-1 space-y-8">
              <div>
                <motion.p
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeIn}
                  className="text-[#09BF44] font-black text-sm uppercase tracking-[0.2em] mb-3"
                >
                  {t.about.eyebrow}
                </motion.p>
                <motion.h2
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeIn}
                  className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 leading-[1.1] tracking-tight"
                >
                  {t.about.heading} <span className="text-[#09BF44]">{t.about.headingHighlight}</span>
                </motion.h2>
              </div>
              
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                className="space-y-6 text-lg md:text-xl text-gray-600 leading-relaxed"
              >
                <p>{t.about.para1}</p>
                <p>{t.about.para2}</p>
                <p className="font-bold text-gray-900">{t.about.para3}</p>
              </motion.div>
            </div>

            <div className="flex-1 w-full">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={staggerSlow}
                className="grid gap-5 md:grid-cols-1 lg:grid-cols-2"
              >
                <motion.div
                  variants={slideInRight}
                  className="bg-[#09BF44] text-white p-8 rounded-3xl shadow-lg border border-emerald-600/40"
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-3 bg-white/15 rounded-2xl">
                      <ShieldCheck className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-black text-xl md:text-2xl tracking-tight">{t.about.forBusiness}</h3>
                  </div>
                  <ul className="space-y-3 text-white/95 text-sm md:text-base font-semibold leading-relaxed list-disc pl-5">
                    <li>{t.about.businessPoint1}</li>
                    <li>{t.about.businessPoint2}</li>
                    <li>{t.about.businessPoint3}</li>
                  </ul>
                </motion.div>
                <motion.div
                  variants={slideInRight}
                  className="bg-[#078c37] text-white p-8 rounded-3xl shadow-lg border border-emerald-900/30"
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-3 bg-white/15 rounded-2xl">
                      <Zap className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-black text-xl md:text-2xl tracking-tight">{t.about.forFreelancers}</h3>
                  </div>
                  <ul className="space-y-3 text-white/95 text-sm md:text-base font-semibold leading-relaxed list-disc pl-5">
                    <li>{t.about.freelancerPoint1}</li>
                    <li>{t.about.freelancerPoint2}</li>
                    <li>{t.about.freelancerPoint3}</li>
                  </ul>
                </motion.div>
              </motion.div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center mt-20">
            <button 
              onClick={() => setShowSecret(!showSecret)}
              className="px-6 py-3 rounded-full bg-white border border-gray-200 hover:border-[#09BF44]/30 hover:bg-gray-50 flex items-center justify-center transition-all mb-6 text-gray-500 hover:text-[#09BF44] font-bold text-sm shadow-sm"
            >
              <Sparkles className="w-4 h-4 mr-2" /> {t.about.secretBtn}
            </button>
            
            {showSecret && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="bg-gradient-to-r from-[#09BF44]/10 to-emerald-500/10 px-8 py-5 rounded-3xl border border-[#09BF44]/20 shadow-sm max-w-2xl text-center"
              >
                <p className="text-xl md:text-2xl font-black text-[#09BF44]">
                  {t.about.secretMsg}
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* NEW BOLD SECTION: Stats & Trust */}
      <section className="bg-black py-20 text-white border-y-[6px] border-[#09BF44] relative z-20 overflow-hidden">
        {/* Subtle geometric light on black */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#09BF44]/20 via-transparent to-transparent pointer-events-none opacity-40"></div>

        <div className="max-w-[95%] md:max-w-[90%] mx-auto px-4 md:px-6 relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 text-center divide-x divide-white/10">
            <motion.div variants={fadeIn} className="group cursor-default py-4">
              <p className="text-6xl md:text-7xl font-black text-white mb-3 tracking-tighter group-hover:text-[#09BF44] group-hover:scale-110 transition-all duration-300 transform-gpu">99%</p>
              <p className="text-xs md:text-sm text-gray-400 font-bold uppercase tracking-[0.2em] group-hover:text-gray-200 transition-colors">{t.stats.clientSatisfaction}</p>
            </motion.div>
            <motion.div variants={fadeIn} className="group cursor-default py-4">
              <p className="text-6xl md:text-7xl font-black text-white mb-3 tracking-tighter group-hover:text-[#09BF44] group-hover:scale-110 transition-all duration-300 transform-gpu">24/7</p>
              <p className="text-xs md:text-sm text-gray-400 font-bold uppercase tracking-[0.2em] group-hover:text-gray-200 transition-colors">{t.stats.supportAvailable}</p>
            </motion.div>
            <motion.div variants={fadeIn} className="group cursor-default py-4">
              <p className="text-6xl md:text-7xl font-black text-white mb-3 tracking-tighter group-hover:text-[#09BF44] group-hover:scale-110 transition-all duration-300 transform-gpu">100%</p>
              <p className="text-xs md:text-sm text-gray-400 font-bold uppercase tracking-[0.2em] group-hover:text-gray-200 transition-colors">{t.stats.securePayments}</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* NEW BOLD SECTION: How It Works - Very strong graphic breakdown */}
      <section className="bg-gray-50 py-28 border-y border-gray-200">
        <div className="max-w-[95%] md:max-w-[90%] mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight">
              {t.howItWorks.heading}
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {[
              { icon: Search, title: t.howItWorks.step1Title, desc: t.howItWorks.step1Desc },
              { icon: CheckCircle2, title: t.howItWorks.step2Title, desc: t.howItWorks.step2Desc },
              { icon: Zap, title: t.howItWorks.step3Title, desc: t.howItWorks.step3Desc }
            ].map((step, i) => (
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} key={i} className="relative z-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-white border-2 border-gray-100 shadow-xl flex items-center justify-center mb-6 text-[#09BF44] transform-gpu hover:scale-105 transition-transform">
                  <step.icon className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 font-medium px-4">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Services Section */}
      <section className="py-24 bg-white">
        <div className="max-w-[95%] md:max-w-[90%] mx-auto px-4 md:px-6">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeIn}
            className="text-center md:text-left mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">{t.services.heading}</h2>
            <p className="text-gray-500 mt-3 text-lg font-medium">{t.services.subtext}</p>
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
                'Photo/Video Editor': Video,
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
                  <div className="h-44 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center p-6 text-center transition-transform hover:-translate-y-2 transform-gpu">
                    <div className="mb-4 p-4 rounded-full bg-white shadow-sm text-gray-600 group-hover:bg-[#09BF44] group-hover:text-white transition-colors duration-300">
                      <IconComponent className="w-7 h-7" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#09BF44] transition-colors">{category}</h3>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Top Freelancers Section */}
      {/* <section className="bg-slate-50 py-24 border-y border-gray-100">
        <div className="max-w-[95%] md:max-w-[90%] mx-auto px-4 md:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Top Rated Freelancers</h2>
              <p className="text-gray-500 mt-3 text-lg font-medium">Work with the best talent on our platform</p>
            </div>
            <button
              onClick={() => router.push('/freelancers')}
              className="flex items-center gap-2 text-gray-900 hover:text-[#09BF44] font-bold transition-colors group"
            >
              See all pros <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
                  className="bg-white rounded-3xl border border-gray-200 p-6 hover:border-[#09BF44]/50 transition-colors cursor-pointer group flex flex-col h-full shadow-sm hover:shadow-md"
                >
                  <div className="relative mb-5 flex justify-center">
                    <div className="relative w-20 h-20 rounded-full bg-slate-100 border-[3px] border-white shadow-md overflow-hidden z-10 transition-transform group-hover:scale-110 transform-gpu duration-300">
                      {freelancer.freelancerProfile?.profilePicture ? (
                        <Image
                          src={freelancer.freelancerProfile.profilePicture}
                          alt={`${freelancer.firstName} ${freelancer.lastName}`}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#09BF44] flex items-center justify-center text-white font-black text-2xl">
                          {freelancer.firstName?.[0]?.toUpperCase() || 'F'}
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className="text-center font-black text-gray-900 group-hover:text-[#09BF44] transition-colors leading-tight">
                    {freelancer.firstName} {freelancer.lastName}
                  </h3>
                  
                  <p className="text-sm text-gray-500 font-medium text-center mt-2 mb-4 line-clamp-2 max-h-10 flex-1">
                    {freelancer.freelancerProfile?.bio || 'Professional Freelancer'}
                  </p>

                  <div className="mt-auto">
                    {freelancer.avgRating > 0 && (
                      <div className="flex items-center justify-center gap-1 mb-3">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-bold text-gray-900">{freelancer.avgRating.toFixed(1)}</span>
                        <span className="text-xs text-gray-400 font-bold">({freelancer.completedDeals || 0})</span>
                      </div>
                    )}
                    <div className="text-center pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-400 font-bold mb-0.5 uppercase tracking-wider">Starting at</p>
                      <p className="text-base font-black text-[#09BF44]">
                        EGP {freelancer.startingPrice || freelancer.freelancerProfile?.starterPricing?.basic?.price || 0}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-16 text-gray-400 font-bold">
              <p>No freelancers available right now.</p>
            </div>
          )}
        </div>
      </section> */}

      {/* Projects Section - Restored original grid mapping performance */}
      <section id="projects-section" className="bg-white pb-24">
        <div className="max-w-[95%] md:max-w-[90%] mx-auto px-4 md:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">{t.projects.heading}</h2>
              <p className="text-gray-500 mt-3 text-lg font-medium">{t.projects.subtext}</p>
            </div>
            <button
              onClick={() => router.push('/offers')}
              className="flex items-center gap-2 text-gray-900 hover:text-[#09BF44] font-bold transition-colors group"
            >
              {t.projects.viewMore} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-10 h-10 animate-spin text-[#09BF44]" />
            </div>
          ) : projects.length > 0 ? (
            <div className="relative">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.slice(projectStartIndex, projectStartIndex + 6).map((project) => (
                  <motion.div variants={fadeIn} key={project._id} className="h-full">
                    <ProjectCardCompact project={project} />
                  </motion.div>
                ))}
              </motion.div>

              {projects.length > 6 && (
                <div className="flex items-center justify-center gap-4 mt-8">
                  <button
                    onClick={() => setProjectStartIndex(Math.max(0, projectStartIndex - 3))}
                    disabled={projectStartIndex === 0}
                    className="p-3 rounded-full bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setProjectStartIndex(Math.min(projects.length - 6, projectStartIndex + 3))}
                    disabled={projectStartIndex >= projects.length - 6}
                    className="p-3 rounded-full bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16">
              <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-200" />
              <h3 className="text-lg font-black text-gray-900 mb-1">{t.projects.noServicesTitle}</h3>
              <p className="text-gray-500 font-medium">{t.projects.noServicesDesc}</p>
            </div>
          )}
        </div>
      </section>

      {/* Value Proposition Section - Optimized Backgrounds */}
      <section className="relative py-24 bg-[#08a63b] overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent pointer-events-none mix-blend-overlay"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#000]/10 to-transparent pointer-events-none mix-blend-overlay"></div>

        <div className="max-w-[95%] md:max-w-[90%] mx-auto px-4 md:px-6 relative z-10 flex flex-col lg:flex-row items-center gap-16">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="w-full lg:w-1/2">
            <motion.h2 variants={fadeIn} className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
              {t.value.heading}
            </motion.h2>

            <div className="space-y-8">
              {[
                { title: t.value.item1Title, desc: t.value.item1Desc },
                { title: t.value.item2Title, desc: t.value.item2Desc },
                { title: t.value.item3Title, desc: t.value.item3Desc },
                { title: t.value.item4Title, desc: t.value.item4Desc }
              ].map((item, i) => (
                <motion.div variants={fadeIn} key={i} className="flex gap-5 items-start">
                  <div className="mt-1 bg-white p-1.5 rounded-full text-[#09BF44]">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white mb-2">{item.title}</h3>
                    <p className="text-green-50/90 leading-relaxed font-semibold">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Solid performant geometric visual */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="w-full lg:w-1/2 flex justify-center lg:justify-end"
          >
            <div className="relative w-full max-w-lg bg-white rounded-3xl p-8 shadow-2xl transform-gpu -rotate-2 border-4 border-white/20">
              <div className="space-y-6">
                <div className="h-6 w-1/3 bg-gray-200 rounded-lg"></div>
                <div className="h-24 w-full bg-gray-100 rounded-xl flex items-center justify-between px-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-3 w-24 bg-gray-300 rounded"></div>
                      <div className="h-2 w-16 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                  <div className="h-8 w-24 bg-[#09BF44]/20 rounded-full"></div>
                </div>
                <div className="h-24 w-full bg-gray-100 rounded-xl flex items-center justify-between px-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#09BF44] rounded-full flex items-center justify-center text-white"><Star className="w-6 h-6" /></div>
                    <div className="space-y-2">
                      <div className="h-3 w-32 bg-gray-800 rounded"></div>
                      <div className="h-2 w-20 bg-gray-300 rounded"></div>
                    </div>
                  </div>
                  <div className="h-8 w-24 bg-[#09BF44] rounded-full"></div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Jobs Section */}
      <section id="jobs-section" className="bg-white py-24 pb-32 relative z-20 shadow-[0_20px_50px_rgba(0,0,0,0.06)]">
        <div className="max-w-[95%] md:max-w-[90%] mx-auto px-4 md:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">{t.jobs.heading}</h2>
              <p className="text-gray-500 mt-3 text-lg font-medium">{t.jobs.subtext}</p>
            </div>
            <button
              onClick={() => router.push('/jobs')}
              className="flex items-center gap-2 text-gray-900 hover:text-[#09BF44] font-bold transition-colors group"
            >
              {t.jobs.viewAll} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-10 h-10 animate-spin text-[#09BF44]" />
            </div>
          ) : jobs.length > 0 ? (
            <div className="relative">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {jobs.slice(jobStartIndex, jobStartIndex + 4).map((job) => (
                  <motion.div
                    variants={fadeIn}
                    key={job._id}
                    className="bg-white border text-left border-gray-200 shadow-sm rounded-3xl p-8 hover:border-[#09BF44] transition-colors focus-within:ring-4 focus-within:ring-[#09BF44]/10 group"
                  >
                    <div className="flex flex-col h-full min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-5 gap-4 min-w-0">
                        <h3 className="text-xl font-black text-gray-900 leading-snug group-hover:text-[#09BF44] transition-colors break-words [overflow-wrap:anywhere] min-w-0 flex-1">
                          {job.title}
                        </h3>
                        {job.status === 'open' && (
                          <span className="bg-emerald-50 text-[#09BF44] border border-emerald-100 px-3.5 py-1.5 rounded-full text-xs font-black whitespace-nowrap self-start">
                            {t.jobs.openNow}
                          </span>
                        )}
                      </div>

                      <p className="text-gray-600 font-medium text-[15px] mb-6 line-clamp-2 leading-relaxed flex-1 break-words [overflow-wrap:anywhere] min-w-0">
                        {job.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-5 text-sm mb-6 pb-6 border-b border-gray-100">
                        <div>
                          <span className="text-gray-400 font-bold block mb-1 text-xs uppercase tracking-wider">{t.jobs.budget}</span>
                          <span className="text-gray-900 font-black whitespace-nowrap">
                            EGP {job.budgetRange?.min || 0} - {job.budgetRange?.max || 0}
                          </span>
                        </div>
                        <div className="h-8 w-px bg-gray-200"></div>
                        <div>
                          <span className="text-gray-400 font-bold block mb-1 text-xs uppercase tracking-wider">{t.jobs.deadline}</span>
                          <span className="text-gray-900 font-black">{job.deadline || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                          {job.skills?.slice(0, 3).map((skill: string, idx: number) => (
                            <span key={idx} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold">
                              {skill}
                            </span>
                          ))}
                          {job.skills?.length > 3 && (
                            <span className="text-gray-400 text-xs font-black py-1.5">+{job.skills.length - 3}</span>
                          )}
                        </div>

                        {user?.role === 'freelancer' && job.status === 'open' && (
                          <button
                            onClick={() => router.push(`/jobs`)}
                            className="bg-gray-900 hover:bg-[#09BF44] text-white px-6 py-2.5 rounded-xl font-black transition-colors shadow-md text-sm whitespace-nowrap ml-4 active:scale-95 transform-gpu"
                          >
                            {t.jobs.submitProposal}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {jobs.length > 4 && (
                <div className="flex items-center justify-center gap-4 mt-8">
                  <button
                    onClick={() => setJobStartIndex(Math.max(0, jobStartIndex - 2))}
                    disabled={jobStartIndex === 0}
                    className="p-3 rounded-full bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setJobStartIndex(Math.min(jobs.length - 4, jobStartIndex + 2))}
                    disabled={jobStartIndex >= jobs.length - 4}
                    className="p-3 rounded-full bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16">
              <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-200" />
              <h3 className="text-lg font-black text-gray-900 mb-1">{t.jobs.noJobsTitle}</h3>
              <p className="text-gray-500 font-medium">{t.jobs.noJobsDesc}</p>
            </div>
          )}
        </div>
      </section>

      {/* Parallax Logo Section before footer */}
      <ParallaxLogo />

      {/* 7-second timed join popup — only shown to guests (no token/user in localStorage) */}
      <JoinPopup />

    </main>
  );
}
