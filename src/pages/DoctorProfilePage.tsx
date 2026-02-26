import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import Header from '../components/Header';
import ProfileHeaderCard from '../components/profile/ProfileHeaderCard';
import ProfileTabs, { type ProfileTabKey } from '../components/profile/ProfileTabs';
import AboutSection from '../components/profile/AboutSection';
import ServicesSection from '../components/profile/ServicesSection';
import AvailabilitySection from '../components/profile/AvailabilitySection';
import ReviewsSection from '../components/profile/ReviewsSection';
import QuickBookingSidebar from '../components/profile/QuickBookingSidebar';
import {
  doctorProfile,
  ratingDistribution,
  reviews,
  services,
  similarDoctors,
  weeklyAvailability
} from '../data/doctorProfileData';

function findActiveTabByScroll(sectionRefs: Record<ProfileTabKey, RefObject<HTMLElement>>): ProfileTabKey {
  const threshold = 180;
  let current: ProfileTabKey = 'about';

  (Object.keys(sectionRefs) as ProfileTabKey[]).forEach((key) => {
    const element = sectionRefs[key].current;

    if (!element) {
      return;
    }

    const top = element.getBoundingClientRect().top;

    if (top <= threshold) {
      current = key;
    }
  });

  return current;
}

export default function DoctorProfilePage() {
  const aboutRef = useRef<HTMLElement>(null);
  const servicesRef = useRef<HTMLElement>(null);
  const availabilityRef = useRef<HTMLElement>(null);
  const reviewsRef = useRef<HTMLElement>(null);

  const sectionRefs = useMemo(
    () => ({
      about: aboutRef,
      services: servicesRef,
      availability: availabilityRef,
      reviews: reviewsRef
    }),
    []
  );

  const [activeTab, setActiveTab] = useState<ProfileTabKey>('about');

  useEffect(() => {
    const onScroll = () => {
      setActiveTab(findActiveTabByScroll(sectionRefs));
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [sectionRefs]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/40 via-white to-white text-textMain">
      <Header />

      <main>
        <ProfileHeaderCard doctor={doctorProfile} />

        <ProfileTabs activeTab={activeTab} sectionRefs={sectionRefs} />

        <div className="section-shell grid gap-5 py-6 sm:gap-6 sm:py-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] lg:items-start">
          <div className="space-y-5 sm:space-y-6">
            <section ref={aboutRef} id="about" aria-label="About section">
              <AboutSection doctor={doctorProfile} />
            </section>

            <section ref={servicesRef} id="services" aria-label="Services section">
              <ServicesSection items={services} />
            </section>

            <section ref={availabilityRef} id="availability" aria-label="Availability section">
              <AvailabilitySection weeklyAvailability={weeklyAvailability} />
            </section>

            <section ref={reviewsRef} id="reviews" aria-label="Reviews section">
              <ReviewsSection
                averageRating={doctorProfile.rating}
                totalReviews={doctorProfile.reviewsCount}
                distribution={ratingDistribution}
                reviews={reviews}
              />
            </section>
          </div>

          <QuickBookingSidebar services={services} similarDoctors={similarDoctors} />
        </div>
      </main>
    </div>
  );
}
