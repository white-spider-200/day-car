import { useMemo, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';
import { ApiError, apiJson } from '../utils/api';

type SubmitResponse = {
  id: string;
  status: string;
  message: string;
};

type DayKey = 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';

type DaySlot = {
  day: DayKey;
  enabled: boolean;
  start: string;
  end: string;
};

const SPECIALTIES = ['Psychiatrist', 'Therapist', 'Counselor', 'Psychologist', 'Family Therapist', 'Child Therapist'];
const DAY_ORDER: Array<{ day: DayKey; en: string; ar: string }> = [
  { day: 'SUNDAY', en: 'Sunday', ar: 'الأحد' },
  { day: 'MONDAY', en: 'Monday', ar: 'الاثنين' },
  { day: 'TUESDAY', en: 'Tuesday', ar: 'الثلاثاء' },
  { day: 'WEDNESDAY', en: 'Wednesday', ar: 'الأربعاء' },
  { day: 'THURSDAY', en: 'Thursday', ar: 'الخميس' },
  { day: 'FRIDAY', en: 'Friday', ar: 'الجمعة' },
  { day: 'SATURDAY', en: 'Saturday', ar: 'السبت' }
];

function splitCSV(input: string): string[] {
  return input
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function ApplyDoctorPage() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    nationalId: '',
    licenseNumber: '',
    experienceYears: '',
    specialty: SPECIALTIES[0],
    subSpecialties: '',
    languages: isAr ? 'العربية, English' : 'Arabic, English',
    location: '',
    onlineAvailable: true,
    fee: '',
    shortBio: '',
    about: ''
  });
  const [days, setDays] = useState<DaySlot[]>(
    DAY_ORDER.map((item) => ({
      day: item.day,
      enabled: item.day !== 'FRIDAY',
      start: '09:00',
      end: '17:00'
    }))
  );
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [licenseDocument, setLicenseDocument] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const copy = useMemo(
    () =>
      isAr
        ? {
            title: 'التقديم كطبيب',
            subtitle: 'املأ البيانات التالية وسيتواصل فريق صابينا معك بعد مراجعة الطلب.',
            submit: 'إرسال الطلب',
            sending: 'جاري الإرسال...',
            personalInfo: 'المعلومات الشخصية',
            professionalInfo: 'المعلومات المهنية',
            scheduleInfo: 'جدول التوفر الأسبوعي',
            fullName: 'الاسم الكامل',
            email: 'البريد الإلكتروني',
            phone: 'رقم الهاتف',
            profilePhoto: 'صورة الملف الشخصي',
            nationalId: 'الرقم الوطني (اختياري)',
            licenseNumber: 'رقم الترخيص الطبي',
            experienceYears: 'سنوات الخبرة',
            specialty: 'التخصص',
            subSpecialties: 'التخصصات الفرعية (مفصولة بفاصلة)',
            languages: 'اللغات (مفصولة بفاصلة)',
            location: 'مدينة العيادة',
            onlineAvailable: 'متاح أونلاين؟',
            consultationFee: 'رسوم الاستشارة',
            shortBio: 'نبذة مختصرة',
            about: 'حول الطبيب (تفاصيل)',
            licenseDocument: 'وثيقة الترخيص (PDF أو صورة)',
            yes: 'نعم',
            no: 'لا',
            requiredSchedule: 'اختر يوم توفر واحد على الأقل.',
            requiredLicenseFile: 'وثيقة الترخيص مطلوبة.',
            successFallback: 'تم إرسال طلبك بنجاح. طلبك قيد المراجعة.'
          }
        : {
            title: 'Apply as a Doctor',
            subtitle: 'Submit your details below. The Sabina team will review your application.',
            submit: 'Submit Application',
            sending: 'Submitting...',
            personalInfo: 'Personal Information',
            professionalInfo: 'Professional Information',
            scheduleInfo: 'Weekly Availability',
            fullName: 'Full Name',
            email: 'Email',
            phone: 'Phone Number',
            profilePhoto: 'Profile Photo',
            nationalId: 'National ID (optional)',
            licenseNumber: 'Medical License Number',
            experienceYears: 'Years of Experience',
            specialty: 'Specialty',
            subSpecialties: 'Sub-specialties (comma separated)',
            languages: 'Languages (comma separated)',
            location: 'Clinic City',
            onlineAvailable: 'Available Online?',
            consultationFee: 'Consultation Fee',
            shortBio: 'Short Bio',
            about: 'Detailed About Section',
            licenseDocument: 'License Document (PDF or image)',
            yes: 'Yes',
            no: 'No',
            requiredSchedule: 'Select at least one available day.',
            requiredLicenseFile: 'License document is required.',
            successFallback: 'Your application is under review.'
          },
    [isAr]
  );

  const setField = (key: keyof typeof form, value: string | boolean) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const setDayValue = (day: DayKey, key: 'enabled' | 'start' | 'end', value: boolean | string) => {
    setDays((previous) =>
      previous.map((item) => {
        if (item.day !== day) {
          return item;
        }
        return { ...item, [key]: value };
      })
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const activeSchedule = days
      .filter((item) => item.enabled)
      .map((item) => ({ day: item.day, start: item.start, end: item.end }));

    if (activeSchedule.length === 0) {
      setErrorMessage(copy.requiredSchedule);
      return;
    }
    if (!licenseDocument) {
      setErrorMessage(copy.requiredLicenseFile);
      return;
    }

    const formData = new FormData();
    formData.set('full_name', form.fullName.trim());
    formData.set('email', form.email.trim().toLowerCase());
    formData.set('phone', form.phone.trim());
    if (form.nationalId.trim()) {
      formData.set('national_id', form.nationalId.trim());
    }
    formData.set('license_number', form.licenseNumber.trim());
    formData.set('experience_years', form.experienceYears.trim());
    formData.set('specialty', form.specialty);
    splitCSV(form.subSpecialties).forEach((item) => formData.append('sub_specialties', item));
    splitCSV(form.languages).forEach((item) => formData.append('languages', item));
    formData.set('location', form.location.trim());
    formData.set('online_available', form.onlineAvailable ? 'true' : 'false');
    formData.set('fee', form.fee.trim());
    formData.set('short_bio', form.shortBio.trim());
    if (form.about.trim()) {
      formData.set('about', form.about.trim());
    }
    formData.set('schedule', JSON.stringify(activeSchedule));
    if (profilePhoto) {
      formData.set('photo', profilePhoto);
    }
    formData.set('license_document', licenseDocument);

    setIsSubmitting(true);
    try {
      const payload = await apiJson<SubmitResponse>(
        '/doctor-applications',
        {
          method: 'POST',
          body: formData
        },
        false,
        isAr ? 'فشل إرسال الطلب' : 'Failed to submit application'
      );
      setSuccessMessage(payload.message || copy.successFallback);
      setForm({
        fullName: '',
        email: '',
        phone: '',
        nationalId: '',
        licenseNumber: '',
        experienceYears: '',
        specialty: SPECIALTIES[0],
        subSpecialties: '',
        languages: isAr ? 'العربية, English' : 'Arabic, English',
        location: '',
        onlineAvailable: true,
        fee: '',
        shortBio: '',
        about: ''
      });
      setProfilePhoto(null);
      setLicenseDocument(null);
      setDays(
        DAY_ORDER.map((item) => ({
          day: item.day,
          enabled: item.day !== 'FRIDAY',
          start: '09:00',
          end: '17:00'
        }))
      );
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(error instanceof Error ? error.message : isAr ? 'فشل إرسال الطلب' : 'Submission failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 via-white to-cyan-50/40 text-textMain">
      <Header
        brandHref="/home"
        navItems={[
          { labelKey: 'nav.doctors', href: '/home#featured-doctors' },
          { labelKey: 'nav.forDoctors', href: '/apply-doctor' },
          { labelKey: 'nav.about', href: '/about' }
        ]}
      />

      <main className="section-shell py-8 sm:py-10">
        <section className="rounded-hero border border-cyan-100 bg-white p-6 shadow-card sm:p-8">
          <h1 className="text-3xl font-black tracking-tight text-textMain sm:text-4xl">{copy.title}</h1>
          <p className="mt-3 max-w-3xl text-sm text-muted sm:text-base">{copy.subtitle}</p>
        </section>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <section className="rounded-hero border border-cyan-100 bg-white p-6 shadow-card sm:p-8">
            <h2 className="text-xl font-black text-textMain">{copy.personalInfo}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-semibold text-textMain">
                {copy.fullName}
                <input
                  required
                  value={form.fullName}
                  onChange={(event) => setField('fullName', event.target.value)}
                  className="rounded-xl border border-borderGray bg-white px-4 py-3 text-sm"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-textMain">
                {copy.email}
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) => setField('email', event.target.value)}
                  className="rounded-xl border border-borderGray bg-white px-4 py-3 text-sm"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-textMain">
                {copy.phone}
                <input
                  required
                  value={form.phone}
                  onChange={(event) => setField('phone', event.target.value)}
                  className="rounded-xl border border-borderGray bg-white px-4 py-3 text-sm"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-textMain">
                {copy.nationalId}
                <input
                  value={form.nationalId}
                  onChange={(event) => setField('nationalId', event.target.value)}
                  className="rounded-xl border border-borderGray bg-white px-4 py-3 text-sm"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-textMain">
                {copy.profilePhoto}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => setProfilePhoto(event.target.files?.[0] ?? null)}
                  className="rounded-xl border border-borderGray bg-white px-3 py-2 text-sm"
                />
              </label>
            </div>
          </section>

          <section className="rounded-hero border border-cyan-100 bg-white p-6 shadow-card sm:p-8">
            <h2 className="text-xl font-black text-textMain">{copy.professionalInfo}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-semibold text-textMain">
                {copy.licenseNumber}
                <input
                  required
                  value={form.licenseNumber}
                  onChange={(event) => setField('licenseNumber', event.target.value)}
                  className="rounded-xl border border-borderGray bg-white px-4 py-3 text-sm"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-textMain">
                {copy.experienceYears}
                <input
                  required
                  min={0}
                  max={80}
                  type="number"
                  value={form.experienceYears}
                  onChange={(event) => setField('experienceYears', event.target.value)}
                  className="rounded-xl border border-borderGray bg-white px-4 py-3 text-sm"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-textMain">
                {copy.specialty}
                <select
                  value={form.specialty}
                  onChange={(event) => setField('specialty', event.target.value)}
                  className="rounded-xl border border-borderGray bg-white px-4 py-3 text-sm"
                >
                  {SPECIALTIES.map((specialty) => (
                    <option key={specialty} value={specialty}>
                      {specialty}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-textMain">
                {copy.subSpecialties}
                <input
                  value={form.subSpecialties}
                  onChange={(event) => setField('subSpecialties', event.target.value)}
                  className="rounded-xl border border-borderGray bg-white px-4 py-3 text-sm"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-textMain">
                {copy.languages}
                <input
                  required
                  value={form.languages}
                  onChange={(event) => setField('languages', event.target.value)}
                  className="rounded-xl border border-borderGray bg-white px-4 py-3 text-sm"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-textMain">
                {copy.location}
                <input
                  required
                  value={form.location}
                  onChange={(event) => setField('location', event.target.value)}
                  className="rounded-xl border border-borderGray bg-white px-4 py-3 text-sm"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-textMain">
                {copy.consultationFee}
                <input
                  required
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.fee}
                  onChange={(event) => setField('fee', event.target.value)}
                  className="rounded-xl border border-borderGray bg-white px-4 py-3 text-sm"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-textMain">
                {copy.onlineAvailable}
                <select
                  value={form.onlineAvailable ? 'yes' : 'no'}
                  onChange={(event) => setField('onlineAvailable', event.target.value === 'yes')}
                  className="rounded-xl border border-borderGray bg-white px-4 py-3 text-sm"
                >
                  <option value="yes">{copy.yes}</option>
                  <option value="no">{copy.no}</option>
                </select>
              </label>
              <label className="sm:col-span-2 flex flex-col gap-2 text-sm font-semibold text-textMain">
                {copy.shortBio}
                <textarea
                  required
                  rows={3}
                  value={form.shortBio}
                  onChange={(event) => setField('shortBio', event.target.value)}
                  className="rounded-xl border border-borderGray bg-white px-4 py-3 text-sm"
                />
              </label>
              <label className="sm:col-span-2 flex flex-col gap-2 text-sm font-semibold text-textMain">
                {copy.about}
                <textarea
                  rows={6}
                  value={form.about}
                  onChange={(event) => setField('about', event.target.value)}
                  className="rounded-xl border border-borderGray bg-white px-4 py-3 text-sm"
                />
              </label>
              <label className="sm:col-span-2 flex flex-col gap-2 text-sm font-semibold text-textMain">
                {copy.licenseDocument}
                <input
                  required
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/webp"
                  onChange={(event) => setLicenseDocument(event.target.files?.[0] ?? null)}
                  className="rounded-xl border border-borderGray bg-white px-3 py-2 text-sm"
                />
              </label>
            </div>
          </section>

          <section className="rounded-hero border border-cyan-100 bg-white p-6 shadow-card sm:p-8">
            <h2 className="text-xl font-black text-textMain">{copy.scheduleInfo}</h2>
            <div className="mt-4 grid gap-3">
              {DAY_ORDER.map((item) => {
                const value = days.find((row) => row.day === item.day);
                if (!value) {
                  return null;
                }
                return (
                  <div key={item.day} className="grid gap-3 rounded-xl border border-borderGray bg-slate-50 p-3 sm:grid-cols-[1.2fr_1fr_1fr] sm:items-center">
                    <label className="flex items-center gap-2 text-sm font-semibold text-textMain">
                      <input
                        type="checkbox"
                        checked={value.enabled}
                        onChange={(event) => setDayValue(item.day, 'enabled', event.target.checked)}
                      />
                      {isAr ? item.ar : item.en}
                    </label>
                    <input
                      type="time"
                      disabled={!value.enabled}
                      value={value.start}
                      onChange={(event) => setDayValue(item.day, 'start', event.target.value)}
                      className="rounded-lg border border-borderGray bg-white px-3 py-2 text-sm disabled:opacity-50"
                    />
                    <input
                      type="time"
                      disabled={!value.enabled}
                      value={value.end}
                      onChange={(event) => setDayValue(item.day, 'end', event.target.value)}
                      className="rounded-lg border border-borderGray bg-white px-3 py-2 text-sm disabled:opacity-50"
                    />
                  </div>
                );
              })}
            </div>
          </section>

          {errorMessage && (
            <p className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</p>
          )}
          {successMessage && (
            <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</p>
          )}

          <div className="pb-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-12 items-center justify-center rounded-xl bg-teal-600 px-6 text-sm font-bold text-white transition hover:bg-teal-700 disabled:opacity-60"
            >
              {isSubmitting ? copy.sending : copy.submit}
            </button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}
