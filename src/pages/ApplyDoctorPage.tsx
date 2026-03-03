import { useMemo, useState } from 'react';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { useLanguage } from '../context/LanguageContext';
import { ApiError, apiJson } from '../utils/api';

type RoleType = 'PSYCHIATRIST' | 'THERAPIST';

type SubmitResponse = {
  id: string;
  status: string;
  message: string;
};

const COUNTRY_OPTIONS = ['Jordan', 'Saudi Arabia', 'UAE', 'Egypt', 'Qatar', 'Kuwait', 'Bahrain', 'Oman', 'Lebanon'];
const DEFAULT_SCHEDULE = JSON.stringify([
  { day: 'SUNDAY', start: '09:00', end: '17:00' },
  { day: 'MONDAY', start: '09:00', end: '17:00' },
  { day: 'TUESDAY', start: '09:00', end: '17:00' },
  { day: 'WEDNESDAY', start: '09:00', end: '17:00' },
  { day: 'THURSDAY', start: '09:00', end: '17:00' }
]);

export default function ApplyDoctorPage() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const [role, setRole] = useState<RoleType | null>(null);
  const [wizardStep, setWizardStep] = useState(0);

  const [fullNameAr, setFullNameAr] = useState('');
  const [fullNameEn, setFullNameEn] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+962');
  const [country, setCountry] = useState('Jordan');
  const [city, setCity] = useState('');
  const [languages, setLanguages] = useState('Arabic, English');
  const [yearsExperience, setYearsExperience] = useState('');
  const [focusAreas, setFocusAreas] = useState('');
  const [bio, setBio] = useState('');
  const [sessionFee, setSessionFee] = useState('35');

  const [medicalDegreeDetails, setMedicalDegreeDetails] = useState('');
  const [psychiatrySpecialization, setPsychiatrySpecialization] = useState('');
  const [medicalCouncilNumber, setMedicalCouncilNumber] = useState('');

  const [therapistDegree, setTherapistDegree] = useState('');
  const [therapyMethods, setTherapyMethods] = useState('');
  const [membershipNumber, setMembershipNumber] = useState('');

  const [governmentIdFile, setGovernmentIdFile] = useState<File | null>(null);
  const [professionalLicenseFile, setProfessionalLicenseFile] = useState<File | null>(null);
  const [medicalDegreeFile, setMedicalDegreeFile] = useState<File | null>(null);
  const [psychiatryCertFile, setPsychiatryCertFile] = useState<File | null>(null);
  const [highestDegreeFile, setHighestDegreeFile] = useState<File | null>(null);
  const [therapistLicenseProofFile, setTherapistLicenseProofFile] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fieldLabelClass = 'flex min-w-0 flex-col gap-2 text-sm font-semibold text-textMain';
  const inputClass =
    'h-11 w-full rounded-xl border border-borderGray bg-white px-4 text-sm transition focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10';
  const textareaClass =
    'w-full rounded-xl border border-borderGray bg-white px-4 py-3 text-sm transition focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10';

  const roleCards = useMemo(
    () => [
      {
        id: 'PSYCHIATRIST' as const,
        title: isAr ? 'طبيب نفسي (MD)' : 'Psychiatrist (Medical Doctor)',
        color: 'border-sky-200 bg-sky-50/70',
        capabilities: isAr
          ? [
              'التشخيص الطبي النفسي',
              'وصف الأدوية بعد التحقق والموافقة',
              'إدارة الجلسات والخطة العلاجية والملاحظات'
            ]
          : [
              'Medical psychiatric diagnosis',
              'Prescriptions only after admin verification',
              'Sessions, notes, and treatment-plan management'
            ]
      },
      {
        id: 'THERAPIST' as const,
        title: isAr ? 'معالج/أخصائي نفسي (Non-MD)' : 'Psychologist / Therapist (Non-MD)',
        color: 'border-emerald-200 bg-emerald-50/70',
        capabilities: isAr
          ? [
              'جلسات علاج نفسي وإرشاد',
              'إدارة المواعيد والجلسات والملاحظات والخطط',
              'لا يمكن وصف أدوية أو إضافة تشخيص طبي'
            ]
          : [
              'Psychotherapy and counseling sessions',
              'Profile, schedule, sessions, notes, treatment plans',
              'No prescriptions and no medical diagnosis fields'
            ]
      }
    ],
    [isAr]
  );

  const resetForm = () => {
    setWizardStep(0);
    setFullNameAr('');
    setFullNameEn('');
    setEmail('');
    setPhone('+962');
    setCountry('Jordan');
    setCity('');
    setLanguages('Arabic, English');
    setYearsExperience('');
    setFocusAreas('');
    setBio('');
    setSessionFee('35');
    setMedicalDegreeDetails('');
    setPsychiatrySpecialization('');
    setMedicalCouncilNumber('');
    setTherapistDegree('');
    setTherapyMethods('');
    setMembershipNumber('');
    setGovernmentIdFile(null);
    setProfessionalLicenseFile(null);
    setMedicalDegreeFile(null);
    setPsychiatryCertFile(null);
    setHighestDegreeFile(null);
    setTherapistLicenseProofFile(null);
  };

  const validateStep = (step: number): string | null => {
    if (!role) return isAr ? 'اختر نوع الحساب أولاً.' : 'Please select account type first.';

    if (step === 0) {
      if (!fullNameAr.trim() || !fullNameEn.trim()) {
        return isAr ? 'الاسم الكامل بالعربية والإنجليزية مطلوب.' : 'Full name in Arabic and English is required.';
      }
      if (!email.trim() || !phone.trim()) {
        return isAr ? 'البريد الإلكتروني ورقم الهاتف مطلوبان.' : 'Email and phone are required.';
      }
      const emailValue = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
        return isAr ? 'صيغة البريد الإلكتروني غير صحيحة.' : 'Please enter a valid email address.';
      }
      const phoneDigits = phone.replace(/\D/g, '');
      if (phoneDigits.length < 8) {
        return isAr ? 'رقم الهاتف غير صحيح.' : 'Please enter a valid phone number.';
      }
      if (!city.trim() || !country.trim()) {
        return isAr ? 'الدولة والمدينة مطلوبتان.' : 'Country and city are required.';
      }
      if (!yearsExperience.trim()) {
        return isAr ? 'سنوات الخبرة مطلوبة.' : 'Years of experience is required.';
      }
      const yearsValue = Number(yearsExperience);
      if (Number.isNaN(yearsValue) || yearsValue < 0 || yearsValue > 60) {
        return isAr ? 'سنوات الخبرة يجب أن تكون بين 0 و 60.' : 'Years of experience must be between 0 and 60.';
      }
      if (!focusAreas.trim() || !bio.trim()) {
        return isAr ? 'مجالات التركيز والنبذة مطلوبة.' : 'Focus areas and bio are required.';
      }
      const feeValue = Number(sessionFee);
      if (Number.isNaN(feeValue) || feeValue <= 0) {
        return isAr ? 'رسوم الجلسة يجب أن تكون أكبر من صفر.' : 'Session fee must be greater than zero.';
      }
      return null;
    }

    if (step === 1) {
      if (role === 'PSYCHIATRIST') {
        if (!medicalDegreeDetails.trim() || !psychiatrySpecialization.trim() || !medicalCouncilNumber.trim()) {
          return isAr
            ? 'جميع بيانات الطبيب النفسي الإضافية مطلوبة.'
            : 'All psychiatrist-specific fields are required.';
        }
      } else {
        if (!therapistDegree.trim() || !therapyMethods.trim() || !membershipNumber.trim()) {
          return isAr
            ? 'جميع بيانات المعالج الإضافية مطلوبة.'
            : 'All therapist-specific fields are required.';
        }
      }
      return null;
    }

    if (!governmentIdFile || !professionalLicenseFile) {
      return isAr ? 'رفع الهوية والترخيص المهني إلزامي.' : 'Government ID and professional license uploads are required.';
    }

    if (role === 'PSYCHIATRIST') {
      if (!medicalDegreeFile || !psychiatryCertFile) {
        return isAr
          ? 'وثيقة الدرجة الطبية وشهادة تخصص الطب النفسي مطلوبتان.'
          : 'Medical degree and psychiatry specialization certificate are required.';
      }
    } else {
      if (!highestDegreeFile || !therapistLicenseProofFile) {
        return isAr
          ? 'وثيقة أعلى درجة وإثبات ترخيص المعالج مطلوبان.'
          : 'Highest degree and therapist license/registration proof are required.';
      }
    }

    return null;
  };

  const currentStepError = role ? validateStep(wizardStep) : (isAr ? 'اختر نوع الحساب أولاً.' : 'Please select account type first.');
  const canMoveNext = currentStepError === null;
  const canSubmit = role ? validateStep(2) === null : false;

  const nextStep = () => {
    const error = validateStep(wizardStep);
    if (error) {
      setErrorMessage(error);
      return;
    }
    setErrorMessage(null);
    setWizardStep((current) => Math.min(current + 1, 2));
  };

  const prevStep = () => {
    setErrorMessage(null);
    setWizardStep((current) => Math.max(current - 1, 0));
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const finalError = validateStep(2);
    if (finalError) {
      setErrorMessage(finalError);
      return;
    }

    if (!role) return;

    const formData = new FormData();
    formData.set('professional_type', role);
    formData.set('full_name', `${fullNameEn.trim()} / ${fullNameAr.trim()}`);
    formData.set('email', email.trim().toLowerCase());
    formData.set('phone', phone.trim());
    formData.set('experience_years', yearsExperience.trim());
    formData.set(
      'specialty',
      role === 'PSYCHIATRIST'
        ? psychiatrySpecialization.trim() || 'Psychiatrist'
        : therapyMethods
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)[0] || 'Therapist'
    );
    formData.set('location', city.trim());
    formData.set('location_country', country.trim());
    formData.set('online_available', 'true');
    formData.set('fee', sessionFee.trim() || '35');
    formData.set('short_bio', bio.trim());
    formData.set('schedule', DEFAULT_SCHEDULE);

    const focusAreaValues = focusAreas
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    focusAreaValues.forEach((item) => formData.append('sub_specialties', item));

    const languageValues = languages
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    languageValues.forEach((item) => formData.append('languages', item));

    const roleDetailsText =
      role === 'PSYCHIATRIST'
        ? [
            `Medical Degree Details: ${medicalDegreeDetails.trim() || 'N/A'}`,
            `Psychiatry Specialization: ${psychiatrySpecialization.trim() || 'N/A'}`
          ]
        : [
            `Highest Degree: ${therapistDegree.trim() || 'N/A'}`,
            `Therapy Methods: ${therapyMethods.trim() || 'N/A'}`
          ];
    const aboutDetails = [
      bio.trim(),
      `Country: ${country.trim() || 'N/A'}`,
      `City: ${city.trim() || 'N/A'}`,
      `Languages: ${languageValues.join(', ') || 'N/A'}`,
      `Focus Areas: ${focusAreaValues.join(', ') || 'N/A'}`,
      ...roleDetailsText
    ].join('\n');
    formData.set('about', aboutDetails);

    formData.set('national_id_photo', governmentIdFile as File);
    formData.set('license_document', professionalLicenseFile as File);

    if (role === 'PSYCHIATRIST') {
      formData.set('license_number', medicalCouncilNumber.trim());
      formData.set('license_issuing_authority', 'Medical Council');
      formData.set('license_expiry_date', '2030-12-31');
      formData.set(
        'legal_prescription_declaration',
        isAr
          ? 'أقر أنني مخول قانونياً بوصف الأدوية النفسية بعد التحقق الإداري.'
          : 'I declare I am legally authorized to prescribe psychiatric medication after admin verification.'
      );
      formData.set('psychiatrist_prescription_ack', 'true');
      formData.set('medical_degree_certificate', medicalDegreeFile as File);
      formData.set('psychiatry_specialization_certificate', psychiatryCertFile as File);
      formData.set('active_practice_proof', professionalLicenseFile as File);
      formData.set('license_number', medicalCouncilNumber.trim());
      formData.set('headline', `Psychiatrist · ${psychiatrySpecialization.trim()}`);
      if (medicalDegreeDetails.trim()) {
        formData.append('sub_specialties', medicalDegreeDetails.trim());
      }
    } else {
      formData.set('accreditation_body', therapistDegree.trim());
      formData.set(
        'no_prescription_declaration',
        isAr
          ? 'أقر أنني لا أملك صلاحية وصف أدوية أو إضافة تشخيص طبي.'
          : 'I acknowledge I cannot prescribe medication or add medical diagnosis.'
      );
      formData.set('therapist_no_prescription_ack', 'true');
      formData.set('therapy_specialization_certificate', therapistLicenseProofFile as File);
      formData.set('specialization_certificate', highestDegreeFile as File);
      formData.set('headline', `Therapist · ${therapyMethods.trim()}`);
      formData.set('license_number', membershipNumber.trim());
      therapyMethods
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .forEach((item) => formData.append('sub_specialties', item));
    }

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

      setSuccessMessage(payload.message || (isAr ? 'تم إرسال الطلب بنجاح.' : 'Application submitted successfully.'));
      resetForm();
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(error instanceof Error ? error.message : isAr ? 'فشل الإرسال' : 'Submission failed');
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
          <h1 className="text-3xl font-black tracking-tight text-textMain sm:text-4xl">
            {isAr ? 'تقديم طلب طبيب/معالج' : 'Doctor Application Flow'}
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-muted sm:text-base">
            {isAr
              ? 'الخطوة 1: اختر نوع الحساب. الخطوة 2: نموذج ديناميكي حسب الدور مع مستندات إلزامية وتحقق إداري.'
              : 'Step 1: mandatory role selection. Step 2: dynamic multi-step form with role-based requirements and admin verification workflow.'}
          </p>
        </section>

        <section className="mt-6 rounded-hero border border-cyan-100 bg-white p-6 shadow-card sm:p-8">
          <h2 className="text-xl font-black text-textMain">{isAr ? 'الخطوة 1: نوع الحساب' : 'Step 1: Account Type'}</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {roleCards.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => {
                  setRole(card.id);
                  setWizardStep(0);
                  setErrorMessage(null);
                }}
                className={`rounded-2xl border p-4 text-left transition ${card.color} ${role === card.id ? 'ring-2 ring-primary/40' : 'hover:shadow-md'}`}
              >
                <p className="text-sm font-black text-textMain">{card.title}</p>
                <ul className="mt-2 space-y-1 text-xs text-muted">
                  {card.capabilities.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
        </section>

        {role && (
          <form onSubmit={onSubmit} className="mt-6 space-y-6">
            <section className="rounded-hero border border-cyan-100 bg-white p-6 shadow-card sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-black text-textMain">{isAr ? 'الخطوة 2: النموذج الديناميكي' : 'Step 2: Dynamic Multi-Step Form'}</h2>
                <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold text-cyan-800">
                  {isAr ? `المرحلة ${wizardStep + 1} من 3` : `Stage ${wizardStep + 1} of 3`}
                </span>
              </div>

              {wizardStep === 0 && (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className={fieldLabelClass}>
                    {isAr ? 'الاسم الكامل (عربي)' : 'Full Name (Arabic)'}
                    <input value={fullNameAr} onChange={(e) => setFullNameAr(e.target.value)} className={inputClass} required />
                  </label>
                  <label className={fieldLabelClass}>
                    {isAr ? 'الاسم الكامل (English)' : 'Full Name (English)'}
                    <input value={fullNameEn} onChange={(e) => setFullNameEn(e.target.value)} className={inputClass} required />
                  </label>
                  <label className={fieldLabelClass}>
                    {isAr ? 'البريد الإلكتروني' : 'Email'}
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required />
                  </label>
                  <label className={fieldLabelClass}>
                    {isAr ? 'الهاتف' : 'Phone'}
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} required />
                  </label>
                  <label className={fieldLabelClass}>
                    {isAr ? 'الدولة' : 'Country'}
                    <select value={country} onChange={(e) => setCountry(e.target.value)} className={inputClass}>
                      {COUNTRY_OPTIONS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={fieldLabelClass}>
                    {isAr ? 'المدينة' : 'City'}
                    <input value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} required />
                  </label>
                  <label className={fieldLabelClass}>
                    {isAr ? 'اللغات (مفصولة بفاصلة)' : 'Languages (comma separated)'}
                    <input value={languages} onChange={(e) => setLanguages(e.target.value)} className={inputClass} required />
                  </label>
                  <label className={fieldLabelClass}>
                    {isAr ? 'سنوات الخبرة' : 'Years of Experience'}
                    <input type="number" min={0} value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} className={inputClass} required />
                  </label>
                  <label className={`${fieldLabelClass} sm:col-span-2`}>
                    {isAr ? 'مجالات التركيز (مفصولة بفاصلة)' : 'Focus Areas (comma separated)'}
                    <input value={focusAreas} onChange={(e) => setFocusAreas(e.target.value)} className={inputClass} required />
                  </label>
                  <label className={`${fieldLabelClass} sm:col-span-2`}>
                    {isAr ? 'نبذة مهنية' : 'Professional Bio'}
                    <textarea rows={5} value={bio} onChange={(e) => setBio(e.target.value)} className={textareaClass} required />
                  </label>
                  <label className={fieldLabelClass}>
                    {isAr ? 'رسوم الجلسة (JOD)' : 'Session Fee (JOD)'}
                    <input type="number" min={0} step="0.01" value={sessionFee} onChange={(e) => setSessionFee(e.target.value)} className={inputClass} required />
                  </label>
                </div>
              )}

              {wizardStep === 1 && (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {role === 'PSYCHIATRIST' ? (
                    <>
                      <label className={fieldLabelClass}>
                        {isAr ? 'تفاصيل الدرجة الطبية' : 'Medical Degree Details'}
                        <input value={medicalDegreeDetails} onChange={(e) => setMedicalDegreeDetails(e.target.value)} className={inputClass} required />
                      </label>
                      <label className={fieldLabelClass}>
                        {isAr ? 'تخصص الطب النفسي' : 'Psychiatry Specialization'}
                        <input value={psychiatrySpecialization} onChange={(e) => setPsychiatrySpecialization(e.target.value)} className={inputClass} required />
                      </label>
                      <label className={fieldLabelClass}>
                        {isAr ? 'رقم تسجيل المجلس الطبي' : 'Medical Council Registration Number'}
                        <input value={medicalCouncilNumber} onChange={(e) => setMedicalCouncilNumber(e.target.value)} className={inputClass} required />
                      </label>
                      <p className="rounded-xl border border-cyan-100 bg-cyan-50 px-3 py-2 text-xs text-cyan-900 sm:col-span-2">
                        {isAr
                          ? 'الوصفات الطبية والتشخيص الطبي مفعّلة فقط بعد موافقة الإدارة والتحقق من المستندات.'
                          : 'Prescriptions and medical diagnosis are enabled only after admin approval and verification.'}
                      </p>
                    </>
                  ) : (
                    <>
                      <label className={fieldLabelClass}>
                        {isAr ? 'المؤهل الأكاديمي' : 'Highest Degree'}
                        <input value={therapistDegree} onChange={(e) => setTherapistDegree(e.target.value)} className={inputClass} required />
                      </label>
                      <label className={fieldLabelClass}>
                        {isAr ? 'الأساليب العلاجية' : 'Therapy Methods'}
                        <input value={therapyMethods} onChange={(e) => setTherapyMethods(e.target.value)} className={inputClass} required />
                      </label>
                      <label className={fieldLabelClass}>
                        {isAr ? 'رقم الترخيص/العضوية' : 'License / Membership Number'}
                        <input value={membershipNumber} onChange={(e) => setMembershipNumber(e.target.value)} className={inputClass} required />
                      </label>
                      <p className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-900 sm:col-span-2">
                        {isAr
                          ? 'المعالج لا يمتلك صلاحية الوصفات الطبية أو التشخيص الطبي.'
                          : 'Therapist account has no prescription rights and no medical diagnosis fields.'}
                      </p>
                    </>
                  )}
                </div>
              )}

              {wizardStep === 2 && (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className={fieldLabelClass}>
                    {isAr ? 'رفع الهوية الحكومية (إلزامي)' : 'Government ID Upload (Required)'}
                    <input type="file" accept="application/pdf,image/*" onChange={(e) => setGovernmentIdFile(e.target.files?.[0] ?? null)} className={inputClass} required />
                  </label>
                  <label className={fieldLabelClass}>
                    {isAr ? 'رفع الترخيص المهني (إلزامي)' : 'Professional License Upload (Required)'}
                    <input type="file" accept="application/pdf,image/*" onChange={(e) => setProfessionalLicenseFile(e.target.files?.[0] ?? null)} className={inputClass} required />
                  </label>

                  {role === 'PSYCHIATRIST' ? (
                    <>
                      <label className={fieldLabelClass}>
                        {isAr ? 'شهادة الدرجة الطبية (إلزامي)' : 'Medical Degree Certificate (Required)'}
                        <input type="file" accept="application/pdf,image/*" onChange={(e) => setMedicalDegreeFile(e.target.files?.[0] ?? null)} className={inputClass} required />
                      </label>
                      <label className={fieldLabelClass}>
                        {isAr ? 'شهادة تخصص الطب النفسي (إلزامي)' : 'Psychiatry Specialization Certificate (Required)'}
                        <input type="file" accept="application/pdf,image/*" onChange={(e) => setPsychiatryCertFile(e.target.files?.[0] ?? null)} className={inputClass} required />
                      </label>
                    </>
                  ) : (
                    <>
                      <label className={fieldLabelClass}>
                        {isAr ? 'وثيقة أعلى درجة (إلزامي)' : 'Highest Degree Upload (Required)'}
                        <input type="file" accept="application/pdf,image/*" onChange={(e) => setHighestDegreeFile(e.target.files?.[0] ?? null)} className={inputClass} required />
                      </label>
                      <label className={fieldLabelClass}>
                        {isAr ? 'إثبات ترخيص/تسجيل المعالج (إلزامي)' : 'Therapist License/Registration Proof (Required)'}
                        <input type="file" accept="application/pdf,image/*" onChange={(e) => setTherapistLicenseProofFile(e.target.files?.[0] ?? null)} className={inputClass} required />
                      </label>
                    </>
                  )}

                  <div className="sm:col-span-2 rounded-xl border border-borderGray bg-slate-50 p-4 text-xs text-muted">
                    {isAr
                      ? 'حالات الإدارة: Draft, Submitted, Under Review, Approved_MD, Approved_Therapist, Rejected, Needs More Info.'
                      : 'Admin statuses: Draft, Submitted, Under Review, Approved_MD, Approved_Therapist, Rejected, Needs More Info.'}
                  </div>
                </div>
              )}

              {errorMessage && <p className="mt-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</p>}
              {successMessage && <p className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</p>}

              <div className="mt-6 flex flex-wrap items-center gap-3">
                {wizardStep > 0 && (
                  <button type="button" onClick={prevStep} className="rounded-xl border border-borderGray bg-white px-5 py-2 text-sm font-semibold text-textMain hover:bg-slate-50">
                    {isAr ? 'السابق' : 'Back'}
                  </button>
                )}

                {wizardStep < 2 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={!canMoveNext}
                    className="rounded-xl bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primaryDark disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isAr ? 'التالي' : 'Next'}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting || !canSubmit}
                    className="rounded-xl bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primaryDark disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? (isAr ? 'جاري الإرسال...' : 'Submitting...') : isAr ? 'إرسال الطلب' : 'Submit Application'}
                  </button>
                )}
              </div>
            </section>
          </form>
        )}
      </main>

      <Footer />
    </div>
  );
}
