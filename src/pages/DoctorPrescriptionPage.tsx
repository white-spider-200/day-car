import { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import { apiJson, getBackendOrigin } from '../utils/api';
import { navigateTo } from '../utils/auth';

type PatientProfile = {
  id: string;
  name: string | null;
  age: number | null;
  country: string | null;
};

type PrescriptionResponse = {
  id: string;
  user_id: string;
  medication_name: string;
  dosage: string;
  instructions: string;
  quantity: string;
  issued_at: string;
  valid_until: string | null;
  pdf_url: string;
  verification_url: string;
  verification_qr_data_url: string;
};

function toAbsoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${getBackendOrigin()}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`;
}

export default function DoctorPrescriptionPage() {
  const queryUserId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('user_id') ?? '';
  }, []);

  const [userId, setUserId] = useState(queryUserId);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [medicationName, setMedicationName] = useState('');
  const [dosage, setDosage] = useState('');
  const [instructions, setInstructions] = useState('');
  const [quantity, setQuantity] = useState('');
  const [validDays, setValidDays] = useState('30');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [created, setCreated] = useState<PrescriptionResponse | null>(null);

  useEffect(() => {
    const loadPatient = async () => {
      if (!userId) return;
      try {
        const profile = await apiJson<PatientProfile>(`/doctor/patients/${userId}/profile`, undefined, true, 'Failed to load patient profile');
        setPatientProfile(profile);
      } catch {
        setPatientProfile(null);
      }
    };
    void loadPatient();
  }, [userId]);

  const submitPrescription = async () => {
    setErrorMessage(null);
    setCreated(null);
    if (!userId.trim()) {
      setErrorMessage('Patient user ID is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = await apiJson<PrescriptionResponse>(
        '/doctor/prescriptions',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId.trim(),
            medication_name: medicationName.trim(),
            dosage: dosage.trim(),
            instructions: instructions.trim(),
            quantity: quantity.trim(),
            valid_days: Number(validDays),
          }),
        },
        true,
        'Failed to create prescription',
      );
      setCreated(payload);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create prescription');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/30 via-white to-white text-textMain">
      <Header
        brandHref="/doctor-dashboard"
        navItems={[
          { labelKey: 'nav.dashboard', href: '/doctor-dashboard' },
          { labelKey: 'nav.about', href: '/about' },
        ]}
      />

      <main className="section-shell py-8">
        <section className="rounded-hero border border-borderGray bg-white p-6 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-black text-textMain">Create Medicine Description + Prescription</h1>
            <button
              type="button"
              onClick={() => navigateTo('/doctor-dashboard')}
              className="rounded-lg border border-borderGray px-3 py-2 text-xs font-semibold text-textMain transition hover:border-primary/40 hover:text-primary"
            >
              Back
            </button>
          </div>

          {errorMessage && <p className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p>}

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-muted">Patient User ID</span>
              <input value={userId} onChange={(e) => setUserId(e.target.value)} className="mt-1 w-full rounded-lg border border-borderGray px-3 py-2 text-sm" />
            </label>
            <div className="rounded-lg border border-borderGray bg-slate-50 px-3 py-2 text-sm">
              <p className="text-xs font-black uppercase tracking-wide text-muted">Patient Info</p>
              <p className="mt-1">{patientProfile ? `${patientProfile.name ?? 'N/A'} • Age ${patientProfile.age ?? 'N/A'} • ${patientProfile.country ?? 'N/A'}` : 'Not loaded'}</p>
            </div>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-muted">Medicine Name</span>
              <input
                value={medicationName}
                onChange={(e) => setMedicationName(e.target.value)}
                placeholder="Example: Sertraline"
                className="mt-1 w-full rounded-lg border border-borderGray px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-muted">Dosage</span>
              <input
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="Example: 50mg once daily after food"
                className="mt-1 w-full rounded-lg border border-borderGray px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-muted">Quantity</span>
              <input
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Example: 30 tablets"
                className="mt-1 w-full rounded-lg border border-borderGray px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-muted">Valid Days</span>
              <input type="number" min={1} max={365} value={validDays} onChange={(e) => setValidDays(e.target.value)} className="mt-1 w-full rounded-lg border border-borderGray px-3 py-2 text-sm" />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-black uppercase tracking-wide text-muted">Medicine Description / Doctor Notes</span>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={4}
                placeholder="Write full description for pharmacy and patient: timing, duration, warnings..."
                className="mt-1 w-full rounded-lg border border-borderGray px-3 py-2 text-sm"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={() => void submitPrescription()}
            disabled={isSubmitting}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primaryDark disabled:opacity-60"
          >
            {isSubmitting ? 'Creating...' : 'Create Prescription PDF + QR'}
          </button>
          <p className="mt-3 text-xs text-muted">
            QR code is embedded in the PDF and links to the verification page so pharmacy can confirm doctor, patient, and medicine details.
          </p>
        </section>

        {created && (
          <section className="mt-6 rounded-hero border border-borderGray bg-white p-6 shadow-card">
            <h2 className="text-xl font-black text-textMain">Prescription Created</h2>
            <p className="mt-2 text-sm text-muted">ID: {created.id}</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <a href={toAbsoluteUrl(created.pdf_url)} target="_blank" rel="noreferrer" className="rounded-lg border border-borderGray px-3 py-2 text-xs font-semibold text-textMain hover:border-primary/40 hover:text-primary">
                Open PDF
              </a>
              <a href={created.verification_url} target="_blank" rel="noreferrer" className="rounded-lg border border-borderGray px-3 py-2 text-xs font-semibold text-textMain hover:border-primary/40 hover:text-primary">
                Open Verify Page
              </a>
            </div>
            <div className="mt-4 rounded-xl border border-borderGray bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-muted">Pharmacy QR</p>
              <img src={created.verification_qr_data_url} alt="Prescription verification QR" className="mt-2 h-44 w-44 rounded-lg border border-borderGray bg-white p-2" />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
