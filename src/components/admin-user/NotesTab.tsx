import { useState } from 'react';
import { AdminNotes } from '../../data/userProfileData';

type NotesTabProps = {
  adminNotes: AdminNotes;
};

export default function NotesTab({ adminNotes }: NotesTabProps) {
  const [notesDraft, setNotesDraft] = useState(adminNotes.adminNotes);
  const [isSaved, setIsSaved] = useState(true);

  const handleSaveNotes = () => {
    setIsSaved(true);
    console.log('Notes saved:', notesDraft);
  };

  const riskFlagColors: Record<string, string> = {
    'grief-support-needed': '#fbbf24',
    'monitor-mood': '#f87171',
    'suicide-risk': '#dc2626',
    'substance-abuse': '#d97706',
    'self-harm-risk': '#f87171'
  };

  const riskFlagLabels: Record<string, string> = {
    'grief-support-needed': '🕊️ Grief Support Needed',
    'monitor-mood': '⚠️ Monitor Mood',
    'suicide-risk': '🔴 Suicide Risk',
    'substance-abuse': '⚠️ Substance Abuse',
    'self-harm-risk': '⚠️ Self-Harm Risk'
  };

  return (
    <div className="space-y-6">
      {/* Risk Flags */}
      {adminNotes.riskFlags.length > 0 && (
        <div>
          <h4 className="text-base font-bold text-textMain mb-3">Risk Flags</h4>
          <div className="flex flex-wrap gap-2">
            {adminNotes.riskFlags.map((flag) => (
              <div
                key={flag}
                className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                style={{
                  backgroundColor: riskFlagColors[flag] || '#ef4444'
                }}
              >
                {riskFlagLabels[flag] || flag}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin Notes - Editable */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-base font-bold text-textMain">Admin Notes</h4>
          {!isSaved && (
            <span className="text-xs font-semibold text-amber-600">Unsaved changes</span>
          )}
        </div>
        <textarea
          value={notesDraft}
          onChange={(e) => {
            setNotesDraft(e.target.value);
            setIsSaved(false);
          }}
          placeholder="Add internal notes about this user..."
          rows={5}
          className="w-full rounded-lg border border-borderGray bg-white px-4 py-3 text-sm text-textMain placeholder-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
        />
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleSaveNotes}
            disabled={isSaved}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primaryDark disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Notes
          </button>
          <button
            onClick={() => {
              setNotesDraft(adminNotes.adminNotes);
              setIsSaved(true);
            }}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-borderGray bg-white px-4 text-sm font-semibold text-textMain transition hover:bg-primaryBg/30"
          >
            Discard
          </button>
        </div>
        {adminNotes.lastUpdated && (
          <p className="mt-2 text-xs text-muted">
            Last updated: {new Date(adminNotes.lastUpdated).toLocaleString()} by {adminNotes.updatedBy}
          </p>
        )}
      </div>

      {/* Doctor Notes - Read Only */}
      {adminNotes.doctorNotes && (
        <div>
          <h4 className="text-base font-bold text-textMain mb-3">Doctor Notes</h4>
          <div className="rounded-lg border border-borderGray bg-primaryBg/30 p-4">
            <p className="text-sm leading-relaxed text-textMain">{adminNotes.doctorNotes}</p>
            <p className="mt-3 text-xs text-muted italic">Read-only view of doctor's internal notes</p>
          </div>
        </div>
      )}

      {adminNotes.doctorNotes === '' && (
        <div>
          <h4 className="text-base font-bold text-textMain mb-3">Doctor Notes</h4>
          <div className="rounded-lg bg-primaryBg/30 p-4 text-center">
            <p className="text-sm text-muted">No doctor notes yet</p>
          </div>
        </div>
      )}
    </div>
  );
}
