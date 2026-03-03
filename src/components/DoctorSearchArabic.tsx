import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import './DoctorSearchArabic.css';

export type DoctorSearchFilters = {
  mainSearch: string;
  specialistType: '' | 'PSYCHIATRIST' | 'THERAPIST';
  specialization: string;
  country: string;
  language: string;
  minPrice: string;
  maxPrice: string;
  rating: '' | '4' | '5';
  availabilityDays: '' | '1' | '3' | '7';
};

type DoctorSearchArabicProps = {
  onSearch?: (filters: DoctorSearchFilters) => void;
  className?: string;
  doctorNameSuggestions?: string[];
  resetSignal?: number;
  resultCount?: number;
};

const PRICE_MIN = 20;
const PRICE_MAX = 250;

export const INITIAL_FILTERS: DoctorSearchFilters = {
  mainSearch: '',
  specialistType: '',
  specialization: '',
  country: '',
  language: '',
  minPrice: String(PRICE_MIN),
  maxPrice: String(PRICE_MAX),
  rating: '',
  availabilityDays: ''
};

export default function DoctorSearchArabic({
  onSearch,
  className = '',
  doctorNameSuggestions = [],
  resetSignal = 0,
  resultCount = 0
}: DoctorSearchArabicProps) {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const [filters, setFilters] = useState<DoctorSearchFilters>(INITIAL_FILTERS);
  const [leftHandleValue, setLeftHandleValue] = useState(PRICE_MIN);
  const [rightHandleValue, setRightHandleValue] = useState(PRICE_MAX);

  useEffect(() => {
    setFilters(INITIAL_FILTERS);
    setLeftHandleValue(PRICE_MIN);
    setRightHandleValue(PRICE_MAX);
  }, [resetSignal]);

  const specialistTypeOptions = isAr
    ? [
        { label: 'كل المتخصصين', value: '' },
        { label: 'طبيب نفسي', value: 'PSYCHIATRIST' },
        { label: 'معالج نفسي', value: 'THERAPIST' }
      ]
    : [
        { label: 'All Specialists', value: '' },
        { label: 'Psychiatrist', value: 'PSYCHIATRIST' },
        { label: 'Therapist', value: 'THERAPIST' }
      ];

  const specializationOptions = isAr
    ? [
        { label: 'كل التخصصات', value: '' },
        { label: 'القلق', value: 'Anxiety' },
        { label: 'الاكتئاب', value: 'Depression' },
        { label: 'الصدمة النفسية', value: 'Trauma' },
        { label: 'الإدمان', value: 'Addiction' },
        { label: 'اضطرابات النوم', value: 'Sleep Disorders' },
        { label: 'الرهاب', value: 'Phobias' },
        { label: 'الطب النفسي العام', value: 'General Psychiatry' },
        { label: 'الإرشاد الأسري والزواجي', value: 'Family & Marriage Counseling' },
        { label: 'اضطرابات الأطفال والمراهقين', value: 'Child & Adolescent Disorders' },
        { label: 'العلاج المعرفي السلوكي (CBT)', value: 'Cognitive Behavioral Therapy (CBT)' }
      ]
    : [
        { label: 'All Specializations', value: '' },
        { label: 'Anxiety', value: 'Anxiety' },
        { label: 'Depression', value: 'Depression' },
        { label: 'Trauma', value: 'Trauma' },
        { label: 'Addiction', value: 'Addiction' },
        { label: 'Sleep Disorders', value: 'Sleep Disorders' },
        { label: 'Phobias', value: 'Phobias' },
        { label: 'General Psychiatry', value: 'General Psychiatry' },
        { label: 'Family & Marriage Counseling', value: 'Family & Marriage Counseling' },
        { label: 'Child & Adolescent Disorders', value: 'Child & Adolescent Disorders' },
        { label: 'Cognitive Behavioral Therapy (CBT)', value: 'Cognitive Behavioral Therapy (CBT)' }
      ];

  const countryOptions = isAr
    ? [
        { label: 'كل الدول', value: '' },
        { label: 'الأردن', value: 'Jordan' },
        { label: 'السعودية', value: 'Saudi Arabia' },
        { label: 'الإمارات', value: 'UAE' },
        { label: 'مصر', value: 'Egypt' }
      ]
    : [
        { label: 'All Countries', value: '' },
        { label: 'Jordan', value: 'Jordan' },
        { label: 'Saudi Arabia', value: 'Saudi Arabia' },
        { label: 'UAE', value: 'UAE' },
        { label: 'Egypt', value: 'Egypt' }
      ];

  const languageOptions = isAr
    ? [
        { label: 'كل اللغات', value: '' },
        { label: 'العربية', value: 'Arabic' },
        { label: 'English', value: 'English' }
      ]
    : [
        { label: 'All Languages', value: '' },
        { label: 'Arabic', value: 'Arabic' },
        { label: 'English', value: 'English' }
      ];

  const ratingOptions = isAr
    ? [
        { label: 'كل التقييمات', value: '' },
        { label: '4+ نجوم', value: '4' },
        { label: '5 نجوم', value: '5' }
      ]
    : [
        { label: 'All Ratings', value: '' },
        { label: '4+ Stars', value: '4' },
        { label: '5 Stars', value: '5' }
      ];

  const availabilityOptions = isAr
    ? [
        { label: 'أي موعد', value: '' },
        { label: 'خلال 24 ساعة', value: '1' },
        { label: 'خلال 3 أيام', value: '3' },
        { label: 'خلال 7 أيام', value: '7' }
      ]
    : [
        { label: 'Any Availability', value: '' },
        { label: 'Within 24 Hours', value: '1' },
        { label: 'Within 3 Days', value: '3' },
        { label: 'Within 7 Days', value: '7' }
      ];

  const applyFilters = (next: DoctorSearchFilters) => {
    setFilters(next);
    onSearch?.(next);
  };

  const applySortedPriceFilters = (firstValue: number, secondValue: number) => {
    const displayMin = Math.min(firstValue, secondValue);
    const displayMax = Math.max(firstValue, secondValue);
    applyFilters({ ...filters, minPrice: String(displayMin), maxPrice: String(displayMax) });
  };

  const handleLeftHandleChange = (raw: string) => {
    const nextValue = Number(raw);
    setLeftHandleValue(nextValue);
    applySortedPriceFilters(nextValue, rightHandleValue);
  };

  const handleRightHandleChange = (raw: string) => {
    const nextValue = Number(raw);
    setRightHandleValue(nextValue);
    applySortedPriceFilters(leftHandleValue, nextValue);
  };

  const leftPercent = ((leftHandleValue - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;
  const rightPercent = ((rightHandleValue - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;
  const minPercent = Math.min(leftPercent, rightPercent);
  const maxPercent = Math.max(leftPercent, rightPercent);
  const handlesDistance = Math.abs(leftPercent - rightPercent);
  const bubbleOverlapThreshold = 14;
  const leftBubbleShift = handlesDistance < bubbleOverlapThreshold ? -28 : 0;
  const rightBubbleShift = handlesDistance < bubbleOverlapThreshold ? 28 : 0;

  const activeFilterLabels = useMemo(() => {
    const labels: string[] = [];
    if (filters.specialistType) {
      const match = specialistTypeOptions.find((item) => item.value === filters.specialistType);
      if (match) labels.push(match.label);
    }
    if (filters.specialization) {
      const match = specializationOptions.find((item) => item.value === filters.specialization);
      if (match) labels.push(match.label);
    }
    if (filters.country) {
      const match = countryOptions.find((item) => item.value === filters.country);
      if (match) labels.push(match.label);
    }
    if (filters.language) {
      const match = languageOptions.find((item) => item.value === filters.language);
      if (match) labels.push(match.label);
    }
    if (filters.rating) {
      const match = ratingOptions.find((item) => item.value === filters.rating);
      if (match) labels.push(match.label);
    }
    if (filters.availabilityDays) {
      const match = availabilityOptions.find((item) => item.value === filters.availabilityDays);
      if (match) labels.push(match.label);
    }
    const min = Number(filters.minPrice);
    const max = Number(filters.maxPrice);
    if (min > PRICE_MIN || max < PRICE_MAX) {
      labels.push(isAr ? `${min}-${max} دينار` : `${min}-${max} JOD`);
    }
    return labels;
  }, [
    availabilityOptions,
    countryOptions,
    filters.availabilityDays,
    filters.country,
    filters.language,
    filters.maxPrice,
    filters.minPrice,
    filters.rating,
    filters.specialistType,
    filters.specialization,
    isAr,
    languageOptions,
    ratingOptions,
    specialistTypeOptions,
    specializationOptions
  ]);

  const hasActiveFilters =
    filters.mainSearch.trim() !== '' ||
    filters.specialistType !== '' ||
    filters.specialization !== '' ||
    filters.country !== '' ||
    filters.language !== '' ||
    filters.rating !== '' ||
    filters.availabilityDays !== '' ||
    Number(filters.minPrice) > PRICE_MIN ||
    Number(filters.maxPrice) < PRICE_MAX;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch?.(filters);
  };

  void doctorNameSuggestions;

  return (
    <section dir={isAr ? 'rtl' : 'ltr'} className={`doctor-search-clean ${className}`.trim()}>
      <div className="doctor-search-clean__shape" aria-hidden="true" />
      <div className="doctor-search-clean__container">
        <div className="doctor-search-clean__head">
          <h2 className="doctor-search-clean__title">{isAr ? 'بحث متقدم عن المعالجين' : 'Advanced Therapist Search'}</h2>
          <p className="doctor-search-clean__subtitle">
            {isAr
              ? 'تجربة بحث طبية احترافية تساعدك للوصول إلى المعالج الأنسب بسرعة ووضوح'
              : 'A professional medical search experience to quickly find the right therapist with confidence'}
          </p>
        </div>

        <form className="doctor-search-clean__panel" onSubmit={handleSubmit}>
          <section className="doctor-search-clean__search-card" aria-label={isAr ? 'شريط البحث' : 'Search Bar'}>
            <div className="doctor-search-clean__search-meta">
              <span className="doctor-search-clean__results-inline">
                {isAr ? `${resultCount} معالجين مطابقين` : `${resultCount} therapists match`}
              </span>
              <button
                type="button"
                className="doctor-search-clean__clear-link"
                onClick={() => {
                  setLeftHandleValue(PRICE_MIN);
                  setRightHandleValue(PRICE_MAX);
                  applyFilters(INITIAL_FILTERS);
                }}
                disabled={!hasActiveFilters}
              >
                {isAr ? 'مسح جميع الفلاتر' : 'Clear All Filters'}
              </button>
            </div>
            <input
              type="text"
              value={filters.mainSearch}
              onChange={(event) => applyFilters({ ...filters, mainSearch: event.target.value })}
              className="doctor-search-clean__input doctor-search-clean__input--search"
              placeholder={isAr ? 'ابحث باسم المعالج أو التخصص...' : 'Search therapist name or specialization...'}
              autoComplete="off"
            />
          </section>

          <section className="doctor-search-clean__filter-card" aria-label={isAr ? 'الفلاتر' : 'Filter Grid'}>
            <div className="doctor-search-clean__grid">
              <label className={`doctor-search-clean__field ${filters.specialistType ? 'doctor-search-clean__field--filled' : ''}`}>
                <span className="doctor-search-clean__label">{isAr ? 'نوع المختص' : 'Specialist Type'}</span>
                <select
                  value={filters.specialistType}
                  onChange={(event) => applyFilters({ ...filters, specialistType: event.target.value as DoctorSearchFilters['specialistType'] })}
                  className="doctor-search-clean__select"
                >
                  {specialistTypeOptions.map((option) => (
                    <option key={option.label} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className={`doctor-search-clean__field ${filters.specialization ? 'doctor-search-clean__field--filled' : ''}`}>
                <span className="doctor-search-clean__label">{isAr ? 'التخصص' : 'Specialization'}</span>
                <select
                  value={filters.specialization}
                  onChange={(event) => applyFilters({ ...filters, specialization: event.target.value })}
                  className="doctor-search-clean__select"
                >
                  {specializationOptions.map((option) => (
                    <option key={option.label} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className={`doctor-search-clean__field ${filters.country ? 'doctor-search-clean__field--filled' : ''}`}>
                <span className="doctor-search-clean__label">{isAr ? 'الدولة' : 'Country'}</span>
                <select
                  value={filters.country}
                  onChange={(event) => applyFilters({ ...filters, country: event.target.value })}
                  className="doctor-search-clean__select"
                >
                  {countryOptions.map((option) => (
                    <option key={option.label} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className={`doctor-search-clean__field ${filters.language ? 'doctor-search-clean__field--filled' : ''}`}>
                <span className="doctor-search-clean__label">{isAr ? 'اللغة' : 'Language'}</span>
                <select
                  value={filters.language}
                  onChange={(event) => applyFilters({ ...filters, language: event.target.value })}
                  className="doctor-search-clean__select"
                >
                  {languageOptions.map((option) => (
                    <option key={option.label} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className={`doctor-search-clean__field ${filters.rating ? 'doctor-search-clean__field--filled' : ''}`}>
                <span className="doctor-search-clean__label">{isAr ? 'التقييم' : 'Ratings'}</span>
                <select
                  value={filters.rating}
                  onChange={(event) => applyFilters({ ...filters, rating: event.target.value as DoctorSearchFilters['rating'] })}
                  className="doctor-search-clean__select"
                >
                  {ratingOptions.map((option) => (
                    <option key={option.label} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className={`doctor-search-clean__field ${filters.availabilityDays ? 'doctor-search-clean__field--filled' : ''}`}>
                <span className="doctor-search-clean__label">{isAr ? 'أقرب موعد متاح' : 'Nearby Availability'}</span>
                <select
                  value={filters.availabilityDays}
                  onChange={(event) =>
                    applyFilters({ ...filters, availabilityDays: event.target.value as DoctorSearchFilters['availabilityDays'] })
                  }
                  className="doctor-search-clean__select"
                >
                  {availabilityOptions.map((option) => (
                    <option key={option.label} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="doctor-search-clean__price-card" aria-label={isAr ? 'نطاق السعر' : 'Price Range'}>
            <div className="doctor-search-clean__price-head">
              <div className="doctor-search-clean__price-head-copy">
                <span className="doctor-search-clean__section-label">
                  {isAr ? 'نطاق السعر للجلسة' : 'Session Price Range'}
                </span>
                <span className="doctor-search-clean__price-match">
                  {isAr ? `${resultCount} معالجين في هذا النطاق` : `${resultCount} therapists in this range`}
                </span>
              </div>
              <span className="doctor-search-clean__price-value">JOD {filters.minPrice} - {filters.maxPrice}</span>
            </div>

            <div className="doctor-search-clean__slider-wrap" dir="ltr">
              <div className="doctor-search-clean__slider-track" />
              <div
                className="doctor-search-clean__slider-range"
                style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
                aria-hidden="true"
              />

              <div
                className="doctor-search-clean__price-bubble"
                style={{
                  left: `${leftPercent}%`,
                  transform: `translateX(calc(-50% + ${leftBubbleShift}px))`
                }}
              >
                JOD {leftHandleValue}
              </div>
              <div
                className="doctor-search-clean__price-bubble"
                style={{
                  left: `${rightPercent}%`,
                  transform: `translateX(calc(-50% + ${rightBubbleShift}px))`
                }}
              >
                JOD {rightHandleValue}
              </div>

              <input
                type="range"
                min={PRICE_MIN}
                max={PRICE_MAX}
                step={5}
                value={leftHandleValue}
                onChange={(event) => handleLeftHandleChange(event.target.value)}
                className="doctor-search-clean__slider doctor-search-clean__slider--min"
                aria-label={isAr ? 'مقبض السعر الأول' : 'Price handle one'}
              />
              <input
                type="range"
                min={PRICE_MIN}
                max={PRICE_MAX}
                step={5}
                value={rightHandleValue}
                onChange={(event) => handleRightHandleChange(event.target.value)}
                className="doctor-search-clean__slider doctor-search-clean__slider--max"
                aria-label={isAr ? 'مقبض السعر الثاني' : 'Price handle two'}
              />
            </div>

            <div className="doctor-search-clean__price-scale" dir="ltr">
              <span>JOD {PRICE_MIN}</span>
              <span>JOD {PRICE_MAX}</span>
            </div>
          </section>

          <div className="doctor-search-clean__footer">
            <div className="doctor-search-clean__chips" aria-live="polite">
              {activeFilterLabels.length > 0 ? (
                activeFilterLabels.map((label) => (
                  <span key={label} className="doctor-search-clean__chip">
                    {label}
                  </span>
                ))
              ) : (
                <span className="doctor-search-clean__hint">
                  {isAr
                    ? 'جميع النتائج معروضة. استخدم الفلاتر لتضييق البحث بشكل دقيق.'
                    : 'Showing all results. Use filters to narrow to your exact therapy needs.'}
                </span>
              )}
            </div>

            <div className="doctor-search-clean__actions">
              <button className="doctor-search-clean__button" type="submit" aria-label={isAr ? 'بحث' : 'Search'}>
                {isAr ? 'تطبيق' : 'Apply'}
              </button>
              <button
                type="button"
                className="doctor-search-clean__reset"
                onClick={() => {
                  setLeftHandleValue(PRICE_MIN);
                  setRightHandleValue(PRICE_MAX);
                  applyFilters(INITIAL_FILTERS);
                }}
                disabled={!hasActiveFilters}
              >
                {isAr ? 'مسح الفلاتر' : 'Clear Filters'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
