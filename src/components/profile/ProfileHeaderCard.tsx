import { useLanguage } from '../../context/LanguageContext';
import type { ProfileDoctor } from '../../data/doctorProfileData';

type ProfileHeaderCardProps = {
  doctor: ProfileDoctor;
};

function initialsFromName(name: string) {
  return name
    .replace('Dr. ', '')
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export default function ProfileHeaderCard({ doctor }: ProfileHeaderCardProps) {
  const { t } = useLanguage();

  return (
    <section className="section-shell pt-6 sm:pt-8" aria-labelledby="doctor-name">
      <div className="grid gap-5 rounded-hero border border-borderGray bg-white p-5 shadow-soft sm:p-6 lg:grid-cols-[1fr_320px] lg:gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="relative flex h-24 w-24 flex-none items-center justify-center overflow-hidden rounded-[22px] bg-gradient-to-br from-primary/15 to-primary/35 text-2xl font-bold text-primary sm:h-28 sm:w-28">
            {/* floating soft cards behind avatar */}
            <div className="pointer-events-none absolute -left-6 -top-6 h-16 w-16 rounded-[22px] bg-primaryBg/80 blur-[0.5px] animate-float-soft" />
            <div className="pointer-events-none absolute -right-7 top-6 h-14 w-14 rounded-[22px] bg-primary/10 animate-float-soft-delayed" />

            {doctor.photo ? (
              <img src={doctor.photo} alt={doctor.name} className="h-full w-full object-cover" />
            ) : (
              initialsFromName(doctor.name)
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 id="doctor-name" className="text-2xl font-extrabold tracking-tight text-textMain sm:text-3xl">
                {doctor.name}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-primaryBg px-2.5 py-1 text-xs font-semibold text-primary">
                <svg aria-hidden="true" viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor">
                  <path d="M10 1.7 12 4l3-.4 1 2.8 2.5 1.8-1 2.8 1 2.8-2.5 1.8-1 2.8-3-.4-2 2.3-2-2.3-3 .4-1-2.8-2.5-1.8 1-2.8-1-2.8L4 6.4l1-2.8 3 .4 2-2.3Zm-1 10.6 5-5-1.1-1.1L9 10.1 7.1 8.2 6 9.3l3 3Z" />
                </svg>
                {t('doctor.verified')}
              </span>
            </div>

            <p className="mt-1 text-base font-medium text-muted">{doctor.title}</p>

            <div className="mt-4 inline-flex items-center gap-3 rounded-[20px] bg-primaryBg px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-primary animate-fade-slide-up-soft">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-base font-extrabold text-primary shadow-card">
                500+
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-primary/80">{t('hero.sessions')}</span>
                <span className="text-[10px] text-primary/60">MindCare</span>
              </div>
            </div>

            <ul className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted" aria-label="Doctor details">
              <li>{doctor.location}</li>
              <li className="text-slate-300">•</li>
              <li>{doctor.languages.join(', ')}</li>
              <li className="text-slate-300">•</li>
              <li>⭐ {doctor.rating.toFixed(1)} ({doctor.reviewsCount})</li>
            </ul>

            <p className="mt-3 text-sm text-primary font-bold">{t('doctor.responds')}</p>
          </div>
        </div>

        <aside className="rounded-[22px] border-2 border-primary/10 bg-white p-5 shadow-soft animate-fade-slide-up-soft">
          <p className="text-sm font-bold text-muted uppercase tracking-wider">{t('doctor.price')}</p>
          <p className="mt-1 text-xl font-black text-textMain">{doctor.pricePerSession}</p>

          <dl className="mt-4 space-y-3 border-t border-borderGray pt-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted font-medium">{t('doctor.session')}</dt>
              <dd className="font-bold text-textMain">{doctor.sessionLength}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted font-medium">{t('doctor.available')}</dt>
              <dd className="font-bold text-primary">{doctor.nextAvailable}</dd>
            </div>
          </dl>

          <div className="mt-5 flex flex-col gap-2.5">
            <button
              type="button"
              className="focus-outline inline-flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-white transition hover:bg-primaryDark shadow-lg shadow-primary/20"
            >
              {t('doctor.book')}
            </button>
            <button
              type="button"
              className="focus-outline inline-flex h-11 items-center justify-center rounded-xl border-2 border-borderGray px-4 text-sm font-bold text-textMain transition hover:border-primary/30 hover:text-primary"
            >
              {t('doctor.message')}
            </button>
          </div>

          <p className="mt-3 text-[10px] text-center font-bold text-muted uppercase tracking-tight">{t('doctor.secure')}</p>
        </aside>
      </div>
    </section>
  );
}
