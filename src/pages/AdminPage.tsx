import { useMemo, useState, type ReactNode } from 'react';
import { adminDoctorsSeed, type AdminDoctor, type AdminDoctorStatus, type AdminDocument } from '../data/adminDoctorsData';
import { logout } from '../utils/auth';

type AdminView = 'list' | 'review';
type StatusFilter = 'all' | AdminDoctorStatus;
type SortFilter = 'newest' | 'oldest';
type CloseReason =
  | 'Missing documents'
  | 'License invalid/expired'
  | 'Information mismatch'
  | 'Incomplete profile'
  | 'Inappropriate content'
  | 'Other';

type CloseModalState = {
  doctorId: string;
  reason: '' | CloseReason;
  notes: string;
};

type DocumentModalState = {
  title: string;
  document: AdminDocument;
};

type DoctorChecklist = {
  identity: {
    nameMatchesId: boolean;
    idReadable: boolean;
    contactVerified: boolean;
  };
  license: {
    matchesDoctorName: boolean;
    notExpired: boolean;
    authorityValid: boolean;
    specialtyMatches: boolean;
  };
  education: {
    psychologyRelated: boolean;
    educationConsistent: boolean;
  };
  services: {
    noProhibitedClaims: boolean;
    withinMentalHealthScope: boolean;
  };
  profile: {
    bioMinLength: boolean;
    professionalLanguage: boolean;
    noExternalContacts: boolean;
    noExaggeratedClaims: boolean;
  };
  availability: {
    timezoneSet: boolean;
    weeklyBlocksAdded: boolean;
  };
  safety: {
    noDuplicateAccount: boolean;
    noSuspiciousData: boolean;
  };
};

function createChecklistFromDoctor(doctor: AdminDoctor): DoctorChecklist {
  return {
    identity: {
      nameMatchesId: false,
      idReadable: doctor.documents.idDoc.status === 'uploaded',
      contactVerified: doctor.identity.emailVerified && doctor.identity.phoneVerified
    },
    license: {
      matchesDoctorName: false,
      notExpired: !isExpired(doctor.license.expiry),
      authorityValid: false,
      specialtyMatches: false
    },
    education: {
      psychologyRelated: true,
      educationConsistent: true
    },
    services: {
      noProhibitedClaims: true,
      withinMentalHealthScope: true
    },
    profile: {
      bioMinLength: doctor.bio.length > 50,
      professionalLanguage: !hasExaggeratedClaims(doctor.bio),
      noExternalContacts: !hasExternalContactInfo(doctor.bio),
      noExaggeratedClaims: !hasExaggeratedClaims(doctor.bio)
    },
    availability: {
      timezoneSet: !!doctor.availability.timezone,
      weeklyBlocksAdded: doctor.availability.weeklyBlocks.length > 0
    },
    safety: {
      noDuplicateAccount: !doctor.duplicateAccountFlag,
      noSuspiciousData: !doctor.suspiciousDataFlag
    }
  };
}

function isChecklistComplete(checklist: DoctorChecklist): boolean {
  return Object.values(checklist).every((section) =>
    Object.values(section).every((value) => value === true)
  );
}

const rejectReasons: CloseReason[] = [
  'Missing documents',
  'License invalid/expired',
  'Information mismatch',
  'Incomplete profile',
  'Inappropriate content',
  'Other'
];

function initialsFromName(name: string) {
  return name
    .replace('Dr. ', '')
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function formatDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function formatDateTime(isoDate: string) {
  return new Date(isoDate).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function isExpired(dateString: string) {
  return new Date(dateString).getTime() < Date.now();
}

function hasExternalContactInfo(text: string) {
  return /(whatsapp|telegram|@\w+|\+?\d{7,}|email|gmail|hotmail)/i.test(text);
}

function hasExaggeratedClaims(text: string) {
  return /(guaranteed cure|100%|instant cure|always works|miracle)/i.test(text);
}

function statusLabel(status: AdminDoctorStatus) {
  if (status === 'accepted') {
    return 'Accepted';
  }

  if (status === 'closed') {
    return 'Closed';
  }

  return 'Pending';
}

function statusClass(status: AdminDoctorStatus) {
  if (status === 'accepted') {
    return 'border-emerald-100 bg-emerald-50 text-emerald-700';
  }

  if (status === 'closed') {
    return 'border-red-100 bg-red-50 text-red-700';
  }

  return 'border-sky-100 bg-sky-50 text-sky-700';
}

function documentStatusClass(status: AdminDocument['status']) {
  return status === 'uploaded'
    ? 'border-primary-100 bg-primary-50 text-primary-700'
    : 'border-red-100 bg-red-50 text-red-700';
}

function completenessFromDoctor(doctor: AdminDoctor) {
  const missingDocs = doctor.documents.idDoc.status === 'missing' || doctor.documents.licenseDoc.status === 'missing';

  if (missingDocs) {
    return { label: 'Missing docs', className: 'border-red-100 bg-red-50 text-red-700' };
  }

  if (!doctor.availability.timezone || doctor.availability.weeklyBlocks.length === 0) {
    return { label: 'Needs schedule', className: 'border-amber-100 bg-amber-50 text-amber-700' };
  }

  return { label: 'Complete', className: 'border-primary-100 bg-primary-50 text-primary-700' };
}

type ModalFrameProps = {
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  widthClassName?: string;
};

function ModalFrame({ title, children, onClose, footer, widthClassName = 'max-w-xl' }: ModalFrameProps) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-900/45" onClick={onClose} aria-label="Close modal backdrop" />
      <div role="dialog" aria-modal="true" className={`relative z-[91] w-full ${widthClassName} rounded-[22px] border border-borderGray bg-white shadow-soft`}>
        <div className="flex items-center justify-between border-b border-borderGray px-5 py-4">
          <h2 className="text-lg font-bold text-textMain">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="focus-outline inline-flex h-9 w-9 items-center justify-center rounded-lg border border-borderGray text-muted transition hover:text-textMain"
            aria-label="Close"
          >
            x
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer ? <div className="border-t border-borderGray px-5 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}

type SectionCardProps = {
  title: string;
  children: ReactNode;
};

function SectionCard({ title, children }: SectionCardProps) {
  return (
    <section className="rounded-[18px] border border-borderGray bg-slate-50/70 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">{title}</h3>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

export default function AdminPage() {
  const [doctors, setDoctors] = useState<AdminDoctor[]>(adminDoctorsSeed);
  const [view, setView] = useState<AdminView>('list');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [sortFilter, setSortFilter] = useState<SortFilter>('newest');

  const [acceptModalDoctorId, setAcceptModalDoctorId] = useState<string | null>(null);
  const [closeModal, setCloseModal] = useState<CloseModalState | null>(null);
  const [documentModal, setDocumentModal] = useState<DocumentModalState | null>(null);

  const [notesDraft, setNotesDraft] = useState<Record<string, string>>(
    () => Object.fromEntries(adminDoctorsSeed.map((doctor) => [doctor.id, doctor.adminNotes]))
  );
  const [checklists, setChecklists] = useState<Record<string, DoctorChecklist>>(
    () => Object.fromEntries(adminDoctorsSeed.map((doctor) => [doctor.id, createChecklistFromDoctor(doctor)]))
  );

  const selectedDoctor = useMemo(
    () => doctors.find((doctor) => doctor.id === selectedDoctorId) ?? null,
    [doctors, selectedDoctorId]
  );

  const selectedChecklist = selectedDoctor ? checklists[selectedDoctor.id] ?? createChecklistFromDoctor(selectedDoctor) : null;

  const cities = useMemo(
    () => ['all', ...Array.from(new Set(doctors.map((doctor) => doctor.city)))],
    [doctors]
  );

  const specialties = useMemo(
    () => ['all', ...Array.from(new Set(doctors.map((doctor) => doctor.specialty)))],
    [doctors]
  );

  const filteredDoctors = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return [...doctors]
      .filter((doctor) => {
        const matchesQuery =
          query.length === 0 ||
          doctor.name.toLowerCase().includes(query) ||
          doctor.email.toLowerCase().includes(query) ||
          doctor.license.id.toLowerCase().includes(query);

        const matchesStatus = statusFilter === 'all' || doctor.status === statusFilter;
        const matchesCity = cityFilter === 'all' || doctor.city === cityFilter;
        const matchesSpecialty = specialtyFilter === 'all' || doctor.specialty === specialtyFilter;
        const matchesOnline = !onlineOnly || doctor.isOnline;

        return matchesQuery && matchesStatus && matchesCity && matchesSpecialty && matchesOnline;
      })
      .sort((first, second) => {
        const firstDate = new Date(first.submittedAt).getTime();
        const secondDate = new Date(second.submittedAt).getTime();

        return sortFilter === 'oldest' ? firstDate - secondDate : secondDate - firstDate;
      });
  }, [cityFilter, doctors, onlineOnly, searchQuery, sortFilter, specialtyFilter, statusFilter]);

  const openReview = (doctorId: string) => {
    setSelectedDoctorId(doctorId);
    setView('review');
  };

  const backToList = () => {
    setView('list');
    setSelectedDoctorId(null);
  };

  const updateDoctor = (doctorId: string, updater: (doctor: AdminDoctor) => AdminDoctor) => {
    setDoctors((previous) => previous.map((doctor) => (doctor.id === doctorId ? updater(doctor) : doctor)));
  };

  const updateChecklist = <S extends keyof DoctorChecklist, K extends keyof DoctorChecklist[S]>(
    doctorId: string,
    section: S,
    key: K
  ) => {
    setChecklists((previous) => {
      const current = previous[doctorId] ?? createChecklistFromDoctor(doctors.find((doctor) => doctor.id === doctorId)!);

      return {
        ...previous,
        [doctorId]: {
          ...current,
          [section]: {
            ...current[section],
            [key]: !current[section][key]
          }
        }
      };
    });
  };

  const saveAdminNote = (doctorId: string) => {
    const nextNote = (notesDraft[doctorId] ?? '').trim();

    updateDoctor(doctorId, (doctor) => {
      if (doctor.adminNotes === nextNote) {
        return doctor;
      }

      return {
        ...doctor,
        adminNotes: nextNote,
        history: [...doctor.history, { at: new Date().toISOString(), action: 'Admin note added' }]
      };
    });
  };

  const acceptDoctor = (doctorId: string) => {
    const note = (notesDraft[doctorId] ?? '').trim();

    updateDoctor(doctorId, (doctor) => ({
      ...doctor,
      status: 'accepted',
      adminNotes: note,
      history: [
        ...doctor.history,
        { at: new Date().toISOString(), action: 'Status changed to Accepted by Admin' }
      ]
    }));
  };

  const closeDoctor = (doctorId: string, reason: CloseReason, notes: string) => {
    const cleanedNotes = notes.trim();
    setNotesDraft((previous) => ({ ...previous, [doctorId]: cleanedNotes }));

    updateDoctor(doctorId, (doctor) => ({
      ...doctor,
      status: 'closed',
      closeReason: reason,
      adminNotes: cleanedNotes,
      history: [
        ...doctor.history,
        { at: new Date().toISOString(), action: `Closed: ${reason}` }
      ]
    }));
  };

  const reopenDoctor = (doctorId: string) => {
    updateDoctor(doctorId, (doctor) => ({
      ...doctor,
      status: 'pending',
      history: [
        ...doctor.history,
        { at: new Date().toISOString(), action: 'Status changed to Pending by Admin' }
      ]
    }));
  };

  const isReadyForApproval = selectedChecklist ? isChecklistComplete(selectedChecklist) : false;

  const listContent = (
    <>
      <header className="rounded-[20px] border border-borderGray bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-textMain">Doctors</h1>
            <p className="mt-1 text-sm text-muted">Review applications and decide who can be published.</p>
          </div>

          <label className="relative block w-full lg:max-w-md">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by name, email, license ID"
              className="focus-outline h-11 w-full rounded-xl border border-borderGray bg-white pl-10 pr-4 text-sm text-textMain placeholder:text-slate-400"
            />
          </label>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
              Status
            </span>
            <div className="inline-flex w-full flex-wrap gap-1 rounded-full bg-primaryBg/60 p-1 text-xs font-semibold text-muted">
              {[
                { key: 'all' as StatusFilter, label: 'All' },
                { key: 'pending' as StatusFilter, label: 'Pending' },
                { key: 'accepted' as StatusFilter, label: 'Accepted' },
                { key: 'closed' as StatusFilter, label: 'Closed' }
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setStatusFilter(item.key)}
                  className={`flex-1 rounded-full px-3 py-1.5 transition ${
                    statusFilter === item.key
                      ? 'bg-white text-textMain shadow-card'
                      : 'text-muted hover:bg-white/70 hover:text-textMain'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">City</span>
            <select
              value={cityFilter}
              onChange={(event) => setCityFilter(event.target.value)}
              className="focus-outline h-11 w-full rounded-xl border border-borderGray bg-white px-3 text-sm text-textMain"
            >
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city === 'all' ? 'All cities' : city}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Specialty</span>
            <select
              value={specialtyFilter}
              onChange={(event) => setSpecialtyFilter(event.target.value)}
              className="focus-outline h-11 w-full rounded-xl border border-borderGray bg-white px-3 text-sm text-textMain"
            >
              {specialties.map((specialty) => (
                <option key={specialty} value={specialty}>
                  {specialty === 'all' ? 'All specialties' : specialty}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Submitted</span>
            <select
              value={sortFilter}
              onChange={(event) => setSortFilter(event.target.value as SortFilter)}
              className="focus-outline h-11 w-full rounded-xl border border-borderGray bg-white px-3 text-sm text-textMain"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </label>

          <label className="flex items-center gap-3 rounded-xl border border-borderGray bg-slate-50 px-3 py-2.5">
            <input
              type="checkbox"
              checked={onlineOnly}
              onChange={(event) => setOnlineOnly(event.target.checked)}
              className="focus-outline h-4 w-4 rounded border-borderGray text-primary"
            />
            <span className="text-sm font-medium text-muted">Online only</span>
          </label>
        </div>
      </header>

      {filteredDoctors.length === 0 ? (
        <section className="mt-5 rounded-[20px] border border-dashed border-borderGray bg-white p-10 text-center shadow-card">
          <h2 className="text-xl font-bold text-textMain">No doctors found</h2>
          <p className="mt-2 text-sm text-muted">Try another search or clear filters to view all applications.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setCityFilter('all');
              setSpecialtyFilter('all');
              setOnlineOnly(false);
              setSortFilter('newest');
            }}
            className="focus-outline mt-5 rounded-xl border border-borderGray px-4 py-2 text-sm font-semibold text-muted transition hover:border-primary/30 hover:text-primary"
          >
            Clear filters
          </button>
        </section>
      ) : (
        <>
          <section className="mt-5 hidden overflow-hidden rounded-[20px] border border-borderGray bg-white shadow-card md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-borderGray">
                <thead className="bg-slate-50 text-left">
                  <tr>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Doctor</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Specialty</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted">City / Online</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Submitted</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Completeness</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Status</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderGray">
                  {filteredDoctors.map((doctor) => {
                    const completeness = completenessFromDoctor(doctor);

                    return (
                      <tr key={doctor.id} className="transition hover:bg-primary-50/40">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primaryBg text-sm font-bold text-primary">
                              {initialsFromName(doctor.name)}
                            </span>
                            <span className="text-sm font-semibold text-textMain">{doctor.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-muted">{doctor.specialty}</td>
                        <td className="px-5 py-4">
                          <p className="text-sm text-textMain">{doctor.city}</p>
                          <span
                            className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${
                              doctor.isOnline
                                ? 'border-primary-100 bg-primary-50 text-primary-700'
                                : 'border-borderGray bg-slate-50 text-muted'
                            }`}
                          >
                            {doctor.isOnline ? 'Online' : 'In-person'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-muted">{formatDate(doctor.submittedAt)}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${completeness.className}`}>
                            {completeness.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(doctor.status)}`}>
                            {statusLabel(doctor.status)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col items-start gap-2">
                            <button
                              type="button"
                              onClick={() => openReview(doctor.id)}
                              className="focus-outline rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primaryDark"
                            >
                              Review
                            </button>
                            <div className="flex flex-wrap gap-2">
                              {doctor.status === 'pending' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setAcceptModalDoctorId(doctor.id)}
                                    className="focus-outline rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setCloseModal({
                                        doctorId: doctor.id,
                                        reason: '',
                                        notes: notesDraft[doctor.id] ?? ''
                                      })
                                    }
                                    className="focus-outline rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:border-red-300"
                                  >
                                    Close
                                  </button>
                                </>
                              )}
                              {doctor.status === 'accepted' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCloseModal({
                                      doctorId: doctor.id,
                                      reason: '',
                                      notes: notesDraft[doctor.id] ?? ''
                                    })
                                  }
                                  className="focus-outline rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:border-red-300"
                                >
                                  Close
                                </button>
                              )}
                              {doctor.status === 'closed' && (
                                <button
                                  type="button"
                                  onClick={() => reopenDoctor(doctor.id)}
                                  className="focus-outline rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:border-sky-300"
                                >
                                  Reopen
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-5 space-y-4 md:hidden">
            {filteredDoctors.map((doctor) => {
              const completeness = completenessFromDoctor(doctor);

              return (
                <article
                  key={doctor.id}
                  className="rounded-[18px] border border-borderGray bg-white p-4 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-primary-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primaryBg text-sm font-bold text-primary">
                        {initialsFromName(doctor.name)}
                      </span>
                      <div>
                        <h2 className="text-sm font-semibold text-textMain">{doctor.name}</h2>
                        <p className="text-xs text-muted">{doctor.specialty}</p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${statusClass(
                        doctor.status
                      )}`}
                    >
                      {statusLabel(doctor.status)}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-1.5 text-xs text-muted">
                    <p>City: {doctor.city}</p>
                    <p>Mode: {doctor.isOnline ? 'Online' : 'In-person'}</p>
                    <p>Submitted: {formatDate(doctor.submittedAt)}</p>
                    <p>Completeness: {completeness.label}</p>
                  </div>

                  <div className="mt-4 space-y-2">
                    <button
                      type="button"
                      onClick={() => openReview(doctor.id)}
                      className="focus-outline w-full rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white transition hover:bg-primaryDark"
                    >
                      Review
                    </button>
                    <div className="flex flex-wrap gap-2">
                      {doctor.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => setAcceptModalDoctorId(doctor.id)}
                            className="focus-outline flex-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setCloseModal({
                                doctorId: doctor.id,
                                reason: '',
                                notes: notesDraft[doctor.id] ?? ''
                              })
                            }
                            className="focus-outline flex-1 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:border-red-300"
                          >
                            Close
                          </button>
                        </>
                      )}
                      {doctor.status === 'accepted' && (
                        <button
                          type="button"
                          onClick={() =>
                            setCloseModal({
                              doctorId: doctor.id,
                              reason: '',
                              notes: notesDraft[doctor.id] ?? ''
                            })
                          }
                          className="focus-outline flex-1 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:border-red-300"
                        >
                          Close
                        </button>
                      )}
                      {doctor.status === 'closed' && (
                        <button
                          type="button"
                          onClick={() => reopenDoctor(doctor.id)}
                          className="focus-outline flex-1 rounded-xl border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:border-sky-300"
                        >
                          Reopen
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        </>
      )}
    </>
  );

  const reviewContent = selectedDoctor && selectedChecklist ? (
    <>
      <header className="rounded-[20px] border border-borderGray bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-textMain">Doctor Review</h1>
            <p className="mt-1 text-sm text-muted">Review details and decide if this doctor can be published.</p>
          </div>
          <button
            type="button"
            onClick={backToList}
            className="focus-outline rounded-xl border border-borderGray px-4 py-2 text-sm font-semibold text-muted transition hover:border-primary/30 hover:text-primary"
          >
            Back to Doctors
          </button>
        </div>
      </header>

      <div className="mt-5 space-y-5">
        <div className="space-y-5">
          <article className="rounded-[20px] border border-borderGray bg-white p-6 shadow-card">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 text-xl font-bold text-primary">
                  {initialsFromName(selectedDoctor.name)}
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-extrabold text-textMain">{selectedDoctor.name}</h2>
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(
                        selectedDoctor.status
                      )}`}
                    >
                      {statusLabel(selectedDoctor.status)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {selectedDoctor.specialty} - {selectedDoctor.subSpecialties.join(', ')}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {selectedDoctor.city} - {selectedDoctor.isOnline ? 'Online + In-person' : 'In-person'}
                  </p>
                  <p className="mt-1 text-sm text-muted">Languages: {selectedDoctor.languages.join(', ')}</p>
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted">{selectedDoctor.bio}</p>
          </article>

          <article className="rounded-[20px] border border-borderGray bg-white p-6 shadow-card">
            <h3 className="text-lg font-bold text-textMain">About & Approach</h3>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <section className="rounded-[16px] border border-borderGray bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Bio</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{selectedDoctor.bio}</p>
                <span
                  className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                    selectedDoctor.bio.length >= 120 ? 'border-primary-100 bg-primary-50 text-primary-700' : 'border-amber-100 bg-amber-50 text-amber-700'
                  }`}
                >
                  {selectedDoctor.bio.length >= 120 ? 'Bio length OK' : 'Bio too short'}
                </span>
              </section>

              <section className="rounded-[16px] border border-borderGray bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Therapy approach</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{selectedDoctor.approach}</p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {selectedDoctor.treats.map((item) => (
                    <li key={item} className="rounded-full border border-borderGray bg-white px-3 py-1 text-xs font-medium text-muted">
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </article>

          <article className="rounded-[20px] border border-borderGray bg-white p-6 shadow-card">
            <h3 className="text-lg font-bold text-textMain">Education & Experience</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <section className="rounded-[16px] border border-borderGray bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Degrees</p>
                <ul className="mt-2 space-y-2">
                  {selectedDoctor.education.map((item) => (
                    <li key={`${item.degree}-${item.year}`} className="text-sm text-muted">
                      {item.degree} - {item.university} ({item.year})
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-[16px] border border-borderGray bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Experience</p>
                <ul className="mt-2 space-y-2">
                  {selectedDoctor.experience.map((item) => (
                    <li key={`${item.workplace}-${item.role}`} className="text-sm text-muted">
                      {item.role} - {item.workplace} ({item.years})
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </article>

          <article className="rounded-[20px] border border-borderGray bg-white p-6 shadow-card">
            <h3 className="text-lg font-bold text-textMain">Availability Setup</h3>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted">Timezone: {selectedDoctor.availability.timezone || 'Not set'}</span>
              <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                  selectedDoctor.availability.weeklyBlocks.length > 0
                    ? 'border-primary-100 bg-primary-50 text-primary-700'
                    : 'border-amber-100 bg-amber-50 text-amber-700'
                }`}
              >
                {selectedDoctor.availability.weeklyBlocks.length > 0 ? 'Schedule added' : 'Needs schedule'}
              </span>
            </div>

            {selectedDoctor.availability.weeklyBlocks.length > 0 ? (
              <div className="mt-4 rounded-[16px] border border-borderGray">
                <div className="grid grid-cols-3 border-b border-borderGray bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  <span>Day</span>
                  <span>Start</span>
                  <span>End</span>
                </div>
                {selectedDoctor.availability.weeklyBlocks.map((slot) => (
                  <div key={`${slot.day}-${slot.start}`} className="grid grid-cols-3 border-b border-borderGray px-4 py-2 text-sm text-muted last:border-none">
                    <span className="font-medium text-textMain">{slot.day}</span>
                    <span>{slot.start}</span>
                    <span>{slot.end}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-amber-700">No weekly availability blocks have been added yet.</p>
            )}
          </article>
        </div>

        <div className="space-y-5">
          <article className="rounded-[20px] border border-borderGray bg-white p-5 shadow-soft">
            <h2 className="text-lg font-bold text-textMain">Verification Checklist</h2>
            <p className="mt-1 text-xs text-muted">Submitted: {formatDateTime(selectedDoctor.submittedAt)}</p>

            <div className="mt-4 space-y-4">
              <SectionCard title="Identity verification (required)">
                <div className="text-sm text-muted">
                  <p>
                    Legal full name: <span className="font-semibold text-textMain">{selectedDoctor.identity.legalFullName}</span>
                  </p>
                  <p className="mt-1">
                    Email: <span className="font-semibold text-textMain">{selectedDoctor.email}</span>{' '}
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${selectedDoctor.identity.emailVerified ? 'border-primary-100 bg-primary-50 text-primary-700' : 'border-amber-100 bg-amber-50 text-amber-700'}`}>
                      {selectedDoctor.identity.emailVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </p>
                  <p className="mt-1">
                    Phone: <span className="font-semibold text-textMain">{selectedDoctor.phone}</span>{' '}
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${selectedDoctor.identity.phoneVerified ? 'border-primary-100 bg-primary-50 text-primary-700' : 'border-amber-100 bg-amber-50 text-amber-700'}`}>
                      {selectedDoctor.identity.phoneVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </p>
                  <p className="mt-1">
                    Profile photo quality:{' '}
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${selectedDoctor.identity.profilePhotoQuality === 'ok' ? 'border-primary-100 bg-primary-50 text-primary-700' : 'border-amber-100 bg-amber-50 text-amber-700'}`}>
                      {selectedDoctor.identity.profilePhotoQuality === 'ok' ? 'OK' : 'Needs changes'}
                    </span>
                  </p>
                </div>

                <div className="rounded-xl border border-borderGray bg-white p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-textMain">{selectedDoctor.documents.idDoc.previewLabel}</p>
                      <p className="text-xs text-muted">{selectedDoctor.documents.idDoc.filename}</p>
                    </div>
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${documentStatusClass(selectedDoctor.documents.idDoc.status)}`}>
                      {selectedDoctor.documents.idDoc.status}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDocumentModal({ title: 'ID Document', document: selectedDoctor.documents.idDoc })}
                    className="focus-outline mt-2 rounded-lg border border-borderGray px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-primary/30 hover:text-primary"
                  >
                    View
                  </button>
                </div>

                <label className="flex items-center gap-3 rounded-lg border border-borderGray bg-white px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectedChecklist.identity.nameMatchesId}
                    onChange={() => updateChecklist(selectedDoctor.id, 'identity', 'nameMatchesId')}
                    className="focus-outline h-4 w-4 rounded border-borderGray text-primary"
                  />
                  <span className="text-sm text-muted">Name matches ID</span>
                </label>
                <label className="flex items-center gap-3 rounded-lg border border-borderGray bg-white px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectedChecklist.identity.idReadable}
                    onChange={() => updateChecklist(selectedDoctor.id, 'identity', 'idReadable')}
                    className="focus-outline h-4 w-4 rounded border-borderGray text-primary"
                  />
                  <span className="text-sm text-muted">ID is readable and valid</span>
                </label>
                <label className="flex items-center gap-3 rounded-lg border border-borderGray bg-white px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectedChecklist.identity.contactVerified}
                    onChange={() => updateChecklist(selectedDoctor.id, 'identity', 'contactVerified')}
                    className="focus-outline h-4 w-4 rounded border-borderGray text-primary"
                  />
                  <span className="text-sm text-muted">Email and phone verified</span>
                </label>
              </SectionCard>

              <SectionCard title="Professional license verification (critical)">
                <div className="text-sm text-muted">
                  <p>
                    License ID: <span className="font-semibold text-textMain">{selectedDoctor.license.id}</span>
                  </p>
                  <p>
                    Authority: <span className="font-semibold text-textMain">{selectedDoctor.license.authority}</span>
                  </p>
                  <p>
                    Country: <span className="font-semibold text-textMain">{selectedDoctor.license.country}</span>
                  </p>
                  <p>
                    Expiry: <span className="font-semibold text-textMain">{formatDate(selectedDoctor.license.expiry)}</span>
                  </p>
                </div>

                <div className="rounded-xl border border-borderGray bg-white p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-textMain">{selectedDoctor.documents.licenseDoc.previewLabel}</p>
                      <p className="text-xs text-muted">{selectedDoctor.documents.licenseDoc.filename}</p>
                    </div>
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${documentStatusClass(selectedDoctor.documents.licenseDoc.status)}`}>
                      {selectedDoctor.documents.licenseDoc.status}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDocumentModal({ title: 'License Document', document: selectedDoctor.documents.licenseDoc })}
                    className="focus-outline mt-2 rounded-lg border border-borderGray px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-primary/30 hover:text-primary"
                  >
                    View
                  </button>
                </div>

                <label className="flex items-center gap-3 rounded-lg border border-borderGray bg-white px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectedChecklist.license.matchesDoctorName}
                    onChange={() => updateChecklist(selectedDoctor.id, 'license', 'matchesDoctorName')}
                    className="focus-outline h-4 w-4 rounded border-borderGray text-primary"
                  />
                  <span className="text-sm text-muted">License matches doctor name</span>
                </label>
                <label className="flex items-center gap-3 rounded-lg border border-borderGray bg-white px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectedChecklist.license.notExpired}
                    onChange={() => updateChecklist(selectedDoctor.id, 'license', 'notExpired')}
                    className="focus-outline h-4 w-4 rounded border-borderGray text-primary"
                  />
                  <span className="text-sm text-muted">License not expired</span>
                </label>
                <label className="flex items-center gap-3 rounded-lg border border-borderGray bg-white px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectedChecklist.license.authorityValid}
                    onChange={() => updateChecklist(selectedDoctor.id, 'license', 'authorityValid')}
                    className="focus-outline h-4 w-4 rounded border-borderGray text-primary"
                  />
                  <span className="text-sm text-muted">Issuing authority looks valid</span>
                </label>
                <label className="flex items-center gap-3 rounded-lg border border-borderGray bg-white px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectedChecklist.license.specialtyMatches}
                    onChange={() => updateChecklist(selectedDoctor.id, 'license', 'specialtyMatches')}
                    className="focus-outline h-4 w-4 rounded border-borderGray text-primary"
                  />
                  <span className="text-sm text-muted">Specialty matches license</span>
                </label>
              </SectionCard>

              <SectionCard title="Education and qualification">
                <div className="text-sm text-muted">
                  <p>
                    Highest degree: <span className="font-semibold text-textMain">{selectedDoctor.education[0]?.degree}</span>
                  </p>
                  <p>
                    University: <span className="font-semibold text-textMain">{selectedDoctor.education[0]?.university}</span>
                  </p>
                  <p>
                    Graduation year: <span className="font-semibold text-textMain">{selectedDoctor.education[0]?.year}</span>
                  </p>
                </div>

                <div className="rounded-xl border border-borderGray bg-white p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-textMain">{selectedDoctor.documents.degreeDoc.previewLabel}</p>
                      <p className="text-xs text-muted">{selectedDoctor.documents.degreeDoc.filename}</p>
                    </div>
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${documentStatusClass(selectedDoctor.documents.degreeDoc.status)}`}>
                      {selectedDoctor.documents.degreeDoc.status}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDocumentModal({ title: 'Degree Certificate', document: selectedDoctor.documents.degreeDoc })}
                    className="focus-outline mt-2 rounded-lg border border-borderGray px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-primary/30 hover:text-primary"
                  >
                    View
                  </button>
                </div>

                <label className="flex items-center gap-3 rounded-lg border border-borderGray bg-white px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectedChecklist.education.psychologyRelated}
                    onChange={() => updateChecklist(selectedDoctor.id, 'education', 'psychologyRelated')}
                    className="focus-outline h-4 w-4 rounded border-borderGray text-primary"
                  />
                  <span className="text-sm text-muted">Degree is psychology-related</span>
                </label>
                <label className="flex items-center gap-3 rounded-lg border border-borderGray bg-white px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectedChecklist.education.educationConsistent}
                    onChange={() => updateChecklist(selectedDoctor.id, 'education', 'educationConsistent')}
                    className="focus-outline h-4 w-4 rounded border-borderGray text-primary"
                  />
                  <span className="text-sm text-muted">Education info is consistent</span>
                </label>
              </SectionCard>

              <SectionCard title="Specialty and services accuracy">
                <p className="text-sm text-muted">
                  Specialty: <span className="font-semibold text-textMain">{selectedDoctor.specialty}</span>
                </p>
                <p className="text-sm text-muted">
                  Sub-specialties: <span className="font-semibold text-textMain">{selectedDoctor.subSpecialties.join(', ')}</span>
                </p>
                <p className="text-sm text-muted">
                  Session types: <span className="font-semibold text-textMain">{selectedDoctor.sessionTypes.join(', ')}</span>
                </p>

                <label className="flex items-center gap-3 rounded-lg border border-borderGray bg-white px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectedChecklist.services.noProhibitedClaims}
                    onChange={() => updateChecklist(selectedDoctor.id, 'services', 'noProhibitedClaims')}
                    className="focus-outline h-4 w-4 rounded border-borderGray text-primary"
                  />
                  <span className="text-sm text-muted">No unrealistic or prohibited claims</span>
                </label>
                <label className="flex items-center gap-3 rounded-lg border border-borderGray bg-white px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectedChecklist.services.withinMentalHealthScope}
                    onChange={() => updateChecklist(selectedDoctor.id, 'services', 'withinMentalHealthScope')}
                    className="focus-outline h-4 w-4 rounded border-borderGray text-primary"
                  />
                  <span className="text-sm text-muted">Services are within mental health scope</span>
                </label>
              </SectionCard>

              <SectionCard title="Profile quality">
                <label className="flex items-center gap-3 rounded-lg border border-borderGray bg-white px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectedChecklist.profile.bioMinLength}
                    onChange={() => updateChecklist(selectedDoctor.id, 'profile', 'bioMinLength')}
                    className="focus-outline h-4 w-4 rounded border-borderGray text-primary"
                  />
                  <span className="text-sm text-muted">Bio meets minimum length</span>
                </label>
                <label className="flex items-center gap-3 rounded-lg border border-borderGray bg-white px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectedChecklist.profile.professionalLanguage}
                    onChange={() => updateChecklist(selectedDoctor.id, 'profile', 'professionalLanguage')}
                    className="focus-outline h-4 w-4 rounded border-borderGray text-primary"
                  />
                  <span className="text-sm text-muted">Professional language</span>
                </label>
                <label className="flex items-center gap-3 rounded-lg border border-borderGray bg-white px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectedChecklist.profile.noExternalContacts}
                    onChange={() => updateChecklist(selectedDoctor.id, 'profile', 'noExternalContacts')}
                    className="focus-outline h-4 w-4 rounded border-borderGray text-primary"
                  />
                  <span className="text-sm text-muted">No external contact info in bio</span>
                </label>
                <label className="flex items-center gap-3 rounded-lg border border-borderGray bg-white px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectedChecklist.profile.noExaggeratedClaims}
                    onChange={() => updateChecklist(selectedDoctor.id, 'profile', 'noExaggeratedClaims')}
                    className="focus-outline h-4 w-4 rounded border-borderGray text-primary"
                  />
                  <span className="text-sm text-muted">No exaggerated claims</span>
                </label>
              </SectionCard>

              <SectionCard title="Availability setup (required)">
                <p className="text-sm text-muted">
                  Timezone: <span className="font-semibold text-textMain">{selectedDoctor.availability.timezone || 'Not set'}</span>
                </p>
                <p className="text-sm text-muted">
                  Weekly blocks: <span className="font-semibold text-textMain">{selectedDoctor.availability.weeklyBlocks.length}</span>
                </p>

                <label className="flex items-center gap-3 rounded-lg border border-borderGray bg-white px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectedChecklist.availability.timezoneSet}
                    onChange={() => updateChecklist(selectedDoctor.id, 'availability', 'timezoneSet')}
                    className="focus-outline h-4 w-4 rounded border-borderGray text-primary"
                  />
                  <span className="text-sm text-muted">Timezone set</span>
                </label>
                <label className="flex items-center gap-3 rounded-lg border border-borderGray bg-white px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectedChecklist.availability.weeklyBlocksAdded}
                    onChange={() => updateChecklist(selectedDoctor.id, 'availability', 'weeklyBlocksAdded')}
                    className="focus-outline h-4 w-4 rounded border-borderGray text-primary"
                  />
                  <span className="text-sm text-muted">At least one weekly block added</span>
                </label>
              </SectionCard>

              <SectionCard title="Safety and compliance">
                <div className="text-sm text-muted">
                  <p>
                    Duplicate account indicator:{' '}
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${selectedDoctor.duplicateAccountFlag ? 'border-red-100 bg-red-50 text-red-700' : 'border-primary-100 bg-primary-50 text-primary-700'}`}>
                      {selectedDoctor.duplicateAccountFlag ? 'Flagged' : 'Clear'}
                    </span>
                  </p>
                  <p className="mt-1">
                    Suspicious data indicator:{' '}
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${selectedDoctor.suspiciousDataFlag ? 'border-red-100 bg-red-50 text-red-700' : 'border-primary-100 bg-primary-50 text-primary-700'}`}>
                      {selectedDoctor.suspiciousDataFlag ? 'Flagged' : 'Clear'}
                    </span>
                  </p>
                </div>

                <label className="flex items-center gap-3 rounded-lg border border-borderGray bg-white px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectedChecklist.safety.noDuplicateAccount}
                    onChange={() => updateChecklist(selectedDoctor.id, 'safety', 'noDuplicateAccount')}
                    className="focus-outline h-4 w-4 rounded border-borderGray text-primary"
                  />
                  <span className="text-sm text-muted">No duplicate account</span>
                </label>
                <label className="flex items-center gap-3 rounded-lg border border-borderGray bg-white px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectedChecklist.safety.noSuspiciousData}
                    onChange={() => updateChecklist(selectedDoctor.id, 'safety', 'noSuspiciousData')}
                    className="focus-outline h-4 w-4 rounded border-borderGray text-primary"
                  />
                  <span className="text-sm text-muted">No suspicious data</span>
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-textMain">Admin notes</span>
                  <textarea
                    value={notesDraft[selectedDoctor.id] ?? ''}
                    onChange={(event) => setNotesDraft((previous) => ({ ...previous, [selectedDoctor.id]: event.target.value }))}
                    rows={4}
                    className="focus-outline mt-2 w-full rounded-xl border border-borderGray bg-white px-3 py-2 text-sm text-textMain"
                    placeholder="Add verification notes for this doctor"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => saveAdminNote(selectedDoctor.id)}
                  className="focus-outline rounded-lg border border-borderGray px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-primary/30 hover:text-primary"
                >
                  Save notes
                </button>
              </SectionCard>
            </div>

                <div className="mt-5 border-t border-borderGray pt-4">
                  <p className="text-sm font-semibold text-textMain">Decision</p>
                  <p className="mt-1 text-xs text-muted">
                    Current status:{' '}
                    <span className="font-semibold text-textMain">
                      {statusLabel(selectedDoctor.status)}
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setAcceptModalDoctorId(selectedDoctor.id)}
                    disabled={!isReadyForApproval || selectedDoctor.status === 'accepted'}
                    className="focus-outline mt-3 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primaryDark disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCloseModal({
                        doctorId: selectedDoctor.id,
                        reason: '',
                        notes: notesDraft[selectedDoctor.id] ?? ''
                      })
                    }
                    className="focus-outline mt-2 w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                  >
                    Close
                  </button>
                  {selectedDoctor.status === 'closed' && (
                    <button
                      type="button"
                      onClick={() => reopenDoctor(selectedDoctor.id)}
                      className="focus-outline mt-2 w-full rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
                    >
                      Reopen (Pending)
                    </button>
                  )}
                  {!isReadyForApproval && selectedDoctor.status !== 'accepted' ? (
                    <p className="mt-2 text-xs text-muted">
                      Complete all checklist items before accepting.
                    </p>
                  ) : null}
                </div>
          </article>

          <article className="rounded-[20px] border border-borderGray bg-white p-5 shadow-card">
            <h2 className="text-lg font-bold text-textMain">History / Audit Log</h2>
            <ol className="mt-4 space-y-3">
              {[...selectedDoctor.history]
                .sort((first, second) => new Date(second.at).getTime() - new Date(first.at).getTime())
                .map((item) => (
                  <li key={`${item.at}-${item.action}`} className="rounded-lg border border-borderGray bg-slate-50 px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">{formatDateTime(item.at)}</p>
                    <p className="mt-1 text-sm text-textMain">{item.action}</p>
                  </li>
                ))}
            </ol>
          </article>
        </div>
      </div>
    </>
  ) : null;

  return (
    <div className="min-h-screen bg-[#F8FBFF] text-textMain">
      <main className="section-shell py-6 sm:py-8">
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => logout('/login')}
            className="focus-outline rounded-xl border border-borderGray bg-white px-4 py-2 text-sm font-semibold text-textMain transition hover:border-primary/30 hover:text-primary"
          >
            Logout
          </button>
        </div>
        {view === 'list' ? listContent : reviewContent}
      </main>

      {acceptModalDoctorId ? (
        <ModalFrame
          title="Accept doctor"
          onClose={() => setAcceptModalDoctorId(null)}
          footer={
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAcceptModalDoctorId(null)}
                className="focus-outline rounded-lg border border-borderGray px-3 py-2 text-sm font-semibold text-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  acceptDoctor(acceptModalDoctorId);
                  setAcceptModalDoctorId(null);
                }}
                className="focus-outline rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition hover:bg-primaryDark"
              >
                Confirm accept
              </button>
            </div>
          }
        >
          <p className="text-sm text-muted">
            Accepting will publish this doctor on the public website as an active MindCare doctor.
            You can close the doctor later if needed.
          </p>
        </ModalFrame>
      ) : null}

      {closeModal ? (
        <ModalFrame
          title="Close doctor"
          onClose={() => setCloseModal(null)}
          footer={
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCloseModal(null)}
                className="focus-outline rounded-lg border border-borderGray px-3 py-2 text-sm font-semibold text-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!closeModal.reason}
                onClick={() => {
                  if (!closeModal.reason) {
                    return;
                  }

                  closeDoctor(closeModal.doctorId, closeModal.reason, closeModal.notes);
                  setCloseModal(null);
                }}
                className="focus-outline rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Save close state
              </button>
            </div>
          }
        >
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-textMain">Reason (required)</span>
            <select
              value={closeModal.reason}
              onChange={(event) =>
                setCloseModal((previous) =>
                  previous
                    ? {
                        ...previous,
                        reason: event.target.value as CloseReason
                      }
                    : previous
                )
              }
              className="focus-outline h-11 w-full rounded-xl border border-borderGray px-3 text-sm text-textMain"
            >
              <option value="">Select reason</option>
              {rejectReasons.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </label>

          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-semibold text-textMain">Notes (optional)</span>
            <textarea
              value={closeModal.notes}
              onChange={(event) =>
                setCloseModal((previous) =>
                  previous
                    ? {
                        ...previous,
                        notes: event.target.value
                      }
                    : previous
                )
              }
              rows={4}
              className="focus-outline w-full rounded-xl border border-borderGray px-3 py-2 text-sm text-textMain"
              placeholder="Explain why this doctor is closed. This will be kept in the internal history."
            />
          </label>
        </ModalFrame>
      ) : null}

      {documentModal ? (
        <ModalFrame
          title={documentModal.title}
          widthClassName="max-w-2xl"
          onClose={() => setDocumentModal(null)}
          footer={
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setDocumentModal(null)}
                className="focus-outline rounded-lg border border-borderGray px-3 py-2 text-sm font-semibold text-muted"
              >
                Close
              </button>
            </div>
          }
        >
          <div className="rounded-[16px] border border-borderGray bg-slate-50 p-4">
            <p className="text-sm font-semibold text-textMain">{documentModal.document.filename}</p>
            <p className="mt-1 text-xs text-muted">{documentModal.document.previewLabel}</p>

            <div className="mt-4 flex min-h-[240px] items-center justify-center rounded-xl border border-dashed border-borderGray bg-white p-4 text-center">
              {documentModal.document.status === 'uploaded' ? (
                <div>
                  <p className="text-sm font-semibold text-textMain">Document preview placeholder</p>
                  <p className="mt-1 text-xs text-muted">Use real viewer integration when backend is available.</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-semibold text-red-700">Document missing</p>
                  <p className="mt-1 text-xs text-muted">No upload was provided for this item.</p>
                </div>
              )}
            </div>
          </div>
        </ModalFrame>
      ) : null}
    </div>
  );
}
