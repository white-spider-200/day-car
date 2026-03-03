import { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import MessageCenter from '../components/MessageCenter';
import { apiJson } from '../utils/api';
import { navigateTo } from '../utils/auth';

type DoctorAppointment = {
  id: string;
  user_id: string;
};

export default function DoctorChatsPage() {
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setErrorMessage(null);
        const payload = await apiJson<DoctorAppointment[]>(
          '/doctor/appointments',
          undefined,
          true,
          'Failed to load appointment users'
        );
        setAppointments(payload);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load appointment users');
      }
    }

    void load();
  }, []);

  const appointmentPatientIds = useMemo(
    () => Array.from(new Set(appointments.map((item) => item.user_id))),
    [appointments]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/30 via-white to-white text-textMain">
      <Header
        brandHref="/doctor-dashboard"
        navItems={[
          { labelKey: 'nav.dashboard', href: '/doctor-dashboard' },
          { labelKey: 'nav.doctors', href: '/home#featured-doctors' },
          { labelKey: 'nav.about', href: '/about' }
        ]}
      />

      <main className="section-shell py-6 sm:py-8">
        <section className="rounded-hero border border-borderGray bg-white p-4 shadow-card sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h1 className="text-2xl font-black tracking-tight text-textMain">Doctor Chats</h1>
            <button
              type="button"
              onClick={() => navigateTo('/doctor-dashboard')}
              className="rounded-lg border border-borderGray bg-white px-3 py-1.5 text-xs font-semibold text-textMain transition hover:border-primary/40 hover:text-primary"
            >
              Back to Dashboard
            </button>
          </div>

          {errorMessage && (
            <p className="mb-4 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">{errorMessage}</p>
          )}

          <MessageCenter title="" allowedPartnerIds={appointmentPatientIds} className="!rounded-xl !border-0 !bg-transparent !p-0 !shadow-none" />
        </section>
      </main>
    </div>
  );
}
