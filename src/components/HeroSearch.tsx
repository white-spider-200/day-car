import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { founderImageFallback, founderProfile } from '../data/founderProfile';
import { navigateTo } from '../utils/auth';
import DynamicBackground from './DynamicBackground';
import { useState } from 'react';

export default function HeroSearch() {
  const { t, lang } = useLanguage();
  const [imageSrc, setImageSrc] = useState(founderProfile.image);
  const isAr = lang === 'ar';

  const trustPills = [
    t('hero.trustPills.verified'),
    t('hero.trustPills.privacy'),
    t('hero.trustPills.pricing'),
    t('hero.sessions')
  ];

  const goToFounder = () => {
    navigateTo('/founder');
  };

  const founderCard = (
    <a
      href="/founder"
      aria-label={isAr ? 'عرض ملف المؤسس د. عبدالرحمن مزهر' : 'View founder profile Dr. Abdulrahman Muzher'}
      onClick={(event) => {
        event.preventDefault();
        goToFounder();
      }}
      className="group block w-full max-w-[360px] cursor-pointer rounded-[22px] border border-white/40 bg-[rgba(255,255,255,0.92)] p-6 shadow-[0_12px_30px_rgba(15,23,42,0.12)] backdrop-blur-[10px] transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.16)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-primary">
        {isAr ? 'المؤسس' : 'Founder'}
      </span>

      <div className="mt-4 flex items-start gap-3">
        <img
          src={imageSrc}
          alt={isAr ? founderProfile.name_ar : founderProfile.name_en}
          className="h-[72px] w-[72px] rounded-xl object-cover ring-2 ring-primary/20"
          onError={() => setImageSrc(founderImageFallback)}
        />
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 truncate text-lg font-extrabold text-textMain">
            <span className="truncate">{isAr ? founderProfile.name_ar : founderProfile.name_en}</span>
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="h-4 w-4 flex-none text-primary"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <circle cx="10" cy="10" r="8.2" />
              <path d="m6.8 10 2.1 2.1 4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </h3>
          <p className="mt-1 line-clamp-2 text-xs font-medium text-muted">
            {isAr ? founderProfile.title_ar : founderProfile.title_en}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">{founderProfile.location}</p>
        </div>
      </div>
      <span className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-white transition group-hover:bg-primaryDark">
        {isAr ? 'عرض الملف' : 'View Profile'}
      </span>
    </a>
  );

  return (
    <section className="relative flex min-h-[420px] items-center overflow-hidden bg-white pb-8 pt-8 sm:min-h-[480px] sm:pb-12 sm:pt-12">
      {/* High-End Dynamic Background (Video + Photo Slider) */}
      <DynamicBackground />
      <div className="pointer-events-none absolute inset-0 bg-white/45 sm:bg-white/35" />

      <div className="section-shell relative z-10">
        <div
          className={`hidden md:block md:absolute md:top-[clamp(90px,11vw,130px)] ${
            isAr ? 'md:left-[clamp(40px,5vw,70px)]' : 'md:right-[clamp(40px,5vw,70px)]'
          }`}
        >
          {founderCard}
        </div>

        <div
          className={`max-w-4xl ${
            isAr
              ? 'text-right md:pr-6 md:pl-[clamp(320px,33vw,430px)]'
              : 'text-left md:pl-6 md:pr-[clamp(320px,33vw,430px)]'
          }`}
        >
          <div>
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-primary"
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              {t('hero.badge')}
            </motion.span>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-3xl text-4xl font-black leading-[1.1] tracking-tight text-textMain sm:text-6xl lg:text-7xl"
          >
            {t('hero.title')} <br />
            <span className="italic text-primary">{t('hero.titleAccent')}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 max-w-2xl text-lg font-medium leading-relaxed text-muted sm:text-xl"
          >
            {t('hero.subtitle')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-9"
          >
            <div className="flex flex-wrap gap-x-8 gap-y-4">
              {trustPills.map((pill) => (
                <div
                  key={pill}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-muted/50"
                >
                  <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  {pill}
                </div>
              ))}
            </div>
          </motion.div>

          <div className="mt-8 flex justify-center md:hidden">
            {founderCard}
          </div>
        </div>
      </div>
    </section>
  );
}
