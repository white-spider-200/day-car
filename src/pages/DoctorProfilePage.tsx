import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import Header from '../components/Header';
import ProfileHeaderCard from '../components/profile/ProfileHeaderCard';
import ProfileTabs, { type ProfileTabKey } from '../components/profile/ProfileTabs';
import AboutSection from '../components/profile/AboutSection';
import ServicesSection from '../components/profile/ServicesSection';
import AvailabilitySection from '../components/profile/AvailabilitySection';
import ReviewsSection from '../components/profile/ReviewsSection';
import QuickBookingSidebar from '../components/profile/QuickBookingSidebar';
import type { AvailabilitySlot } from '../components/profile/AvailabilitySection';
import { fetchFirstReachable } from '../utils/api';
import {
  doctorProfile,
  ratingDistribution,
  reviews,
  services,
  similarDoctors,
  weeklyAvailability as fallbackWeeklyAvailability
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

type PublicTopDoctor = {
  doctor_user_id: string;
};

type AvailabilityApiSlot = {
  start_at: string;
};

const WEEKDAY_ORDER: Array<'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'> = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function toWeeklyAvailabilityFromApi(slots: AvailabilityApiSlot[], timezone = 'Asia/Amman'): Record<string, AvailabilitySlot[]> {
  const dayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: timezone });
  const timeFormatter = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone
  });

  const grouped = new Map<string, string[]>();
  for (const day of WEEKDAY_ORDER) {
    grouped.set(day, []);
  }

  for (const item of slots) {
    const date = new Date(item.start_at);
    if (Number.isNaN(date.getTime())) {
      continue;
    }
    const day = dayFormatter.format(date);
    const time = timeFormatter.format(date);
    if (!grouped.has(day)) {
      continue;
    }
    const existing = grouped.get(day) ?? [];
    if (!existing.includes(time)) {
      existing.push(time);
      grouped.set(day, existing);
    }
  }

  const output: Record<string, AvailabilitySlot[]> = {};
  for (const day of WEEKDAY_ORDER) {
    const sorted = (grouped.get(day) ?? []).sort();
    output[day] = sorted.slice(0, 4).map((time) => ({ time, status: 'available' }));
  }
  return output;
}

function hasAnyLiveAvailability(weeklyMap: Record<string, AvailabilitySlot[]>): boolean {
  return Object.values(weeklyMap).some((daySlots) => daySlots.length > 0);
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
  const [liveWeeklyAvailability, setLiveWeeklyAvailability] = useState<Record<string, AvailabilitySlot[]>>(fallbackWeeklyAvailability);

  useEffect(() => {
    const onScroll = () => {
      setActiveTab(findActiveTabByScroll(sectionRefs));
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [sectionRefs]);

  useEffect(() => {
    let active = true;

    const loadLiveAvailability = async () => {
      try {
        const topDoctorResponse = await fetchFirstReachable('/doctors/top');
        if (!topDoctorResponse.ok) {
          return;
        }

        const topDoctor = (await topDoctorResponse.json()) as PublicTopDoctor | null;
        if (!topDoctor?.doctor_user_id) {
          return;
        }

        const dateFrom = new Date();
        const dateTo = new Date(dateFrom.getTime() + 13 * 24 * 60 * 60 * 1000);
        const query = new URLSearchParams({
          date_from: toIsoDate(dateFrom),
          date_to: toIsoDate(dateTo)
        });

        const availabilityResponse = await fetchFirstReachable(
          `/doctors/${topDoctor.doctor_user_id}/availability?${query.toString()}`
        );
        if (!availabilityResponse.ok) {
          return;
        }

        const slots = (await availabilityResponse.json()) as AvailabilityApiSlot[];
        const weeklyMap = toWeeklyAvailabilityFromApi(slots);
        if (active && hasAnyLiveAvailability(weeklyMap)) {
          setLiveWeeklyAvailability(weeklyMap);
        }
      } catch {
        // Keep demo fallback availability if live API isn't reachable.
      }
    };

    void loadLiveAvailability();
    return () => {
      active = false;
    };
  }, []);

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
              <AvailabilitySection weeklyAvailability={liveWeeklyAvailability} />
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
