import { useEffect, useRef, useState, type ReactNode } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const aboutNavItems = [
  { labelKey: 'nav.doctors', href: '/home#featured-doctors' },
  { labelKey: 'nav.howVerificationWorks', href: '#trust-safety' },
  { labelKey: 'nav.forDoctors', href: '/apply-doctor' },
  { labelKey: 'nav.about', href: '/about' }
];

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

function Reveal({ children, className = '', delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.18 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transform-gpu transition-all duration-700 ${visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

const trustBadges = ['مختصون مرخصون', 'جلسات آمنة وسرية', 'استشارة من أي مكان'];

const stackedCards = [
  {
    title: 'الرؤية',
    icon: 'brain',
    points: ['ريادة العلاج النفسي الرقمي في العالم العربي.', 'ربط المرضى بمختصين موثوقين.', 'تجربة علاجية حديثة وسهلة الوصول.']
  },
  {
    title: 'نبذة عن المنصة',
    icon: 'book',
    points: ['منصة علاج نفسي رقمية مع بيئة داعمة.', 'جلسات فيديو مباشرة وأدوات متابعة واضحة.', 'خصوصية عالية وتنظيم بسيط للمواعيد.']
  },
  {
    title: 'الرسالة',
    icon: 'shield',
    points: ['دعم نفسي بجودة عالية وسعر مناسب.', 'تمكين المختص بأدوات تقنية فعالة.', 'جعل طلب المساعدة النفسية أقرب وأسهل.']
  }
] as const;

const whyChooseUs = [
  { title: 'حماية وخصوصية عالية', desc: 'بيئتنا مصممة للحفاظ على سرية كل جلسة وبيان.', icon: 'shield' },
  { title: 'جلسات فيديو آمنة', desc: 'اتصال واضح وآمن يضمن راحة التواصل بين المراجع والمختص.', icon: 'video' },
  { title: 'مختصون معتمدون', desc: 'نعمل مع مختصين مرخّصين بعد مراجعة دقيقة للمؤهلات.', icon: 'doctor' },
  { title: 'تقنيات حديثة مثل VR', desc: 'خيارات علاج متقدمة تساعد على تجربة أكثر تفاعلا.', icon: 'spark' }
] as const;

const audienceCards = [
  {
    role: 'أطباء نفسيون',
    badge: 'Psychiatrist',
    badgeClass: 'bg-sky-100 text-sky-700',
    icon: 'doctor',
    points: ['تشخيص الحالات النفسية المعقدة.', 'وصف الأدوية عند الحاجة الطبية.', 'متابعة الخطة العلاجية عبر المنصة.']
  },
  {
    role: 'معالجون نفسيون',
    badge: 'Therapist',
    badgeClass: 'bg-emerald-100 text-emerald-700',
    icon: 'brain',
    points: ['جلسات سلوكية ومعرفية وأسرية.', 'دعم نفسي منتظم دون وصف أدوية.', 'خطط علاجية عملية ومناسبة للأهداف.']
  },
  {
    role: 'مرضى ومستخدمون',
    badge: 'User',
    badgeClass: 'bg-slate-100 text-slate-700',
    icon: 'user',
    points: ['من يواجهون قلقا أو ضغوطا يومية.', 'من يبحثون عن دعم نفسي مرن وسريع.', 'من يفضّلون جلسات علاج عبر الإنترنت.']
  },
  {
    role: 'إدارة المنصة',
    badge: 'Admin',
    badgeClass: 'bg-slate-800 text-slate-100',
    icon: 'settings',
    points: ['إدارة حسابات المختصين والمراجعين.', 'التحقق من التراخيص وطلبات الانضمام.', 'مراقبة الجودة وتحليل الأداء باستمرار.']
  }
] as const;

const trustSafety = [
  'تواصل مشفّر بين المراجع والمختص.',
  'تخزين بيانات آمن بمعايير حماية حديثة.',
  'اعتماد مهني موثّق قبل الانضمام للمنصة.',
  'نظام وصف دوائي مضبوط وتحت إشراف طبي.'
];

function Icon({ kind, className = 'h-5 w-5' }: { kind: string; className?: string }) {
  if (kind === 'brain') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M9.5 2A3.5 3.5 0 0 0 6 5.5V7a2.5 2.5 0 0 0 0 5v1.5A3.5 3.5 0 0 0 9.5 17H10" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14.5 2A3.5 3.5 0 0 1 18 5.5V7a2.5 2.5 0 0 1 0 5v1.5A3.5 3.5 0 0 1 14.5 17H14" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 17v1.5a2 2 0 0 0 4 0V17" strokeLinecap="round" />
      </svg>
    );
  }

  if (kind === 'book') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5V4.5A2.5 2.5 0 0 1 6.5 2Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (kind === 'shield') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (kind === 'video') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="6" width="14" height="12" rx="2" />
        <path d="m17 10 4-2v8l-4-2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (kind === 'doctor') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M14.5 4.5h-5v5h-5v5h5v5h5v-5h5v-5h-5z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (kind === 'user') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" strokeLinecap="round" />
      </svg>
    );
  }

  if (kind === 'settings') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Z" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .16 1.7 1.7 0 0 0-.95 1.55V21a2 2 0 0 1-4 0v-.09a1.7 1.7 0 0 0-.95-1.55A1.7 1.7 0 0 0 7 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 2.6 15a1.7 1.7 0 0 0-.16-1 1.7 1.7 0 0 0-1.55-.95H1a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-.95A1.7 1.7 0 0 0 2.6 7c0-.68-.27-1.33-.74-1.8L1.8 5.14a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 7 2.6a1.7 1.7 0 0 0 1-.16A1.7 1.7 0 0 0 8.95.89V1a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 .95 1.55 1.7 1.7 0 0 0 1 .16c.68 0 1.33-.27 1.8-.74l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 7c0 .35.06.69.16 1a1.7 1.7 0 0 0 1.55.95H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55.95c-.1.31-.16.65-.16 1Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function HeroIllustration() {
  return (
    <svg aria-hidden="true" viewBox="0 0 560 320" className="h-full w-full">
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#30D5C8" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#30D5C8" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="560" height="320" rx="32" fill="url(#g1)" />
      <circle cx="150" cy="165" r="56" fill="#ffffff" fillOpacity="0.75" />
      <circle cx="405" cy="142" r="52" fill="#ffffff" fillOpacity="0.75" />
      <path d="M210 165c42-42 95-42 138-2" stroke="#30D5C8" strokeWidth="5" strokeLinecap="round" />
      <path d="M215 200c60-22 110-18 156 12" stroke="#30D5C8" strokeWidth="3.5" strokeOpacity="0.8" strokeLinecap="round" />
      <circle cx="272" cy="126" r="6" fill="#30D5C8" />
      <circle cx="318" cy="148" r="5" fill="#30D5C8" fillOpacity="0.8" />
      <circle cx="292" cy="184" r="4.5" fill="#30D5C8" fillOpacity="0.75" />
    </svg>
  );
}

function SideIllustration() {
  return (
    <svg aria-hidden="true" viewBox="0 0 420 520" className="h-full w-full">
      <defs>
        <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#30D5C8" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#30D5C8" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="420" height="520" rx="28" fill="url(#g2)" />
      <circle cx="130" cy="170" r="38" fill="#fff" fillOpacity="0.88" />
      <circle cx="290" cy="150" r="44" fill="#fff" fillOpacity="0.82" />
      <path d="M145 265c34-40 92-52 144-19" stroke="#30D5C8" strokeWidth="4" strokeLinecap="round" />
      <path d="M95 325c60 20 169 20 229-9" stroke="#30D5C8" strokeWidth="3" strokeOpacity="0.8" strokeLinecap="round" />
      <path d="M108 392c48 29 161 35 213 10" stroke="#30D5C8" strokeWidth="3" strokeOpacity="0.65" strokeLinecap="round" />
      <circle cx="210" cy="225" r="7" fill="#30D5C8" />
      <circle cx="236" cy="318" r="6" fill="#30D5C8" fillOpacity="0.8" />
      <circle cx="185" cy="360" r="5" fill="#30D5C8" fillOpacity="0.7" />
    </svg>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/40 via-white to-white text-textMain">
      <Header brandHref="/home" navItems={aboutNavItems} />

      <main dir="rtl" style={{ fontFamily: 'Noto Sans Arabic, sans-serif' }}>
        <section className="relative overflow-hidden bg-gradient-to-br from-white via-primaryBg/50 to-primaryBg/80 py-12 sm:py-16">
          <div className="section-shell">
            <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
              <Reveal className="order-2 lg:order-1">
                <div className="relative overflow-hidden rounded-[28px] border border-primary/15 bg-white p-6 shadow-soft sm:p-8">
                  <div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle at 15% 15%, rgba(48,213,200,0.18), transparent 38%)' }} />
                  <h1 className="relative text-4xl font-black leading-tight tracking-tight text-textMain sm:text-5xl">
                    مساحة آمنة لدعم صحتك النفسية
                  </h1>
                  <p className="relative mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-lg">
                    في Sabina Therapy، نرافقك بخطوات هادئة نحو توازن نفسي أفضل، مع رعاية إنسانية تحترم خصوصيتك وتفهم احتياجك.
                  </p>
                  <ul className="relative mt-6 grid gap-2 sm:grid-cols-3">
                    {trustBadges.map((item) => (
                      <li key={item} className="inline-flex items-center gap-2 rounded-xl bg-primaryBg px-3 py-2 text-xs font-bold text-black sm:text-sm">
                        <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <path d="m4 10 3 3 9-9" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>

              <Reveal className="order-1 lg:order-2" delay={90}>
                <div className="mx-auto h-[250px] w-full max-w-xl rounded-[28px] border border-primary/10 bg-white/75 p-3 shadow-soft sm:h-[320px]">
                  <HeroIllustration />
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="section-shell py-14 sm:py-16" id="vision-mission">
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <Reveal className="h-full" delay={40}>
              <div className="h-full rounded-[26px] border border-primary-100 bg-gradient-to-br from-primary-50/70 to-white p-4 shadow-soft sm:p-6">
                <SideIllustration />
              </div>
            </Reveal>

            <div className="space-y-4">
              {stackedCards.map((card, index) => (
                <Reveal key={card.title} delay={70 + index * 80}>
                  <article className="rounded-hero border border-borderGray bg-white p-5 shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-soft sm:p-6">
                    <header className="mb-3 flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primaryBg text-primary">
                        <Icon kind={card.icon} className="h-5 w-5" />
                      </span>
                      <h2 className="text-xl font-black text-textMain sm:text-2xl">{card.title}</h2>
                    </header>
                    <ul className="list-disc space-y-1 pr-6 text-sm leading-7 text-muted sm:text-base">
                      {card.points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="section-shell py-14 sm:py-16">
          <Reveal>
            <div className="rounded-hero border border-primary-100 bg-gradient-to-br from-white to-primary-50/60 p-6 shadow-soft sm:p-8">
              <h2 className="text-3xl font-black tracking-tight text-textMain sm:text-4xl">لماذا Sabina Therapy؟</h2>
              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                {whyChooseUs.map((item, index) => (
                  <Reveal key={item.title} delay={80 + index * 60}>
                    <article className="rounded-card bg-white p-5 shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-soft">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primaryBg text-primary">
                        <Icon kind={item.icon} className="h-5 w-5" />
                      </span>
                      <h3 className="mt-3 text-lg font-black text-textMain">{item.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted">{item.desc}</p>
                    </article>
                  </Reveal>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        <section className="section-shell py-14 sm:py-16">
          <Reveal>
            <div className="rounded-hero border border-borderGray bg-white p-6 shadow-soft sm:p-8">
              <h2 className="text-3xl font-black tracking-tight text-textMain sm:text-4xl">الفئات المستهدفة</h2>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">
                كل دور في المنصة واضح، لضمان رحلة علاجية منظمة، موثوقة، ومريحة لجميع الأطراف.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {audienceCards.map((item, index) => (
                  <Reveal key={item.role} delay={90 + index * 70}>
                    <article className="rounded-card border border-borderGray bg-gradient-to-br from-white to-slate-50 p-5 shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-soft">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="flex items-center gap-2 text-lg font-black text-textMain">
                          <span className="text-primary">
                            <Icon kind={item.icon} className="h-5 w-5" />
                          </span>
                          {item.role}
                        </h3>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${item.badgeClass}`}>{item.badge}</span>
                      </div>

                      <ul className="mt-3 list-disc space-y-1 pr-6 text-sm leading-7 text-muted">
                        {item.points.map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ul>
                    </article>
                  </Reveal>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        <section className="section-shell py-14 sm:py-16" id="trust-safety">
          <Reveal>
            <div className="rounded-hero border border-primary-100 bg-gradient-to-r from-primary-50/70 to-white p-6 shadow-soft sm:p-8">
              <h2 className="text-3xl font-black tracking-tight text-textMain sm:text-4xl">الخصوصية والأمان أولويتنا</h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {trustSafety.map((item, index) => (
                  <Reveal key={item} delay={70 + index * 60}>
                    <div className="flex items-start gap-3 rounded-xl bg-white px-4 py-3 shadow-card">
                      <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primaryBg text-primary">
                        <Icon kind="shield" className="h-4 w-4" />
                      </span>
                      <p className="text-sm font-medium text-muted sm:text-base">{item}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        <section className="section-shell pb-16 pt-6 sm:pb-20">
          <Reveal>
            <div
              className="relative overflow-hidden rounded-[28px] bg-cover bg-center bg-no-repeat px-6 py-8 text-white shadow-soft sm:px-10 sm:py-10"
              style={{
                backgroundImage:
                  "linear-gradient(110deg, rgba(8, 52, 66, 0.76), rgba(20, 125, 137, 0.58)), url('https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1800&q=80')"
              }}
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.18),transparent_35%)]" />
              <div className="relative z-10">
                <h2 className="text-3xl font-black tracking-tight sm:text-4xl">ابدأ رحلتك النفسية اليوم</h2>
                <p className="mt-2 max-w-2xl text-sm text-primary-50 sm:text-base">
                  خطوة بسيطة اليوم قد تصنع فرقا كبيرا في توازنك النفسي وجودة حياتك.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href="/home#featured-doctors"
                    className="focus-outline inline-flex h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-primary transition hover:bg-primary-50"
                  >
                    احجز جلسة
                  </a>
                  <a
                    href="/apply-doctor"
                    className="focus-outline inline-flex h-11 items-center justify-center rounded-xl border border-white/40 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    انضم كمختص
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <Footer />
    </div>
  );
}
