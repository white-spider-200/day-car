import { type ReactNode, useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import { useLanguage } from '../context/LanguageContext';
import { apiJson } from '../utils/api';

type ApplicationStatus = 'PENDING' | 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'NEEDS_CHANGES';

type DoctorApplication = {
  id: string;
  doctor_user_id: string | null;
  status: ApplicationStatus;
  full_name: string | null;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  national_id: string | null;
  license_number: string | null;
  specialty: string | null;
  sub_specialties: string[] | null;
  languages: string[] | null;
  location_city: string | null;
  location_country: string | null;
  clinic_name: string | null;
  address_line: string | null;
  map_url: string | null;
  online_available: boolean | null;
  years_experience: number | null;
  consultation_fee: string | number | null;
  short_bio: string | null;
  about: string | null;
  schedule: Array<{ day: string; start: string; end: string }> | null;
  license_document_url: string | null;
  admin_note: string | null;
  rejection_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
};

const STATUS_OPTIONS: Array<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'> = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'];

function statusClass(status: ApplicationStatus): string {
  if (status === 'APPROVED') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (status === 'REJECTED') return 'bg-rose-50 text-rose-700 border-rose-100';
  if (status === 'PENDING') return 'bg-sky-50 text-sky-700 border-sky-100';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

function formatDateTime(value: string | null): string {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function formatAmount(value: string | number | null): string {
  if (value === null || value === '') return 'N/A';
  const parsed = Number(value);
  return Number.isNaN(parsed) ? String(value) : `${parsed} JOD`;
}

function resolveMediaUrl(url: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const env = import.meta.env as Record<string, string | boolean | undefined>;
  const envBase = typeof env.VITE_API_BASE_URL === 'string' ? env.VITE_API_BASE_URL.trim() : '';
  const fallbackBase =
    typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:8000` : 'http://localhost:8000';
  const base = (envBase && envBase !== '/api' ? envBase : fallbackBase).replace(/\/+$/, '').replace(/\/api$/, '');

  return `${base}${path}`;
}

export default function AdminPage() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const copy = useMemo(
    () =>
      isAr
        ? {
            title: 'مراجعة طلبات الأطباء',
            subtitle: 'مراجعة الطلبات الجديدة واعتماد الأطباء أو رفضهم.',
            filter: 'الحالة',
            refresh: 'تحديث',
            pending: 'قيد المراجعة',
            approved: 'تم القبول',
            rejected: 'مرفوض',
            total: 'الإجمالي',
            applications: 'الطلبات',
            details: 'تفاصيل الطلب',
            loading: 'جاري تحميل الطلبات...',
            empty: 'لا توجد طلبات مطابقة لهذا الفلتر.',
            selectHint: 'اختر طلباً لعرض التفاصيل.',
            saveNote: 'حفظ الملاحظة',
            approve: 'قبول',
            reject: 'رفض',
            rejectionReason: 'سبب الرفض',
            adminNote: 'ملاحظة داخلية',
            deleteDoctor: 'حذف حساب الطبيب',
            doctorDeleteRequiresApproved: 'يمكن حذف الحساب فقط بعد اعتماد الطبيب.',
            deleteDoctorConfirm: 'هل أنت متأكد من حذف حساب الطبيب نهائيًا؟',
            profilePhoto: 'صورة الملف الشخصي',
            licenseDoc: 'وثيقة الترخيص',
            openFile: 'فتح الملف',
            yes: 'نعم',
            no: 'لا'
          }
        : {
            title: 'Doctor Applications Review',
            subtitle: 'Review incoming applications and approve or reject doctors.',
            filter: 'Status',
            refresh: 'Refresh',
            pending: 'Pending',
            approved: 'Approved',
            rejected: 'Rejected',
            total: 'Total',
            applications: 'Applications',
            details: 'Application Details',
            loading: 'Loading applications...',
            empty: 'No applications found for this filter.',
            selectHint: 'Select an application to view details.',
            saveNote: 'Save note',
            approve: 'Approve',
            reject: 'Reject',
            rejectionReason: 'Rejection reason',
            adminNote: 'Internal admin note',
            deleteDoctor: 'Delete Doctor Account',
            doctorDeleteRequiresApproved: 'Doctor account can be deleted only after approval.',
            deleteDoctorConfirm: 'Are you sure you want to permanently delete this doctor account?',
            profilePhoto: 'Profile photo',
            licenseDoc: 'License document',
            openFile: 'Open file',
            yes: 'Yes',
            no: 'No'
          },
    [isAr]
  );

  const [applications, setApplications] = useState<DoctorApplication[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [adminNoteDraft, setAdminNoteDraft] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const loadApplications = async (status: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' = selectedStatus) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const query = status === 'ALL' ? '' : `?status=${encodeURIComponent(status)}`;
      const payload = await apiJson<DoctorApplication[]>(
        `/admin/applications${query}`,
        undefined,
        true,
        isAr ? 'تعذر تحميل الطلبات' : 'Failed to load applications'
      );
      setApplications(payload);
      if (payload.length > 0 && !selectedApplicationId) {
        setSelectedApplicationId(payload[0].id);
      }
      if (selectedApplicationId && !payload.some((item) => item.id === selectedApplicationId)) {
        setSelectedApplicationId(payload[0]?.id ?? null);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : isAr ? 'تعذر تحميل الطلبات' : 'Failed to load applications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadApplications('PENDING');
  }, []);

  const selectedApplication = useMemo(
    () => applications.find((item) => item.id === selectedApplicationId) ?? null,
    [applications, selectedApplicationId]
  );

  useEffect(() => {
    if (!selectedApplication) {
      setAdminNoteDraft('');
      setRejectionReason('');
      return;
    }
    setAdminNoteDraft(selectedApplication.admin_note ?? '');
    setRejectionReason(selectedApplication.rejection_reason ?? '');
  }, [selectedApplication]);

  const counts = useMemo(
    () => ({
      total: applications.length,
      pending: applications.filter((item) => item.status === 'PENDING').length,
      approved: applications.filter((item) => item.status === 'APPROVED').length,
      rejected: applications.filter((item) => item.status === 'REJECTED').length
    }),
    [applications]
  );

  const onFilterChange = async (nextStatus: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED') => {
    setSelectedStatus(nextStatus);
    await loadApplications(nextStatus);
  };

  const refreshSelected = async () => {
    await loadApplications(selectedStatus);
  };

  const saveAdminNote = async () => {
    if (!selectedApplication) return;
    const note = adminNoteDraft.trim();
    if (!note) return;
    setBusyAction('save_note');
    setErrorMessage(null);
    try {
      await apiJson<DoctorApplication>(
        `/admin/applications/${selectedApplication.id}/note`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ admin_note: note })
        },
        true,
        isAr ? 'تعذر حفظ الملاحظة' : 'Failed to save admin note'
      );
      await refreshSelected();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : isAr ? 'تعذر حفظ الملاحظة' : 'Failed to save admin note');
    } finally {
      setBusyAction(null);
    }
  };

  const approveSelected = async () => {
    if (!selectedApplication) return;
    setBusyAction('approve');
    setErrorMessage(null);
    try {
      await apiJson<DoctorApplication>(
        `/admin/applications/${selectedApplication.id}/approve`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ note: adminNoteDraft.trim() || null })
        },
        true,
        isAr ? 'تعذر اعتماد الطلب' : 'Failed to approve application'
      );
      await refreshSelected();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : isAr ? 'تعذر اعتماد الطلب' : 'Failed to approve application');
    } finally {
      setBusyAction(null);
    }
  };

  const rejectSelected = async () => {
    if (!selectedApplication) return;
    const reason = rejectionReason.trim();
    if (reason.length < 3) {
      setErrorMessage(isAr ? 'سبب الرفض يجب أن يكون 3 أحرف على الأقل.' : 'Rejection reason must be at least 3 characters.');
      return;
    }

    setBusyAction('reject');
    setErrorMessage(null);
    try {
      await apiJson<DoctorApplication>(
        `/admin/applications/${selectedApplication.id}/reject`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason, note: adminNoteDraft.trim() || null })
        },
        true,
        isAr ? 'تعذر رفض الطلب' : 'Failed to reject application'
      );
      await refreshSelected();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : isAr ? 'تعذر رفض الطلب' : 'Failed to reject application');
    } finally {
      setBusyAction(null);
    }
  };

  const deleteDoctorAccount = async () => {
    if (!selectedApplication) return;
    if (!selectedApplication.doctor_user_id) {
      setErrorMessage(copy.doctorDeleteRequiresApproved);
      return;
    }
    const doctorLabel = selectedApplication.full_name ?? selectedApplication.display_name ?? selectedApplication.email ?? selectedApplication.id;
    const confirmed = window.confirm(`${copy.deleteDoctorConfirm}\n\n${doctorLabel}`);
    if (!confirmed) return;

    setBusyAction('delete_doctor');
    setErrorMessage(null);
    try {
      await apiJson<{ message: string }>(
        `/admin/doctors/${selectedApplication.doctor_user_id}`,
        { method: 'DELETE' },
        true,
        isAr ? 'تعذر حذف حساب الطبيب' : 'Failed to delete doctor account'
      );
      await refreshSelected();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : isAr ? 'تعذر حذف حساب الطبيب' : 'Failed to delete doctor account');
    } finally {
      setBusyAction(null);
    }
  };

  const canReview = selectedApplication && (selectedApplication.status === 'PENDING' || selectedApplication.status === 'IN_REVIEW');
  const licenseFileUrl = resolveMediaUrl(selectedApplication?.license_document_url ?? null);
  const profilePhotoUrl = resolveMediaUrl(selectedApplication?.photo_url ?? null);
  const nationalIdUrl = resolveMediaUrl(selectedApplication?.national_id ?? null);
  const isLicensePdf = Boolean(licenseFileUrl && /\.pdf(\?|$)/i.test(licenseFileUrl));
  const isNationalIdImage = Boolean(nationalIdUrl && /\.(png|jpe?g|webp|gif)(\?|$)/i.test(nationalIdUrl));
  const sectionTitleClass = 'text-sm font-bold text-textMain';

  const InfoItem = ({
    label,
    value,
    fullWidth = false,
    breakAll = false
  }: {
    label: string;
    value: ReactNode;
    fullWidth?: boolean;
    breakAll?: boolean;
  }) => (
    <div className={fullWidth ? 'sm:col-span-2' : undefined}>
      <p className="text-[11px] font-bold text-muted">{label}</p>
      <div className={`mt-1 rounded-lg border border-borderGray bg-white px-3 py-2 text-sm text-textMain ${breakAll ? 'break-all' : 'break-words'}`}>
        {value}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50/40 via-white to-white text-textMain">
      <Header
        brandHref="/admin/applications"
        navItems={[
          { labelKey: 'nav.dashboard', href: '/admin/applications' },
          { labelKey: 'nav.users', href: '/admin/users' },
          { labelKey: 'nav.doctors', href: '/home#featured-doctors' }
        ]}
      />

      <main className="section-shell py-6 sm:py-8">
        <section className="rounded-hero border border-cyan-100 bg-white p-6 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-textMain sm:text-3xl">{copy.title}</h1>
              <p className="mt-2 text-sm text-muted">{copy.subtitle}</p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="/admin/financial-reports"
                className="rounded-lg border border-borderGray px-3 py-2 text-xs font-semibold text-textMain transition hover:border-primary/40 hover:text-primary"
              >
                Financial Reports
              </a>
              <label className="text-xs font-semibold text-muted" htmlFor="status-filter">
                {copy.filter}
              </label>
              <select
                id="status-filter"
                value={selectedStatus}
                onChange={(event) => void onFilterChange(event.target.value as 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED')}
                className="rounded-lg border border-borderGray bg-white px-3 py-2 text-xs font-semibold text-textMain"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => void refreshSelected()}
                className="rounded-lg border border-borderGray px-3 py-2 text-xs font-semibold text-textMain transition hover:border-primary/40 hover:text-primary"
              >
                {copy.refresh}
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <article className="rounded-xl border border-borderGray bg-slate-50 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-wide text-muted">{copy.total}</p>
              <p className="mt-1 text-2xl font-black text-textMain">{counts.total}</p>
            </article>
            <article className="rounded-xl border border-borderGray bg-sky-50 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-wide text-sky-700">{copy.pending}</p>
              <p className="mt-1 text-2xl font-black text-textMain">{counts.pending}</p>
            </article>
            <article className="rounded-xl border border-borderGray bg-emerald-50 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-wide text-emerald-700">{copy.approved}</p>
              <p className="mt-1 text-2xl font-black text-textMain">{counts.approved}</p>
            </article>
            <article className="rounded-xl border border-borderGray bg-rose-50 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-wide text-rose-700">{copy.rejected}</p>
              <p className="mt-1 text-2xl font-black text-textMain">{counts.rejected}</p>
            </article>
          </div>

          {errorMessage && (
            <p className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p>
          )}
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section className="min-w-0 rounded-hero border border-borderGray bg-white p-6 shadow-card">
            <h2 className="text-xl font-black text-textMain">{copy.applications}</h2>

            {isLoading ? (
              <p className="mt-4 text-sm text-muted">{copy.loading}</p>
            ) : applications.length === 0 ? (
              <p className="mt-4 text-sm text-muted">{copy.empty}</p>
            ) : (
              <div className="mt-4 space-y-3">
                {applications.map((application) => {
                  const title = application.full_name ?? application.display_name ?? application.email ?? application.id;
                  return (
                    <button
                      key={application.id}
                      type="button"
                      onClick={() => setSelectedApplicationId(application.id)}
                      className={`w-full min-w-0 rounded-2xl border p-4 text-left transition ${
                        selectedApplicationId === application.id
                          ? 'border-primary bg-primary-50/30'
                          : 'border-borderGray bg-slate-50 hover:border-primary/30'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-textMain">{title}</h3>
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(application.status)}`}>
                          {application.status}
                        </span>
                      </div>
                      <p className="mt-1 break-all text-xs text-muted">{application.email ?? 'N/A'}</p>
                      <p className="mt-1 break-words text-xs text-muted">
                        {application.specialty ?? 'N/A'} · {application.location_city ?? 'N/A'}
                      </p>
                      <p className="mt-1 text-xs text-muted">{formatDateTime(application.created_at)}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section className="min-w-0 rounded-hero border border-borderGray bg-white p-6 shadow-card">
            <h2 className="text-xl font-black text-textMain">{copy.details}</h2>

            {!selectedApplication ? (
              <p className="mt-4 text-sm text-muted">{copy.selectHint}</p>
            ) : (
              <div className="mt-4 space-y-4">
                <article className="min-w-0 rounded-xl border border-borderGray bg-slate-50 p-4">
                  <p className={sectionTitleClass}>{isAr ? 'الملف الشخصي' : 'Profile'}</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <InfoItem
                      label={isAr ? 'الاسم' : 'Name'}
                      value={selectedApplication.full_name ?? selectedApplication.display_name ?? 'N/A'}
                    />
                    <InfoItem label={isAr ? 'التخصص' : 'Specialty'} value={selectedApplication.specialty ?? 'N/A'} />
                    <InfoItem label={isAr ? 'البريد الإلكتروني' : 'Email'} value={selectedApplication.email ?? 'N/A'} breakAll />
                    <InfoItem label={isAr ? 'رقم الهاتف' : 'Phone'} value={selectedApplication.phone ?? 'N/A'} breakAll />
                    <InfoItem
                      label={isAr ? 'نبذة مختصرة' : 'Short Bio'}
                      value={selectedApplication.short_bio ?? 'N/A'}
                      fullWidth
                    />
                  </div>
                </article>

                <article className="min-w-0 rounded-xl border border-borderGray bg-slate-50 p-4">
                  <p className={sectionTitleClass}>{isAr ? 'المعلومات المهنية' : 'Professional'}</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <InfoItem label={isAr ? 'رقم الترخيص' : 'License Number'} value={selectedApplication.license_number ?? 'N/A'} />
                    <InfoItem
                      label={isAr ? 'سنوات الخبرة' : 'Experience Years'}
                      value={selectedApplication.years_experience ?? 'N/A'}
                    />
                    <InfoItem label={isAr ? 'الرسوم' : 'Fee'} value={formatAmount(selectedApplication.consultation_fee)} />
                    <InfoItem label={isAr ? 'متاح أونلاين' : 'Online'} value={selectedApplication.online_available ? copy.yes : copy.no} />
                    <InfoItem
                      label={isAr ? 'اللغات' : 'Languages'}
                      value={(selectedApplication.languages ?? []).join(' • ') || 'N/A'}
                      fullWidth
                    />
                    <InfoItem
                      label={isAr ? 'التخصصات الفرعية' : 'Sub-specialties'}
                      value={(selectedApplication.sub_specialties ?? []).join(' • ') || 'N/A'}
                      fullWidth
                    />
                    <InfoItem label={isAr ? 'المدينة' : 'City'} value={selectedApplication.location_city ?? 'N/A'} />
                    <InfoItem label={isAr ? 'الدولة' : 'Country'} value={selectedApplication.location_country ?? 'N/A'} />
                    <InfoItem label={isAr ? 'اسم العيادة' : 'Clinic'} value={selectedApplication.clinic_name ?? 'N/A'} />
                    <InfoItem label={isAr ? 'العنوان' : 'Address'} value={selectedApplication.address_line ?? 'N/A'} />
                    <InfoItem
                      label={isAr ? 'رابط الخريطة' : 'Map URL'}
                      value={
                        selectedApplication.map_url ? (
                          <a href={selectedApplication.map_url} target="_blank" rel="noreferrer" className="font-semibold text-primary hover:text-primaryDark">
                            {selectedApplication.map_url}
                          </a>
                        ) : (
                          'N/A'
                        )
                      }
                      breakAll
                      fullWidth
                    />
                  </div>
                </article>

                <article className="min-w-0 rounded-xl border border-borderGray bg-slate-50 p-4">
                  <p className={sectionTitleClass}>{isAr ? 'نبذة تفصيلية' : 'About'}</p>
                  <div className="mt-3 rounded-lg border border-borderGray bg-white px-3 py-2 text-sm text-textMain whitespace-pre-wrap break-words">
                    {selectedApplication.about ?? 'N/A'}
                  </div>
                </article>

                <article className="rounded-xl border border-borderGray bg-slate-50 p-4">
                  <p className={sectionTitleClass}>{isAr ? 'جدول التوفر' : 'Schedule'}</p>
                  {(selectedApplication.schedule ?? []).length === 0 ? (
                    <p className="mt-2 rounded-lg border border-borderGray bg-white px-3 py-2 text-sm text-muted">N/A</p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {(selectedApplication.schedule ?? []).map((slot, index) => (
                        <li
                          key={`${slot.day}-${slot.start}-${slot.end}-${index}`}
                          className="rounded-lg border border-borderGray bg-white px-3 py-2 text-sm text-textMain"
                        >
                          {slot.day}: {slot.start} - {slot.end}
                        </li>
                      ))}
                    </ul>
                  )}
                </article>

                <div className="grid gap-4 lg:grid-cols-3">
                  <article className="rounded-xl border border-borderGray bg-slate-50 px-4 py-3">
                    <p className={sectionTitleClass}>{copy.profilePhoto}</p>
                    {profilePhotoUrl ? (
                      <a href={profilePhotoUrl} target="_blank" rel="noreferrer" className="mt-2 block">
                        <img src={profilePhotoUrl} alt="profile" className="h-36 w-full rounded-lg object-cover" />
                      </a>
                    ) : (
                      <p className="mt-2 text-xs text-muted">N/A</p>
                    )}
                  </article>

                  <article className="rounded-xl border border-borderGray bg-slate-50 px-4 py-3">
                    <p className={sectionTitleClass}>{copy.licenseDoc}</p>
                    {licenseFileUrl ? (
                      <div className="mt-2">
                        {isLicensePdf ? (
                          <a
                            href={licenseFileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold text-primary hover:text-primaryDark"
                          >
                            {copy.openFile}
                          </a>
                        ) : (
                          <a href={licenseFileUrl} target="_blank" rel="noreferrer" className="block">
                            <img src={licenseFileUrl} alt="license" className="h-36 w-full rounded-lg object-cover" />
                          </a>
                        )}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-muted">N/A</p>
                    )}
                  </article>

                  <article className="rounded-xl border border-borderGray bg-slate-50 px-4 py-3">
                    <p className={sectionTitleClass}>{isAr ? 'الهوية الوطنية' : 'National ID'}</p>
                    {nationalIdUrl ? (
                      <div className="mt-2">
                        {isNationalIdImage ? (
                          <a href={nationalIdUrl} target="_blank" rel="noreferrer" className="block">
                            <img src={nationalIdUrl} alt="national-id" className="h-36 w-full rounded-lg object-cover" />
                          </a>
                        ) : (
                          <a href={nationalIdUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-primary hover:text-primaryDark">
                            {copy.openFile}
                          </a>
                        )}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-muted">N/A</p>
                    )}
                  </article>
                </div>

                <article className="min-w-0 rounded-xl border border-borderGray bg-slate-50 px-4 py-3">
                  <p className={sectionTitleClass}>{isAr ? 'التسلسل الزمني' : 'Timeline'}</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <InfoItem label={isAr ? 'تاريخ الإنشاء' : 'Created'} value={formatDateTime(selectedApplication.created_at)} />
                    <InfoItem label={isAr ? 'تاريخ المراجعة' : 'Reviewed'} value={formatDateTime(selectedApplication.reviewed_at)} />
                  </div>
                  {selectedApplication.rejection_reason && (
                    <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                      {copy.rejectionReason}: {selectedApplication.rejection_reason}
                    </p>
                  )}
                </article>

                <div className="rounded-xl border border-borderGray bg-white p-4">
                  <label className="text-sm font-bold text-textMain">{copy.adminNote}</label>
                  <textarea
                    value={adminNoteDraft}
                    onChange={(event) => setAdminNoteDraft(event.target.value)}
                    rows={3}
                    className="mt-2 w-full rounded-lg border border-borderGray px-3 py-2 text-sm"
                  />

                  <label className="mt-3 block text-sm font-bold text-textMain">{copy.rejectionReason}</label>
                  <input
                    value={rejectionReason}
                    onChange={(event) => setRejectionReason(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-borderGray px-3 py-2 text-sm"
                  />

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void saveAdminNote()}
                      disabled={busyAction === 'save_note'}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-textMain disabled:opacity-60"
                    >
                      {busyAction === 'save_note' ? '...' : copy.saveNote}
                    </button>

                    <button
                      type="button"
                      onClick={() => void approveSelected()}
                      disabled={!canReview || busyAction === 'approve'}
                      className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 disabled:opacity-60"
                    >
                      {busyAction === 'approve' ? '...' : copy.approve}
                    </button>

                    <button
                      type="button"
                      onClick={() => void rejectSelected()}
                      disabled={!canReview || busyAction === 'reject'}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 disabled:opacity-60"
                    >
                      {busyAction === 'reject' ? '...' : copy.reject}
                    </button>

                  </div>

                  {!selectedApplication.doctor_user_id && (
                    <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                      {copy.doctorDeleteRequiresApproved}
                    </p>
                  )}

                  {selectedApplication.doctor_user_id && (
                    <button
                      type="button"
                      onClick={() => void deleteDoctorAccount()}
                      disabled={busyAction === 'delete_doctor'}
                      className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                    >
                      {busyAction === 'delete_doctor' ? '...' : copy.deleteDoctor}
                    </button>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
