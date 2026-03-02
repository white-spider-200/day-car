import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h2 className="text-3xl font-extrabold tracking-tight text-textMain sm:text-4xl">{title}</h2>
      {subtitle ? <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">{subtitle}</p> : null}
    </div>
  );
}

export default function AboutPage() {
  const { t } = useLanguage();
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const aboutNavItems = [
    { labelKey: 'nav.doctors', href: '/home#featured-doctors' },
    { labelKey: 'nav.howVerificationWorks', href: '#verification' },
    { labelKey: 'nav.forDoctors', href: '#for-doctors' },
    { labelKey: 'nav.about', href: '/about' }
  ];

  const trustPills = [
    t('hero.trustPills.verified'),
    t('hero.trustPills.privacy'),
    t('hero.trustPills.pricing')
  ];

  const missionPromises = [
    t('about.promise1'),
    t('about.promise2'),
    t('about.promise3')
  ];

  const howItWorksSteps = [
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
    },
    {
      title: t('about.howStep4Title'),
      description: t('about.howStep4Desc')
    }
  ];

  const trustSafetyItems = [
    {
      title: t('about.safetyItem1Title'),
      description: t('about.safetyItem1Desc'),
      icon: (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="m8 12 2.4 2.4L16 8.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 3.5 5 6.5V12c0 4.5 3 7.5 7 8.5 4-1 7-4 7-8.5V6.5l-7-3Z" />
        </svg>
      )
    },
    {
      title: t('about.safetyItem2Title'),
      description: t('about.safetyItem2Desc'),
      icon: (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M7 10V8a5 5 0 0 1 10 0v2" />
          <rect x="5" y="10" width="14" height="10" rx="2" />
        </svg>
      )
    },
    {
      title: t('about.safetyItem3Title'),
      description: t('about.safetyItem3Desc'),
      icon: (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 8.5v7M10 10.2c.5-.8 1.2-1.2 2-1.2a1.9 1.9 0 1 1 0 3.8 1.9 1.9 0 1 0 0 3.8c.8 0 1.5-.4 2-1.2" />
        </svg>
      )
    },
    {
      title: t('about.safetyItem4Title'),
      description: t('about.safetyItem4Desc'),
      icon: (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 3.8 14.4 8.7l5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 9.5l5.4-.8L12 3.8Z" strokeLinejoin="round" />
        </svg>
      )
    }
  ];

  const faqs = [
    { question: t('faq.q1'), answer: t('faq.a1') },
    { question: t('faq.q2'), answer: t('faq.a2') },
    { question: t('faq.q3'), answer: t('faq.a3') },
    { question: t('faq.q4'), answer: t('faq.a4') }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/40 via-white to-white text-textMain">
      <Header brandHref="/home" navItems={aboutNavItems} />

      <main>
        <section className="relative overflow-hidden bg-gradient-to-br from-white via-primaryBg/50 to-primaryBg/80 py-16 sm:py-24">
          <div className="section-shell">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-black leading-tight tracking-tight text-textMain sm:text-6xl">
                {t('about.heroTitle')} <br />
                <span className="text-primary">{t('about.heroTitleAccent')}</span>
              </h1>
              <p className="mt-6 text-base leading-relaxed text-muted sm:text-xl">
                {t('about.heroSubtitle')}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href="/home#featured-doctors"
                  className="focus-outline inline-flex h-14 items-center justify-center rounded-2xl bg-primary px-8 text-base font-bold text-white transition-all hover:bg-primaryDark hover:shadow-lg"
                >
                  {t('hero.findSupport')}
                </a>
                <a
                  href="#verification"
                  className="focus-outline inline-flex h-14 items-center justify-center rounded-2xl border border-primary/20 bg-white px-8 text-base font-bold text-primary transition-all hover:bg-primaryBg"
                >
                  {t('hero.howProtect')}
                </a>
              </div>

              <ul className="mt-8 flex flex-wrap gap-4" aria-label="Trust indicators">
                {trustPills.map((pill) => (
                  <li
                    key={pill}
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted/60"
                  >
                    <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    {pill}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="section-shell py-14 sm:py-16" aria-labelledby="mission-title">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <article className="rounded-hero border border-borderGray bg-white p-6 shadow-card sm:p-8">
              <SectionHeading
                title={t('about.commitmentTitle')}
                subtitle={t('about.commitmentSubtitle')}
              />
            </article>

            <article className="rounded-hero border border-borderGray bg-white p-6 shadow-card sm:p-8">
              <h3 className="text-xl font-bold text-textMain sm:text-2xl">{t('about.promisesTitle')}</h3>
              <ul className="mt-4 space-y-3">
                {missionPromises.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-muted sm:text-base">
                    <span className="mt-1 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-primaryBg text-primary">
                      <svg aria-hidden="true" viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m4.5 10 3 3L15.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        <section id="mission" className="section-shell py-14 sm:py-16" aria-labelledby="mission-subtitle-title">
          <div className="rounded-hero border border-primary-100 bg-gradient-to-br from-primary-50/50 to-white p-6 shadow-soft sm:p-8">
            <SectionHeading
              title={t('about.missionTitle')}
              subtitle={t('about.missionSubtitle')}
            />
          </div>
        </section>

        <section id="how-it-works" className="section-shell py-14 sm:py-16" aria-labelledby="how-title">
          <SectionHeading
            title={t('home.howTitle')}
            subtitle={t('home.howSubtitle')}
          />
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {howItWorksSteps.map((step, index) => (
              <article
                key={step.title}
                className="rounded-hero border border-borderGray bg-white p-6 shadow-card transition duration-200 hover:-translate-y-1 hover:border-primary-200 hover:shadow-soft"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-lg font-bold text-textMain">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="py-14 sm:py-16" aria-labelledby="impact-title">
          <div className="section-shell">
            <div className="rounded-hero border border-primary-100 bg-gradient-to-r from-primary-50 to-white p-6 shadow-soft sm:p-8">
              <SectionHeading title={t('about.impactTitle')} subtitle={t('about.impactSubtitle')} />
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: t('about.impactLabel1'), value: '128+' },
                  { label: t('about.impactLabel2'), value: '2,400+' },
                  { label: t('about.impactLabel3'), value: '4.9/5' },
                  { label: t('about.impactLabel4'), value: '24/7' }
                ].map((item) => (
                  <article key={item.label} className="rounded-card border border-borderGray bg-white p-5 text-center shadow-card transition-all hover:shadow-soft">
                    <p className="text-3xl font-black text-textMain sm:text-4xl">{item.value}</p>
                    <p className="mt-2 text-xs font-bold uppercase tracking-widest text-primary/60">{item.label}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="verification" className="section-shell py-14 sm:py-16" aria-labelledby="trust-title">
          <div className="rounded-hero border border-primary-100 bg-gradient-to-br from-white via-primary-50/50 to-primary-50/80 p-6 shadow-soft sm:p-8">
            <SectionHeading
              title={t('about.safetyTitle')}
              subtitle={t('about.safetySubtitle')}
            />
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {trustSafetyItems.map((item) => (
                <article
                  key={item.title}
                  className="rounded-card border border-borderGray bg-white p-5 shadow-card transition duration-200 hover:-translate-y-1 hover:border-primary-200 hover:shadow-soft"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primaryBg text-primary">{item.icon}</span>
                  <h3 className="mt-4 text-base font-bold text-textMain">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="for-doctors" className="section-shell py-14 sm:py-16" aria-labelledby="for-doctors-title">
          <div className="rounded-hero border border-borderGray bg-white p-6 shadow-card sm:p-8">
            <SectionHeading
              title={t('nav.forDoctors')}
              subtitle={t('doctor.forDoctorsSubtitle')}
            />
            <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
              {t('about.safetyItem1Desc')}
            </p>
            <a
              href="#"
              className="focus-outline mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primaryDark"
            >
              {t('about.ctaApply')}
            </a>
          </div>
        </section>

        <section className="section-shell py-14 sm:py-16" aria-labelledby="faq-title">
          <SectionHeading
            title={t('about.faqTitle')}
            subtitle={t('about.faqSubtitle')}
          />
          <div className="mt-8 space-y-3">
            {faqs.map((item, index) => {
              const isOpen = openFaqIndex === index;

              return (
                <article key={item.question} className="rounded-card border border-borderGray bg-white shadow-card">
                  <h3>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenFaqIndex(isOpen ? -1 : index)}
                      className="focus-outline flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    >
                      <span className="text-sm font-semibold text-textMain sm:text-base">{item.question}</span>
                      <span
                        className={`inline-flex h-6 w-6 flex-none items-center justify-center rounded-full border border-borderGray text-muted transition ${
                          isOpen ? 'rotate-45' : ''
                        }`}
                        aria-hidden="true"
                      >
                        +
                      </span>
                    </button>
                  </h3>
                  <div className={`grid transition-all duration-200 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                    <div className="overflow-hidden">
                      <p className="border-t border-borderGray px-5 pb-4 pt-3 text-sm leading-relaxed text-muted">{item.answer}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="section-shell pb-16 pt-6 sm:pb-20" aria-labelledby="final-cta-title">
          <div className="rounded-[26px] bg-gradient-to-r from-primary to-primaryDark px-6 py-8 text-white shadow-soft sm:px-10 sm:py-10">
            <h2 id="final-cta-title" className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              {t('about.ctaTitle')}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-primary-50 sm:text-base">
              {t('about.ctaSubtitle')}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="/home#featured-doctors"
                className="focus-outline inline-flex h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-primary transition hover:bg-primary-50"
              >
                {t('about.ctaFind')}
              </a>
              <a
                href="#for-doctors"
                className="focus-outline inline-flex h-11 items-center justify-center rounded-xl border border-white/40 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                {t('about.ctaApply')}
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
