import { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import MessageCenter from '../components/MessageCenter';
import { apiJson } from '../utils/api';
import { navigateTo } from '../utils/auth';

type DoctorAppointment = {
  id: string;
  user_id: string;
  patient_name?: string | null;
};

type TreatmentRequestStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';
type TreatmentRequest = {
  id: string;
  user_id: string;
  status: TreatmentRequestStatus;
};
type MessageItem = {
  id: string;
  sender_user_id: string;
  receiver_user_id: string;
};

export default function DoctorChatsPage() {
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [treatmentRequests, setTreatmentRequests] = useState<TreatmentRequest[]>([]);
  const [inboxMessages, setInboxMessages] = useState<MessageItem[]>([]);
  const [outboxMessages, setOutboxMessages] = useState<MessageItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setErrorMessage(null);
        const [appointmentPayload, requestPayload, inboxPayload, outboxPayload] = await Promise.all([
          apiJson<DoctorAppointment[]>(
            '/doctor/appointments',
            undefined,
            true,
            'Failed to load appointment users'
          ),
          apiJson<TreatmentRequest[]>(
            '/doctor/treatment-requests',
            undefined,
            true,
            'Failed to load treatment requests'
          ),
          apiJson<MessageItem[]>(
            '/messages?box=inbox',
            undefined,
            true,
            'Failed to load inbox messages'
          ),
          apiJson<MessageItem[]>(
            '/messages?box=outbox',
            undefined,
            true,
            'Failed to load outbox messages'
          ),
        ]);
        setAppointments(appointmentPayload);
        setTreatmentRequests(requestPayload);
        setInboxMessages(inboxPayload);
        setOutboxMessages(outboxPayload);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load chat users');
      }
    }

    void load();
  }, []);

  const appointmentPatientIds = useMemo(() => new Set(appointments.map((item) => item.user_id)), [appointments]);
  const acceptedRequestPatientIds = useMemo(
    () => new Set(treatmentRequests.filter((item) => item.status === 'ACCEPTED').map((item) => item.user_id)),
    [treatmentRequests]
  );
  const messagePartnerIds = useMemo(() => {
    const ids = new Set<string>();
    for (const item of inboxMessages) ids.add(item.sender_user_id);
    for (const item of outboxMessages) ids.add(item.receiver_user_id);
    return ids;
  }, [inboxMessages, outboxMessages]);
  const allowedPartnerIds = useMemo(
    () => Array.from(new Set([...appointmentPatientIds, ...acceptedRequestPatientIds, ...messagePartnerIds])),
    [appointmentPatientIds, acceptedRequestPatientIds, messagePartnerIds]
  );
  const partnerNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const appointment of appointments) {
      if (!map[appointment.user_id]) {
        map[appointment.user_id] = appointment.patient_name?.trim() || `Patient ${appointment.user_id.slice(0, 8)}`;
      }
    }
    return map;
  }, [appointments]);

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

          <MessageCenter
            title=""
            allowedPartnerIds={allowedPartnerIds}
            partnerNames={partnerNames}
            className="!rounded-xl !border-0 !bg-transparent !p-0 !shadow-none"
          />
        </section>
      </main>
    </div>
  );
}
