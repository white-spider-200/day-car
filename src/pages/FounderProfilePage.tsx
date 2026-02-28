import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';
import { founderImageFallback, founderProfile } from '../data/founderProfile';

export default function FounderProfilePage() {
  const { lang } = useLanguage();
  const [imageSrc, setImageSrc] = useState(founderProfile.image);
  const isAr = lang === 'ar';

  const profileNavItems = [
    { labelKey: 'nav.doctors', href: '/home#featured-doctors' },
    { labelKey: 'nav.howItWorks', href: '/home#how-it-works' },
    { labelKey: 'nav.about', href: '/about' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/40 via-white to-white text-textMain">
      <Header brandHref="/home" navItems={profileNavItems} />

      <main className="section-shell py-10 sm:py-14">
        <section className="rounded-hero border border-borderGray bg-white p-6 shadow-card sm:p-8" aria-labelledby="founder-profile-title">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {isAr ? 'الملف التعريفي للمؤسس' : 'Founder Profile'}
              </span>
              <h1 id="founder-profile-title" className="mt-4 text-4xl font-black tracking-tight text-textMain sm:text-5xl">
                {isAr ? founderProfile.name_ar : founderProfile.name_en}
              </h1>
              <p className="mt-3 text-lg font-semibold text-primary/90">
                {isAr ? founderProfile.title_ar : founderProfile.title_en}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {isAr ? 'موثق' : 'Verified'}
                </span>
                <span className="text-muted">📍 {founderProfile.location}</span>
              </div>
              <p className="mt-6 text-base leading-relaxed text-muted">
                {isAr ? founderProfile.shortBio_ar : founderProfile.shortBio_en}
              </p>
            </div>

            <div className="mx-auto w-full max-w-sm">
              <div className="overflow-hidden rounded-[20px] border border-borderGray bg-primaryBg/20 shadow-soft">
                <img
                  src={imageSrc}
                  alt={isAr ? founderProfile.name_ar : founderProfile.name_en}
                  className="h-full w-full object-cover"
                  onError={() => setImageSrc(founderImageFallback)}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-hero border border-borderGray bg-white p-6 shadow-card sm:p-8" aria-labelledby="founder-about-title">
          <h2 id="founder-about-title" className="text-2xl font-black text-textMain sm:text-3xl">
            {isAr ? 'نبذة' : 'About'}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
            {isAr ? founderProfile.about_ar : founderProfile.about_en}
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <article className="rounded-card border border-borderGray bg-primaryBg/25 p-4">
              <h3 className="text-base font-bold text-textMain">{isAr ? 'النهج المهني' : 'Professional Approach'}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {isAr ? founderProfile.approach_ar : founderProfile.approach_en}
              </p>
            </article>
            <article className="rounded-card border border-borderGray bg-primaryBg/25 p-4">
              <h3 className="text-base font-bold text-textMain">{isAr ? 'الفلسفة العلاجية' : 'Therapy Philosophy'}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {isAr ? founderProfile.philosophy_ar : founderProfile.philosophy_en}
              </p>
            </article>
          </div>
        </section>

        <section className="mt-8 rounded-hero border border-borderGray bg-white p-6 shadow-card sm:p-8" aria-labelledby="founder-credentials-title">
          <h2 id="founder-credentials-title" className="text-2xl font-black text-textMain sm:text-3xl">
            {isAr ? 'المؤهلات' : 'Credentials'}
          </h2>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <article>
              <h3 className="text-sm font-black uppercase tracking-wider text-primary/70">{isAr ? 'التعليم' : 'Education'}</h3>
              <ul className="mt-3 space-y-2">
                {founderProfile.credentials.education.map((item) => (
                  <li key={item} className="text-sm text-muted">• {item}</li>
                ))}
              </ul>
            </article>
            <article>
              <h3 className="text-sm font-black uppercase tracking-wider text-primary/70">{isAr ? 'الشهادات' : 'Certifications'}</h3>
              <ul className="mt-3 space-y-2">
                {founderProfile.credentials.certifications.map((item) => (
                  <li key={item} className="text-sm text-muted">• {item}</li>
                ))}
              </ul>
            </article>
            <article>
              <h3 className="text-sm font-black uppercase tracking-wider text-primary/70">{isAr ? 'سنوات الخبرة' : 'Years of Experience'}</h3>
              <p className="mt-3 text-lg font-bold text-textMain">{founderProfile.credentials.yearsOfExperience}+</p>
            </article>
            <article>
              <h3 className="text-sm font-black uppercase tracking-wider text-primary/70">{isAr ? 'العضويات المهنية' : 'Professional Memberships'}</h3>
              <ul className="mt-3 space-y-2">
                {founderProfile.credentials.memberships.map((item) => (
                  <li key={item} className="text-sm text-muted">• {item}</li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-2">
          <article className="rounded-hero border border-borderGray bg-white p-6 shadow-card sm:p-8" aria-labelledby="founder-specialties-title">
            <h2 id="founder-specialties-title" className="text-2xl font-black text-textMain sm:text-3xl">
              {isAr ? 'التخصصات' : 'Specialties'}
            </h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {(isAr ? founderProfile.specialties_ar : founderProfile.specialties_en).map((specialty) => (
                <span
                  key={specialty}
                  className="inline-flex items-center rounded-lg border border-primary/20 bg-primaryBg px-3 py-1.5 text-sm font-semibold text-primary"
                >
                  {specialty}
                </span>
              ))}
            </div>
          </article>

          <article className="rounded-hero border border-borderGray bg-white p-6 shadow-card sm:p-8" aria-labelledby="founder-languages-title">
            <h2 id="founder-languages-title" className="text-2xl font-black text-textMain sm:text-3xl">
              {isAr ? 'اللغات' : 'Languages'}
            </h2>
            <ul className="mt-5 space-y-3">
              {founderProfile.languages.map((language) => (
                <li key={language} className="text-sm font-semibold text-muted">
                  • {language}
                </li>
              ))}
            </ul>
          </article>
        </section>
      </main>

      <Footer />
    </div>
  );
}
