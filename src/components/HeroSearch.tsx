import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { categories } from '../data/homeData';
import { useLanguage } from '../context/LanguageContext';
import DynamicBackground from './DynamicBackground';

export default function HeroSearch() {
  const { t } = useLanguage();
  const [specialty, setSpecialty] = useState('');
  
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log('Searching for:', specialty);
  };

  const trustPills = [
    t('hero.trustPills.verified'),
    t('hero.trustPills.privacy'),
    t('hero.trustPills.pricing'),
    t('hero.sessions')
  ];

  return (
    <section className="relative min-h-[600px] flex items-center overflow-hidden bg-white pb-16 pt-10 sm:pb-24 sm:pt-16">
      {/* High-End Dynamic Background (Video + Photo Slider) */}
      <DynamicBackground />

      <div className="section-shell relative z-10">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="text-left rtl:text-right">
            <div>
              <motion.span 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-primary mb-6"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
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
              <span className="text-primary italic">{t('hero.titleAccent')}</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-8 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl font-medium"
            >
              {t('hero.subtitle')}
            </motion.p>

            {/* Search Bar */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-12 max-w-4xl"
            >
              <form
                className="group flex flex-col gap-3 rounded-[32px] border-2 border-slate-100 bg-white p-3 shadow-2xl shadow-primary-900/5 transition-all hover:border-primary/20 sm:flex-row sm:items-center sm:gap-0 sm:p-2.5"
                aria-label="Search doctors"
                onSubmit={handleSubmit}
              >
                <div className="flex flex-1 flex-col px-4 py-2 sm:flex-row sm:items-center sm:gap-4 sm:border-r-2 sm:border-slate-50 rtl:sm:border-r-0 rtl:sm:border-l-2">
                  <div className="h-10 w-10 flex-none rounded-2xl bg-primaryBg flex items-center justify-center text-xl text-primary font-bold">
                    ⚕️
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="text-[10px] font-black uppercase tracking-wider text-primary/60">{t('search.specialty')}</span>
                    <select 
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      className="focus-outline -ml-1 h-8 w-full border-none bg-transparent text-sm font-bold text-textMain focus:ring-0 sm:text-base rtl:ml-0 rtl:-mr-1"
                    >
                      <option value="">{t('search.placeholder')}</option>
                      {categories.map(cat => (
                        <option key={cat.nameKey} value={cat.nameKey}>{t(cat.nameKey)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-1 flex-col px-4 py-2 sm:items-start">
                  <span className="text-[10px] font-black uppercase tracking-wider text-primary/60">{t('search.location')}</span>
                  <input
                    type="text"
                    placeholder={t('search.locationPlaceholder')}
                    className="focus-outline -ml-1 h-8 w-full border-none bg-transparent text-sm font-bold text-textMain placeholder:text-slate-200 focus:ring-0 sm:text-base rtl:ml-0 rtl:-mr-1"
                  />
                </div>

                <button
                  type="submit"
                  className="focus-outline flex h-14 items-center justify-center rounded-[24px] bg-primary px-10 text-base font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primaryDark hover:scale-[1.02] active:scale-[0.98] sm:h-16"
                >
                  {t('search.button')}
                </button>
              </form>

              <div className="mt-8 flex flex-wrap gap-x-8 gap-y-4">
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

          {/* Hero Decorative Image Grid */}
          <div className="hidden lg:grid grid-cols-2 gap-4 h-[500px]">
            <div className="space-y-4 pt-12">
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="h-64 w-full rounded-[40px] overflow-hidden border-4 border-white shadow-soft"
              >
                <img 
                  src="https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&q=80&w=600" 
                  alt="Therapy session" 
                  className="w-full h-full object-cover" 
                />
              </motion.div>
              <div className="h-40 w-full rounded-[40px] overflow-hidden border-4 border-white shadow-soft bg-primary/10 flex items-center justify-center p-8">
                <div className="text-center">
                  <p className="text-3xl font-black text-primary">500+</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary/60">{t('hero.sessions')}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-48 w-full rounded-[40px] overflow-hidden border-4 border-white shadow-soft bg-primaryBg flex items-center justify-center p-6 text-center">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] leading-relaxed">
                  Trusted & <br /> Secure
                </p>
              </div>
              <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="h-80 w-full rounded-[40px] overflow-hidden border-4 border-white shadow-soft"
              >
                <img 
                  src="https://images.unsplash.com/photo-1527689368864-3a821dbccc34?auto=format&fit=crop&q=80&w=600" 
                  alt="Doctor listening" 
                  className="w-full h-full object-cover" 
                />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
