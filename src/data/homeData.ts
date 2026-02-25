export type Category = {
  name: string;
  chip: string;
};

export type Doctor = {
  name: string;
  title: string;
  location: string;
  price: string;
  rating: number;
  reviewsCount: number;
  tags: [string, string, string];
  isVerified: boolean;
};

export const categories: Category[] = [
  { name: 'Anxiety', chip: 'CBT' },
  { name: 'Depression', chip: 'Mood' },
  { name: 'Couples', chip: 'Therapy' },
  { name: 'Trauma', chip: 'PTSD' },
  { name: 'ADHD', chip: 'Focus' },
  { name: 'Stress', chip: 'Work' }
];

export const featuredDoctors: Doctor[] = [
  {
    name: 'Dr. Leen Haddad',
    title: 'Clinical Psychologist',
    location: 'Amman • Online',
    price: '30 JOD / session',
    rating: 4.9,
    reviewsCount: 210,
    tags: ['Anxiety', 'CBT', 'Adults'],
    isVerified: true
  },
  {
    name: 'Dr. Tareq Mansour',
    title: 'Psychotherapist',
    location: 'Irbid • Online',
    price: '28 JOD / session',
    rating: 4.8,
    reviewsCount: 168,
    tags: ['Depression', 'Mood', 'Teens'],
    isVerified: true
  },
  {
    name: 'Dr. Sarah Khoury',
    title: 'Family & Couples Therapist',
    location: 'Amman • In-person',
    price: '35 JOD / session',
    rating: 4.9,
    reviewsCount: 142,
    tags: ['Couples', 'Communication', 'Marriage'],
    isVerified: true
  },
  {
    name: 'Dr. Omar Nasser',
    title: 'Trauma Specialist',
    location: 'Zarqa • Online',
    price: '32 JOD / session',
    rating: 4.7,
    reviewsCount: 121,
    tags: ['Trauma', 'PTSD', 'EMDR'],
    isVerified: true
  },
  {
    name: 'Dr. Rana Al-Zein',
    title: 'Child & Adolescent Psychologist',
    location: 'Amman • Online',
    price: '29 JOD / session',
    rating: 4.8,
    reviewsCount: 189,
    tags: ['ADHD', 'Focus', 'Parenting'],
    isVerified: true
  },
  {
    name: 'Dr. Yousef Khalil',
    title: 'Counseling Psychologist',
    location: 'Aqaba • Online',
    price: '27 JOD / session',
    rating: 4.8,
    reviewsCount: 154,
    tags: ['Stress', 'Burnout', 'Work'],
    isVerified: true
  }
];
