import { useMemo } from 'react';
import { UserSession } from '../../data/userProfileData';

type SessionsTabProps = {
  sessions: UserSession[];
  timezone: string;
};

export default function SessionsTab({ sessions, timezone }: SessionsTabProps) {
  const { upcomingSessions, nextSession, pastSessions } = useMemo(() => {
    const now = new Date();
    const upcoming = sessions.filter((s) => new Date(s.scheduledAt) > now && s.status !== 'cancelled');
    const past = sessions.filter(
      (s) => new Date(s.scheduledAt) < now || s.status === 'completed' || s.status === 'cancelled'
    );

    return {
      nextSession: upcoming.length > 0 ? upcoming[0] : null,
      upcomingSessions: upcoming.slice(1),
      pastSessions: past.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
    };
  }, [sessions]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<
      string,
      { bg: string; text: string; label: string }
    > = {
      scheduled: { bg: '#dbeafe', text: '#1e40af', label: 'Scheduled' },
      completed: { bg: '#ecfdf5', text: '#10b981', label: 'Completed' },
      'no-show': { bg: '#fef2f2', text: '#991b1b', label: 'No-show' },
      cancelled: { bg: '#f3f4f6', text: '#4b5563', label: 'Cancelled' },
      rescheduled: { bg: '#fef3c7', text: '#92400e', label: 'Rescheduled' }
    };

    return styles[status] || styles.scheduled;
  };

  const sessionTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return '📹';
      case 'chat':
        return '💬';
      case 'voice':
        return '☎️';
      default:
        return '📞';
    }
  };

  return (
    <div className="space-y-8">
      {/* Next Upcoming Session - Highlighted */}
      {nextSession && (
        <div className="rounded-lg border-2 border-primary bg-gradient-to-br from-primary-50 to-white p-6 shadow-soft">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🎯</span>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Next Session</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted/60 mb-1">Date & Time</p>
              <p className="text-lg font-bold text-textMain">{formatDateTime(nextSession.scheduledAt)}</p>
              <p className="mt-1 text-xs text-muted">{timezone}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted/60 mb-1">Doctor</p>
              <p className="text-lg font-bold text-primary">{nextSession.doctorName}</p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted/60 mb-1">Type & Duration</p>
              <p className="text-base font-semibold text-textMain">
                {sessionTypeIcon(nextSession.sessionType)} {nextSession.sessionType} · {nextSession.duration} min
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted/60 mb-1">Status</p>
              <div
                className="inline-flex px-3 py-1 rounded-lg text-xs font-bold"
                style={{
                  backgroundColor: getStatusBadge(nextSession.status).bg,
                  color: getStatusBadge(nextSession.status).text
                }}
              >
                {getStatusBadge(nextSession.status).label}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {nextSession.joinLink && (
              <a
                href={nextSession.joinLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primaryDark transition"
              >
                Join Session
              </a>
            )}
            <button className="inline-flex items-center justify-center h-10 rounded-lg border border-primary/20 bg-primaryBg px-4 text-sm font-semibold text-primary hover:bg-primaryBg/80 transition">
              Reschedule
            </button>
            <button className="inline-flex items-center justify-center h-10 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-600 hover:bg-red-100 transition">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Upcoming Sessions */}
      {upcomingSessions.length > 0 && (
        <div>
          <h4 className="text-base font-bold text-textMain mb-4">Upcoming Sessions</h4>
          <div className="space-y-3">
            {upcomingSessions.map((session) => (
              <div key={session.id} className="rounded-lg border border-borderGray bg-white p-4 hover:shadow-soft transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-textMain">{formatDateTime(session.scheduledAt)}</p>
                    <p className="mt-1 text-sm text-muted">
                      {sessionTypeIcon(session.sessionType)} {session.doctorName}
                    </p>
                  </div>
                  <div
                    className="inline-flex px-2 py-1 rounded text-xs font-bold flex-shrink-0"
                    style={{
                      backgroundColor: getStatusBadge(session.status).bg,
                      color: getStatusBadge(session.status).text
                    }}
                  >
                    {getStatusBadge(session.status).label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past Sessions */}
      {pastSessions.length > 0 && (
        <div>
          <h4 className="text-base font-bold text-textMain mb-4">Session History</h4>
          <div className="space-y-3">
            {pastSessions.map((session) => (
              <div key={session.id} className="rounded-lg border border-borderGray bg-white p-4 hover:shadow-soft transition">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-textMain">{formatDateTime(session.scheduledAt)}</p>
                    <p className="mt-1 text-sm text-muted">
                      {sessionTypeIcon(session.sessionType)} {session.doctorName} · {session.duration} min
                    </p>
                  </div>
                  <div
                    className="inline-flex px-2 py-1 rounded text-xs font-bold flex-shrink-0"
                    style={{
                      backgroundColor: getStatusBadge(session.status).bg,
                      color: getStatusBadge(session.status).text
                    }}
                  >
                    {getStatusBadge(session.status).label}
                  </div>
                </div>

                {session.status === 'completed' && (
                  <div className="border-t border-borderGray/40 pt-3">
                    {session.rating && (
                      <div className="flex items-center gap-2 text-sm mb-2">
                        <span className="font-semibold text-textMain">Rating:</span>
                        <span className="text-amber-500">{'⭐'.repeat(session.rating)}</span>
                        <span className="text-muted">({session.rating}/5)</span>
                      </div>
                    )}
                    {session.userFeedback && (
                      <p className="text-xs text-muted italic">&quot;{session.userFeedback}&quot;</p>
                    )}
                    {session.doctorNotes && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs font-semibold text-primary hover:text-primaryDark">
                          Doctor Notes
                        </summary>
                        <p className="mt-1 text-xs text-muted bg-primaryBg/30 p-2 rounded">{session.doctorNotes}</p>
                      </details>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Sessions */}
      {sessions.length === 0 && (
        <div className="rounded-lg bg-primaryBg/30 p-8 text-center">
          <p className="text-sm font-semibold text-muted">No sessions yet</p>
          <p className="mt-1 text-xs text-muted/60">Schedule the first session to get started</p>
        </div>
      )}
    </div>
  );
}
