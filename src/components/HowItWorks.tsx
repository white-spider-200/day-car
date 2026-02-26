import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

export default function HowItWorks() {
  const { t } = useLanguage();

  const steps = [
    {
      title: t('about.howStep1Title'),
      description: t('about.howStep1Desc')
    },
    {
      title: t('about.howStep2Title'),
      description: t('about.howStep2Desc')
    },
    {
      title: t('about.howStep3Title'),
      description: t('about.howStep3Desc')
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <section id="how-it-works" className="section-shell py-14 sm:py-16" aria-labelledby="how-title">
      <motion.h2 
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        id="how-title" 
        className="section-title"
      >
        {t('nav.howItWorks')}
      </motion.h2>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="mt-8 grid gap-4 md:grid-cols-3"
      >
        {steps.map((step, index) => (
          <motion.article 
            key={step.title} 
            variants={itemVariants}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
            className="rounded-card border border-borderGray bg-white p-5 shadow-card group"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300 text-base font-black">
              {index + 1}
            </span>
            <h3 className="mt-4 text-lg font-bold text-textMain">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{step.description}</p>
          </motion.article>
        ))}
      </motion.div>
    </section>
  );
}
