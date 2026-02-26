import { useState } from 'react';
import { UserIntake } from '../../data/userProfileData';

type IntakeAssessmentCardProps = {
  intake: UserIntake;
};

const urgencyColors = {
  low: { bg: '#ecfdf5', text: '#10b981', label: 'Low' },
  medium: { bg: '#fef3c7', text: '#f59e0b', label: 'Medium' },
  high: { bg: '#fee2e2', text: '#ef4444', label: 'High' }
};

export default function IntakeAssessmentCard({ intake }: IntakeAssessmentCardProps): JSX.Element {
  const [expanded, setExpanded] = useState(false);
  const urgency = urgencyColors[intake.urgencyLevel];

  return (
    <div className="rounded-hero border border-borderGray bg-white p-6 shadow-card">
      <h3 className="text-lg font-bold text-textMain mb-4">Intake Assessment</h3>

      <div className="space-y-4">
        {/* Primary Goal */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted/60 mb-2">Primary Goal</p>
          <span className="inline-flex items-center rounded-lg bg-primaryBg px-3 py-1 text-sm font-semibold text-primary">
            {intake.primaryGoal}
          </span>
        </div>

        {/* Symptoms */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted/60 mb-2">Symptoms</p>
          <div className="flex flex-wrap gap-2">
            {intake.symptoms.map((symptom) => (
              <span
                key={symptom}
                className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary"
              >
                {symptom}
              </span>
            ))}
          </div>
        </div>

        {/* Urgency Level */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted/60 mb-2">Urgency Level</p>
          <div
            className="inline-flex items-center rounded-lg px-3 py-1 border text-sm font-semibold"
            style={{
              backgroundColor: urgency.bg,
              color: urgency.text,
              borderColor: urgency.text + '40'
            }}
          >
            {urgency.label}
          </div>
        </div>

        {/* Preferred Session Type */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted/60 mb-2">Preferred Session Type</p>
          <div className="flex flex-wrap gap-2">
            {intake.preferredSessionType.map((type) => (
              <span
                key={type}
                className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700"
              >
                {type === 'video' && '📹'} {type === 'chat' && '💬'} {type === 'voice' && '☎️'} {type}
              </span>
            ))}
          </div>
        </div>

        {/* Preferred Doctor Gender */}
        {intake.preferredDoctorGender && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted/60 mb-2">Preferred Doctor Gender</p>
            <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-semibold text-purple-700">
              {intake.preferredDoctorGender}
            </span>
          </div>
        )}

        {/* User Message - Expandable */}
        <div className="border-t border-borderGray/40 pt-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex w-full items-center justify-between gap-2 hover:text-primary transition"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-muted/60">User Message</p>
            <span className="text-lg">{expanded ? '−' : '+'}</span>
          </button>
          {expanded && <p className="mt-3 text-sm leading-relaxed text-muted italic">&quot;{intake.userMessage}&quot;</p>}
        </div>
      </div>
    </div>
  );
}
