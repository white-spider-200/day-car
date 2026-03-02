import { useEffect, useMemo, useState } from 'react';
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
const PHONE_PREFIX = '+962';
const COUNTRY_OPTIONS_AR = [
  'الأردن',
  'السعودية',
  'الإمارات',
  'قطر',
  'الكويت',
  'البحرين',
  'عُمان',
  'مصر',
  'لبنان',
  'فلسطين',
  'العراق',
  'سوريا',
  'المملكة المتحدة',
  'الولايات المتحدة',
  'كندا',
  'ألمانيا',
  'فرنسا',
  'تركيا'
];

const COUNTRY_OPTIONS_EN = [
  'Jordan',
  'Saudi Arabia',
  'United Arab Emirates',
  'Qatar',
  'Kuwait',
  'Bahrain',
  'Oman',
  'Egypt',
  'Lebanon',
  'Palestine',
  'Iraq',
  'Syria',
  'United Kingdom',
  'United States',
  'Canada',
  'Germany',
  'France',
  'Turkey'
];
const SUB_SPECIALTY_SUGGESTIONS = [
  'CBT',
  'ACT',
  'DBT',
  'EMDR',
  'Trauma Therapy',
  'Anxiety',
  'Depression',
  'Stress Management',
  'Couples Therapy',
  'Family Counseling',
  'Child Therapy',
  'ADHD'
];
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
    phone: PHONE_PREFIX,
    licenseNumber: '',
    experienceYears: '',
    specialty: SPECIALTIES[0],
    subSpecialties: [] as string[],
    languages: isAr ? 'العربية, English' : 'Arabic, English',
    country: isAr ? 'الأردن' : 'Jordan',
    location: '',
    clinicName: '',
    addressLine: '',
    mapUrl: '',
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
  const [nationalIdPhoto, setNationalIdPhoto] = useState<File | null>(null);
  const [nationalIdPhotoPreviewUrl, setNationalIdPhotoPreviewUrl] = useState<string | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePhotoPreviewUrl, setProfilePhotoPreviewUrl] = useState<string | null>(null);
  const [licenseDocument, setLicenseDocument] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [subSpecialtyInput, setSubSpecialtyInput] = useState('');

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
            phoneHint: 'الصيغة المطلوبة: +962 ثم 8 أرقام على الأقل',
            nationalIdPhoto: 'صورة الهوية الوطنية',
            profilePhoto: 'صورة الملف الشخصي (ستظهر على الموقع)',
            licenseNumber: 'رقم الترخيص الطبي',
            experienceYears: 'سنوات الخبرة',
            specialty: 'التخصص',
            subSpecialties: 'التخصصات الفرعية',
            addTagHint: 'اكتب تخصصًا ثم أضفه كوسم (يمكنك كتابة تخصص غير موجود بالقائمة)',
            addTag: 'إضافة',
            languages: 'اللغات (مفصولة بفاصلة)',
            country: 'الدولة (ابحث واختر)',
            location: 'مدينة العيادة',
            clinicName: 'اسم العيادة',
            addressLine: 'عنوان العيادة التفصيلي',
            mapUrl: 'رابط خرائط Google (اختياري)',
            onlineAvailable: 'متاح أونلاين؟',
            consultationFee: 'رسوم الاستشارة',
            shortBio: 'نبذة مختصرة',
            about: 'حول الطبيب (تفاصيل)',
            licenseDocument: 'وثيقة الترخيص (PDF أو صورة)',
            yes: 'نعم',
            no: 'لا',
            requiredSchedule: 'اختر يوم توفر واحد على الأقل.',
            requiredLicenseFile: 'وثيقة الترخيص مطلوبة.',
            requiredNationalIdPhoto: 'صورة الهوية الوطنية مطلوبة.',
            requiredProfilePhoto: 'صورة الملف الشخصي مطلوبة.',
            invalidPhone: 'رقم الهاتف يجب أن يكون بالصيغة +962 ويتبعه 8 أرقام على الأقل.',
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
            phoneHint: 'Required format: +962 followed by at least 8 digits',
            nationalIdPhoto: 'National ID Photo',
            profilePhoto: 'Profile Photo (shown on website)',
            licenseNumber: 'Medical License Number',
            experienceYears: 'Years of Experience',
            specialty: 'Specialty',
            subSpecialties: 'Sub-specialties',
            addTagHint: 'Type a specialty and add it as a tag (custom values are allowed)',
            addTag: 'Add',
            languages: 'Languages (comma separated)',
            country: 'Country (search and select)',
            location: 'Clinic City',
            clinicName: 'Clinic Name',
            addressLine: 'Full Clinic Address',
            mapUrl: 'Google Maps Link (optional)',
            onlineAvailable: 'Available Online?',
            consultationFee: 'Consultation Fee',
            shortBio: 'Short Bio',
            about: 'Detailed About Section',
            licenseDocument: 'License Document (PDF or image)',
            yes: 'Yes',
            no: 'No',
            requiredSchedule: 'Select at least one available day.',
            requiredLicenseFile: 'License document is required.',
            requiredNationalIdPhoto: 'National ID photo is required.',
            requiredProfilePhoto: 'Profile photo is required.',
            invalidPhone: 'Phone must be in +962 format followed by at least 8 digits.',
            successFallback: 'Your application is under review.'
          },
    [isAr]
  );
  const countryOptions = isAr ? COUNTRY_OPTIONS_AR : COUNTRY_OPTIONS_EN;
  const fieldLabelClass = 'flex min-w-0 flex-col gap-2 text-sm font-semibold text-textMain';
  const inputClass =
    'h-11 w-full rounded-xl border border-borderGray bg-white px-4 text-sm transition focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10';
  const textareaClass =
    'w-full rounded-xl border border-borderGray bg-white px-4 py-3 text-sm transition focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10';

  const setField = (key: keyof typeof form, value: string | boolean) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const normalizePhoneInput = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '');
    const withoutCountry = digitsOnly.startsWith('962') ? digitsOnly.slice(3) : digitsOnly;
    return `${PHONE_PREFIX}${withoutCountry}`;
  };

  const addSubSpecialtyTag = (rawValue: string) => {
    const value = rawValue.trim();
    if (!value) {
      return;
    }
    setForm((previous) => {
      const exists = previous.subSpecialties.some((item) => item.toLowerCase() === value.toLowerCase());
      if (exists) {
        return previous;
      }
      return { ...previous, subSpecialties: [...previous.subSpecialties, value] };
    });
    setSubSpecialtyInput('');
  };

  const removeSubSpecialtyTag = (tag: string) => {
    setForm((previous) => ({
      ...previous,
      subSpecialties: previous.subSpecialties.filter((item) => item !== tag)
    }));
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

  useEffect(() => {
    if (!nationalIdPhoto) {
      setNationalIdPhotoPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(nationalIdPhoto);
    setNationalIdPhotoPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [nationalIdPhoto]);

  useEffect(() => {
    if (!profilePhoto) {
      setProfilePhotoPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(profilePhoto);
    setProfilePhotoPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [profilePhoto]);

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
    if (!nationalIdPhoto) {
      setErrorMessage(copy.requiredNationalIdPhoto);
      return;
    }
    if (!profilePhoto) {
      setErrorMessage(copy.requiredProfilePhoto);
      return;
    }
    if (!/^\+962\d{8,}$/.test(form.phone)) {
      setErrorMessage(copy.invalidPhone);
      return;
    }

    const formData = new FormData();
    formData.set('full_name', form.fullName.trim());
    formData.set('email', form.email.trim().toLowerCase());
    formData.set('phone', form.phone.trim());
    formData.set('license_number', form.licenseNumber.trim());
    formData.set('experience_years', form.experienceYears.trim());
    formData.set('specialty', form.specialty);
    form.subSpecialties.forEach((item) => formData.append('sub_specialties', item));
    splitCSV(form.languages).forEach((item) => formData.append('languages', item));
    const cityValue = form.location.trim();
    const countryValue = form.country.trim();
    formData.set('location', countryValue ? `${cityValue}, ${countryValue}` : cityValue);
    if (countryValue) {
      formData.set('location_country', countryValue);
    }
    if (form.clinicName.trim()) {
      formData.set('clinic_name', form.clinicName.trim());
    }
    if (form.addressLine.trim()) {
      formData.set('address_line', form.addressLine.trim());
    }
    if (form.mapUrl.trim()) {
      formData.set('map_url', form.mapUrl.trim());
    }
    formData.set('online_available', form.onlineAvailable ? 'true' : 'false');
    formData.set('fee', form.fee.trim());
    formData.set('short_bio', form.shortBio.trim());
    if (form.about.trim()) {
      formData.set('about', form.about.trim());
    }
    formData.set('schedule', JSON.stringify(activeSchedule));
    formData.set('photo', profilePhoto);
    formData.set('national_id_photo', nationalIdPhoto);
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
        phone: PHONE_PREFIX,
        licenseNumber: '',
        experienceYears: '',
        specialty: SPECIALTIES[0],
        subSpecialties: [],
        languages: isAr ? 'العربية, English' : 'Arabic, English',
        country: isAr ? 'الأردن' : 'Jordan',
        location: '',
        clinicName: '',
        addressLine: '',
        mapUrl: '',
        onlineAvailable: true,
        fee: '',
        shortBio: '',
        about: ''
      });
      setNationalIdPhoto(null);
      setProfilePhoto(null);
      setLicenseDocument(null);
      setSubSpecialtyInput('');
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
              <div className="rounded-2xl border border-borderGray bg-slate-50/60 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-textMain">{copy.nationalIdPhoto}</p>
                  {nationalIdPhoto && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">{isAr ? 'تم الرفع' : 'Uploaded'}</span>}
                </div>
                <p className="mt-1 text-xs text-muted">{isAr ? 'PNG / JPG حتى 5MB' : 'PNG / JPG up to 5MB'}</p>
                <div className="mt-3 h-40 w-full overflow-hidden rounded-xl border border-borderGray bg-white">
                  {nationalIdPhotoPreviewUrl ? (
                    <img src={nationalIdPhotoPreviewUrl} alt={isAr ? 'معاينة الهوية الوطنية' : 'National ID preview'} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted">
                      {isAr ? 'لا توجد معاينة بعد' : 'No preview yet'}
                    </div>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white transition hover:bg-primaryDark">
                    {isAr ? 'اختر صورة' : 'Choose image'}
                    <input
                      required
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(event) => setNationalIdPhoto(event.target.files?.[0] ?? null)}
                      className="hidden"
                    />
                  </label>
                  {nationalIdPhoto?.name && <span className="truncate text-xs text-muted">{nationalIdPhoto.name}</span>}
                </div>
              </div>

              <div className="rounded-2xl border border-borderGray bg-slate-50/60 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-textMain">{copy.profilePhoto}</p>
                  {profilePhoto && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">{isAr ? 'تم الرفع' : 'Uploaded'}</span>}
                </div>
                <p className="mt-1 text-xs text-muted">{isAr ? 'تُستخدم في الملف الشخصي على الموقع' : 'Used on your public website profile'}</p>
                <div className="mt-3 h-40 w-full overflow-hidden rounded-xl border border-borderGray bg-white">
                  {profilePhotoPreviewUrl ? (
                    <img src={profilePhotoPreviewUrl} alt={isAr ? 'معاينة صورة الملف الشخصي' : 'Profile photo preview'} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted">
                      {isAr ? 'لا توجد معاينة بعد' : 'No preview yet'}
                    </div>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white transition hover:bg-primaryDark">
                    {isAr ? 'اختر صورة' : 'Choose image'}
                    <input
                      required
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(event) => setProfilePhoto(event.target.files?.[0] ?? null)}
                      className="hidden"
                    />
                  </label>
                  {profilePhoto?.name && <span className="truncate text-xs text-muted">{profilePhoto.name}</span>}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className={fieldLabelClass}>
                {copy.fullName}
                <input
                  required
                  value={form.fullName}
                  onChange={(event) => setField('fullName', event.target.value)}
                  className={inputClass}
                />
              </label>
              <label className={fieldLabelClass}>
                {copy.email}
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) => setField('email', event.target.value)}
                  className={inputClass}
                />
              </label>
              <label className={fieldLabelClass}>
                {copy.phone}
                <input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(event) => setField('phone', normalizePhoneInput(event.target.value))}
                  inputMode="numeric"
                  maxLength={16}
                  placeholder={`${PHONE_PREFIX}7xxxxxxxx`}
                  className={inputClass}
                />
                <span className="text-xs font-medium text-muted">{copy.phoneHint}</span>
              </label>
            </div>
          </section>

          <section className="rounded-hero border border-cyan-100 bg-white p-6 shadow-card sm:p-8">
            <h2 className="text-xl font-black text-textMain">{copy.professionalInfo}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className={fieldLabelClass}>
                {copy.licenseNumber}
                <input
                  required
                  value={form.licenseNumber}
                  onChange={(event) => setField('licenseNumber', event.target.value)}
                  className={inputClass}
                />
              </label>
              <label className={fieldLabelClass}>
                {copy.experienceYears}
                <input
                  required
                  min={0}
                  max={80}
                  type="number"
                  value={form.experienceYears}
                  onChange={(event) => setField('experienceYears', event.target.value)}
                  className={inputClass}
                />
              </label>
              <label className={fieldLabelClass}>
                {copy.specialty}
                <select
                  value={form.specialty}
                  onChange={(event) => setField('specialty', event.target.value)}
                  className={inputClass}
                >
                  {SPECIALTIES.map((specialty) => (
                    <option key={specialty} value={specialty}>
                      {specialty}
                    </option>
                  ))}
                </select>
              </label>
              <label className={`${fieldLabelClass} sm:col-span-2`}>
                {copy.subSpecialties}
                <div className="rounded-xl border border-borderGray bg-white p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {form.subSpecialties.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primaryBg px-3 py-1 text-xs font-semibold text-primary">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeSubSpecialtyTag(tag)}
                          className="rounded-full px-1 text-primary/80 hover:bg-primary/10 hover:text-primary"
                          aria-label={isAr ? `حذف ${tag}` : `Remove ${tag}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      list="sub-specialty-suggestions"
                      value={subSpecialtyInput}
                      onChange={(event) => setSubSpecialtyInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ',') {
                          event.preventDefault();
                          addSubSpecialtyTag(subSpecialtyInput);
                        }
                      }}
                      className="h-11 flex-1 rounded-lg border border-borderGray bg-white px-3 text-sm transition focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
                      placeholder={isAr ? 'مثل: القلق، العلاج المعرفي السلوكي...' : 'e.g. Anxiety, CBT...'}
                    />
                    <button
                      type="button"
                      onClick={() => addSubSpecialtyTag(subSpecialtyInput)}
                      className="inline-flex h-10 items-center rounded-lg bg-primary px-3 text-sm font-bold text-white transition hover:bg-primaryDark"
                    >
                      {copy.addTag}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-muted">{copy.addTagHint}</p>
                  <datalist id="sub-specialty-suggestions">
                    {SUB_SPECIALTY_SUGGESTIONS.map((item) => (
                      <option key={item} value={item} />
                    ))}
                  </datalist>
                </div>
              </label>
              <label className={fieldLabelClass}>
                {copy.languages}
                <input
                  required
                  value={form.languages}
                  onChange={(event) => setField('languages', event.target.value)}
                  className={inputClass}
                />
              </label>
              <label className={fieldLabelClass}>
                {copy.country}
                <input
                  required
                  list="country-options"
                  value={form.country}
                  onChange={(event) => setField('country', event.target.value)}
                  className={inputClass}
                />
                <datalist id="country-options">
                  {countryOptions.map((country) => (
                    <option key={country} value={country} />
                  ))}
                </datalist>
              </label>
              <label className={fieldLabelClass}>
                {copy.location}
                <input
                  required
                  value={form.location}
                  onChange={(event) => setField('location', event.target.value)}
                  className={inputClass}
                />
              </label>
              <label className={fieldLabelClass}>
                {copy.clinicName}
                <input
                  value={form.clinicName}
                  onChange={(event) => setField('clinicName', event.target.value)}
                  className={inputClass}
                />
              </label>
              <label className={`${fieldLabelClass} sm:col-span-2`}>
                {copy.addressLine}
                <input
                  value={form.addressLine}
                  onChange={(event) => setField('addressLine', event.target.value)}
                  className={inputClass}
                />
              </label>
              <label className={`${fieldLabelClass} sm:col-span-2`}>
                {copy.mapUrl}
                <input
                  type="url"
                  value={form.mapUrl}
                  onChange={(event) => setField('mapUrl', event.target.value)}
                  className={inputClass}
                  placeholder={isAr ? 'https://maps.google.com/...' : 'https://maps.google.com/...'}
                />
              </label>
              <label className={fieldLabelClass}>
                {copy.consultationFee}
                <input
                  required
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.fee}
                  onChange={(event) => setField('fee', event.target.value)}
                  className={inputClass}
                />
              </label>
              <label className={fieldLabelClass}>
                {copy.onlineAvailable}
                <select
                  value={form.onlineAvailable ? 'yes' : 'no'}
                  onChange={(event) => setField('onlineAvailable', event.target.value === 'yes')}
                  className={inputClass}
                >
                  <option value="yes">{copy.yes}</option>
                  <option value="no">{copy.no}</option>
                </select>
              </label>
              <label className={`${fieldLabelClass} sm:col-span-2`}>
                {copy.shortBio}
                <textarea
                  required
                  rows={3}
                  value={form.shortBio}
                  onChange={(event) => setField('shortBio', event.target.value)}
                  className={textareaClass}
                />
              </label>
              <label className={`${fieldLabelClass} sm:col-span-2`}>
                {copy.about}
                <textarea
                  rows={6}
                  value={form.about}
                  onChange={(event) => setField('about', event.target.value)}
                  className={textareaClass}
                />
              </label>
              <label className={`${fieldLabelClass} sm:col-span-2`}>
                {copy.licenseDocument}
                <input
                  required
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/webp"
                  onChange={(event) => setLicenseDocument(event.target.files?.[0] ?? null)}
                  className="w-full rounded-xl border border-borderGray bg-white px-3 py-2 text-sm file:me-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-primaryDark"
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
