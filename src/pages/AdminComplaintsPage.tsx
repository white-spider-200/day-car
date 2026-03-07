import { useEffect, useState } from 'react';
import Header from '../components/Header';
import { useLanguage } from '../context/LanguageContext';
import { apiJson } from '../utils/api';

type ComplaintStatus = 'NEW' | 'REVIEWED';
type ReporterRole = 'USER' | 'DOCTOR';

type AdminComplaint = {
  id: string;
  reporter_user_id: string;
  reporter_role: ReporterRole;
  reporter_email: string | null;
  reporter_name: string | null;
  subject: string | null;
  text: string;
  status: ComplaintStatus;
  created_at: string;
};

export default function AdminComplaintsPage() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const [items, setItems] = useState<AdminComplaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadComplaints = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const payload = await apiJson<AdminComplaint[]>(
        '/admin/complaints',
        undefined,
        true,
        isAr ? 'تعذر تحميل الشكاوى' : 'Failed to load complaints'
      );
      setItems(payload);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : isAr ? 'تعذر تحميل الشكاوى' : 'Failed to load complaints');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadComplaints();
  }, []);

  const markReviewed = async (complaintId: string) => {
    setBusyId(complaintId);
    setErrorMessage(null);
    try {
      await apiJson(
        `/admin/complaints/${complaintId}/reviewed`,
        { method: 'PATCH' },
        true,
        isAr ? 'تعذر تحديث الشكوى' : 'Failed to update complaint'
      );
      setItems((previous) =>
        previous.map((item) => (item.id === complaintId ? { ...item, status: 'REVIEWED' } : item))
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : isAr ? 'تعذر تحديث الشكوى' : 'Failed to update complaint');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/30 via-white to-white text-textMain">
      <Header
        brandHref="/admin/complaints"
        navItems={[
          { labelKey: 'nav.dashboard', href: '/admin/applications' },
          { labelKey: 'nav.users', href: '/admin/users' },
          { labelKey: 'nav.complaints', href: '/admin/complaints' },
        ]}
      />

      <main className="section-shell py-8">
        <section className="rounded-hero border border-borderGray bg-white p-6 shadow-card">
          <h1 className="text-2xl font-black text-textMain">{isAr ? 'شكاوى المستخدمين والأطباء' : 'User & Doctor Complaints'}</h1>
          <p className="mt-2 text-sm text-muted">
            {isAr ? 'يعرض نوع المرسل (مستخدم/طبيب) وهوية المرسل ونص الشكوى.' : 'Shows sender type (user/doctor), sender identity, and complaint text.'}
          </p>

          {errorMessage && (
            <p className="mt-4 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">{errorMessage}</p>
          )}

          {isLoading ? (
            <p className="mt-4 text-sm text-muted">{isAr ? 'جاري التحميل...' : 'Loading...'}</p>
          ) : items.length === 0 ? (
            <p className="mt-4 text-sm text-muted">{isAr ? 'لا توجد شكاوى.' : 'No complaints found.'}</p>
          ) : (
            <div className="mt-5 space-y-3">
              {items.map((item) => (
                <article key={item.id} className="rounded-xl border border-borderGray bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-textMain">{item.subject || (isAr ? 'بدون عنوان' : 'No subject')}</p>
                      <p className="mt-1 text-xs text-muted">
                        {isAr ? 'الدور' : 'Role'}: <span className="font-semibold">{item.reporter_role}</span> • {isAr ? 'البريد' : 'Email'}:{' '}
                        <span className="font-semibold">{item.reporter_email ?? 'N/A'}</span>
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {isAr ? 'الاسم' : 'Name'}: <span className="font-semibold">{item.reporter_name ?? 'N/A'}</span> • ID: {item.reporter_user_id}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.status === 'REVIEWED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {item.status}
                      </span>
                      {item.status === 'NEW' && (
                        <button
                          type="button"
                          onClick={() => void markReviewed(item.id)}
                          disabled={busyId === item.id}
                          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primaryDark disabled:opacity-60"
                        >
                          {busyId === item.id ? (isAr ? '...' : '...') : isAr ? 'تمت المراجعة' : 'Mark Reviewed'}
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-textMain whitespace-pre-wrap">{item.text}</p>
                  <p className="mt-2 text-xs text-muted">{new Date(item.created_at).toLocaleString()}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
