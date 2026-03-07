import { useMemo, useState } from 'react';
import { DOCTOR_MATCH_QUESTIONS, INITIAL_FILTERS, TYPE_DESCRIPTIONS, TYPE_TITLES, type MatchFilters } from '../data/doctorMatchingTest';
import { useLanguage } from '../context/LanguageContext';
import { fetchFirstReachable, getBackendOrigin } from '../utils/api';
import { navigateTo } from '../utils/auth';
import './DoctorSurveyPage.css';

type MatchDoctor = {
  similarity: number;
  doctor_type_code: string;
  doctor: {
    doctor_user_id: string;
    slug: string;
    display_name: string;
    headline: string | null;
    photo_url: string | null;
    specialties: string[] | null;
    languages: string[] | null;
    session_types: string[] | null;
    gender_identity: string | null;
    insurance_providers: string[] | null;
    location_city: string | null;
    location_country: string | null;
    next_available_at: string | null;
    rating: number | string | null;
    reviews_count: number;
    pricing_currency: string;
    pricing_per_session: number | string | null;
    verification_badges: string[] | null;
  };
};

type MatchResponse = {
  user_type_code: string;
  label: string;
  doctors: MatchDoctor[];
};

const QUESTIONS_PER_PAGE = 6;
const TOTAL_QUESTION_PAGES = Math.ceil(DOCTOR_MATCH_QUESTIONS.length / QUESTIONS_PER_PAGE);
const TOTAL_STEPS = TOTAL_QUESTION_PAGES + 1;
const SCALE_VALUES = [5, 4, 3, 2, 1] as const;

const ARABIC_QUESTION_STATEMENTS: Record<string, string> = {
  care_1: 'أفضل أن يخبرني الطبيب بما يجب أن أفعله بالضبط.',
  care_2: 'أحب مناقشة خيارات علاج متعددة.',
  care_3: 'أريد جلسات منظمة بخطط واضحة.',
  care_4: 'أفضل الحوار المفتوح على الالتزام الصارم بالبنية.',
  care_5: 'أثق بالسلطة المهنية أكثر من النقاش.',
  care_6: 'أرغب بالمشاركة الفعالة في اتخاذ القرار.',
  care_7: 'أتقدم بشكل أفضل عندما يعطيني الطبيب خطوات عملية واضحة.',
  care_8: 'أفضل خطة علاج مشتركة على التوجيه الثابت.',
  approach_1: 'أفضل أساليب علاجية علمية ومنظمة.',
  approach_2: 'أريد أخذ العوامل العاطفية ونمط الحياة بعين الاعتبار بعمق.',
  approach_3: 'أقدّر التشخيص الرسمي قبل بدء العلاج.',
  approach_4: 'أفضل أساليب علاج مرنة.',
  approach_5: 'أثق بالأطر السريرية المعتمدة.',
  approach_6: 'أؤمن أن الوقاية ونمط الحياة جزء أساسي من التعافي.',
  approach_7: 'أفضل نتائج علاج قابلة للقياس وبروتوكولات واضحة.',
  approach_8: 'أريد أن تكون رعايتي النفسية مرتبطة بعادات الحياة اليومية.',
  specialization_1: 'أريد معالجًا يتعامل مع حالات متعددة ومختلفة.',
  specialization_2: 'أفضل شخصًا متخصصًا بعمق في مشكلتي.',
  specialization_3: 'أنا غير متأكد تمامًا من طبيعة مشكلتي.',
  specialization_4: 'أعرف تمامًا ما الذي أحتاج المساعدة فيه.',
  specialization_5: 'أفضل دعمًا عامًا بدل التركيز الضيق.',
  specialization_6: 'أريد خبيرًا في حالة محددة جدًا.',
  specialization_7: 'أبحث عن إرشاد عام للصحة النفسية.',
  specialization_8: 'أفضل العمل مع أخصائي دقيق أكثر من معالج عام.',
};

const COPY = {
  en: {
    pageKicker: 'Sabina Therapy · Doctor Matching Test',
    introTitle: 'Find Your Best-Match Mental Health Doctor',
    introLead:
      'This 24-question assessment maps your care preferences across doctor style, medical approach, and specialization level.',
    introQuestions: '24 questions',
    introScale: '5-point Likert scale',
    introDuration: 'About 6-8 minutes',
    start: 'Start Test',
    back: 'Back',
    minLeft: 'min left',
    step: 'Step',
    disagree: 'Disagree',
    agree: 'Agree',
    next: 'Next',
    filtersTag: 'FILTERS (OPTIONAL)',
    filtersTitle: 'Refine your doctor shortlist',
    filtersLead: 'These fields do not affect your type code, they only narrow the doctor pool.',
    gender: 'Preferred doctor gender',
    language: 'Preferred language',
    sessionType: 'Session type',
    budgetMin: 'Budget min',
    budgetMax: 'Budget max',
    location: 'Location',
    insurance: 'Insurance provider',
    any: 'Any',
    female: 'Female',
    male: 'Male',
    arabic: 'Arabic',
    english: 'English',
    onlineAny: 'Online (Any)',
    onlineVideo: 'Online (Video)',
    onlineCall: 'Online (Call)',
    onlineChat: 'Online (Chat)',
    pricePlaceholderMin: 'e.g. 40',
    pricePlaceholderMax: 'e.g. 120',
    locationPlaceholder: 'City, country, or online',
    insurancePlaceholder: 'e.g. MedNet',
    matching: 'Matching doctors...',
    seeMatches: 'See My Matches',
    typeTitle: 'Your Doctor Type',
    verified: 'Verified',
    doctorFallbackTitle: 'Mental Health Doctor',
    locationMissing: 'Location not listed',
    typeFit: 'Type fit',
    noRating: 'No rating yet',
    fromReviews: 'from',
    reviews: 'reviews',
    viewProfile: 'View Profile',
    retake: 'Retake Test',
    ratingFor: 'Rate',
    availabilityNotListed: 'Availability not listed',
    availableToday: 'Available today',
    availableInOneDay: 'Available in 1 day',
    availableInDays: 'Available in {days} days',
    contactPricing: 'Contact for pricing',
    perSession: '/ session',
  },
  ar: {
    pageKicker: 'سابينا ثيرابي · اختبار مطابقة الطبيب',
    introTitle: 'اعثر على أفضل طبيب نفسي مناسب لك',
    introLead:
      'هذا التقييم المكوّن من 24 سؤالًا يحدد تفضيلاتك في أسلوب الرعاية والمنهج الطبي ومستوى التخصص.',
    introQuestions: '24 سؤال',
    introScale: 'مقياس ليكرت من 5 درجات',
    introDuration: 'حوالي 6-8 دقائق',
    start: 'ابدأ الاختبار',
    back: 'رجوع',
    minLeft: 'دقائق متبقية',
    step: 'الخطوة',
    disagree: 'لا أوافق',
    agree: 'أوافق',
    next: 'التالي',
    filtersTag: 'الفلاتر (اختياري)',
    filtersTitle: 'حسّن قائمة الأطباء المقترحة',
    filtersLead: 'هذه الحقول لا تؤثر على نوعك، لكنها تقلل نطاق نتائج الأطباء.',
    gender: 'جنس الطبيب المفضل',
    language: 'اللغة المفضلة',
    sessionType: 'نوع الجلسة',
    budgetMin: 'أقل ميزانية',
    budgetMax: 'أعلى ميزانية',
    location: 'الموقع',
    insurance: 'مزود التأمين',
    any: 'الكل',
    female: 'أنثى',
    male: 'ذكر',
    arabic: 'العربية',
    english: 'الإنجليزية',
    onlineAny: 'أونلاين (الكل)',
    onlineVideo: 'أونلاين (فيديو)',
    onlineCall: 'أونلاين (مكالمة)',
    onlineChat: 'أونلاين (دردشة)',
    pricePlaceholderMin: 'مثال: 40',
    pricePlaceholderMax: 'مثال: 120',
    locationPlaceholder: 'مدينة، دولة، أو أونلاين',
    insurancePlaceholder: 'مثال: MedNet',
    matching: 'جارٍ مطابقة الأطباء...',
    seeMatches: 'عرض النتائج',
    typeTitle: 'نوع الطبيب المناسب لك',
    verified: 'موثق',
    doctorFallbackTitle: 'طبيب صحة نفسية',
    locationMissing: 'الموقع غير متوفر',
    typeFit: 'نسبة التطابق',
    noRating: 'لا يوجد تقييم بعد',
    fromReviews: 'من',
    reviews: 'تقييم',
    viewProfile: 'عرض الملف الشخصي',
    retake: 'إعادة الاختبار',
    ratingFor: 'تقييم',
    availabilityNotListed: 'التوفر غير مذكور',
    availableToday: 'متاح اليوم',
    availableInOneDay: 'متاح خلال يوم واحد',
    availableInDays: 'متاح خلال {days} أيام',
    contactPricing: 'تواصل لمعرفة السعر',
    perSession: '/ جلسة',
  },
} as const;

function resolveMediaUrl(url: string | null): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return trimmed;

  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  if (typeof window !== 'undefined' && path.startsWith('/images/')) {
    return `${window.location.origin}${path}`;
  }
  const base = getBackendOrigin();
  return `${base}${path}`;
}

function availabilityLabel(nextAvailableAt: string | null, lang: 'en' | 'ar'): string {
  const copy = COPY[lang];
  if (!nextAvailableAt) return copy.availabilityNotListed;
  const diff = Date.parse(nextAvailableAt) - Date.now();
  if (Number.isNaN(diff)) return copy.availabilityNotListed;
  if (diff <= 0) return copy.availableToday;
  const days = Math.ceil(diff / 86_400_000);
  if (days === 1) return copy.availableInOneDay;
  return copy.availableInDays.replace('{days}', String(days));
}

function formatPrice(amount: number | string | null, currency: string, lang: 'en' | 'ar'): string {
  const copy = COPY[lang];
  if (amount === null || amount === '') return copy.contactPricing;
  const value = Number(amount);
  if (Number.isNaN(value)) return copy.contactPricing;
  return `${value} ${currency} ${copy.perSession}`;
}

function typeLabel(code: string, lang: 'en' | 'ar'): string {
  if (code.length !== 3) return code;
  if (lang === 'ar') {
    const arTitles: Record<string, string> = {
      D: 'توجيهي',
      C: 'تعاوني',
      E: 'سريري',
      H: 'شمولي',
      G: 'عام',
      S: 'متخصص',
    };
    return `${arTitles[code[0]]} ${arTitles[code[1]]} ${arTitles[code[2]]}`;
  }
  return `${TYPE_TITLES[code[0]]} ${TYPE_TITLES[code[1]]} ${TYPE_TITLES[code[2]]}`;
}

function statementLabel(questionId: string, fallback: string, lang: 'en' | 'ar'): string {
  if (lang === 'ar') return ARABIC_QUESTION_STATEMENTS[questionId] ?? fallback;
  return fallback;
}

function toRequestFilters(filters: MatchFilters) {
  const request: Record<string, string | number> = {};

  if (filters.gender) request.gender = filters.gender;
  if (filters.language) request.language = filters.language;
  if (filters.sessionType) request.session_type = filters.sessionType;
  if (filters.location) request.location = filters.location;
  if (filters.insuranceProvider) request.insurance_provider = filters.insuranceProvider;

  if (filters.minPrice) {
    const min = Number(filters.minPrice);
    if (!Number.isNaN(min)) request.min_price = min;
  }

  if (filters.maxPrice) {
    const max = Number(filters.maxPrice);
    if (!Number.isNaN(max)) request.max_price = max;
  }

  return request;
}

function ResultCard({ item, lang }: { item: MatchDoctor; lang: 'en' | 'ar' }) {
  const copy = COPY[lang];
  const doctor = item.doctor;
  const profilePath = `/doctors/${doctor.slug}`;
  const rating = doctor.rating === null ? 0 : Number(doctor.rating);
  const safeRating = Number.isNaN(rating) ? 0 : rating;
  const isVerified = (doctor.verification_badges ?? []).includes('VERIFIED_DOCTOR');
  const highlights = [
    `${copy.typeFit}: ${(item.similarity * 100).toFixed(0)}% (${item.doctor_type_code})`,
    `${safeRating > 0 ? `${safeRating.toFixed(1)}★` : copy.noRating} ${copy.fromReviews} ${doctor.reviews_count} ${copy.reviews}`,
    availabilityLabel(doctor.next_available_at, lang),
  ];

  return (
    <article className="match-result-card">
      <div className="match-result-head">
        {resolveMediaUrl(doctor.photo_url) ? (
          <img src={resolveMediaUrl(doctor.photo_url)} alt={doctor.display_name} className="match-avatar" />
        ) : (
          <div className="match-avatar match-avatar-fallback">{doctor.display_name.slice(0, 2).toUpperCase()}</div>
        )}

        <div className="match-meta">
          <div className="match-name-row">
            <h3>{doctor.display_name}</h3>
            {isVerified ? <span className="match-verified">{copy.verified}</span> : null}
          </div>
          <p className="match-title">{doctor.headline ?? copy.doctorFallbackTitle}</p>
          <p className="match-subline">
            {[doctor.location_city, doctor.location_country].filter(Boolean).join(' · ') || copy.locationMissing}
            {' · '}
            {formatPrice(doctor.pricing_per_session, doctor.pricing_currency, lang)}
          </p>
        </div>
      </div>

      <ul className="match-highlights">
        {highlights.map((highlight) => (
          <li key={highlight}>{highlight}</li>
        ))}
      </ul>

      <button
        type="button"
        className="match-primary-btn"
        onClick={() => {
          window.history.pushState({}, '', profilePath);
          window.dispatchEvent(new PopStateEvent('popstate'));
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      >
        {copy.viewProfile}
      </button>
    </article>
  );
}

export default function DoctorSurveyPage() {
  const { lang, setLang } = useLanguage();
  const copy = COPY[lang];
  const localizedTypeDescriptions = useMemo(() => {
    if (lang === 'en') return TYPE_DESCRIPTIONS;
    return {
      DEG: 'تفضّل توجيهًا واضحًا ونهجًا سريريًا منظمًا مع دعم عام واسع لأهداف الصحة النفسية.',
      DES: 'تفضّل التوجيه المباشر والبنية السريرية مع متخصص مركّز لمخاوفك المحددة.',
      DHG: 'تحب قيادة الطبيب الواضحة مع نظرة شمولية تدعم احتياجاتك العامة.',
      DHS: 'تريد طبيبًا توجيهيًا يجمع بين الرعاية التكاملية والتركيز التخصصي العميق.',
      CEG: 'تفضّل القرار المشترك والرعاية المبنية على الأدلة مع دعم مرن وشامل.',
      CES: 'تريد رعاية تعاونية دقيقة سريريًا مع متخصص في المشكلة الأساسية لديك.',
      CHG: 'تفضّل رعاية تعاونية شاملة مع طبيب عام يدعمك عبر سياقات الحياة المختلفة.',
      CHS: 'تبحث عن رعاية تعاونية تكاملية من متخصص يركز بعمق على احتياجك المحدد.',
    } as Record<string, string>;
  }, [lang]);
  const [phase, setPhase] = useState<'intro' | 'question' | 'filters' | 'results'>('intro');
  const [pageIndex, setPageIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [filters, setFilters] = useState<MatchFilters>(INITIAL_FILTERS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MatchResponse | null>(null);

  const batchStart = pageIndex * QUESTIONS_PER_PAGE;
  const currentBatch = DOCTOR_MATCH_QUESTIONS.slice(batchStart, batchStart + QUESTIONS_PER_PAGE);
  const isBatchComplete = currentBatch.every((q) => Boolean(answers[q.id]));

  const progress = useMemo(() => {
    if (phase === 'intro') return 0;
    if (phase === 'question') return ((pageIndex + 1) / TOTAL_STEPS) * 100;
    if (phase === 'filters') return ((TOTAL_STEPS - 1) / TOTAL_STEPS) * 100;
    return 100;
  }, [phase, pageIndex]);

  const answeredCount = Object.keys(answers).length;
  const estimatedRemainingMinutes = Math.max(1, Math.ceil((DOCTOR_MATCH_QUESTIONS.length - answeredCount) / 4));

  const onNextPage = () => {
    if (!isBatchComplete) return;
    if (pageIndex < TOTAL_QUESTION_PAGES - 1) {
      setPageIndex((prev) => prev + 1);
      return;
    }
    setPhase('filters');
  };

  const onBack = () => {
    setError(null);
    if (phase === 'intro') {
      navigateTo('/home');
      return;
    }
    if (phase === 'question') {
      if (pageIndex === 0) {
        setPhase('intro');
        return;
      }
      setPageIndex((prev) => prev - 1);
      return;
    }
    if (phase === 'filters') {
      setPhase('question');
      setPageIndex(TOTAL_QUESTION_PAGES - 1);
      return;
    }
    setPhase('filters');
  };

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchFirstReachable('/matching/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, filters: toRequestFilters(filters) }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(payload?.detail ?? `Match request failed (${response.status})`);
      }

      const data = (await response.json()) as MatchResponse;
      setResult(data);
      setPhase('results');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to match doctors right now.');
    } finally {
      setLoading(false);
    }
  };

  if (phase === 'intro') {
    return (
      <div className="match-page">
        <section className="match-shell intro-shell">
          <p className="match-kicker">{copy.pageKicker}</p>
          <h1>{copy.introTitle}</h1>
          <p className="match-lead">{copy.introLead}</p>
          <div className="intro-meta">
            <span>{copy.introQuestions}</span>
            <span>{copy.introScale}</span>
            <span>{copy.introDuration}</span>
          </div>
          <button type="button" className="match-primary-btn" onClick={() => setPhase('question')}>
            {copy.start}
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="match-page">
      <header className="match-header">
        <button type="button" className="match-back-btn" onClick={onBack}>
          ← {copy.back}
        </button>
        <div className="match-progress-wrap">
          <div className="match-progress-bar">
            <div className="match-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <p>
            {copy.step} {phase === 'question' ? pageIndex + 1 : TOTAL_STEPS} / {TOTAL_STEPS}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="match-back-btn"
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
          >
            {lang === 'en' ? 'AR' : 'EN'}
          </button>
          <span className="match-time">~{estimatedRemainingMinutes} {copy.minLeft}</span>
        </div>
      </header>

      <main className="match-shell">
        {phase === 'question' ? (
          <section className="match-likert-card">
            {currentBatch.map((question) => (
              <div key={question.id} className="likert-row">
                <p className="likert-statement">{statementLabel(question.id, question.statement, lang)}</p>
                <div className="likert-scale-wrap">
                  <span className="likert-side-label">{copy.disagree}</span>
                  <div className="likert-circles" role="radiogroup" aria-label={statementLabel(question.id, question.statement, lang)}>
                    {SCALE_VALUES.map((value, idx) => {
                      const selected = answers[question.id] === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          className={`likert-circle circle-${idx + 1} ${selected ? 'selected' : ''}`}
                          onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: value }))}
                          aria-pressed={selected}
                          aria-label={`${copy.ratingFor} ${value}`}
                        />
                      );
                    })}
                  </div>
                  <span className="likert-side-label">{copy.agree}</span>
                </div>
              </div>
            ))}

            <button type="button" className="match-primary-btn" disabled={!isBatchComplete} onClick={onNextPage}>
              {copy.next}
            </button>
          </section>
        ) : null}

        {phase === 'filters' ? (
          <section className="match-question-card">
            <p className="match-dimension">{copy.filtersTag}</p>
            <h2>{copy.filtersTitle}</h2>
            <p className="match-lead">{copy.filtersLead}</p>

            <div className="filter-grid">
              <label>
                {copy.gender}
                <select value={filters.gender} onChange={(e) => setFilters((prev) => ({ ...prev, gender: e.target.value }))}>
                  <option value="">{copy.any}</option>
                  <option value="Female">{copy.female}</option>
                  <option value="Male">{copy.male}</option>
                </select>
              </label>

              <label>
                {copy.language}
                <select value={filters.language} onChange={(e) => setFilters((prev) => ({ ...prev, language: e.target.value }))}>
                  <option value="">{copy.any}</option>
                  <option value="Arabic">{copy.arabic}</option>
                  <option value="English">{copy.english}</option>
                </select>
              </label>

              <label>
                {copy.sessionType}
                <select value={filters.sessionType} onChange={(e) => setFilters((prev) => ({ ...prev, sessionType: e.target.value }))}>
                  <option value="">{copy.any}</option>
                  <option value="ONLINE">{copy.onlineAny}</option>
                  <option value="VIDEO">{copy.onlineVideo}</option>
                  <option value="AUDIO">{copy.onlineCall}</option>
                  <option value="CHAT">{copy.onlineChat}</option>
                </select>
              </label>

              <label>
                {copy.budgetMin}
                <input
                  type="number"
                  min={0}
                  inputMode="decimal"
                  value={filters.minPrice}
                  onChange={(e) => setFilters((prev) => ({ ...prev, minPrice: e.target.value }))}
                  placeholder={copy.pricePlaceholderMin}
                />
              </label>

              <label>
                {copy.budgetMax}
                <input
                  type="number"
                  min={0}
                  inputMode="decimal"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters((prev) => ({ ...prev, maxPrice: e.target.value }))}
                  placeholder={copy.pricePlaceholderMax}
                />
              </label>

              <label>
                {copy.location}
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => setFilters((prev) => ({ ...prev, location: e.target.value }))}
                  placeholder={copy.locationPlaceholder}
                />
              </label>

              <label>
                {copy.insurance}
                <input
                  type="text"
                  value={filters.insuranceProvider}
                  onChange={(e) => setFilters((prev) => ({ ...prev, insuranceProvider: e.target.value }))}
                  placeholder={copy.insurancePlaceholder}
                />
              </label>
            </div>

            {error ? <p className="match-error">{error}</p> : null}

            <button type="button" className="match-primary-btn" onClick={submit} disabled={loading}>
              {loading ? copy.matching : copy.seeMatches}
            </button>
          </section>
        ) : null}

        {phase === 'results' && result ? (
          <section className="match-results">
            <p className="match-kicker">{copy.typeTitle}</p>
            <h2>
              🧠 {result.user_type_code} · {typeLabel(result.user_type_code, lang)}
            </h2>
            <p className="match-lead">{localizedTypeDescriptions[result.user_type_code] ?? result.label}</p>

            <div className="match-results-grid">
              {result.doctors.map((item) => (
                <ResultCard key={item.doctor.doctor_user_id} item={item} lang={lang} />
              ))}
            </div>

            <button
              type="button"
              className="match-secondary-btn"
              onClick={() => {
                setPageIndex(0);
                setAnswers({});
                setFilters(INITIAL_FILTERS);
                setResult(null);
                setPhase('intro');
              }}
            >
              {copy.retake}
            </button>
          </section>
        ) : null}
      </main>
    </div>
  );
}
