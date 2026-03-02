// ─── Therapy Matching Engine — works with real API doctors ────────────────────
// Takes the ApiDoctor shape fetched from /doctors and scores against survey answers.

import { SurveyAnswers } from '../data/surveyData';
type MatchLanguage = 'ar' | 'en';

// ── ApiDoctor shape (mirrors MainHomePage.tsx) ────────────────────────────────
export type ApiDoctor = {
    doctor_user_id: string;
    slug: string;
    display_name: string;
    headline: string | null;
    photo_url: string | null;
    specialties: string[] | null;
    concerns: string[] | null;
    therapy_approaches: string[] | null;
    languages: string[] | null;
    session_types: string[] | null;       // e.g. ['IN_PERSON','VIDEO','AUDIO']
    gender_identity: string | null;        // 'male' | 'female' | ...
    location_city: string | null;
    location_country: string | null;
    next_available_at: string | null;
    rating: number | string | null;
    reviews_count: number;
    pricing_currency: string;
    pricing_per_session: number | string | null;
    follow_up_price: number | string | null;
    verification_badges: string[] | null;
};

export type MatchedDoctor = ApiDoctor & {
    score: number;
    explanation: string[];
    warnings: string[];
    isRecommended?: boolean;
    // Convenience resolved fields for display
    resolvedRating: number;
    resolvedPrice: string;
    resolvedLocation: string;
    resolvedPhotoUrl: string | undefined;
    nextAvailableDays: number;
};

// ── Weight profiles ────────────────────────────────────────────────────────────
type WeightProfile = { concern: number; access: number; preference: number; reviews: number };
const WEIGHT_PROFILES: Record<string, WeightProfile> = {
    fastest: { concern: 0.35, access: 0.52, preference: 0.10, reviews: 0.03 },
    balanced: { concern: 0.42, access: 0.30, preference: 0.18, reviews: 0.10 },
    top_rated: { concern: 0.30, access: 0.18, preference: 0.17, reviews: 0.35 },
    experienced: { concern: 0.38, access: 0.22, preference: 0.20, reviews: 0.20 },
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function get(answers: SurveyAnswers, key: string): string {
    const v = answers[key];
    if (!v) return '';
    return Array.isArray(v) ? v[0] : v;
}

function normalizeRating(r: number | string | null): number {
    if (r === null) return 0;
    const n = Number(r);
    return isNaN(n) ? 0 : Math.max(0, Math.min(5, n));
}

function resolvePhotoUrl(url: string | null): string | undefined {
    if (!url) return undefined;
    const t = url.trim();
    if (!t) return undefined;
    if (/^(https?:)?\/\//i.test(t) || t.startsWith('data:') || t.startsWith('blob:')) return t;
    const path = t.startsWith('/') ? t : `/${t}`;
    const env = import.meta.env as Record<string, string | boolean | undefined>;
    const envBase = typeof env.VITE_API_BASE_URL === 'string' ? env.VITE_API_BASE_URL.trim() : '';
    const fallback = typeof window !== 'undefined'
        ? `${window.location.protocol}//${window.location.hostname}:8000`
        : 'http://localhost:8000';
    const base = (envBase && envBase !== '/api' ? envBase : fallback).replace(/\/+$/, '').replace(/\/api$/, '');
    return `${base}${path}`;
}

function daysUntilAvailable(nextAt: string | null): number {
    if (!nextAt) return 99;
    const ms = Date.parse(nextAt) - Date.now();
    if (ms <= 0) return 0;
    return Math.ceil(ms / 86_400_000);
}

// ── Map care_goal / concern_detail → API concern/specialty keywords ────────────
const CONCERN_KEYWORDS: Record<string, string[]> = {
    anxiety_stress: ['anxiety', 'stress', 'panic', 'worry', 'ocd'],
    depression: ['depression', 'mood', 'sadness', 'grief', 'bipolar'],
    trauma: ['trauma', 'ptsd', 'abuse', 'grief', 'loss'],
    relationships: ['couples', 'relationship', 'family', 'communication', 'marriage'],
    work_burnout: ['burnout', 'stress', 'work', 'career', 'life transitions'],
    self_growth: ['self', 'growth', 'confidence', 'identity', 'mindfulness'],
    child_support: ['child', 'adhd', 'behaviour', 'school', 'adolescent', 'teen'],
    other: [],
    ocd: ['ocd', 'obsessive', 'compulsive'],
    panic: ['panic', 'anxiety'],
    grief: ['grief', 'loss', 'bereavement'],
    addiction: ['addiction', 'substance', 'dependency', 'recovery'],
    adhd: ['adhd', 'attention', 'hyperactivity'],
    phobia: ['phobia', 'fear', 'anxiety'],
    insomnia: ['insomnia', 'sleep'],
    anger: ['anger', 'emotion', 'regulation'],
    general_talk: [],
};

// Maps approach_style answer → therapy_approaches keywords
const APPROACH_KEYWORDS: Record<string, string[]> = {
    cbt: ['cbt', 'cognitive', 'behavioral', 'cognitive-behavioral'],
    mindfulness: ['mindfulness', 'mbsr', 'mindfulness-based', 'acceptance'],
    psychodynamic: ['psychodynamic', 'psychoanalytic', 'relational', 'depth'],
    supportive: ['supportive', 'humanistic', 'person-centred', 'talk'],
};

function includesKeyword(list: string[] | null, keywords: string[]): boolean {
    if (!list || list.length === 0 || keywords.length === 0) return false;
    return keywords.some(kw =>
        list.some(item => item.toLowerCase().includes(kw.toLowerCase()))
    );
}

// ── Hard filters ───────────────────────────────────────────────────────────────
function passesFilter(answers: SurveyAnswers, doc: ApiDoctor): boolean {
    const types = (doc.session_types ?? []).map(s => s.toUpperCase());

    // Session format
    const format = get(answers, 'session_format');
    if (format === 'in_person') {
        if (!types.some(t => t === 'IN_PERSON')) return false;
    } else if (format === 'online') {
        if (!types.some(t => ['VIDEO', 'AUDIO', 'CHAT', 'ONLINE'].includes(t))) return false;
    }

    // Who for — filter child-specific if user needs adult and vice versa
    const who = get(answers, 'who_is_it_for');
    const specs = (doc.specialties ?? []).map(s => s.toLowerCase());
    const concerns = (doc.concerns ?? []).map(c => c.toLowerCase());
    const allTags = [...specs, ...concerns];

    if (who === 'my_child') {
        // Child psychologist or adolescent specialty needed
        const isChildSpec = allTags.some(t => t.includes('child') || t.includes('adolescent') || t.includes('adhd') || t.includes('paediatric'));
        if (!isChildSpec) return false;
    }

    return true;
}

// ── Concern fit score (0–1) ────────────────────────────────────────────────────
function concernScore(answers: SurveyAnswers, doc: ApiDoctor): number {
    const goal = get(answers, 'care_goal');
    const detail = get(answers, 'concern_detail');

    const goalKws = CONCERN_KEYWORDS[goal] ?? [];
    const detailKws = CONCERN_KEYWORDS[detail] ?? [];

    const allConcerns = [...(doc.concerns ?? []), ...(doc.specialties ?? [])];

    let score = 0;
    if (includesKeyword(allConcerns, goalKws)) score += 0.55;
    if (includesKeyword(allConcerns, detailKws)) score += 0.45;
    return Math.min(score, 1);
}

// ── Access score (0–1) ────────────────────────────────────────────────────────
function accessScore(days: number): number {
    return Math.max(0, 1 - days / 7);
}

// ── Preference score (0–1) ─────────────────────────────────────────────────────
function preferenceScore(answers: SurveyAnswers, doc: ApiDoctor): number {
    let score = 0.4;

    const pref = get(answers, 'therapist_preference');
    const langs = (doc.languages ?? []).map(l => l.toLowerCase());
    const gender = (doc.gender_identity ?? '').toLowerCase();

    if (!pref || pref === 'no_pref') {
        score += 0.3;
    } else if (pref === 'lang_arabic' && langs.some(l => l.includes('arabic'))) { score += 0.6; }
    else if (pref === 'lang_english' && langs.some(l => l.includes('english'))) { score += 0.6; }
    else if (pref === 'gender_female' && gender === 'female') { score += 0.6; }
    else if (pref === 'gender_male' && gender === 'male') { score += 0.6; }

    // Approach match
    const approach = get(answers, 'approach_style');
    const approachKws = APPROACH_KEYWORDS[approach] ?? [];
    if (!approach || approach === 'no_pref_app') {
        score += 0.2;
    } else if (includesKeyword(doc.therapy_approaches, approachKws)) {
        score += 0.2;
    }

    return Math.min(score, 1);
}

// ── Review score (0–1) ─────────────────────────────────────────────────────────
function reviewScore(rating: number, reviewCount: number): number {
    const normalized = (rating - 1) / 4;
    const confidence = Math.min(reviewCount / 100, 1);
    return normalized * confidence;
}

// ── Build explanation bullets ──────────────────────────────────────────────────
function buildExplanation(answers: SurveyAnswers, doc: ApiDoctor, days: number, lang: MatchLanguage): string[] {
    const reasons: string[] = [];
    const goal = get(answers, 'care_goal');
    const detail = get(answers, 'concern_detail');
    const pref = get(answers, 'therapist_preference');
    const approach = get(answers, 'approach_style');
    const priority = get(answers, 'priority');
    const format = get(answers, 'session_format');
    const rating = normalizeRating(doc.rating);

    const allConcerns = [...(doc.concerns ?? []), ...(doc.specialties ?? [])];
    if (
        includesKeyword(allConcerns, CONCERN_KEYWORDS[goal] ?? []) ||
        includesKeyword(allConcerns, CONCERN_KEYWORDS[detail] ?? [])
    ) {
        reasons.push(lang === 'ar' ? 'متخصص في حالتك' : 'Specializes in your concern');
    }

    if (days === 0) reasons.push(lang === 'ar' ? 'متاح اليوم' : 'Available today');
    else if (days <= 2) reasons.push(lang === 'ar' ? `متاح خلال ${days} يوم` : `Available in ${days} day${days > 1 ? 's' : ''}`);

    const types = (doc.session_types ?? []).map(s => s.toUpperCase());
    if (format === 'online' && types.some(t => ['VIDEO', 'AUDIO', 'CHAT', 'ONLINE'].includes(t))) reasons.push(lang === 'ar' ? 'يقدم جلسات أونلاين' : 'Offers online sessions');
    if (format === 'in_person' && types.some(t => t === 'IN_PERSON')) reasons.push(lang === 'ar' ? 'يقدم جلسات حضورية' : 'Offers in-person sessions');

    const langs = (doc.languages ?? []).map(l => l.toLowerCase());
    if (pref === 'lang_arabic' && langs.some(l => l.includes('arabic'))) reasons.push(lang === 'ar' ? 'يتحدث العربية' : 'Arabic-speaking');
    if (pref === 'lang_english' && langs.some(l => l.includes('english'))) reasons.push(lang === 'ar' ? 'يتحدث الإنجليزية' : 'English-speaking');
    if (pref === 'gender_female' && (doc.gender_identity ?? '').toLowerCase() === 'female') reasons.push(lang === 'ar' ? 'معالجة' : 'Female therapist');
    if (pref === 'gender_male' && (doc.gender_identity ?? '').toLowerCase() === 'male') reasons.push(lang === 'ar' ? 'معالج' : 'Male therapist');

    const approachKws = APPROACH_KEYWORDS[approach] ?? [];
    if (approach && approach !== 'no_pref_app' && includesKeyword(doc.therapy_approaches, approachKws)) {
        const labels: Record<string, string> = {
            cbt: lang === 'ar' ? 'نهج العلاج المعرفي السلوكي' : 'CBT approach',
            mindfulness: lang === 'ar' ? 'نهج اليقظة الذهنية' : 'Mindfulness-based',
            psychodynamic: lang === 'ar' ? 'نهج ديناميكي نفسي' : 'Psychodynamic',
            supportive: lang === 'ar' ? 'أسلوب داعم' : 'Supportive style',
        };
        reasons.push(labels[approach] ?? (lang === 'ar' ? 'يتوافق مع الأسلوب المفضل لديك' : 'Matches your preferred approach'));
    }

    const isVerified = (doc.verification_badges ?? []).includes('VERIFIED_DOCTOR');
    if (isVerified) reasons.push(lang === 'ar' ? 'معالج موثق' : 'Verified therapist');
    if (priority === 'top_rated' && rating >= 4.5) reasons.push(lang === 'ar' ? `تقييم ${rating.toFixed(1)} ⭐` : `Rated ${rating.toFixed(1)} ⭐`);

    return reasons.slice(0, 4);
}

// ── Build warnings ─────────────────────────────────────────────────────────────
function buildWarnings(days: number, reviewCount: number, lang: MatchLanguage): string[] {
    const w: string[] = [];
    if (days >= 7) w.push(lang === 'ar' ? 'قد يكون الموعد القادم بعد أكثر من أسبوع' : 'Next slot may be over a week away');
    if (reviewCount < 10) w.push(lang === 'ar' ? 'عدد التقييمات ما يزال محدودًا' : 'Limited reviews so far');
    return w;
}

// ── Main match function — takes real API doctors ────────────────────────────────
export function matchDoctors(answers: SurveyAnswers, apiDoctors: ApiDoctor[], lang: MatchLanguage = 'en'): MatchedDoctor[] {
    const priority = get(answers, 'priority') || 'balanced';
    const weights = WEIGHT_PROFILES[priority] ?? WEIGHT_PROFILES.balanced;

    // Stage 1: hard filter
    let eligible = apiDoctors.filter(d => passesFilter(answers, d));
    if (eligible.length < 3) eligible = apiDoctors; // relax if too few

    // Stage 2: score
    const scored: MatchedDoctor[] = eligible.map(doc => {
        const days = daysUntilAvailable(doc.next_available_at);
        const rating = normalizeRating(doc.rating);
        const reviews = doc.reviews_count ?? 0;

        const concern = concernScore(answers, doc);
        const access = accessScore(days);
        const preference = preferenceScore(answers, doc);
        const review = reviewScore(rating, reviews);

        const rawScore =
            weights.concern * concern +
            weights.access * access +
            weights.preference * preference +
            weights.reviews * review;

        // Resolved display fields
        const priceAmount = Number(doc.pricing_per_session);
        const resolvedPrice = isNaN(priceAmount) || doc.pricing_per_session === null
            ? (lang === 'ar' ? 'تواصل لمعرفة السعر' : 'Contact for price')
            : lang === 'ar'
                ? `${priceAmount} ${doc.pricing_currency} / جلسة`
                : `${priceAmount} ${doc.pricing_currency} / session`;

        const locationParts = [doc.location_city, doc.location_country].filter(Boolean);
        const types = (doc.session_types ?? []).map(s => s.toUpperCase());
        const offersOnline = types.some(t => ['VIDEO', 'AUDIO', 'CHAT', 'ONLINE'].includes(t));
        const onlineLabel = lang === 'ar' ? 'أونلاين' : 'Online';
        const baseLocation = locationParts.join(' · ') || (offersOnline ? onlineLabel : '');
        const resolvedLocation = offersOnline && !baseLocation.includes(onlineLabel)
            ? `${baseLocation} · ${onlineLabel}`
            : baseLocation;

        return {
            ...doc,
            score: rawScore,
            explanation: buildExplanation(answers, doc, days, lang),
            warnings: buildWarnings(days, reviews, lang),
            resolvedRating: rating,
            resolvedPrice,
            resolvedLocation,
            resolvedPhotoUrl: resolvePhotoUrl(doc.photo_url),
            nextAvailableDays: days,
        };
    });

    // Stage 3: sort by score, break ties by availability
    scored.sort((a, b) => {
        if (Math.abs(a.score - b.score) > 0.01) return b.score - a.score;
        return a.nextAvailableDays - b.nextAvailableDays;
    });

    // Stage 4: mark recommended
    if (scored.length > 0) scored[0] = { ...scored[0], isRecommended: true };

    return scored.slice(0, 8);
}
