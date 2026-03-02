import { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { ApiError, apiJson, apiRequest, fetchFirstReachable } from '../utils/api';
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
  education: Array<string | Record<string, unknown>> | null;
  certifications: string[] | null;
  availability_timezone: string | null;
  next_available_at: string | null;
  availability_preview_slots: string[] | null;
  verification_badges: string[] | null;
};

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
  const env = import.meta.env as Record<string, string | boolean | undefined>;
  const envBase = typeof env.VITE_API_BASE_URL === 'string' ? env.VITE_API_BASE_URL.trim() : '';
  const fallbackBase =
    typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:8000` : 'http://localhost:8000';
  const base = (envBase && envBase !== '/api' ? envBase : fallbackBase).replace(/\/+$/, '').replace(/\/api$/, '');
  return `${base}${path}`;
}

export default function DoctorDetailsPage() {
  const [slug, setSlug] = useState(() => getSlugFromPath(window.location.pathname));
  const [doctor, setDoctor] = useState<DoctorDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedStartAt, setSelectedStartAt] = useState('');
  const [bookingMessage, setBookingMessage] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingBusy, setBookingBusy] = useState(false);
  const [conflictingAppointmentId, setConflictingAppointmentId] = useState<string | null>(null);
  const [waitingListPosition, setWaitingListPosition] = useState<number | null>(null);
  const [treatmentMessage, setTreatmentMessage] = useState('');
  const [treatmentBusy, setTreatmentBusy] = useState(false);
  const [treatmentStatus, setTreatmentStatus] = useState<string | null>(null);
  const [directMessageBody, setDirectMessageBody] = useState('');
  const [directMessageBusy, setDirectMessageBusy] = useState(false);
  const [directMessageStatus, setDirectMessageStatus] = useState<string | null>(null);
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

  const educationLines = useMemo(() => toDisplayLines(doctor?.education), [doctor?.education]);
  const certifications = useMemo(() => doctor?.certifications ?? [], [doctor?.certifications]);
  const specialties = useMemo(() => doctor?.specialties ?? [], [doctor?.specialties]);
  const languages = useMemo(() => doctor?.languages ?? [], [doctor?.languages]);
  const sessionTypes = useMemo(() => doctor?.session_types ?? [], [doctor?.session_types]);
  const doctorPhotoUrl = useMemo(() => resolveMediaUrl(doctor?.photo_url ?? null), [doctor?.photo_url]);
  const availabilitySlots = useMemo(() => {
    if (doctor?.availability_preview_slots && doctor.availability_preview_slots.length > 0) {
      return doctor.availability_preview_slots;
    }
    if (doctor?.next_available_at) {
      return [doctor.next_available_at];
    }
    return [];
  }, [doctor?.availability_preview_slots, doctor?.next_available_at]);

  const createBooking = async () => {
    if (!doctor) {
      return;
    }
    const localDate = new Date(selectedStartAt);
    if (Number.isNaN(localDate.getTime())) {
      setBookingError('Please choose a valid date and time.');
      return;
    }
    setBookingBusy(true);
    setBookingMessage(null);
    setBookingError(null);
    setConflictingAppointmentId(null);
    setWaitingListPosition(null);

    try {
      const response = await apiRequest(
        '/appointments/request',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            doctor_user_id: doctor.doctor_user_id,
            start_at: localDate.toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          })
        },
        true
      );

      if (response.ok) {
        setBookingMessage('Appointment request sent. The doctor will confirm shortly.');
        return;
      }

      const responseBody = (await response.json().catch(() => null)) as
        | { detail?: string | { message?: string; conflicting_appointment_id?: string | null } }
        | null;
      if (
        response.status === 409 &&
        responseBody &&
        typeof responseBody.detail === 'object' &&
        responseBody.detail !== null
      ) {
        const conflictId = responseBody.detail.conflicting_appointment_id;
        if (typeof conflictId === 'string' && conflictId) {
          setConflictingAppointmentId(conflictId);
          setBookingError('This slot is full. You can join the waiting list for this appointment.');
          return;
        }
      }
      const detail =
        typeof responseBody?.detail === 'string'
          ? responseBody.detail
          : typeof responseBody?.detail === 'object' && responseBody?.detail?.message
            ? responseBody.detail.message
            : `Booking failed (${response.status})`;
      setBookingError(detail);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setBookingError('Please sign in as a user to book an appointment.');
      } else {
        setBookingError(error instanceof Error ? error.message : 'Booking failed');
      }
    } finally {
      setBookingBusy(false);
    }
  };

  const joinWaitingList = async () => {
    if (!conflictingAppointmentId) {
      return;
    }
    setBookingBusy(true);
    setBookingError(null);
    setBookingMessage(null);
    try {
      const payload = await apiJson<{ position: number }>(
        `/appointments/${conflictingAppointmentId}/waiting-list`,
        { method: 'POST' },
        true,
        'Failed to join waiting list'
      );
      setWaitingListPosition(payload.position);
      setBookingMessage(`Joined waiting list successfully. Your position is ${payload.position}.`);
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : 'Failed to join waiting list');
    } finally {
      setBookingBusy(false);
    }
  };

  const submitTreatmentRequest = async () => {
    if (!doctor) {
      return;
    }
    const message = treatmentMessage.trim();
    if (message.length < 5) {
      setTreatmentStatus('Please enter at least 5 characters.');
      return;
    }
    setTreatmentBusy(true);
    setTreatmentStatus(null);
    try {
      await apiJson(
        '/treatment-requests',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            doctor_id: doctor.doctor_user_id,
            message
          })
        },
        true,
        'Failed to submit treatment request'
      );
      setTreatmentMessage('');
      setTreatmentStatus('Treatment request sent successfully.');
    } catch (error) {
      setTreatmentStatus(error instanceof Error ? error.message : 'Failed to submit treatment request');
    } finally {
      setTreatmentBusy(false);
    }
  };

  const sendDirectMessage = async () => {
    if (!doctor) {
      return;
    }
    const body = directMessageBody.trim();
    if (body.length < 3) {
      setDirectMessageStatus('Please write at least 3 characters.');
      return;
    }

    setDirectMessageBusy(true);
    setDirectMessageStatus(null);
    try {
      await apiJson(
        '/messages',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receiver_user_id: doctor.doctor_user_id,
            subject: `Message from profile: ${doctor.display_name}`,
            body,
          }),
        },
        true,
        'Failed to send message'
      );
      setDirectMessageBody('');
      setDirectMessageStatus('Message sent successfully.');
    } catch (error) {
      setDirectMessageStatus(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setDirectMessageBusy(false);
    }
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
            <section className="rounded-hero border border-borderGray bg-white p-6 shadow-card">
              <div className="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
                <div className="overflow-hidden rounded-[28px] border border-borderGray bg-slate-50">
                  {doctorPhotoUrl ? (
                    <img src={doctorPhotoUrl} alt={doctor.display_name} className="aspect-square w-full object-cover" />
                  ) : (
                    <div className="flex aspect-square w-full items-center justify-center text-sm text-muted">No image</div>
                  )}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-3xl font-black tracking-tight text-textMain">{doctor.display_name}</h1>
                    {(doctor.verification_badges ?? []).includes('VERIFIED_DOCTOR') && (
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-base font-semibold text-primary break-words [overflow-wrap:anywhere]">
                    {doctor.headline ?? 'Therapist'}
                  </p>
                  <p className="mt-3 text-sm text-muted">
                    Rating: {doctor.rating ?? 'N/A'} ({doctor.reviews_count} reviews)
                  </p>
                  <p className="mt-1 text-sm text-muted">Experience: {doctor.years_experience ?? 'N/A'} years</p>
                </div>
              </div>
            </section>

            <section className="rounded-hero border border-borderGray bg-white p-6 shadow-card">
              <h2 className="text-xl font-black text-textMain">Quick Info</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
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
              <h2 className="text-xl font-black text-textMain">Specialties</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {(specialties.length > 0 ? specialties : ['Not specified']).map((item) => (
                  <span key={item} className="rounded-full border border-borderGray bg-slate-50 px-3 py-1 text-xs font-semibold text-muted">
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

            <section className="rounded-hero border border-borderGray bg-white p-6 shadow-card">
              <h2 className="text-xl font-black text-textMain">Availability Preview</h2>
              <p className="mt-2 text-sm text-muted">
                Timezone: {doctor.availability_timezone ?? 'Not specified'}
              </p>
              <ul className="mt-3 space-y-2">
                {(availabilitySlots.length > 0 ? availabilitySlots : ['No upcoming slots']).map((slot) => (
                  <li key={slot} className="rounded-lg border border-borderGray bg-slate-50 px-3 py-2 text-sm text-muted">
                    {slot.includes('T') ? formatDateTime(slot) : slot}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-hero border border-borderGray bg-white p-6 shadow-card">
              <h2 className="text-xl font-black text-textMain">Book Appointment</h2>
              <p className="mt-2 text-sm text-muted">
                Select your preferred session time. If a slot is full, you can join the waiting list.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Start At
                  <input
                    type="datetime-local"
                    value={selectedStartAt}
                    onChange={(event) => setSelectedStartAt(event.target.value)}
                    className="mt-1 h-11 w-full rounded-xl border border-borderGray bg-white px-3 text-sm text-textMain"
                  />
                </label>
                {authRole === 'USER' ? (
                  <button
                    type="button"
                    onClick={() => void createBooking()}
                    disabled={bookingBusy}
                    className="focus-outline inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primaryDark disabled:opacity-60"
                  >
                    {bookingBusy ? 'Submitting...' : 'Request Appointment'}
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

              {conflictingAppointmentId && authRole === 'USER' && (
                <button
                  type="button"
                  onClick={() => void joinWaitingList()}
                  disabled={bookingBusy}
                  className="mt-3 rounded-xl border border-primary/30 bg-primary-50 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary-100 disabled:opacity-60"
                >
                  {bookingBusy ? 'Joining...' : 'Join Waiting List'}
                </button>
              )}

              {waitingListPosition !== null && (
                <p className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  Your waiting list position is {waitingListPosition}.
                </p>
              )}
              {bookingMessage && (
                <p className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {bookingMessage}
                </p>
              )}
              {bookingError && (
                <p className="mt-3 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {bookingError}
                </p>
              )}
            </section>

            <section className="rounded-hero border border-borderGray bg-white p-6 shadow-card">
              <h2 className="text-xl font-black text-textMain">Treatment Request</h2>
              <p className="mt-2 text-sm text-muted">
                Send a direct treatment request. The doctor can accept or decline from their dashboard.
              </p>
              <textarea
                rows={4}
                value={treatmentMessage}
                onChange={(event) => setTreatmentMessage(event.target.value)}
                placeholder="Briefly describe your treatment goals..."
                className="mt-3 w-full rounded-xl border border-borderGray bg-white px-3 py-2 text-sm text-textMain"
              />
              {authRole === 'USER' ? (
                <button
                  type="button"
                  onClick={() => void submitTreatmentRequest()}
                  disabled={treatmentBusy}
                  className="mt-3 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primaryDark disabled:opacity-60"
                >
                  {treatmentBusy ? 'Sending...' : 'Send Treatment Request'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigateTo('/login')}
                  className="mt-3 rounded-xl border border-borderGray px-4 py-2 text-sm font-semibold text-textMain transition hover:border-primary/40 hover:text-primary"
                >
                  Sign In as User
                </button>
              )}
              {treatmentStatus && (
                <p className="mt-3 rounded-lg border border-borderGray bg-slate-50 px-3 py-2 text-sm text-textMain">
                  {treatmentStatus}
                </p>
              )}
            </section>

            <section className="rounded-hero border border-borderGray bg-white p-6 shadow-card">
              <h2 className="text-xl font-black text-textMain">Message Doctor</h2>
              <p className="mt-2 text-sm text-muted">
                Send a direct message to this doctor from their profile page.
              </p>
              <textarea
                rows={4}
                value={directMessageBody}
                onChange={(event) => setDirectMessageBody(event.target.value)}
                placeholder="Write your message..."
                className="mt-3 w-full rounded-xl border border-borderGray bg-white px-3 py-2 text-sm text-textMain"
              />
              {authRole === 'USER' ? (
                <button
                  type="button"
                  onClick={() => void sendDirectMessage()}
                  disabled={directMessageBusy}
                  className="mt-3 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primaryDark disabled:opacity-60"
                >
                  {directMessageBusy ? 'Sending...' : 'Send Message'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigateTo('/login')}
                  className="mt-3 rounded-xl border border-borderGray px-4 py-2 text-sm font-semibold text-textMain transition hover:border-primary/40 hover:text-primary"
                >
                  Sign In as User
                </button>
              )}
              {directMessageStatus && (
                <p className="mt-3 rounded-lg border border-borderGray bg-slate-50 px-3 py-2 text-sm text-textMain">
                  {directMessageStatus}
                </p>
              )}
            </section>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
