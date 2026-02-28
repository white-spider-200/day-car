import { useEffect, useState } from 'react';
import Header from '../components/Header';
import HeroSearch from '../components/HeroSearch';
import DoctorSearchArabic, { type DoctorSearchFilters } from '../components/DoctorSearchArabic';
import DoctorCard from '../components/DoctorCard';
import HowItWorks from '../components/HowItWorks';
import CTAForDoctors from '../components/CTAForDoctors';
import FounderSection from '../components/FounderSection';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';
import type { Doctor } from '../data/homeData';
import { fetchFirstReachable } from '../utils/api';

type ApiDoctor = {
  doctor_user_id: string;
  slug: string;
  display_name: string;
  headline: string | null;
  photo_url: string | null;
  specialties: string[] | null;
  concerns: string[] | null;
  therapy_approaches: string[] | null;
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
};

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
    photo: apiDoctor.photo_url ?? undefined
  };
}

export default function MainHomePage() {
  const { t, lang } = useLanguage();
  const [featuredDoctors, setFeaturedDoctors] = useState<Doctor[]>([]);
  const [doctorsError, setDoctorsError] = useState<string | null>(null);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);

  const fetchDoctors = async (filters?: DoctorSearchFilters) => {
    setIsLoadingDoctors(true);
    try {
      setDoctorsError(null);
      const query = new URLSearchParams();

      if (filters?.specialty) {
        query.set('specialty', filters.specialty);
      }
      if (filters?.concern) {
        query.set('concern', filters.concern);
      }
      if (filters?.approach) {
        query.set('approach', filters.approach);
      }
      if (filters?.language) {
        query.set('language', filters.language);
      }
      if (filters?.sessionType) {
        query.set('session_type', filters.sessionType);
      }
      if (filters?.consultationType === 'in_person' && !filters?.sessionType) {
        query.set('session_type', 'IN_PERSON');
      }
      if (filters?.consultationType === 'online') {
        query.set('online_only', 'true');
      }
      if (filters?.location) {
        query.set('city', filters.location);
      }
      if (filters?.gender) {
        query.set('gender', filters.gender);
      }
      if (filters?.insurance) {
        query.set('insurance', filters.insurance);
      }
      if (filters?.availabilityDays) {
        query.set('available_within_days', filters.availabilityDays);
      }
      if (filters?.minPrice) {
        query.set('min_price', filters.minPrice);
      }
      if (filters?.maxPrice) {
        query.set('max_price', filters.maxPrice);
      }

      const queryString = query.toString();
      const response = await fetchFirstReachable(queryString ? `/doctors?${queryString}` : '/doctors');

      if (!response.ok) {
        const responseBody = await response.json().catch(() => null);
        const detail = typeof responseBody?.detail === 'string' ? responseBody.detail : null;
        throw new Error(detail ?? `Failed to load doctors (${response.status})`);
      }

      let payload = (await response.json()) as ApiDoctor[];
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

      setFeaturedDoctors(payload.map(toCardDoctor));
    } catch (error) {
      setDoctorsError(error instanceof Error ? error.message : 'Failed to load doctors');
      setFeaturedDoctors([]);
    } finally {
      setIsLoadingDoctors(false);
    }
  };

  const handleArabicSearch = (filters: DoctorSearchFilters) => {
    void fetchDoctors(filters);
  };

  useEffect(() => {
    void fetchDoctors();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/40 via-white to-white text-textMain">
      <Header
        brandHref="/home"
        navItems={[
          { labelKey: 'nav.doctors', href: '#featured-doctors' },
          { labelKey: 'nav.howItWorks', href: '#how-it-works' },
          { labelKey: 'nav.forDoctors', href: '#for-doctors' },
          { labelKey: 'nav.about', href: '/about' }
        ]}
      />

      <main>
        <HeroSearch />
        <DoctorSearchArabic onSearch={handleArabicSearch} />

        <section id="featured-doctors" className="section-shell py-12 sm:py-14" aria-labelledby="featured-title">
          <h2 id="featured-title" className="section-title">
            {t('home.featuredTitle')}
          </h2>

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

        <FounderSection />

        <HowItWorks />
        <CTAForDoctors />
      </main>

      <Footer />
    </div>
  );
}
