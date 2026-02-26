import type { Doctor } from '../data/homeData';
import { useLanguage } from '../context/LanguageContext';

type DoctorCardProps = {
  doctor: Doctor;
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

export default function DoctorCard({ doctor }: DoctorCardProps) {
  const { lang, t } = useLanguage();
  const isAr = lang === 'ar';

  const name = isAr ? doctor.nameAr : doctor.name;
  const title = isAr ? doctor.titleAr : doctor.title;
  const location = isAr ? doctor.locationAr : doctor.location;
  const price = isAr ? doctor.priceAr : doctor.price;
  const tags = isAr ? doctor.tagsAr : doctor.tags;

  return (
    <article className="rounded-card border border-borderGray bg-white p-5 shadow-card transition duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-soft">
      <div className="flex items-start gap-4">
        <div className="relative flex h-14 w-14 flex-none items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 to-primary/30 text-lg font-bold text-primary">
          {doctor.photo ? (
            <img src={doctor.photo} alt={name} className="h-full w-full object-cover" />
          ) : (
            initialsFromName(name)
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-textMain">{name}</h3>
            {doctor.isVerified && (
              <span className="rounded-full bg-primaryBg px-2 py-0.5 text-xs font-semibold text-primary">{t('doctor.verified')}</span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted">
            {title} • {location}
          </p>
        </div>
      </div>

      <ul className="mt-4 flex flex-wrap gap-2" aria-label={`${name} specialties`}>
        {tags.map((tag) => (
          <li key={tag} className="rounded-full border border-borderGray px-3 py-1 text-xs font-medium text-muted">
            {tag}
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-col gap-3 border-t border-borderGray pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-textMain">{price}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted">
            <svg aria-hidden="true" viewBox="0 0 20 20" className="h-3.5 w-3.5 text-primary" fill="currentColor">
              <path d="M10 1.5 12.5 7l6 0.7-4.4 4 1.2 5.8-5.3-3-5.3 3 1.2-5.8-4.4-4 6-0.7L10 1.5z" />
            </svg>
            {doctor.rating.toFixed(1)} ({doctor.reviewsCount} {isAr ? 'تقييم' : 'reviews'})
          </p>
        </div>

        <a
          href="/profile"
          onClick={(e) => {
            e.preventDefault();
            window.history.pushState({}, '', '/profile');
            window.dispatchEvent(new PopStateEvent('popstate'));
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="focus-outline inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primaryDark"
        >
          {t('doctor.viewProfile')}
        </a>
      </div>
    </article>
  );
}
