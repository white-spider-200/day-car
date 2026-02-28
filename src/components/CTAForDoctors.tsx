import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

export default function CTAForDoctors() {
  const { t } = useLanguage();

  return (
    <section id="for-doctors" className="section-shell pb-16 pt-4 sm:pb-20">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-[40px] bg-slate-900 px-6 py-10 text-white shadow-2xl sm:px-10 sm:py-14"
      >
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&q=80&w=1200" 
            alt="Therapy session" 
            className="h-full w-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primaryDark/90 mix-blend-multiply" />
        </div>

        <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-black tracking-tight sm:text-5xl"
            >
              {t('doctor.forDoctorsTitle')}
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="mt-4 text-base font-medium text-primary-50 sm:text-lg opacity-90"
            >
              {t('doctor.forDoctorsSubtitle')}
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <a
              href="/apply-doctor"
              className="focus-outline inline-flex h-14 items-center justify-center rounded-2xl bg-white px-8 text-base font-bold text-primary transition-all hover:bg-primary-50 hover:scale-105 active:scale-95 shadow-lg"
            >
              {t('about.ctaApply')}
            </a>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
