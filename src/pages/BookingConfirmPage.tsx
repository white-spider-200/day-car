import { useMemo, useState } from 'react';
import Header from '../components/Header';
import { useLanguage } from '../context/LanguageContext';
import { services } from '../data/doctorProfileData';
import { ApiError, apiJson, fetchFirstReachable } from '../utils/api';
import { getStoredAuthRole, getStoredAuthToken, navigateTo } from '../utils/auth';

type PackageSessions = 1 | 2 | 3 | 4 | 5 | 6;

const PAYMENT_METHODS = ['STRIPE'] as const;
type PaymentMethod = (typeof PAYMENT_METHODS)[number];
const SESSION_FORMATS = ['TEXT', 'VOICE', 'VIDEO', 'VR'] as const;
type SessionFormat = (typeof SESSION_FORMATS)[number];

function formatJod(value: number): string {
  return `${value.toFixed(2)} JOD`;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function buildSessionPrices(basePrice: number, sessions: PackageSessions): number[] {
  const rateFactor = 0.8;
  const prices: number[] = [];
  let current = basePrice;

  for (let index = 0; index < sessions; index += 1) {
    prices.push(roundMoney(current));
    current *= rateFactor;
  }
  return prices;
}

function parsePackageSessions(value: string | null): PackageSessions {
  const parsed = Number(value);
  if (parsed >= 1 && parsed <= 6) {
    return parsed as PackageSessions;
  }
  return 1;
}

function toBackendStartAt(localDateTime: string): string {
  const trimmed = localDateTime.trim();
  if (!trimmed) {
    return '';
  }
  if (/[zZ]|[+\-]\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed}:00+03:00`;
  }
  return trimmed;
}

function parseSlotStarts(value: string | null): string[] {
  if (!value) {
    return [];
  }
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseDoctorPreferences(value: string | null): string[] {
  if (!value) {
    return [];
  }
  return value
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function BookingConfirmPage() {
  const { isRtl } = useLanguage();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('STRIPE');
  const [sessionFormat, setSessionFormat] = useState<SessionFormat>('VIDEO');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVrWarningModal, setShowVrWarningModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const query = new URLSearchParams(window.location.search);
  const serviceId = query.get('service') ?? '';
  const date = query.get('date') ?? '';
  const time = query.get('time') ?? '';
  const doctorUserIdFromQuery = query.get('doctor_user_id') ?? '';
  const doctorSlugFromQuery = query.get('doctor_slug') ?? '';
  const slotStartsFromQuery = parseSlotStarts(query.get('slot_starts'));
  const doctorPreferences = parseDoctorPreferences(query.get('doctor_preferences'));
  const packageSessions = parsePackageSessions(query.get('package_sessions'));

  const selectedService = useMemo(() => services.find((item) => item.id === serviceId) ?? services[0], [serviceId]);

  const basePrice = Number(selectedService.price.replace(/[^\d.]/g, '')) || 0;
  const sessionPrices = useMemo(
    () => buildSessionPrices(basePrice, packageSessions),
    [basePrice, packageSessions]
  );
  const originalSessionsTotal = useMemo(() => roundMoney(basePrice * packageSessions), [basePrice, packageSessions]);
  const discountedSessionsTotal = useMemo(
    () => roundMoney(sessionPrices.reduce((sum, value) => sum + value, 0)),
    [sessionPrices]
  );
  const sessionsSavings = useMemo(
    () => roundMoney(originalSessionsTotal - discountedSessionsTotal),
    [discountedSessionsTotal, originalSessionsTotal]
  );
  const total = useMemo(() => roundMoney(discountedSessionsTotal), [discountedSessionsTotal]);
  const selectedSlots = useMemo(() => {
    if (slotStartsFromQuery.length > 0) {
      return slotStartsFromQuery;
    }
    if (date && time) {
      return [`${date}T${time}`];
    }
    return [];
  }, [date, slotStartsFromQuery, time]);

  const proceedWithPayment = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (selectedSlots.length < packageSessions) {
      setErrorMessage(
        isRtl
          ? `يرجى اختيار ${packageSessions} مواعيد في صفحة التوفر أولاً.`
          : `Please select ${packageSessions} slots in Availability first.`
      );
      return;
    }

    const token = getStoredAuthToken();
    const role = getStoredAuthRole();
    if (!token || role !== 'USER') {
      navigateTo('/login');
      return;
    }

    setIsSubmitting(true);
    try {
      let doctorUserId = doctorUserIdFromQuery || '';
      if (!doctorUserId && doctorSlugFromQuery) {
        const bySlugResponse = await fetchFirstReachable(`/doctors/slug/${encodeURIComponent(doctorSlugFromQuery)}`);
        if (bySlugResponse.ok) {
          const bySlug = (await bySlugResponse.json()) as { doctor_user_id?: string } | null;
          doctorUserId = bySlug?.doctor_user_id ?? '';
        }
      }
      if (!doctorUserId) {
        const topDoctorResponse = await fetchFirstReachable('/doctors/top');
        if (!topDoctorResponse.ok) {
          throw new Error(isRtl ? 'تعذر تحميل بيانات الطبيب.' : 'Failed to load doctor details.');
        }
        const topDoctor = (await topDoctorResponse.json()) as { doctor_user_id?: string } | null;
        doctorUserId = topDoctor?.doctor_user_id ?? '';
      }
      if (!doctorUserId) {
        throw new Error(isRtl ? 'لم يتم العثور على طبيب متاح للحجز.' : 'No bookable doctor was found.');
      }

      const slotsToBook = selectedSlots.slice(0, packageSessions);
      const appointmentIds: string[] = [];
      for (const slot of slotsToBook) {
        const startAt = toBackendStartAt(slot);
        const appointment = await apiJson<{ id: string }>(
          '/appointments/request',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              doctor_user_id: doctorUserId,
              start_at: startAt,
              timezone: 'Asia/Amman'
            })
          },
          true,
          'Failed to create appointment'
        );
        appointmentIds.push(appointment.id);
      }

      const firstAppointmentId = appointmentIds[0];
      if (!firstAppointmentId) {
        throw new Error(isRtl ? 'تعذر إنشاء المواعيد المحددة.' : 'Failed to create selected appointments.');
      }

      const paymentInit = await apiJson<{ payment: { id: string }; checkout_url: string }>(
        '/payments',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appointment_id: firstAppointmentId,
            method: paymentMethod,
            package_sessions: packageSessions
          })
        },
        true,
        'Failed to initialize payment'
      );

      if (!paymentInit.checkout_url) {
        throw new Error(isRtl ? 'تعذر إنشاء رابط الدفع.' : 'Failed to create Stripe checkout link.');
      }

      setSuccessMessage(
        isRtl
          ? 'تم تجهيز جلسة الدفع عبر Stripe. سيتم تحويلك الآن.'
          : 'Stripe checkout is ready. Redirecting now.'
      );
      window.location.assign(paymentInit.checkout_url);
      return;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        navigateTo('/login');
        return;
      }
      setErrorMessage(error instanceof Error ? error.message : (isRtl ? 'حدث خطأ أثناء الدفع.' : 'Payment failed.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayNow = () => {
    if (sessionFormat === 'VR') {
      setShowVrWarningModal(true);
      return;
    }
    void proceedWithPayment();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/40 via-white to-white text-textMain">
      <Header />

      <main className="section-shell py-8">
        <div className="mx-auto max-w-5xl">
          <button
            type="button"
            onClick={() => navigateTo('/doctor-profile')}
            className="focus-outline mb-4 rounded-lg border border-borderGray bg-white px-3 py-1.5 text-xs font-semibold text-textMain transition hover:border-primary/40 hover:text-primary"
          >
            {isRtl ? 'العودة لصفحة الطبيب' : 'Back to doctor profile'}
          </button>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-2xl border border-borderGray bg-white p-5 shadow-soft sm:p-6">
              <h1 className="text-xl font-black text-textMain">{isRtl ? 'تأكيد الحجز' : 'Confirm Booking'}</h1>
              <p className="mt-2 text-sm text-muted">
                {isRtl ? 'راجع التفاصيل ثم أكمل الدفع.' : 'Review details, then complete payment.'}
              </p>

              <div className="mt-4 space-y-3 rounded-xl border border-borderGray bg-slate-50 p-4 text-sm">
                <p><span className="font-bold text-textMain">{isRtl ? 'الخدمة:' : 'Service:'}</span> {selectedService.name}</p>
                <p>
                  <span className="font-bold text-textMain">{isRtl ? 'تفضيلات الطبيب:' : 'Doctor preferences:'}</span>{' '}
                  {doctorPreferences.length > 0 ? doctorPreferences.join(' • ') : 'Not specified'}
                </p>
                <p><span className="font-bold text-textMain">{isRtl ? 'عدد المواعيد المختارة:' : 'Selected appointments:'}</span> {selectedSlots.length}</p>
                {selectedSlots.length > 0 ? (
                  <ul className="space-y-1">
                    {selectedSlots.map((slot) => (
                      <li key={slot} className="text-textMain">
                        {slot}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <>
                    <p><span className="font-bold text-textMain">{isRtl ? 'التاريخ:' : 'Date:'}</span> {date || '-'}</p>
                    <p><span className="font-bold text-textMain">{isRtl ? 'الوقت:' : 'Time:'}</span> {time || '-'}</p>
                  </>
                )}
              </div>

            </section>

            <section className="rounded-2xl border border-borderGray bg-white p-5 shadow-soft sm:p-6">
              <h2 className="text-lg font-black text-textMain">{isRtl ? 'الدفع' : 'Payment'}</h2>

              <div className="mt-4 space-y-2 rounded-xl border border-borderGray bg-slate-50 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted">{isRtl ? 'عدد الجلسات المختار' : 'Selected sessions'}</span>
                  <span className="font-semibold text-textMain">
                    {packageSessions} {isRtl ? 'جلسات' : packageSessions === 1 ? 'Session' : 'Sessions'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">{isRtl ? 'سعر الجلسة الأساسية' : 'Base session price'}</span>
                  <span className="font-semibold text-textMain">{formatJod(basePrice)}</span>
                </div>
                {packageSessions > 1 && (
                  <>
                    <div className="border-t border-borderGray pt-2">
                      <p className="text-xs font-bold uppercase tracking-wide text-muted">
                        {isRtl ? 'خصم 20% لكل جلسة تالية' : '20% discount for each next session'}
                      </p>
                    </div>
                    {sessionPrices.map((price, index) => (
                      <div key={`session-price-${index + 1}`} className="flex items-center justify-between">
                        <span className="text-muted">
                          {isRtl ? `الجلسة ${index + 1}` : `Session ${index + 1}`}
                        </span>
                        <span className="font-semibold text-textMain">{formatJod(price)}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between">
                      <span className="text-muted">{isRtl ? 'توفير على الجلسات' : 'Session savings'}</span>
                      <span className="font-semibold text-emerald-700">- {formatJod(sessionsSavings)}</span>
                    </div>
                  </>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted">{isRtl ? 'إجمالي الجلسات بعد الخصم' : 'Discounted sessions total'}</span>
                  <span className="font-semibold text-textMain">{formatJod(discountedSessionsTotal)}</span>
                </div>
                <div className="mt-2 border-t border-borderGray pt-2 flex items-center justify-between">
                  <span className="font-bold text-textMain">{isRtl ? 'الإجمالي' : 'Total'}</span>
                  <span className="text-base font-black text-primary">{formatJod(total)}</span>
                </div>
              </div>

              <p className="mt-4 text-xs font-bold uppercase tracking-wide text-muted">
                {isRtl ? 'طرق الدفع' : 'Payment methods'}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      paymentMethod === method
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-borderGray bg-white text-textMain hover:border-primary/30'
                    }`}
                  >
                    {method === 'STRIPE' ? 'Stripe Checkout' : method}
                  </button>
                ))}
              </div>
              <p className="mt-3 rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-sm text-sky-800">
                {isRtl
                  ? 'سيتم تحويلك إلى Stripe لإتمام الدفع بشكل آمن. قد تظهر Apple Pay أو البطاقات حسب جهازك وإعدادات Stripe.'
                  : 'You will be redirected to Stripe Checkout to complete payment securely. Apple Pay or cards may appear there depending on your device and Stripe setup.'}
              </p>

              <p className="mt-4 text-xs font-bold uppercase tracking-wide text-muted">
                {isRtl ? 'نوع الجلسة' : 'Session format'}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {SESSION_FORMATS.map((format) => (
                  <button
                    key={format}
                    type="button"
                    onClick={() => setSessionFormat(format)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      sessionFormat === format
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-borderGray bg-white text-textMain hover:border-primary/30'
                    }`}
                  >
                    {format === 'VR' ? (isRtl ? 'VR (مكالمة فيديو + واقع افتراضي)' : 'VR (Video talk + VR)') : format}
                  </button>
                ))}
              </div>
              {sessionFormat === 'VR' ? (
                <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  {isRtl
                    ? 'تنبيه: جلسات VR لها تجربة خاصة. عند الضغط على التأكيد سيظهر تحذير نهائي للمتابعة.'
                    : 'Warning: VR sessions use a special flow. A final warning will appear when you confirm.'}
                </p>
              ) : null}

              {errorMessage ? (
                <p className="mt-4 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">{errorMessage}</p>
              ) : null}
              {successMessage ? (
                <p className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{successMessage}</p>
              ) : null}

              <button
                type="button"
                onClick={handlePayNow}
                disabled={isSubmitting}
                className="focus-outline mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primaryDark shadow-lg shadow-primary/20"
              >
                {isSubmitting ? (isRtl ? 'جارٍ المعالجة...' : 'Processing...') : (isRtl ? 'ادفع الآن' : 'Pay now')}
              </button>
            </section>
          </div>
        </div>
      </main>

      {showVrWarningModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-borderGray bg-white p-5 shadow-2xl sm:p-6">
            <h3 className="text-lg font-black text-textMain">
              {isRtl ? 'تأكيد نوع الجلسة' : 'Confirm Session Type'}
            </h3>
            <p className="mt-3 text-sm leading-7 text-muted">
              {isRtl
                ? 'لقد اخترت جلسة VR (مكالمة فيديو مع واقع افتراضي). سيتم تنفيذ الحجز والدفع وفق مسار جلسات الواقع الافتراضي. هل ترغب في المتابعة؟'
                : 'You selected a VR session (Video talk with VR). Booking and payment will continue using the VR session flow. Do you want to proceed?'}
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowVrWarningModal(false)}
                className="focus-outline rounded-lg border border-borderGray bg-white px-4 py-2 text-sm font-semibold text-textMain transition hover:border-primary/30"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowVrWarningModal(false);
                  void proceedWithPayment();
                }}
                className="focus-outline rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primaryDark"
              >
                {isRtl ? 'موافق، متابعة' : 'OK, Proceed'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
