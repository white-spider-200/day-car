import { useMemo, useState } from 'react';
import Header from '../components/Header';

type DashboardSection =
  | 'dashboard'
  | 'appointments'
  | 'availability'
  | 'profile'
  | 'patients'
  | 'reviews'
  | 'verification'
  | 'settings';

type AppointmentStatus = 'upcoming' | 'completed' | 'cancelled';

type Appointment = {
  id: string;
  patientName: string;
  initials: string;
  date: string;
  time: string;
  durationMinutes: number;
  type: 'Video' | 'In‑person';
  status: AppointmentStatus;
  notes?: string;
};

type Patient = {
  id: string;
  name: string;
  initials: string;
  totalSessions: number;
  lastVisit: string;
};

type Review = {
  id: string;
  reviewer: string;
  rating: number;
  date: string;
  comment: string;
};

type DayKey = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

type TimeSlot = {
  id: string;
  day: DayKey;
  start: string;
  end: string;
  isBooked?: boolean;
};

const doctor = {
  name: 'Dr. Layla Hassan',
  specialty: 'Clinical Psychologist',
  avatarInitials: 'LH'
};

const appointmentsSeed: Appointment[] = [
  {
    id: 'a1',
    patientName: 'Sara Ahmed',
    initials: 'SA',
    date: 'Today',
    time: '3:00 PM',
    durationMinutes: 50,
    type: 'Video',
    status: 'upcoming',
    notes: 'Third CBT session focused on anxiety triggers.'
  },
  {
    id: 'a2',
    patientName: 'Omar Khalid',
    initials: 'OK',
    date: 'Today',
    time: '5:30 PM',
    durationMinutes: 50,
    type: 'In‑person',
    status: 'upcoming'
  },
  {
    id: 'a3',
    patientName: 'Maya Nasser',
    initials: 'MN',
    date: 'Tomorrow',
    time: '10:00 AM',
    durationMinutes: 50,
    type: 'Video',
    status: 'upcoming'
  },
  {
    id: 'a4',
    patientName: 'Yusuf Ali',
    initials: 'YA',
    date: 'Feb 10, 2026',
    time: '7:00 PM',
    durationMinutes: 50,
    type: 'Video',
    status: 'completed',
    notes: 'Reviewed sleep hygiene plan. Homework assigned.'
  },
  {
    id: 'a5',
    patientName: 'Jana Faris',
    initials: 'JF',
    date: 'Feb 8, 2026',
    time: '4:00 PM',
    durationMinutes: 50,
    type: 'In‑person',
    status: 'completed'
  },
  {
    id: 'a6',
    patientName: 'Ali Hassan',
    initials: 'AH',
    date: 'Feb 6, 2026',
    time: '2:00 PM',
    durationMinutes: 50,
    type: 'Video',
    status: 'cancelled',
    notes: 'Cancelled by patient due to travel.'
  }
];

const patientsSeed: Patient[] = [
  { id: 'p1', name: 'Sara Ahmed', initials: 'SA', totalSessions: 8, lastVisit: 'Today' },
  { id: 'p2', name: 'Omar Khalid', initials: 'OK', totalSessions: 3, lastVisit: 'Last week' },
  { id: 'p3', name: 'Maya Nasser', initials: 'MN', totalSessions: 5, lastVisit: '2 weeks ago' },
  { id: 'p4', name: 'Yusuf Ali', initials: 'YA', totalSessions: 2, lastVisit: '1 month ago' }
];

const reviewsSeed: Review[] = [
  {
    id: 'r1',
    reviewer: 'Anonymous',
    rating: 5,
    date: 'Feb 12, 2026',
    comment: 'Dr. Layla listens with empathy and offers very practical tools. I feel safe in our sessions.'
  },
  {
    id: 'r2',
    reviewer: 'Sara A.',
    rating: 5,
    date: 'Feb 5, 2026',
    comment: 'I’ve seen real improvement in my anxiety since starting therapy. Highly recommend.'
  },
  {
    id: 'r3',
    reviewer: 'Omar K.',
    rating: 4,
    date: 'Jan 29, 2026',
    comment: 'Sessions are structured and helpful. Sometimes we run out of time, but overall great.'
  },
  {
    id: 'r4',
    reviewer: 'Maya N.',
    rating: 4,
    date: 'Jan 20, 2026',
    comment: 'Very considerate and culturally sensitive. Helped us communicate better as a couple.'
  },
  {
    id: 'r5',
    reviewer: 'Anonymous',
    rating: 5,
    date: 'Jan 10, 2026',
    comment: 'I appreciate the balance between validation and gentle challenge. I feel understood.'
  }
];

const availabilitySeed: TimeSlot[] = [
  { id: 's1', day: 'Mon', start: '10:00', end: '12:00' },
  { id: 's2', day: 'Mon', start: '15:00', end: '17:00', isBooked: true },
  { id: 's3', day: 'Tue', start: '09:00', end: '12:00' },
  { id: 's4', day: 'Wed', start: '13:00', end: '16:00' },
  { id: 's5', day: 'Thu', start: '10:00', end: '13:00', isBooked: true },
  { id: 's6', day: 'Sat', start: '11:00', end: '14:00' }
];

function statusBadgeClasses(status: AppointmentStatus) {
  if (status === 'upcoming') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (status === 'completed') return 'bg-sky-50 text-sky-700 border-sky-100';
  return 'bg-rose-50 text-rose-700 border-rose-100';
}

function statusLabel(status: AppointmentStatus) {
  if (status === 'upcoming') return 'Upcoming';
  if (status === 'completed') return 'Completed';
  return 'Cancelled';
}

function initialsFromName(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function AppointmentCard({
  appointment,
  onMarkCompleted
}: {
  appointment: Appointment;
  onMarkCompleted?: (id: string) => void;
}) {
  const [showNotes, setShowNotes] = useState(false);

  return (
    <article className="group flex flex-col gap-3 rounded-[18px] border border-borderGray bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-soft sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/30 text-sm font-bold text-primary">
            {appointment.initials}
          </div>
          <div>
            <h3 className="text-sm font-bold text-textMain sm:text-base">{appointment.patientName}</h3>
            <p className="mt-0.5 text-xs text-muted sm:text-sm">
              {appointment.type} session • {appointment.durationMinutes} min
            </p>
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
                {appointment.time}
              </span>
            </div>
          </div>
        </div>
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusBadgeClasses(
            appointment.status
          )}`}
        >
          {statusLabel(appointment.status)}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button className="focus-outline inline-flex flex-1 items-center justify-center rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white shadow-card transition hover:bg-primaryDark sm:flex-none sm:px-4 sm:text-sm">
          Join session
        </button>
        <button className="focus-outline inline-flex flex-1 items-center justify-center rounded-xl border border-borderGray px-3 py-2 text-xs font-semibold text-muted transition hover:border-primary/40 hover:text-primary sm:flex-none sm:px-4 sm:text-sm">
          View details
        </button>
        {appointment.status === 'upcoming' && onMarkCompleted && (
          <button
            type="button"
            onClick={() => onMarkCompleted(appointment.id)}
            className="focus-outline inline-flex flex-1 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 sm:flex-none sm:px-4 sm:text-sm"
          >
            Mark completed
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => setShowNotes((current) => !current)}
        className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-textMain"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        {showNotes ? 'Hide' : 'Show'} session notes
      </button>

      {showNotes && (
        <div className="rounded-2xl border border-dashed border-borderGray bg-primaryBg/40 px-3 py-2 text-xs text-muted">
          {appointment.notes || 'No notes added yet for this session.'}
        </div>
      )}
    </article>
  );
}

function DashboardOverview({ appointments }: { appointments: Appointment[] }) {
  const upcoming = appointments.filter((a) => a.status === 'upcoming');
  const completed = appointments.filter((a) => a.status === 'completed');
  const completionRate =
    appointments.length === 0
      ? 0
      : Math.round((completed.length / appointments.length) * 100);
  const activePatients = patientsSeed.length;
  const averageRating =
    reviewsSeed.reduce((sum, r) => sum + r.rating, 0) / reviewsSeed.length;
  const nextAppointment = upcoming[0] ?? null;

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-hero border border-borderGray bg-gradient-to-r from-primary-50/90 via-white to-white p-5 shadow-soft sm:flex-row sm:items-center sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Welcome back
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-textMain sm:text-3xl">
            Good afternoon, {doctor.name.split(' ')[1]}.
          </h1>
          <p className="mt-2 text-sm text-muted sm:max-w-md">
            Here is a snapshot of your MindCare practice today. Keep track of
            sessions, patients, and feedback in one place.
          </p>
        </div>
        <div className="flex flex-col gap-3 rounded-2xl bg-white/80 p-3 shadow-card backdrop-blur sm:min-w-[220px]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-sm font-bold text-primary">
              {doctor.avatarInitials}
            </div>
            <div>
              <p className="text-xs font-semibold text-muted">Today&apos;s load</p>
              <p className="text-sm font-semibold text-textMain">
                {upcoming.length} upcoming sessions
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted">
            <div className="rounded-xl bg-primaryBg px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                Active patients
              </p>
              <p className="mt-1 text-sm font-bold text-textMain">{activePatients}</p>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                Average rating
              </p>
              <p className="mt-1 text-sm font-bold text-textMain">
                {averageRating.toFixed(1)} / 5
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-card border border-borderGray bg-white p-4 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Monthly sessions
          </p>
          <p className="mt-2 text-2xl font-black text-textMain">42</p>
          <p className="mt-1 text-xs text-emerald-600">+8 vs last month</p>
        </div>
        <div className="rounded-card border border-borderGray bg-white p-4 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Active patients
          </p>
          <p className="mt-2 text-2xl font-black text-textMain">{activePatients}</p>
          <p className="mt-1 text-xs text-muted">In the last 90 days</p>
        </div>
        <div className="rounded-card border border-borderGray bg-white p-4 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Rating
          </p>
          <p className="mt-2 text-2xl font-black text-textMain">
            {averageRating.toFixed(1)}
          </p>
          <p className="mt-1 text-xs text-muted">{reviewsSeed.length} reviews</p>
        </div>
        <div className="rounded-card border border-borderGray bg-white p-4 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Completion rate
          </p>
          <p className="mt-2 text-2xl font-black text-textMain">
            {Number.isNaN(completionRate) ? 0 : completionRate}%
          </p>
          <p className="mt-1 text-xs text-muted">Completed vs scheduled</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1.4fr)]">
        <div className="rounded-card border border-borderGray bg-white p-4 shadow-card sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-textMain sm:text-base">
              Next appointment
            </h2>
            <a
              href="#"
              className="text-xs font-semibold text-primary hover:text-primaryDark"
            >
              Open schedule
            </a>
          </div>
          <p className="mt-1 text-xs text-muted">
            Start sessions on time and take a short pause between each one.
          </p>
          <div className="mt-4">
            {nextAppointment ? (
              <AppointmentCard appointment={nextAppointment} />
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-borderGray bg-primaryBg/40 px-6 py-8 text-center">
                <p className="text-sm font-semibold text-muted">No upcoming sessions</p>
                <p className="mt-1 text-xs text-muted">
                  When you accept new bookings, they will appear here.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-card border border-borderGray bg-white p-4 shadow-card sm:p-5">
          <h2 className="text-sm font-bold text-textMain sm:text-base">
            Quick actions
          </h2>
          <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2 sm:text-sm">
            <button className="focus-outline inline-flex items-center justify-center rounded-[14px] bg-primary px-3 py-2 font-semibold text-white shadow-card transition hover:bg-primaryDark">
              Open today&apos;s schedule
            </button>
            <button className="focus-outline inline-flex items-center justify-center rounded-[14px] border border-borderGray bg-slate-50 px-3 py-2 font-semibold text-muted transition hover:border-primary/40 hover:text-primary">
              Add session note
            </button>
            <button className="focus-outline inline-flex items-center justify-center rounded-[14px] border border-borderGray bg-slate-50 px-3 py-2 font-semibold text-muted transition hover:border-primary/40 hover:text-primary">
              Update availability
            </button>
            <button className="focus-outline inline-flex items-center justify-center rounded-[14px] border border-borderGray bg-slate-50 px-3 py-2 font-semibold text-muted transition hover:border-primary/40 hover:text-primary">
              Share booking link
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function AppointmentsSection({
  appointments,
  setAppointments
}: {
  appointments: Appointment[];
  setAppointments: (next: Appointment[]) => void;
}) {
  const [tab, setTab] = useState<AppointmentStatus>('upcoming');

  const filtered = useMemo(
    () => appointments.filter((a) => a.status === tab),
    [appointments, tab]
  );

  const handleMarkCompleted = (id: string) => {
    setAppointments(
      appointments.map((a) =>
        a.id === id && a.status === 'upcoming' ? { ...a, status: 'completed' } : a
      )
    );
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-black tracking-tight text-textMain sm:text-2xl">
            Appointments
          </h1>
          <p className="mt-1 text-sm text-muted">
            View upcoming, completed, and cancelled sessions at a glance.
          </p>
        </div>
      </div>

      <div className="flex gap-2 rounded-full bg-primaryBg/60 p-1 text-xs font-semibold text-muted sm:text-sm">
        {[
          { key: 'upcoming', label: 'Upcoming' },
          { key: 'completed', label: 'Completed' },
          { key: 'cancelled', label: 'Cancelled' }
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key as AppointmentStatus)}
            className={`flex-1 rounded-full px-3 py-2 transition ${
              tab === item.key
                ? 'bg-white text-textMain shadow-card'
                : 'text-muted hover:bg-white/70 hover:text-textMain'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-borderGray bg-primaryBg/40 px-6 py-10 text-center">
          <p className="text-sm font-semibold text-muted">
            No {tab === 'upcoming' ? 'upcoming' : tab === 'completed' ? 'completed' : 'cancelled'}{' '}
            appointments
          </p>
          <p className="mt-1 text-xs text-muted">
            Once patients book with you, sessions in this status will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onMarkCompleted={handleMarkCompleted}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function AvailabilitySection({
  slots,
  setSlots
}: {
  slots: TimeSlot[];
  setSlots: (next: TimeSlot[]) => void;
}) {
  const [timezone, setTimezone] = useState('Asia/Dubai');
  const [isRecurring, setIsRecurring] = useState(true);
  const [selectedDay, setSelectedDay] = useState<DayKey>('Mon');
  const [start, setStart] = useState('10:00');
  const [end, setEnd] = useState('11:00');

  const days: DayKey[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const grouped = useMemo(
    () =>
      days.map((day) => ({
        day,
        slots: slots.filter((slot) => slot.day === day)
      })),
    [days, slots]
  );

  const addSlot = () => {
    if (!start || !end) return;
    const id = `slot-${Date.now()}`;
    setSlots([...slots, { id, day: selectedDay, start, end }]);
  };

  const removeSlot = (id: string) => {
    setSlots(slots.filter((slot) => slot.id !== id));
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-black tracking-tight text-textMain sm:text-2xl">
            Availability
          </h1>
          <p className="mt-1 text-sm text-muted">
            Manage your weekly calendar so patients can only book when you are free.
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1.4fr)]">
        <div className="space-y-4 rounded-card border border-borderGray bg-white p-4 shadow-card sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Weekly calendar
              </p>
              <p className="text-xs text-muted">
                Booked blocks are highlighted to help you avoid double‑booking.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-primaryBg px-2 py-1">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-xs text-muted">Your timezone: {timezone}</span>
            </div>
          </div>

          <div className="mt-2 grid gap-3 text-xs sm:text-sm md:grid-cols-4 lg:grid-cols-7">
            {grouped.map(({ day, slots: daySlots }) => (
              <div
                key={day}
                className="flex flex-col gap-2 rounded-[14px] border border-borderGray bg-slate-50/70 p-2.5"
              >
                <p className="text-xs font-semibold text-textMain">{day}</p>
                {daySlots.length === 0 ? (
                  <p className="text-[11px] text-muted">No slots</p>
                ) : (
                  daySlots.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => removeSlot(slot.id)}
                      className={`group flex items-center justify-between gap-2 rounded-xl border px-2 py-1 text-[11px] transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 ${
                        slot.isBooked
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-primary-100 bg-primary-50 text-primary-700'
                      }`}
                      title="Click to remove this time slot"
                    >
                      <span>
                        {slot.start}–{slot.end}
                      </span>
                      {slot.isBooked ? (
                        <span className="rounded-full bg-emerald-600/80 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                          Booked
                        </span>
                      ) : (
                        <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[9px] font-semibold text-primary">
                          Free
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-borderGray pt-3 text-[11px] text-muted">
            <div className="inline-flex items-center gap-2 rounded-full bg-primaryBg px-2.5 py-1">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span>Free slot</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Booked slot</span>
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-card border border-borderGray bg-white p-4 shadow-card sm:p-5">
          <div className="space-y-3">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-muted">Timezone</span>
              <select
                value={timezone}
                onChange={(event) => setTimezone(event.target.value)}
                className="w-full rounded-xl border border-borderGray bg-white px-3 py-2.5 text-sm text-textMain focus:border-primary focus:outline-none"
              >
                <option value="Asia/Dubai">(GMT+4) Gulf Standard Time</option>
                <option value="Europe/London">(GMT) London</option>
                <option value="Asia/Riyadh">(GMT+3) Riyadh</option>
                <option value="America/New_York">(GMT-5) New York</option>
              </select>
            </label>

            <label className="flex items-center justify-between gap-3 rounded-[14px] border border-borderGray bg-slate-50 px-3 py-2.5">
              <div>
                <p className="text-sm font-semibold text-textMain">
                  Recurring weekly schedule
                </p>
                <p className="text-xs text-muted">
                  Apply these time slots to every week automatically.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRecurring((current) => !current)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full border transition ${
                  isRecurring
                    ? 'border-primary bg-primary'
                    : 'border-borderGray bg-slate-200'
                }`}
                aria-pressed={isRecurring}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow transition ${
                    isRecurring ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
          </div>

          <div className="space-y-3 rounded-[18px] border border-borderGray bg-slate-50/70 p-4">
            <p className="text-sm font-semibold text-textMain">Add time slot</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-muted">Day</span>
                <select
                  value={selectedDay}
                  onChange={(event) => setSelectedDay(event.target.value as DayKey)}
                  className="w-full rounded-xl border border-borderGray bg-white px-3 py-2.5 text-sm text-textMain focus:border-primary focus:outline-none"
                >
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-muted">Start</span>
                <input
                  type="time"
                  value={start}
                  onChange={(event) => setStart(event.target.value)}
                  className="w-full rounded-xl border border-borderGray bg-white px-3 py-2.5 text-sm text-textMain focus:border-primary focus:outline-none"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-muted">End</span>
                <input
                  type="time"
                  value={end}
                  onChange={(event) => setEnd(event.target.value)}
                  className="w-full rounded-xl border border-borderGray bg-white px-3 py-2.5 text-sm text-textMain focus:border-primary focus:outline-none"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={addSlot}
              className="focus-outline mt-1 inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-primaryDark"
            >
              Add time slot
            </button>
            <p className="text-[11px] text-muted">
              You can remove a slot anytime by clicking on it in the weekly calendar.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProfileSection() {
  const [name, setName] = useState(doctor.name);
  const [specialty, setSpecialty] = useState(doctor.specialty);
  const [languages, setLanguages] = useState('English, Arabic');
  const [bio, setBio] = useState(
    'I am a clinical psychologist with 8+ years of experience helping adults manage anxiety, depression, and burnout.'
  );
  const [approach, setApproach] = useState(
    'My approach combines CBT with mindfulness and culturally sensitive care. Together we set clear, realistic goals.'
  );
  const [treats, setTreats] = useState('Anxiety, Depression, Burnout, Stress, Sleep difficulties');
  const [sessionTypes, setSessionTypes] = useState('Video, In‑person');

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-xl font-black tracking-tight text-textMain sm:text-2xl">
          My profile
        </h1>
        <p className="mt-1 text-sm text-muted">
          This is what patients see on your public MindCare profile.
        </p>
      </div>

      <form className="space-y-6 rounded-hero border border-borderGray bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/30 text-lg font-bold text-primary">
            {initialsFromName(name)}
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Profile photo
            </p>
            <p className="text-xs text-muted">
              Use a clear, front‑facing photo with a neutral background.
            </p>
          </div>
          <button
            type="button"
            className="focus-outline inline-flex items-center justify-center rounded-xl border border-borderGray bg-slate-50 px-4 py-2 text-xs font-semibold text-muted transition hover:border-primary/40 hover:text-primary"
          >
            Upload new photo
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-muted">Full name</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-xl border border-borderGray bg-white px-3 py-2.5 text-sm text-textMain focus:border-primary focus:outline-none"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-muted">Specialty</span>
            <input
              type="text"
              value={specialty}
              onChange={(event) => setSpecialty(event.target.value)}
              className="w-full rounded-xl border border-borderGray bg-white px-3 py-2.5 text-sm text-textMain focus:border-primary focus:outline-none"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-muted">Languages</span>
            <input
              type="text"
              value={languages}
              onChange={(event) => setLanguages(event.target.value)}
              className="w-full rounded-xl border border-borderGray bg-white px-3 py-2.5 text-sm text-textMain focus:border-primary focus:outline-none"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-muted">Session types</span>
            <input
              type="text"
              value={sessionTypes}
              onChange={(event) => setSessionTypes(event.target.value)}
              className="w-full rounded-xl border border-borderGray bg-white px-3 py-2.5 text-sm text-textMain focus:border-primary focus:outline-none"
            />
          </label>
        </div>

        <label className="space-y-1.5">
          <span className="text-xs font-semibold text-muted">Bio</span>
          <textarea
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            rows={4}
            className="w-full rounded-xl border border-borderGray bg-white px-3 py-2.5 text-sm text-textMain focus:border-primary focus:outline-none"
          />
          <p className="text-xs text-muted">
            Share your experience and the types of clients you enjoy working with. Avoid contact
            details or promises of a &quot;guaranteed cure&quot;.
          </p>
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-semibold text-muted">Approach</span>
          <textarea
            value={approach}
            onChange={(event) => setApproach(event.target.value)}
            rows={3}
            className="w-full rounded-xl border border-borderGray bg-white px-3 py-2.5 text-sm text-textMain focus:border-primary focus:outline-none"
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-semibold text-muted">Treats (tags)</span>
          <input
            type="text"
            value={treats}
            onChange={(event) => setTreats(event.target.value)}
            className="w-full rounded-xl border border-borderGray bg-white px-3 py-2.5 text-sm text-textMain focus:border-primary focus:outline-none"
          />
          <p className="text-xs text-muted">
            Separate items with commas. These help patients understand the areas you focus on.
          </p>
        </label>

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
    </section>
  );
}

function PatientsSection() {
  const hasPatients = patientsSeed.length > 0;

  return (
    <section className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-black tracking-tight text-textMain sm:text-2xl">
            Patients
          </h1>
          <p className="mt-1 text-sm text-muted">
            See who you are currently working with and quickly open their history.
          </p>
        </div>
      </div>

      {!hasPatients ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-borderGray bg-primaryBg/40 px-6 py-10 text-center">
          <p className="text-sm font-semibold text-muted">No patients yet</p>
          <p className="mt-1 text-xs text-muted">
            Once you complete sessions on MindCare, patients will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-hero border border-borderGray bg-white shadow-card">
          <div className="hidden bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-muted md:table w-full">
            <div className="table-row">
              <div className="table-cell px-5 py-3">Patient</div>
              <div className="table-cell px-5 py-3">Total sessions</div>
              <div className="table-cell px-5 py-3">Last visit</div>
              <div className="table-cell px-5 py-3 text-right">Actions</div>
            </div>
          </div>
          <div className="divide-y divide-borderGray">
            {patientsSeed.map((patient) => (
              <div
                key={patient.id}
                className="flex flex-col gap-3 px-4 py-4 transition hover:bg-primaryBg/50 md:table-row md:px-5"
              >
                <div className="flex items-center gap-3 md:table-cell md:align-middle">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primaryBg text-xs font-bold text-primary">
                    {patient.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-textMain">{patient.name}</p>
                    <p className="text-xs text-muted">MindCare patient</p>
                  </div>
                </div>
                <div className="md:table-cell md:align-middle">
                  <p className="text-sm text-textMain md:text-center">
                    {patient.totalSessions}
                  </p>
                  <p className="mt-0.5 text-xs text-muted md:text-center">sessions</p>
                </div>
                <div className="md:table-cell md:align-middle">
                  <p className="text-sm text-textMain md:text-center">{patient.lastVisit}</p>
                </div>
                <div className="md:table-cell md:align-middle md:text-right">
                  <button className="focus-outline inline-flex items-center justify-center rounded-xl border border-borderGray px-3 py-2 text-xs font-semibold text-muted transition hover:border-primary/40 hover:text-primary">
                    View history
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function ReviewsSection() {
  const [filter, setFilter] = useState<'all' | 5 | 4 | 3 | 2 | 1>('all');

  const filtered = useMemo(
    () =>
      filter === 'all'
        ? reviewsSeed
        : reviewsSeed.filter((review) => review.rating === filter),
    [filter]
  );

  const averageRating =
    reviewsSeed.reduce((sum, r) => sum + r.rating, 0) / reviewsSeed.length;

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-black tracking-tight text-textMain sm:text-2xl">
            Reviews
          </h1>
          <p className="mt-1 text-sm text-muted">
            See how patients describe their experience working with you.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,2.1fr)]">
        <div className="space-y-4 rounded-card border border-borderGray bg-white p-4 shadow-card sm:p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Average rating
            </p>
            <p className="mt-2 text-3xl font-black text-textMain">
              {averageRating.toFixed(1)}
            </p>
            <p className="mt-1 text-xs text-muted">{reviewsSeed.length} reviews</p>
          </div>

          <div className="space-y-2 text-xs">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = reviewsSeed.filter((r) => r.rating === star).length;
              const pct =
                reviewsSeed.length === 0
                  ? 0
                  : Math.round((count / reviewsSeed.length) * 100);
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() =>
                    setFilter((current) => (current === star ? 'all' : (star as 5 | 4 | 3 | 2 | 1)))
                  }
                  className={`flex w-full items-center gap-2 rounded-[14px] px-2 py-1.5 text-left transition ${
                    filter === star
                      ? 'bg-primaryBg text-textMain'
                      : 'hover:bg-slate-50 text-muted'
                  }`}
                >
                  <span className="flex items-center gap-1 text-[11px] font-semibold">
                    <span>{star}</span>
                    <span className="text-primary">★</span>
                  </span>
                  <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-primary"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-muted">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3 rounded-card border border-borderGray bg-white p-4 shadow-card sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-textMain">
              {filter === 'all' ? 'All reviews' : `${filter}-star reviews`}
            </p>
            <p className="text-xs text-muted">
              {filtered.length} of {reviewsSeed.length}
            </p>
          </div>

          {filtered.length === 0 ? (
            <div className="mt-2 flex flex-col items-center justify-center rounded-2xl border border-dashed border-borderGray bg-primaryBg/40 px-6 py-8 text-center">
              <p className="text-sm font-semibold text-muted">
                No reviews for this filter
              </p>
              <p className="mt-1 text-xs text-muted">
                Try another star level or view all reviews.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((review) => (
                <article
                  key={review.id}
                  className="group rounded-2xl border border-borderGray bg-slate-50/70 p-3 transition hover:bg-white hover:shadow-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-textMain">
                        {review.reviewer}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">{review.date}</p>
                    </div>
                    <div className="inline-flex items-center gap-1 rounded-full bg-primaryBg px-2 py-0.5 text-xs font-semibold text-primary">
                      <span>{review.rating.toFixed(1)}</span>
                      <span>★</span>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-muted">{review.comment}</p>
                  <button className="focus-outline mt-3 inline-flex items-center gap-1 rounded-xl border border-borderGray bg-white px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-primary/40 hover:text-primary">
                    Respond
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function VerificationSection() {
  const licenseStatus: 'verified' | 'pending' | 'expired' = 'verified';

  const badgeClass =
    licenseStatus === 'verified'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : licenseStatus === 'pending'
      ? 'border-amber-200 bg-amber-50 text-amber-700'
      : 'border-rose-200 bg-rose-50 text-rose-700';

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-xl font-black tracking-tight text-textMain sm:text-2xl">
          Verification
        </h1>
        <p className="mt-1 text-sm text-muted">
          Keep your professional documents up to date so patients can trust your profile.
        </p>
      </div>

      <div className="space-y-4 rounded-hero border border-borderGray bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              License status
            </p>
            <p className="mt-1 text-sm text-textMain">
              Dubai Health Authority (Clinical Psychologist)
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${badgeClass}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {licenseStatus === 'verified'
              ? 'Verified'
              : licenseStatus === 'pending'
              ? 'Pending review'
              : 'Expired'}
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 rounded-[18px] border border-borderGray bg-slate-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              License details
            </p>
            <p className="text-sm text-textMain">
              License ID: <span className="font-semibold">DHA‑PSY‑38492</span>
            </p>
            <p className="text-sm text-textMain">
              Expiry date: <span className="font-semibold">Dec 31, 2026</span>
            </p>
            <p className="text-xs text-muted">
              We&apos;ll remind you 60 and 30 days before your license expires.
            </p>
          </div>

          <div className="space-y-3 rounded-[18px] border border-borderGray bg-slate-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Uploaded documents
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 rounded-xl border border-borderGray bg-white px-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-textMain">Professional license.pdf</p>
                  <p className="text-[11px] text-muted">Uploaded Jan 10, 2026</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  Verified
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-xl border border-borderGray bg-white px-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-textMain">National ID.jpg</p>
                  <p className="text-[11px] text-muted">Uploaded Jan 10, 2026</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  Verified
                </span>
              </div>
            </div>
            <button className="focus-outline inline-flex items-center justify-center rounded-xl border border-borderGray bg-white px-4 py-2 text-sm font-semibold text-muted transition hover:border-primary/40 hover:text-primary">
              Re‑upload documents
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function SettingsSection() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  return (
    <>
      <section className="space-y-6">
        <div>
          <h1 className="text-xl font-black tracking-tight text-textMain sm:text-2xl">
            Settings
          </h1>
          <p className="mt-1 text-sm text-muted">
            Manage your password, notifications, and account.
          </p>
        </div>

        <div className="space-y-6">
          <form className="space-y-4 rounded-hero border border-borderGray bg-white p-5 shadow-card sm:p-6">
            <h2 className="text-sm font-bold text-textMain sm:text-base">
              Change password
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-muted">Current password</span>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-borderGray bg-white px-3 py-2.5 text-sm text-textMain focus:border-primary focus:outline-none"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-muted">New password</span>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-borderGray bg-white px-3 py-2.5 text-sm text-textMain focus:border-primary focus:outline-none"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-muted">Confirm new password</span>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-borderGray bg-white px-3 py-2.5 text-sm text-textMain focus:border-primary focus:outline-none"
                />
              </label>
            </div>
            <p className="text-xs text-muted">
              For security, never reuse your MindCare password on other sites.
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

          <div className="space-y-4 rounded-hero border border-borderGray bg-white p-5 shadow-card sm:p-6">
            <h2 className="text-sm font-bold text-textMain sm:text-base">
              Notifications
            </h2>
            <div className="space-y-3">
              {[
                {
                  id: 'notif-appointments',
                  title: 'Appointment updates',
                  description: 'New bookings, cancellations, and reschedules.',
                  defaultChecked: true
                },
                {
                  id: 'notif-reminders',
                  title: 'Session reminders',
                  description: 'Reminder emails 24h and 1h before each session.',
                  defaultChecked: true
                },
                {
                  id: 'notif-reviews',
                  title: 'New reviews',
                  description: 'When a patient leaves a review on your profile.',
                  defaultChecked: true
                },
                {
                  id: 'notif-product',
                  title: 'Product updates',
                  description: 'Occasional updates about new MindCare features.',
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

          <div className="space-y-3 rounded-hero border border-rose-100 bg-rose-50/70 p-5 shadow-card sm:p-6">
            <h2 className="text-sm font-bold text-rose-700 sm:text-base">
              Delete account
            </h2>
            <p className="text-sm text-rose-700/90">
              Deleting your account will remove your access to MindCare as a doctor. Some records
              may be kept where required by law.
            </p>
            <button
              type="button"
              onClick={() => setDeleteDialogOpen(true)}
              className="focus-outline inline-flex items-center justify-center rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-rose-600"
            >
              Delete my account
            </button>
          </div>
        </div>
      </section>

      {deleteDialogOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-soft">
            <h2 className="text-base font-bold text-textMain sm:text-lg">
              Delete your doctor account?
            </h2>
            <p className="mt-2 text-sm text-muted">
              This action cannot be undone. Your public profile and access to this dashboard will be
              removed.
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteDialogOpen(false)}
                className="focus-outline inline-flex items-center justify-center rounded-xl border border-borderGray px-4 py-2 text-sm font-semibold text-muted transition hover:border-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setDeleteDialogOpen(false)}
                className="focus-outline inline-flex items-center justify-center rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-rose-600"
              >
                Confirm delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function DoctorDashboardPage() {
  const [section, setSection] = useState<DashboardSection>('dashboard');
  const [appointments, setAppointments] = useState<Appointment[]>(appointmentsSeed);
  const [slots, setSlots] = useState<TimeSlot[]>(availabilitySeed);

  const sections: { key: DashboardSection; label: string }[] = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'appointments', label: 'Appointments' },
    { key: 'availability', label: 'Availability' },
    { key: 'profile', label: 'My profile' },
    { key: 'patients', label: 'Patients' },
    { key: 'reviews', label: 'Reviews' },
    { key: 'verification', label: 'Verification' },
    { key: 'settings', label: 'Settings' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/40 via-white to-white text-textMain">
      <Header
        brandHref="/doctor-dashboard"
        navItems={[
          { labelKey: 'nav.doctors', href: '/home' },
          { labelKey: 'nav.about', href: '/about' }
        ]}
      />

      <main className="section-shell py-6 sm:py-8">
        <div className="grid gap-5 lg:grid-cols-[260px,minmax(0,1fr)] lg:items-start">
          {/* Sidebar - desktop */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-2xl border border-borderGray bg-white p-3 shadow-card">
              <div className="flex items-center gap-3 rounded-xl bg-primaryBg px-3 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
                  {doctor.avatarInitials}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-muted">Signed in as</p>
                  <p className="truncate text-sm font-bold text-textMain">{doctor.name}</p>
                  <p className="truncate text-[11px] text-muted">{doctor.specialty}</p>
                </div>
              </div>

              <nav
                className="mt-3 space-y-1 text-sm font-semibold text-muted"
                aria-label="Doctor dashboard sections"
              >
                {sections.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSection(item.key)}
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

          {/* Content */}
          <div className="space-y-6">
            {/* Mobile tabs */}
            <div className="lg:hidden">
              <div className="flex gap-2 overflow-x-auto rounded-2xl bg-primaryBg/80 p-1 text-xs font-semibold text-muted sm:text-sm">
                {sections.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSection(item.key)}
                    className={`whitespace-nowrap rounded-2xl px-3 py-2 transition ${
                      section === item.key
                        ? 'bg-white text-textMain shadow-card'
                        : 'text-muted hover:bg-white/70 hover:text-textMain'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {section === 'dashboard' && <DashboardOverview appointments={appointments} />}
            {section === 'appointments' && (
              <AppointmentsSection
                appointments={appointments}
                setAppointments={setAppointments}
              />
            )}
            {section === 'availability' && (
              <AvailabilitySection slots={slots} setSlots={setSlots} />
            )}
            {section === 'profile' && <ProfileSection />}
            {section === 'patients' && <PatientsSection />}
            {section === 'reviews' && <ReviewsSection />}
            {section === 'verification' && <VerificationSection />}
            {section === 'settings' && <SettingsSection />}
          </div>
        </div>
      </main>
    </div>
  );
}

