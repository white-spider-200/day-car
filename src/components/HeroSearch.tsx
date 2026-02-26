import { useState, type FormEvent } from 'react';
import { motion, type Variants } from 'framer-motion';
import { categories } from '../data/homeData';
import { useLanguage } from '../context/LanguageContext';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } }
};

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
    <section className="relative overflow-hidden bg-white pb-16 pt-10 sm:pb-24 sm:pt-16">
      {/* Background decoration with actual photos */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-40">
        <motion.div 
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-10 -right-20 w-96 h-96 rounded-full overflow-hidden blur-2xl opacity-20"
        >
          <img src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800" alt="" className="w-full h-full object-cover" />
        </motion.div>
        
        <motion.div 
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-20 -left-20 w-[30rem] h-[30rem] rounded-full overflow-hidden blur-3xl opacity-30"
        >
          <img src="https://images.unsplash.com/photo-1516589174184-c685ca3d142d?auto=format&fit=crop&q=80&w=800" alt="" className="w-full h-full object-cover" />
        </motion.div>
      </div>

      <div className="section-shell relative z-10">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center"
        >
          <div className="text-left rtl:text-right">
            <motion.div variants={itemVariants}>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-primary mb-6">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                {t('hero.badge')}
              </span>
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="max-w-3xl text-4xl font-black leading-[1.1] tracking-tight text-textMain sm:text-6xl lg:text-7xl">
              {t('hero.title')} <br />
              <span className="text-primary italic">{t('hero.titleAccent')}</span>
            </motion.h1>
            
            <motion.p variants={itemVariants} className="mt-8 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">
              {t('hero.subtitle')}
            </motion.p>

            {/* Search Bar */}
            <motion.div variants={itemVariants} className="mt-12 max-w-4xl">
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
                  <motion.div
                    key={pill}
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-muted/50"
                  >
                    <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    {pill}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Hero Decorative Image Grid */}
          <motion.div 
            variants={itemVariants}
            className="hidden lg:grid grid-cols-2 gap-4 h-[500px]"
          >
            <div className="space-y-4 pt-12">
              <motion.div 
                whileHover={{ y: -10 }}
                className="h-64 w-full rounded-[40px] overflow-hidden border-4 border-white shadow-soft"
              >
                <img src="https://images.unsplash.com/photo-1527137341206-696bc2773950?auto=format&fit=crop&q=80&w=600" alt="" className="w-full h-full object-cover" />
              </motion.div>
              <motion.div 
                whileHover={{ y: -10 }}
                className="h-40 w-full rounded-[40px] overflow-hidden border-4 border-white shadow-soft bg-primary/10 flex items-center justify-center p-8"
              >
                <div className="text-center">
                  <p className="text-3xl font-black text-primary">500+</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary/60">{t('hero.sessions')}</p>
                </div>
              </motion.div>
            </div>
            <div className="space-y-4">
              <motion.div 
                whileHover={{ y: -10 }}
                className="h-48 w-full rounded-[40px] overflow-hidden border-4 border-white shadow-soft bg-primaryBg"
              />
              <motion.div 
                whileHover={{ y: -10 }}
                className="h-80 w-full rounded-[40px] overflow-hidden border-4 border-white shadow-soft"
              >
                <img src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=600" alt="" className="w-full h-full object-cover" />
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
