import { useEffect, useMemo, useState } from 'react';
import AvailabilityCalendarBoard from '../components/AvailabilityCalendarBoard';
import Header from '../components/Header';
import { useLanguage } from '../context/LanguageContext';
import { ApiError, apiJson } from '../utils/api';
import { navigateTo } from '../utils/auth';

type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'IN_REVIEW'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'APPROVED_MD'
  | 'APPROVED_THERAPIST'
  | 'REJECTED'
  | 'NEEDS_CHANGES'
  | 'NEEDS_MORE_INFO';
type AppointmentStatus = 'REQUESTED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
type AppointmentCallStatus = 'NOT_READY' | 'READY' | 'LIVE' | 'ENDED';
type TreatmentRequestStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

type DoctorApplication = {
  id: string;
  doctor_user_id: string;
  status: ApplicationStatus;
  display_name: string | null;
  headline: string | null;
  schedule: Array<{ day?: string; start?: string; end?: string }> | null;
  internal_notes: string | null;
  rejection_reason: string | null;
  updated_at: string;
};

type DoctorAppointment = {
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

type AvailabilityRule = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  timezone: string;
  slot_duration_minutes: number;
  buffer_minutes: number;
  is_blocked: boolean;
};

type AvailabilityException = {
  id: string;
  date: string;
  is_unavailable: boolean;
  is_blocking: boolean;
  is_recurring: boolean;
  recurrence_type: 'WEEKLY' | 'MONTHLY' | null;
  recurrence_interval: number;
  recurrence_until: string | null;
  weekday: number | null;
  start_time: string | null;
  end_time: string | null;
  note: string | null;
};

type TreatmentRequest = {
  id: string;
  doctor_id: string;
  user_id: string;
  status: TreatmentRequestStatus;
  message: string;
  doctor_note: string | null;
  created_at: string;
};

type AvailabilityBulkResponse = {
  rules: AvailabilityRule[];
  exceptions: AvailabilityException[];
};

function formatDateTime(isoValue: string, locale: string): string {
  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) {
    return isoValue;
  }
  return date.toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function appointmentStatusClass(status: AppointmentStatus): string {
  if (status === 'CONFIRMED') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (status === 'REQUESTED') return 'bg-sky-50 text-sky-700 border-sky-100';
  if (status === 'CANCELLED') return 'bg-rose-50 text-rose-700 border-rose-100';
  if (status === 'NO_SHOW') return 'bg-amber-50 text-amber-700 border-amber-100';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

function appointmentJourneyLabel(status: AppointmentStatus, isAr: boolean): string {
  if (status === 'REQUESTED') return isAr ? 'محجوز' : 'Booked';
  if (status === 'CONFIRMED') return isAr ? 'مؤكد' : 'Confirmed';
  if (status === 'COMPLETED') return isAr ? 'مكتمل' : 'Finished';
  if (status === 'CANCELLED') return isAr ? 'ملغي' : 'Cancelled';
  if (status === 'NO_SHOW') return isAr ? 'لم يحضر' : 'No Show';
  return status;
}

function appointmentStatusLabel(status: AppointmentStatus, isAr: boolean): string {
  if (!isAr) return status;
  if (status === 'REQUESTED') return 'قيد الطلب';
  if (status === 'CONFIRMED') return 'مؤكد';
  if (status === 'COMPLETED') return 'مكتمل';
  if (status === 'CANCELLED') return 'ملغي';
  if (status === 'NO_SHOW') return 'لم يحضر';
  return status;
}

function scheduleDayToWeekday(day: string): number | null {
  const upper = day.trim().toUpperCase();
  const mapping: Record<string, number> = {
    MONDAY: 0,
    TUESDAY: 1,
    WEDNESDAY: 2,
    THURSDAY: 3,
    FRIDAY: 4,
    SATURDAY: 5,
    SUNDAY: 6
  };
  return upper in mapping ? mapping[upper] : null;
}

function normalizeScheduleTime(timeValue: string): string | null {
  const trimmed = timeValue.trim();
  if (/^\d{2}:\d{2}$/.test(trimmed)) return `${trimmed}:00`;
  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) return trimmed;
  return null;
}

export default function DoctorDashboardPage() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const locale = isAr ? 'ar-JO' : 'en-US';

  const [application, setApplication] = useState<DoctorApplication | null>(null);
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
  const [treatmentRequests, setTreatmentRequests] = useState<TreatmentRequest[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessages, setWarningMessages] = useState<string[]>([]);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const upcomingCount = useMemo(
    () => appointments.filter((item) => item.status === 'REQUESTED' || item.status === 'CONFIRMED').length,
    [appointments]
  );
  const pendingTreatmentCount = useMemo(
    () => treatmentRequests.filter((item) => item.status === 'PENDING').length,
    [treatmentRequests]
  );
  const treatedPatientsCount = useMemo(
    () => new Set(appointments.filter((item) => item.status === 'COMPLETED').map((item) => item.user_id)).size,
    [appointments]
  );
  const patientTimeline = useMemo(() => {
    const grouped = new Map<
      string,
      {
        patientId: string;
        totalAppointments: number;
        completedAppointments: number;
        upcomingAppointments: number;
        latestEventAt: string | null;
        events: DoctorAppointment[];
      }
    >();

    for (const appointment of appointments) {
      const current = grouped.get(appointment.user_id) ?? {
        patientId: appointment.user_id,
        totalAppointments: 0,
        completedAppointments: 0,
        upcomingAppointments: 0,
        latestEventAt: null,
        events: []
      };

      current.totalAppointments += 1;
      if (appointment.status === 'COMPLETED') current.completedAppointments += 1;
      if (appointment.status === 'REQUESTED' || appointment.status === 'CONFIRMED') current.upcomingAppointments += 1;
      if (!current.latestEventAt || new Date(appointment.start_at).getTime() > new Date(current.latestEventAt).getTime()) {
        current.latestEventAt = appointment.start_at;
      }
      current.events.push(appointment);
      grouped.set(appointment.user_id, current);
    }

    return [...grouped.values()]
      .map((patient) => ({
        ...patient,
        events: [...patient.events].sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime())
      }))
      .sort((a, b) => {
        const aTime = a.latestEventAt ? new Date(a.latestEventAt).getTime() : 0;
        const bTime = b.latestEventAt ? new Date(b.latestEventAt).getTime() : 0;
        return bTime - aTime;
      });
  }, [appointments]);
  const nextUpcomingAppointment = useMemo(() => {
    const now = Date.now();
    return [...appointments]
      .filter((item) => (item.status === 'REQUESTED' || item.status === 'CONFIRMED') && new Date(item.start_at).getTime() >= now)
      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())[0];
  }, [appointments]);

  const loadDashboard = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setWarningMessages([]);

    const settled = await Promise.allSettled([
      apiJson<DoctorApplication>('/doctor/application', undefined, true, 'Failed to load application'),
      apiJson<DoctorAppointment[]>('/doctor/appointments', undefined, true, 'Failed to load appointments'),
      apiJson<AvailabilityRule[]>('/doctor/availability/rules', undefined, true, 'Failed to load availability rules'),
      apiJson<AvailabilityException[]>(
        '/doctor/availability/exceptions',
        undefined,
        true,
        'Failed to load availability exceptions'
      ),
      apiJson<TreatmentRequest[]>('/doctor/treatment-requests', undefined, true, 'Failed to load treatment requests')
    ]);

    const warnings: string[] = [];
    let hasAuthError = false;

    const pickValue = <T,>(index: number, fallback: T, label: string): T => {
      const result = settled[index];
      if (result.status === 'fulfilled') {
        return result.value as T;
      }

      const reason = result.reason;
      if (reason instanceof ApiError && (reason.status === 401 || reason.status === 403)) {
        hasAuthError = true;
      } else {
        warnings.push(label);
      }

      return fallback;
    };

    const appPayload = pickValue<DoctorApplication | null>(0, null, 'Application');
    const appointmentsPayload = pickValue<DoctorAppointment[]>(1, [], 'Appointments');
    const rulesPayload = pickValue<AvailabilityRule[]>(2, [], 'Availability rules');
    const exceptionsPayload = pickValue<AvailabilityException[]>(3, [], 'Availability exceptions');
    const treatmentRequestsPayload = pickValue<TreatmentRequest[]>(4, [], 'Treatment requests');

    setApplication(appPayload);
    setAppointments(appointmentsPayload);
    setRules(rulesPayload);
    setExceptions(exceptionsPayload);
    setTreatmentRequests(treatmentRequestsPayload);

    if (hasAuthError) {
      setErrorMessage(isAr ? 'ليس لديك صلاحية طبيب لهذه اللوحة.' : 'You do not have doctor access for this dashboard.');
    } else if (warnings.length > 0) {
      setWarningMessages(warnings);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const updateAppointment = async (appointmentId: string, action: 'confirm' | 'cancel') => {
    setBusyAction(`${action}_${appointmentId}`);
    setErrorMessage(null);
    try {
      const updated = await apiJson<DoctorAppointment>(
        `/doctor/appointments/${appointmentId}/${action}`,
        { method: 'POST' },
        true,
        `Failed to ${action} appointment`
      );
      setAppointments((previous) => previous.map((item) => (item.id === updated.id ? updated : item)));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : `Failed to ${action} appointment`);
    } finally {
      setBusyAction(null);
    }
  };

  const updateTreatmentRequestStatus = async (requestId: string, status: TreatmentRequestStatus) => {
    setBusyAction(`treatment_${requestId}_${status}`);
    try {
      const updated = await apiJson<TreatmentRequest>(
        `/treatment-requests/${requestId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        },
        true,
        'Failed to update treatment request'
      );
      setTreatmentRequests((previous) => previous.map((item) => (item.id === updated.id ? updated : item)));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update treatment request');
    } finally {
      setBusyAction(null);
    }
  };


  const addRuleToCalendar = async (input: {
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_blocked: boolean;
    timezone: string;
    slot_duration_minutes: number;
    buffer_minutes: number;
  }) => {
    setBusyAction('availability_bulk');
    try {
      const nextRulesPayload = [
        ...rules.map((rule) => ({
          day_of_week: rule.day_of_week,
          start_time: rule.start_time,
          end_time: rule.end_time,
          timezone: rule.timezone,
          slot_duration_minutes: rule.slot_duration_minutes,
          buffer_minutes: rule.buffer_minutes,
          is_blocked: rule.is_blocked,
          effective_from: null,
          effective_to: null
        })),
        {
          ...input,
          effective_from: null,
          effective_to: null
        }
      ];
      const exceptionPayload = exceptions.map((item) => ({
        date: item.date,
        is_unavailable: item.is_unavailable,
        is_blocking: item.is_blocking,
        is_recurring: item.is_recurring,
        recurrence_type: item.recurrence_type,
        recurrence_interval: item.recurrence_interval,
        recurrence_until: item.recurrence_until,
        weekday: item.weekday,
        start_time: item.start_time,
        end_time: item.end_time,
        note: item.note
      }));
      const payload = await apiJson<AvailabilityBulkResponse>(
        '/doctor/availability/bulk',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rules: nextRulesPayload,
            exceptions: exceptionPayload
          })
        },
        true,
        'Failed to update calendar'
      );
      setRules(payload.rules);
      setExceptions(payload.exceptions);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update calendar');
    } finally {
      setBusyAction(null);
    }
  };

  const importApplicationScheduleToCalendar = async () => {
    const schedule = application?.schedule ?? [];
    if (!schedule || schedule.length === 0) {
      setErrorMessage(isAr ? 'لا يوجد جدول أوقات متاحة في طلب الطبيب.' : 'No free-time schedule found in doctor application.');
      return;
    }

    const importedRules = schedule
      .map((slot) => {
        const day = typeof slot.day === 'string' ? scheduleDayToWeekday(slot.day) : null;
        const start = typeof slot.start === 'string' ? normalizeScheduleTime(slot.start) : null;
        const end = typeof slot.end === 'string' ? normalizeScheduleTime(slot.end) : null;
        if (day === null || !start || !end || end <= start) {
          return null;
        }
        return {
          day_of_week: day,
          start_time: start,
          end_time: end,
          timezone: 'Asia/Amman',
          slot_duration_minutes: 50,
          buffer_minutes: 10,
          is_blocked: false,
          effective_from: null,
          effective_to: null
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    if (importedRules.length === 0) {
      setErrorMessage(isAr ? 'جدول طلب الطبيب يحتوي على أوقات غير صحيحة.' : 'Doctor application schedule has invalid time ranges.');
      return;
    }

    setBusyAction('availability_import');
    setErrorMessage(null);
    try {
      const exceptionPayload = exceptions.map((item) => ({
        date: item.date,
        is_unavailable: item.is_unavailable,
        is_blocking: item.is_blocking,
        is_recurring: item.is_recurring,
        recurrence_type: item.recurrence_type,
        recurrence_interval: item.recurrence_interval,
        recurrence_until: item.recurrence_until,
        weekday: item.weekday,
        start_time: item.start_time,
        end_time: item.end_time,
        note: item.note
      }));
      const payload = await apiJson<AvailabilityBulkResponse>(
        '/doctor/availability/bulk',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rules: importedRules,
            exceptions: exceptionPayload
          })
        },
        true,
        'Failed to import free-time schedule from application'
      );
      setRules(payload.rules);
      setExceptions(payload.exceptions);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to import free-time schedule from application');
    } finally {
      setBusyAction(null);
    }
  };

  const removeRuleFromCalendar = async (ruleId: string) => {
    setBusyAction('availability_bulk');
    try {
      const nextRulesPayload = rules
        .filter((rule) => rule.id !== ruleId)
        .map((rule) => ({
          day_of_week: rule.day_of_week,
          start_time: rule.start_time,
          end_time: rule.end_time,
          timezone: rule.timezone,
          slot_duration_minutes: rule.slot_duration_minutes,
          buffer_minutes: rule.buffer_minutes,
          is_blocked: rule.is_blocked,
          effective_from: null,
          effective_to: null
        }));
      const exceptionPayload = exceptions.map((item) => ({
        date: item.date,
        is_unavailable: item.is_unavailable,
        is_blocking: item.is_blocking,
        is_recurring: item.is_recurring,
        recurrence_type: item.recurrence_type,
        recurrence_interval: item.recurrence_interval,
        recurrence_until: item.recurrence_until,
        weekday: item.weekday,
        start_time: item.start_time,
        end_time: item.end_time,
        note: item.note
      }));
      const payload = await apiJson<AvailabilityBulkResponse>(
        '/doctor/availability/bulk',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rules: nextRulesPayload,
            exceptions: exceptionPayload
          })
        },
        true,
        'Failed to remove availability rule'
      );
      setRules(payload.rules);
      setExceptions(payload.exceptions);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to remove availability rule');
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/30 via-white to-white text-textMain">
      <Header
        brandHref="/doctor-dashboard"
        navItems={[
          { labelKey: 'nav.dashboard', href: '/doctor-dashboard' },
          { labelKey: 'nav.doctors', href: '/home#featured-doctors' },
          { labelKey: 'nav.about', href: '/about' }
        ]}
      />

      <main className="section-shell py-6 sm:py-8">
        <section className="rounded-hero border border-borderGray bg-white p-6 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-textMain sm:text-3xl">Doctor Dashboard</h1>
              <p className="mt-2 text-sm text-muted">
                {isAr
                  ? 'إدارة المواعيد وطلبات العلاج والمحادثات وتحديثات الانضمام.'
                  : 'Manage appointments, treatment requests, messaging, and onboarding updates.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadDashboard()}
              className="rounded-xl border border-borderGray px-3 py-2 text-xs font-semibold text-textMain transition hover:border-primary/40 hover:text-primary"
            >
              {isAr ? 'تحديث' : 'Refresh'}
            </button>
          </div>

          {errorMessage && (
            <p className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p>
          )}

          {warningMessages.length > 0 && (
            <p className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {isAr
                ? `بعض أقسام لوحة التحكم غير متاحة الآن: ${warningMessages.join('، ')}.`
                : `Some dashboard sections are unavailable right now: ${warningMessages.join(', ')}.`}
            </p>
          )}

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-xl border border-borderGray bg-slate-50 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-wide text-muted">{isAr ? 'الطلب' : 'Application'}</p>
              <p className="mt-1 text-sm font-bold text-textMain">{application?.status ?? (isAr ? 'غير متوفر' : 'N/A')}</p>
            </article>
            <article className="rounded-xl border border-borderGray bg-slate-50 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-wide text-muted">{isAr ? 'القادمة' : 'Upcoming'}</p>
              <p className="mt-1 text-sm font-bold text-textMain">{upcomingCount}</p>
            </article>
            <article className="rounded-xl border border-borderGray bg-slate-50 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-wide text-muted">{isAr ? 'طلبات العلاج' : 'Treatment Requests'}</p>
              <p className="mt-1 text-sm font-bold text-textMain">{pendingTreatmentCount} {isAr ? 'قيد الانتظار' : 'pending'}</p>
            </article>
            <article className="rounded-xl border border-borderGray bg-slate-50 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-wide text-muted">{isAr ? 'مرضى تم علاجهم' : 'Treated Patients'}</p>
              <p className="mt-1 text-sm font-bold text-textMain">{treatedPatientsCount}</p>
            </article>
          </div>

          <div className="mt-3 rounded-xl border border-borderGray bg-slate-50 px-4 py-3">
            <p className="text-xs font-black uppercase tracking-wide text-muted">{isAr ? 'الموعد القادم' : 'Next Appointment'}</p>
            <p className="mt-1 text-sm font-bold text-textMain">
              {nextUpcomingAppointment
                ? `${isAr ? 'المريض' : 'Patient'} #${nextUpcomingAppointment.user_id.slice(0, 8)} • ${formatDateTime(nextUpcomingAppointment.start_at, locale)}`
                : isAr
                  ? 'لا توجد مواعيد قادمة'
                  : 'No upcoming appointments'}
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-hero border border-borderGray bg-white p-6 shadow-card">
          <h2 className="text-xl font-black text-textMain">{isAr ? 'المواعيد' : 'Appointments'}</h2>
          {isLoading ? (
            <p className="mt-4 text-sm text-muted">{isAr ? 'جارٍ تحميل المواعيد...' : 'Loading appointments...'}</p>
          ) : appointments.length === 0 ? (
            <p className="mt-4 text-sm text-muted">{isAr ? 'لا توجد مواعيد.' : 'No appointments found.'}</p>
          ) : (
            <div className="mt-4 space-y-3">
              {appointments.map((appointment) => (
                <article key={appointment.id} className="rounded-2xl border border-borderGray bg-slate-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-textMain">{isAr ? 'المريض' : 'Patient'} #{appointment.user_id.slice(0, 8)}</h3>
                      <p className="mt-1 text-xs text-muted">{formatDateTime(appointment.start_at, locale)}</p>
                      <p className="mt-1 text-xs text-muted">{isAr ? 'المنطقة الزمنية' : 'Timezone'}: {appointment.timezone}</p>
                      <p className="mt-1 text-xs text-muted">{isAr ? 'الفيديو' : 'Video'}: {appointment.call_status}</p>
                      <p className="mt-1 text-xs text-muted">{isAr ? 'الدفع' : 'Paid'}: {appointment.fee_paid ? (isAr ? 'نعم' : 'Yes') : (isAr ? 'لا' : 'No')}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${appointmentStatusClass(appointment.status)}`}>
                        {appointmentStatusLabel(appointment.status, isAr)}
                      </span>
                      <div className="flex gap-2">
                        {appointment.status === 'REQUESTED' && (
                          <button
                            type="button"
                            onClick={() => void updateAppointment(appointment.id, 'confirm')}
                            disabled={busyAction === `confirm_${appointment.id}`}
                            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primaryDark disabled:opacity-60"
                          >
                            {isAr ? 'تأكيد' : 'Confirm'}
                          </button>
                        )}
                        {(appointment.status === 'REQUESTED' || appointment.status === 'CONFIRMED') && (
                          <button
                            type="button"
                            onClick={() => void updateAppointment(appointment.id, 'cancel')}
                            disabled={busyAction === `cancel_${appointment.id}`}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:border-rose-300 disabled:opacity-60"
                          >
                            {isAr ? 'إلغاء' : 'Cancel'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-hero border border-borderGray bg-white p-6 shadow-card">
          <h2 className="text-xl font-black text-textMain">{isAr ? 'طلبات العلاج' : 'Treatment Requests'}</h2>
          {treatmentRequests.length === 0 ? (
            <p className="mt-4 text-sm text-muted">{isAr ? 'لا توجد طلبات علاج واردة.' : 'No incoming treatment requests.'}</p>
          ) : (
            <div className="mt-4 space-y-3">
              {treatmentRequests.map((request) => (
                <article key={request.id} className="rounded-xl border border-borderGray bg-slate-50 p-4">
                  <p className="text-xs text-muted">{isAr ? 'المريض' : 'Patient'} #{request.user_id.slice(0, 8)}</p>
                  <p className="mt-2 text-sm text-textMain">{request.message}</p>
                  <p className="mt-2 text-xs font-semibold text-muted">{isAr ? 'الحالة' : 'Status'}: {request.status}</p>
                  {request.status === 'PENDING' && (
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => void updateTreatmentRequestStatus(request.id, 'ACCEPTED')}
                        disabled={busyAction === `treatment_${request.id}_ACCEPTED`}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {isAr ? 'قبول' : 'Accept'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void updateTreatmentRequestStatus(request.id, 'DECLINED')}
                        disabled={busyAction === `treatment_${request.id}_DECLINED`}
                        className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
                      >
                        {isAr ? 'رفض' : 'Decline'}
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-hero border border-borderGray bg-white p-6 shadow-card">
          <h2 className="text-xl font-black text-textMain">{isAr ? 'سجل المرضى والخط الزمني' : 'Patient History & Timeline'}</h2>
          <p className="mt-2 text-sm text-muted">
            {isAr
              ? 'تابع رحلة كل مريض من الحجز حتى الانتهاء. يعرض الخط الزمني مراحل الموعد وتوقيتها.'
              : 'Follow each patient journey from booking to finish. Timeline entries show appointment stages and times.'}
          </p>
          {patientTimeline.length === 0 ? (
            <p className="mt-4 text-sm text-muted">{isAr ? 'لا يوجد سجل مرضى بعد.' : 'No patient history yet.'}</p>
          ) : (
            <div className="mt-4 space-y-3">
              {patientTimeline.map((patient) => (
                <article key={patient.patientId} className="rounded-xl border border-borderGray bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-textMain">{isAr ? 'المريض' : 'Patient'} #{patient.patientId.slice(0, 8)}</h3>
                    <p className="text-xs text-muted">
                      {isAr ? 'آخر حدث' : 'Last event'}: {patient.latestEventAt ? formatDateTime(patient.latestEventAt, locale) : (isAr ? 'غير متوفر' : 'N/A')}
                    </p>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-borderGray bg-white px-2 py-1 text-muted">
                      {isAr ? 'الإجمالي' : 'Total'}: {patient.totalAppointments}
                    </span>
                    <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 text-emerald-700">
                      {isAr ? 'مكتمل' : 'Finished'}: {patient.completedAppointments}
                    </span>
                    <span className="rounded-full border border-sky-100 bg-sky-50 px-2 py-1 text-sky-700">
                      {isAr ? 'قادم' : 'Upcoming'}: {patient.upcomingAppointments}
                    </span>
                  </div>

                  <ul className="mt-3 space-y-2 border-l-2 border-borderGray pl-3">
                    {patient.events.slice(0, 5).map((event) => (
                      <li key={event.id} className="rounded-lg border border-borderGray bg-white px-3 py-2 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className={`rounded-full border px-2 py-0.5 font-semibold ${appointmentStatusClass(event.status)}`}>
                            {appointmentJourneyLabel(event.status, isAr)}
                          </span>
                          <span className="text-muted">{formatDateTime(event.start_at, locale)}</span>
                        </div>
                        <p className="mt-1 text-muted">
                          {isAr ? 'تم الإنشاء' : 'Created'}: {formatDateTime(event.created_at, locale)}
                          {event.status === 'COMPLETED' ? (isAr ? ' • انتهى العلاج' : ' • Treatment finished') : ''}
                        </p>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-hero border border-borderGray bg-white p-6 shadow-card">
          <h2 className="text-xl font-black text-textMain">{isAr ? 'تقويم التوفر' : 'Availability Calendar'}</h2>
          <div className="mt-3">
            <button
              type="button"
              onClick={() => void importApplicationScheduleToCalendar()}
              disabled={busyAction === 'availability_import'}
              className="rounded-lg border border-borderGray bg-white px-3 py-1.5 text-xs font-semibold text-textMain transition hover:border-primary/40 hover:text-primary disabled:opacity-60"
            >
              {busyAction === 'availability_import'
                ? (isAr ? 'جارٍ الاستيراد...' : 'Importing...')
                : (isAr ? 'استيراد الأوقات المتاحة من طلب الطبيب' : 'Import Free Time from Doctor Apply')}
            </button>
          </div>
          <div className="mt-4">
            <AvailabilityCalendarBoard rules={rules} onAddRule={addRuleToCalendar} onRemoveRule={removeRuleFromCalendar} />
          </div>
        </section>

        <section className="mt-6 rounded-hero border border-borderGray bg-white p-6 shadow-card">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-black text-textMain">{isAr ? 'محادثات الطبيب' : 'Doctor Chats'}</h2>
              <p className="mt-1 text-sm text-muted">
                {isAr ? 'افتح صفحة محادثة كاملة مع المرضى الذين لديهم مواعيد.' : 'Open full page chat with your appointment patients.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('/doctor-chats')}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-primaryDark"
            >
              {isAr ? 'فتح المحادثات' : 'Open Chats'}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
