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

  return (
    <section id="how-it-works" className="section-shell py-14 sm:py-16" aria-labelledby="how-title">
      <h2 id="how-title" className="section-title">
        {t('nav.howItWorks')}
      </h2>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {steps.map((step, index) => (
          <article key={step.title} className="rounded-card border border-borderGray bg-white p-5 shadow-card">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
              {index + 1}
            </span>
            <h3 className="mt-4 text-lg font-semibold text-textMain">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{step.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
