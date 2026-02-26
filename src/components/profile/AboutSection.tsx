import { useLanguage } from '../../context/LanguageContext';
import type { ProfileDoctor } from '../../data/doctorProfileData';

type AboutSectionProps = {
  doctor: ProfileDoctor;
};

export default function AboutSection({ doctor }: AboutSectionProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Bio Card */}
      <section className="rounded-card border border-borderGray bg-white p-6 shadow-card sm:p-8" aria-labelledby="about-heading">
        <h2 id="about-heading" className="text-xl font-extrabold text-textMain sm:text-2xl">
          {t('profile.about')} {doctor.name}
        </h2>
        <p className="mt-5 text-sm leading-8 text-muted sm:text-lg">{doctor.bio}</p>
        
        {/* Quick Stats Grid */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl bg-primaryBg/50 p-4 text-center border border-primary/10">
            <p className="text-lg font-black text-primary">8+</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">{t('profile.experience')}</p>
          </div>
          <div className="rounded-2xl bg-primaryBg/50 p-4 text-center border border-primary/10">
            <p className="text-lg font-black text-primary">500+</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Patients</p>
          </div>
          <div className="rounded-2xl bg-primaryBg/50 p-4 text-center border border-primary/10">
            <p className="text-lg font-black text-primary">4.9</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Avg Rating</p>
          </div>
          <div className="rounded-2xl bg-primaryBg/50 p-4 text-center border border-primary/10">
            <p className="text-lg font-black text-primary">100%</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Private</p>
          </div>
        </div>
      </section>

      {/* Video Section */}
      {doctor.videoThumbnail && (
        <section className="group relative aspect-video overflow-hidden rounded-hero border border-borderGray bg-slate-900 shadow-card transition-all hover:shadow-soft">
          <img
            src={doctor.videoThumbnail}
            alt="Video introduction"
            className="h-full w-full object-cover opacity-70 transition-transform duration-1000 group-hover:scale-110"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/40">
            <button
              type="button"
              className="flex h-20 w-20 items-center justify-center rounded-full bg-white/95 text-primary shadow-2xl transition-all group-hover:scale-110 group-hover:bg-primary group-hover:text-white"
              aria-label="Play video introduction"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="ml-1 h-10 w-10">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </div>
          <div className="absolute bottom-6 left-6 rtl:left-auto rtl:right-6 flex items-center gap-3 rounded-2xl bg-black/60 px-4 py-2 text-sm font-bold text-white backdrop-blur-xl border border-white/10">
            <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            {t('profile.watchIntro')} (1:24)
          </div>
        </section>
      )}

      {/* Methodology / Approach Grid */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-card border border-borderGray bg-white p-6 shadow-card transition-all hover:border-primary/30">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primaryBg text-primary mb-5">
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
             </svg>
          </div>
          <h3 className="text-lg font-extrabold text-textMain">{t('profile.methodology')}</h3>
          <p className="mt-3 text-sm leading-7 text-muted">{doctor.approach}</p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex-1 rounded-card border border-borderGray bg-white p-6 shadow-card transition-all hover:border-primary/30">
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4">{t('profile.experience')}</h3>
            <p className="text-sm leading-7 text-textMain">{doctor.experience}</p>
          </div>
          <div className="flex-1 rounded-card border border-borderGray bg-white p-6 shadow-card transition-all hover:border-primary/30">
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4">{t('profile.education')}</h3>
            <p className="text-sm leading-7 text-textMain">{doctor.education}</p>
          </div>
        </div>
      </section>

      {/* Trust & Insurance Card */}
      <section className="rounded-card bg-gradient-to-r from-primary to-primaryDark p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-bold">{t('profile.insurance')}</h3>
            <p className="mt-2 text-primary-50/80">{t('profile.insuranceDesc')}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {['MedNet', 'NatHealth', 'GIG', 'MetLife'].map(brand => (
              <span key={brand} className="rounded-xl bg-white/10 px-4 py-2 text-sm font-extrabold backdrop-blur-sm border border-white/10">
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Specializations Section */}
      <section className="rounded-card border border-borderGray bg-white p-6 shadow-card">
        <h3 className="text-lg font-bold text-textMain">{t('profile.specializations')}</h3>
        <ul className="mt-5 flex flex-wrap gap-3" aria-label="Specializations">
          {doctor.treats.map((item) => (
            <li key={item} className="flex items-center gap-2 rounded-2xl border border-borderGray bg-slate-50 px-5 py-2.5 text-sm font-bold text-muted transition-all hover:border-primary/50 hover:text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {item}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
