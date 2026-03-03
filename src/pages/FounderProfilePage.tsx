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

  const heroBadge = isAr ? 'مؤسس المنصة' : 'Platform Founder';
  const introTitle = isAr ? 'نبذة سريعة' : 'Quick Intro';
  const storyTitle = isAr ? 'القصة' : 'Story';
  const journeyTitle = isAr ? 'المسيرة المهنية' : 'Career Journey';
  const specialtiesTitle = isAr ? 'مجالات التركيز' : 'Focus Areas';
  const languagesTitle = isAr ? 'اللغات' : 'Languages';
  const experienceTitle = isAr ? 'الخبرة السريرية' : 'Clinical Experience';

  return (
    <div className="min-h-screen bg-[#f7f5f1] text-textMain">
      <Header brandHref="/home" navItems={profileNavItems} />

      <main className="section-shell py-10 sm:py-14">
        <section className="animate-fade-up border-y border-black/10 py-8 sm:py-12" aria-labelledby="founder-profile-title">
          <div className="grid gap-8 lg:grid-cols-[1.12fr_0.88fr] lg:items-end">
            <div className="animate-fade-up [animation-delay:80ms]">
              <span className="inline-flex rounded-full border border-black/15 bg-white/80 px-4 py-1 text-xs font-black uppercase tracking-[0.2em] text-primary/90">
                {heroBadge}
              </span>

              <h1 id="founder-profile-title" className="mt-5 text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
                <span className="block">{isAr ? founderProfile.name_ar : founderProfile.name_en}</span>
                <span className="mt-1 block text-primary/70">{isAr ? 'المؤسس' : 'Founder'}</span>
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-relaxed text-black/75 sm:text-lg">
                {isAr ? founderProfile.title_ar : founderProfile.title_en}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="hover-lift-soft rounded-xl border border-black/10 bg-white p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/60">1995</p>
                  <p className="mt-2 text-sm font-semibold text-black/80">{isAr ? 'بداية الممارسة السريرية' : 'Clinical practice started'}</p>
                </div>
                <div className="hover-lift-soft rounded-xl border border-black/10 bg-white p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/60">{founderProfile.credentials.yearsOfExperience}+ years</p>
                  <p className="mt-2 text-sm font-semibold text-black/80">{isAr ? 'خبرة تراكمية' : 'Total experience'}</p>
                </div>
                <div className="hover-lift-soft rounded-xl border border-black/10 bg-white p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/60">{isAr ? 'الموقع' : 'Location'}</p>
                  <p className="mt-2 text-sm font-semibold text-black/80">{founderProfile.location}</p>
                </div>
              </div>
            </div>

            <div className="animate-image-reveal [animation-delay:160ms] mx-auto w-full max-w-xl rounded-2xl border border-black/15 bg-white p-2 shadow-card">
              <img
                src={imageSrc}
                alt={isAr ? founderProfile.name_ar : founderProfile.name_en}
                className="h-auto w-full rounded-xl object-cover"
                onError={() => setImageSrc(founderImageFallback)}
              />
            </div>
          </div>
        </section>

        <section className="animate-fade-up [animation-delay:220ms] grid gap-6 border-b border-black/10 py-10 sm:grid-cols-2">
          <article className="hover-lift-soft">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-primary/80">{introTitle}</p>
            <p className="mt-4 text-base leading-relaxed text-black/75 sm:text-lg">
              {isAr ? founderProfile.shortBio_ar : founderProfile.shortBio_en}
            </p>
          </article>
          <article className="hover-lift-soft">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-primary/80">{storyTitle}</p>
            <p className="mt-4 text-base leading-relaxed text-black/75 sm:text-lg">
              {isAr ? founderProfile.about_ar : founderProfile.about_en}
            </p>
          </article>
        </section>

        <section className="animate-fade-up [animation-delay:320ms] border-b border-black/10 py-10" aria-labelledby="founder-journey-title">
          <h2 id="founder-journey-title" className="text-3xl font-black uppercase tracking-tight sm:text-4xl">
            {journeyTitle}
          </h2>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <article className="hover-lift-soft rounded-2xl border border-black/10 bg-white p-5">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-black/60">{isAr ? 'التعليم' : 'Education'}</h3>
              <ul className="mt-4 space-y-2">
                {founderProfile.credentials.education.map((item) => (
                  <li key={item} className="text-sm text-black/75">• {item}</li>
                ))}
              </ul>

              <h3 className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-black/60">{isAr ? 'الشهادات' : 'Certifications'}</h3>
              <ul className="mt-4 space-y-2">
                {founderProfile.credentials.certifications.map((item) => (
                  <li key={item} className="text-sm text-black/75">• {item}</li>
                ))}
              </ul>
            </article>

            <article className="hover-lift-soft rounded-2xl border border-black/10 bg-white p-5">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-black/60">{experienceTitle}</h3>
              <p className="mt-4 text-5xl font-black leading-none text-primary">{founderProfile.credentials.yearsOfExperience}+</p>
              <p className="mt-2 text-sm font-semibold text-black/70">{isAr ? 'سنة من الخبرة في الطب النفسي وعلاج الإدمان' : 'Years in psychiatry and addiction care'}</p>

              <h3 className="mt-8 text-xs font-black uppercase tracking-[0.2em] text-black/60">{isAr ? 'العضويات المهنية' : 'Memberships'}</h3>
              <ul className="mt-4 space-y-2">
                {founderProfile.credentials.memberships.map((item) => (
                  <li key={item} className="text-sm text-black/75">• {item}</li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        <section className="animate-fade-up [animation-delay:420ms] grid gap-6 py-10 sm:grid-cols-2">
          <article className="hover-lift-soft rounded-2xl border border-black/10 bg-white p-5">
            <h2 className="text-2xl font-black uppercase tracking-tight sm:text-3xl">{specialtiesTitle}</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {(isAr ? founderProfile.specialties_ar : founderProfile.specialties_en).map((specialty) => (
                <span key={specialty} className="rounded-full border border-black/15 bg-[#f7f5f1] px-3 py-1 text-sm font-semibold text-black/80">
                  {specialty}
                </span>
              ))}
            </div>

            <div className="mt-7 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm leading-relaxed text-black/75">{isAr ? founderProfile.approach_ar : founderProfile.approach_en}</p>
            </div>
          </article>

          <article className="hover-lift-soft rounded-2xl border border-black/10 bg-white p-5">
            <h2 className="text-2xl font-black uppercase tracking-tight sm:text-3xl">{languagesTitle}</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {founderProfile.languages.map((language) => (
                <span key={language} className="rounded-full border border-black/15 bg-[#f7f5f1] px-3 py-1 text-sm font-semibold text-black/80">
                  {language}
                </span>
              ))}
            </div>

            <div className="mt-7 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm leading-relaxed text-black/75">{isAr ? founderProfile.philosophy_ar : founderProfile.philosophy_en}</p>
            </div>
          </article>
        </section>
      </main>

      <Footer />
    </div>
  );
}
