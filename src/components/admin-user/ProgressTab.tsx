import { UserTreatmentPlan } from '../../data/userProfileData';

type ProgressTabProps = {
  treatmentPlan: UserTreatmentPlan;
};

export default function ProgressTab({ treatmentPlan }: ProgressTabProps) {
  const completedGoals = treatmentPlan.goals.filter((g) => g.completed).length;
  const totalGoals = treatmentPlan.goals.length;
  const overallProgress = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  const statusStyles = {
    active: { bg: '#ecfdf5', text: '#10b981', label: '🔄 Active' },
    completed: { bg: '#ecfdf5', text: '#10b981', label: '✓ Completed' },
    paused: { bg: '#fffbeb', text: '#f59e0b', label: '⏸ Paused' }
  };

  const status = statusStyles[treatmentPlan.status];

  return (
    <div className="space-y-6">
      {/* Treatment Plan Status & Doctor */}
      <div className="rounded-lg border border-borderGray bg-primaryBg/30 p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted/60 mb-1">Status</p>
            <div
              className="inline-flex px-3 py-1 rounded-lg text-sm font-bold"
              style={{
                backgroundColor: status.bg,
                color: status.text
              }}
            >
              {status.label}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted/60 mb-1">Assigned Doctor</p>
            <p className="text-sm font-semibold text-primary">{treatmentPlan.assignedDoctorName}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted/60 mb-1">Start Date</p>
            <p className="text-sm font-semibold text-textMain">{new Date(treatmentPlan.startDate).toLocaleDateString()}</p>
          </div>
          {treatmentPlan.expectedEndDate && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted/60 mb-1">Expected End</p>
              <p className="text-sm font-semibold text-textMain">
                {new Date(treatmentPlan.expectedEndDate).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Overall Progress */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-base font-bold text-textMain">Overall Progress</h4>
          <span className="text-sm font-bold text-primary">
            {completedGoals} / {totalGoals} goals
          </span>
        </div>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <div className="h-3 rounded-full bg-borderGray overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primaryDark transition-all"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
          <span className="text-lg font-bold text-primary w-12 text-right">{overallProgress}%</span>
        </div>
      </div>

      {/* Goals List */}
      {treatmentPlan.goals.length > 0 && (
        <div>
          <h4 className="text-base font-bold text-textMain mb-4">Treatment Goals</h4>
          <div className="space-y-4">
            {treatmentPlan.goals.map((goal) => (
              <div
                key={goal.id}
                className="rounded-lg border border-borderGray bg-white p-4 hover:shadow-soft transition"
              >
                <div className="flex items-start gap-3 mb-3">
                  <input
                    type="checkbox"
                    checked={goal.completed}
                    readOnly
                    className="mt-1 h-5 w-5 rounded accent-primary cursor-pointer"
                  />
                  <div className="flex-1">
                    <h5 className={`font-semibold ${goal.completed ? 'line-through text-muted' : 'text-textMain'}`}>
                      {goal.title}
                    </h5>
                    <p className="mt-1 text-sm text-muted">{goal.description}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="ml-8">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex-1">
                      <div className="h-2 rounded-full bg-borderGray overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            goal.completed
                              ? 'bg-emerald-500'
                              : 'bg-gradient-to-r from-primary to-primaryDark'
                          }`}
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                    </div>
                    <span className="ml-3 text-xs font-bold text-primary">{goal.progress}%</span>
                  </div>
                </div>

                {goal.targetDate && (
                  <p className="ml-8 mt-2 text-xs text-muted">
                    Target: {new Date(goal.targetDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress Notes */}
      {treatmentPlan.progressNotes && (
        <div>
          <h4 className="text-base font-bold text-textMain mb-3">Progress Notes</h4>
          <div className="rounded-lg bg-primaryBg/30 border border-borderGray p-4">
            <p className="text-sm leading-relaxed text-muted">{treatmentPlan.progressNotes}</p>
          </div>
        </div>
      )}

      {/* No Goals */}
      {treatmentPlan.goals.length === 0 && (
        <div className="rounded-lg bg-primaryBg/30 p-8 text-center">
          <p className="text-sm font-semibold text-muted">No treatment goals set yet</p>
        </div>
      )}
    </div>
  );
}
