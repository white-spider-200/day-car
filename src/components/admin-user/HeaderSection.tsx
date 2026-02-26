import { UserProfile } from '../../data/userProfileData';

type HeaderSectionProps = {
  user: UserProfile;
};

const statusColors = {
  active: { bg: '#ecfdf5', border: '#d1fae5', text: '#10b981', label: 'Active' },
  suspended: { bg: '#fef2f2', border: '#fee2e2', text: '#ef4444', label: 'Suspended' },
  needs_review: { bg: '#fffbeb', border: '#fef3c7', text: '#f59e0b', label: 'Needs Review' }
};

export default function HeaderSection({ user }: HeaderSectionProps) {
  const status = statusColors[user.accountStatus];
  const lastActivityTime = new Date(user.lastActivity);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - lastActivityTime.getTime()) / (1000 * 60));

  let activityText: string;
  if (diffMinutes < 60) {
    activityText = `${diffMinutes}m ago`;
  } else if (diffMinutes < 1440) {
    const hours = Math.floor(diffMinutes / 60);
    activityText = `${hours}h ago`;
  } else {
    const days = Math.floor(diffMinutes / 1440);
    activityText = `${days}d ago`;
  }

  return (
    <div className="rounded-hero border border-borderGray bg-white p-6 shadow-card sm:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-textMain sm:text-4xl">{user.fullName}</h1>
          <p className="mt-1 text-sm text-muted">ID: {user.id}</p>
        </div>

        <div
          className="inline-flex items-center rounded-full px-4 py-2 border"
          style={{
            backgroundColor: status.bg,
            borderColor: status.border,
            color: status.text
          }}
        >
          <span className="text-xs font-bold uppercase tracking-widest">{status.label}</span>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted/60">Last Activity</p>
          <p className="mt-1 text-sm font-semibold text-textMain">{activityText}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted/60">Member Since</p>
          <p className="mt-1 text-sm font-semibold text-textMain">{new Date(user.joinedAt).toLocaleDateString()}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted/60">Timezone</p>
          <p className="mt-1 text-sm font-semibold text-textMain">{user.timezone}</p>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap gap-2 sm:gap-3">
        <button className="focus-outline inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-xs font-semibold text-white transition hover:bg-primaryDark">
          💬 Message User
        </button>
        <button className="focus-outline inline-flex h-10 items-center justify-center rounded-lg border border-primary/20 bg-primaryBg px-4 text-xs font-semibold text-primary transition hover:bg-primaryBg/80">
          📅 Schedule Session
        </button>
        <button className="focus-outline inline-flex h-10 items-center justify-center rounded-lg border border-primary/20 bg-primaryBg px-4 text-xs font-semibold text-primary transition hover:bg-primaryBg/80">
          👨‍⚕️ Assign Doctor
        </button>
        <button className="focus-outline inline-flex h-10 items-center justify-center rounded-lg border border-primary/20 bg-primaryBg px-4 text-xs font-semibold text-primary transition hover:bg-primaryBg/80">
          📝 Add Note
        </button>
        {user.accountStatus === 'active' && (
          <button className="focus-outline inline-flex h-10 items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 text-xs font-semibold text-red-600 transition hover:bg-red-100">
            🚫 Suspend
          </button>
        )}
      </div>
    </div>
  );
}
