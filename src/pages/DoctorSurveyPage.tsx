import { useState, useEffect, useRef } from 'react';
import { surveySteps, SurveyAnswers, TOTAL_STEPS, QuestionStep } from '../data/surveyData';
import { matchDoctors, MatchedDoctor, ApiDoctor } from '../utils/matchingEngine';
import { fetchFirstReachable } from '../utils/api';
import { navigateTo } from '../utils/auth';
import { useLanguage } from '../context/LanguageContext';
import './DoctorSurveyPage.css';

const surveyStepsAr: QuestionStep[] = [
    {
        id: 'care_goal',
        index: 1,
        title: 'ما الذي دفعك لبدء العلاج النفسي؟',
        subtitle: 'اختر الخيار الأقرب لما تشعر به الآن.',
        type: 'single',
        required: true,
        options: [
            { id: 'anxiety_stress', label: 'قلق أو توتر', emoji: '😰', sublabel: 'قلق مستمر أو نوبات هلع' },
            { id: 'depression', label: 'حزن أو اكتئاب', emoji: '😔', sublabel: 'مزاج منخفض وفقدان اهتمام' },
            { id: 'trauma', label: 'صدمة أو أحداث مؤلمة', emoji: '💔', sublabel: 'ذكريات صعبة أو آثار نفسية' },
            { id: 'relationships', label: 'مشاكل في العلاقات', emoji: '💑', sublabel: 'زوجية أو أسرية أو تواصل' },
            { id: 'work_burnout', label: 'ضغط العمل أو الإرهاق', emoji: '💼', sublabel: 'إجهاد مهني واستنزاف' },
            { id: 'self_growth', label: 'تطوير الذات', emoji: '🌱', sublabel: 'وعي ذاتي وتحسين الحياة' },
            { id: 'child_support', label: 'دعم لطفلي', emoji: '👶', sublabel: 'سلوك، مدرسة، فرط حركة' },
            { id: 'other', label: 'لست متأكدًا بعد', emoji: '💬', sublabel: 'ساعدني أكتشف الأنسب' },
        ],
        nextStep: 'concern_detail',
    },
    {
        id: 'concern_detail',
        index: 2,
        title: 'أي خيار يصف حالتك بشكل أدق؟',
        subtitle: 'اختيارك يساعدنا في مطابقتك مع المختص المناسب.',
        type: 'single',
        required: true,
        options: [
            { id: 'ocd', label: 'أفكار وسواسية أو طقوس متكررة', emoji: '🔄' },
            { id: 'panic', label: 'نوبات هلع', emoji: '🫀' },
            { id: 'grief', label: 'حزن أو فقدان', emoji: '🕊️' },
            { id: 'addiction', label: 'إدمان أو اعتماد', emoji: '🔗' },
            { id: 'adhd', label: 'فرط حركة وتشتت انتباه', emoji: '🧩' },
            { id: 'phobia', label: 'رهاب أو خوف محدد', emoji: '😨' },
            { id: 'insomnia', label: 'مشاكل النوم', emoji: '🌙' },
            { id: 'anger', label: 'الغضب أو صعوبة ضبط المشاعر', emoji: '🌡️' },
            { id: 'general_talk', label: 'أحتاج فقط شخصًا أتحدث معه', emoji: '🗣️' },
        ],
        nextStep: 'red_flag_screen',
    },
    {
        id: 'red_flag_screen',
        index: 3,
        title: 'قبل المتابعة، هل ينطبق عليك أي مما يلي الآن؟',
        subtitle: 'سلامتك أولًا. إجابتك سرية.',
        type: 'boolean-grid',
        isSafetyGate: true,
        required: true,
        options: [
            { id: 'self_harm', label: 'أفكار بإيذاء نفسي' },
            { id: 'suicidal', label: 'أفكار انتحارية أو عدم الرغبة في الحياة' },
            { id: 'harm_others', label: 'أفكار بإيذاء شخص آخر' },
            { id: 'crisis_now', label: 'أنا في أزمة نفسية الآن' },
            { id: 'none', label: 'لا شيء مما سبق - أنا بخير حاليًا', overrideNext: 'who_is_it_for' },
        ],
        nextStep: 'who_is_it_for',
    },
    {
        id: 'who_is_it_for',
        index: 4,
        title: 'من سيحضر الجلسات؟',
        subtitle: 'هذا يساعدنا في اختيار التخصص الأنسب.',
        type: 'single',
        required: true,
        options: [
            { id: 'myself_adult', label: 'أنا (بالغ)', emoji: '👤' },
            { id: 'myself_teen', label: 'أنا (مراهق 13-17)', emoji: '🧑' },
            { id: 'my_child', label: 'طفلي (أقل من 13)', emoji: '🧒' },
            { id: 'couple', label: 'أنا وشريكي', emoji: '💑' },
            { id: 'family', label: 'العائلة كاملة', emoji: '👨‍👩‍👧' },
        ],
        nextStep: 'session_format',
    },
    {
        id: 'session_format',
        index: 5,
        title: 'ما طريقة الجلسة التي تفضلها؟',
        subtitle: 'سنرشح لك مختصين يقدمون هذا النوع من الجلسات.',
        type: 'single',
        required: true,
        options: [
            { id: 'in_person', label: 'حضوري في العيادة', emoji: '🏥', sublabel: 'جلسات مباشرة' },
            { id: 'online', label: 'أونلاين', emoji: '💻', sublabel: 'مكالمة فيديو آمنة' },
            { id: 'either', label: 'كلاهما مناسب', emoji: '✨', sublabel: 'أنا مرن' },
        ],
        nextStep: 'therapist_preference',
    },
    {
        id: 'therapist_preference',
        index: 6,
        title: 'هل لديك تفضيلات لمعالجك؟',
        subtitle: 'اختياري، والأولوية لصحتك.',
        type: 'single',
        required: false,
        options: [
            { id: 'lang_arabic', label: 'معالج يتحدث العربية', emoji: '🌍' },
            { id: 'lang_english', label: 'معالج يتحدث الإنجليزية', emoji: '🇬🇧' },
            { id: 'gender_female', label: 'معالجة', emoji: '👩‍⚕️' },
            { id: 'gender_male', label: 'معالج', emoji: '👨‍⚕️' },
            { id: 'no_pref', label: 'لا يوجد تفضيل', emoji: '✨' },
        ],
        nextStep: 'approach_style',
    },
    {
        id: 'approach_style',
        index: 7,
        title: 'ما الأسلوب العلاجي الذي يناسبك؟',
        subtitle: 'يساعدنا على ترشيح معالج متوافق معك.',
        type: 'single',
        required: false,
        options: [
            { id: 'cbt', label: 'عملي ومنظم (CBT)', emoji: '🧠', sublabel: 'العلاج المعرفي السلوكي' },
            { id: 'mindfulness', label: 'تأملي وهادئ', emoji: '🧘', sublabel: 'مقاربات اليقظة الذهنية' },
            { id: 'psychodynamic', label: 'استكشاف عميق', emoji: '🔍', sublabel: 'فهم الجذور العميقة' },
            { id: 'supportive', label: 'داعم وحواري', emoji: '🗣️', sublabel: 'استماع وإرشاد' },
            { id: 'no_pref_app', label: 'لا يوجد تفضيل', emoji: '✨' },
        ],
        nextStep: 'priority',
    },
    {
        id: 'priority',
        index: 8,
        title: 'ما الأولوية الأهم عند اختيار المعالج؟',
        subtitle: 'بناءً عليها نرتب النتائج.',
        type: 'single',
        required: true,
        options: [
            { id: 'fastest', label: 'أقرب موعد متاح', emoji: '⚡', sublabel: 'أريد البدء سريعًا' },
            { id: 'experienced', label: 'الأكثر خبرة', emoji: '🏆', sublabel: 'خبرة طويلة' },
            { id: 'top_rated', label: 'الأعلى تقييمًا', emoji: '⭐', sublabel: 'موثوق من المرضى' },
            { id: 'balanced', label: 'أفضل تطابق شامل', emoji: '⚖️', sublabel: 'توازن بين كل العوامل' },
        ],
        nextStep: null,
    },
];

// ── Step Option Card ──────────────────────────────────────────────────────────
function StepCard({
    step,
    answers,
    onAnswer,
}: {
    step: QuestionStep;
    answers: SurveyAnswers;
    onAnswer: (stepId: string, value: string) => void;
}) {
    const current = answers[step.id] as string | undefined;

    return (
        <div className={`survey-options-grid ${step.id === 'red_flag_screen' ? 'survey-options-list' : ''}`}>
            {step.options?.map(opt => {
                const isSelected = current === opt.id;
                return (
                    <button
                        key={opt.id}
                        className={`survey-option-card ${isSelected ? 'selected' : ''} ${opt.id === 'none' ? 'survey-option-safe' : ''}`}
                        onClick={() => onAnswer(step.id, opt.id)}
                        aria-pressed={isSelected}
                    >
                        {opt.emoji && <span className="survey-option-emoji">{opt.emoji}</span>}
                        <span className="survey-option-text">
                            <span className="survey-option-label">{opt.label}</span>
                            {opt.sublabel && <span className="survey-option-sublabel">{opt.sublabel}</span>}
                        </span>
                        {isSelected && <span className="survey-option-check">✓</span>}
                    </button>
                );
            })}
        </div>
    );
}

// ── Doctor Result Card (real API doctor) ──────────────────────────────────────
function DoctorResultCard({ doctor, rank, delay }: { doctor: MatchedDoctor; rank: number; delay: number }) {
    const { lang } = useLanguage();
    const isAr = lang === 'ar';
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setVisible(true), delay);
        return () => clearTimeout(t);
    }, [delay]);

    const { nextAvailableDays } = doctor;
    const availText =
        nextAvailableDays === 0 ? '✅ Available today'
            : nextAvailableDays === 1 ? '🟢 Available tomorrow'
                : nextAvailableDays <= 99 ? `🟡 Available in ${nextAvailableDays} days`
                    : '🔵 Check availability';

    const types = (doctor.session_types ?? []).map(s => s.toUpperCase());
    const hasOnline = types.some(t => ['VIDEO', 'AUDIO', 'CHAT', 'ONLINE'].includes(t));
    const hasInPerson = types.includes('IN_PERSON');
    const formatLabel = [hasOnline ? (isAr ? 'أونلاين' : 'Online') : null, hasInPerson ? (isAr ? 'حضوري' : 'In-person') : null]
        .filter(Boolean)
        .join(' · ');

    const isVerified = (doctor.verification_badges ?? []).includes('VERIFIED_DOCTOR');
    const profilePath = `/doctors/${doctor.slug}`;

    function goToProfile(action?: string) {
        const path = action ? `${profilePath}?action=${action}` : profilePath;
        window.history.pushState({}, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    return (
        <div
            className={`survey-result-card ${doctor.isRecommended ? 'recommended' : ''} ${visible ? 'visible' : ''}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {doctor.isRecommended && (
                <div className="survey-result-badge">{isAr ? '⭐ موصى به لك' : '⭐ Recommended for you'}</div>
            )}
            {!doctor.isRecommended && <div className="survey-result-rank">#{rank}</div>}

            <div className="survey-result-header">
                {doctor.resolvedPhotoUrl ? (
                    <img src={doctor.resolvedPhotoUrl} alt={doctor.display_name} className="survey-result-avatar" />
                ) : (
                    <div className="survey-result-avatar survey-result-avatar-initials">
                        {doctor.display_name.replace('Dr. ', '').split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()}
                    </div>
                )}

                <div className="survey-result-meta">
                    <div className="survey-result-name-row">
                        <h3 className="survey-result-name">{doctor.display_name}</h3>
                        {isVerified && <span className="survey-verified-badge">✓ Verified</span>}
                    </div>
                    <p className="survey-result-title">{doctor.headline ?? (isAr ? 'معالج نفسي' : 'Therapist')}</p>

                    <div className="survey-result-tags">
                        {doctor.resolvedLocation && (
                            <span className="survey-tag survey-tag-city">📍 {doctor.resolvedLocation}</span>
                        )}
                        <span className="survey-tag survey-tag-avail">{availText}</span>
                        {formatLabel && <span className="survey-tag survey-tag-format">🎥 {formatLabel}</span>}
                        <span className="survey-tag survey-tag-fee">💰 {doctor.resolvedPrice}</span>
                    </div>

                    <div className="survey-result-rating">
                        {doctor.resolvedRating > 0 && (
                            <>
                                <span className="survey-stars">{'★'.repeat(Math.floor(doctor.resolvedRating))}</span>
                                <span className="survey-rating-value">{doctor.resolvedRating.toFixed(1)}</span>
                            </>
                        )}
                        <span className="survey-review-count">({doctor.reviews_count} {isAr ? 'تقييمات' : 'reviews'})</span>
                    </div>
                </div>
            </div>

            {/* Specialties / concern tags */}
            {(doctor.specialties ?? []).length > 0 && (
                <ul className="survey-specialty-tags">
                    {(doctor.specialties ?? []).slice(0, 4).map(tag => (
                        <li key={tag} className="survey-specialty-tag">{tag}</li>
                    ))}
                </ul>
            )}

            {doctor.explanation.length > 0 && (
                <div className="survey-result-why">
                    <span className="survey-why-label">{isAr ? 'سبب الترشيح:' : 'Why matched:'}</span>
                    {doctor.explanation.map((e, i) => (
                        <span key={i} className="survey-why-tag">✓ {e}</span>
                    ))}
                </div>
            )}

            {doctor.warnings.length > 0 && (
                <div className="survey-result-warnings">
                    {doctor.warnings.map((w, i) => (
                        <span key={i} className="survey-warning-tag">⚠ {w}</span>
                    ))}
                </div>
            )}

            <div className="survey-result-actions">
                <button className="survey-btn survey-btn-primary" onClick={() => goToProfile()}>
                    {isAr ? 'عرض الملف' : 'View profile'}
                </button>
                <button className="survey-btn survey-btn-secondary" onClick={() => goToProfile('book')}>
                    {isAr ? 'احجز جلسة' : 'Book a session'}
                </button>
            </div>
        </div>
    );
}

// ── Results Screen (fetches from API) ─────────────────────────────────────────
function ResultsScreen({ answers, onRetake }: { answers: SurveyAnswers; onRetake: () => void }) {
    const { lang } = useLanguage();
    const isAr = lang === 'ar';
    const [results, setResults] = useState<MatchedDoctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function loadAndMatch() {
            setLoading(true);
            setError(null);
            try {
                const res = await fetchFirstReachable('/doctors');
                if (!res.ok) throw new Error(`Server returned ${res.status}`);
                const raw = (await res.json()) as unknown;
                const doctors: ApiDoctor[] = Array.isArray(raw) ? (raw as ApiDoctor[]) : [raw as ApiDoctor];
                if (!cancelled) {
                    setResults(matchDoctors(answers, doctors, isAr ? 'ar' : 'en'));
                    setLoading(false);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : isAr ? 'تعذر تحميل الأطباء' : 'Could not load therapists');
                    setLoading(false);
                }
            }
        }

        void loadAndMatch();
        return () => { cancelled = true; };
    }, [answers, isAr]);

    if (loading) {
        return (
                <div className="survey-loading">
                    <div className="survey-loading-rings"><div /><div /><div /></div>
                <p className="survey-loading-text">{isAr ? 'نبحث عن أفضل معالج مناسب لك…' : 'Finding your best therapist match…'}</p>
                <p className="survey-loading-sub">{isAr ? 'المطابقة حسب التخصص، الأسلوب، المواعيد المتاحة وتفضيلاتك' : 'Matching by specialty, approach, availability & your preferences'}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="survey-no-results">
                <p>{isAr ? '⚠ تعذر الاتصال بقاعدة بيانات الأطباء.' : '⚠ Could not connect to the therapist database.'}</p>
                <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>{error}</p>
                <button className="survey-btn survey-btn-primary" style={{ marginTop: 20 }} onClick={onRetake}>
                    {isAr ? 'حاول مرة أخرى' : 'Try again'}
                </button>
            </div>
        );
    }

    return (
        <div className="survey-results">
            <div className="survey-results-header">
                <div className="survey-results-pill">{isAr ? '🎯 نتائجك المخصصة' : '🎯 Your personalized matches'}</div>
                <h2 className="survey-results-title">
                    {results.length > 0
                        ? isAr
                            ? `وجدنا ${results.length} معالجين مناسبين لك`
                            : `We found ${results.length} therapists for you`
                        : isAr ? 'لم نجد نتائج مطابقة' : 'No matches found'}
                </h2>
                <p className="survey-results-subtitle">
                    {isAr
                        ? 'تم ترتيب النتائج حسب مدى توافقها مع حالتك وتفضيلاتك وتوفر المواعيد. الملفات المعروضة حقيقية من منصتنا.'
                        : 'Ranked by how closely they match your concerns, preferred style, and availability. Therapists shown are real profiles from our platform.'}
                </p>
                <button className="survey-btn survey-btn-ghost survey-retake-btn" onClick={onRetake}>
                    {isAr ? '← تعديل الإجابات' : '← Adjust my answers'}
                </button>
            </div>

            {results.length > 0 ? (
                <div className="survey-results-list">
                    {results.map((doc, i) => (
                        <DoctorResultCard key={doc.doctor_user_id} doctor={doc} rank={i + 1} delay={i * 100} />
                    ))}
                </div>
            ) : (
                <div className="survey-no-results">
                    <p>{isAr ? 'لا يوجد تطابق كامل مع معاييرك. جرّب تعديل التفضيلات.' : 'No therapists matched your exact criteria. Try adjusting your preferences.'}</p>
                    <button className="survey-btn survey-btn-primary" onClick={onRetake}>{isAr ? 'تعديل الإجابات' : 'Adjust answers'}</button>
                </div>
            )}

            <div className="survey-disclaimer">
                {isAr
                    ? 'ℹ️ يتم ترتيب النتائج آليًا بناءً على إجاباتك. يرجى التأكد من توفر المواعيد مع المعالج مباشرة قبل الحجز. هذه الأداة ليست نصيحة طبية.'
                    : 'ℹ️ Results are ranked algorithmically based on your answers. Always verify availability directly with the therapist before booking. This tool does not constitute medical advice.'}
            </div>
        </div>
    );
}

// ── Progress Dots ─────────────────────────────────────────────────────────────
function ProgressDots({ total, current }: { total: number; current: number }) {
    return (
        <div className="survey-progress-dots">
            {Array.from({ length: total }).map((_, i) => (
                <div key={i} className={`survey-dot ${i < current ? 'done' : ''} ${i === current ? 'active' : ''}`} />
            ))}
        </div>
    );
}

// ── Main Survey Page ──────────────────────────────────────────────────────────
export default function DoctorSurveyPage() {
    const { lang, setLang } = useLanguage();
    const isAr = lang === 'ar';
    const [stepIndex, setStepIndex] = useState(0);
    const [answers, setAnswers] = useState<SurveyAnswers>({});
    const [showResults, setShowResults] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const localizedSteps = isAr ? surveyStepsAr : surveySteps;
    const currentStep = localizedSteps[stepIndex];
    const progress = (stepIndex / TOTAL_STEPS) * 100;

    useEffect(() => {
        containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [stepIndex, showResults]);

    function handleAnswer(stepId: string, value: string) {
        const newAnswers = { ...answers, [stepId]: value };
        setAnswers(newAnswers);

        const step = localizedSteps.find(s => s.id === stepId)!;
        if (step.nextStep === null) { setShowResults(true); return; }
        if (step.nextStep) {
            const idx = localizedSteps.findIndex(s => s.id === step.nextStep);
            if (idx !== -1) { setStepIndex(idx); return; }
        }
        if (stepIndex + 1 < localizedSteps.length) setStepIndex(stepIndex + 1);
        else setShowResults(true);
    }

    function handleBack() {
        if (showResults) { setShowResults(false); return; }
        if (stepIndex > 0) { setStepIndex(stepIndex - 1); return; }
        navigateTo('/home');
    }

    function handleSkip() {
        const step = currentStep;
        if (step.nextStep === null) { setShowResults(true); return; }
        if (step.nextStep) {
            const idx = localizedSteps.findIndex(s => s.id === step.nextStep);
            if (idx !== -1) { setStepIndex(idx); return; }
        }
        if (stepIndex + 1 < localizedSteps.length) setStepIndex(stepIndex + 1);
        else setShowResults(true);
    }

    function handleRetake() {
        setAnswers({});
        setStepIndex(0);
        setShowResults(false);
    }

    return (
        <div className="survey-page" ref={containerRef}>
            {/* Header */}
            <div className="survey-header">
                <button className="survey-back-btn" onClick={handleBack} aria-label="Go back">←</button>
                <div className="survey-header-center">
                    {!showResults && (
                        <span className="survey-step-label">{isAr ? `الخطوة ${stepIndex + 1} من ${TOTAL_STEPS}` : `Step ${stepIndex + 1} of ${TOTAL_STEPS}`}</span>
                    )}
                    {showResults && <span className="survey-step-label">{isAr ? 'نتائجك' : 'Your Matches'}</span>}
                </div>
                <div className="survey-header-actions">
                    <button
                        type="button"
                        onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
                        className="survey-lang-switch"
                        aria-label={isAr ? 'Switch to English' : 'التبديل إلى العربية'}
                    >
                        {lang === 'en' ? 'AR' : 'EN'}
                    </button>
                    {!showResults ? (
                        <button className="survey-skip-btn" onClick={handleSkip}>{isAr ? 'تخطي →' : 'Skip →'}</button>
                    ) : (
                        <div style={{ minWidth: 64 }} />
                    )}
                </div>
            </div>

            {/* Progress */}
            {!showResults && (
                <>
                    <div className="survey-progress-bar">
                        <div className="survey-progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                    <ProgressDots total={TOTAL_STEPS} current={stepIndex} />
                </>
            )}

            {/* Main content */}
            <div className="survey-content">
                {showResults ? (
                    <ResultsScreen answers={answers} onRetake={handleRetake} />
                ) : (
                    <div className="survey-step" key={currentStep.id}>
                        <div className="survey-step-hero">
                            <div className="survey-step-number">{stepIndex + 1}</div>
                            <div>
                                <h2 className="survey-step-title">{currentStep.title}</h2>
                                {currentStep.subtitle && (
                                    <p className="survey-step-subtitle">{currentStep.subtitle}</p>
                                )}
                            </div>
                        </div>
                        <StepCard step={currentStep} answers={answers} onAnswer={handleAnswer} />
                        {!currentStep.required && (
                            <button className="survey-link-btn" onClick={handleSkip}>{isAr ? 'تخطي هذا السؤال →' : 'Skip this question →'}</button>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            {!showResults && (
                <div className="survey-footer">
                    {isAr ? '🔒 إجاباتك خاصة ولا يتم حفظها دون موافقتك' : '🔒 Your answers are private and never stored without your consent'}
                </div>
            )}
        </div>
    );
}
