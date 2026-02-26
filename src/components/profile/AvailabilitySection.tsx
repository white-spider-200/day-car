import { useMemo, useState } from 'react';

type AvailabilitySectionProps = {
  weeklyAvailability: Record<string, string[]>;
};

export default function AvailabilitySection({ weeklyAvailability }: AvailabilitySectionProps) {
  const [selectedSlot, setSelectedSlot] = useState('Thu-18:00');

  const dayEntries = useMemo(() => Object.entries(weeklyAvailability), [weeklyAvailability]);

  return (
    <section className="rounded-card border border-borderGray bg-white p-5 shadow-card sm:p-6" aria-labelledby="availability-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="availability-heading" className="text-xl font-bold text-textMain">
          Availability
        </h2>
        <p className="text-xs font-medium text-muted sm:text-sm">Times shown in Jordan (GMT+3)</p>
      </div>

      <div className="mt-5 overflow-x-auto">
        <div className="grid min-w-[620px] grid-cols-7 gap-3 lg:min-w-0">
          {dayEntries.map(([day, slots]) => (
            <article key={day} className="rounded-2xl border border-borderGray bg-slate-50/60 p-3">
              <h3 className="text-sm font-semibold text-textMain">{day}</h3>
              <div className="mt-3 space-y-2">
                {slots.map((slot) => {
                  const slotKey = `${day}-${slot}`;
                  const isSelected = selectedSlot === slotKey;

                  return (
                    <button
                      key={slotKey}
                      type="button"
                      onClick={() => setSelectedSlot(slotKey)}
                      className={`focus-outline w-full rounded-xl border px-2 py-1.5 text-xs font-semibold transition ${
                        isSelected
                          ? 'border-primary bg-primary text-white'
                          : 'border-borderGray bg-white text-muted hover:border-primary/30 hover:text-primary'
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
