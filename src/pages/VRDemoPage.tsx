import { useMemo, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import VR360Player from '../components/VR360Player';
import { useLanguage } from '../context/LanguageContext';
import { vrExamples } from '../data/vrExamples';

type PlayerMode = 'interactive' | 'standard';

const pageNavItems = [
  { labelKey: 'nav.doctors', href: '/home#featured-doctors' },
  { labelKey: 'nav.howItWorks', href: '/home#how-it-works' },
  { labelKey: 'nav.forDoctors', href: '/apply-doctor' },
  { labelKey: 'nav.about', href: '/about' }
];

export default function VRDemoPage() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const [activeId, setActiveId] = useState(vrExamples[0]?.id ?? '');
  const [playerMode, setPlayerMode] = useState<PlayerMode>('interactive');

  const activeExample = useMemo(
    () => vrExamples.find((example) => example.id === activeId) ?? vrExamples[0],
    [activeId]
  );

  if (!activeExample) {
    return null;
  }

  const title = isAr ? activeExample.titleAr : activeExample.titleEn;
  const description = isAr ? activeExample.descriptionAr : activeExample.descriptionEn;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_10%,rgba(48,213,200,0.18),transparent_42%),radial-gradient(circle_at_90%_0%,rgba(56,189,248,0.2),transparent_34%),linear-gradient(180deg,#f8fcff_0%,#ecfdfb_100%)]">
      <Header brandHref="/home" navItems={pageNavItems} />

      <main className="section-shell py-8 sm:py-10" dir={isAr ? 'rtl' : 'ltr'}>
        <section className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-[0_20px_45px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-cyan-700">
                {isAr ? 'وضع التجربة' : 'Testing Mode'}
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-textMain sm:text-4xl">
                {isAr ? 'مختبر تجارب العلاج بالواقع الافتراضي' : 'VR Therapy Demo Lab'}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
                {isAr
                  ? 'هذه الصفحة مخصصة لتجربة السيناريوهات بشكل أوضح. اختر المثال المناسب وشغّل الفيديو بحجم كبير لفحص الجودة والتفاصيل.'
                  : 'This page is dedicated to testing VR scenarios clearly. Pick a scenario and play it in a larger viewer for better quality checks.'}
              </p>
            </div>

            <div className="rounded-2xl border border-borderGray bg-slate-50 p-3">
              <p className="text-xs font-bold text-muted">{isAr ? 'نوع المشغل' : 'Player mode'}</p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setPlayerMode('interactive')}
                  className={`rounded-xl px-3 py-2 text-sm font-bold transition ${
                    playerMode === 'interactive'
                      ? 'bg-primary text-white shadow'
                      : 'border border-borderGray bg-white text-muted hover:border-primary/40'
                  }`}
                >
                  {isAr ? 'تفاعلي 360' : 'Interactive 360'}
                </button>
                <button
                  type="button"
                  onClick={() => setPlayerMode('standard')}
                  className={`rounded-xl px-3 py-2 text-sm font-bold transition ${
                    playerMode === 'standard'
                      ? 'bg-primary text-white shadow'
                      : 'border border-borderGray bg-white text-muted hover:border-primary/40'
                  }`}
                >
                  {isAr ? 'فيديو عادي' : 'Standard Video'}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[300px,1fr]">
          <aside className="rounded-2xl border border-borderGray/80 bg-white/90 p-4 shadow-soft">
            <h2 className="text-sm font-black uppercase tracking-wide text-muted">
              {isAr ? 'سيناريوهات' : 'Scenarios'}
            </h2>
            <div className="mt-3 space-y-2">
              {vrExamples.map((example) => {
                const selected = example.id === activeExample.id;
                return (
                  <button
                    key={example.id}
                    type="button"
                    onClick={() => setActiveId(example.id)}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                      selected
                        ? 'border-primary/30 bg-primaryBg shadow-soft'
                        : 'border-borderGray bg-white hover:border-primary/30'
                    }`}
                  >
                    <p className="text-sm font-extrabold text-textMain">{isAr ? example.titleAr : example.titleEn}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
                      {isAr ? example.descriptionAr : example.descriptionEn}
                    </p>
                  </button>
                );
              })}
            </div>
          </aside>

          <article className="rounded-2xl border border-borderGray/80 bg-white p-4 shadow-soft sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-cyan-700">VR Scenario</p>
                <h2 className="text-2xl font-black text-textMain">{title}</h2>
                <p className="mt-1 max-w-3xl text-sm text-muted">{description}</p>
              </div>
              <a
                href="/home#vr-therapy-title"
                className="inline-flex items-center justify-center rounded-xl border border-borderGray px-3 py-2 text-sm font-bold text-textMain transition hover:border-primary/40 hover:text-primary"
              >
                {isAr ? 'الرجوع للقسم الرئيسي' : 'Back to home section'}
              </a>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-black">
              {playerMode === 'interactive' ? (
                <VR360Player src={activeExample.videoSrc} title={title} />
              ) : (
                <video
                  key={activeExample.videoSrc}
                  className="aspect-video w-full object-cover"
                  src={activeExample.videoSrc}
                  controls
                  muted
                  preload="metadata"
                  playsInline
                  title={title}
                />
              )}
            </div>

          </article>
        </section>
      </main>

      <Footer />
    </div>
  );
}
