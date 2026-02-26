import { useMemo, useState } from 'react';
import Header from '../components/Header';

type AppointmentStatus = 'upcoming' | 'past' | 'cancelled';

type Appointment = {
  id: string;
  doctorName: string;
  doctorInitials: string;
  specialty: string;
  date: string;
  time: string;
  durationMinutes: number;
  sessionType: 'Online' | 'In-person';
  status: AppointmentStatus;
};

type Doctor = {
  id: string;
  name: string;
  initials: string;
  specialty: string;
  lastSeen: string;
  sessions: number;
};

type ActiveSection = 'overview' | 'appointments' | 'doctors' | 'settings' | 'privacy';

const dummyUser = {
  name: 'Sara',
  fullName: 'Sara Ahmed',
  avatarInitials: 'SA'
};

const dummyAppointments: Appointment[] = [
  {
    id: '1',
    doctorName: 'Dr. Layla Hassan',
    doctorInitials: 'LH',
    specialty: 'Clinical Psychologist',
    date: 'Today',
    time: '3:00 PM',
    durationMinutes: 50,
    sessionType: 'Online',
    status: 'upcoming'
  },
  {
    id: '2',
    doctorName: 'Dr. Omar Khalid',
    doctorInitials: 'OK',
    specialty: 'Child & Adolescent',
    date: 'Tomorrow',
    time: '11:30 AM',
    durationMinutes: 50,
    sessionType: 'In-person',
    status: 'upcoming'
  },
  {
    id: '3',
    doctorName: 'Dr. Maya Nasser',
    doctorInitials: 'MN',
    specialty: 'Couples Therapy',
    date: 'Feb 10, 2026',
    time: '5:00 PM',
    durationMinutes: 50,
    sessionType: 'Online',
    status: 'past'
  },
  {
    id: '4',
    doctorName: 'Dr. Yusuf Ali',
    doctorInitials: 'YA',
    specialty: 'Trauma Specialist',
    date: 'Jan 28, 2026',
    time: '7:30 PM',
    durationMinutes: 50,
    sessionType: 'Online',
    status: 'past'
  },
  {
    id: '5',
    doctorName: 'Dr. Jana Faris',
    doctorInitials: 'JF',
    specialty: 'Anxiety & Mood',
    date: 'Jan 15, 2026',
    time: '4:00 PM',
    durationMinutes: 50,
    sessionType: 'In-person',
    status: 'cancelled'
  }
];

const dummyDoctors: Doctor[] = [
  {
    id: 'd1',
    name: 'Dr. Layla Hassan',
    initials: 'LH',
    specialty: 'Clinical Psychologist',
    lastSeen: 'Today',
    sessions: 6
  },
  {
    id: 'd2',
    name: 'Dr. Omar Khalid',
    initials: 'OK',
    specialty: 'Child & Adolescent',
    lastSeen: 'Last week',
    sessions: 3
  },
  {
    id: 'd3',
    name: 'Dr. Maya Nasser',
    initials: 'MN',
    specialty: 'Couples Therapy',
    lastSeen: '2 weeks ago',
    sessions: 4
  }
];

function statusStyles(status: AppointmentStatus) {
  if (status === 'upcoming') {
    return 'bg-emerald-50 text-emerald-700';
  }
  if (status === 'past') {
    return 'bg-slate-50 text-slate-700';
  }
  return 'bg-rose-50 text-rose-700';
}

function statusLabel(status: AppointmentStatus) {
  if (status === 'upcoming') return 'Upcoming';
  if (status === 'past') return 'Completed';
  return 'Cancelled';
}

function SessionCountdown({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-primaryBg px-3 py-1 text-xs font-semibold text-primary">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      {label}
    </div>
  );
}

type AppointmentCardProps = {
  appointment: Appointment;
  showActions?: boolean;
};

function AppointmentCard({ appointment, showActions = true }: AppointmentCardProps) {
  return (
    <article className="group flex flex-col gap-3 rounded-2xl border border-borderGray bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-soft sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/30 text-sm font-bold text-primary">
            {appointment.doctorInitials}
          </div>
          <div>
            <h3 className="text-sm font-bold text-textMain sm:text-base">{appointment.doctorName}</h3>
            <p className="mt-0.5 text-xs text-muted sm:text-sm">{appointment.specialty}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  className="h-3.5 w-3.5 text-primary"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path d="M6 2v2m8-2v2M3.5 8h13M5 4h10a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 15 16h-10A1.5 1.5 0 0 1 3.5 14.5v-9A1.5 1.5 0 0 1 5 4Z" />
                </svg>
                {appointment.date}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  className="h-3.5 w-3.5 text-primary"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path d="M10 4.5v5l3 1.5M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z" />
                </svg>
                {appointment.time} • {appointment.durationMinutes} min
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-primaryBg px-2.5 py-1 text-[11px] font-semibold text-primary">
                {appointment.sessionType}
              </span>
            </div>
          </div>
        </div>
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyles(appointment.status)}`}>
          {statusLabel(appointment.status)}
        </span>
      </div>

      {showActions && (
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <button className="focus-outline inline-flex flex-1 items-center justify-center rounded-xl border border-borderGray px-3 py-2 text-xs font-semibold text-muted transition hover:border-primary/40 hover:text-primary sm:flex-none sm:px-4 sm:text-sm">
            View details
          </button>
          {appointment.status === 'upcoming' && (
            <>
              <button className="focus-outline inline-flex flex-1 items-center justify-center rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white shadow-card transition hover:bg-primaryDark sm:flex-none sm:px-4 sm:text-sm">
                Reschedule
              </button>
              <button className="focus-outline inline-flex flex-1 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:border-rose-300 sm:flex-none sm:px-4 sm:text-sm">
                Cancel
              </button>
            </>
          )}
          {appointment.status === 'past' && (
            <button className="focus-outline inline-flex flex-1 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:border-amber-300 sm:flex-none sm:px-4 sm:text-sm">
              Leave review
            </button>
          )}
        </div>
      )}
    </article>
  );
}

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

function ConfirmDialog({ open, title, description, confirmLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-soft">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
              <path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16ZM9 6h2v5H9V6Zm0 6h2v2H9v-2Z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-textMain sm:text-lg">{title}</h2>
            <p className="mt-1 text-sm text-muted">{description}</p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="focus-outline inline-flex items-center justify-center rounded-xl border border-borderGray px-4 py-2 text-sm font-semibold text-muted transition hover:border-slate-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="focus-outline inline-flex items-center justify-center rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-rose-600"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function OverviewSection() {
  const totalSessions = dummyAppointments.filter((a) => a.status === 'past').length + dummyAppointments.filter((a) => a.status === 'upcoming').length;
  const activeDoctors = dummyDoctors.length;
  const nextSession = dummyAppointments.find((a) => a.status === 'upcoming');

  const nextCountdownLabel = nextSession ? 'Next session in 2h 15m' : 'No upcoming sessions';

  return (
    <section aria-label="Dashboard overview" className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-hero border border-borderGray bg-gradient-to-r from-primary-50/80 via-white to-white p-5 shadow-soft sm:flex-row sm:items-center sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Welcome back</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-textMain sm:text-3xl">
            How are you feeling today, {dummyUser.name}?
          </h1>
          <p className="mt-2 text-sm text-muted sm:max-w-md">
            This is your private MindCare space. Track your sessions, manage your doctors, and keep your information secure.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start rounded-2xl bg-white/70 p-3 shadow-card backdrop-blur">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-sm font-bold text-primary">
            {dummyUser.avatarInitials}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Current mood check-in</p>
            <p className="mt-0.5 text-sm text-textMain">Take a 2‑minute reflection after your next session.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-card border border-borderGray bg-white p-4 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Total sessions</p>
          <p className="mt-2 text-2xl font-black text-textMain">{totalSessions}</p>
          <p className="mt-1 text-xs text-muted">Across all time</p>
        </div>
        <div className="rounded-card border border-borderGray bg-white p-4 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Active doctors</p>
          <p className="mt-2 text-2xl font-black text-textMain">{activeDoctors}</p>
          <p className="mt-1 text-xs text-muted">You&apos;ve seen recently</p>
        </div>
        <div className="rounded-card border border-borderGray bg-white p-4 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Next session</p>
          <p className="mt-2 text-sm font-semibold text-textMain">
            {nextSession ? `${nextSession.date} · ${nextSession.time}` : 'Not scheduled yet'}
          </p>
          <p className="mt-1 text-xs text-muted">
            {nextSession ? `${nextSession.doctorName} • ${nextSession.sessionType}` : 'Book with one of your doctors'}
          </p>
          <div className="mt-3">
            <SessionCountdown label={nextCountdownLabel} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.4fr)]">
        <div className="rounded-card border border-borderGray bg-white p-4 shadow-card sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-textMain sm:text-base">Upcoming appointment</h2>
            <a href="#appointments" className="text-xs font-semibold text-primary hover:text-primaryDark">
              View all
            </a>
          </div>
          <p className="mt-1 text-xs text-muted">Join on time and prepare your thoughts ahead.</p>
          <div className="mt-4">
            {nextSession ? (
              <AppointmentCard appointment={nextSession} showActions={false} />
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-borderGray bg-primaryBg/30 px-5 py-8 text-center">
                <p className="text-sm font-semibold text-muted">No upcoming sessions</p>
                <p className="mt-1 text-xs text-muted">
                  When you book a session, it will appear here so you can join quickly.
                </p>
                <button className="focus-outline mt-4 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-card transition hover:bg-primaryDark">
                  Find a therapist
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-card border border-borderGray bg-white p-4 shadow-card sm:p-5">
          <h2 className="text-sm font-bold text-textMain sm:text-base">Quick tips</h2>
          <ul className="mt-3 space-y-2.5 text-xs text-muted">
            <li className="flex gap-2">
              <span className="mt-[3px] h-1.5 w-1.5 flex-none rounded-full bg-primary" />
              Keep your contact and emergency details updated in Profile Settings.
            </li>
            <li className="flex gap-2">
              <span className="mt-[3px] h-1.5 w-1.5 flex-none rounded-full bg-primary" />
              For online sessions, test your camera and audio 5 minutes before.
            </li>
            <li className="flex gap-2">
              <span className="mt-[3px] h-1.5 w-1.5 flex-none rounded-full bg-primary" />
              You can download a copy of your data anytime from Privacy &amp; Security.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function AppointmentsSection() {
  const [tab, setTab] = useState<AppointmentStatus>('upcoming');

  const filtered = useMemo(
    () => dummyAppointments.filter((a) => a.status === tab),
    [tab]
  );

  return (
    <section id="appointments" aria-label="Appointments" className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-black tracking-tight text-textMain sm:text-2xl">My appointments</h1>
          <p className="mt-1 text-sm text-muted">
            Manage upcoming, past, and cancelled sessions in one place.
          </p>
        </div>
      </div>

      <div className="flex gap-2 rounded-full bg-primaryBg/60 p-1 text-xs font-semibold text-muted sm:text-sm">
        {[
          { key: 'upcoming', label: 'Upcoming' },
          { key: 'past', label: 'Past' },
          { key: 'cancelled', label: 'Cancelled' }
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key as AppointmentStatus)}
            className={`flex-1 rounded-full px-3 py-2 transition ${
              tab === item.key
                ? 'bg-white text-textMain shadow-card'
                : 'text-muted hover:text-textMain hover:bg-white/60'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-borderGray bg-primaryBg/40 px-6 py-10 text-center">
          <p className="text-sm font-semibold text-muted">
            No {tab === 'upcoming' ? 'upcoming' : tab === 'past' ? 'past' : 'cancelled'} appointments
          </p>
          <p className="mt-1 text-xs text-muted">
            When you book sessions, they will be organized here by status.
          </p>
          {tab === 'upcoming' && (
            <button className="focus-outline mt-4 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-card transition hover:bg-primaryDark">
              Book a new session
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((appointment) => (
            <AppointmentCard key={appointment.id} appointment={appointment} />
          ))}
        </div>
      )}
    </section>
  );
}

function DoctorsSection() {
  const hasDoctors = dummyDoctors.length > 0;

  return (
    <section aria-label="My doctors" className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-black tracking-tight text-textMain sm:text-2xl">My doctors</h1>
          <p className="mt-1 text-sm text-muted">
            Quickly reconnect with doctors you have previously booked.
          </p>
        </div>
      </div>

      {hasDoctors ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dummyDoctors.map((doctor) => (
            <article
              key={doctor.id}
              className="group flex flex-col justify-between rounded-2xl border border-borderGray bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-soft"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/30 text-sm font-bold text-primary">
                  {doctor.initials}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-textMain sm:text-base">{doctor.name}</h3>
                  <p className="mt-0.5 text-xs text-muted sm:text-sm">{doctor.specialty}</p>
                  <p className="mt-2 text-xs text-muted">
                    Last session: <span className="font-semibold text-textMain">{doctor.lastSeen}</span>
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Sessions together: <span className="font-semibold text-textMain">{doctor.sessions}</span>
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button className="focus-outline inline-flex flex-1 items-center justify-center rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white shadow-card transition hover:bg-primaryDark">
                  Book again
                </button>
                <button className="focus-outline inline-flex flex-1 items-center justify-center rounded-xl border border-borderGray px-3 py-2 text-xs font-semibold text-muted transition hover:border-primary/40 hover:text-primary">
                  View profile
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-borderGray bg-primaryBg/40 px-6 py-10 text-center">
          <p className="text-sm font-semibold text-muted">You don&apos;t have any doctors yet</p>
          <p className="mt-1 text-xs text-muted">
            Once you book a session, the doctor will appear here so you can easily book again.
          </p>
          <button className="focus-outline mt-4 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-card transition hover:bg-primaryDark">
            Browse doctors
          </button>
        </div>
      )}
    </section>
  );
}

function SettingsSection() {
  return (
    <section aria-label="Profile settings" className="space-y-6">
      <div>
        <h1 className="text-xl font-black tracking-tight text-textMain sm:text-2xl">Profile settings</h1>
        <p className="mt-1 text-sm text-muted">
          Keep your personal information and notifications up to date.
        </p>
      </div>

      <div className="space-y-6">
        <form className="space-y-5 rounded-2xl border border-borderGray bg-white p-5 shadow-card sm:p-6">
          <h2 className="text-sm font-bold text-textMain sm:text-base">Personal information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted">Full name</label>
              <input
                type="text"
                defaultValue={dummyUser.fullName}
                className="w-full rounded-xl border border-borderGray bg-white px-3 py-2.5 text-sm text-textMain placeholder-muted focus:border-primary focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted">Email</label>
              <input
                type="email"
                defaultValue="sara.ahmed@example.com"
                className="w-full rounded-xl border border-borderGray bg-white px-3 py-2.5 text-sm text-textMain placeholder-muted focus:border-primary focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted">Phone number</label>
              <input
                type="tel"
                defaultValue="+971 50 123 4567"
                className="w-full rounded-xl border border-borderGray bg-white px-3 py-2.5 text-sm text-textMain placeholder-muted focus:border-primary focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted">Preferred language</label>
              <select className="w-full rounded-xl border border-borderGray bg-white px-3 py-2.5 text-sm text-textMain focus:border-primary focus:outline-none">
                <option>English</option>
                <option>Arabic</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted">Emergency contact</label>
            <input
              type="text"
              defaultValue="Ali Ahmed · +971 55 987 6543"
              className="w-full rounded-xl border border-borderGray bg-white px-3 py-2.5 text-sm text-textMain placeholder-muted focus:border-primary focus:outline-none"
            />
            <p className="text-xs text-muted">
              This contact may be used by your therapist only in urgent situations.
            </p>
          </div>

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button
              type="button"
              className="focus-outline inline-flex items-center justify-center rounded-xl border border-borderGray px-4 py-2 text-sm font-semibold text-muted transition hover:border-slate-300"
            >
              Cancel
            </button>
            <button
              type="button"
              className="focus-outline inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-primaryDark"
            >
              Save changes
            </button>
          </div>
        </form>

        <div className="space-y-4 rounded-2xl border border-borderGray bg-white p-5 shadow-card sm:p-6">
          <h2 className="text-sm font-bold text-textMain sm:text-base">Notifications</h2>
          <div className="space-y-3">
            {[
              {
                id: 'email-session',
                title: 'Session reminders',
                description: 'Email reminders 24h and 1h before each session.',
                defaultChecked: true
              },
              {
                id: 'email-summary',
                title: 'Session summaries',
                description: 'Follow-up notes and homework from your therapist.',
                defaultChecked: true
              },
              {
                id: 'email-security',
                title: 'Security alerts',
                description: 'New logins and changes to your account.',
                defaultChecked: true
              },
              {
                id: 'email-tips',
                title: 'Wellbeing tips',
                description: 'Occasional articles and resources to support your journey.',
                defaultChecked: false
              }
            ].map((item) => (
              <label
                key={item.id}
                className="flex cursor-pointer items-start justify-between gap-3 rounded-2xl border border-transparent px-2 py-2 hover:border-primary/20 hover:bg-primaryBg/40"
              >
                <div>
                  <p className="text-sm font-semibold text-textMain">{item.title}</p>
                  <p className="mt-0.5 text-xs text-muted">{item.description}</p>
                </div>
                <div className="mt-1">
                  <input
                    type="checkbox"
                    defaultChecked={item.defaultChecked}
                    className="h-5 w-9 cursor-pointer appearance-none rounded-full border border-borderGray bg-slate-100 transition checked:border-primary checked:bg-primary"
                  />
                </div>
              </label>
            ))}
          </div>
        </div>

        <form className="space-y-4 rounded-2xl border border-borderGray bg-white p-5 shadow-card sm:p-6">
          <h2 className="text-sm font-bold text-textMain sm:text-base">Change password</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-1">
              <label className="text-xs font-semibold text-muted">Current password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-borderGray bg-white px-3 py-2.5 text-sm text-textMain placeholder-muted focus:border-primary focus:outline-none"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-1">
              <label className="text-xs font-semibold text-muted">New password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-borderGray bg-white px-3 py-2.5 text-sm text-textMain placeholder-muted focus:border-primary focus:outline-none"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-1">
              <label className="text-xs font-semibold text-muted">Confirm new password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-borderGray bg-white px-3 py-2.5 text-sm text-textMain placeholder-muted focus:border-primary focus:outline-none"
              />
            </div>
          </div>
          <p className="text-xs text-muted">
            Choose a strong password you have not used elsewhere. For your safety, we never store it in plain text.
          </p>
          <div className="flex justify-end">
            <button
              type="button"
              className="focus-outline inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-primaryDark"
            >
              Update password
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

function PrivacySection() {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <section aria-label="Privacy and security" className="space-y-6">
        <div>
          <h1 className="text-xl font-black tracking-tight text-textMain sm:text-2xl">Privacy &amp; security</h1>
          <p className="mt-1 text-sm text-muted">
            Control how your data is stored and request changes at any time.
          </p>
        </div>

        <div className="space-y-4 rounded-2xl border border-borderGray bg-white p-5 shadow-card sm:p-6">
          <h2 className="text-sm font-bold text-textMain sm:text-base">Your data</h2>
          <p className="text-sm text-muted">
            MindCare stores your data securely and only shares information with your treating professionals as needed
            for care. You can request a copy or deletion of your account at any time.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="button"
              className="focus-outline inline-flex items-center justify-center rounded-xl border border-borderGray px-4 py-2 text-sm font-semibold text-textMain transition hover:border-primary/40 hover:text-primary"
            >
              Download my data
            </button>
            <a
              href="/about"
              className="focus-outline inline-flex items-center justify-center rounded-xl border border-transparent px-2 py-2 text-sm font-semibold text-primary underline-offset-2 hover:underline"
            >
              View privacy policy
            </a>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-rose-100 bg-rose-50/70 p-5 shadow-card sm:p-6">
          <h2 className="text-sm font-bold text-rose-700 sm:text-base">Danger zone</h2>
          <p className="text-sm text-rose-700/80">
            Deleting your account will permanently remove your profile and access to this dashboard. Your clinicians
            may still retain clinical notes where required by law.
          </p>
          <button
            type="button"
            onClick={() => setShowDeleteDialog(true)}
            className="focus-outline inline-flex items-center justify-center rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-rose-600"
          >
            Delete my account
          </button>
        </div>
      </section>

      <ConfirmDialog
        open={showDeleteDialog}
        title="Delete your MindCare account?"
        description="This action cannot be undone. Your access to past sessions and this dashboard will be removed. Your therapists may still keep mandatory clinical records where required."
        confirmLabel="Yes, delete my account"
        onConfirm={() => setShowDeleteDialog(false)}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </>
  );
}

export default function DashboardPage() {
  const [section, setSection] = useState<ActiveSection>('overview');

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/40 via-white to-white text-textMain">
      <Header
        brandHref="/dashboard"
        navItems={[
          { labelKey: 'nav.doctors', href: '#doctors' },
          { labelKey: 'nav.about', href: '/about' }
        ]}
      />

      <main className="section-shell py-6 sm:py-8">
        <div className="grid gap-5 lg:grid-cols-[260px,minmax(0,1fr)] lg:items-start">
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-2xl border border-borderGray bg-white p-3 shadow-card">
              <div className="flex items-center gap-3 rounded-xl bg-primaryBg px-3 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
                  {dummyUser.avatarInitials}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-muted">Signed in as</p>
                  <p className="truncate text-sm font-bold text-textMain">{dummyUser.fullName}</p>
                </div>
              </div>

              <nav className="mt-3 space-y-1 text-sm font-semibold text-muted" aria-label="Patient dashboard sections">
                {[
                  { key: 'overview', label: 'Dashboard' },
                  { key: 'appointments', label: 'My appointments' },
                  { key: 'doctors', label: 'My doctors' },
                  { key: 'settings', label: 'Profile settings' },
                  { key: 'privacy', label: 'Privacy & security' }
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSection(item.key as ActiveSection)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition ${
                      section === item.key
                        ? 'bg-primaryBg text-textMain shadow-card'
                        : 'hover:bg-slate-50 hover:text-textMain'
                    }`}
                  >
                    <span>{item.label}</span>
                    {section === item.key && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          <div className="space-y-6">
            <div className="lg:hidden">
              <div className="flex gap-2 overflow-x-auto rounded-2xl bg-primaryBg/70 p-1 text-xs font-semibold text-muted sm:text-sm">
                {[
                  { key: 'overview', label: 'Dashboard' },
                  { key: 'appointments', label: 'Appointments' },
                  { key: 'doctors', label: 'My doctors' },
                  { key: 'settings', label: 'Settings' },
                  { key: 'privacy', label: 'Privacy' }
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSection(item.key as ActiveSection)}
                    className={`whitespace-nowrap rounded-2xl px-3 py-2 transition ${
                      section === item.key
                        ? 'bg-white text-textMain shadow-card'
                        : 'text-muted hover:bg-white/80 hover:text-textMain'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {section === 'overview' && <OverviewSection />}
            {section === 'appointments' && <AppointmentsSection />}
            {section === 'doctors' && <DoctorsSection />}
            {section === 'settings' && <SettingsSection />}
            {section === 'privacy' && <PrivacySection />}
          </div>
        </div>
      </main>
    </div>
  );
}
