import type { AvailabilitySlot } from '../components/profile/AvailabilitySection';

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
  photo: 'https://img.freepik.com/free-photo/doctor-home-visiting-patient_23-2148962254.jpg?semt=ais_hybrid&w=740',
  videoThumbnail: 'https://images.unsplash.com/photo-1527137342181-19aab11a8ee1?auto=format&fit=crop&q=80&w=1200'
};

export const services: ServiceItem[] = [
  { id: 'individual', name: 'Individual Therapy', price: '30 JOD', duration: '50 min' },
  { id: 'couples', name: 'Couples Therapy', price: '40 JOD', duration: '60 min' },
  { id: 'online', name: 'Online Session', price: '25 JOD', duration: '45 min' }
];

export const weeklyAvailability: Record<string, AvailabilitySlot[]> = {
  Mon: [
    { time: '09:00', status: 'available' },
    { time: '11:00', status: 'booked' },
    { time: '14:00', status: 'available' },
    { time: '18:30', status: 'available' }
  ],
  Tue: [
    { time: '10:00', status: 'booked' },
    { time: '12:00', status: 'available' },
    { time: '15:30', status: 'available' },
    { time: '19:00', status: 'booked' }
  ],
  Wed: [
    { time: '09:30', status: 'available' },
    { time: '13:00', status: 'booked' },
    { time: '16:30', status: 'available' },
    { time: '--:--', status: 'unavailable' }
  ],
  Thu: [
    { time: '10:30', status: 'booked' },
    { time: '14:30', status: 'available' },
    { time: '18:00', status: 'available' },
    { time: '--:--', status: 'unavailable' }
  ],
  Fri: [
    { time: '09:00', status: 'available' },
    { time: '11:30', status: 'available' },
    { time: '17:30', status: 'booked' },
    { time: '--:--', status: 'unavailable' }
  ],
  Sat: [
    { time: '10:00', status: 'booked' },
    { time: '12:30', status: 'available' },
    { time: '--:--', status: 'unavailable' },
    { time: '--:--', status: 'unavailable' }
  ],
  Sun: [
    { time: '11:00', status: 'available' },
    { time: '15:00', status: 'booked' },
    { time: '18:30', status: 'available' },
    { time: '--:--', status: 'unavailable' }
  ]
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
    photo: 'https://img.freepik.com/free-photo/medium-shot-doctor-with-crossed-arms_23-2148868313.jpg'
  },
  {
    id: 'sd2',
    name: 'Dr. Ahmad Naser',
    title: 'CBT Specialist',
    location: 'Irbid • Online',
    rating: 4.7,
    photo: 'https://img.freepik.com/free-photo/medium-shot-doctor-with-crossed-arms_23-2148868313.jpg'
  },
  {
    id: 'sd3',
    name: 'Dr. Maya Qasem',
    title: 'Trauma Therapist',
    location: 'Amman • In-person',
    rating: 4.9,
    photo: 'https://img.freepik.com/free-photo/medium-shot-doctor-with-crossed-arms_23-2148868313.jpg'
  }
];
