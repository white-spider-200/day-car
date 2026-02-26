import { UserProfile } from '../../data/userProfileData';

type UserInfoCardProps = {
  user: UserProfile;
};

interface InfoRow {
  label: string;
  value: string | React.ReactNode;
  icon?: string;
}

export default function UserInfoCard({ user }: UserInfoCardProps) {
  const infoRows: InfoRow[] = [
    { label: 'Email', value: user.email, icon: '✉️' },
    { label: 'Phone', value: user.phone || '—', icon: '📱' },
    { label: 'Country', value: user.country, icon: '🌍' },
    { label: 'Timezone', value: user.timezone, icon: '🕐' },
    { label: 'Language', value: user.language, icon: '🗣️' }
  ];

  if (user.emergencyContact) {
    infoRows.push({
      label: 'Emergency Contact',
      value: (
        <div className="text-sm">
          <p className="font-semibold">{user.emergencyContact.name}</p>
          <p className="text-xs text-muted">{user.emergencyContact.phone}</p>
        </div>
      ),
      icon: '🆘'
    });
  }

  return (
    <div className="rounded-hero border border-borderGray bg-white p-6 shadow-card">
      <h3 className="text-lg font-bold text-textMain mb-4">User Information</h3>
      <div className="space-y-4">
        {infoRows.map((row) => (
          <div key={row.label} className="flex items-start gap-3 border-b border-borderGray/40 pb-3 last:border-0">
            <span className="text-lg flex-shrink-0">{row.icon}</span>
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-widest text-muted/60">{row.label}</p>
              <p className="mt-1 text-sm font-semibold text-textMain">{row.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
