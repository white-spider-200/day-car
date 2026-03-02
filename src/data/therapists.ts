export type TherapistLicense = {
  license_name: string;
  license_number: string;
  issuer: string;
};

export type Therapist = {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  title_ar: string;
  title_en: string;
  photo_url: string;
  bio_ar: string;
  bio_en: string;
  specialties: string[];
  areas_of_focus: string[];
  approaches: string[];
  languages: string[];
  location_city: string;
  country: string;
  online_available: boolean;
  in_person_available: boolean;
  session_types: string[];
  session_duration_minutes: number | null;
  price_min: number | null;
  price_max: number | null;
  currency: string;
  education: string[];
  licenses: TherapistLicense[];
  years_experience: number | null;
  verified: boolean;
  rating_avg: number | null;
  reviews_count: number;
  availability_slots?: string[];
  specialties_ar?: string[];
  areas_of_focus_ar?: string[];
  approaches_ar?: string[];
  languages_ar?: string[];
  education_ar?: string[];
  licenses_ar?: TherapistLicense[];
  memberships_en?: string[];
  memberships_ar?: string[];
  first_session_en?: string;
  first_session_ar?: string;
  cancellation_policy_en?: string;
  cancellation_policy_ar?: string;
  best_for_en?: string;
  best_for_ar?: string;
  sessions_count?: number | null;
  practice_since_year?: number | null;
  graduation_year?: number | null;
  clinic_name_ar?: string;
  clinic_name_en?: string;
  primary_address_ar?: string;
  primary_address_en?: string;
  alternate_address_note_ar?: string;
  alternate_address_note_en?: string;
  insurance_note_ar?: string;
  insurance_note_en?: string;
  fees_note_ar?: string;
  fees_note_en?: string;
  office_hours_ar?: string[];
  office_hours_en?: string[];
  media_highlights_ar?: string[];
  media_highlights_en?: string[];
  booking_links?: Array<{ label_ar: string; label_en: string; url: string }>;
  no_public_disciplinary_record_as_of?: string;
};

export const therapists: Therapist[] = [
  {
    id: 'dr-abdelrahman-mizher',
    slug: 'abdelrahman-mizher',
    name_ar: 'د. عبدالرحمن مزهر',
    name_en: 'Dr. Abdelrahman Mizher',
    title_ar: 'استشاري الطب النفسي ومعالجة الإدمان',
    title_en: 'Consultant Psychiatrist & Addiction Treatment Specialist',
    photo_url:
      'https://rofanimaging.s3.amazonaws.com/profile_pic/%D8%A7%D9%84%D8%AF%D9%83%D8%AA%D9%88%D8%B1_%D8%B9%D8%A8%D8%AF_%D8%A7%D9%84%D8%B1%D8%AD%D9%85%D9%86_%D9%85%D8%B2%D9%87%D8%B1.jpg',
    bio_ar:
      'الدكتور عبدالرحمن مزهر استشاري طب نفسي بخبرة سريرية مذكورة منذ عام 1995. تركز ممارسته على الطب النفسي للبالغين والمراهقين، علاج الإدمان، والاستشارات الأسرية ضمن نهج سريري قائم على الأدلة والتقييم النفسي المتكامل. تشير ملفات الحجز الطبي إلى خبرة ممتدة في مؤسسات الصحة النفسية بالأردن، مع ممارسة حالية في عمّان.',
    bio_en:
      'Dr. Abdelrahman Mizher is a consultant psychiatrist with publicly listed clinical practice since 1995. His scope includes adult and adolescent psychiatry, addiction treatment, and family counseling, delivered through evidence-informed care and structured psychiatric assessment. Public booking profiles indicate long-standing experience in Jordanian mental health settings with current practice in Amman.',
    specialties: ['Consultant Psychiatry', 'Addiction Psychiatry', 'Adult Psychiatry', 'Child & Adolescent Psychiatry', 'Family Counseling'],
    specialties_ar: ['استشاري طب نفسي', 'الطب النفسي وعلاج الإدمان', 'طب نفسي للبالغين', 'طب نفسي للأطفال والمراهقين', 'استشارات أسرية'],
    areas_of_focus: ['Anxiety', 'Depression', 'Obsessive-Compulsive Disorder', 'Trauma', 'Panic Attacks', 'Insomnia', 'Phobias'],
    areas_of_focus_ar: ['القلق', 'الاكتئاب', 'الوسواس القهري', 'الصدمات', 'نوبات الهلع', 'الأرق', 'الرهاب'],
    approaches: ['Cognitive Behavioral Therapy (CBT)', 'Psychiatric Evaluation', 'Medication Management', 'Supportive Psychotherapy', 'Relapse Prevention Planning'],
    approaches_ar: [
      'العلاج المعرفي السلوكي (CBT)',
      'التقييم النفسي وإدارة الخطة الدوائية',
      'العلاج النفسي الداعم',
      'الإرشاد الأسري المنظومي',
      'خطط الوقاية من الانتكاس'
    ],
    languages: ['Arabic', 'English', 'Russian'],
    languages_ar: ['العربية', 'الإنجليزية', 'الروسية'],
    location_city: 'Amman',
    country: 'Jordan',
    online_available: true,
    in_person_available: true,
    session_types: ['Individual', 'Couples', 'Family', 'Adolescents'],
    session_duration_minutes: 30,
    price_min: 50,
    price_max: 150,
    currency: 'JOD',
    education: [
      'Bachelor of Medicine and Surgery, Azerbaijan Medical University (Baku), reported graduation year: 1990',
      'Jordanian Board Certificate in Psychiatry (JBC)',
      'Clinical psychiatry training and practice in Jordanian mental health institutions'
    ],
    education_ar: [
      'بكالوريوس الطب والجراحة - جامعة أذربيجان الطبية (باكو)',
      'شهادة البورد الأردني في الطب النفسي (JBC)',
      'إقامة وتدريب سريري في مؤسسات الصحة النفسية في الأردن'
    ],
    licenses: [
      {
        license_name: 'Jordanian Board in Psychiatry (JBC)',
        license_number: 'Not publicly listed',
        issuer: 'Jordan Medical Council'
      },
      {
        license_name: 'Medical Practice License',
        license_number: 'Not publicly listed',
        issuer: 'Jordan Ministry of Health'
      }
    ],
    licenses_ar: [
      {
        license_name: 'شهادة البورد الأردني في الطب النفسي (JBC)',
        license_number: 'غير منشور علنًا',
        issuer: 'المجلس الطبي الأردني'
      },
      {
        license_name: 'رخصة مزاولة مهنة الطب',
        license_number: 'غير منشور علنًا',
        issuer: 'وزارة الصحة الأردنية'
      }
    ],
    years_experience: 31,
    verified: true,
    rating_avg: 4.7,
    reviews_count: 1,
    availability_slots: [],
    memberships_en: ['Jordan Medical Council - Board Certified Specialist'],
    memberships_ar: ['المجلس الطبي الأردني - اختصاص طب نفسي (بورد أردني)'],
    first_session_en:
      'The first session focuses on clinical history, current symptoms, treatment goals, and a clear care roadmap. A diagnostic impression and treatment options are discussed with you.',
    first_session_ar:
      'تركز الجلسة الأولى على التاريخ السريري، الأعراض الحالية، الأهداف العلاجية، ووضع خارطة علاج واضحة. يتم مناقشة الانطباع التشخيصي وخيارات العلاج معك بشكل شفاف.',
    cancellation_policy_en: 'You can reschedule or cancel up to 24 hours before the appointment time.',
    cancellation_policy_ar: 'يمكن إعادة الجدولة أو الإلغاء قبل الموعد بـ 24 ساعة على الأقل.',
    best_for_en:
      'Best suited for adults, adolescents, and families seeking structured psychiatric care for anxiety, mood disorders, trauma-related symptoms, and addiction recovery support.',
    best_for_ar:
      'مناسب للبالغين والمراهقين والأسر الباحثين عن رعاية نفسية منظمة في حالات القلق واضطرابات المزاج وأعراض الصدمات ودعم التعافي من الإدمان.',
    sessions_count: 72,
    practice_since_year: 1995,
    graduation_year: 1990,
    clinic_name_ar: 'مركز/عيادة العقول المبدعة',
    clinic_name_en: 'Beautiful Mind Center / Mizher Clinic',
    primary_address_ar: 'عمّان، قرب الدوار الرابع، شارع ابن خلدون، مجمع الجود الطبي، الطابق الرابع',
    primary_address_en: 'Amman, near 4th Circle, Ibn Khaldoun St., Al-Joud Medical Complex, 4th floor',
    alternate_address_note_ar:
      'بعض الأدلة تعرض عنوانًا بديلًا بمنطقة الخالدي/مجمع الرواد؛ يُنصح بالتحقق قبل الزيارة.',
    alternate_address_note_en:
      'Some listings show an alternate address in Al-Khalidi / Al-Ruwad complex; verify before visiting.',
    insurance_note_ar:
      'بيانات التأمين غير موحّدة عبر المنصات (بعضها يذكر عدم وجود تغطية). يفضّل التأكد المباشر قبل الحجز.',
    insurance_note_en:
      'Insurance information is inconsistent across listings (some indicate no coverage). Confirm directly before booking.',
    fees_note_ar:
      'الرسوم المتكررة على المنصات: 50 دينار أردني. ظهرت قيمة 150 دينار في بعض القوائم دون توصيف واضح للخدمة.',
    fees_note_en:
      'Most listings show 50 JOD. A 150 JOD amount appears in some listings without clear service breakdown.',
    office_hours_ar: ['السبت - الأربعاء: 09:00 - 18:00 (بحسب بيانات منشورة)', 'الخميس: 09:00 - 14:00 (بحسب بيانات منشورة)'],
    office_hours_en: ['Sat - Wed: 09:00 - 18:00 (as publicly listed)', 'Thu: 09:00 - 14:00 (as publicly listed)'],
    media_highlights_ar: ['الرأي (2016/2021): تصريحات وتحليلات نفسية', 'الجزيرة نت (2025): تحليل نفسي إعلامي', 'نبض البلد (2023): مشاركة في بودكاست توعوي'],
    media_highlights_en: [
      'Al Rai (2016/2021): quoted commentary on mental health topics',
      'Al Jazeera (2025): public psychological analysis feature',
      'Nabd Al Balad (2023): awareness podcast participation'
    ],
    booking_links: [
      { label_ar: 'طبكان', label_en: 'Tebcan', url: 'https://tebcan.com/ar/Jordan/dr/%D8%AF%D9%83%D8%AA%D9%88%D8%B1-%D8%B9%D8%A8%D8%AF%D8%A7%D9%84%D8%B1%D8%AD%D9%85%D9%86-%D9%85%D8%B2%D9%87%D8%B1-%D9%86%D9%81%D8%B3%D9%8A_31' },
      { label_ar: 'فيزيتا', label_en: 'Vezeeta', url: 'https://jordan.vezeeta.com/ar/dr/%D8%AF%D9%83%D8%AA%D9%88%D8%B1-%D8%B9%D8%A8%D8%AF%D8%A7%D9%84%D8%B1%D8%AD%D9%85%D9%86-%D9%85%D8%B2%D9%87%D8%B1-%D9%86%D9%81%D8%B3%D9%8A' },
      { label_ar: 'iHospital', label_en: 'iHospital', url: 'https://www.ihospitalapp.com/ar/doctor-profile/2348-%D8%AF-%D8%B9%D8%A8%D8%AF%D8%A7%D9%84%D8%B1%D8%AD%D9%85%D9%86-%D9%85%D8%B2%D9%87%D8%B1-%D8%A7%D8%B3%D8%AA%D8%B4%D8%A7%D8%B1%D9%8A-%D8%A7%D9%84%D8%B7%D8%A8-%D8%A7%D9%84%D9%86%D9%81%D8%B3%D9%8A' },
      { label_ar: 'روفان كير', label_en: 'RofanCare', url: 'https://rofancare.com/ar/doctor_profile_details/dr-%D8%B9%D8%A8%D8%AF-%D8%A7%D9%84%D8%B1%D8%AD%D9%85%D9%86-%D9%85%D8%B2%D9%87%D8%B1' }
    ],
    no_public_disciplinary_record_as_of: '2026-02-26'
  }
];

export function getTherapistBySlug(slug: string): Therapist | undefined {
  return therapists.find((therapist) => therapist.slug === slug);
}
