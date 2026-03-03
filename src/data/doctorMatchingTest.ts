export type LikertQuestion = {
  id: string;
  dimension: 'care' | 'approach' | 'specialization';
  polarity: 'positive' | 'negative';
  statement: string;
};

export type MatchFilters = {
  gender: string;
  language: string;
  sessionType: string;
  minPrice: string;
  maxPrice: string;
  location: string;
  insuranceProvider: string;
};

export const LIKERT_LABELS = [
  'Strongly Disagree',
  'Disagree',
  'Neutral',
  'Agree',
  'Strongly Agree',
] as const;

export const DOCTOR_MATCH_QUESTIONS: LikertQuestion[] = [
  { id: 'care_1', dimension: 'care', polarity: 'positive', statement: 'I prefer my doctor to tell me exactly what to do.' },
  { id: 'care_2', dimension: 'care', polarity: 'negative', statement: 'I like discussing multiple treatment options.' },
  { id: 'care_3', dimension: 'care', polarity: 'positive', statement: 'I want structured sessions with clear plans.' },
  { id: 'care_4', dimension: 'care', polarity: 'negative', statement: 'I prefer open conversations over strict structure.' },
  { id: 'care_5', dimension: 'care', polarity: 'positive', statement: 'I trust professional authority more than discussion.' },
  { id: 'care_6', dimension: 'care', polarity: 'negative', statement: 'I want to actively participate in decisions.' },
  { id: 'care_7', dimension: 'care', polarity: 'positive', statement: 'I progress best when my doctor gives clear action steps.' },
  { id: 'care_8', dimension: 'care', polarity: 'negative', statement: 'I value a co-created treatment plan over fixed guidance.' },

  { id: 'approach_1', dimension: 'approach', polarity: 'positive', statement: 'I prefer scientifically structured therapy methods.' },
  { id: 'approach_2', dimension: 'approach', polarity: 'negative', statement: 'I want emotional and lifestyle factors deeply considered.' },
  { id: 'approach_3', dimension: 'approach', polarity: 'positive', statement: 'I value formal diagnosis before treatment.' },
  { id: 'approach_4', dimension: 'approach', polarity: 'negative', statement: 'I prefer flexible healing approaches.' },
  { id: 'approach_5', dimension: 'approach', polarity: 'positive', statement: 'I trust established clinical frameworks.' },
  { id: 'approach_6', dimension: 'approach', polarity: 'negative', statement: 'I believe prevention and lifestyle are central to healing.' },
  { id: 'approach_7', dimension: 'approach', polarity: 'positive', statement: 'I prefer measurable treatment outcomes and protocols.' },
  { id: 'approach_8', dimension: 'approach', polarity: 'negative', statement: 'I want my mental health care integrated with daily-life habits.' },

  { id: 'specialization_1', dimension: 'specialization', polarity: 'negative', statement: 'I want a therapist who treats many different conditions.' },
  { id: 'specialization_2', dimension: 'specialization', polarity: 'positive', statement: 'I prefer someone who specializes deeply in my issue.' },
  { id: 'specialization_3', dimension: 'specialization', polarity: 'negative', statement: 'I am unsure what exactly my issue is.' },
  { id: 'specialization_4', dimension: 'specialization', polarity: 'positive', statement: 'I know exactly what I need help with.' },
  { id: 'specialization_5', dimension: 'specialization', polarity: 'negative', statement: 'I prefer broader support rather than niche focus.' },
  { id: 'specialization_6', dimension: 'specialization', polarity: 'positive', statement: 'I want an expert in a very specific condition.' },
  { id: 'specialization_7', dimension: 'specialization', polarity: 'negative', statement: 'I am looking for broad mental wellness guidance.' },
  { id: 'specialization_8', dimension: 'specialization', polarity: 'positive', statement: 'I would rather work with a niche specialist than a general therapist.' },
];

export const INITIAL_FILTERS: MatchFilters = {
  gender: '',
  language: '',
  sessionType: '',
  minPrice: '',
  maxPrice: '',
  location: '',
  insuranceProvider: '',
};

export const TYPE_DESCRIPTIONS: Record<string, string> = {
  DEG: 'You prefer clear guidance, structured clinical methods, and broad-scope support for general mental health goals.',
  DES: 'You prefer direct guidance and clinical structure, with a focused specialist for specific concerns.',
  DHG: 'You like clear doctor leadership, but with a holistic lens that still supports broad needs.',
  DHS: 'You want a directive doctor who blends integrative care with specialist-level focus.',
  CEG: 'You prefer shared decision-making and evidence-based care, while keeping support broad and flexible.',
  CES: 'You want collaborative care with clinical rigor, matched to a specialist in your target concern.',
  CHG: 'You prefer collaborative, whole-person care and a generalist who can support across life contexts.',
  CHS: 'You seek collaborative, integrative care from a specialist deeply focused on your specific needs.',
};

export const TYPE_TITLES: Record<string, string> = {
  D: 'Directive',
  C: 'Collaborative',
  E: 'Evidence-based',
  H: 'Holistic',
  G: 'Generalist',
  S: 'Specialist',
};
