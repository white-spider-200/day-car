import { type FormEvent, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import './DoctorSearchArabic.css';

export type DoctorSearchFilters = {
  consultationType: 'all' | 'online' | 'in_person';
  mainSearch: string;
  specialty: string;
  concern: string;
  approach: string;
  language: string;
  sessionType: string;
  location: string;
  gender: string;
  insurance: string;
  availabilityDays: string;
  minPrice: string;
  maxPrice: string;
};

type DoctorSearchArabicProps = {
  onSearch?: (filters: DoctorSearchFilters) => void;
  className?: string;
  doctorNameSuggestions?: string[];
};

const INITIAL_FILTERS: DoctorSearchFilters = {
  consultationType: 'all',
  mainSearch: '',
  specialty: '',
  concern: '',
  approach: '',
  language: '',
  sessionType: '',
  location: '',
  gender: '',
  insurance: '',
  availabilityDays: '',
  minPrice: '',
  maxPrice: ''
};

export default function DoctorSearchArabic({
  onSearch,
  className = '',
  doctorNameSuggestions = []
}: DoctorSearchArabicProps) {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const [filters, setFilters] = useState<DoctorSearchFilters>(INITIAL_FILTERS);

  const locationOptions = isAr
    ? [
        { label: 'كل المناطق', value: '' },
        { label: 'عمّان', value: 'Amman' },
        { label: 'إربد', value: 'Irbid' },
        { label: 'الزرقاء', value: 'Zarqa' },
        { label: 'العقبة', value: 'Aqaba' },
        { label: 'أونلاين', value: 'online' }
      ]
    : [
        { label: 'All Regions', value: '' },
        { label: 'Amman', value: 'Amman' },
        { label: 'Irbid', value: 'Irbid' },
        { label: 'Zarqa', value: 'Zarqa' },
        { label: 'Aqaba', value: 'Aqaba' },
        { label: 'Online', value: 'online' }
      ];

  const therapyTypeOptions = isAr
    ? [
        { label: 'نوع العلاج', value: '' },
        { label: 'جلسة أونلاين', value: 'VIDEO' },
        { label: 'جلسة حضورية', value: 'IN_PERSON' },
        { label: 'جلسة صوتية', value: 'AUDIO' },
        { label: 'جلسة دردشة', value: 'CHAT' }
      ]
    : [
        { label: 'Therapy Type', value: '' },
        { label: 'Online Session', value: 'VIDEO' },
        { label: 'In-Person Session', value: 'IN_PERSON' },
        { label: 'Audio Session', value: 'AUDIO' },
        { label: 'Chat Session', value: 'CHAT' }
      ];

  const languageOptions = isAr
    ? [
        { label: 'اللغة', value: '' },
        { label: 'العربية', value: 'Arabic' },
        { label: 'English', value: 'English' }
      ]
    : [
        { label: 'Language', value: '' },
        { label: 'Arabic', value: 'Arabic' },
        { label: 'English', value: 'English' }
      ];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch?.(filters);
  };

  void doctorNameSuggestions;

  return (
    <section dir={isAr ? 'rtl' : 'ltr'} className={`doctor-search-clean ${className}`.trim()}>
      <div className="doctor-search-clean__shape" aria-hidden="true" />
      <div className="doctor-search-clean__container">
        <h2 className="doctor-search-clean__title">{isAr ? 'ماذا تبحث عنه؟' : 'What are you looking for?'}</h2>

        <form className="doctor-search-clean__bar" onSubmit={handleSubmit}>
          <div className="doctor-search-clean__input-wrap">
            <input
              type="text"
              value={filters.mainSearch}
              onClick={(event) => event.currentTarget.select()}
              onChange={(event) => {
                const nextFilters = { ...filters, mainSearch: event.target.value };
                setFilters(nextFilters);
                onSearch?.(nextFilters);
              }}
              className="doctor-search-clean__input"
              placeholder={isAr ? 'ابحث عن معالج أو تخصص...' : 'Search by therapist or specialty...'}
              autoComplete="off"
            />
          </div>

          <select
            value={filters.location}
            onChange={(event) => setFilters((current) => ({ ...current, location: event.target.value }))}
            className="doctor-search-clean__select"
            aria-label={isAr ? 'المنطقة' : 'Region'}
          >
            {locationOptions.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={filters.sessionType}
            onChange={(event) => setFilters((current) => ({ ...current, sessionType: event.target.value }))}
            className="doctor-search-clean__select"
            aria-label={isAr ? 'نوع العلاج' : 'Therapy Type'}
          >
            {therapyTypeOptions.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={filters.language}
            onChange={(event) => setFilters((current) => ({ ...current, language: event.target.value }))}
            className="doctor-search-clean__select"
            aria-label={isAr ? 'اللغة' : 'Language'}
          >
            {languageOptions.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button className="doctor-search-clean__button" type="submit" aria-label={isAr ? 'بحث' : 'Search'}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path strokeLinecap="round" d="m20 20-4.2-4.2" />
            </svg>
          </button>
        </form>
      </div>
    </section>
  );
}
