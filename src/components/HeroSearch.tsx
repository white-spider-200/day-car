import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import DynamicBackground from './DynamicBackground';

export default function HeroSearch() {
  const { t } = useLanguage();

  const trustPills = [
    t('hero.trustPills.verified'),
    t('hero.trustPills.privacy'),
    t('hero.trustPills.pricing'),
    t('hero.sessions')
  ];

  return (
    <section className="relative flex min-h-[420px] items-center overflow-hidden bg-white pb-8 pt-8 sm:min-h-[480px] sm:pb-12 sm:pt-12">
      {/* High-End Dynamic Background (Video + Photo Slider) */}
      <DynamicBackground />

      <div className="section-shell relative z-10">
        <div className="max-w-4xl text-left rtl:text-right">
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
        </div>
      </div>
    </section>
  );
}
