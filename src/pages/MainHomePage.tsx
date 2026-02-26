import { useEffect, useState } from 'react';
import Header from '../components/Header';
import HeroSearch from '../components/HeroSearch';
import DoctorCard from '../components/DoctorCard';
import HowItWorks from '../components/HowItWorks';
import CTAForDoctors from '../components/CTAForDoctors';
import FounderSection from '../components/FounderSection';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';
import { featuredDoctors as fallbackDoctors, type Doctor } from '../data/homeData';
import { fetchFirstReachable } from '../utils/api';

type ApiDoctor = {
  doctor_user_id: string;
  display_name: string;
  headline: string | null;
  photo_url: string | null;
  specialties: string[] | null;
  location_city: string | null;
  location_country: string | null;
  pricing_currency: string;
  pricing_per_session: number | string | null;
  verification_badges: string[] | null;
};

function toCardDoctor(apiDoctor: ApiDoctor): Doctor {
  const priceAmount = apiDoctor.pricing_per_session === null ? null : Number(apiDoctor.pricing_per_session);
  const locationParts = [apiDoctor.location_city, apiDoctor.location_country].filter(Boolean);
  const location = locationParts.length > 0 ? locationParts.join(' • ') : 'Online';
  const tags = apiDoctor.specialties?.length ? apiDoctor.specialties : ['General Therapy'];
  const rating = 4.7;
  const reviewsCount = 0;

  return {
    name: apiDoctor.display_name,
    nameAr: apiDoctor.display_name,
    title: apiDoctor.headline ?? 'Doctor',
    titleAr: apiDoctor.headline ?? 'Doctor',
    location,
    locationAr: location,
    price:
      priceAmount === null || Number.isNaN(priceAmount)
        ? 'Contact for price'
        : `${priceAmount} ${apiDoctor.pricing_currency} / session`,
    priceAr:
      priceAmount === null || Number.isNaN(priceAmount)
        ? 'Contact for price'
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
  const { t } = useLanguage();
  const [featuredDoctors, setFeaturedDoctors] = useState<Doctor[]>(fallbackDoctors);
  const [doctorsError, setDoctorsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadDoctors = async () => {
      try {
        setDoctorsError(null);
        const response = await fetchFirstReachable('/doctors');
        if (!response.ok) {
          throw new Error(`Failed to load doctors (${response.status})`);
        }
        const payload = (await response.json()) as ApiDoctor[];
        if (!cancelled) {
          if (payload.length === 0) {
            setFeaturedDoctors(fallbackDoctors);
            return;
          }
          setFeaturedDoctors(payload.map(toCardDoctor));
        }
      } catch (error) {
        if (!cancelled) {
          setDoctorsError(error instanceof Error ? error.message : 'Failed to load doctors');
          setFeaturedDoctors(fallbackDoctors);
        }
      }
    };

    void loadDoctors();
    return () => {
      cancelled = true;
    };
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

        <section id="featured-doctors" className="section-shell py-14 sm:py-16" aria-labelledby="featured-title">
          <h2 id="featured-title" className="section-title">
            {t('home.featuredTitle')}
          </h2>

          {doctorsError && (
            <p className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Live data is temporarily unavailable. Showing demo doctors.
            </p>
          )}

          {!doctorsError && featuredDoctors.length === 0 && (
            <p className="mt-4 text-sm text-muted">No doctors available yet.</p>
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
