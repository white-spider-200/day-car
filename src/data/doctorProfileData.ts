export type ProfileDoctor = {
  name: string;
  title: string;
  location: string;
  languages: string[];
  rating: number;
  reviewsCount: number;
  responseTimeText: string;
  pricePerSession: string;
  sessionLength: string;
  nextAvailable: string;
  bio: string;
  approach: string;
  experience: string;
  education: string;
  treats: string[];
  photo?: string;
  videoThumbnail?: string;
};

export type ServiceItem = {
  id: string;
  name: string;
  price: string;
  duration: string;
};

export type ReviewItem = {
  id: string;
  author: string;
  date: string;
  rating: number;
  text: string;
  anonymous?: boolean;
};

export type SimilarDoctor = {
  id: string;
  name: string;
  title: string;
  location: string;
  rating: number;
  photo?: string;
};

export const doctorProfile: ProfileDoctor = {
  name: 'Dr. Sara Al-Khaldi',
  title: 'Clinical Psychologist',
  location: 'Amman • Online',
  languages: ['Arabic', 'English'],
  rating: 4.9,
  reviewsCount: 210,
  responseTimeText: 'Usually responds within 2 hours',
  pricePerSession: '30 JOD / session',
  sessionLength: '50 minutes',
  nextAvailable: 'Today 6:30 PM',
  bio: 'Dr. Sara Al-Khaldi is a dedicated clinical psychologist committed to providing a safe, non-judgmental space for healing. With a focus on adult mental health and couples therapy, she helps her patients navigate complex emotional landscapes using a blend of empathy and evidence-based clinical strategy. Her goal is to empower every individual to rediscover their inner strength and build a resilient future.',
  approach:
    'My therapeutic philosophy is grounded in the belief that every person has the capacity for growth. I utilize an integrative approach, primarily drawing from Cognitive Behavioral Therapy (CBT) and Mindfulness-Based Stress Reduction. Together, we will identify the root causes of your challenges and develop practical, sustainable tools to improve your daily wellbeing and long-term mental health.',
  experience: 'Over 8 years of dedicated clinical practice. Previously served as a Senior Therapist at the Amman Mental Health Institute and has contributed to multiple research papers on trauma-focused therapy and emotional regulation.',
  education: "Master's in Clinical Psychology from the University of Jordan (High Honors). Certified Trauma Professional (CTP) and advanced training in Gottman Method for couples therapy.",
  treats: ['Anxiety', 'Depression', 'Couples Therapy', 'Trauma', 'ADHD', 'Burnout Recovery', 'Grief Counseling'],
  photo: 'data:image/jpeg;base64,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',
  videoThumbnail: 'https://images.unsplash.com/photo-1527137342181-19aab11a8ee1?auto=format&fit=crop&q=80&w=1200'
};

export const services: ServiceItem[] = [
  { id: 'individual', name: 'Individual Therapy', price: '30 JOD', duration: '50 min' },
  { id: 'couples', name: 'Couples Therapy', price: '40 JOD', duration: '60 min' },
  { id: 'online', name: 'Online Session', price: '25 JOD', duration: '45 min' }
];

export const weeklyAvailability: Record<string, string[]> = {
  Mon: ['09:00', '11:00', '14:00', '18:30'],
  Tue: ['10:00', '12:00', '15:30', '19:00'],
  Wed: ['09:30', '13:00', '16:30'],
  Thu: ['10:30', '14:30', '18:00'],
  Fri: ['09:00', '11:30', '17:30'],
  Sat: ['10:00', '12:30'],
  Sun: ['11:00', '15:00', '18:30']
};

export const ratingDistribution = [
  { stars: 5, count: 182 },
  { stars: 4, count: 20 },
  { stars: 3, count: 6 },
  { stars: 2, count: 1 },
  { stars: 1, count: 1 }
];

export const reviews: ReviewItem[] = [
  {
    id: 'r1',
    author: 'Lina M.',
    date: 'Jan 12, 2026',
    rating: 5,
    text: 'Very thoughtful and structured sessions. I left each appointment with practical steps I could apply immediately.'
  },
  {
    id: 'r2',
    author: 'Anonymous',
    date: 'Dec 28, 2025',
    rating: 5,
    text: 'She made it easy to open up. The CBT exercises significantly reduced my anxiety after a few weeks.',
    anonymous: true
  },
  {
    id: 'r3',
    author: 'Omar A.',
    date: 'Dec 05, 2025',
    rating: 4,
    text: 'Professional and calm. Scheduling was easy and the online sessions felt private and secure.'
  }
];

export const similarDoctors: SimilarDoctor[] = [
  {
    id: 'sd1',
    name: 'Dr. Rania Suleiman',
    title: 'Counseling Psychologist',
    location: 'Amman • Online',
    rating: 4.8,
    photo: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=200&h=200'
  },
  {
    id: 'sd2',
    name: 'Dr. Ahmad Naser',
    title: 'CBT Specialist',
    location: 'Irbid • Online',
    rating: 4.7,
    photo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200&h=200'
  },
  {
    id: 'sd3',
    name: 'Dr. Maya Qasem',
    title: 'Trauma Therapist',
    location: 'Amman • In-person',
    rating: 4.9,
    photo: 'https://images.unsplash.com/photo-1559839734-2b71f1536783?auto=format&fit=crop&q=80&w=200&h=200'
  }
];
