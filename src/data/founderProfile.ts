export type FounderCredentials = {
  education: string[];
  certifications: string[];
  yearsOfExperience: number;
  memberships: string[];
};

export type FounderProfile = {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  title_ar: string;
  title_en: string;
  location: string;
  image: string;
  shortBio_ar: string;
  shortBio_en: string;
  about_ar: string;
  about_en: string;
  approach_ar: string;
  approach_en: string;
  philosophy_ar: string;
  philosophy_en: string;
  credentials: FounderCredentials;
  specialties_ar: string[];
  specialties_en: string[];
  languages: string[];
};

export const founderProfile: FounderProfile = {
  id: 'founder-abdulrahman',
  slug: 'abdulrahman-muzher',
  name_ar: 'د. عبدالرحمن مزهر',
  name_en: 'Dr. Abdulrahman Muzher',
  title_ar: 'استشاري الطب النفسي ومعالجة الإدمان',
  title_en: 'Consultant Psychiatrist & Addiction Specialist',
  location: 'Amman, Jordan',
  image: '/images/founder.jpg',
  shortBio_ar:
    'استشاري طب نفسي بخبرة تتجاوز 30 عامًا، يركز على الطب النفسي للبالغين والمراهقين وعلاج الإدمان ضمن نهج علاجي متوازن قائم على الأدلة.',
  shortBio_en:
    'A consultant psychiatrist with 30+ years of clinical experience, focused on adult/adolescent psychiatry and addiction care through evidence-based treatment.',
  about_ar:
    'عمل د. عبدالرحمن مزهر في مؤسسات صحية نفسية متعددة في المنطقة، وأسهم في تطوير نماذج رعاية تجمع بين الدقة الطبية والإنصات الإنساني. يكرس عمله لبناء مسارات علاج واضحة وقابلة للمتابعة، مع التركيز على تحسين جودة حياة المريض على المدى الطويل.',
  about_en:
    'Dr. Abdulrahman Muzher has worked across major mental health settings in the region and helped shape practical care models that combine clinical rigor with human-centered support. His work focuses on clear treatment pathways and long-term patient well-being.',
  approach_ar:
    'يرتكز نهجه على تقييم سريري شامل، وخطة علاج شخصية، ومتابعة دورية تجمع بين العلاج الدوائي عند الحاجة والتدخلات النفسية الداعمة.',
  approach_en:
    'His professional approach is built on comprehensive assessment, personalized care planning, and structured follow-up combining medication management when needed with supportive psychotherapy.',
  philosophy_ar:
    'فلسفته العلاجية تقوم على أن التعافي رحلة مشتركة تبدأ بالثقة والوضوح، وأن كل مريض يستحق رعاية محترمة وآمنة بدون وصمة.',
  philosophy_en:
    'His therapy philosophy is that recovery is a collaborative journey rooted in trust and clarity, and that every patient deserves respectful, stigma-free care.',
  credentials: {
    education: [
      'Bachelor of Medicine and Surgery, Azerbaijan Medical University',
      'Advanced clinical training in Psychiatry'
    ],
    certifications: [
      'Jordanian Board in Psychiatry',
      'Clinical certification in addiction treatment pathways'
    ],
    yearsOfExperience: 31,
    memberships: [
      'Jordan Medical Council',
      'Regional Mental Health Clinical Network'
    ]
  },
  specialties_ar: ['القلق', 'الاكتئاب', 'علاج الإدمان', 'العلاج الأسري'],
  specialties_en: ['Anxiety', 'Depression', 'Addiction', 'Family Therapy'],
  languages: ['Arabic', 'English']
};

export const founderImageFallback =
  'https://rofanimaging.s3.amazonaws.com/profile_pic/%D8%A7%D9%84%D8%AF%D9%83%D8%AA%D9%88%D8%B1_%D8%B9%D8%A8%D8%AF_%D8%A7%D9%84%D8%B1%D8%AD%D9%85%D9%86_%D9%85%D8%B2%D9%87%D8%B1.jpg';
