import { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { ApiError, apiJson } from '../utils/api';

type UserStatus = 'ACTIVE' | 'SUSPENDED';
type UserRole = 'USER' | 'DOCTOR' | 'ADMIN';
type AppointmentStatus = 'REQUESTED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';

type AdminUserListItem = {
  id: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
  appointments_count: number;
  upcoming_count: number;
  completed_count: number;
  cancelled_count: number;
  last_appointment_at: string | null;
};

type AdminUserAppointment = {
  id: string;
  doctor_user_id: string;
  doctor_display_name: string | null;
  start_at: string;
  end_at: string;
  timezone: string;
  status: AppointmentStatus;
  meeting_link: string | null;
  notes: string | null;
  created_at: string;
};

type AdminUserDetail = {
  user: {
    id: string;
    email: string | null;
    phone: string | null;
    role: UserRole;
    status: UserStatus;
    created_at: string;
    updated_at: string;
  };
  appointments_count: number;
  upcoming_count: number;
  completed_count: number;
  cancelled_count: number;
  last_appointment_at: string | null;
  appointments: AdminUserAppointment[];
};

type ViewMode = 'list' | 'detail';

type StatusFilter = 'ALL' | UserStatus;

function formatDate(isoValue: string | null): string {
  if (!isoValue) {
    return 'N/A';
  }

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

function displayNameFromEmail(email: string | null, id: string): string {
  if (!email) {
    return `User ${id.slice(0, 8)}`;
  }

  const local = email.split('@')[0];
  if (!local) {
    return email;
  }

  return local
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function statusBadgeClass(status: UserStatus): string {
  if (status === 'ACTIVE') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }
  return 'border-rose-200 bg-rose-50 text-rose-700';
}

function appointmentStatusClass(status: AppointmentStatus): string {
  if (status === 'CONFIRMED') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'REQUESTED') return 'border-sky-200 bg-sky-50 text-sky-700';
  if (status === 'CANCELLED') return 'border-rose-200 bg-rose-50 text-rose-700';
  if (status === 'NO_SHOW') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-slate-200 bg-slate-100 text-slate-700';
}

export default function AdminUserProfilePage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [selectedUserDetail, setSelectedUserDetail] = useState<AdminUserDetail | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [isListLoading, setIsListLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        search.length === 0 ||
        (user.email ?? '').toLowerCase().includes(search) ||
        user.id.toLowerCase().includes(search) ||
        displayNameFromEmail(user.email, user.id).toLowerCase().includes(search);

      const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter, users]);

  const loadUsers = async () => {
    setIsListLoading(true);
    setErrorMessage(null);

    try {
      const query = new URLSearchParams();
      if (statusFilter !== 'ALL') {
        query.set('status', statusFilter);
      }
      if (searchQuery.trim()) {
        query.set('search', searchQuery.trim());
      }

      const suffix = query.toString();
      const payload = await apiJson<AdminUserListItem[]>(
        suffix ? `/admin/users?${suffix}` : '/admin/users',
        undefined,
        true,
        'Failed to load users'
      );
      setUsers(payload);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        setErrorMessage('Admin access is required to view users.');
      } else {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load users');
      }
    } finally {
      setIsListLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const openUserDetail = async (userId: string) => {
    setErrorMessage(null);
    setIsDetailLoading(true);
    setSelectedUserId(userId);
    setViewMode('detail');

    try {
      const payload = await apiJson<AdminUserDetail>(
        `/admin/users/${userId}`,
        undefined,
        true,
        'Failed to load user details'
      );
      setSelectedUserDetail(payload);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load user details');
      setSelectedUserDetail(null);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedUserId(null);
    setSelectedUserDetail(null);
  };

  const deleteSelectedUser = async () => {
    if (!selectedUserDetail) return;
    const userLabel = selectedUserDetail.user.email ?? selectedUserDetail.user.id;
    const confirmed = window.confirm(`Delete this user account permanently?\n\n${userLabel}`);
    if (!confirmed) return;

    setErrorMessage(null);
    setIsDeletingUser(true);
    try {
      await apiJson<{ message: string }>(
        `/admin/users/${selectedUserDetail.user.id}`,
        { method: 'DELETE' },
        true,
        'Failed to delete user account'
      );
      await loadUsers();
      handleBackToList();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete user account');
    } finally {
      setIsDeletingUser(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/40 via-white to-white text-textMain">
      <Header
        brandHref="/admin"
        navItems={[
          { labelKey: 'nav.doctors', href: '/admin' },
          { labelKey: 'nav.users', href: '/admin/users' },
          { labelKey: 'nav.dashboard', href: '/admin' }
        ]}
      />

      <main>
        {viewMode === 'list' ? (
          <section className="section-shell py-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-3xl font-black text-textMain">User Management</h1>
                <p className="mt-2 text-sm text-muted">Live user accounts and appointment activity.</p>
              </div>
              <button
                type="button"
                onClick={() => void loadUsers()}
                className="rounded-lg border border-borderGray bg-white px-4 py-2 text-sm font-semibold text-textMain transition hover:border-primary/40 hover:text-primary"
              >
                Refresh
              </button>
            </div>

            <div className="mt-6 rounded-hero border border-borderGray bg-white p-4 shadow-card">
              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  type="text"
                  placeholder="Search by email, ID, or derived name"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="rounded-lg border border-borderGray bg-white px-3 py-2 text-sm text-textMain placeholder-muted focus:border-primary focus:outline-none"
                />

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                  className="rounded-lg border border-borderGray bg-white px-3 py-2 text-sm text-textMain focus:border-primary focus:outline-none"
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>

                <button
                  type="button"
                  onClick={() => void loadUsers()}
                  className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition hover:bg-primaryDark"
                >
                  Apply Filters
                </button>
              </div>
            </div>

            {errorMessage && (
              <p className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p>
            )}

            <div className="mt-6 rounded-hero border border-borderGray bg-white shadow-card overflow-hidden">
              {isListLoading ? (
                <div className="p-8">
                  <p className="text-sm text-muted">Loading users...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-8">
                  <p className="text-sm text-muted">No users found.</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="border-b border-borderGray bg-primaryBg/30">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-muted">User</th>
                      <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-muted">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-muted">Appointments</th>
                      <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-muted">Last Activity</th>
                      <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-muted">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-borderGray/40 last:border-b-0">
                        <td className="px-4 py-4">
                          <p className="text-sm font-bold text-textMain">{displayNameFromEmail(user.email, user.id)}</p>
                          <p className="text-xs text-muted">{user.email ?? user.id}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(user.status)}`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-xs text-textMain">
                          <p>Total: {user.appointments_count}</p>
                          <p className="text-muted">Upcoming: {user.upcoming_count}</p>
                        </td>
                        <td className="px-4 py-4 text-xs text-muted">{formatDate(user.last_appointment_at)}</td>
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() => void openUserDetail(user.id)}
                            className="rounded-lg border border-borderGray bg-white px-3 py-1.5 text-xs font-semibold text-textMain transition hover:border-primary/40 hover:text-primary"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        ) : (
          <section className="section-shell py-8">
            <button
              type="button"
              onClick={handleBackToList}
              className="mb-6 flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-primaryDark"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Users
            </button>

            {errorMessage && (
              <p className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p>
            )}

            {isDetailLoading ? (
              <div className="rounded-hero border border-borderGray bg-white p-6 shadow-card">
                <p className="text-sm text-muted">Loading user details...</p>
              </div>
            ) : !selectedUserDetail ? (
              <div className="rounded-hero border border-borderGray bg-white p-6 shadow-card">
                <p className="text-sm text-muted">No user details found for {selectedUserId ?? 'selected user'}.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <section className="rounded-hero border border-borderGray bg-white p-6 shadow-card">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h1 className="text-2xl font-black text-textMain">
                        {displayNameFromEmail(selectedUserDetail.user.email, selectedUserDetail.user.id)}
                      </h1>
                      <p className="mt-1 text-sm text-muted">{selectedUserDetail.user.email ?? selectedUserDetail.user.id}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void deleteSelectedUser()}
                      disabled={isDeletingUser}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                    >
                      {isDeletingUser ? 'Deleting...' : 'Delete Account'}
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-4">
                    <article className="rounded-xl border border-borderGray bg-slate-50 px-3 py-2">
                      <p className="text-[11px] font-black uppercase tracking-wide text-muted">Role</p>
                      <p className="mt-1 text-sm font-semibold text-textMain">{selectedUserDetail.user.role}</p>
                    </article>
                    <article className="rounded-xl border border-borderGray bg-slate-50 px-3 py-2">
                      <p className="text-[11px] font-black uppercase tracking-wide text-muted">Status</p>
                      <p className="mt-1 text-sm font-semibold text-textMain">{selectedUserDetail.user.status}</p>
                    </article>
                    <article className="rounded-xl border border-borderGray bg-slate-50 px-3 py-2">
                      <p className="text-[11px] font-black uppercase tracking-wide text-muted">Joined</p>
                      <p className="mt-1 text-sm font-semibold text-textMain">{formatDate(selectedUserDetail.user.created_at)}</p>
                    </article>
                    <article className="rounded-xl border border-borderGray bg-slate-50 px-3 py-2">
                      <p className="text-[11px] font-black uppercase tracking-wide text-muted">Last Appointment</p>
                      <p className="mt-1 text-sm font-semibold text-textMain">{formatDate(selectedUserDetail.last_appointment_at)}</p>
                    </article>
                  </div>
                </section>

                <section className="rounded-hero border border-borderGray bg-white p-6 shadow-card">
                  <h2 className="text-xl font-black text-textMain">Appointment Summary</h2>
                  <div className="mt-4 grid gap-3 sm:grid-cols-4">
                    <article className="rounded-xl border border-borderGray bg-slate-50 px-3 py-2">
                      <p className="text-[11px] font-black uppercase tracking-wide text-muted">Total</p>
                      <p className="mt-1 text-lg font-black text-textMain">{selectedUserDetail.appointments_count}</p>
                    </article>
                    <article className="rounded-xl border border-borderGray bg-slate-50 px-3 py-2">
                      <p className="text-[11px] font-black uppercase tracking-wide text-muted">Upcoming</p>
                      <p className="mt-1 text-lg font-black text-textMain">{selectedUserDetail.upcoming_count}</p>
                    </article>
                    <article className="rounded-xl border border-borderGray bg-slate-50 px-3 py-2">
                      <p className="text-[11px] font-black uppercase tracking-wide text-muted">Completed</p>
                      <p className="mt-1 text-lg font-black text-textMain">{selectedUserDetail.completed_count}</p>
                    </article>
                    <article className="rounded-xl border border-borderGray bg-slate-50 px-3 py-2">
                      <p className="text-[11px] font-black uppercase tracking-wide text-muted">Cancelled</p>
                      <p className="mt-1 text-lg font-black text-textMain">{selectedUserDetail.cancelled_count}</p>
                    </article>
                  </div>
                </section>

                <section className="rounded-hero border border-borderGray bg-white p-6 shadow-card">
                  <h2 className="text-xl font-black text-textMain">Appointments</h2>

                  {selectedUserDetail.appointments.length === 0 ? (
                    <p className="mt-4 text-sm text-muted">No appointments for this user.</p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {selectedUserDetail.appointments.map((appointment) => (
                        <article key={appointment.id} className="rounded-xl border border-borderGray bg-slate-50 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-bold text-textMain">
                                {appointment.doctor_display_name ?? `Doctor ${appointment.doctor_user_id.slice(0, 8)}`}
                              </p>
                              <p className="mt-1 text-xs text-muted">{formatDate(appointment.start_at)}</p>
                              <p className="mt-1 text-xs text-muted">Timezone: {appointment.timezone}</p>
                              {appointment.notes && <p className="mt-2 text-xs text-muted">Notes: {appointment.notes}</p>}
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
                            </div>
                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${appointmentStatusClass(appointment.status)}`}>
                              {appointment.status}
                            </span>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
