import { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import { useLanguage } from '../context/LanguageContext';
import { ApiError, apiJson } from '../utils/api';
import { getStoredAuthRole, isDoctorLikeRole } from '../utils/auth';

type ComplaintStatus = 'NEW' | 'REVIEWED';
type AuthRole = 'USER' | 'DOCTOR';

type ComplaintItem = {
  id: string;
  reporter_user_id: string;
  reporter_role: AuthRole;
  subject: string | null;
  text: string;
  status: ComplaintStatus;
  created_at: string;
};

export default function ComplaintPage() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const role = getStoredAuthRole();
  const [subject, setSubject] = useState('');
  const [text, setText] = useState('');
  const [items, setItems] = useState<ComplaintItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const navItems = useMemo(
    () => [
      { labelKey: 'nav.dashboard', href: isDoctorLikeRole(role) ? '/doctor-dashboard' : '/dashboard' },
      { labelKey: 'nav.complaints', href: '/complaints' },
      { labelKey: 'nav.about', href: '/about' },
    ],
    [role]
  );

  const loadComplaints = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const payload = await apiJson<ComplaintItem[]>(
        '/complaints/my',
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

  const submitComplaint = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedText = text.trim();
    if (normalizedText.length < 5) {
      setErrorMessage(isAr ? 'اكتب الشكوى (5 أحرف على الأقل).' : 'Please enter at least 5 characters.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      await apiJson<ComplaintItem>(
        '/complaints',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: subject.trim() || null,
            text: normalizedText,
          }),
        },
        true,
        isAr ? 'تعذر إرسال الشكوى' : 'Failed to submit complaint'
      );
      setSubject('');
      setText('');
      setStatusMessage(isAr ? 'تم إرسال الشكوى بنجاح.' : 'Complaint submitted successfully.');
      await loadComplaints();
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        setErrorMessage(isAr ? 'هذه الصفحة متاحة للمستخدمين والأطباء فقط.' : 'This page is only for users and doctors.');
      } else {
        setErrorMessage(error instanceof Error ? error.message : isAr ? 'تعذر إرسال الشكوى' : 'Failed to submit complaint');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/30 via-white to-white text-textMain">
      <Header brandHref="/complaints" navItems={navItems} />
      <main className="section-shell py-8">
        <section className="rounded-hero border border-borderGray bg-white p-6 shadow-card">
          <h1 className="text-2xl font-black text-textMain">{isAr ? 'إرسال شكوى' : 'Submit Complaint'}</h1>
          <p className="mt-2 text-sm text-muted">
            {isAr
              ? 'يمكنك إرسال شكوى للإدارة. ستظهر تفاصيل المرسل ونص الشكوى عند الإدارة.'
              : 'Send your complaint to admin. Admin will see your role and complaint text.'}
          </p>

          <form onSubmit={submitComplaint} className="mt-5 space-y-3">
            <label className="block text-sm font-semibold text-textMain">
              {isAr ? 'الموضوع (اختياري)' : 'Subject (optional)'}
              <input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                maxLength={255}
                className="mt-1 h-11 w-full rounded-xl border border-borderGray px-3 text-sm"
              />
            </label>
            <label className="block text-sm font-semibold text-textMain">
              {isAr ? 'نص الشكوى' : 'Complaint Text'}
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                minLength={5}
                rows={6}
                className="mt-1 w-full rounded-xl border border-borderGray px-3 py-2 text-sm"
                required
              />
            </label>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-primary px-5 py-2 text-sm font-bold text-white transition hover:bg-primaryDark disabled:opacity-60"
            >
              {isSubmitting ? (isAr ? 'جارٍ الإرسال...' : 'Submitting...') : isAr ? 'إرسال الشكوى' : 'Submit Complaint'}
            </button>
          </form>

          {statusMessage && <p className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{statusMessage}</p>}
          {errorMessage && <p className="mt-3 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">{errorMessage}</p>}
        </section>

        <section className="mt-6 rounded-hero border border-borderGray bg-white p-6 shadow-card">
          <h2 className="text-xl font-black text-textMain">{isAr ? 'شكاويي' : 'My Complaints'}</h2>
          {isLoading ? (
            <p className="mt-4 text-sm text-muted">{isAr ? 'جاري التحميل...' : 'Loading...'}</p>
          ) : items.length === 0 ? (
            <p className="mt-4 text-sm text-muted">{isAr ? 'لا توجد شكاوى بعد.' : 'No complaints yet.'}</p>
          ) : (
            <div className="mt-4 space-y-3">
              {items.map((item) => (
                <article key={item.id} className="rounded-xl border border-borderGray bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-bold text-textMain">{item.subject || (isAr ? 'بدون عنوان' : 'No subject')}</p>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.status === 'REVIEWED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-textMain whitespace-pre-wrap">{item.text}</p>
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
