import { useMemo, useState } from 'react';
import { UserProfile } from '../../data/userProfileData';

type UserListViewProps = {
  users: UserProfile[];
  onSelectUser: (userId: string) => void;
};

type FilterState = {
  search: string;
  status: 'all' | 'active' | 'suspended' | 'needs_review';
  sort: 'newest' | 'oldest' | 'name';
};

export default function UserListView({ users, onSelectUser }: UserListViewProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    sort: 'newest'
  });

  const filteredUsers = useMemo(() => {
    let result = users.filter((user) => {
      // Search filter
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        user.fullName.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.id.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus = filters.status === 'all' || user.accountStatus === filters.status;

      return matchesSearch && matchesStatus;
    });

    // Sorting
    if (filters.sort === 'name') {
      result.sort((a, b) => a.fullName.localeCompare(b.fullName));
    } else if (filters.sort === 'oldest') {
      result.sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime());
    } else {
      result.sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime());
    }

    return result;
  }, [users, filters]);

  const statusBadgeColor: Record<string, { bg: string; text: string }> = {
    active: { bg: '#ecfdf5', text: '#10b981' },
    suspended: { bg: '#fef2f2', text: '#ef4444' },
    needs_review: { bg: '#fffbeb', text: '#f59e0b' }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'suspended':
        return 'Suspended';
      case 'needs_review':
        return 'Needs Review';
      default:
        return status;
    }
  };

  return (
    <section className="section-shell py-8">
      <h1 className="text-3xl font-black text-textMain mb-8">User Management</h1>

      {/* Search & Filters */}
      <div className="rounded-hero border border-borderGray bg-white p-6 shadow-card mb-8">
        <div className="grid gap-4 sm:grid-cols-4">
          {/* Search */}
          <input
            type="text"
            placeholder="Search by name, email, or ID..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="rounded-lg border border-borderGray bg-white px-4 py-2 text-sm text-textMain placeholder-muted focus:border-primary focus:outline-none"
          />

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
            className="rounded-lg border border-borderGray bg-white px-4 py-2 text-sm text-textMain focus:border-primary focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="needs_review">Needs Review</option>
          </select>

          {/* Sort */}
          <select
            value={filters.sort}
            onChange={(e) => setFilters({ ...filters, sort: e.target.value as any })}
            className="rounded-lg border border-borderGray bg-white px-4 py-2 text-sm text-textMain focus:border-primary focus:outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name (A-Z)</option>
          </select>

          {/* Result Count */}
          <div className="flex items-center justify-center rounded-lg bg-primaryBg/40 px-4 py-2">
            <p className="text-sm font-semibold text-primary">{filteredUsers.length} users found</p>
          </div>
        </div>
      </div>

      {/* Users Table - Desktop */}
      <div className="hidden lg:block rounded-hero border border-borderGray bg-white shadow-card overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-borderGray bg-primaryBg/30">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-muted/60">Name</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-muted/60">Email</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-muted/60">Status</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-muted/60">Timezone</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-muted/60">Joined</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-muted/60">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user, idx) => (
              <tr key={user.id} className={`border-b border-borderGray/40 transition hover:bg-primaryBg/20 ${idx === filteredUsers.length - 1 ? 'border-b-0' : ''}`}>
                <td className="px-6 py-4 text-sm font-semibold text-textMain">{user.fullName}</td>
                <td className="px-6 py-4 text-sm text-muted">{user.email}</td>
                <td className="px-6 py-4">
                  <div
                    className="inline-flex px-2 py-1 rounded text-xs font-semibold"
                    style={{
                      backgroundColor: statusBadgeColor[user.accountStatus].bg,
                      color: statusBadgeColor[user.accountStatus].text
                    }}
                  >
                    {getStatusLabel(user.accountStatus)}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-muted">{user.timezone}</td>
                <td className="px-6 py-4 text-sm text-muted">{new Date(user.joinedAt).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => onSelectUser(user.id)}
                    className="text-sm font-semibold text-primary hover:text-primaryDark transition focus:outline-none"
                  >
                    View Profile →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Users Cards - Mobile */}
      <div className="lg:hidden space-y-4">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="rounded-hero border border-borderGray bg-white p-4 shadow-card hover:shadow-soft transition"
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h3 className="text-base font-bold text-textMain">{user.fullName}</h3>
                <p className="text-xs text-muted mt-1">{user.email}</p>
              </div>
              <div
                className="inline-flex px-2 py-1 rounded text-xs font-semibold flex-shrink-0"
                style={{
                  backgroundColor: statusBadgeColor[user.accountStatus].bg,
                  color: statusBadgeColor[user.accountStatus].text
                }}
              >
                {getStatusLabel(user.accountStatus)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
              <div>
                <p className="text-muted/60 font-bold">Timezone</p>
                <p className="text-textMain">{user.timezone}</p>
              </div>
              <div>
                <p className="text-muted/60 font-bold">Joined</p>
                <p className="text-textMain">{new Date(user.joinedAt).toLocaleDateString()}</p>
              </div>
            </div>

            <button
              onClick={() => onSelectUser(user.id)}
              className="w-full rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-primaryDark"
            >
              View Profile
            </button>
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredUsers.length === 0 && (
        <div className="rounded-hero border border-dashed border-borderGray bg-primaryBg/10 p-12 text-center">
          <p className="text-lg font-semibold text-muted">No users found</p>
          <p className="mt-1 text-sm text-muted/60">Try adjusting your search or filters</p>
        </div>
      )}
    </section>
  );
}
