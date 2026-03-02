import { useEffect, useMemo, useState } from 'react';
import AvailabilityCalendarBoard from '../components/AvailabilityCalendarBoard';
import Header from '../components/Header';
import MessageCenter from '../components/MessageCenter';
import TimelineFeed from '../components/TimelineFeed';
import { ApiError, apiJson } from '../utils/api';

type ApplicationStatus = 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'NEEDS_CHANGES';
type DocumentStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';
type AppointmentStatus = 'REQUESTED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
type AppointmentCallStatus = 'NOT_READY' | 'READY' | 'LIVE' | 'ENDED';
type TreatmentRequestStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';
type ReferralStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'COMPLETED';

type DoctorApplication = {
  id: string;
  doctor_user_id: string;
  status: ApplicationStatus;
  display_name: string | null;
  headline: string | null;
  internal_notes: string | null;
  rejection_reason: string | null;
  updated_at: string;
};

type DoctorDocument = {
  id: string;
  application_id: string;
  type: 'LICENSE' | 'ID' | 'DEGREE' | 'OTHER';
  file_url: string;
  status: DocumentStatus;
  admin_comment: string | null;
  uploaded_at: string;
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

type Referral = {
  id: string;
  sender_doctor_id: string;
  receiver_doctor_id: string;
  patient_id: string;
  status: ReferralStatus;
  note: string | null;
  created_at: string;
};

type PatientRecord = {
  id: string;
  user_id: string;
  doctor_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

type RecordEntry = {
  id: string;
  record_id: string;
  entry_type: 'DIAGNOSIS' | 'PRESCRIPTION' | 'TEST_RESULT' | 'NOTE';
  content: string;
  created_at: string;
};

type ProfileUpdateRequest = {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  admin_note: string | null;
  created_at: string;
};

type AvailabilityBulkResponse = {
  rules: AvailabilityRule[];
  exceptions: AvailabilityException[];
};

function formatDateTime(isoValue: string): string {
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

function appStatusClass(status: ApplicationStatus): string {
  if (status === 'APPROVED') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (status === 'REJECTED') return 'bg-rose-50 text-rose-700 border-rose-100';
  if (status === 'NEEDS_CHANGES') return 'bg-amber-50 text-amber-700 border-amber-100';
  if (status === 'IN_REVIEW' || status === 'SUBMITTED') return 'bg-sky-50 text-sky-700 border-sky-100';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

function appointmentStatusClass(status: AppointmentStatus): string {
  if (status === 'CONFIRMED') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (status === 'REQUESTED') return 'bg-sky-50 text-sky-700 border-sky-100';
  if (status === 'CANCELLED') return 'bg-rose-50 text-rose-700 border-rose-100';
  if (status === 'NO_SHOW') return 'bg-amber-50 text-amber-700 border-amber-100';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

export default function DoctorDashboardPage() {
  const [application, setApplication] = useState<DoctorApplication | null>(null);
  const [documents, setDocuments] = useState<DoctorDocument[]>([]);
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
  const [treatmentRequests, setTreatmentRequests] = useState<TreatmentRequest[]>([]);
  const [incomingReferrals, setIncomingReferrals] = useState<Referral[]>([]);
  const [outgoingReferrals, setOutgoingReferrals] = useState<Referral[]>([]);
  const [records, setRecords] = useState<PatientRecord[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [selectedRecordEntries, setSelectedRecordEntries] = useState<RecordEntry[]>([]);
  const [profileUpdates, setProfileUpdates] = useState<ProfileUpdateRequest[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const [referralReceiverDoctorId, setReferralReceiverDoctorId] = useState('');
  const [referralPatientId, setReferralPatientId] = useState('');
  const [referralNote, setReferralNote] = useState('');

  const [recordPatientId, setRecordPatientId] = useState('');
  const [recordTitle, setRecordTitle] = useState('Patient Record');
  const [entryType, setEntryType] = useState<'DIAGNOSIS' | 'PRESCRIPTION' | 'TEST_RESULT' | 'NOTE'>('NOTE');
  const [entryContent, setEntryContent] = useState('');
  const [profileUpdateJson, setProfileUpdateJson] = useState('{ "headline": "Updated professional headline" }');

  const upcomingCount = useMemo(
    () => appointments.filter((item) => item.status === 'REQUESTED' || item.status === 'CONFIRMED').length,
    [appointments]
  );

  const loadDashboard = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [
        appPayload,
        docsPayload,
        appointmentsPayload,
        rulesPayload,
        exceptionsPayload,
        treatmentRequestsPayload,
        incomingReferralsPayload,
        outgoingReferralsPayload,
        recordsPayload,
        profileUpdatesPayload
      ] = await Promise.all([
        apiJson<DoctorApplication>('/doctor/application', undefined, true, 'Failed to load application'),
        apiJson<DoctorDocument[]>('/doctor/documents', undefined, true, 'Failed to load documents'),
        apiJson<DoctorAppointment[]>('/doctor/appointments', undefined, true, 'Failed to load appointments'),
        apiJson<AvailabilityRule[]>('/doctor/availability/rules', undefined, true, 'Failed to load availability rules'),
        apiJson<AvailabilityException[]>(
          '/doctor/availability/exceptions',
          undefined,
          true,
          'Failed to load availability exceptions'
        ),
        apiJson<TreatmentRequest[]>('/doctor/treatment-requests', undefined, true, 'Failed to load treatment requests'),
        apiJson<Referral[]>('/doctor/referrals/incoming', undefined, true, 'Failed to load incoming referrals'),
        apiJson<Referral[]>('/doctor/referrals/outgoing', undefined, true, 'Failed to load outgoing referrals'),
        apiJson<PatientRecord[]>('/doctor/patient-records', undefined, true, 'Failed to load patient records'),
        apiJson<ProfileUpdateRequest[]>('/doctor/profile-updates', undefined, true, 'Failed to load profile updates')
      ]);

      setApplication(appPayload);
      setDocuments(docsPayload);
      setAppointments(appointmentsPayload);
      setRules(rulesPayload);
      setExceptions(exceptionsPayload);
      setTreatmentRequests(treatmentRequestsPayload);
      setIncomingReferrals(incomingReferralsPayload);
      setOutgoingReferrals(outgoingReferralsPayload);
      setRecords(recordsPayload);
      setProfileUpdates(profileUpdatesPayload);

      if (!selectedRecordId && recordsPayload.length > 0) {
        setSelectedRecordId(recordsPayload[0].id);
      }
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        setErrorMessage('You do not have doctor access for this dashboard.');
      } else {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load doctor dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecordEntries = async (recordId: string) => {
    try {
      const payload = await apiJson<RecordEntry[]>(
        `/records/${recordId}/entries`,
        undefined,
        true,
        'Failed to load record entries'
      );
      setSelectedRecordEntries(payload);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load record entries');
      setSelectedRecordEntries([]);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  useEffect(() => {
    if (selectedRecordId) {
      void loadRecordEntries(selectedRecordId);
    } else {
      setSelectedRecordEntries([]);
    }
  }, [selectedRecordId]);

  const submitApplication = async () => {
    setBusyAction('submit_application');
    setErrorMessage(null);
    try {
      await apiJson<{ status: ApplicationStatus; submitted_at: string }>(
        '/doctor/application/submit',
        { method: 'POST' },
        true,
        'Failed to submit application'
      );
      await loadDashboard();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to submit application');
    } finally {
      setBusyAction(null);
    }
  };

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

  const createReferral = async () => {
    const receiver = referralReceiverDoctorId.trim();
    const patient = referralPatientId.trim();
    if (!receiver || !patient) {
      setErrorMessage('Receiver doctor and patient IDs are required.');
      return;
    }
    setBusyAction('create_referral');
    try {
      await apiJson(
        '/referrals',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receiver_doctor_id: receiver,
            patient_id: patient,
            note: referralNote.trim() || null
          })
        },
        true,
        'Failed to create referral'
      );
      setReferralReceiverDoctorId('');
      setReferralPatientId('');
      setReferralNote('');
      await loadDashboard();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create referral');
    } finally {
      setBusyAction(null);
    }
  };

  const createPatientRecord = async () => {
    const userId = recordPatientId.trim();
    if (!userId) {
      setErrorMessage('Patient user ID is required.');
      return;
    }
    setBusyAction('create_record');
    try {
      await apiJson(
        '/doctor/patient-records',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, title: recordTitle.trim() || 'Patient Record' })
        },
        true,
        'Failed to create patient record'
      );
      setRecordPatientId('');
      await loadDashboard();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create patient record');
    } finally {
      setBusyAction(null);
    }
  };

  const createRecordEntry = async () => {
    if (!selectedRecordId) {
      setErrorMessage('Select a patient record first.');
      return;
    }
    const content = entryContent.trim();
    if (!content) {
      setErrorMessage('Entry content is required.');
      return;
    }
    setBusyAction('create_record_entry');
    try {
      await apiJson(
        `/records/${selectedRecordId}/entries`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entry_type: entryType, content })
        },
        true,
        'Failed to create record entry'
      );
      setEntryContent('');
      await loadRecordEntries(selectedRecordId);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create record entry');
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

  const submitProfileUpdateRequest = async () => {
    setBusyAction('profile_update_request');
    try {
      const parsed = JSON.parse(profileUpdateJson) as Record<string, unknown>;
      await apiJson(
        '/doctor/profile-updates',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payload_json: parsed })
        },
        true,
        'Failed to submit profile update request'
      );
      await loadDashboard();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to submit profile update request');
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
                Manage appointments, treatment requests, referrals, EHR records, messaging, and onboarding updates.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadDashboard()}
              className="rounded-xl border border-borderGray px-3 py-2 text-xs font-semibold text-textMain transition hover:border-primary/40 hover:text-primary"
            >
              Refresh
            </button>
          </div>

          {errorMessage && (
            <p className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p>
          )}

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <article className="rounded-xl border border-borderGray bg-slate-50 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-wide text-muted">Application</p>
              <p className="mt-1 text-sm font-bold text-textMain">{application?.status ?? 'N/A'}</p>
            </article>
            <article className="rounded-xl border border-borderGray bg-slate-50 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-wide text-muted">Upcoming</p>
              <p className="mt-1 text-sm font-bold text-textMain">{upcomingCount}</p>
            </article>
            <article className="rounded-xl border border-borderGray bg-slate-50 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-wide text-muted">Treatment Requests</p>
              <p className="mt-1 text-sm font-bold text-textMain">{treatmentRequests.length}</p>
            </article>
            <article className="rounded-xl border border-borderGray bg-slate-50 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-wide text-muted">Patient Records</p>
              <p className="mt-1 text-sm font-bold text-textMain">{records.length}</p>
            </article>
          </div>
        </section>

        <section className="mt-6 rounded-hero border border-borderGray bg-white p-6 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black text-textMain">Application</h2>
            {application && (application.status === 'DRAFT' || application.status === 'NEEDS_CHANGES') && (
              <button
                type="button"
                onClick={() => void submitApplication()}
                disabled={busyAction === 'submit_application'}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primaryDark disabled:opacity-60"
              >
                {busyAction === 'submit_application' ? 'Submitting...' : 'Submit Application'}
              </button>
            )}
          </div>
          {isLoading ? (
            <p className="mt-4 text-sm text-muted">Loading application...</p>
          ) : !application ? (
            <p className="mt-4 text-sm text-muted">No application found.</p>
          ) : (
            <div className="mt-4 rounded-2xl border border-borderGray bg-slate-50 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-textMain">{application.display_name ?? 'Unnamed profile'}</h3>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${appStatusClass(application.status)}`}>
                  {application.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted">Updated: {formatDateTime(application.updated_at)}</p>
              {application.rejection_reason && (
                <p className="mt-2 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  Rejection reason: {application.rejection_reason}
                </p>
              )}
              {application.internal_notes && (
                <p className="mt-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  Admin notes: {application.internal_notes}
                </p>
              )}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-hero border border-borderGray bg-white p-6 shadow-card">
          <h2 className="text-xl font-black text-textMain">Appointments</h2>
          {isLoading ? (
            <p className="mt-4 text-sm text-muted">Loading appointments...</p>
          ) : appointments.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No appointments found.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {appointments.map((appointment) => (
                <article key={appointment.id} className="rounded-2xl border border-borderGray bg-slate-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-textMain">Patient #{appointment.user_id.slice(0, 8)}</h3>
                      <p className="mt-1 text-xs text-muted">{formatDateTime(appointment.start_at)}</p>
                      <p className="mt-1 text-xs text-muted">Timezone: {appointment.timezone}</p>
                      <p className="mt-1 text-xs text-muted">Video: {appointment.call_status}</p>
                      <p className="mt-1 text-xs text-muted">Paid: {appointment.fee_paid ? 'Yes' : 'No'}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${appointmentStatusClass(appointment.status)}`}>
                        {appointment.status}
                      </span>
                      <div className="flex gap-2">
                        {appointment.status === 'REQUESTED' && (
                          <button
                            type="button"
                            onClick={() => void updateAppointment(appointment.id, 'confirm')}
                            disabled={busyAction === `confirm_${appointment.id}`}
                            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primaryDark disabled:opacity-60"
                          >
                            Confirm
                          </button>
                        )}
                        {(appointment.status === 'REQUESTED' || appointment.status === 'CONFIRMED') && (
                          <button
                            type="button"
                            onClick={() => void updateAppointment(appointment.id, 'cancel')}
                            disabled={busyAction === `cancel_${appointment.id}`}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:border-rose-300 disabled:opacity-60"
                          >
                            Cancel
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
          <h2 className="text-xl font-black text-textMain">Treatment Requests</h2>
          {treatmentRequests.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No incoming treatment requests.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {treatmentRequests.map((request) => (
                <article key={request.id} className="rounded-xl border border-borderGray bg-slate-50 p-4">
                  <p className="text-xs text-muted">Patient #{request.user_id.slice(0, 8)}</p>
                  <p className="mt-2 text-sm text-textMain">{request.message}</p>
                  <p className="mt-2 text-xs font-semibold text-muted">Status: {request.status}</p>
                  {request.status === 'PENDING' && (
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => void updateTreatmentRequestStatus(request.id, 'ACCEPTED')}
                        disabled={busyAction === `treatment_${request.id}_ACCEPTED`}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => void updateTreatmentRequestStatus(request.id, 'DECLINED')}
                        disabled={busyAction === `treatment_${request.id}_DECLINED`}
                        className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-hero border border-borderGray bg-white p-6 shadow-card">
          <h2 className="text-xl font-black text-textMain">Referrals</h2>
          <div className="mt-4 rounded-xl border border-borderGray bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Create Referral</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <input
                value={referralReceiverDoctorId}
                onChange={(event) => setReferralReceiverDoctorId(event.target.value)}
                placeholder="Receiver Doctor User ID"
                className="rounded-lg border border-borderGray bg-white px-3 py-2 text-sm text-textMain"
              />
              <input
                value={referralPatientId}
                onChange={(event) => setReferralPatientId(event.target.value)}
                placeholder="Patient User ID"
                className="rounded-lg border border-borderGray bg-white px-3 py-2 text-sm text-textMain"
              />
            </div>
            <textarea
              rows={2}
              value={referralNote}
              onChange={(event) => setReferralNote(event.target.value)}
              placeholder="Referral note (optional)"
              className="mt-2 w-full rounded-lg border border-borderGray bg-white px-3 py-2 text-sm text-textMain"
            />
            <button
              type="button"
              onClick={() => void createReferral()}
              disabled={busyAction === 'create_referral'}
              className="mt-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primaryDark disabled:opacity-60"
            >
              {busyAction === 'create_referral' ? 'Sending...' : 'Create Referral'}
            </button>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <article className="rounded-xl border border-borderGray bg-slate-50 p-4">
              <h3 className="text-sm font-bold text-textMain">Incoming</h3>
              {incomingReferrals.length === 0 ? (
                <p className="mt-2 text-xs text-muted">No incoming referrals.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {incomingReferrals.map((item) => (
                    <li key={item.id} className="text-xs text-muted">
                      Patient #{item.patient_id.slice(0, 8)} • Status: {item.status}
                    </li>
                  ))}
                </ul>
              )}
            </article>
            <article className="rounded-xl border border-borderGray bg-slate-50 p-4">
              <h3 className="text-sm font-bold text-textMain">Outgoing</h3>
              {outgoingReferrals.length === 0 ? (
                <p className="mt-2 text-xs text-muted">No outgoing referrals.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {outgoingReferrals.map((item) => (
                    <li key={item.id} className="text-xs text-muted">
                      To doctor #{item.receiver_doctor_id.slice(0, 8)} • Status: {item.status}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </div>
        </section>

        <section className="mt-6 rounded-hero border border-borderGray bg-white p-6 shadow-card">
          <h2 className="text-xl font-black text-textMain">EHR Records</h2>
          <div className="mt-4 rounded-xl border border-borderGray bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Create Patient Record</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <input
                value={recordPatientId}
                onChange={(event) => setRecordPatientId(event.target.value)}
                placeholder="Patient User ID"
                className="rounded-lg border border-borderGray bg-white px-3 py-2 text-sm text-textMain"
              />
              <input
                value={recordTitle}
                onChange={(event) => setRecordTitle(event.target.value)}
                placeholder="Record title"
                className="rounded-lg border border-borderGray bg-white px-3 py-2 text-sm text-textMain"
              />
            </div>
            <button
              type="button"
              onClick={() => void createPatientRecord()}
              disabled={busyAction === 'create_record'}
              className="mt-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primaryDark disabled:opacity-60"
            >
              {busyAction === 'create_record' ? 'Creating...' : 'Create Record'}
            </button>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[0.8fr_1.2fr]">
            <article className="rounded-xl border border-borderGray bg-slate-50 p-4">
              <h3 className="text-sm font-bold text-textMain">Records</h3>
              {records.length === 0 ? (
                <p className="mt-2 text-xs text-muted">No records yet.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {records.map((record) => (
                    <li key={record.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedRecordId(record.id)}
                        className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition ${
                          selectedRecordId === record.id
                            ? 'border-primary bg-primary-50 text-primary'
                            : 'border-borderGray bg-white text-muted hover:border-primary/30 hover:text-primary'
                        }`}
                      >
                        {record.title} • Patient #{record.user_id.slice(0, 8)}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </article>
            <article className="rounded-xl border border-borderGray bg-slate-50 p-4">
              <h3 className="text-sm font-bold text-textMain">Record Entries</h3>
              {!selectedRecordId ? (
                <p className="mt-2 text-xs text-muted">Select a record to manage entries.</p>
              ) : (
                <>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    <select
                      value={entryType}
                      onChange={(event) => setEntryType(event.target.value as typeof entryType)}
                      className="rounded-lg border border-borderGray bg-white px-3 py-2 text-sm text-textMain"
                    >
                      <option value="NOTE">NOTE</option>
                      <option value="DIAGNOSIS">DIAGNOSIS</option>
                      <option value="PRESCRIPTION">PRESCRIPTION</option>
                      <option value="TEST_RESULT">TEST_RESULT</option>
                    </select>
                    <input
                      value={entryContent}
                      onChange={(event) => setEntryContent(event.target.value)}
                      placeholder="Entry content"
                      className="sm:col-span-2 rounded-lg border border-borderGray bg-white px-3 py-2 text-sm text-textMain"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => void createRecordEntry()}
                    disabled={busyAction === 'create_record_entry'}
                    className="mt-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primaryDark disabled:opacity-60"
                  >
                    {busyAction === 'create_record_entry' ? 'Saving...' : 'Add Entry'}
                  </button>
                  {selectedRecordEntries.length === 0 ? (
                    <p className="mt-3 text-xs text-muted">No entries yet.</p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {selectedRecordEntries.map((entry) => (
                        <li key={entry.id} className="rounded-lg border border-borderGray bg-white p-2 text-xs text-muted">
                          <p className="font-semibold text-textMain">{entry.entry_type}</p>
                          <p>{entry.content}</p>
                          <p className="mt-1">{formatDateTime(entry.created_at)}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </article>
          </div>
        </section>

        <section className="mt-6 rounded-hero border border-borderGray bg-white p-6 shadow-card">
          <h2 className="text-xl font-black text-textMain">Availability Calendar</h2>
          <div className="mt-4">
            <AvailabilityCalendarBoard rules={rules} onAddRule={addRuleToCalendar} />
          </div>
          <article className="mt-4 rounded-xl border border-borderGray bg-slate-50 p-4">
            <h3 className="text-sm font-bold text-textMain">Exceptions</h3>
            {exceptions.length === 0 ? (
              <p className="mt-2 text-xs text-muted">No exceptions configured.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {exceptions.map((exception) => (
                  <li key={exception.id} className="text-xs text-muted">
                    {exception.date}: {exception.is_blocking ? 'Blocking' : 'Unblocking'}
                    {exception.is_recurring ? ` • ${exception.recurrence_type} every ${exception.recurrence_interval}` : ''}
                    {exception.start_time && exception.end_time ? ` (${exception.start_time} - ${exception.end_time})` : ''}
                  </li>
                ))}
              </ul>
            )}
          </article>
        </section>

        <section className="mt-6 rounded-hero border border-borderGray bg-white p-6 shadow-card">
          <h2 className="text-xl font-black text-textMain">Profile Update Requests</h2>
          <p className="mt-2 text-sm text-muted">
            Submit profile updates for admin approval before they go live on the public directory.
          </p>
          <textarea
            rows={5}
            value={profileUpdateJson}
            onChange={(event) => setProfileUpdateJson(event.target.value)}
            className="mt-3 w-full rounded-xl border border-borderGray bg-white px-3 py-2 text-sm text-textMain"
          />
          <button
            type="button"
            onClick={() => void submitProfileUpdateRequest()}
            disabled={busyAction === 'profile_update_request'}
            className="mt-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primaryDark disabled:opacity-60"
          >
            {busyAction === 'profile_update_request' ? 'Submitting...' : 'Submit Update Request'}
          </button>
          {profileUpdates.length > 0 && (
            <ul className="mt-3 space-y-2">
              {profileUpdates.map((item) => (
                <li key={item.id} className="rounded-lg border border-borderGray bg-slate-50 p-3 text-xs text-muted">
                  {formatDateTime(item.created_at)} • {item.status}
                  {item.admin_note ? ` • ${item.admin_note}` : ''}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-6 rounded-hero border border-borderGray bg-white p-6 shadow-card">
          <h2 className="text-xl font-black text-textMain">Documents</h2>
          {documents.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No uploaded documents found.</p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {documents.map((document) => (
                <article key={document.id} className="rounded-2xl border border-borderGray bg-slate-50 p-4">
                  <p className="text-sm font-bold text-textMain">{document.type}</p>
                  <p className="mt-1 text-xs text-muted">Uploaded: {formatDateTime(document.uploaded_at)}</p>
                  <p className="mt-1 text-xs text-muted">Status: {document.status}</p>
                  {document.admin_comment && <p className="mt-1 text-xs text-muted">Comment: {document.admin_comment}</p>}
                  <a
                    href={document.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-xs font-semibold text-primary hover:text-primaryDark"
                  >
                    Open file
                  </a>
                </article>
              ))}
            </div>
          )}
        </section>

        <TimelineFeed className="mt-6" title="Doctor Timeline" />
        <MessageCenter className="mt-6" title="Doctor Inbox / Outbox" />
      </main>
    </div>
  );
}
