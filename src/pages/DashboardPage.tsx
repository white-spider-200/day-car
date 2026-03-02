import { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import MessageCenter from '../components/MessageCenter';
import TimelineFeed from '../components/TimelineFeed';
import { ApiError, apiJson } from '../utils/api';
import { getStoredAuthEmail, navigateTo } from '../utils/auth';

type AppointmentStatus = 'REQUESTED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
type AppointmentCallStatus = 'NOT_READY' | 'READY' | 'LIVE' | 'ENDED';

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
  created_at: string;
};

type PaymentInitResponse = {
  payment: {
    id: string;
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
};

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
  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) {
    return isoValue;
  }
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

function canJoinVideoNow(appointment: Appointment): boolean {
  const start = new Date(appointment.start_at).getTime();
  const end = new Date(appointment.end_at).getTime();
  const now = Date.now();
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return false;
  }
  return now >= start - 15 * 60 * 1000 && now <= end + 120 * 60 * 1000;
}

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<PublicDoctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busyAppointmentId, setBusyAppointmentId] = useState<string | null>(null);
  const [busyPaymentId, setBusyPaymentId] = useState<string | null>(null);
  const [busyVideoId, setBusyVideoId] = useState<string | null>(null);
  const [videoJoinInfo, setVideoJoinInfo] = useState<Record<string, { provider: string; room_id: string; token: string }>>({});
  const [nowMs, setNowMs] = useState(() => Date.now());

  const doctorById = useMemo(() => {
    return new Map(doctors.map((doctor) => [doctor.doctor_user_id, doctor]));
  }, [doctors]);

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
    () => [...appointments].sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()),
    [appointments]
  );

  const latestCancelledAppointment = useMemo(() => {
    return [...appointments]
      .filter((item) => item.status === 'CANCELLED')
      .sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime())[0];
  }, [appointments]);

  const nextUpcomingAppointment = useMemo(() => {
    return [...appointments]
      .filter((item) => canCancel(item.status) && new Date(item.start_at).getTime() > nowMs)
      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())[0];
  }, [appointments, nowMs]);

  const loadDashboard = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [appointmentPayload, doctorsPayload] = await Promise.all([
        apiJson<Appointment[]>('/appointments/my', undefined, true, 'Failed to load your appointments'),
        apiJson<PublicDoctor[]>('/doctors', undefined, false, 'Failed to load doctors')
      ]);

      setAppointments(appointmentPayload);
      setDoctors(doctorsPayload);
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
  }, []);

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

      setAppointments((previous) => previous.map((item) => (item.id === updated.id ? updated : item)));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to cancel appointment');
    } finally {
      setBusyAppointmentId(null);
    }
  };

  const payForAppointment = async (appointment: Appointment) => {
    setBusyPaymentId(appointment.id);
    setErrorMessage(null);
    try {
      const amount = doctorById.get(appointment.doctor_user_id)?.headline ? 40 : 30;
      const payment = await apiJson<PaymentInitResponse>(
        '/payments',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appointment_id: appointment.id,
            amount,
            method: 'CARD'
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
      const payload = await apiJson<{ provider: string; room_id: string; token: string }>(
        `/appointments/${appointment.id}/video-join`,
        { method: 'POST' },
        true,
        'Failed to join video call'
      );
      setVideoJoinInfo((previous) => ({ ...previous, [appointment.id]: payload }));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to join video call');
    } finally {
      setBusyVideoId(null);
    }
  };

  const currentEmail = getStoredAuthEmail() ?? 'User';
  const shortNowLabel = new Date(nowMs).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/30 via-white to-white text-textMain">
      <Header
        brandHref="/dashboard"
        navItems={[
          { labelKey: 'nav.dashboard', href: '/dashboard' },
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
                              Open meeting link
                            </a>
                          )}
                          {videoJoinInfo[appointment.id] && (
                            <div className="mt-2 rounded-lg border border-borderGray bg-white p-2 text-xs text-muted">
                              <p>Provider: {videoJoinInfo[appointment.id].provider}</p>
                              <p>Room: {videoJoinInfo[appointment.id].room_id}</p>
                              <p className="break-all">Token: {videoJoinInfo[appointment.id].token}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(appointment.status)}`}>
                            {statusLabel(appointment.status)}
                          </span>

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
                              onClick={() => void payForAppointment(appointment)}
                              disabled={busyPaymentId === appointment.id}
                              className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 disabled:opacity-60"
                            >
                              {busyPaymentId === appointment.id ? 'Processing...' : 'Pay for Video'}
                            </button>
                          )}

                          {appointment.fee_paid && canCancel(appointment.status) && canJoinVideoNow(appointment) && (
                            <button
                              type="button"
                              onClick={() => void joinVideoCall(appointment)}
                              disabled={busyVideoId === appointment.id}
                              className="rounded-lg border border-primary/30 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary-100 disabled:opacity-60"
                            >
                              {busyVideoId === appointment.id ? 'Joining...' : 'Join Video Call'}
                            </button>
                          )}
                          {appointment.fee_paid && canCancel(appointment.status) && !canJoinVideoNow(appointment) && (
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
                <article key={doctor.doctor_user_id} className="rounded-2xl border border-borderGray bg-slate-50 p-4">
                  <h3 className="text-sm font-bold text-textMain">{doctor.display_name}</h3>
                  <p className="mt-1 text-xs text-muted">{doctor.headline ?? 'Therapist'}</p>
                  <p className="mt-2 text-xs text-muted">
                    {[doctor.location_city, doctor.location_country].filter(Boolean).join(', ') || 'Location not specified'}
                  </p>
                  <p className="mt-2 text-xs text-muted">
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

        <TimelineFeed className="mt-6" title="Therapy Community Feed" />
        <MessageCenter className="mt-6" title="Doctor-Patient Messages" />
      </main>
    </div>
  );
}
