import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type Language = 'en' | 'ar';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
  isRtl: boolean;
}

const translations = {
  en: {
    // Nav
    'nav.doctors': 'Doctors',
    'nav.howItWorks': 'How it works',
    'nav.howVerificationWorks': 'How verification works',
    'nav.forDoctors': 'For Doctors',
    'nav.about': 'About',
    'nav.users': 'Users',
    'nav.dashboard': 'Dashboard',
    // Auth
    'auth.signIn': 'Sign in',
    'auth.signUp': 'Sign up',
    // Hero
    'hero.title': 'A safe space',
    'hero.titleAccent': 'to be heard.',
    'hero.subtitle': 'At Sabina, we believe everyone deserves access to compassionate, professional support. We\'ve built a bridge between clinical excellence and the human need for connection.',
    'hero.badge': 'Trusted Mental Health Network',
    'hero.sessions': 'Verified Sessions',
    'hero.findSupport': 'Find Support Now',
    'hero.howProtect': 'How we protect you',
    'hero.trustPills.verified': 'Verified doctors',
    'hero.trustPills.privacy': 'Privacy-first',
    'hero.trustPills.pricing': 'Transparent pricing',
    // Search
    'search.specialty': 'Expertise',
    'search.location': 'Your Location',
    'search.placeholder': 'What do you need help with?',
    'search.button': 'Find Doctors',
    'search.locationPlaceholder': 'Amman, Jordan',
    // Categories
    'cat.anxiety': 'Anxiety',
    'cat.depression': 'Depression',
    'cat.couples': 'Couples',
    'cat.trauma': 'Trauma',
    'cat.adhd': 'ADHD',
    'cat.stress': 'Stress',
    // Home Sections
    'home.featuredTitle': 'Featured Professionals',
    'home.featuredSubtitle': 'Hand-picked, highly-rated specialists ready to support your journey.',
    'home.howTitle': 'How Sabina works',
    'home.howSubtitle': 'A simple, step-by-step journey designed to help users feel informed, safe, and ready to book.',
    // About Page
    'about.heroTitle': 'A safe space',
    'about.heroTitleAccent': 'to be heard.',
    'about.heroSubtitle': 'At Sabina, we believe everyone deserves access to compassionate, professional support. We\'ve built a bridge between clinical excellence and the human need for connection.',
    'about.commitmentTitle': 'Our commitment to you',
    'about.commitmentSubtitle': 'Sabina isn\'t just a platform; it\'s a safe haven. We exist to make mental health support easier to access with more clarity, trust, and empathy. We bring verified psychologists together with the simple goal of helping you heal.',
    'about.promisesTitle': 'What we promise',
    'about.promise1': 'Simple search and comparison so people can find a good fit faster.',
    'about.promise2': 'Clear profile details, pricing, and session options before booking.',
    'about.promise3': 'A respectful support experience when users or doctors need help.',
    'about.howStep1Title': 'Search',
    'about.howStep1Desc': 'Find psychologists by specialty, city, language, and online availability.',
    'about.howStep2Title': 'Compare',
    'about.howStep2Desc': 'Review profile details, pricing, and ratings to choose with confidence.',
    'about.howStep3Title': 'Book',
    'about.howStep3Desc': 'Pick online or in-person sessions and confirm your appointment.',
    'about.howStep4Title': 'Follow up',
    'about.howStep4Desc': 'Manage upcoming sessions and contact support if you need assistance.',
    'about.impactTitle': 'Our Collective Impact',
    'about.impactSubtitle': 'A quick snapshot of the growing Sabina community and our shared progress.',
    'about.impactLabel1': 'Licensed Professionals',
    'about.impactLabel2': 'Moments of Connection',
    'about.impactLabel3': 'Average Support Rating',
    'about.impactLabel4': 'Always Here For You',
    'about.founderBadge': 'Platform Founder',
    'about.founderEducation': 'Education',
    'about.founderCareer': 'Career Highlights',
    'about.founderExperience': 'Clinical Experience',
    'about.founderSpecializations': 'Primary Specializations',
    'about.whyTitle': 'Why Sabina?',
    'about.treatmentTitle': 'What You Get From Treatment',
    'about.credentialsTitle': 'Professional Credentials',
    'about.credentialsBoard': 'Board Certification',
    'about.credentialsTimeline': 'Practice Timeline',
    'about.credentialsLanguages': 'Languages',
    'about.focusTitle': 'Areas of Focus & Expertise',
    'about.mediaTitle': 'Recognition & Media Appearances',
    'about.mediaDesc': 'Dr. Mizher has been featured in leading regional publications, sharing clinical insights on mental health, addiction recovery, and the psychological impact of contemporary challenges.',
    'about.safetyTitle': 'Your safety is our priority',
    'about.safetySubtitle': 'Trust is built through empathy, careful clinical review, and transparent platform behavior. We protect you so you can focus on healing.',
    'about.safetyItem1Title': 'Doctor verification',
    'about.safetyItem1Desc': 'Applications are reviewed by admins and credentials are checked before approval.',
    'about.safetyItem2Title': 'Privacy-first approach',
    'about.safetyItem2Desc': 'We aim to collect only what is needed for booking and use reasonable safeguards for handling data.',
    'about.safetyItem3Title': 'Clear pricing & details',
    'about.safetyItem3Desc': 'Session pricing, duration, and mode are displayed so users can compare transparently.',
    'about.safetyItem4Title': 'Reporting and reviews',
    'about.safetyItem4Desc': 'Ratings, feedback, and reporting tools help us maintain quality and community trust.',
    'about.faqTitle': 'Frequently asked questions',
    'about.faqSubtitle': 'Quick answers to common questions from users and doctors.',
    'about.ctaTitle': 'Start your search today',
    'about.ctaSubtitle': 'Discover verified psychologists and book confidently, or apply as a doctor to join the Sabina network.',
    'about.ctaFind': 'Find a doctor',
    'about.ctaApply': 'Apply as a doctor',
    // Doctor Card/Profile
    'doctor.verified': 'Verified',
    'doctor.responds': 'Usually responds within 2 hours',
    'doctor.price': 'Price',
    'doctor.priceSuffix': ' / session',
    'doctor.session': 'Session length',
    'doctor.available': 'Next available',
    'doctor.book': 'Book appointment',
    'doctor.viewProfile': 'View profile',
    'doctor.message': 'Message doctor',
    'doctor.secure': 'Secure payment • Cancel up to 24h before',
    'profile.about': 'About',
    'profile.services': 'Services',
    'profile.availability': 'Availability',
    'profile.reviews': 'Reviews',
    'profile.methodology': 'My Methodology',
    'profile.experience': 'Professional Experience',
    'profile.education': 'Academic Background',
    'profile.insurance': 'Insurance & Coverage',
    'profile.insuranceDesc': 'Dr. Sara is a verified partner with leading providers.',
    'profile.specializations': 'Clinical Specializations',
    'profile.watchIntro': 'Watch Introduction',
    'booking.quick': 'Quick booking',
    'booking.service': 'Service',
    'booking.date': 'Date',
    'booking.time': 'Time slots',
    'booking.continue': 'Continue to booking',
    'booking.similar': 'Similar doctors',
    'footer.rights': '© 2026 Sabina. All rights reserved.',
  },
  ar: {
    // Nav
    'nav.doctors': 'الأطباء',
    'nav.howItWorks': 'كيف يعمل',
    'nav.howVerificationWorks': 'كيف تعمل المصادقة',
    'nav.forDoctors': 'للأطباء',
    'nav.about': 'حول',
    'nav.users': 'المستخدمين',
    'nav.dashboard': 'لوحة التحكم',
    // Auth
    'auth.signIn': 'دخول',
    'auth.signUp': 'اشترك',
    // Hero
    'hero.title': 'مساحة آمنة',
    'hero.titleAccent': 'ليتم سماعك.',
    'hero.subtitle': 'في Sabina، نؤمن بأن الجميع يستحق الوصول إلى دعم مهني مليء بالتعاطف. لقد بنينا جسراً بين التميز السريري والحاجة الإنسانية للتواصل.',
    'hero.badge': 'شبكة الصحة النفسية الموثوقة',
    'hero.sessions': 'جلسة معتمدة',
    'hero.findSupport': 'ابحث عن الدعم الآن',
    'hero.howProtect': 'كيف نحميك',
    'hero.trustPills.verified': 'أطباء معتمدون',
    'hero.trustPills.privacy': 'الخصوصية أولاً',
    'hero.trustPills.pricing': 'أسعار شفافة',
    // Search
    'search.specialty': 'التخصص',
    'search.location': 'موقعك',
    'search.placeholder': 'بماذا يمكننا مساعدتك؟',
    'search.button': 'ابحث عن طبيب',
    'search.locationPlaceholder': 'عمان، الأردن',
    // Categories
    'cat.anxiety': 'القلق',
    'cat.depression': 'الاكتئاب',
    'cat.couples': 'الأزواج',
    'cat.trauma': 'الصدمات',
    'cat.adhd': 'تشتت الانتباه',
    'cat.stress': 'الضغوط',
    // Home Sections
    'home.featuredTitle': 'متخصصون متميزون',
    'home.featuredSubtitle': 'متخصصون مختارون بعناية وحاصلون على تقييمات عالية مستعدون لدعم رحلتك.',
    'home.howTitle': 'كيف يعمل Sabina',
    'home.howSubtitle': 'رحلة بسيطة خطوة بخطوة مصممة لمساعدة المستخدمين على الشعور بالاطلاع والأمان والاستعداد للحجز.',
    // About Page
    'about.heroTitle': 'مساحة آمنة',
    'about.heroTitleAccent': 'ليتم سماعك.',
    'about.heroSubtitle': 'في Sabina، نؤمن بأن الجميع يستحق الوصول إلى دعم مهني مليء بالتعاطف. لقد بنينا جسراً بين التميز السريري والحاجة الإنسانية للتواصل.',
    'about.commitmentTitle': 'التزامنا تجاهك',
    'about.commitmentSubtitle': 'Sabina ليس مجرد منصة؛ إنه ملاذ آمن. نحن موجودون لجعل دعم الصحة النفسية أسهل في الوصول إليه مع مزيد من الوضوح والثقة والتعاطف. نحن نجمع الأطباء النفسيين المعتمدين مع الهدف البسيط المتمثل في مساعدتك على الشفاء.',
    'about.promisesTitle': 'ما نعد به',
    'about.promise1': 'بحث ومقارنة بسيطة حتى يتمكن الأشخاص من العثور على الشخص المناسب بشكل أسرع.',
    'about.promise2': 'تفاصيل واضحة للملف الشخصي والأسعار وخيارات الجلسات قبل الحجز.',
    'about.promise3': 'تجربة دعم محترمة عندما يحتاج المستخدمون أو الأطباء إلى المساعدة.',
    'about.howStep1Title': 'البحث',
    'about.howStep1Desc': 'ابحث عن أخصائيين نفسيين حسب التخصص والمدينة واللغة والتوافر عبر الإنترنت.',
    'about.howStep2Title': 'المقارنة',
    'about.howStep2Desc': 'راجع تفاصيل الملف الشخصي والأسعار والتقييمات للاختيار بثقة.',
    'about.howStep3Title': 'الحجز',
    'about.howStep3Desc': 'اختر جلسات عبر الإنترنت أو شخصية وأكد موعدك.',
    'about.howStep4Title': 'المتابعة',
    'about.howStep4Desc': 'إدارة الجلسات القادمة والتواصل مع الدعم إذا كنت بحاجة إلى مساعدة.',
    'about.impactTitle': 'تأثيرنا الجماعي',
    'about.impactSubtitle': 'لقطة سريعة لمجتمع Sabina المتنامي وتقدمنا المشترك.',
    'about.impactLabel1': 'أخصائيون مرخصون',
    'about.impactLabel2': 'لحظات تواصل',
    'about.impactLabel3': 'متوسط تقييم الدعم',
    'about.impactLabel4': 'دائماً هنا من أجلك',
    'about.founderBadge': 'مؤسس المنصة',
    'about.founderEducation': 'التعليم',
    'about.founderCareer': 'أبرز المحطات المهنية',
    'about.founderExperience': 'الخبرة السريرية',
    'about.founderSpecializations': 'التخصصات الأساسية',
    'about.whyTitle': 'لماذا Sabina؟',
    'about.treatmentTitle': 'ما تحصل عليه من العلاج',
    'about.credentialsTitle': 'الاعتمادات المهنية',
    'about.credentialsBoard': 'شهادة البورد',
    'about.credentialsTimeline': 'الجدول الزمني للممارسة',
    'about.credentialsLanguages': 'اللغات',
    'about.focusTitle': 'مجالات التركيز والخبرة',
    'about.mediaTitle': 'الظهور الإعلامي والتقدير',
    'about.mediaDesc': 'ظهر الدكتور مزهر في منشورات إقليمية رائدة، حيث شارك رؤى سريرية حول الصحة النفسية والتعافي من الإدمان والتأثير النفسي للتحديات المعاصرة.',
    'about.safetyTitle': 'سلامتك هي أولويتنا',
    'about.safetySubtitle': 'تُبنى الثقة من خلال التعاطف والمراجعة السريرية الدقيقة وسلوك المنصة الشفاف. نحن نحميك حتى تتمكن من التركيز على الشفاء.',
    'about.safetyItem1Title': 'التحقق من الطبيب',
    'about.safetyItem1Desc': 'تتم مراجعة الطلبات من قبل المسؤولين ويتم التحقق من الاعتمادات قبل الموافقة.',
    'about.safetyItem2Title': 'نهج الخصوصية أولاً',
    'about.safetyItem2Desc': 'نهدف إلى جمع ما هو مطلوب فقط للحجز واستخدام ضمانات معقولة للتعامل مع البيانات.',
    'about.safetyItem3Title': 'أسعار وتفاصيل واضحة',
    'about.safetyItem3Desc': 'يتم عرض أسعار الجلسات ومدتها ووضعها حتى يتمكن المستخدمون من المقارنة بشفافية.',
    'about.safetyItem4Title': 'التقارير والتقييمات',
    'about.safetyItem4Desc': 'تساعدنا التقييمات والملاحظات وأدوات الإبلاغ في الحفاظ على الجودة وثقة المجتمع.',
    'about.faqTitle': 'الأسئلة الشائعة',
    'about.faqSubtitle': 'إجابات سريعة على الأسئلة الشائعة من المستخدمين والأطباء.',
    'about.ctaTitle': 'ابدأ بحثك اليوم',
    'about.ctaSubtitle': 'اكتشف أخصائيين نفسيين معتمدين واحجز بثقة، أو قدم طلباً كطبيب للانضمام إلى شبكة Sabina.',
    'about.ctaFind': 'ابحث عن طبيب',
    'about.ctaApply': 'انضم كطبيب',
    // Doctor Card/Profile
    'doctor.verified': 'معتمد',
    'doctor.responds': 'غالباً ما يرد خلال ساعتين',
    'doctor.price': 'السعر',
    'doctor.priceSuffix': ' / جلسة',
    'doctor.session': 'مدة الجلسة',
    'doctor.available': 'الموعد المتاح التالي',
    'doctor.book': 'حجز موعد',
    'doctor.viewProfile': 'عرض الملف الشخصي',
    'doctor.message': 'مراسلة الطبيب',
    'doctor.secure': 'دفع آمن • إلغاء حتى 24 ساعة قبل الموعد',
    'profile.about': 'حول',
    'profile.services': 'الخدمات',
    'profile.availability': 'المواعيد',
    'profile.reviews': 'التقييمات',
    'profile.methodology': 'منهجيتي في العلاج',
    'profile.experience': 'الخبرة المهنية',
    'profile.education': 'الخلفية الأكاديمية',
    'profile.insurance': 'التأمين والتغطية',
    'profile.insuranceDesc': 'د. سارة شريك معتمد مع كبرى شركات التأمين.',
    'profile.specializations': 'التخصصات السريرية',
    'profile.watchIntro': 'شاهد الفيديو التعريفي',
    'booking.quick': 'حجز سريع',
    'booking.service': 'الخدمة',
    'booking.date': 'التاريخ',
    'booking.time': 'المواعيد المتاحة',
    'booking.continue': 'المتابعة للحجز',
    'booking.similar': 'أطباء مشابهون',
    'footer.rights': '© 2026 Sabina. جميع الحقوق محفوظة.',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('en');

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const t = (key: string) => {
    return (translations[lang] as any)[key] || key;
  };

  const isRtl = lang === 'ar';

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isRtl }}>
      <div dir={isRtl ? 'rtl' : 'ltr'}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
