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
        <div className="mx-auto max-w-3xl text-center">
          <h2
            id="vr-therapy-title"
            className="inline-block rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 px-5 py-3 text-3xl font-black tracking-tight text-textMain sm:text-4xl"
          >
            {isAr ? 'العلاج بالواقع الافتراضي (VR)' : 'Virtual Reality (VR) Therapy'}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">
            {isAr
              ? 'تقنيات حديثة لمساعدتك في مواجهة مخاوفك بطريقة آمنة وتدريجية'
              : 'Modern techniques to help you face fears in a safe, gradual way.'}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="/vr-selection"
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 text-lg font-black text-white shadow-xl transition hover:-translate-y-1 hover:bg-primary/90"
            >
              {isAr ? 'ابدأ تجربتك العلاجية الآن' : 'Start Your VR Experience Now'}
            </a>
            <a
              href="/vr-demo"
              className="inline-flex items-center gap-2 rounded-2xl border border-primary/30 bg-white px-8 py-4 text-lg font-black text-primary transition hover:-translate-y-1 hover:bg-primaryBg"
            >
              {isAr ? 'مختبر تجارب VR' : 'Try VR Demo Lab'}
            </a>
          </div>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {vrExamples.map((example) => (
            <a
              key={example.id}
              href={`/vr-selection`}
              className={`group relative overflow-hidden rounded-[20px] border border-cyan-100 bg-gradient-to-br ${example.palette} p-5 shadow-[0_10px_26px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_22px_45px_rgba(15,23,42,0.18)]`}
            >
              <div className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-white/50 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-cyan-200/40 blur-2xl" />

              <div className="relative z-10">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-[11px] font-bold text-primary">
                  <VrIcon />
                  VR
                </span>
                <h3 className="mt-4 text-lg font-extrabold text-textMain group-hover:text-primary transition-colors">
                  {isAr ? example.titleAr : example.titleEn}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {isAr ? example.descriptionAr : example.descriptionEn}
                </p>

                <div className="mt-5">
                  <div className="relative h-44 w-full overflow-hidden rounded-xl border border-borderGray bg-black shadow-soft group-hover:border-primary/50 transition-colors">
                    <video
                      className="absolute inset-0 h-full w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                      src={example.videoSrc}
                      title={isAr ? example.titleAr : example.titleEn}
                      muted
                      preload="metadata"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-primary/10">
                       <div className="bg-white/90 p-3 rounded-full shadow-lg text-primary font-black text-xs uppercase tracking-widest">
                         {isAr ? 'ابدأ الآن' : 'Start Now'}
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
