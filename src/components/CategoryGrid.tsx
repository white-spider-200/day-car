import { motion } from 'framer-motion';
import type { Category } from '../data/homeData';
import { useLanguage } from '../context/LanguageContext';

type CategoryGridProps = {
  categories: Category[];
};

export default function CategoryGrid({ categories }: CategoryGridProps) {
  const { t } = useLanguage();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <section className="section-shell py-14 sm:py-16" aria-labelledby="categories-title">
      <div className="mb-8 flex items-end justify-between gap-4">
        <h2 id="categories-title" className="section-title">
          {t('search.specialty')}
        </h2>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {categories.map((category) => (
          <motion.article
            key={category.nameKey}
            variants={itemVariants}
            whileHover={{ y: -5, scale: 1.02 }}
            className="group cursor-pointer rounded-card border border-borderGray bg-white p-5 shadow-card transition-colors duration-200 hover:border-primary/40 hover:shadow-soft"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-textMain transition-colors group-hover:text-primary">{t(category.nameKey)}</h3>
              <span className="rounded-full bg-primaryBg px-3 py-1 text-xs font-semibold text-primary transition-colors group-hover:bg-primary group-hover:text-white">{category.chipKey}</span>
            </div>
          </motion.article>
        ))}
      </motion.div>
    </section>
  );
}
