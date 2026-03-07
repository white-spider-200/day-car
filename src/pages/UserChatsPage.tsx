import { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import MessageCenter from '../components/MessageCenter';
import { apiJson } from '../utils/api';
import { navigateTo } from '../utils/auth';

type TreatmentRequestStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

type TreatmentRequest = {
  id: string;
  doctor_id: string;
  status: TreatmentRequestStatus;
  doctor_display_name: string | null;
};
type MessageItem = {
  id: string;
  sender_user_id: string;
  receiver_user_id: string;
};

function getDoctorIdFromPath(): string | null {
  const params = new URLSearchParams(window.location.search);
  const doctorId = params.get('doctor_id');
  return doctorId?.trim() || null;
}

export default function UserChatsPage() {
  const [requests, setRequests] = useState<TreatmentRequest[]>([]);
  const [inboxMessages, setInboxMessages] = useState<MessageItem[]>([]);
  const [outboxMessages, setOutboxMessages] = useState<MessageItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(() => getDoctorIdFromPath());

  useEffect(() => {
    const onPopState = () => {
      setSelectedDoctorId(getDoctorIdFromPath());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        setErrorMessage(null);
        const [requestPayload, inboxPayload, outboxPayload] = await Promise.all([
          apiJson<TreatmentRequest[]>(
            '/treatment-requests/my',
            undefined,
            true,
            'Failed to load accepted doctors'
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
        setRequests(requestPayload);
        setInboxMessages(inboxPayload);
        setOutboxMessages(outboxPayload);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load accepted doctors');
      }
    }

    void load();
  }, []);

  const acceptedDoctors = useMemo(() => {
    const map = new Map<string, string>();
    for (const request of requests) {
      if (request.status !== 'ACCEPTED') continue;
      const name = request.doctor_display_name?.trim() || `Doctor ${request.doctor_id.slice(0, 8)}`;
      if (!map.has(request.doctor_id)) {
        map.set(request.doctor_id, name);
      }
    }
    return map;
  }, [requests]);
  const messagePartnerIds = useMemo(() => {
    const ids = new Set<string>();
    for (const message of inboxMessages) ids.add(message.sender_user_id);
    for (const message of outboxMessages) ids.add(message.receiver_user_id);
    return ids;
  }, [inboxMessages, outboxMessages]);
  const doctorDirectoryNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const request of requests) {
      if (request.doctor_display_name?.trim()) {
        map.set(request.doctor_id, request.doctor_display_name.trim());
      }
    }
    return map;
  }, [requests]);

  const allowedPartnerIds = useMemo(
    () => Array.from(new Set([...acceptedDoctors.keys(), ...messagePartnerIds])),
    [acceptedDoctors, messagePartnerIds]
  );
  const partnerNames = useMemo(() => {
    const merged = new Map<string, string>(acceptedDoctors);
    for (const partnerId of messagePartnerIds) {
      if (!merged.has(partnerId)) {
        merged.set(partnerId, doctorDirectoryNames.get(partnerId) || `Doctor ${partnerId.slice(0, 8)}`);
      }
    }
    return Object.fromEntries(merged.entries());
  }, [acceptedDoctors, messagePartnerIds, doctorDirectoryNames]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/30 via-white to-white text-textMain">
      <Header
        brandHref="/dashboard"
        navItems={[
          { labelKey: 'nav.dashboard', href: '/dashboard' },
          { labelKey: 'nav.doctors', href: '/home#featured-doctors' },
          { labelKey: 'nav.about', href: '/about' }
        ]}
      />

      <main className="section-shell py-6 sm:py-8">
        <section className="rounded-hero border border-borderGray bg-white p-4 shadow-card sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h1 className="text-2xl font-black tracking-tight text-textMain">Doctor-Patient Messages</h1>
            <button
              type="button"
              onClick={() => navigateTo('/dashboard')}
              className="rounded-lg border border-borderGray bg-white px-3 py-1.5 text-xs font-semibold text-textMain transition hover:border-primary/40 hover:text-primary"
            >
              Back to Dashboard
            </button>
          </div>

          {errorMessage && (
            <p className="mb-4 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">{errorMessage}</p>
          )}

          {allowedPartnerIds.length === 0 ? (
            <p className="mb-4 rounded-lg border border-borderGray bg-slate-50 px-3 py-2 text-sm text-muted">
              Once a doctor accepts your request, they will appear here and you can message them.
            </p>
          ) : null}

          <MessageCenter
            title=""
            allowedPartnerIds={allowedPartnerIds}
            partnerNames={partnerNames}
            initialPartnerId={selectedDoctorId}
            className="!rounded-xl !border-0 !bg-transparent !p-0 !shadow-none"
          />
        </section>
      </main>
    </div>
  );
}
