export type Lang = 'en' | 'ar';

export const translations = {
  en: {
    // ─── Navigation ───────────────────────────────────────────────────────────
    nav: {
      findFreelancer: 'Find a Freelancer',
      browseJobs: 'Browse Jobs',
      howItWorks: 'How it works',
      signIn: 'Sign In',
      join: 'Join',
      dashboard: 'Dashboard',
      postJob: 'Post Job',
      createOffer: 'Create Offer',
      allCategories: 'All Categories',
      selectCategory: 'Select category',
      categories: 'Categories',
      langToggle: 'AR',
    },

    // ─── Category Labels ──────────────────────────────────────────────────────
    categoryMap: {
      // Main categories
      'Development & Tech': 'Development & Tech',
      'Design & Creative': 'Design & Creative',
      'Marketing': 'Marketing',
      'Photo/Video Editor': 'Photo/Video Editor',
      'AI and Automations': 'AI and Automations',
      'Writing & Language': 'Writing & Language',
      'Voice Over': 'Voice Over',
      // Subcategories
      'Web Developer': 'Web Developer',
      'Frontend': 'Frontend',
      'Backend': 'Backend',
      'Full-Stack': 'Full-Stack',
      'Mobile App Developer': 'Mobile App Developer',
      'Shopify / E-commerce Store Developer': 'Shopify / E-commerce Store Developer',
      'Graphic Designer (branding)': 'Graphic Designer (branding)',
      'Logo Designer': 'Logo Designer',
      'UI/UX Designer': 'UI/UX Designer',
      'Clothing / Fashion Designer': 'Clothing / Fashion Designer',
      'Social Media Manager': 'Social Media Manager',
      'Media Buyer (paid ads)': 'Media Buyer (paid ads)',
      'Email Marketing': 'Email Marketing',
      'Video Editor - (Long / Short Content)': 'Video Editor - (Long / Short Content)',
      'Photo Editor': 'Photo Editor',
      'AI Content Creation (photos or videos)': 'AI Content Creation (photos or videos)',
      'AI Agents': 'AI Agents',
      'Automated Systems': 'Automated Systems',
      'Content Writer': 'Content Writer',
      'Copywriter': 'Copywriter',
      'Translation': 'Translation',
      'Voice Over (English)': 'Voice Over (English)',
      'Voice Over (Arabic)': 'Voice Over (Arabic)',
    } as Record<string, string>,

    // ─── Search ───────────────────────────────────────────────────────────────
    search: {
      searchJobs: 'Search jobs...',
      searchFreelancers: 'Search freelancers...',
      freelancer: 'Freelancer',
      jobs: 'Jobs',
      findFreelancer: 'Find Freelancer',
      searchJobs2: 'Search Jobs',
      heroPlaceholder: 'Try "building mobile app"',
      searchBtn: 'Search',
    },

    // ─── Hero Section ─────────────────────────────────────────────────────────
    hero: {
      badge: 'The #1 Freelance Network in Egypt',
      heading1: 'Find the perfect',
      heading2: 'freelancer',
      subtext:
        'Connect with top-tier talent for your business needs. Quality work, secure payments, and amazing results in minutes.',
      popular: 'Popular:',
      tag1: 'Website Design',
      tag2: 'Logo Design',
      tag3: 'Video Editing',
      ratingLabel: '4.9/5 Rating',
      ratingSub: 'Client Average',
      secureLabel: '100% Secure',
      secureSub: 'Payments',
    },

    // ─── About Section ────────────────────────────────────────────────────────
    about: {
      eyebrow: 'About Engezhaly',
      heading: "We're built",
      headingHighlight: 'different.',
      para1:
        'Egypt is moving fast. People are building brands, launching businesses, and chasing ideas. You need the right people beside you — people who deliver quality, speed, and fair prices.',
      para2:
        "That's exactly why Engezhaly exists. Chat with freelancers, build custom deals, and pay only when you're satisfied. Everything is done through one clean platform built for YOU.",
      para3: 'The future of freelancing in the Middle East starts here.',
      secretBtn: 'Secret Message',
      secretMsg:
        '"W ehna ma3ko min awel matna2o el freelancer le8ayet matestelmo el shoghl 😉"',
      forBusiness: 'For Business Owners',
      businessPoint1: '100% free no subscriptions, no surprises.',
      businessPoint2: 'Hire skilled and vetted freelancers in minutes.',
      businessPoint3:
        'Your money is held safely until the job is done right and you are happy.',
      forFreelancers: 'For Freelancers',
      freelancerPoint1: 'Free to join, zero commission.',
      freelancerPoint2:
        'Get paid securely we hold the money before work starts.',
      freelancerPoint3: 'Find clients who are serious and ready to hire.',
    },

    // ─── Stats Section ────────────────────────────────────────────────────────
    stats: {
      clientSatisfaction: 'Client Satisfaction',
      supportAvailable: 'Support Available',
      securePayments: 'Secure Payments',
    },

    // ─── How It Works ─────────────────────────────────────────────────────────
    howItWorks: {
      heading: 'How Engezhaly Works',
      step1Title: '1. Find Your Match',
      step1Desc:
        'Browse vetted freelancers by category, reviews, and price. Or post a job and let them come to you.',
      step2Title: '2. Create Your Deal',
      step2Desc:
        "Chat directly, customize your offer, or bud a bundle deal and pay securely. We hold your money until you're satisfied.",
      step3Title: '3. Get It Done Guaranteed',
      step3Desc:
        'Work done right — you release the payment. Bad quality or missed deadline? We step in and make it right.',
    },

    // ─── Popular Services ─────────────────────────────────────────────────────
    services: {
      heading: 'Popular Professional Services',
      subtext: 'Explore our most demanded categories',
    },

    // ─── Projects Section ─────────────────────────────────────────────────────
    projects: {
      heading: 'Services you might like',
      subtext: 'Explore professional services from talented freelancers',
      viewMore: 'View More',
      noServicesTitle: 'No Services Available',
      noServicesDesc: 'Check back later for new offers.',
    },

    // ─── Value Proposition ───────────────────────────────────────────────────
    value: {
      heading: 'A whole world of freelance talent at your fingertips',
      item1Title: 'The best for every budget',
      item1Desc:
        'Find high-quality services at every price point. No hourly rates, just project-based pricing.',
      item2Title: 'Quality work done quickly',
      item2Desc:
        'Find the right freelancer to begin working on your project within minutes.',
      item3Title: 'Protected payments, every time',
      item3Desc:
        'Your money stays protected and is only released when you approve the work.',
      item4Title: 'Work your way, your choice',
      item4Desc:
        'Choose how you want to get things done pick a bundle, chat for a custom deal, or post a job and receive offers.',
    },

    // ─── Jobs Section ────────────────────────────────────────────────────────
    jobs: {
      heading: 'Recent Opportunities',
      subtext: 'Browse available jobs and send your proposals',
      viewAll: 'View all jobs',
      openNow: 'Open Right Now',
      budget: 'Budget',
      deadline: 'Deadline',
      submitProposal: 'Submit Proposal',
      noJobsTitle: 'No Jobs Available',
      noJobsDesc: 'Check back later for new job postings.',
    },

    // ─── Footer ──────────────────────────────────────────────────────────────
    footer: {
      terms: 'Terms and Conditions',
      privacy: 'Privacy Policy',
      refund: 'Refund Policy',
      contact: 'Contact',
      developedBy: 'Developed by Webicco',
    },

    // ─── Jobs Page ───────────────────────────────────────────────────────────
    jobsPage: {
      title: 'Browse Jobs',
      statusLabel: 'Status',
      budgetLabel: 'Budget',
      sortingLabel: 'Sorting',
      statusOpen: 'Open Jobs',
      statusInProgress: 'In Progress',
      statusCompleted: 'Completed',
      statusAll: 'All Status',
      budgetRange: 'Budget Range',
      newestFirst: 'Newest First',
      budgetLow: 'Budget: Low to High',
      budgetHigh: 'Budget: High to Low',
      clear: 'Clear',
      jobsFound_one: 'job found',
      jobsFound_other: 'jobs found',
      findingJobs: 'Finding jobs...',
      statusOpenBadge: 'Open',
      budgetColon: 'Budget:',
      deadlineColon: 'Deadline:',
      moreSkills: 'more',
      alreadyApplied: 'Already Applied',
      applyNow: 'Apply Now',
      noJobsFound: 'No jobs found',
      noCategory: 'Add your main category in your profile to see jobs in your field. Until then, the job list stays empty.',
      adjustFilters: 'Try adjusting your filters',
      applyTo: 'Apply to',
      priceEGP: 'Price (EGP)',
      deliveryDays: 'Delivery (days)',
      deliveryCalc: 'Delivery is calculated from your last milestone due date.',
      revisionsLabel: 'Revisions',
      deliveryMilestones: 'Delivery Milestones',
      milestoneDesc: 'Optional phases you will deliver by. The client pays once when they approve the full job.',
      milestoneBtnEnabled: 'Enabled',
      milestoneBtnAdd: 'Add delivery milestones',
      milestonePhaseName: 'Delivery phase name',
      milestoneDueDate: 'Due date *',
      addMilestone: '+ Add delivery milestone',
      yourProposal: 'Your Proposal',
      proposalPlaceholder: "Tell the client why you're the perfect fit...",
      cancel: 'Cancel',
      sending: 'Sending...',
      sendProposal: 'Send Proposal',
    },

    // ─── Offers Page ─────────────────────────────────────────────────────────
    offersPage: {
      title: 'Find a Freelancer',
      budgetLabel: 'Budget',
      deliveryTimeLabel: 'Delivery Time',
      sortingLabel: 'Sorting',
      budgetAny: 'Budget',
      deliveryAny: 'Delivery Time',
      deliveryDay1: '1 day',
      deliveryDays3: '3 days',
      deliveryDays7: '7 days',
      deliveryDays14: '14 days',
      deliveryDays30: '30+ days',
      bestSelling: 'Best Selling',
      newestArrivals: 'Newest Arrivals',
      priceLow: 'Price: Low to High',
      priceHigh: 'Price: High to Low',
      clear: 'Clear',
      result_one: 'result',
      result_other: 'results',
      exploringOffers: 'Exploring offers...',
      noOffersFound: 'No offers found',
      adjustFilters: 'Try adjusting your filters',
      searchPlaceholder: 'What service are you looking for?',
    },

    // ─── Misc ────────────────────────────────────────────────────────────────
    misc: {
      startingAt: 'Starting at',
      noFreelancers: 'No freelancers available right now.',
      professionalFreelancer: 'Professional Freelancer',
      sessionExpiredTitle: 'Session Expired',
      sessionExpiredMsg: 'Your session has expired. Please log in again.',
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  Arabic Translations
  // ═══════════════════════════════════════════════════════════════════════════
  ar: {
    // ─── Navigation ───────────────────────────────────────────────────────────
    nav: {
      findFreelancer: 'ابحث عن مستقل',
      browseJobs: 'تصفح الوظائف',
      howItWorks: 'كيف يعمل',
      signIn: 'تسجيل الدخول',
      join: 'انضم الآن',
      dashboard: 'لوحة التحكم',
      postJob: 'نشر وظيفة',
      createOffer: 'إنشاء عرض',
      allCategories: 'جميع الفئات',
      selectCategory: 'اختر فئة',
      categories: 'الفئات',
      langToggle: 'EN',
    },

    // ─── Category Labels ──────────────────────────────────────────────────────
    categoryMap: {
      // Main categories
      'Development & Tech': 'تطوير وتقنية',
      'Design & Creative': 'تصميم وإبداع',
      'Marketing': 'تسويق',
      'Photo/Video Editor': 'مونتاج الصور والفيديو',
      'AI and Automations': 'الذكاء الاصطناعي والأتمتة',
      'Writing & Language': 'كتابة ولغة',
      'Voice Over': 'تعليق صوتي',
      // Subcategories
      'Web Developer': 'مطور مواقع',
      'Frontend': 'فرونت إند',
      'Backend': 'باك إند',
      'Full-Stack': 'فول ستاك',
      'Mobile App Developer': 'مطور تطبيقات موبايل',
      'Shopify / E-commerce Store Developer': 'مطور متاجر شوبيفاي / إلكترونية',
      'Graphic Designer (branding)': 'مصمم جرافيك (هوية بصرية)',
      'Logo Designer': 'مصمم لوجو',
      'UI/UX Designer': 'مصمم UI/UX',
      'Clothing / Fashion Designer': 'مصمم أزياء',
      'Social Media Manager': 'مدير سوشيال ميديا',
      'Media Buyer (paid ads)': 'ميديا باير (إعلانات مدفوعة)',
      'Email Marketing': 'تسويق بالبريد الإلكتروني',
      'Video Editor - (Long / Short Content)': 'مونتاج فيديو (محتوى طويل / قصير)',
      'Photo Editor': 'تعديل صور',
      'AI Content Creation (photos or videos)': 'إنشاء محتوى بالذكاء الاصطناعي',
      'AI Agents': 'وكلاء الذكاء الاصطناعي',
      'Automated Systems': 'أنظمة أتمتة',
      'Content Writer': 'كاتب محتوى',
      'Copywriter': 'كوبي رايتر',
      'Translation': 'ترجمة',
      'Voice Over (English)': 'تعليق صوتي (إنجليزي)',
      'Voice Over (Arabic)': 'تعليق صوتي (عربي)',
    } as Record<string, string>,

    // ─── Search ───────────────────────────────────────────────────────────────
    search: {
      searchJobs: 'ابحث عن وظائف...',
      searchFreelancers: 'ابحث عن مستقلين...',
      freelancer: 'مستقل',
      jobs: 'وظائف',
      findFreelancer: 'ابحث عن مستقل',
      searchJobs2: 'ابحث عن وظيفة',
      heroPlaceholder: 'جرّب "تطوير تطبيق موبايل"',
      searchBtn: 'بحث',
    },

    // ─── Hero Section ─────────────────────────────────────────────────────────
    hero: {
      badge: 'الشبكة الأولى للعمل الحر في مصر',
      heading1: 'اعثر على المستقل',
      heading2: 'المثالي',
      subtext:
        'تواصل مع أفضل المواهب لتلبية احتياجات أعمالك. جودة عالية، مدفوعات آمنة، ونتائج مذهلة في دقائق.',
      popular: 'الأكثر طلباً:',
      tag1: 'تصميم مواقع',
      tag2: 'تصميم شعار',
      tag3: 'مونتاج فيديو',
      ratingLabel: 'تقييم 4.9/5',
      ratingSub: 'متوسط العملاء',
      secureLabel: '100% آمن',
      secureSub: 'المدفوعات',
    },

    // ─── About Section ────────────────────────────────────────────────────────
    about: {
      eyebrow: 'عن إنجزلي',
      heading: 'نحن مختلفون',
      headingHighlight: 'فعلاً.',
      para1:
        'مصر تتحرك بسرعة. الناس تبني براندات، تطلق مشاريع، وتطارد أفكاراً. أنت تحتاج الشخص المناسب بجانبك — شخص يقدم جودة وسرعة وأسعار عادلة.',
      para2:
        'هذا بالضبط سبب وجود إنجزلي. تحدث مع المستقلين، ابنِ صفقات مخصصة، وادفع فقط عندما تكون راضياً. كل شيء يتم من خلال منصة واحدة مبنية لأجلك.',
      para3: 'مستقبل العمل الحر في الشرق الأوسط يبدأ من هنا.',
      secretBtn: 'رسالة سرية',
      secretMsg:
        '"و إحنا معاك من أول ما تتفاوض مع الفريلانسر لحد ما تستلم الشغل 😉"',
      forBusiness: 'لأصحاب الأعمال',
      businessPoint1: 'مجاني 100% بدون اشتراكات أو مفاجآت.',
      businessPoint2: 'وظّف مستقلين ماهرين وموثوقين في دقائق.',
      businessPoint3:
        'أموالك محفوظة بأمان حتى تنتهي المهمة بشكل صحيح وتكون راضياً.',
      forFreelancers: 'للمستقلين',
      freelancerPoint1: 'انضمام مجاني، صفر عمولة.',
      freelancerPoint2: 'احصل على مدفوعاتك بأمان — نحن نحتجز المال قبل البدء.',
      freelancerPoint3: 'اعثر على عملاء جادين ومستعدين للتوظيف.',
    },

    // ─── Stats Section ────────────────────────────────────────────────────────
    stats: {
      clientSatisfaction: 'رضا العملاء',
      supportAvailable: 'دعم متاح',
      securePayments: 'مدفوعات آمنة',
    },

    // ─── How It Works ─────────────────────────────────────────────────────────
    howItWorks: {
      heading: 'كيف تعمل إنجزلي',
      step1Title: '١. ابحث عن مطابقتك',
      step1Desc:
        'تصفح المستقلين الموثقين حسب الفئة والتقييمات والسعر. أو انشر وظيفة واتركهم يأتون إليك.',
      step2Title: '٢. أنشئ صفقتك',
      step2Desc:
        'تحدث مباشرةً، خصص عرضك، أو ابنِ صفقة مجمعة وادفع بأمان. نحن نحتجز أموالك حتى تكون راضياً.',
      step3Title: '٣. أنجز العمل بضمان',
      step3Desc:
        'العمل يُنجز بشكل صحيح — أنت تحرر الدفع. جودة سيئة أو تأخير؟ نحن ندخل ونصلح الأمر.',
    },

    // ─── Popular Services ─────────────────────────────────────────────────────
    services: {
      heading: 'الخدمات المهنية الأكثر طلباً',
      subtext: 'استكشف أكثر فئاتنا طلباً',
    },

    // ─── Projects Section ─────────────────────────────────────────────────────
    projects: {
      heading: 'خدمات قد تعجبك',
      subtext: 'استكشف خدمات احترافية من مستقلين موهوبين',
      viewMore: 'عرض المزيد',
      noServicesTitle: 'لا توجد خدمات متاحة',
      noServicesDesc: 'تحقق لاحقاً للاطلاع على العروض الجديدة.',
    },

    // ─── Value Proposition ───────────────────────────────────────────────────
    value: {
      heading: 'عالم كامل من المواهب المستقلة في متناول يدك',
      item1Title: 'الأفضل لكل ميزانية',
      item1Desc:
        'اعثر على خدمات عالية الجودة بكل نطاق سعري. لا أسعار بالساعة، فقط تسعير قائم على المشروع.',
      item2Title: 'عمل جيد يُنجز بسرعة',
      item2Desc: 'اعثر على المستقل المناسب للبدء في مشروعك في دقائق.',
      item3Title: 'مدفوعات محمية في كل مرة',
      item3Desc: 'أموالك محمية ولا تُحرر إلا عند موافقتك على العمل.',
      item4Title: 'اعمل بأسلوبك، اختيارك',
      item4Desc:
        'اختر الطريقة التي تريدها — اختر باقة، تحدث لصفقة مخصصة، أو انشر وظيفة واستقبل العروض.',
    },

    // ─── Jobs Section ────────────────────────────────────────────────────────
    jobs: {
      heading: 'الفرص الأخيرة',
      subtext: 'تصفح الوظائف المتاحة وأرسل مقترحاتك',
      viewAll: 'عرض كل الوظائف',
      openNow: 'مفتوح الآن',
      budget: 'الميزانية',
      deadline: 'الموعد النهائي',
      submitProposal: 'إرسال مقترح',
      noJobsTitle: 'لا توجد وظائف متاحة',
      noJobsDesc: 'تحقق لاحقاً للاطلاع على المنشورات الجديدة.',
    },

    // ─── Footer ──────────────────────────────────────────────────────────────
    footer: {
      terms: 'الشروط والأحكام',
      privacy: 'سياسة الخصوصية',
      refund: 'سياسة الاسترداد',
      contact: 'تواصل معنا',
      developedBy: 'تطوير Webicco',
    },

    // ─── Jobs Page ───────────────────────────────────────────────────────────
    jobsPage: {
      title: 'تصفح الوظائف',
      statusLabel: 'الحالة',
      budgetLabel: 'الميزانية',
      sortingLabel: 'الترتيب',
      statusOpen: 'وظائف مفتوحة',
      statusInProgress: 'قيد التنفيذ',
      statusCompleted: 'مكتملة',
      statusAll: 'كل الحالات',
      budgetRange: 'نطاق الميزانية',
      newestFirst: 'الأحدث أولاً',
      budgetLow: 'الميزانية: من الأقل',
      budgetHigh: 'الميزانية: من الأعلى',
      clear: 'مسح',
      jobsFound_one: 'وظيفة',
      jobsFound_other: 'وظيفة',
      findingJobs: 'جارٍ البحث عن وظائف...',
      statusOpenBadge: 'مفتوحة',
      budgetColon: 'الميزانية:',
      deadlineColon: 'الموعد النهائي:',
      moreSkills: 'المزيد',
      alreadyApplied: 'تقدمت مسبقاً',
      applyNow: 'تقدم الآن',
      noJobsFound: 'لا توجد وظائف',
      noCategory: 'أضف فئتك الرئيسية في ملفك الشخصي لرؤية الوظائف في مجالك.',
      adjustFilters: 'جرب تعديل الفلاتر',
      applyTo: 'التقدم لـ',
      priceEGP: 'السعر (جنيه)',
      deliveryDays: 'التسليم (أيام)',
      deliveryCalc: 'يُحسب التسليم من تاريخ استحقاق آخر مرحلة.',
      revisionsLabel: 'مراجعات',
      deliveryMilestones: 'مراحل التسليم',
      milestoneDesc: 'مراحل اختيارية تلتزم بتسليمها. يدفع العميل مرة واحدة عند الموافقة على العمل.',
      milestoneBtnEnabled: 'مفعّل',
      milestoneBtnAdd: 'إضافة مراحل تسليم',
      milestonePhaseName: 'اسم مرحلة التسليم',
      milestoneDueDate: 'تاريخ الاستحقاق *',
      addMilestone: '+ إضافة مرحلة تسليم',
      yourProposal: 'مقترحك',
      proposalPlaceholder: 'أخبر العميل لماذا أنت الأنسب...',
      cancel: 'إلغاء',
      sending: 'جارٍ الإرسال...',
      sendProposal: 'إرسال المقترح',
    },

    // ─── Offers Page ─────────────────────────────────────────────────────────
    offersPage: {
      title: 'ابحث عن مستقل',
      budgetLabel: 'الميزانية',
      deliveryTimeLabel: 'وقت التسليم',
      sortingLabel: 'الترتيب',
      budgetAny: 'الميزانية',
      deliveryAny: 'وقت التسليم',
      deliveryDay1: 'يوم واحد',
      deliveryDays3: '3 أيام',
      deliveryDays7: '7 أيام',
      deliveryDays14: '14 يوماً',
      deliveryDays30: '30+ يوماً',
      bestSelling: 'الأكثر مبيعاً',
      newestArrivals: 'الأحدث',
      priceLow: 'السعر: من الأقل',
      priceHigh: 'السعر: من الأعلى',
      clear: 'مسح',
      result_one: 'نتيجة',
      result_other: 'نتيجة',
      exploringOffers: 'جارٍ استكشاف العروض...',
      noOffersFound: 'لا توجد عروض',
      adjustFilters: 'جرب تعديل الفلاتر',
      searchPlaceholder: 'ما الخدمة التي تبحث عنها؟',
    },

    // ─── Misc ────────────────────────────────────────────────────────────────
    misc: {
      startingAt: 'يبدأ من',
      noFreelancers: 'لا يوجد مستقلون متاحون الآن.',
      professionalFreelancer: 'مستقل محترف',
      sessionExpiredTitle: 'انتهت الجلسة',
      sessionExpiredMsg: 'انتهت جلستك. يرجى تسجيل الدخول مجدداً.',
    },
  },
} as const;

export type TranslationKey = typeof translations.en;
