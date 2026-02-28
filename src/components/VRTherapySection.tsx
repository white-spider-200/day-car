import { useLanguage } from '../context/LanguageContext';
import { vrExamples } from '../data/vrExamples';

function VrIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="8" width="18" height="8" rx="3" />
      <path d="M8 12h.01M12 12h.01M16 12h.01" strokeLinecap="round" />
      <path d="M7 16.2V18m10-1.8V18" strokeLinecap="round" />
    </svg>
  );
}

export default function VRTherapySection() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  return (
    <section className="section-shell py-[100px]" aria-labelledby="vr-therapy-title" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-6xl">
        <span className="inline-flex rounded-full bg-primary/10 px-4 py-1.5 text-xs font-black tracking-widest text-primary">
          {isAr ? 'تقنيات علاجية متقدمة' : 'Advanced Therapeutic Technologies'}
        </span>

        <h2 id="vr-therapy-title" className="mt-4 text-3xl font-black tracking-tight text-textMain sm:text-4xl">
          {isAr ? 'العلاج بالواقع الافتراضي (VR)' : 'Virtual Reality (VR) Therapy'}
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted sm:text-lg">
          {isAr
            ? 'تقنيات حديثة لمساعدتك في مواجهة مخاوفك بطريقة آمنة وتدريجية'
            : 'Modern techniques to help you face fears in a safe, gradual way.'}
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {vrExamples.map((example) => (
            <article
              key={example.id}
              className={`relative overflow-hidden rounded-[20px] border border-cyan-100 bg-gradient-to-br ${example.palette} p-5 shadow-[0_10px_26px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_34px_rgba(15,23,42,0.14)]`}
            >
              <div className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-white/50 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-cyan-200/40 blur-2xl" />

              <div className="relative z-10">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-[11px] font-bold text-primary">
                  <VrIcon />
                  VR
                </span>
                <h3 className="mt-4 text-lg font-extrabold text-textMain">
                  {isAr ? example.titleAr : example.titleEn}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {isAr ? example.descriptionAr : example.descriptionEn}
                </p>

                <div className="mt-5">
                  <div className="relative h-44 w-full overflow-hidden rounded-xl border border-borderGray bg-black shadow-soft">
                    <iframe
                      className="absolute inset-0 h-full w-full"
                      src={example.videoUrl}
                      title={isAr ? example.titleAr : example.titleEn}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
