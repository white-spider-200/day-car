import { useMemo, useState } from 'react';

export type AvailabilitySlotStatus = 'available' | 'booked' | 'unavailable';

export type AvailabilitySlot = {
  time: string;
  status: AvailabilitySlotStatus;
};

type AvailabilityInputSlot = string | AvailabilitySlot;

export type AvailabilitySlotSelection = {
  day: string;
  time: string;
};

type AvailabilitySectionProps = {
  weeklyAvailability: Record<string, AvailabilityInputSlot[]>;
  onSlotSelect?: (selection: AvailabilitySlotSelection) => void;
  selectedSlotKeys?: string[];
};

export default function AvailabilitySection({ weeklyAvailability, onSlotSelect, selectedSlotKeys }: AvailabilitySectionProps) {
  const [selectedSlot, setSelectedSlot] = useState('Thu-18:00');

  const dayEntries = useMemo(() => {
    const normalized = Object.entries(weeklyAvailability).map(([day, slots]) => {
      const mapped = slots.map((slot) => {
        if (typeof slot === 'string') {
          return { time: slot, status: 'available' as const };
        }
        return slot;
      });
      return [day, mapped] as const;
    });

    const maxSlots = Math.max(0, ...normalized.map(([, slots]) => slots.length));
    return normalized.map(([day, slots]) => {
      const padded: AvailabilitySlot[] = [...slots];
      while (padded.length < maxSlots) {
        padded.push({ time: '--:--', status: 'unavailable' });
      }
      return [day, padded] as const;
    });
  }, [weeklyAvailability]);

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
                  const slotKey = `${day}-${slot.time}`;
                  const isSelected = selectedSlotKeys ? selectedSlotKeys.includes(slotKey) : selectedSlot === slotKey;
                  const isUnavailable = slot.status === 'unavailable';
                  const isBooked = slot.status === 'booked';
                  const isAvailable = slot.status === 'available';

                  return (
                    <button
                      key={slotKey}
                      type="button"
                      onClick={() => {
                        if (isUnavailable || isBooked) {
                          return;
                        }
                        if (!selectedSlotKeys) {
                          setSelectedSlot(slotKey);
                        }
                        onSlotSelect?.({ day, time: slot.time });
                      }}
                      disabled={isUnavailable || isBooked}
                      className={`focus-outline w-full rounded-xl border px-2 py-1.5 text-xs font-semibold transition ${
                        isUnavailable
                          ? 'cursor-not-allowed border-slate-300 bg-slate-200 text-slate-500'
                          : isBooked
                            ? 'cursor-not-allowed border-red-500 bg-red-500 text-white'
                            : isSelected
                              ? 'border-emerald-600 bg-emerald-500 text-white'
                              : isAvailable
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'border-borderGray bg-white text-muted'
                      }`}
                    >
                      {slot.time}
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
