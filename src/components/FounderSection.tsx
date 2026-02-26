import { founderInfo } from '../data/founderData';
import { useLanguage } from '../context/LanguageContext';

export default function FounderSection() {
  const { t, lang } = useLanguage();
  const isAr = lang === 'ar';

  return (
    <section className="section-shell py-14 sm:py-20" aria-labelledby="founder-title">
      <div className="rounded-hero border border-borderGray bg-white p-6 shadow-card sm:p-10 lg:p-14 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primaryBg/40 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl pointer-events-none" />

        <div className="grid gap-12 lg:grid-cols-[1fr_1.8fr] lg:items-start relative z-10">
          <div className="space-y-8">
            <div className="relative group">
              <div className="aspect-[4/5] w-full max-w-sm mx-auto overflow-hidden rounded-[40px] border-4 border-white shadow-soft relative z-10 bg-primaryBg/20">
                <img
                  src={founderInfo.photos[0]}
                  alt={founderInfo.name}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition duration-700"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary/10 rounded-3xl -z-10 animate-pulse" />
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-primaryBg rounded-full -z-10" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="aspect-square rounded-2xl overflow-hidden border-2 border-white shadow-card">
                <img src={founderInfo.photos[1]} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="aspect-square rounded-2xl overflow-hidden border-2 border-white shadow-card">
                <img src={founderInfo.photos[2]} alt="" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>

          <div className="lg:pt-4">
            <div className="flex flex-col gap-2 mb-8">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-primary w-fit">
                {t('about.founderBadge')}
              </span>
              <div className="flex flex-col gap-1 mt-2">
                <h2 id="founder-title" className="text-4xl font-black text-textMain sm:text-5xl tracking-tight">{isAr ? founderInfo.nameArabic : founderInfo.name}</h2>
                <div className="flex flex-col gap-2 mt-2">
                  {isAr && <p className="text-2xl font-bold text-primary/80" dir="rtl">{founderInfo.nameArabic}</p>}
                  {!isAr && <p className="text-2xl font-bold text-primary/80" dir="rtl">{founderInfo.nameArabic}</p>}
                  <p className="text-lg font-bold text-muted">{founderInfo.title}</p>
                  <p className="text-sm text-muted/70">📍 {founderInfo.location}</p>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="relative">
                <svg className="absolute -top-4 -left-6 h-12 w-12 text-primary/10 -z-10" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H16.017C14.9124 8 14.017 7.10457 14.017 6V3L14.017 3C14.017 1.89543 14.9124 1 16.017 1H19.017C21.2261 1 23.017 2.79086 23.017 5V15C23.017 18.3137 20.3307 21 17.017 21H14.017ZM1.017 21L1.017 18C1.017 16.8954 1.91243 16 3.017 16H6.017C6.56928 16 7.017 15.5523 7.017 15V9C7.017 8.44772 6.56928 8 6.017 8H3.017C1.91243 8 1.017 7.10457 1.017 6V3L1.017 3C1.017 1.89543 1.91243 1 3.017 1H6.017C8.22614 1 10.017 2.79086 10.017 5V15C10.017 18.3137 7.33072 21 4.017 21H1.017Z" />
                </svg>
                <p className="text-lg leading-relaxed text-muted sm:text-2xl font-medium">
                  "{founderInfo.bio.substring(0, 300)}..."
                </p>
              </div>

              <div className="flex flex-wrap gap-4 pt-4">
                <a
                  href="/about#founder"
                  className="focus-outline inline-flex h-12 items-center justify-center rounded-xl bg-primary px-6 text-sm font-bold text-white transition-all hover:bg-primaryDark hover:shadow-lg"
                >
                  {isAr ? 'اقرأ المزيد عن المؤسس' : 'Read Full Founder Story'}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
