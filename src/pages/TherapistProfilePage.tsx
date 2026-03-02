import { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';
import { getTherapistBySlug, therapists, type TherapistLicense } from '../data/therapists';

function getSlugFromPath(pathname: string): string {
  const chunks = pathname.split('/').filter(Boolean);
  if (chunks.length >= 2 && (chunks[0] === 'therapists' || chunks[0] === 'doctors')) {
    return chunks[1];
  }
  return 'abdelrahman-mizher';
}

function cleanList(values: string[] | undefined): string[] {
  return (values ?? []).map((item) => item.trim()).filter(Boolean);
}

function formatPrice(min: number | null, max: number | null, currency: string, fallback: string): string {
  if (min === null && max === null) {
    return fallback;
  }

  if (min !== null && max !== null) {
    return min === max ? `${min} ${currency}` : `${min} - ${max} ${currency}`;
  }

  return `${min ?? max} ${currency}`;
}

export default function TherapistProfilePage() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const [slug, setSlug] = useState(() => getSlugFromPath(window.location.pathname));

  useEffect(() => {
    const handlePopState = () => {
      setSlug(getSlugFromPath(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const therapist = useMemo(() => getTherapistBySlug(slug) ?? therapists[0], [slug]);

  const copy = isAr
    ? {
        fallback: 'غير متوفر حالياً',
        profileTitle: 'الملف السريري',
        verified: 'موثّق',
        verifiedInfo: 'تم التحقق من الهوية والترخيص',
        yearsExp: 'سنوات الخبرة',
        practiceSince: 'بداية الممارسة',
        graduationYear: 'سنة التخرج',
        rating: 'التقييم',
        sessionsCount: 'عدد الحجوزات المعلنة',
        languages: 'اللغات',
        location: 'الموقع',
        onlineAvailable: 'متاح أونلاين',
        inPersonAvailable: 'متاح حضوري',
        about: 'نبذة مهنية',
        expertise: 'الخبرة السريرية ومجالات التركيز',
        approaches: 'الأساليب العلاجية',
        education: 'التعليم والتراخيص',
        degrees: 'المؤهلات',
        licenses: 'التراخيص',
        memberships: 'العضويات المهنية',
        practiceDetails: 'تفاصيل الممارسة',
        clinic: 'العيادة/المركز',
        primaryAddress: 'العنوان الرئيسي',
        addressNote: 'ملاحظة عنوان',
        officeHours: 'ساعات العمل المنشورة',
        publicFees: 'الرسوم المتاحة علنًا',
        insurance: 'التأمين',
        reputation: 'السمعة والتقييمات',
        reviewSummary:
          'التقييم العددي المتكرر في ملفات الحجز: 4.7/5، مع إشارات إلى محدودية عدد التعليقات النصية المنشورة علنًا.',
        mediaPresence: 'الظهور الإعلامي',
        noReviews: 'لا توجد تقييمات نصية كافية لعرض تحليل مفصل.',
        records: 'السجلات المهنية المعلنة',
        recordsNotePrefix: 'حتى تاريخ',
        recordsNote: 'لم يظهر في المصادر المفتوحة سجل تأديبي منشور علنًا بالاسم.',
        referenceLinks: 'روابط الملفات المرجعية',
        safety: 'تنبيه السلامة والطوارئ',
        crisisText:
          'هذه الخدمة ليست للطوارئ. إذا كنت في خطر فوري أو تمر بأزمة حادة، اتصل بخدمات الطوارئ المحلية فورًا أو استخدم خطوط المساندة المتخصصة.',
        hotline: 'موارد خطوط المساندة',
        notFound: 'الملف المطلوب غير موجود، تم عرض الملف الافتراضي.'
      }
    : {
        fallback: 'Not available yet',
        profileTitle: 'Clinical Profile',
        verified: 'Verified',
        verifiedInfo: 'License & identity verified',
        yearsExp: 'Years of experience',
        practiceSince: 'Practice since',
        graduationYear: 'Graduation year',
        rating: 'Rating',
        sessionsCount: 'Published booking count',
        languages: 'Languages',
        location: 'Location',
        onlineAvailable: 'Online available',
        inPersonAvailable: 'In-person available',
        about: 'Professional Bio',
        expertise: 'Clinical Expertise & Areas of Focus',
        approaches: 'Therapy Approaches',
        education: 'Education & Licensing',
        degrees: 'Degrees',
        licenses: 'Licenses',
        memberships: 'Professional memberships',
        practiceDetails: 'Practice Details',
        clinic: 'Clinic / Center',
        primaryAddress: 'Primary address',
        addressNote: 'Address note',
        officeHours: 'Published office hours',
        publicFees: 'Public fee range',
        insurance: 'Insurance',
        reputation: 'Reputation & Reviews',
        reviewSummary:
          'Most booking profiles show a 4.7/5 rating, with limited publicly visible textual reviews.',
        mediaPresence: 'Media Presence',
        noReviews: 'There are not enough public text reviews for detailed analysis.',
        records: 'Public Professional Records',
        recordsNotePrefix: 'As of',
        recordsNote: 'No publicly posted disciplinary record was found in open sources under this name.',
        referenceLinks: 'Reference profile links',
        safety: 'Safety & Crisis Disclaimer',
        crisisText:
          'This service is not for emergencies. If you are in immediate danger or acute crisis, call local emergency services now or use dedicated hotline resources.',
        hotline: 'Hotline resources',
        notFound: 'Requested profile was not found. Showing default profile.'
      };

  const profileWasMissing = !getTherapistBySlug(slug);
  const fullName = isAr ? therapist.name_ar : therapist.name_en;
  const title = (isAr ? therapist.title_ar : therapist.title_en).trim() || copy.fallback;
  const locationText = [therapist.location_city, therapist.country].filter(Boolean).join(', ') || copy.fallback;
  const primaryAddress = (isAr ? therapist.primary_address_ar : therapist.primary_address_en)?.trim() || copy.fallback;
  const altAddressNote = (isAr ? therapist.alternate_address_note_ar : therapist.alternate_address_note_en)?.trim() || copy.fallback;
  const feesNote = (isAr ? therapist.fees_note_ar : therapist.fees_note_en)?.trim() || copy.fallback;
  const insuranceNote = (isAr ? therapist.insurance_note_ar : therapist.insurance_note_en)?.trim() || copy.fallback;
  const priceRange = formatPrice(therapist.price_min, therapist.price_max, therapist.currency, copy.fallback);
  const aboutText = (isAr ? therapist.bio_ar : therapist.bio_en).trim() || copy.fallback;

  const localizedSpecialties = cleanList(isAr ? therapist.specialties_ar : therapist.specialties);
  const localizedFocus = cleanList(isAr ? therapist.areas_of_focus_ar : therapist.areas_of_focus);
  const localizedApproaches = cleanList(isAr ? therapist.approaches_ar : therapist.approaches);
  const localizedEducation = cleanList(isAr ? therapist.education_ar : therapist.education);
  const localizedLanguages = cleanList(isAr ? therapist.languages_ar : therapist.languages);
  const localizedMemberships = cleanList(isAr ? therapist.memberships_ar : therapist.memberships_en);
  const localizedOfficeHours = cleanList(isAr ? therapist.office_hours_ar : therapist.office_hours_en);
  const localizedMedia = cleanList(isAr ? therapist.media_highlights_ar : therapist.media_highlights_en);
  const localizedLicenses: TherapistLicense[] = (isAr ? therapist.licenses_ar : undefined) ?? therapist.licenses;

  const yearsText =
    therapist.years_experience === null
      ? copy.fallback
      : isAr
        ? `${therapist.years_experience}+ سنة`
        : `${therapist.years_experience}+ years`;
  const practiceSinceText =
    therapist.practice_since_year === null || therapist.practice_since_year === undefined ? copy.fallback : `${therapist.practice_since_year}`;
  const graduationYearText =
    therapist.graduation_year === null || therapist.graduation_year === undefined ? copy.fallback : `${therapist.graduation_year}`;
  const ratingText =
    therapist.rating_avg === null ? copy.fallback : `${therapist.rating_avg.toFixed(1)} / 5`;
  const sessionsText =
    therapist.sessions_count === null || therapist.sessions_count === undefined
      ? copy.fallback
      : therapist.sessions_count.toLocaleString('en-US');

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/40 via-white to-white text-textMain">
      <Header
        brandHref="/home"
        navItems={[
          { labelKey: 'nav.doctors', href: '/home#featured-doctors' },
          { labelKey: 'nav.howItWorks', href: '/home#how-it-works' },
          { labelKey: 'nav.forDoctors', href: '/home#for-doctors' },
          { labelKey: 'nav.about', href: '/about' }
        ]}
      />

      <main className="section-shell py-6 sm:py-8">
        {profileWasMissing && (
          <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{copy.notFound}</p>
        )}

        <section className="rounded-hero border border-borderGray bg-white p-5 shadow-card sm:p-7">
          <div className="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)] md:items-start">
            <div className="mx-auto w-full max-w-[220px] overflow-hidden rounded-[30px] border-4 border-white bg-primaryBg shadow-soft">
              <img src={therapist.photo_url} alt={therapist.name_en} className="aspect-[4/5] w-full object-cover" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black tracking-wide text-primary">{copy.profileTitle}</span>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{copy.verified}</span>
                {therapist.online_available && (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">{copy.onlineAvailable}</span>
                )}
                {therapist.in_person_available && (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">{copy.inPersonAvailable}</span>
                )}
              </div>

              <h1 className="mt-3 text-3xl font-black tracking-tight text-textMain sm:text-4xl" dir={isAr ? 'rtl' : 'ltr'}>
                {fullName}
              </h1>
              <p className="mt-2 text-base font-bold text-primary">{title}</p>
              <p className="mt-2 text-sm text-muted">
                {copy.location}: {locationText}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {(localizedSpecialties.length > 0 ? localizedSpecialties : [copy.fallback]).map((item) => (
                  <span key={item} className="rounded-full border border-borderGray bg-slate-50 px-3 py-1 text-xs font-semibold text-muted">
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { label: copy.yearsExp, value: yearsText },
                  { label: copy.practiceSince, value: practiceSinceText },
                  { label: copy.graduationYear, value: graduationYearText },
                  { label: copy.rating, value: ratingText },
                  { label: copy.sessionsCount, value: sessionsText },
                  { label: copy.languages, value: localizedLanguages.length > 0 ? localizedLanguages.join(' | ') : copy.fallback }
                ].map((item) => (
                  <article key={item.label} className="rounded-2xl border border-borderGray bg-primaryBg/50 px-4 py-3">
                    <p className="text-[11px] font-black uppercase tracking-wider text-primary/70">{item.label}</p>
                    <p className="mt-1 text-sm font-semibold text-textMain">{item.value}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 space-y-6">
          <section className="rounded-hero border border-borderGray bg-white p-5 shadow-card sm:p-6">
            <h2 className="text-xl font-black text-textMain sm:text-2xl">{copy.about}</h2>
            <p className="mt-4 text-sm leading-7 text-muted sm:text-base" dir={isAr ? 'rtl' : 'ltr'}>
              {aboutText}
            </p>
          </section>

          <section className="rounded-hero border border-borderGray bg-white p-5 shadow-card sm:p-6">
            <h2 className="text-xl font-black text-textMain sm:text-2xl">{copy.expertise}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {(localizedFocus.length > 0 ? localizedFocus : [copy.fallback]).map((item) => (
                <span key={item} className="rounded-full bg-primaryBg px-3 py-1 text-xs font-semibold text-primary">
                  {item}
                </span>
              ))}
            </div>

            <h3 className="mt-6 text-base font-bold text-textMain">{copy.approaches}</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {(localizedApproaches.length > 0 ? localizedApproaches : [copy.fallback]).map((item) => (
                <span key={item} className="rounded-full border border-borderGray px-3 py-1 text-xs font-medium text-muted">
                  {item}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-hero border border-borderGray bg-white p-5 shadow-card sm:p-6">
            <h2 className="text-xl font-black text-textMain sm:text-2xl">{copy.education}</h2>

            <div className="mt-4">
              <h3 className="text-base font-bold text-textMain">{copy.degrees}</h3>
              {localizedEducation.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {localizedEducation.map((item) => (
                    <li key={item} className="rounded-xl border border-borderGray bg-slate-50 px-4 py-3 text-sm text-muted">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted">{copy.fallback}</p>
              )}
            </div>

            <div className="mt-6">
              <h3 className="text-base font-bold text-textMain">{copy.licenses}</h3>
              {localizedLicenses.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {localizedLicenses.map((license) => (
                    <li key={`${license.license_name}-${license.license_number}-${license.issuer}`} className="rounded-xl border border-borderGray bg-slate-50 px-4 py-3 text-sm text-muted">
                      <p className="font-semibold text-textMain">{license.license_name}</p>
                      <p className="mt-1">
                        {isAr ? 'الرقم' : 'Number'}: {license.license_number || copy.fallback}
                      </p>
                      <p>
                        {isAr ? 'الجهة المصدرة' : 'Issuer'}: {license.issuer || copy.fallback}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted">{copy.fallback}</p>
              )}
            </div>

            <div className="mt-6">
              <h3 className="text-base font-bold text-textMain">{copy.memberships}</h3>
              {localizedMemberships.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {localizedMemberships.map((membership) => (
                    <li key={membership} className="rounded-xl border border-borderGray bg-slate-50 px-4 py-3 text-sm text-muted">
                      {membership}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted">{copy.fallback}</p>
              )}
            </div>

            <p className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{copy.verifiedInfo}</p>
          </section>

          <section className="rounded-hero border border-borderGray bg-white p-5 shadow-card sm:p-6">
            <h2 className="text-xl font-black text-textMain sm:text-2xl">{copy.practiceDetails}</h2>
            <dl className="mt-4 space-y-4">
              <div>
                <dt className="text-xs font-black uppercase tracking-wider text-primary/80">{copy.clinic}</dt>
                <dd className="mt-1 text-sm text-muted">{(isAr ? therapist.clinic_name_ar : therapist.clinic_name_en)?.trim() || copy.fallback}</dd>
              </div>
              <div>
                <dt className="text-xs font-black uppercase tracking-wider text-primary/80">{copy.primaryAddress}</dt>
                <dd className="mt-1 text-sm leading-7 text-muted">{primaryAddress}</dd>
              </div>
              <div>
                <dt className="text-xs font-black uppercase tracking-wider text-primary/80">{copy.addressNote}</dt>
                <dd className="mt-1 text-sm leading-7 text-muted">{altAddressNote}</dd>
              </div>
              <div>
                <dt className="text-xs font-black uppercase tracking-wider text-primary/80">{copy.officeHours}</dt>
                {localizedOfficeHours.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-sm text-muted">
                {localizedOfficeHours.map((item) => (
                      <li key={item}>- {item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-sm text-muted">{copy.fallback}</p>
                )}
              </div>
              <div>
                <dt className="text-xs font-black uppercase tracking-wider text-primary/80">{copy.publicFees}</dt>
                <dd className="mt-1 text-sm font-semibold text-textMain">{priceRange}</dd>
                <p className="mt-1 text-sm leading-7 text-muted">{feesNote}</p>
              </div>
              <div>
                <dt className="text-xs font-black uppercase tracking-wider text-primary/80">{copy.insurance}</dt>
                <dd className="mt-1 text-sm leading-7 text-muted">{insuranceNote}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-hero border border-borderGray bg-white p-5 shadow-card sm:p-6">
            <h2 className="text-xl font-black text-textMain sm:text-2xl">{copy.reputation}</h2>
            <div className="mt-4 rounded-2xl border border-borderGray bg-slate-50 p-5">
              <p className="text-3xl font-black text-textMain">{ratingText}</p>
              <p className="mt-2 text-sm text-muted">{copy.reviewSummary}</p>
              {therapist.reviews_count <= 0 && <p className="mt-3 text-sm text-muted">{copy.noReviews}</p>}
            </div>
          </section>

          <section className="rounded-hero border border-borderGray bg-white p-5 shadow-card sm:p-6">
            <h2 className="text-xl font-black text-textMain sm:text-2xl">{copy.mediaPresence}</h2>
            {localizedMedia.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {localizedMedia.map((item) => (
                  <li key={item} className="rounded-xl border border-borderGray bg-slate-50 px-4 py-3 text-sm text-muted">
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted">{copy.fallback}</p>
            )}
          </section>

          <section className="rounded-hero border border-borderGray bg-white p-5 shadow-card sm:p-6">
            <h2 className="text-xl font-black text-textMain sm:text-2xl">{copy.records}</h2>
            <p className="mt-3 text-sm leading-7 text-muted">
              {copy.recordsNotePrefix} {therapist.no_public_disciplinary_record_as_of ?? copy.fallback}: {copy.recordsNote}
            </p>
          </section>

          <section className="rounded-hero border border-borderGray bg-white p-5 shadow-card sm:p-6">
            <h2 className="text-xl font-black text-textMain sm:text-2xl">{copy.referenceLinks}</h2>
            {therapist.booking_links && therapist.booking_links.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {therapist.booking_links.map((link) => (
                  <li key={link.url} className="rounded-xl border border-borderGray bg-slate-50 px-4 py-3 text-sm text-muted">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-primary underline-offset-4 hover:underline"
                    >
                      {isAr ? link.label_ar : link.label_en}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted">{copy.fallback}</p>
            )}
          </section>

          <section className="rounded-hero border border-red-200 bg-red-50 p-5 shadow-card sm:p-6">
            <h2 className="text-xl font-black text-red-900 sm:text-2xl">{copy.safety}</h2>
            <p className="mt-3 text-sm leading-7 text-red-800">{copy.crisisText}</p>
            <a
              href="https://findahelpline.com/"
              target="_blank"
              rel="noreferrer"
              className="focus-outline mt-4 inline-flex items-center rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-800 transition hover:bg-red-100"
            >
              {copy.hotline}
            </a>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
