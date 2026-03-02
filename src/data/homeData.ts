export type Category = {
  nameKey: string;
  chipKey: string;
};

export type Doctor = {
  slug?: string;
  name: string;
  nameAr: string;
  title: string;
  titleAr: string;
  location: string;
  locationAr: string;
  price: string;
  priceAr: string;
  rating: number;
  reviewsCount: number;
  tags: string[];
  tagsAr: string[];
  isVerified: boolean;
  isTopDoctor?: boolean;
  photo?: string;
};

export const categories: Category[] = [
  { nameKey: 'cat.anxiety', chipKey: 'CBT' },
  { nameKey: 'cat.depression', chipKey: 'Mood' },
  { nameKey: 'cat.couples', chipKey: 'Therapy' },
  { nameKey: 'cat.trauma', chipKey: 'PTSD' },
  { nameKey: 'cat.adhd', chipKey: 'Focus' },
  { nameKey: 'cat.stress', chipKey: 'Work' }
];

export const featuredDoctors: Doctor[] = [
  {
    name: 'Dr. Leen Haddad',
    nameAr: 'د. لين حداد',
    title: 'Clinical Psychologist',
    titleAr: 'أخصائية نفسية سريرية',
    location: 'Amman • Online',
    locationAr: 'عمان • أونلاين',
    price: '30 JOD / session',
    priceAr: '30 دينار / جلسة',
    rating: 4.9,
    reviewsCount: 210,
    tags: ['Anxiety', 'CBT', 'Adults'],
    tagsAr: ['القلق', 'العلاج المعرفي السلوكي', 'البالغين'],
    isVerified: true,
    photo: 'https://images.unsplash.com/photo-1559839734-2b71f1536783?auto=format&fit=crop&q=80&w=400&h=400'
  },
  {
    name: 'Dr. Tareq Mansour',
    nameAr: 'د. طارق منصور',
    title: 'Psychotherapist',
    titleAr: 'معالج نفسي',
    location: 'Irbid • Online',
    locationAr: 'إربد • أونلاين',
    price: '28 JOD / session',
    priceAr: '28 دينار / جلسة',
    rating: 4.8,
    reviewsCount: 168,
    tags: ['Depression', 'Mood', 'Teens'],
    tagsAr: ['الاكتئاب', 'المزاج', 'المراهقين'],
    isVerified: true,
    photo: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400&h=400'
  },
  {
    name: 'Dr. Sarah Khoury',
    nameAr: 'د. سارة خوري',
    title: 'Family & Couples Therapist',
    titleAr: 'معالجة عائلية وللأزواج',
    location: 'Amman • In-person',
    locationAr: 'عمان • وجاهي',
    price: '35 JOD / session',
    priceAr: '35 دينار / جلسة',
    rating: 4.9,
    reviewsCount: 142,
    tags: ['Couples', 'Communication', 'Marriage'],
    tagsAr: ['الأزواج', 'التواصل', 'الزواج'],
    isVerified: true,
    photo: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=400&h=400'
  },
  {
    name: 'Dr. Omar Nasser',
    nameAr: 'د. عمر ناصر',
    title: 'Trauma Specialist',
    titleAr: 'متخصص في الصدمات',
    location: 'Zarqa • Online',
    locationAr: 'الزرقاء • أونلاين',
    price: '32 JOD / session',
    priceAr: '32 دينار / جلسة',
    rating: 4.7,
    reviewsCount: 121,
    tags: ['Trauma', 'PTSD', 'EMDR'],
    tagsAr: ['الصدمات', 'اضطراب ما بعد الصدمة', 'EMDR'],
    isVerified: true,
    photo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400&h=400'
  },
  {
    name: 'Dr. Rana Al-Zein',
    nameAr: 'د. رنا الزين',
    title: 'Child & Adolescent Psychologist',
    titleAr: 'أخصائية نفسية للأطفال والمراهقين',
    location: 'Amman • Online',
    locationAr: 'عمان • أونلاين',
    price: '29 JOD / session',
    priceAr: '29 دينار / جلسة',
    rating: 4.8,
    reviewsCount: 189,
    tags: ['ADHD', 'Focus', 'Parenting'],
    tagsAr: ['تشتت الانتباه', 'التركيز', 'تربية الأطفال'],
    isVerified: true,
    photo: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=400&h=400'
  },
  {
    name: 'Dr. Yousef Khalil',
    nameAr: 'د. يوسف خليل',
    title: 'Counseling Psychologist',
    titleAr: 'أخصائي إرشاد نفسي',
    location: 'Aqaba • Online',
    locationAr: 'العقبة • أونلاين',
    price: '27 JOD / session',
    priceAr: '27 دينار / جلسة',
    rating: 4.8,
    reviewsCount: 154,
    tags: ['Stress', 'Burnout', 'Work'],
    tagsAr: ['الضغوط', 'الاحتراق النفسي', 'العمل'],
    isVerified: true,
    photo: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400&h=400'
  },
  {
    name: 'Dr. Test Doctor',
    nameAr: 'د. طبيب تجريبي',
    title: 'QA Test Profile',
    titleAr: 'ملف تجريبي للاختبار',
    location: 'Amman • Online',
    locationAr: 'عمان • أونلاين',
    price: '30 JOD / session',
    priceAr: '30 دينار / جلسة',
    rating: 4.6,
    reviewsCount: 12,
    tags: ['Test', 'CBT', 'Demo'],
    tagsAr: ['تجريبي', 'العلاج المعرفي السلوكي', 'عرض'],
    isVerified: true,
    photo: 'https://images.unsplash.com/photo-1612277795421-9bc7706a4a41?auto=format&fit=crop&q=80&w=400&h=400'
  }
];
