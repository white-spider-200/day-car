import { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AvailabilitySection, { type AvailabilitySlot, type AvailabilitySlotSelection } from '../components/profile/AvailabilitySection';
import { weeklyAvailability as fallbackWeeklyAvailability } from '../data/doctorProfileData';
import { fetchFirstReachable, getBackendOrigin } from '../utils/api';
import { getStoredAuthRole, navigateTo } from '../utils/auth';

type DoctorDetails = {
  doctor_user_id: string;
  slug: string;
  display_name: string;
  headline: string | null;
  bio: string | null;
  approach_text: string | null;
  photo_url: string | null;
  specialties: string[] | null;
  languages: string[] | null;
  session_types: string[] | null;
  location_country: string | null;
  location_city: string | null;
  clinic_name: string | null;
  address_line: string | null;
  map_url: string | null;
  pricing_currency: string;
  pricing_per_session: number | string | null;
  follow_up_price: number | string | null;
  rating: number | string | null;
  reviews_count: number;
  years_experience: number | null;
  professional_type: 'PSYCHIATRIST' | 'THERAPIST' | null;
  can_prescribe_medication: boolean;
  role_badge: {
    professional_type: 'PSYCHIATRIST' | 'THERAPIST';
    title: string;
    icon: string;
    color: string;
    tooltip: string;
    clarification_note: string;
    capabilities: string[];
    medication_authority_warning: string;
    can_prescribe_medication: boolean;
  };
  education: Array<string | Record<string, unknown>> | null;
  certifications: string[] | null;
  availability_timezone: string | null;
  next_available_at: string | null;
  availability_preview_slots: string[] | null;
  verification_badges: string[] | null;
};

type AvailabilityApiSlot = {
  start_at: string;
  status?: 'available' | 'booked';
};

type DoctorReview = {
  appointment_id: string;
  rating: number;
  comment: string | null;
  submitted_at: string;
  author: string;
};

const WEEKDAY_ORDER: Array<'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'> = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getSlugFromPath(pathname: string): string {
  const chunks = pathname.split('/').filter(Boolean);
  if (chunks.length >= 2 && chunks[0] === 'doctors') {
    return decodeURIComponent(chunks[1]);
  }
  return '';
}

function toDisplayLines(value: Array<string | Record<string, unknown>> | null | undefined): string[] {
  if (!value) {
    return [];
  }
  return value
    .map((item) => {
      if (typeof item === 'string') {
        return item.trim();
      }
      if (typeof item === 'object' && item !== null) {
        const asRecord = item as Record<string, unknown>;
        for (const key of ['name', 'title', 'degree', 'value']) {
          const candidate = asRecord[key];
          if (typeof candidate === 'string' && candidate.trim()) {
            return candidate.trim();
          }
        }
        return JSON.stringify(asRecord);
      }
      return '';
    })
    .filter(Boolean);
}

function formatAmount(value: number | string | null, currency: string): string {
  if (value === null || value === '') {
    return 'Not specified';
  }
  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return `${value} ${currency}`;
  }
  return `${amount} ${currency}`;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function buildSessionPrices(basePrice: number, sessions: number): number[] {
  const prices: number[] = [];
  let current = basePrice;
  for (let index = 0; index < sessions; index += 1) {
    prices.push(roundMoney(current));
    current *= 0.8;
  }
  return prices;
}

function formatDateTime(isoValue: string): string {
  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) {
    return isoValue;
  }
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function resolveMediaUrl(url: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
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

function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function formatDateTimeLocal(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function nextDateTimeFromWeekdayAndTime(day: string, time: string): string {
  const [hoursRaw = '0', minutesRaw = '0'] = time.split(':');
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return '';
  }

  const dayIndexMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6
  };

  const now = new Date();
  const targetDayIndex = dayIndexMap[day];
  if (typeof targetDayIndex !== 'number') {
    const fallback = new Date();
    fallback.setHours(hours, minutes, 0, 0);
    if (fallback.getTime() < now.getTime()) {
      fallback.setDate(fallback.getDate() + 1);
    }
    return formatDateTimeLocal(fallback);
  }

  const candidate = new Date(now);
  candidate.setHours(hours, minutes, 0, 0);

  let daysAhead = (targetDayIndex - candidate.getDay() + 7) % 7;
  if (daysAhead === 0 && candidate.getTime() <= now.getTime()) {
    daysAhead = 7;
  }
  candidate.setDate(candidate.getDate() + daysAhead);
  return formatDateTimeLocal(candidate);
}

function toWeeklyAvailabilityFromApiSlots(
  slots: AvailabilityApiSlot[],
  timezone = 'Asia/Amman'
): Record<string, AvailabilitySlot[]> {
  const dayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: timezone });
  const timeFormatter = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone
  });

  const grouped = new Map<string, AvailabilitySlot[]>();
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
    const status: AvailabilitySlot['status'] = item.status === 'booked' ? 'booked' : 'available';
    const existing = grouped.get(day);
    if (!existing) {
      continue;
    }
    const existingIndex = existing.findIndex((slot) => slot.time === time);
    if (existingIndex === -1) {
      existing.push({ time, status });
      continue;
    }
    if (existing[existingIndex].status !== 'booked' && status === 'booked') {
      existing[existingIndex] = { time, status };
    }
  }

  const output: Record<string, AvailabilitySlot[]> = {};
  for (const day of WEEKDAY_ORDER) {
    const sorted = (grouped.get(day) ?? []).sort((a, b) => a.time.localeCompare(b.time));
    output[day] = sorted.slice(0, 4);
  }
  return output;
}

function hasAnyLiveAvailability(weeklyMap: Record<string, AvailabilitySlot[]>): boolean {
  return Object.values(weeklyMap).some((daySlots) => daySlots.length > 0);
}

export default function DoctorDetailsPage() {
  const [slug, setSlug] = useState(() => getSlugFromPath(window.location.pathname));
  const [doctor, setDoctor] = useState<DoctorDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedStartAts, setSelectedStartAts] = useState<string[]>([]);
  const [selectedSlotKeys, setSelectedSlotKeys] = useState<string[]>([]);
  const [packageSessions, setPackageSessions] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [liveWeeklyAvailability, setLiveWeeklyAvailability] = useState<Record<string, AvailabilitySlot[]>>(fallbackWeeklyAvailability);
  const [slotDateTimeMap, setSlotDateTimeMap] = useState<Record<string, string>>({});
  const [reviews, setReviews] = useState<DoctorReview[]>([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(false);
  const authRole = getStoredAuthRole();

  useEffect(() => {
    const onPopState = () => {
      setSlug(getSlugFromPath(window.location.pathname));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!slug) {
        if (!active) {
          return;
        }
        setDoctor(null);
        setIsNotFound(true);
        setIsLoading(false);
        setErrorMessage(null);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);
      setIsNotFound(false);

      try {
        const response = await fetchFirstReachable(`/doctors/slug/${encodeURIComponent(slug)}`);
        if (response.status === 404) {
          if (!active) {
            return;
          }
          setDoctor(null);
          setIsNotFound(true);
          return;
        }
        if (!response.ok) {
          throw new Error(`Failed to load doctor profile (${response.status})`);
        }
        const payload = (await response.json()) as DoctorDetails;
        if (!active) {
          return;
        }
        setDoctor(payload);
      } catch (error) {
        if (!active) {
          return;
        }
        setDoctor(null);
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load doctor profile');
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    let active = true;

    const loadAvailability = async () => {
      if (!doctor?.doctor_user_id) {
        if (active) {
          setLiveWeeklyAvailability(fallbackWeeklyAvailability);
        }
        return;
      }

      const timezone = doctor.availability_timezone ?? 'Asia/Amman';

      try {
        const dateFrom = new Date();
        const dateTo = new Date(dateFrom.getTime() + 13 * 24 * 60 * 60 * 1000);
        const query = new URLSearchParams({
          date_from: toIsoDate(dateFrom),
          date_to: toIsoDate(dateTo)
        });
        const response = await fetchFirstReachable(
          `/doctors/${doctor.doctor_user_id}/availability?${query.toString()}`
        );

        if (response.ok) {
          const payload = (await response.json()) as AvailabilityApiSlot[];
          const dayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: timezone });
          const timeFormatter = new Intl.DateTimeFormat('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: timezone
          });
          const nextSlotMap: Record<string, string> = {};
          payload.forEach((item) => {
            const date = new Date(item.start_at);
            if (Number.isNaN(date.getTime())) {
              return;
            }
            const day = dayFormatter.format(date);
            const slotTime = timeFormatter.format(date);
            const key = `${day}-${slotTime}`;
            if (!nextSlotMap[key]) {
              nextSlotMap[key] = formatDateTimeLocal(date);
            }
          });
          if (active) {
            setSlotDateTimeMap(nextSlotMap);
          }
          const fromApi = toWeeklyAvailabilityFromApiSlots(payload, timezone);
          if (active && hasAnyLiveAvailability(fromApi)) {
            setLiveWeeklyAvailability(fromApi);
            return;
          }
        }
      } catch {
        // Fallback to preview slots below.
      }

      const previewIsoSlots = doctor.availability_preview_slots && doctor.availability_preview_slots.length > 0
        ? doctor.availability_preview_slots
        : doctor.next_available_at
          ? [doctor.next_available_at]
          : [];
      const fromPreview = toWeeklyAvailabilityFromApiSlots(
        previewIsoSlots.map((start_at) => ({ start_at, status: 'available' })),
        timezone
      );
      if (active) {
        const dayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: timezone });
        const timeFormatter = new Intl.DateTimeFormat('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: timezone
        });
        const nextSlotMap: Record<string, string> = {};
        previewIsoSlots.forEach((value) => {
          const date = new Date(value);
          if (Number.isNaN(date.getTime())) {
            return;
          }
          const day = dayFormatter.format(date);
          const slotTime = timeFormatter.format(date);
          const key = `${day}-${slotTime}`;
          if (!nextSlotMap[key]) {
            nextSlotMap[key] = formatDateTimeLocal(date);
          }
        });
        setSlotDateTimeMap(nextSlotMap);
        setLiveWeeklyAvailability(hasAnyLiveAvailability(fromPreview) ? fromPreview : fallbackWeeklyAvailability);
      }
    };

    void loadAvailability();
    return () => {
      active = false;
    };
  }, [doctor?.doctor_user_id, doctor?.availability_timezone, doctor?.availability_preview_slots, doctor?.next_available_at]);

  useEffect(() => {
    setSelectedStartAts((prev) => prev.slice(0, packageSessions));
    setSelectedSlotKeys((prev) => prev.slice(0, packageSessions));
  }, [packageSessions]);

  useEffect(() => {
    let active = true;

    const loadReviews = async () => {
      if (!doctor?.doctor_user_id) {
        if (active) {
          setReviews([]);
        }
        return;
      }

      setIsReviewsLoading(true);
      try {
        const response = await fetchFirstReachable(`/doctors/${doctor.doctor_user_id}/reviews`);
        if (!response.ok) {
          throw new Error(`Failed to load doctor reviews (${response.status})`);
        }
        const payload = (await response.json()) as DoctorReview[];
        if (active) {
          setReviews(payload);
        }
      } catch {
        if (active) {
          setReviews([]);
        }
      } finally {
        if (active) {
          setIsReviewsLoading(false);
        }
      }
    };

    void loadReviews();
    return () => {
      active = false;
    };
  }, [doctor?.doctor_user_id]);

  const educationLines = useMemo(() => toDisplayLines(doctor?.education), [doctor?.education]);
  const certifications = useMemo(() => doctor?.certifications ?? [], [doctor?.certifications]);
  const specialties = useMemo(() => doctor?.specialties ?? [], [doctor?.specialties]);
  const languages = useMemo(() => doctor?.languages ?? [], [doctor?.languages]);
  const sessionTypes = useMemo(() => doctor?.session_types ?? [], [doctor?.session_types]);
  const doctorPhotoUrl = useMemo(() => resolveMediaUrl(doctor?.photo_url ?? null), [doctor?.photo_url]);
  const packagePricing = useMemo(() => {
    const base = Number(doctor?.pricing_per_session ?? 0);
    if (Number.isNaN(base) || base <= 0) {
      return {
        currency: doctor?.pricing_currency ?? 'JOD',
        sessionPrices: [] as number[],
        total: 0,
        savings: 0
      };
    }
    const sessionPrices = buildSessionPrices(base, packageSessions);
    const total = roundMoney(sessionPrices.reduce((sum, value) => sum + value, 0));
    const original = roundMoney(base * packageSessions);
    const savings = roundMoney(original - total);
    return {
      currency: doctor?.pricing_currency ?? 'JOD',
      sessionPrices,
      total,
      savings
    };
  }, [doctor?.pricing_currency, doctor?.pricing_per_session, packageSessions]);
  const handleAvailabilitySlotSelect = ({ day, time }: AvailabilitySlotSelection) => {
    const key = `${day}-${time}`;
    const mapped = slotDateTimeMap[key];
    const startAt = mapped || nextDateTimeFromWeekdayAndTime(day, time);
    if (!startAt) {
      return;
    }
    setSelectedSlotKeys((prev) => {
      const existingIndex = prev.indexOf(key);
      if (existingIndex >= 0) {
        setSelectedStartAts((current) => current.filter((_, index) => index !== existingIndex));
        setBookingError(null);
        return prev.filter((_, index) => index !== existingIndex);
      }
      if (prev.length >= packageSessions) {
        setBookingError(`You can select up to ${packageSessions} slot${packageSessions === 1 ? '' : 's'}.`);
        return prev;
      }
      setSelectedStartAts((current) => [...current, startAt]);
      setBookingError(null);
      return [...prev, key];
    });
  };

  const continueToBookingFlow = () => {
    if (!doctor) {
      return;
    }
    if (selectedStartAts.length !== packageSessions) {
      setBookingError(`Please select ${packageSessions} slot${packageSessions === 1 ? '' : 's'} from Availability.`);
      return;
    }
    const firstSelected = selectedStartAts[0];
    if (!firstSelected || !firstSelected.includes('T')) {
      setBookingError('Please choose valid date and time slots.');
      return;
    }
    const [datePart, timePartRaw] = firstSelected.split('T');
    const timePart = timePartRaw?.slice(0, 5) ?? '';
    if (!datePart || timePart.length < 5) {
      setBookingError('Please choose valid date and time slots.');
      return;
    }

    const query = new URLSearchParams({
      date: datePart,
      time: timePart,
      doctor_user_id: doctor.doctor_user_id,
      doctor_slug: doctor.slug,
      package_sessions: String(packageSessions),
      slot_starts: selectedStartAts.join(','),
      doctor_preferences: (sessionTypes.length > 0 ? sessionTypes : ['Not specified']).join('|')
    });
    navigateTo(`/booking/confirm?${query.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/40 via-white to-white text-textMain">
      <Header
        brandHref="/home"
        navItems={[
          { labelKey: 'nav.doctors', href: '/home#featured-doctors' },
          { labelKey: 'nav.howItWorks', href: '/home#how-it-works' },
          { labelKey: 'nav.forDoctors', href: '/home#for-doctors' },
          { labelKey: 'nav.about', href: '/about' },
        ]}
      />

      <main className="section-shell py-8">
        {isLoading && (
          <section className="rounded-hero border border-borderGray bg-white p-6 shadow-card">
            <p className="text-sm font-medium text-muted">Loading doctor profile...</p>
          </section>
        )}

        {!isLoading && isNotFound && (
          <section className="rounded-hero border border-borderGray bg-white p-6 shadow-card">
            <h1 className="text-2xl font-black text-textMain">Doctor not found</h1>
            <p className="mt-2 text-sm text-muted">The doctor profile you requested does not exist.</p>
          </section>
        )}

        {!isLoading && !isNotFound && errorMessage && (
          <section className="rounded-hero border border-amber-200 bg-amber-50 p-6 shadow-card">
            <p className="text-sm font-medium text-amber-800">{errorMessage}</p>
          </section>
        )}

        {!isLoading && !isNotFound && doctor && (
          <div className="space-y-6">
            <section className="rounded-hero border border-borderGray bg-white p-6 shadow-card sm:p-7">
              <div className="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)] md:items-start">
                <div className="overflow-hidden rounded-[28px] border border-borderGray bg-slate-50 shadow-soft">
                  {doctorPhotoUrl ? (
                    <img src={doctorPhotoUrl} alt={doctor.display_name} className="aspect-[4/5] w-full object-cover" />
                  ) : (
                    <div className="flex aspect-[4/5] w-full items-center justify-center text-sm text-muted">No image</div>
                  )}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black tracking-wide text-primary">Doctor Profile</span>
                    {(doctor.verification_badges ?? []).includes('VERIFIED_DOCTOR') && (
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Verified
                      </span>
                    )}
                  </div>
                  <h1 className="mt-2 text-3xl font-black tracking-tight text-textMain">{doctor.display_name}</h1>
                  <p className="mt-2 text-base font-semibold text-primary break-words [overflow-wrap:anywhere]">
                    {doctor.headline ?? 'Therapist'}
                  </p>
                  <article className="mt-4 rounded-2xl border border-borderGray bg-slate-50 px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black tracking-wide ${
                          doctor.role_badge.color === 'blue'
                            ? 'bg-sky-100 text-sky-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {doctor.role_badge.icon} {doctor.role_badge.title}
                      </span>
                      <span className="rounded-full border border-borderGray bg-white px-3 py-1 text-xs font-semibold text-muted">
                        {doctor.professional_type ?? 'N/A'}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted break-words [overflow-wrap:anywhere]">
                      {doctor.role_badge.clarification_note}
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {doctor.role_badge.capabilities.map((capability) => (
                        <li key={capability} className="rounded-full border border-borderGray bg-white px-3 py-1 text-xs text-textMain">
                          {capability}
                        </li>
                      ))}
                    </ul>
                  </article>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      { label: 'Rating', value: `${doctor.rating ?? 'N/A'} / 5` },
                      { label: 'Reviews', value: `${doctor.reviews_count}` },
                      { label: 'Experience', value: `${doctor.years_experience ?? 'N/A'} years` },
                      {
                        label: 'Next Available',
                        value: doctor.next_available_at ? formatDateTime(doctor.next_available_at) : 'Not listed',
                      },
                    ].map((item) => (
                      <article key={item.label} className="rounded-xl border border-borderGray bg-primaryBg/60 px-3 py-2.5">
                        <p className="text-[11px] font-black uppercase tracking-wide text-primary/70">{item.label}</p>
                        <p className="mt-1 text-sm font-semibold text-textMain">{item.value}</p>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:items-start">
              <div className="space-y-6">
                <section className="rounded-hero border border-borderGray bg-white p-6 shadow-card">
                  <h2 className="text-xl font-black text-textMain">About</h2>
                  <p className="mt-3 text-sm leading-7 text-muted break-words [overflow-wrap:anywhere]">
                    {doctor.bio ?? 'No biography provided yet.'}
                  </p>
                </section>

                <section className="rounded-hero border border-borderGray bg-white p-6 shadow-card">
                  <h2 className="text-xl font-black text-textMain">Therapy Approach</h2>
                  <p className="mt-3 text-sm leading-7 text-muted break-words [overflow-wrap:anywhere]">
                    {doctor.approach_text ?? 'No approach details provided yet.'}
                  </p>
                </section>

                <section className="rounded-hero border border-borderGray bg-white p-6 shadow-card">
                  <h2 className="text-xl font-black text-textMain">Patient Feedback</h2>
                  <p className="mt-2 text-sm text-muted">
                    {doctor.rating ? `${doctor.rating} / 5 average` : 'No rating yet'} • {doctor.reviews_count} reviews
                  </p>
                  {isReviewsLoading ? (
                    <p className="mt-4 text-sm text-muted">Loading feedback...</p>
                  ) : reviews.length === 0 ? (
                    <p className="mt-4 text-sm text-muted">No feedback comments yet.</p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {reviews.map((review) => (
                        <article key={review.appointment_id} className="rounded-xl border border-borderGray bg-slate-50 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-bold text-textMain">{review.author}</p>
                            <p className="text-xs font-semibold text-amber-700">
                              {'★'.repeat(Math.max(1, Math.min(5, Math.round(review.rating))))}
                              <span className="ml-2 text-muted">{formatDateTime(review.submitted_at)}</span>
                            </p>
                          </div>
                          <p className="mt-2 text-sm text-muted break-words [overflow-wrap:anywhere]">
                            {review.comment?.trim() ? review.comment : 'No written comment.'}
                          </p>
                        </article>
                      ))}
                    </div>
                  )}
                </section>

                <section className="rounded-hero border border-borderGray bg-white p-6 shadow-card">
                  <h2 className="text-xl font-black text-textMain">Specialties</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(specialties.length > 0 ? specialties : ['Not specified']).map((item) => (
                      <span key={item} className="rounded-full bg-primaryBg px-3 py-1 text-xs font-semibold text-primary">
                        {item}
                      </span>
                    ))}
                  </div>
                </section>

                <section className="rounded-hero border border-borderGray bg-white p-6 shadow-card">
                  <h2 className="text-xl font-black text-textMain">Education & Certifications</h2>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <article>
                      <h3 className="text-sm font-bold text-textMain">Education</h3>
                      <ul className="mt-2 space-y-2">
                        {(educationLines.length > 0 ? educationLines : ['No education entries provided']).map((item) => (
                          <li key={item} className="rounded-lg border border-borderGray bg-slate-50 px-3 py-2 text-sm text-muted">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </article>
                    <article>
                      <h3 className="text-sm font-bold text-textMain">Certifications</h3>
                      <ul className="mt-2 space-y-2">
                        {(certifications.length > 0 ? certifications : ['No certifications provided']).map((item) => (
                          <li key={item} className="rounded-lg border border-borderGray bg-slate-50 px-3 py-2 text-sm text-muted">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </article>
                  </div>
                </section>

                <AvailabilitySection
                  weeklyAvailability={liveWeeklyAvailability}
                  onSlotSelect={handleAvailabilitySlotSelect}
                  selectedSlotKeys={selectedSlotKeys}
                />
              </div>

              <aside className="space-y-6 lg:sticky lg:top-24">
                <section className="rounded-hero border border-borderGray bg-white p-6 shadow-card">
                  <h2 className="text-xl font-black text-textMain">Quick Info</h2>
                  <div className="mt-4 grid gap-3">
                    <article className="rounded-xl border border-borderGray bg-slate-50 px-4 py-3">
                      <p className="text-xs font-black uppercase tracking-wide text-muted">Location</p>
                      <p className="mt-1 text-sm text-textMain break-words [overflow-wrap:anywhere]">
                        {[doctor.clinic_name, doctor.address_line, doctor.location_city, doctor.location_country].filter(Boolean).join(' • ') ||
                          'Not specified'}
                      </p>
                      {doctor.map_url && (
                        <a className="mt-2 inline-block text-xs font-semibold text-primary hover:text-primaryDark" href={doctor.map_url} target="_blank" rel="noreferrer">
                          Open map
                        </a>
                      )}
                    </article>

                    <article className="rounded-xl border border-borderGray bg-slate-50 px-4 py-3">
                      <p className="text-xs font-black uppercase tracking-wide text-muted">Languages</p>
                      <p className="mt-1 text-sm text-textMain">{languages.length > 0 ? languages.join(' • ') : 'Not specified'}</p>
                    </article>

                    <article className="rounded-xl border border-borderGray bg-slate-50 px-4 py-3">
                      <p className="text-xs font-black uppercase tracking-wide text-muted">Session Types</p>
                      <p className="mt-1 text-sm text-textMain">{sessionTypes.length > 0 ? sessionTypes.join(' • ') : 'Not specified'}</p>
                    </article>

                    <article className="rounded-xl border border-borderGray bg-slate-50 px-4 py-3">
                      <p className="text-xs font-black uppercase tracking-wide text-muted">Pricing</p>
                      <p className="mt-1 text-sm text-textMain">Session: {formatAmount(doctor.pricing_per_session, doctor.pricing_currency)}</p>
                      <p className="mt-1 text-sm text-textMain">Follow-up: {formatAmount(doctor.follow_up_price, doctor.pricing_currency)}</p>
                    </article>
                  </div>
                </section>

                <section className="rounded-hero border border-borderGray bg-white p-6 shadow-card">
                  <h2 className="text-xl font-black text-textMain">Number of Appointments</h2>
                  <p className="mt-2 text-sm text-muted">
                    Choose how many sessions you want, then confirm date to continue to payment.
                  </p>
                  <div className="mt-4 grid gap-3">
                    <fieldset>
                      <legend className="text-xs font-semibold uppercase tracking-wide text-muted">Appointments</legend>
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {([1, 2, 3, 4, 5, 6] as const).map((count) => (
                          <button
                            key={count}
                            type="button"
                            onClick={() => setPackageSessions(count)}
                            className={`focus-outline h-11 rounded-xl border text-sm font-semibold transition ${
                              packageSessions === count
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-borderGray bg-white text-textMain hover:border-primary/40'
                            }`}
                          >
                            {count} {count === 1 ? 'Session' : 'Sessions'}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                    <div className="rounded-xl border border-borderGray bg-slate-50 px-3 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                        Selected Slots ({selectedStartAts.length}/{packageSessions})
                      </p>
                      {selectedStartAts.length > 0 ? (
                        <ul className="mt-2 space-y-1">
                          {selectedStartAts.map((slot) => (
                            <li key={slot} className="text-sm text-textMain">
                              {formatDateTime(slot)}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-sm text-muted">Select your slots from the Availability section.</p>
                      )}
                    </div>
                    <div className="rounded-xl border border-borderGray bg-slate-50 px-3 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Selected Package</p>
                      <p className="mt-1 text-sm font-semibold text-textMain">
                        {packageSessions} {packageSessions === 1 ? 'Session' : 'Sessions'}
                      </p>
                      {packagePricing.sessionPrices.length > 0 && (
                        <>
                          <p className="mt-1 text-sm text-textMain">
                            Total: {packagePricing.total.toFixed(2)} {packagePricing.currency}
                          </p>
                          {packageSessions > 1 && (
                            <p className="mt-1 text-xs text-emerald-700">
                              Savings: {packagePricing.savings.toFixed(2)} {packagePricing.currency}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                    {authRole === 'USER' ? (
                      <button
                        type="button"
                        onClick={continueToBookingFlow}
                        className="focus-outline inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primaryDark"
                      >
                        Confirm Date & Continue to Payment
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => navigateTo('/login')}
                        className="focus-outline inline-flex h-11 items-center justify-center rounded-xl border border-borderGray px-5 text-sm font-semibold text-textMain transition hover:border-primary/40 hover:text-primary"
                      >
                        Sign In to Book
                      </button>
                    )}
                  </div>
                  {bookingError && (
                    <p className="mt-3 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                      {bookingError}
                    </p>
                  )}
                </section>
              </aside>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
