import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import type { ServiceItem, SimilarDoctor } from '../../data/doctorProfileData';

type QuickBookingSidebarProps = {
  services: ServiceItem[];
  similarDoctors: SimilarDoctor[];
};

const quickTimes = ['10:30', '12:00', '14:30', '18:00'];

export default function QuickBookingSidebar({ services, similarDoctors }: QuickBookingSidebarProps) {
  const { t } = useLanguage();
  const [selectedService, setSelectedService] = useState(services[0]?.id ?? '');
  const [selectedDate, setSelectedDate] = useState('2026-02-26');
  const [selectedTime, setSelectedTime] = useState(quickTimes[0]);

  return (
    <div className="space-y-4 lg:sticky lg:top-40">
      <aside className="rounded-hero border border-borderGray bg-white p-5 shadow-soft sm:p-6" aria-label="Quick booking">
        <h2 className="text-lg font-bold text-textMain">{t('booking.quick')}</h2>

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">{t('booking.service')}</span>
            <select
              value={selectedService}
              onChange={(event) => setSelectedService(event.target.value)}
              className="focus-outline h-11 w-full rounded-xl border border-borderGray bg-white px-3 text-sm text-textMain"
            >
              {services.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} • {item.price}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">{t('booking.date')}</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="focus-outline h-11 w-full rounded-xl border border-borderGray bg-white px-3 text-sm text-textMain"
            />
          </label>

          <fieldset>
            <legend className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted">{t('booking.time')}</legend>
            <div className="grid grid-cols-2 gap-2">
              {quickTimes.map((time) => {
                const isSelected = selectedTime === time;

                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setSelectedTime(time)}
                    className={`focus-outline h-10 rounded-xl border text-sm font-semibold transition ${
                      isSelected
                        ? 'border-primary bg-primary text-white'
                        : 'border-borderGray bg-white text-muted hover:border-primary/30 hover:text-primary'
                    }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <button
            type="button"
            className="focus-outline inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primaryDark shadow-lg shadow-primary/20"
          >
            {t('booking.continue')}
          </button>

          <div className="flex flex-wrap gap-2 pt-1">
            {['Verified', 'Secure', 'Private'].map((item) => (
              <span key={item} className="rounded-full border border-borderGray bg-slate-50 px-3 py-1 text-xs font-medium text-muted">
                {item}
              </span>
            ))}
          </div>
        </div>
      </aside>

      <aside className="rounded-card border border-borderGray bg-white p-5 shadow-card" aria-label="Similar doctors">
        <h2 className="text-base font-bold text-textMain">{t('booking.similar')}</h2>

        <ul className="mt-3 space-y-3">
          {similarDoctors.map((doctor) => (
            <li key={doctor.id}>
              <a
                href="#"
                className="focus-outline flex items-center gap-3 rounded-xl border border-borderGray p-3 transition hover:-translate-y-0.5 hover:border-primary/30"
              >
                {doctor.photo && (
                  <img
                    src={doctor.photo}
                    alt={doctor.name}
                    className="h-12 w-12 flex-none rounded-lg object-cover"
                  />
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-textMain">{doctor.name}</p>
                  <p className="mt-0.5 truncate text-[11px] text-muted">{doctor.title}</p>
                  <p className="mt-1 text-xs font-semibold text-textMain">⭐ {doctor.rating.toFixed(1)}</p>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
