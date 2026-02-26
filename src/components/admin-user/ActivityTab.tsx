import { UserActivityLog } from '../../data/userProfileData';

type ActivityTabProps = {
  activityLogs: UserActivityLog[];
};

const activityIcons: Record<string, string> = {
  'Session scheduled': '📅',
  'Session completed': '✓',
  'Profile updated': '✏️',
  'Treatment plan created': '📋',
  'Payment received': '💳',
  'Account suspended': '🚫',
  'Account activated': '✓',
  'Doctor assigned': '👨‍⚕️',
  'Status changed': '📊'
};

const activityColors: Record<string, string> = {
  user: '#3b82f6',
  doctor: '#10b981',
  admin: '#f59e0b'
};

export default function ActivityTab({ activityLogs }: ActivityTabProps) {
  const sortedLogs = [...activityLogs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (sortedLogs.length === 0) {
    return (
      <div className="rounded-lg bg-primaryBg/30 p-8 text-center">
        <p className="text-sm font-semibold text-muted">No activity yet</p>
        <p className="mt-1 text-xs text-muted/60">User activity will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {sortedLogs.map((log, idx) => (
        <div key={idx} className="border-l-2 border-primary/20 pl-6 pb-6 relative last:pb-0">
          {/* Timeline Dot */}
          <div className="absolute -left-2.5 top-2 w-5 h-5 rounded-full bg-white border-2 border-primary" />

          {/* Activity Card */}
          <div className="rounded-lg border border-borderGray bg-white p-4 hover:shadow-soft transition">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex items-start gap-3 flex-1">
                <span className="text-xl flex-shrink-0">{activityIcons[log.action] || '📝'}</span>
                <div>
                  <p className="text-sm font-semibold text-textMain">{log.action}</p>
                  <p className="text-xs text-muted mt-0.5">{formatTime(log.timestamp)}</p>
                </div>
              </div>

              {/* Changed By Badge */}
              <div
                className="inline-flex px-2 py-1 rounded text-xs font-bold text-white flex-shrink-0"
                style={{
                  backgroundColor: activityColors[log.changedBy] || '#6b7280'
                }}
              >
                {log.changedBy === 'user' && 'User'}
                {log.changedBy === 'doctor' && 'Doctor'}
                {log.changedBy === 'admin' && 'Admin'}
              </div>
            </div>

            {/* Details - Collapsible */}
            {Object.keys(log.details).length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs font-semibold text-primary hover:text-primaryDark text-right">
                  Details
                </summary>
                <div className="mt-2 bg-primaryBg/30 rounded p-2 text-xs text-muted space-y-1">
                  {Object.entries(log.details).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="font-semibold capitalize">{key}:</span>
                      <span className="text-right break-all">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
