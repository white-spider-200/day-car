import { useMemo, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

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
  onRemoveRule: (ruleId: string) => Promise<void> | void;
};

const DAYS: Array<{ label: string; value: number }> = [
  { label: 'Mon', value: 0 },
  { label: 'Tue', value: 1 },
  { label: 'Wed', value: 2 },
  { label: 'Thu', value: 3 },
  { label: 'Fri', value: 4 },
  { label: 'Sat', value: 5 },
  { label: 'Sun', value: 6 },
];

function toMinutes(timeValue: string): number {
  const [hours = '0', minutes = '0'] = timeValue.split(':');
  return Number(hours) * 60 + Number(minutes);
}

function formatRuleTime(timeValue: string): string {
  return timeValue.slice(0, 5);
}

export default function AvailabilityCalendarBoard({ rules, onAddRule, onRemoveRule }: AvailabilityCalendarBoardProps) {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const [dayOfWeek, setDayOfWeek] = useState<number>(0);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [isBlocked, setIsBlocked] = useState(false);
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(50);
  const [bufferMinutes, setBufferMinutes] = useState(10);
  const [validationError, setValidationError] = useState<string | null>(null);

  const groupedRules = useMemo(() => {
    const map = new Map<number, AvailabilityRuleItem[]>();
    for (const item of rules) {
      const existing = map.get(item.day_of_week) ?? [];
      existing.push(item);
      existing.sort((a, b) => toMinutes(a.start_time) - toMinutes(b.start_time));
      map.set(item.day_of_week, existing);
    }
    return map;
  }, [rules]);

  return (
    <div className="rounded-xl border border-borderGray bg-slate-50 p-4">
      <h3 className="text-sm font-bold text-textMain">{isAr ? 'محرر التقويم' : 'Calendar Editor'}</h3>
      <p className="mt-1 text-xs text-muted">
        {isAr ? 'أضف أوقات التوفر أو الحظر لكل يوم في الأسبوع.' : 'Click-add availability or blocked windows per weekday.'}
      </p>
      {validationError && (
        <p className="mt-2 rounded-lg border border-rose-100 bg-rose-50 px-2 py-1 text-xs text-rose-700">{validationError}</p>
      )}

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-semibold text-muted">
          {isAr ? 'اليوم' : 'Day'}
          <select
            value={dayOfWeek}
            onChange={(event) => setDayOfWeek(Number(event.target.value))}
            className="mt-1 w-full rounded-lg border border-borderGray bg-white px-2 py-1.5 text-sm text-textMain"
          >
            {DAYS.map((item) => (
              <option key={item.label} value={item.value}>
                {isAr
                  ? ({ Mon: 'الاثنين', Tue: 'الثلاثاء', Wed: 'الأربعاء', Thu: 'الخميس', Fri: 'الجمعة', Sat: 'السبت', Sun: 'الأحد' } as Record<string, string>)[item.label]
                  : item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-muted">
          {isAr ? 'من' : 'Start'}
          <input
            type="time"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            className="mt-1 w-full rounded-lg border border-borderGray bg-white px-2 py-1.5 text-sm text-textMain"
          />
        </label>
        <label className="text-xs font-semibold text-muted">
          {isAr ? 'إلى' : 'End'}
          <input
            type="time"
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
            className="mt-1 w-full rounded-lg border border-borderGray bg-white px-2 py-1.5 text-sm text-textMain"
          />
        </label>
        <label className="text-xs font-semibold text-muted">
          {isAr ? 'مدة الجلسة (دقيقة)' : 'Slot Minutes'}
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
          {isAr ? 'الفاصل (دقيقة)' : 'Buffer Minutes'}
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
          {isAr ? 'حظر هذه الفترة' : 'Block this window'}
        </label>
        <div className="pt-4">
          <button
            type="button"
            onClick={() => {
              const startMinutes = toMinutes(startTime);
              const endMinutes = toMinutes(endTime);
              const dayRules = groupedRules.get(dayOfWeek) ?? [];

              if (endMinutes <= startMinutes) {
                setValidationError(isAr ? 'وقت النهاية يجب أن يكون بعد وقت البداية.' : 'End time must be later than start time.');
                return;
              }
              if (slotDurationMinutes < 10 || slotDurationMinutes > 240) {
                setValidationError(isAr ? 'مدة الجلسة يجب أن تكون بين 10 و240 دقيقة.' : 'Slot minutes must be between 10 and 240.');
                return;
              }
              if (bufferMinutes < 0 || bufferMinutes > 120) {
                setValidationError(isAr ? 'الفاصل يجب أن يكون بين 0 و120 دقيقة.' : 'Buffer minutes must be between 0 and 120.');
                return;
              }
              if (slotDurationMinutes > endMinutes - startMinutes) {
                setValidationError(isAr ? 'مدة الجلسة لا يمكن أن تكون أطول من الفترة المحددة.' : 'Slot duration cannot be longer than the selected time window.');
                return;
              }

              const hasOverlap = dayRules.some((rule) => {
                const ruleStart = toMinutes(rule.start_time);
                const ruleEnd = toMinutes(rule.end_time);
                return startMinutes < ruleEnd && endMinutes > ruleStart;
              });
              if (hasOverlap) {
                setValidationError(isAr ? 'هذا الوقت يتداخل مع قاعدة موجودة في نفس اليوم.' : 'This time overlaps with an existing rule on the same day.');
                return;
              }

              setValidationError(null);
              void onAddRule({
                day_of_week: dayOfWeek,
                start_time: `${startTime}:00`,
                end_time: `${endTime}:00`,
                is_blocked: isBlocked,
                timezone: 'Asia/Amman',
                slot_duration_minutes: slotDurationMinutes,
                buffer_minutes: bufferMinutes
              });
            }}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primaryDark"
          >
            {isAr ? 'إضافة إلى التقويم' : 'Add to Calendar'}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {DAYS.map((item) => {
          const dayRules = groupedRules.get(item.value) ?? [];
          return (
            <article key={item.label} className="rounded-lg border border-borderGray bg-white p-3">
              <h4 className="text-xs font-bold uppercase tracking-wide text-textMain">
                {isAr
                  ? ({ Mon: 'الاثنين', Tue: 'الثلاثاء', Wed: 'الأربعاء', Thu: 'الخميس', Fri: 'الجمعة', Sat: 'السبت', Sun: 'الأحد' } as Record<string, string>)[item.label]
                  : item.label}
              </h4>
              {dayRules.length === 0 ? (
                <p className="mt-2 text-xs text-muted">{isAr ? 'لا توجد قواعد' : 'No rules'}</p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {dayRules.map((rule) => (
                    <li key={rule.id} className="flex items-center justify-between gap-2 rounded-md border border-borderGray bg-slate-50 px-2 py-1 text-xs text-muted">
                      <span>
                        {formatRuleTime(rule.start_time)} - {formatRuleTime(rule.end_time)} • {rule.is_blocked ? (isAr ? 'محظور' : 'Blocked') : (isAr ? 'متاح' : 'Available')}
                      </span>
                      <button
                        type="button"
                        onClick={() => void onRemoveRule(rule.id)}
                        className="rounded border border-rose-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 transition hover:bg-rose-50"
                      >
                        {isAr ? 'حذف' : 'Remove'}
                      </button>
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
