import { useEffect, useState } from 'react';
import HeroSearch from '../components/HeroSearch';
import DoctorSearchArabic, { INITIAL_FILTERS, type DoctorSearchFilters } from '../components/DoctorSearchArabic';
import DoctorCard from '../components/DoctorCard';
import HowItWorks from '../components/HowItWorks';
import VRTherapySection from '../components/VRTherapySection';
import CTAForDoctors from '../components/CTAForDoctors';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';
import type { Doctor } from '../data/homeData';
import { fetchFirstReachable, getBackendOrigin } from '../utils/api';

type ApiDoctor = {
  doctor_user_id: string;
  slug: string;
  display_name: string;
  headline: string | null;
  photo_url: string | null;
  specialties: string[] | null;
  concerns: string[] | null;
  therapy_approaches: string[] | null;
  professional_type: string | null;
  languages: string[] | null;
  session_types: string[] | null;
  gender_identity: string | null;
  insurance_providers: string[] | null;
  location_city: string | null;
  location_country: string | null;
  clinic_name: string | null;
  address_line: string | null;
  next_available_at: string | null;
  rating: number | string | null;
  reviews_count: number;
  pricing_currency: string;
  pricing_per_session: number | string | null;
  follow_up_price: number | string | null;
  verification_badges: string[] | null;
  is_top_doctor?: boolean;
};

function resolveMediaUrl(url: string | null): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  if (typeof window !== 'undefined' && path.startsWith('/images/')) {
    return `${window.location.origin}${path}`;
  }
  const base = getBackendOrigin();
  return `${base}${path}`;
}

function collectTags(apiDoctor: ApiDoctor): string[] {
  const deduped = new Set<string>();
  for (const tag of [...(apiDoctor.specialties ?? []), ...(apiDoctor.concerns ?? []), ...(apiDoctor.therapy_approaches ?? [])]) {
    const trimmed = tag.trim();
    if (trimmed) {
      deduped.add(trimmed);
    }
  }
  return deduped.size > 0 ? Array.from(deduped).slice(0, 5) : ['General Therapy'];
}

function toCardDoctor(apiDoctor: ApiDoctor): Doctor {
  const priceAmount = apiDoctor.pricing_per_session === null ? null : Number(apiDoctor.pricing_per_session);
  const locationParts = [apiDoctor.location_city, apiDoctor.location_country].filter(Boolean);
  const onlineModes = new Set(['VIDEO', 'AUDIO', 'CHAT', 'ONLINE']);
  const offersOnline = (apiDoctor.session_types ?? []).some((sessionType) => onlineModes.has(sessionType.toUpperCase()));
  const baseLocation = locationParts.length > 0 ? locationParts.join(' • ') : offersOnline ? 'Online' : 'Unknown';
  const location = offersOnline && !baseLocation.includes('Online') ? `${baseLocation} • Online` : baseLocation;
  const tags = collectTags(apiDoctor);
  const ratingValue = apiDoctor.rating === null ? null : Number(apiDoctor.rating);
  const rating = ratingValue === null || Number.isNaN(ratingValue) ? 0 : ratingValue;
  const reviewsCount = Number.isFinite(apiDoctor.reviews_count) ? apiDoctor.reviews_count : 0;

  return {
    slug: apiDoctor.slug,
    name: apiDoctor.display_name,
    nameAr: apiDoctor.display_name,
    title: apiDoctor.headline ?? 'Therapist',
    titleAr: apiDoctor.headline ?? 'معالج نفسي',
    location,
    locationAr: location,
    price:
      priceAmount === null || Number.isNaN(priceAmount)
        ? 'Contact for price'
        : `${priceAmount} ${apiDoctor.pricing_currency} / session`,
    priceAr:
      priceAmount === null || Number.isNaN(priceAmount)
        ? 'تواصل لمعرفة السعر'
        : `${priceAmount} ${apiDoctor.pricing_currency} / session`,
    rating,
    reviewsCount,
    tags,
    tagsAr: tags,
    isVerified: (apiDoctor.verification_badges ?? []).includes('VERIFIED_DOCTOR'),
    isTopDoctor: false,
    photo: resolveMediaUrl(apiDoctor.photo_url)
  };
}

function sortByBestMatch(doctors: ApiDoctor[], filters?: DoctorSearchFilters): ApiDoctor[] {
  const now = Date.now();
  const normalize = (value: string) => value.trim().toLowerCase();
  const includesText = (values: Array<string | null | undefined>, text: string) =>
    values.some((value) => (value ?? '').toLowerCase().includes(text));
  const normalizedSearch = normalize(filters?.mainSearch ?? '');

  const toTime = (value: string | null) => {
    if (!value) return Number.POSITIVE_INFINITY;
    const parsed = Date.parse(value);
    if (Number.isNaN(parsed) || parsed < now) return Number.POSITIVE_INFINITY;
    return parsed;
  };

  const filterScore = (doctor: ApiDoctor) => {
    if (!filters) return 0;

    let score = 0;
    if (normalizedSearch) {
      const matchedSearch = includesText(
        [
          doctor.display_name,
          doctor.headline,
          doctor.location_city,
          doctor.location_country,
          doctor.gender_identity,
          ...(doctor.specialties ?? []),
          ...(doctor.concerns ?? []),
          ...(doctor.therapy_approaches ?? []),
          ...(doctor.languages ?? [])
        ],
        normalizedSearch
      );
      if (matchedSearch) score += 5;
    }

    if (filters.specialization) {
      const specializationMatched = includesText(
        [...(doctor.specialties ?? []), ...(doctor.concerns ?? []), ...(doctor.therapy_approaches ?? [])],
        normalize(filters.specialization)
      );
      if (specializationMatched) score += 4;
    }
    if (filters.specialistType && doctor.professional_type === filters.specialistType) score += 4;
    if (filters.country && includesText([doctor.location_country], normalize(filters.country))) score += 3;
    if (filters.language && (doctor.languages ?? []).includes(filters.language)) score += 3;
    if (filters.rating && Number(doctor.rating ?? 0) >= Number(filters.rating)) score += 2;
    if (filters.availabilityDays && toTime(doctor.next_available_at) !== Number.POSITIVE_INFINITY) score += 2;

    return score;
  };

  return [...doctors].sort((a, b) => {
    const aFilterScore = filterScore(a);
    const bFilterScore = filterScore(b);
    if (aFilterScore !== bFilterScore) {
      return bFilterScore - aFilterScore;
    }

    const normalizeRating = (value: number | string | null) => {
      if (value === null) return 0;
      const parsed = Number(value);
      if (Number.isNaN(parsed)) return 0;
      return Math.max(0, Math.min(5, parsed));
    };

    const aRating = normalizeRating(a.rating);
    const bRating = normalizeRating(b.rating);
    if (aRating !== bRating) {
      return bRating - aRating;
    }

    const aReviews = Number.isFinite(a.reviews_count) ? a.reviews_count : 0;
    const bReviews = Number.isFinite(b.reviews_count) ? b.reviews_count : 0;
    if (aReviews !== bReviews) {
      return bReviews - aReviews;
    }

    const aTime = toTime(a.next_available_at);
    const bTime = toTime(b.next_available_at);

    if (aTime !== bTime) {
      return aTime - bTime;
    }
    
    return 0;
  });
}

function placeBestInMiddle(doctors: ApiDoctor[], bestDoctorId: string): ApiDoctor[] {
  if (doctors.length < 2) {
    return doctors;
  }

  const bestIndex = doctors.findIndex((doctor) => doctor.doctor_user_id === bestDoctorId);
  if (bestIndex === -1) {
    return doctors;
  }

  const centerIndex = doctors.length >= 3 ? 1 : Math.floor(doctors.length / 2);
  if (bestIndex === centerIndex) {
    return doctors;
  }

  const reordered = [...doctors];
  const [bestDoctor] = reordered.splice(bestIndex, 1);
  reordered.splice(centerIndex, 0, bestDoctor);
  return reordered;
}

export default function MainHomePage() {
  const { lang } = useLanguage();
  const [featuredDoctors, setFeaturedDoctors] = useState<Doctor[]>([]);
  const [doctorsError, setDoctorsError] = useState<string | null>(null);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [isFilteredResults, setIsFilteredResults] = useState(false);
  const [doctorNameSuggestions, setDoctorNameSuggestions] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<DoctorSearchFilters>(INITIAL_FILTERS);
  const [searchResetSignal, setSearchResetSignal] = useState(0);

  const hasActiveFilters = (filters?: DoctorSearchFilters) => {
    if (!filters) {
      return false;
    }

    return (
      filters.mainSearch.trim() !== '' ||
      filters.specialistType !== '' ||
      filters.specialization !== '' ||
      filters.country !== '' ||
      filters.language !== '' ||
      filters.rating !== '' ||
      filters.availabilityDays !== '' ||
      Number(filters.minPrice) > 20 ||
      Number(filters.maxPrice) < 250
    );
  };

  const fetchDoctors = async (filters?: DoctorSearchFilters) => {
    setIsLoadingDoctors(true);
    try {
      setDoctorsError(null);
      const isFiltering = hasActiveFilters(filters);
      setIsFilteredResults(isFiltering);
      const query = new URLSearchParams();

      if (filters?.specialistType) {
        query.set('professional_type', filters.specialistType);
      }
      if (filters?.specialization) {
        query.set('specialization', filters.specialization);
      }
      if (filters?.country) {
        query.set('country', filters.country);
      }
      if (filters?.language) {
        query.set('language', filters.language);
      }
      if (filters?.rating) {
        query.set('min_rating', filters.rating);
      }
      if (filters?.availabilityDays) {
        query.set('available_within_days', filters.availabilityDays);
      }
      if (filters?.minPrice && Number(filters.minPrice) > 20) {
        query.set('min_price', filters.minPrice);
      }
      if (filters?.maxPrice && Number(filters.maxPrice) < 250) {
        query.set('max_price', filters.maxPrice);
      }

      const queryString = query.toString();
      const endpoint = queryString ? `/doctors?${queryString}` : '/doctors';
      const response = await fetchFirstReachable(endpoint);

      if (!response.ok) {
        const responseBody = await response.json().catch(() => null);
        const detail = typeof responseBody?.detail === 'string' ? responseBody.detail : null;
        throw new Error(detail ?? `Failed to load doctors (${response.status})`);
      }

      const rawPayload = (await response.json()) as unknown;
      let payload: ApiDoctor[] = [];

      if (Array.isArray(rawPayload)) {
        payload = rawPayload as ApiDoctor[];
      } else if (rawPayload && typeof rawPayload === 'object') {
        payload = [rawPayload as ApiDoctor];
      }

      if (!isFiltering) {
        const names = Array.from(
          new Set(payload.map((doctor) => doctor.display_name).filter((name) => Boolean(name && name.trim())))
        );
        setDoctorNameSuggestions(names);
      }

      const searchTerm = filters?.mainSearch.trim().toLowerCase();
      if (searchTerm) {
        payload = payload.filter((doctor) => {
          const searchableValues = [
            doctor.display_name,
            doctor.headline ?? '',
            ...(doctor.specialties ?? []),
            ...(doctor.concerns ?? []),
            ...(doctor.therapy_approaches ?? []),
            ...(doctor.languages ?? []),
            doctor.location_city ?? '',
            doctor.location_country ?? '',
            doctor.gender_identity ?? ''
          ];

          return searchableValues.some((value) => value.toLowerCase().includes(searchTerm));
        });
      }

      if (payload.length === 0) {
        setFeaturedDoctors([]);
        return;
      }

      const isNameSearch = Boolean(filters?.mainSearch.trim());
      const ranked = isNameSearch ? payload : sortByBestMatch(payload, filters);
      const limited = isFiltering ? ranked : ranked.slice(0, 6);
      const shouldPromoteBest = !isNameSearch;
      const bestDoctorId = shouldPromoteBest ? limited[0]?.doctor_user_id : undefined;
      const centered = bestDoctorId ? placeBestInMiddle(limited, bestDoctorId) : limited;

      setFeaturedDoctors(
        centered.map((doctor) => ({
          ...toCardDoctor(doctor),
          isTopDoctor: Boolean(bestDoctorId) && doctor.doctor_user_id === bestDoctorId
        }))
      );
    } catch (error) {
      setDoctorsError(error instanceof Error ? error.message : 'Failed to load doctors');
      setFeaturedDoctors([]);
    } finally {
      setIsLoadingDoctors(false);
    }
  };

  const handleArabicSearch = (filters: DoctorSearchFilters) => {
    setActiveFilters(filters);
    void fetchDoctors(filters);
  };

  const activeFilterTags = [
    activeFilters.country,
    activeFilters.language,
    activeFilters.rating ? `${activeFilters.rating}★+` : '',
    activeFilters.specialization,
    activeFilters.specialistType === 'PSYCHIATRIST'
      ? lang === 'ar'
        ? 'طبيب نفسي'
        : 'Psychiatrist'
      : activeFilters.specialistType === 'THERAPIST'
        ? lang === 'ar'
          ? 'معالج نفسي'
          : 'Therapist'
        : ''
  ].filter((value) => value.trim() !== '');

  useEffect(() => {
    void fetchDoctors();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/40 via-white to-white text-textMain">
      <main>
        <HeroSearch />
        <DoctorSearchArabic
          onSearch={handleArabicSearch}
          doctorNameSuggestions={doctorNameSuggestions}
          resetSignal={searchResetSignal}
          resultCount={featuredDoctors.length}
        />

        <section
          id="featured-doctors"
          className="section-shell pt-10 pb-16 sm:pt-12 sm:pb-20"
          aria-labelledby={isFilteredResults ? undefined : 'featured-title'}
        >
          {!isFilteredResults && (
            <div className="flex flex-col items-center text-center">
              <h2 id="featured-title" className="section-title text-center">
                {lang === 'ar' ? 'أفضل الأطباء' : 'Top Doctors'}
              </h2>
              <div className="mt-2 h-1 w-20 rounded-full bg-gradient-to-r from-primary/30 via-primary to-primary/30" />
            </div>
          )}

          {doctorsError && (
            <p className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {doctorsError}
            </p>
          )}

          {isLoadingDoctors && (
            <p className="mt-4 text-sm text-muted">
              {lang === 'ar' ? 'جاري تحديث النتائج...' : 'Updating results...'}
            </p>
          )}

          {!doctorsError && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#dbe8ef] bg-white/85 px-4 py-3">
              <p className="text-sm font-semibold text-[#3d5875]">
                {lang === 'ar'
                  ? `عرض ${featuredDoctors.length} معالجين مطابقين`
                  : `Showing ${featuredDoctors.length} therapists near you`}
              </p>
              {activeFilterTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {activeFilterTags.map((tag) => (
                    <span key={tag} className="rounded-full border border-[#c8e4ee] bg-[#eef9fd] px-3 py-1 text-xs font-semibold text-[#15566b]">
                      {tag}
                    </span>
                  ))}
                  <button
                    type="button"
                    className="rounded-full border border-[#d0dee8] bg-white px-3 py-1 text-xs font-semibold text-[#2d4761] transition hover:bg-[#f4f8fb]"
                    onClick={() => {
                      setActiveFilters(INITIAL_FILTERS);
                      setSearchResetSignal((current) => current + 1);
                      void fetchDoctors();
                    }}
                  >
                    {lang === 'ar' ? 'مسح الكل' : 'Clear All'}
                  </button>
                </div>
              )}
            </div>
          )}

          {!doctorsError && featuredDoctors.length === 0 && (
            <p className="mt-4 text-sm text-muted">
              {lang === 'ar' ? 'لا توجد نتائج مطابقة للفلاتر الحالية.' : 'No matching therapists for current filters.'}
            </p>
          )}

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredDoctors.map((doctor, idx) => (
              <DoctorCard key={`${doctor.name}-${idx}`} doctor={doctor} index={idx} />
            ))}
          </div>
        </section>

        <VRTherapySection />
        <HowItWorks />
        <CTAForDoctors />
      </main>

      <Footer />
    </div>
  );
}
