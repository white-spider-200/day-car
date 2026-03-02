// ─── Therapy / Psychology Survey — Question Definitions ─────────────────────
// All questions are specific to mental health & therapy matching.

export type AnswerOption = {
  id: string;
  label: string;
  sublabel?: string;
  emoji?: string;
  overrideNext?: string;
};

export type QuestionStep = {
  id: string;
  index: number;
  title: string;
  subtitle?: string;
  type: 'single' | 'multi' | 'boolean-grid';
  options?: AnswerOption[];
  required: boolean;
  isSafetyGate?: boolean;
  nextStep?: string | null; // null = show results
};

export const TOTAL_STEPS = 8;

export const surveySteps: QuestionStep[] = [
  // ── Step 1: What brings you here? ───────────────────────────────────────────
  {
    id: 'care_goal',
    index: 1,
    title: "What brings you to therapy?",
    subtitle: "Choose what resonates most with you right now.",
    type: 'single',
    required: true,
    options: [
      { id: 'anxiety_stress', label: 'Anxiety or stress', emoji: '😰', sublabel: 'Worry, panic, overwhelm' },
      { id: 'depression', label: 'Sadness or depression', emoji: '😔', sublabel: 'Low mood, losing interest' },
      { id: 'trauma', label: 'Trauma or past events', emoji: '💔', sublabel: 'PTSD, difficult memories' },
      { id: 'relationships', label: 'Relationship challenges', emoji: '💑', sublabel: 'Couples, family, communication' },
      { id: 'work_burnout', label: 'Work stress or burnout', emoji: '💼', sublabel: 'Career pressure, exhaustion' },
      { id: 'self_growth', label: 'Personal growth', emoji: '🌱', sublabel: 'Self-awareness, life goals' },
      { id: 'child_support', label: 'Support for my child', emoji: '👶', sublabel: 'Behaviour, school, ADHD' },
      { id: 'other', label: "I'm not sure yet", emoji: '💬', sublabel: 'Help me figure it out' },
    ],
    nextStep: 'concern_detail',
  },

  // ── Step 2: Specific concern ─────────────────────────────────────────────────
  {
    id: 'concern_detail',
    index: 2,
    title: "Which of these feels closest to what you're experiencing?",
    subtitle: "Select the one that fits best — this helps match you to the right specialist.",
    type: 'single',
    required: true,
    options: [
      { id: 'ocd', label: 'Obsessive thoughts or rituals', emoji: '🔄' },
      { id: 'panic', label: 'Panic attacks', emoji: '🫀' },
      { id: 'grief', label: 'Grief or loss', emoji: '🕊️' },
      { id: 'addiction', label: 'Addiction or dependency', emoji: '🔗' },
      { id: 'adhd', label: 'ADHD or attention difficulties', emoji: '🧩' },
      { id: 'phobia', label: 'Phobia or specific fear', emoji: '😨' },
      { id: 'insomnia', label: 'Sleep problems', emoji: '🌙' },
      { id: 'anger', label: 'Anger or emotional regulation', emoji: '🌡️' },
      { id: 'general_talk', label: 'Just need someone to talk to', emoji: '🗣️' },
    ],
    nextStep: 'red_flag_screen',
  },

  // ── Step 3: Safety gate ──────────────────────────────────────────────────────
  {
    id: 'red_flag_screen',
    index: 3,
    title: "Before we continue — please check if any of these apply right now",
    subtitle: "Your safety comes first. Be honest — this is confidential.",
    type: 'boolean-grid',
    isSafetyGate: true,
    required: true,
    options: [
      { id: 'self_harm', label: 'Thoughts of self-harm or hurting myself' },
      { id: 'suicidal', label: 'Thoughts of suicide or not wanting to be here' },
      { id: 'harm_others', label: 'Thoughts of harming someone else' },
      { id: 'crisis_now', label: 'I am in emotional crisis right now' },
      { id: 'none', label: 'None of the above — I am safe', overrideNext: 'who_is_it_for' },
    ],
    nextStep: 'who_is_it_for',
  },

  // ── Step 4: Who is the therapy for? ─────────────────────────────────────────
  {
    id: 'who_is_it_for',
    index: 4,
    title: "Who will be attending the sessions?",
    subtitle: "This determines which specialists are suitable.",
    type: 'single',
    required: true,
    options: [
      { id: 'myself_adult', label: 'For myself (adult)', emoji: '👤' },
      { id: 'myself_teen', label: 'For myself (teen, 13–17)', emoji: '🧑' },
      { id: 'my_child', label: 'For my child (under 13)', emoji: '🧒' },
      { id: 'couple', label: 'Me and my partner', emoji: '💑' },
      { id: 'family', label: 'My whole family', emoji: '👨‍👩‍👧' },
    ],
    nextStep: 'session_format',
  },

  // ── Step 5: Session format ───────────────────────────────────────────────────
  {
    id: 'session_format',
    index: 5,
    title: "How would you prefer to have your sessions?",
    subtitle: "We'll only match you with therapists who offer your preferred format.",
    type: 'single',
    required: true,
    options: [
      { id: 'in_person', label: 'In-person at a clinic', emoji: '🏥', sublabel: 'Face-to-face sessions' },
      { id: 'online', label: 'Online sessions', emoji: '💻', sublabel: 'Secure video call' },
      { id: 'either', label: 'Either works for me', emoji: '✨', sublabel: 'I\'m flexible' },
    ],
    nextStep: 'therapist_preference',
  },

  // ── Step 6: Therapist preferences ───────────────────────────────────────────
  {
    id: 'therapist_preference',
    index: 6,
    title: "Do you have any preferences for your therapist?",
    subtitle: "These are optional — your health comes first.",
    type: 'single',
    required: false,
    options: [
      { id: 'lang_arabic', label: 'Arabic-speaking therapist', emoji: '🌍' },
      { id: 'lang_english', label: 'English-speaking therapist', emoji: '🇬🇧' },
      { id: 'gender_female', label: 'Female therapist', emoji: '👩‍⚕️' },
      { id: 'gender_male', label: 'Male therapist', emoji: '👨‍⚕️' },
      { id: 'no_pref', label: 'No specific preference', emoji: '✨' },
    ],
    nextStep: 'approach_style',
  },

  // ── Step 7: Therapy approach ─────────────────────────────────────────────────
  {
    id: 'approach_style',
    index: 7,
    title: "What kind of therapy approach appeals to you?",
    subtitle: "This helps match you with a compatible therapist style.",
    type: 'single',
    required: false,
    options: [
      { id: 'cbt', label: 'Structured & practical (CBT)', emoji: '🧠', sublabel: 'Cognitive Behavioral Therapy' },
      { id: 'mindfulness', label: 'Mindful & reflective', emoji: '🧘', sublabel: 'Mindfulness-based approaches' },
      { id: 'psychodynamic', label: 'Deep exploration', emoji: '🔍', sublabel: 'Understanding root causes' },
      { id: 'supportive', label: 'Supportive & talk-based', emoji: '🗣️', sublabel: 'Listening and guidance' },
      { id: 'no_pref_app', label: "I don't have a preference", emoji: '✨' },
    ],
    nextStep: 'priority',
  },

  // ── Step 8: What matters most ────────────────────────────────────────────────
  {
    id: 'priority',
    index: 8,
    title: "What matters most to you when choosing a therapist?",
    subtitle: "This shapes how we rank your results.",
    type: 'single',
    required: true,
    options: [
      { id: 'fastest', label: 'Soonest available appointment', emoji: '⚡', sublabel: 'I want to start ASAP' },
      { id: 'experienced', label: 'Most years of experience', emoji: '🏆', sublabel: 'Seasoned professional' },
      { id: 'top_rated', label: 'Highest patient rating', emoji: '⭐', sublabel: 'Trusted by most patients' },
      { id: 'balanced', label: 'Best overall match', emoji: '⚖️', sublabel: 'Balanced across all factors' },
    ],
    nextStep: null, // → show results
  },
];

export type SurveyAnswers = Record<string, string | string[]>;
