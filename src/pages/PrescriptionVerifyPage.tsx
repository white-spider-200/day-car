import { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import { apiJson, getBackendOrigin } from '../utils/api';

type VerifyPayload = {
  prescription_id: string;
  is_valid: boolean;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  issued_at: string;
  valid_until: string | null;
  doctor: { id: string; name: string | null; email: string | null };
  patient: { id: string; name: string | null; email: string | null };
  medication: { name: string; dosage: string; instructions: string; quantity: string };
  data_hash: string;
  pdf_url: string;
};

function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${getBackendOrigin()}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`;
}

export default function PrescriptionVerifyPage() {
  const prescriptionId = useMemo(() => {
    const path = window.location.pathname;
    const parts = path.split('/').filter(Boolean);
    return parts[parts.length - 1] ?? '';
  }, []);
  const code = useMemo(() => new URLSearchParams(window.location.search).get('code') ?? '', []);

  const [payload, setPayload] = useState<VerifyPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiJson<VerifyPayload>(
          `/prescriptions/verify/${prescriptionId}?code=${encodeURIComponent(code)}`,
          undefined,
          false,
          'Failed to verify prescription',
        );
        setPayload(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to verify prescription');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [prescriptionId, code]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/30 via-white to-white text-textMain">
      <Header brandHref="/home" navItems={[{ labelKey: 'nav.home', href: '/home' }, { labelKey: 'nav.about', href: '/about' }]} />
      <main className="section-shell py-8">
        <section className="rounded-hero border border-borderGray bg-white p-6 shadow-card">
          <h1 className="text-2xl font-black text-textMain">Prescription Verification</h1>

          {loading && <p className="mt-4 text-sm text-muted">Verifying...</p>}
          {error && <p className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

          {!loading && payload && (
            <div className="mt-4 space-y-4">
              <div className={`rounded-xl border px-4 py-3 text-sm font-bold ${payload.is_valid ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                {payload.is_valid ? 'Valid prescription from verified doctor.' : 'Verification failed or prescription is not valid.'}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <article className="rounded-lg border border-borderGray bg-slate-50 p-3">
                  <p className="text-xs font-black uppercase tracking-wide text-muted">Doctor</p>
                  <p className="mt-1 text-sm">{payload.doctor.name ?? 'N/A'}</p>
                  <p className="mt-1 text-xs text-muted">{payload.doctor.email ?? 'N/A'}</p>
                </article>
                <article className="rounded-lg border border-borderGray bg-slate-50 p-3">
                  <p className="text-xs font-black uppercase tracking-wide text-muted">Patient</p>
                  <p className="mt-1 text-sm">{payload.patient.name ?? 'N/A'}</p>
                  <p className="mt-1 text-xs text-muted">{payload.patient.email ?? 'N/A'}</p>
                </article>
              </div>

              <article className="rounded-lg border border-borderGray bg-slate-50 p-3">
                <p className="text-xs font-black uppercase tracking-wide text-muted">Medication</p>
                <p className="mt-1 text-sm">Name: {payload.medication.name}</p>
                <p className="mt-1 text-sm">Dosage: {payload.medication.dosage}</p>
                <p className="mt-1 text-sm">Quantity: {payload.medication.quantity}</p>
                <p className="mt-1 text-sm whitespace-pre-wrap">Instructions: {payload.medication.instructions}</p>
              </article>

              <article className="rounded-lg border border-borderGray bg-slate-50 p-3">
                <p className="text-xs font-black uppercase tracking-wide text-muted">Integrity</p>
                <p className="mt-1 text-xs text-muted break-all">Hash: {payload.data_hash}</p>
                <p className="mt-1 text-xs text-muted">Issued: {new Date(payload.issued_at).toLocaleString()}</p>
                <p className="mt-1 text-xs text-muted">Valid until: {payload.valid_until ? new Date(payload.valid_until).toLocaleString() : 'N/A'}</p>
              </article>

              <a href={absoluteUrl(payload.pdf_url)} target="_blank" rel="noreferrer" className="inline-flex rounded-lg border border-borderGray px-3 py-2 text-xs font-semibold text-textMain hover:border-primary/40 hover:text-primary">
                Open PDF Copy
              </a>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

