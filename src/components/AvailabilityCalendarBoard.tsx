import { useMemo, useState } from 'react';

type AvailabilityRuleItem = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_blocked: boolean;
  timezone: string;
};

type AvailabilityCalendarBoardProps = {
  rules: AvailabilityRuleItem[];
  onAddRule: (input: {
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_blocked: boolean;
    timezone: string;
    slot_duration_minutes: number;
    buffer_minutes: number;
  }) => Promise<void> | void;
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AvailabilityCalendarBoard({ rules, onAddRule }: AvailabilityCalendarBoardProps) {
  const [dayOfWeek, setDayOfWeek] = useState(0);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [isBlocked, setIsBlocked] = useState(false);
  const [timezone, setTimezone] = useState('Asia/Amman');
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(50);
  const [bufferMinutes, setBufferMinutes] = useState(10);

  const groupedRules = useMemo(() => {
    const map = new Map<number, AvailabilityRuleItem[]>();
    for (const item of rules) {
      const existing = map.get(item.day_of_week) ?? [];
      existing.push(item);
      map.set(item.day_of_week, existing);
    }
    return map;
  }, [rules]);

  return (
    <div className="rounded-xl border border-borderGray bg-slate-50 p-4">
      <h3 className="text-sm font-bold text-textMain">Calendar Editor</h3>
      <p className="mt-1 text-xs text-muted">Click-add availability or blocked windows per weekday.</p>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-semibold text-muted">
          Day
          <select
            value={dayOfWeek}
            onChange={(event) => setDayOfWeek(Number(event.target.value))}
            className="mt-1 w-full rounded-lg border border-borderGray bg-white px-2 py-1.5 text-sm text-textMain"
          >
            {DAYS.map((label, index) => (
              <option key={label} value={index}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-muted">
          Start
          <input
            type="time"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            className="mt-1 w-full rounded-lg border border-borderGray bg-white px-2 py-1.5 text-sm text-textMain"
          />
        </label>
        <label className="text-xs font-semibold text-muted">
          End
          <input
            type="time"
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
            className="mt-1 w-full rounded-lg border border-borderGray bg-white px-2 py-1.5 text-sm text-textMain"
          />
        </label>
        <label className="text-xs font-semibold text-muted">
          Timezone
          <input
            value={timezone}
            onChange={(event) => setTimezone(event.target.value)}
            className="mt-1 w-full rounded-lg border border-borderGray bg-white px-2 py-1.5 text-sm text-textMain"
          />
        </label>
        <label className="text-xs font-semibold text-muted">
          Slot Minutes
          <input
            type="number"
            min={10}
            max={240}
            value={slotDurationMinutes}
            onChange={(event) => setSlotDurationMinutes(Number(event.target.value))}
            className="mt-1 w-full rounded-lg border border-borderGray bg-white px-2 py-1.5 text-sm text-textMain"
          />
        </label>
        <label className="text-xs font-semibold text-muted">
          Buffer Minutes
          <input
            type="number"
            min={0}
            max={120}
            value={bufferMinutes}
            onChange={(event) => setBufferMinutes(Number(event.target.value))}
            className="mt-1 w-full rounded-lg border border-borderGray bg-white px-2 py-1.5 text-sm text-textMain"
          />
        </label>
        <label className="inline-flex items-center gap-2 pt-5 text-xs font-semibold text-muted">
          <input
            type="checkbox"
            checked={isBlocked}
            onChange={(event) => setIsBlocked(event.target.checked)}
          />
          Block this window
        </label>
        <div className="pt-4">
          <button
            type="button"
            onClick={() => {
              void onAddRule({
                day_of_week: dayOfWeek,
                start_time: `${startTime}:00`,
                end_time: `${endTime}:00`,
                is_blocked: isBlocked,
                timezone,
                slot_duration_minutes: slotDurationMinutes,
                buffer_minutes: bufferMinutes
              });
            }}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primaryDark"
          >
            Add to Calendar
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {DAYS.map((label, index) => {
          const dayRules = groupedRules.get(index) ?? [];
          return (
            <article key={label} className="rounded-lg border border-borderGray bg-white p-3">
              <h4 className="text-xs font-bold uppercase tracking-wide text-textMain">{label}</h4>
              {dayRules.length === 0 ? (
                <p className="mt-2 text-xs text-muted">No rules</p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {dayRules.map((rule) => (
                    <li key={rule.id} className="text-xs text-muted">
                      {rule.start_time} - {rule.end_time} • {rule.is_blocked ? 'Blocked' : 'Available'}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
