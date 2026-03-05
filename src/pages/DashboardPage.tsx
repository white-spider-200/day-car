import { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import TimelineFeed from '../components/TimelineFeed';
import { ApiError, apiJson } from '../utils/api';
import { getStoredAuthEmail, navigateTo } from '../utils/auth';

type AppointmentStatus = 'REQUESTED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
type AppointmentCallStatus = 'NOT_READY' | 'READY' | 'LIVE' | 'ENDED';
type TreatmentRequestStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

type Appointment = {
  id: string;
  doctor_user_id: string;
  user_id: string;
  start_at: string;
  end_at: string;
  timezone: string;
  status: AppointmentStatus;
  meeting_link: string | null;
  call_provider: string | null;
  call_room_id: string | null;
  call_status: AppointmentCallStatus;
  fee_paid: boolean;
  notes: string | null;
  feedback_rating: number | null;
  feedback_comment: string | null;
  feedback_submitted_at: string | null;
  created_at: string;
};

type PaymentInitResponse = {
  payment: {
    id: string;
  };
  quote: {
    package_sessions: number;
    discount_percent: string | number;
    base_session_price: string | number;
    currency: string;
    original_total: string | number;
    discounted_total: string | number;
    total_savings: string | number;
    session_prices: Array<string | number>;
  };
  checkout_url: string;
  client_token: string;
};

type PublicDoctor = {
  doctor_user_id: string;
  slug: string;
  display_name: string;
  headline: string | null;
  specialties: string[] | null;
  location_city: string | null;
  location_country: string | null;
  pricing_currency: string;
  pricing_per_session: string | number | null;
};

type PackageSessions = 1 | 4;

function toMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function computePackagePricing(basePrice: number, sessions: PackageSessions) {
  const sessionPrices: number[] = [];
  let current = basePrice;
  for (let i = 0; i < sessions; i += 1) {
    sessionPrices.push(toMoney(current));
    current *= 0.8;
  }
  const originalTotal = toMoney(basePrice * sessions);
  const discountedTotal = toMoney(sessionPrices.reduce((sum, price) => sum + price, 0));
  const totalSavings = toMoney(originalTotal - discountedTotal);
  return { sessionPrices, originalTotal, discountedTotal, totalSavings };
}

type TreatmentRequest = {
  id: string;
  doctor_id: string;
  user_id: string;
  status: TreatmentRequestStatus;
  message: string;
  doctor_note: string | null;
  doctor_display_name: string | null;
  created_at: string;
  updated_at: string;
};

type MessageItem = {
  id: string;
  sender_user_id: string;
  receiver_user_id: string;
  body: string;
  created_at: string;
};

const DISMISSED_USER_CANCELLED_APPOINTMENTS_KEY = 'user_dashboard_dismissed_cancelled_appointments';

function filterDismissedCancelledAppointments(items: Appointment[], dismissedIds: Set<string>): Appointment[] {
  return items.filter((item) => !(item.status === 'CANCELLED' && dismissedIds.has(item.id)));
}

function statusClass(status: AppointmentStatus): string {
  if (status === 'CONFIRMED') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (status === 'REQUESTED') return 'bg-amber-50 text-amber-700 border-amber-100';
  if (status === 'COMPLETED') return 'bg-slate-100 text-slate-700 border-slate-200';
  if (status === 'NO_SHOW') return 'bg-amber-50 text-amber-700 border-amber-100';
  return 'bg-rose-50 text-rose-700 border-rose-100';
}

function statusLabel(status: AppointmentStatus): string {
  if (status === 'REQUESTED') {
    return 'Waiting Response';
  }
  if (status === 'NO_SHOW') {
    return 'No Show';
  }
  return status[0] + status.slice(1).toLowerCase();
}

function timelineDotClass(status: AppointmentStatus): string {
  if (status === 'CONFIRMED') return 'bg-emerald-500 ring-emerald-100';
  if (status === 'REQUESTED') return 'bg-amber-500 ring-amber-100';
  if (status === 'COMPLETED') return 'bg-slate-500 ring-slate-100';
  if (status === 'NO_SHOW') return 'bg-amber-600 ring-amber-100';
  return 'bg-rose-500 ring-rose-100';
}

function formatDate(isoValue: string): string {
  const ms = toTime(isoValue);
  if (Number.isNaN(ms)) {
    return isoValue;
  }
  const date = new Date(ms);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function canCancel(status: AppointmentStatus): boolean {
  return status === 'REQUESTED' || status === 'CONFIRMED';
}

function toTime(value: string): number {
  const raw = value.trim();
  const parsed = Date.parse(raw);
  if (!Number.isNaN(parsed)) {
    return parsed;
  }

  // Some backends emit "YYYY-MM-DD HH:mm:ss+00:00"; normalize to ISO.
  const normalized = raw.replace(' ', 'T');
  return Date.parse(normalized);
}

function canJoinVideoNow(appointment: Appointment): boolean {
  const start = toTime(appointment.start_at);
  const end = toTime(appointment.end_at);
  const now = Date.now();
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return false;
  }
  return now >= start - 15 * 60 * 1000 && now <= end + 120 * 60 * 1000;
}

function isZoomAppointment(appointment: Appointment): boolean {
  return (appointment.call_provider ?? '').toUpperCase() === 'ZOOM' && Boolean(appointment.meeting_link);
}

function treatmentStatusClass(status: TreatmentRequestStatus): string {
  if (status === 'ACCEPTED') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (status === 'DECLINED') return 'bg-rose-50 text-rose-700 border-rose-100';
  return 'bg-amber-50 text-amber-700 border-amber-100';
}

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<PublicDoctor[]>([]);
  const [treatmentRequests, setTreatmentRequests] = useState<TreatmentRequest[]>([]);
  const [inboxMessages, setInboxMessages] = useState<MessageItem[]>([]);
  const [outboxMessages, setOutboxMessages] = useState<MessageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busyAppointmentId, setBusyAppointmentId] = useState<string | null>(null);
  const [busyPaymentId, setBusyPaymentId] = useState<string | null>(null);
  const [busyVideoId, setBusyVideoId] = useState<string | null>(null);
  const [busyEndId, setBusyEndId] = useState<string | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<Appointment | null>(null);
  const [paymentPlan, setPaymentPlan] = useState<PackageSessions>(1);
  const [feedbackTarget, setFeedbackTarget] = useState<Appointment | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackComment, setFeedbackComment] = useState<string>('');
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [dismissedCancelledAppointmentIds, setDismissedCancelledAppointmentIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DISMISSED_USER_CANCELLED_APPOINTMENTS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setDismissedCancelledAppointmentIds(new Set(parsed.filter((value): value is string => typeof value === 'string')));
      }
    } catch {
      // Ignore invalid local storage value.
    }
  }, []);

  const doctorById = useMemo(() => {
    return new Map(doctors.map((doctor) => [doctor.doctor_user_id, doctor]));
  }, [doctors]);
  const doctorChatPartners = useMemo(() => {
    const map = new Map<string, string>();

    for (const request of treatmentRequests) {
      if (request.status !== 'ACCEPTED') continue;
      const fromRequest = request.doctor_display_name?.trim();
      const fromDirectory = doctorById.get(request.doctor_id)?.display_name;
      map.set(request.doctor_id, fromRequest || fromDirectory || `Doctor ${request.doctor_id.slice(0, 8)}`);
    }

    const partnerIds = new Set<string>();
    for (const item of inboxMessages) {
      partnerIds.add(item.sender_user_id);
    }
    for (const item of outboxMessages) {
      partnerIds.add(item.receiver_user_id);
    }
    for (const partnerId of partnerIds) {
      if (!map.has(partnerId)) {
        const fromDirectory = doctorById.get(partnerId)?.display_name;
        map.set(partnerId, fromDirectory || `Doctor ${partnerId.slice(0, 8)}`);
      }
    }

    return map;
  }, [treatmentRequests, inboxMessages, outboxMessages, doctorById]);
  const upcomingCount = useMemo(
    () => appointments.filter((item) => item.status === 'REQUESTED' || item.status === 'CONFIRMED').length,
    [appointments]
  );

  const completedCount = useMemo(
    () => appointments.filter((item) => item.status === 'COMPLETED').length,
    [appointments]
  );

  const cancelledCount = useMemo(
    () => appointments.filter((item) => item.status === 'CANCELLED').length,
    [appointments]
  );

  const sortedAppointments = useMemo(
    () => [...appointments].sort((a, b) => toTime(a.start_at) - toTime(b.start_at)),
    [appointments]
  );

  const latestCancelledAppointment = useMemo(() => {
    return [...appointments]
      .filter((item) => item.status === 'CANCELLED')
      .sort((a, b) => toTime(b.start_at) - toTime(a.start_at))[0];
  }, [appointments]);

  const nextUpcomingAppointment = useMemo(() => {
    return [...appointments]
      .filter((item) => {
        if (!canCancel(item.status)) return false;
        const start = toTime(item.start_at);
        const end = toTime(item.end_at);
        if (Number.isNaN(start) || Number.isNaN(end)) return false;
        return end >= nowMs;
      })
      .sort((a, b) => toTime(a.start_at) - toTime(b.start_at))[0];
  }, [appointments, nowMs]);

  const loadDashboard = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [appointmentPayload, doctorsPayload, requestPayload, inboxPayload, outboxPayload] = await Promise.all([
        apiJson<Appointment[]>('/appointments/my', undefined, true, 'Failed to load your appointments'),
        apiJson<PublicDoctor[]>('/doctors', undefined, false, 'Failed to load doctors'),
        apiJson<TreatmentRequest[]>('/treatment-requests/my', undefined, true, 'Failed to load doctor feedback'),
        apiJson<MessageItem[]>('/messages?box=inbox', undefined, true, 'Failed to load inbox messages'),
        apiJson<MessageItem[]>('/messages?box=outbox', undefined, true, 'Failed to load outbox messages'),
      ]);

      setAppointments(filterDismissedCancelledAppointments(appointmentPayload, dismissedCancelledAppointmentIds));
      setDoctors(doctorsPayload);
      setTreatmentRequests(requestPayload);
      setInboxMessages(inboxPayload);
      setOutboxMessages(outboxPayload);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setErrorMessage('Please log in again to load your dashboard.');
      } else {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, [dismissedCancelledAppointmentIds]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 60_000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const cancelAppointment = async (appointmentId: string) => {
    setBusyAppointmentId(appointmentId);
    setErrorMessage(null);

    try {
      const updated = await apiJson<Appointment>(
        `/appointments/${appointmentId}/cancel`,
        {
          method: 'POST'
        },
        true,
        'Failed to cancel appointment'
      );

      setAppointments((previous) => {
        const next = previous.map((item) => (item.id === updated.id ? updated : item));
        return filterDismissedCancelledAppointments(next, dismissedCancelledAppointmentIds);
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to cancel appointment');
    } finally {
      setBusyAppointmentId(null);
    }
  };

  const payForAppointment = async (appointment: Appointment, plan: PackageSessions) => {
    setBusyPaymentId(appointment.id);
    setErrorMessage(null);
    try {
      const payment = await apiJson<PaymentInitResponse>(
        '/payments',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appointment_id: appointment.id,
            method: 'CARD',
            package_sessions: plan
          })
        },
        true,
        'Failed to initialize payment'
      );
      await apiJson(
        `/payments/${payment.payment.id}/confirm`,
        { method: 'POST' },
        true,
        'Failed to confirm payment'
      );
      await loadDashboard();
      setPaymentTarget(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to complete payment');
    } finally {
      setBusyPaymentId(null);
    }
  };

  const joinVideoCall = async (appointment: Appointment) => {
    setBusyVideoId(appointment.id);
    setErrorMessage(null);
    try {
      const payload = await apiJson<{ provider: string; room_id: string; token: string; meeting_link?: string | null }>(
        `/appointments/${appointment.id}/video-join`,
        { method: 'POST' },
        true,
        'Failed to join video call'
      );
      const meetingUrl = payload.meeting_link ?? appointment.meeting_link;
      if (meetingUrl) {
        window.open(meetingUrl, '_blank', 'noopener,noreferrer');
      } else {
        setErrorMessage('Meeting link is not available yet. Ask admin to enable Zoom provider.');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to join video call');
    } finally {
      setBusyVideoId(null);
    }
  };

  const endVideoCall = async (appointment: Appointment) => {
    setBusyEndId(appointment.id);
    setErrorMessage(null);
    try {
      const updated = await apiJson<Appointment>(
        `/appointments/${appointment.id}/video-end`,
        { method: 'POST' },
        true,
        'Failed to end call'
      );
      setAppointments((previous) => {
        const next = previous.map((item) => (item.id === updated.id ? updated : item));
        return filterDismissedCancelledAppointments(next, dismissedCancelledAppointmentIds);
      });
      setFeedbackTarget(updated);
      setFeedbackRating(5);
      setFeedbackComment('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to end call');
    } finally {
      setBusyEndId(null);
    }
  };

  const submitFeedback = async () => {
    if (!feedbackTarget) return;
    setErrorMessage(null);
    try {
      const updated = await apiJson<Appointment>(
        `/appointments/${feedbackTarget.id}/feedback`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rating: feedbackRating,
            comment: feedbackComment.trim() || null
          })
        },
        true,
        'Failed to submit feedback'
      );
      setAppointments((previous) => {
        const next = previous.map((item) => (item.id === updated.id ? updated : item));
        return filterDismissedCancelledAppointments(next, dismissedCancelledAppointmentIds);
      });
      setFeedbackTarget(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to submit feedback');
    }
  };

  const currentEmail = getStoredAuthEmail() ?? 'User';
  const shortNowLabel = new Date(nowMs).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const dismissCancelledAppointment = (appointmentId: string) => {
    setDismissedCancelledAppointmentIds((previous) => {
      const next = new Set(previous);
      next.add(appointmentId);
      window.localStorage.setItem(DISMISSED_USER_CANCELLED_APPOINTMENTS_KEY, JSON.stringify([...next]));
      return next;
    });
    setAppointments((previous) => previous.filter((item) => item.id !== appointmentId));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/30 via-white to-white text-textMain">
      <Header
        brandHref="/dashboard"
        navItems={[
          { labelKey: 'nav.dashboard', href: '/dashboard' },
          { labelKey: 'nav.complaints', href: '/complaints' },
          { labelKey: 'nav.doctors', href: '/home#featured-doctors' },
          { labelKey: 'nav.about', href: '/about' }
        ]}
      />

      <main className="section-shell py-6 sm:py-8">
        <section className="rounded-hero border border-borderGray bg-white p-6 shadow-card">
          <h1 className="text-2xl font-black tracking-tight text-textMain sm:text-3xl">Patient Dashboard</h1>
          <p className="mt-2 text-sm text-muted">Signed in as {currentEmail}</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <article className="rounded-xl border border-borderGray bg-slate-50 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-wide text-muted">Upcoming</p>
              <p className="mt-1 text-2xl font-black text-textMain">{upcomingCount}</p>
            </article>
            <article className="rounded-xl border border-borderGray bg-slate-50 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-wide text-muted">Completed</p>
              <p className="mt-1 text-2xl font-black text-textMain">{completedCount}</p>
            </article>
            <article className="rounded-xl border border-borderGray bg-slate-50 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-wide text-muted">Cancelled</p>
              <p className="mt-1 text-2xl font-black text-textMain">{cancelledCount}</p>
            </article>
          </div>

          {errorMessage && (
            <p className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p>
          )}
        </section>

        <section className="mt-6 rounded-hero border border-borderGray bg-white p-6 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black text-textMain">My Appointments</h2>
            <button
              type="button"
              onClick={() => void loadDashboard()}
              className="rounded-xl border border-borderGray px-3 py-2 text-xs font-semibold text-textMain transition hover:border-primary/40 hover:text-primary"
            >
              Refresh
            </button>
          </div>

          {isLoading ? (
            <p className="mt-4 text-sm text-muted">Loading appointments...</p>
          ) : sortedAppointments.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No appointments yet. Start by booking a doctor from the home page.</p>
          ) : (
            <div className="mt-5">
              <div className="overflow-x-auto rounded-2xl border border-borderGray bg-slate-50 p-4">
                <div className="min-w-[620px]">
                  <p className="text-xs font-black uppercase tracking-wide text-muted">Appointment Timeline</p>
                  <div className="relative mt-8 h-16">
                    <span className="absolute left-6 right-6 top-7 h-px bg-borderGray" />

                    <div className="absolute left-0 top-0 flex w-1/3 flex-col items-center px-2 text-center">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-700">Cancelled</p>
                      <span className="mt-2 h-3 w-3 rounded-full bg-rose-500 ring-4 ring-rose-100" />
                      <p className="mt-2 text-[11px] text-muted">
                        {latestCancelledAppointment ? formatDate(latestCancelledAppointment.start_at) : 'No cancelled appointment'}
                      </p>
                    </div>

                    <div className="absolute left-1/2 top-0 flex w-1/3 -translate-x-1/2 flex-col items-center px-2 text-center">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">Now</p>
                      <span className="mt-2 h-3 w-3 rounded-full bg-primary ring-4 ring-primary-100" />
                      <p className="mt-2 text-[11px] text-muted">{shortNowLabel}</p>
                    </div>

                    <div className="absolute right-0 top-0 flex w-1/3 flex-col items-center px-2 text-center">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Next Appointment</p>
                      <span className="mt-2 h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                      <p className="mt-2 text-[11px] text-muted">
                        {nextUpcomingAppointment ? formatDate(nextUpcomingAppointment.start_at) : 'No upcoming appointment'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pl-2">
              {sortedAppointments.map((appointment, index) => {
                const doctor = doctorById.get(appointment.doctor_user_id);
                const isBusy = busyAppointmentId === appointment.id;
                const isLast = index === sortedAppointments.length - 1;

                return (
                  <article key={appointment.id} className="relative pb-5 pl-8 sm:pl-10">
                    {!isLast && <span className="absolute left-[10px] top-7 h-[calc(100%-12px)] w-px bg-borderGray sm:left-3" />}
                    <span
                      className={`absolute left-0 top-1.5 h-5 w-5 rounded-full ring-4 sm:left-0.5 ${timelineDotClass(appointment.status)}`}
                    />

                    <div className="rounded-2xl border border-borderGray bg-slate-50 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-bold text-textMain sm:text-base">
                            {doctor?.display_name ?? `Doctor ${appointment.doctor_user_id.slice(0, 8)}`}
                          </h3>
                          <p className="mt-1 text-xs text-muted">{doctor?.headline ?? 'Therapy Session'}</p>
                          <p className="mt-2 text-sm text-textMain">{formatDate(appointment.start_at)}</p>
                          <p className="mt-1 text-xs text-muted">Timezone: {appointment.timezone}</p>
                          {appointment.meeting_link && (
                            <a
                              href={appointment.meeting_link}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-block text-xs font-semibold text-primary hover:text-primaryDark"
                            >
                              Join Zoom Meeting
                            </a>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(appointment.status)}`}>
                            {statusLabel(appointment.status)}
                          </span>
                          {appointment.status === 'CANCELLED' && (
                            <button
                              type="button"
                              onClick={() => dismissCancelledAppointment(appointment.id)}
                              className="rounded-full border border-rose-200 bg-white px-2 py-0.5 text-sm font-bold leading-none text-rose-700 transition hover:bg-rose-50"
                              aria-label="Remove cancelled appointment from list"
                              title="Remove from list"
                            >
                              ×
                            </button>
                          )}

                          {canCancel(appointment.status) && (
                            <button
                              type="button"
                              onClick={() => void cancelAppointment(appointment.id)}
                              disabled={isBusy}
                              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:border-rose-300 disabled:opacity-60"
                            >
                              {isBusy ? 'Cancelling...' : 'Cancel'}
                            </button>
                          )}

                          {!appointment.fee_paid && canCancel(appointment.status) && (
                            <button
                              type="button"
                              onClick={() => {
                                setPaymentTarget(appointment);
                                setPaymentPlan(1);
                              }}
                              disabled={busyPaymentId === appointment.id}
                              className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 disabled:opacity-60"
                            >
                              {busyPaymentId === appointment.id ? 'Processing...' : 'Pay for Session/Package'}
                            </button>
                          )}

                          {appointment.fee_paid && canCancel(appointment.status) && appointment.call_status !== 'ENDED' && isZoomAppointment(appointment) && appointment.meeting_link && (
                            <a
                              href={appointment.meeting_link}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg border border-primary/30 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary-100"
                            >
                              Join Zoom Meeting
                            </a>
                          )}

                          {appointment.fee_paid && canCancel(appointment.status) && appointment.call_status !== 'ENDED' && !isZoomAppointment(appointment) && canJoinVideoNow(appointment) && (
                            <button
                              type="button"
                              onClick={() => void joinVideoCall(appointment)}
                              disabled={busyVideoId === appointment.id}
                              className="rounded-lg border border-primary/30 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary-100 disabled:opacity-60"
                            >
                              {busyVideoId === appointment.id ? 'Joining...' : 'Join Meeting'}
                            </button>
                          )}
                          {appointment.fee_paid && appointment.status === 'CONFIRMED' && appointment.call_status !== 'ENDED' && canJoinVideoNow(appointment) && (
                            <button
                              type="button"
                              onClick={() => void endVideoCall(appointment)}
                              disabled={busyEndId === appointment.id}
                              className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-60"
                            >
                              {busyEndId === appointment.id ? 'Ending...' : 'End Call'}
                            </button>
                          )}
                          {appointment.fee_paid && canCancel(appointment.status) && appointment.call_status !== 'ENDED' && !isZoomAppointment(appointment) && !canJoinVideoNow(appointment) && (
                            <p className="text-[11px] text-muted">Video join opens near session start time.</p>
                          )}
                        </div>
                      </div>

                      {appointment.status === 'REQUESTED' && (
                        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                          Waiting for doctor response.
                        </p>
                      )}
                      {appointment.status === 'CANCELLED' && (
                        <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800">
                          This appointment was cancelled.
                        </p>
                      )}
                      {appointment.feedback_rating && (
                        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
                          Feedback: {'⭐'.repeat(Math.max(1, Math.min(5, appointment.feedback_rating)))}
                          {appointment.feedback_comment ? ` — ${appointment.feedback_comment}` : ''}
                        </p>
                      )}
                      {appointment.notes?.trim() && (
                        <p className="mt-3 rounded-lg bg-sky-50 px-3 py-2 text-xs font-medium text-sky-800">
                          Doctor session note: {appointment.notes}
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
              </div>
            </div>
          )}
        </section>

        <section className="mt-6 rounded-hero border border-borderGray bg-white p-6 shadow-card">
          <h2 className="text-xl font-black text-textMain">Suggested Doctors</h2>
          {doctors.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No public doctors available yet.</p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {doctors.slice(0, 6).map((doctor) => (
                <article key={doctor.doctor_user_id} className="min-w-0 rounded-2xl border border-borderGray bg-slate-50 p-4">
                  <h3 className="text-sm font-bold text-textMain break-words [overflow-wrap:anywhere]">{doctor.display_name}</h3>
                  <p className="mt-1 text-xs text-muted break-words [overflow-wrap:anywhere]">{doctor.headline ?? 'Therapist'}</p>
                  <p className="mt-2 text-xs text-muted break-words [overflow-wrap:anywhere]">
                    {[doctor.location_city, doctor.location_country].filter(Boolean).join(', ') || 'Location not specified'}
                  </p>
                  <p className="mt-2 text-xs text-muted break-words [overflow-wrap:anywhere]">
                    {(doctor.specialties ?? []).slice(0, 2).join(' • ') || 'General therapy'}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigateTo(`/doctors/${doctor.slug}`)}
                    className="mt-3 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primaryDark"
                  >
                    View profile
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-hero border border-borderGray bg-white p-6 shadow-card">
          <h2 className="text-xl font-black text-textMain">Doctor Feedback</h2>
          {treatmentRequests.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No feedback yet from doctors.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {treatmentRequests.map((request) => (
                <article key={request.id} className="rounded-xl border border-borderGray bg-slate-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-textMain">
                        {request.doctor_display_name ?? `Doctor ${request.doctor_id.slice(0, 8)}`}
                      </p>
                      <p className="mt-1 text-xs text-muted">Updated: {formatDate(request.updated_at)}</p>
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${treatmentStatusClass(request.status)}`}>
                      {request.status}
                    </span>
                  </div>

                  <div className="mt-3 rounded-lg border border-borderGray bg-white p-3">
                    <p className="text-[11px] font-black uppercase tracking-wide text-muted">Doctor Feedback</p>
                    <p className="mt-1 text-sm text-textMain whitespace-pre-wrap break-words">
                      {request.doctor_note?.trim() ? request.doctor_note : 'No written feedback yet.'}
                    </p>
                    {request.status === 'ACCEPTED' && (
                      <button
                        type="button"
                        onClick={() => navigateTo(`/user-chats?doctor_id=${encodeURIComponent(request.doctor_id)}`)}
                        className="mt-3 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primaryDark"
                      >
                        Message Doctor
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-hero border border-borderGray bg-white p-6 shadow-card">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-black text-textMain">User Chats</h2>
              <p className="mt-1 text-sm text-muted">Click a doctor to open your direct chat page.</p>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('/user-chats')}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-primaryDark"
            >
              Open Chats
            </button>
          </div>
          {doctorChatPartners.size === 0 ? (
            <p className="mt-4 text-sm text-muted">No doctor chats yet.</p>
          ) : (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {Array.from(doctorChatPartners.entries()).map(([doctorId, doctorName]) => (
                <button
                  key={doctorId}
                  type="button"
                  onClick={() => navigateTo(`/user-chats?doctor_id=${encodeURIComponent(doctorId)}`)}
                  className="rounded-lg border border-borderGray bg-slate-50 px-3 py-2 text-left text-sm font-semibold text-textMain transition hover:border-primary/40 hover:text-primary"
                >
                  {doctorName}
                </button>
              ))}
            </div>
          )}
        </section>

        <TimelineFeed className="mt-6" title="Therapy Community Feed" />
      </main>

      {feedbackTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-2xl border border-borderGray bg-white p-5 shadow-card">
            <h3 className="text-lg font-black text-textMain">Session Feedback</h3>
            <p className="mt-1 text-sm text-muted">How was your Zoom session?</p>
            <label className="mt-4 block text-sm font-semibold text-textMain">
              Rating
              <select
                value={feedbackRating}
                onChange={(event) => setFeedbackRating(Number(event.target.value))}
                className="mt-2 w-full rounded-lg border border-borderGray bg-white px-3 py-2 text-sm"
              >
                <option value={5}>5 - Excellent</option>
                <option value={4}>4 - Good</option>
                <option value={3}>3 - Okay</option>
                <option value={2}>2 - Poor</option>
                <option value={1}>1 - Bad</option>
              </select>
            </label>
            <label className="mt-3 block text-sm font-semibold text-textMain">
              Comment (optional)
              <textarea
                rows={4}
                value={feedbackComment}
                onChange={(event) => setFeedbackComment(event.target.value)}
                className="mt-2 w-full rounded-lg border border-borderGray bg-white px-3 py-2 text-sm"
                placeholder="Share your feedback..."
              />
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFeedbackTarget(null)}
                className="rounded-lg border border-borderGray bg-white px-3 py-1.5 text-xs font-semibold text-textMain"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={() => void submitFeedback()}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primaryDark"
              >
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}

      {paymentTarget && (() => {
        const doctor = doctorById.get(paymentTarget.doctor_user_id);
        const basePrice = Number(doctor?.pricing_per_session ?? 40);
        const currency = doctor?.pricing_currency ?? 'JOD';
        const single = computePackagePricing(basePrice, 1);
        const pack4 = computePackagePricing(basePrice, 4);
        const active = paymentPlan === 1 ? single : pack4;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
            <div className="w-full max-w-lg rounded-2xl border border-borderGray bg-white p-5 shadow-card">
              <h3 className="text-lg font-black text-textMain">Choose Payment Plan</h3>
              <p className="mt-1 text-sm text-muted">Select one session or a 4-session bundle with progressive 20% discount.</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setPaymentPlan(1)}
                  className={`rounded-lg border px-3 py-2 text-left text-sm ${paymentPlan === 1 ? 'border-primary bg-primary-50 text-primary' : 'border-borderGray bg-white text-textMain'}`}
                >
                  <p className="font-bold">1 Session</p>
                  <p className="text-xs">Total: {single.discountedTotal.toFixed(2)} {currency}</p>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentPlan(4)}
                  className={`rounded-lg border px-3 py-2 text-left text-sm ${paymentPlan === 4 ? 'border-primary bg-primary-50 text-primary' : 'border-borderGray bg-white text-textMain'}`}
                >
                  <p className="font-bold">4 Sessions (20% progressive)</p>
                  <p className="text-xs">Total: {pack4.discountedTotal.toFixed(2)} {currency}</p>
                </button>
              </div>
              <div className="mt-4 rounded-lg border border-borderGray bg-slate-50 p-3 text-sm">
                <p className="font-semibold text-textMain">Price breakdown</p>
                <p className="mt-1 text-muted">Base/session: {basePrice.toFixed(2)} {currency}</p>
                <p className="mt-1 text-muted">
                  Sessions: {active.sessionPrices.map((price, idx) => `#${idx + 1} ${price.toFixed(2)}`).join(' • ')} {currency}
                </p>
                <p className="mt-1 text-muted">Original total: {active.originalTotal.toFixed(2)} {currency}</p>
                <p className="mt-1 font-semibold text-emerald-700">Discounted total: {active.discountedTotal.toFixed(2)} {currency}</p>
                <p className="mt-1 text-emerald-700">You save: {active.totalSavings.toFixed(2)} {currency}</p>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentTarget(null)}
                  className="rounded-lg border border-borderGray bg-white px-3 py-1.5 text-xs font-semibold text-textMain"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void payForAppointment(paymentTarget, paymentPlan)}
                  disabled={busyPaymentId === paymentTarget.id}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primaryDark disabled:opacity-60"
                >
                  {busyPaymentId === paymentTarget.id ? 'Processing...' : `Pay ${active.discountedTotal.toFixed(2)} ${currency}`}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
