// ============================================
// USER PROFILE DATA MODELS & TYPES
// ============================================

// ============================================
// 1. USER/PATIENT PROFILE
// ============================================
export type UserProfile = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  country: string;
  timezone: string;
  language: string;
  profilePhoto?: string;
  accountStatus: 'active' | 'suspended' | 'needs_review';
  lastActivity: string; // ISO timestamp
  joinedAt: string; // ISO timestamp
  emergencyContact?: {
    name: string;
    phone: string;
  };
};

// ============================================
// 2. INTAKE ASSESSMENT
// ============================================
export type UserIntake = {
  userId: string;
  primaryGoal: string;
  symptoms: string[];
  urgencyLevel: 'low' | 'medium' | 'high';
  preferredSessionType: ('chat' | 'video' | 'voice')[];
  preferredDoctorGender?: 'any' | 'male' | 'female';
  userMessage: string;
  createdAt: string;
  updatedAt: string;
};

// ============================================
// 3. SESSION/APPOINTMENT
// ============================================
export type UserSession = {
  id: string;
  userId: string;
  doctorId: string;
  doctorName: string;
  sessionType: 'chat' | 'video' | 'voice';
  scheduledAt: string;
  duration: number;
  timezone: string;
  status: 'scheduled' | 'completed' | 'no-show' | 'cancelled' | 'rescheduled';
  joinLink?: string;
  sessionNotes?: string;
  doctorNotes?: string;
  rating?: number;
  userFeedback?: string;
  cancelledAt?: string;
  cancelledBy?: 'user' | 'doctor' | 'admin';
  cancellationReason?: string;
};

// ============================================
// 4. TREATMENT PLAN
// ============================================
export type TreatmentGoal = {
  id: string;
  title: string;
  description: string;
  targetDate?: string;
  completed: boolean;
  progress: number;
};

export type UserTreatmentPlan = {
  id: string;
  userId: string;
  assignedDoctorId: string;
  assignedDoctorName: string;
  status: 'active' | 'completed' | 'paused';
  startDate: string;
  expectedEndDate?: string;
  goals: TreatmentGoal[];
  progressNotes: string;
  createdAt: string;
  updatedAt: string;
};

// ============================================
// 5. ADMIN NOTES (INTERNAL)
// ============================================
export type AdminNotes = {
  userId: string;
  adminNotes: string;
  doctorNotes: string;
  riskFlags: string[];
  lastUpdated: string;
  updatedBy: string;
};

// ============================================
// 6. PAYMENT/SUBSCRIPTION
// ============================================
export type PaymentTransaction = {
  date: string;
  amount: number;
  status: 'completed' | 'failed' | 'refunded';
  transactionId: string;
};

export type UserPayment = {
  id: string;
  userId: string;
  subscriptionStatus: 'active' | 'cancelled' | 'expired';
  packageType: 'starter' | 'standard' | 'premium';
  amount: number;
  currency: string;
  billingCycle: 'monthly' | 'quarterly' | 'annual';
  startDate: string;
  renewalDate: string;
  transactionHistory: PaymentTransaction[];
};

// ============================================
// 7. ACTIVITY LOG
// ============================================
export type UserActivityLog = {
  userId: string;
  timestamp: string;
  action: string;
  changedBy: 'user' | 'doctor' | 'admin';
  details: Record<string, any>;
};

// ============================================
// MOCK DATA - SAMPLE USERS
// ============================================

const now = new Date();
const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
const tomorrowAt2PM = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 14, 0);

// Sample User 1: Active with upcoming session
export const userSampleSarah: UserProfile = {
  id: 'user-001',
  fullName: 'Sarah Johnson',
  email: 'sarah.j****@gmail.com',
  phone: '+962 79 123 4567',
  country: 'Jordan',
  timezone: 'UTC+3',
  language: 'English',
  accountStatus: 'active',
  lastActivity: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
  joinedAt: new Date(2024, 0, 15).toISOString(),
  emergencyContact: {
    name: 'John Johnson',
    phone: '+962 79 765 4321'
  }
};

export const intakeSarah: UserIntake = {
  userId: 'user-001',
  primaryGoal: 'Anxiety Management',
  symptoms: ['Panic Attacks', 'Sleep Issues', 'Racing Thoughts'],
  urgencyLevel: 'high',
  preferredSessionType: ['video', 'chat'],
  preferredDoctorGender: 'female',
  userMessage: 'I have been experiencing panic attacks for the past 3 months. They usually happen in the mornings and make it hard to start my day. I\'m looking for practical coping strategies.',
  createdAt: new Date(2024, 0, 15).toISOString(),
  updatedAt: new Date(2024, 0, 15).toISOString()
};

export const sessionsSarah: UserSession[] = [
  {
    id: 'session-001',
    userId: 'user-001',
    doctorId: 'doc-002',
    doctorName: 'Dr. Sara Al-Khaldi',
    sessionType: 'video',
    scheduledAt: oneHourLater.toISOString(),
    duration: 50,
    timezone: 'UTC+3',
    status: 'scheduled',
    joinLink: 'https://mindcare.video/room/session-001'
  },
  {
    id: 'session-002',
    userId: 'user-001',
    doctorId: 'doc-002',
    doctorName: 'Dr. Sara Al-Khaldi',
    sessionType: 'video',
    scheduledAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 50,
    timezone: 'UTC+3',
    status: 'scheduled'
  },
  {
    id: 'session-003',
    userId: 'user-001',
    doctorId: 'doc-002',
    doctorName: 'Dr. Sara Al-Khaldi',
    sessionType: 'video',
    scheduledAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 50,
    timezone: 'UTC+3',
    status: 'completed',
    sessionNotes: 'Discussed breathing techniques and anxiety triggers',
    doctorNotes: 'Patient was receptive to CBT techniques. No panic episodes reported this week.',
    rating: 5,
    userFeedback: 'Dr. Sara was very helpful and understanding. Already feeling better!'
  }
];

export const treatmentPlanSarah: UserTreatmentPlan = {
  id: 'plan-001',
  userId: 'user-001',
  assignedDoctorId: 'doc-002',
  assignedDoctorName: 'Dr. Sara Al-Khaldi',
  status: 'active',
  startDate: new Date(2024, 0, 15).toISOString(),
  expectedEndDate: new Date(2024, 4, 15).toISOString(),
  goals: [
    {
      id: 'goal-001',
      title: 'Reduce panic attack frequency',
      description: 'Decrease panic attacks from 3x per week to 1x per month',
      targetDate: new Date(2024, 3, 15).toISOString(),
      completed: false,
      progress: 45
    },
    {
      id: 'goal-002',
      title: 'Develop coping strategies',
      description: 'Master 3 evidence-based techniques for anxiety management',
      targetDate: new Date(2024, 2, 15).toISOString(),
      completed: false,
      progress: 60
    },
    {
      id: 'goal-003',
      title: 'Improve sleep quality',
      description: 'Achieve 6-7 hours of consistent sleep per night',
      targetDate: new Date(2024, 3, 15).toISOString(),
      completed: false,
      progress: 30
    }
  ],
  progressNotes: 'Good progress on cognitive techniques. Patient is motivated.',
  createdAt: new Date(2024, 0, 15).toISOString(),
  updatedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
};

export const adminNotesSarah: AdminNotes = {
  userId: 'user-001',
  adminNotes: 'Check-in recommended after 30 days to assess progress. Patient is very engaged with treatment.',
  doctorNotes: 'Patient shows good insight into her anxiety patterns. Responding well to CBT.',
  riskFlags: [],
  lastUpdated: now.toISOString(),
  updatedBy: 'admin-001'
};

export const paymentSarah: UserPayment = {
  id: 'payment-001',
  userId: 'user-001',
  subscriptionStatus: 'active',
  packageType: 'standard',
  amount: 299,
  currency: 'JOD',
  billingCycle: 'monthly',
  startDate: new Date(2024, 0, 15).toISOString(),
  renewalDate: new Date(2024, 1, 15).toISOString(),
  transactionHistory: [
    {
      date: new Date(2024, 0, 15).toISOString(),
      amount: 299,
      status: 'completed',
      transactionId: 'TXN-001-2024'
    }
  ]
};

// Sample User 2: Needs Review
export const userAhmed: UserProfile = {
  id: 'user-002',
  fullName: 'Ahmed Hassan',
  email: 'ahmed.h****@outlook.com',
  phone: null,
  country: 'Saudi Arabia',
  timezone: 'UTC+3',
  language: 'Arabic',
  accountStatus: 'needs_review',
  lastActivity: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  joinedAt: new Date(2024, 1, 10).toISOString()
};

export const intakeAhmed: UserIntake = {
  userId: 'user-002',
  primaryGoal: 'Stress Management',
  symptoms: ['Work Stress', 'Irritability', 'Difficulty Concentrating'],
  urgencyLevel: 'medium',
  preferredSessionType: ['chat', 'voice'],
  userMessage: 'I\'ve been under a lot of pressure at work and it\'s affecting my personal life. Need help managing stress.',
  createdAt: new Date(2024, 1, 10).toISOString(),
  updatedAt: new Date(2024, 1, 10).toISOString()
};

export const sessionsAhmed: UserSession[] = [
  {
    id: 'session-004',
    userId: 'user-002',
    doctorId: 'doc-001',
    doctorName: 'Dr. Abdelrahman Mizher',
    sessionType: 'chat',
    scheduledAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 50,
    timezone: 'UTC+3',
    status: 'scheduled'
  }
];

export const treatmentPlanAhmed: UserTreatmentPlan = {
  id: 'plan-002',
  userId: 'user-002',
  assignedDoctorId: 'doc-001',
  assignedDoctorName: 'Dr. Abdelrahman Mizher',
  status: 'active',
  startDate: new Date(2024, 1, 10).toISOString(),
  expectedEndDate: new Date(2024, 5, 10).toISOString(),
  goals: [
    {
      id: 'goal-004',
      title: 'Develop work-life balance',
      description: 'Establish boundaries between work and personal time',
      targetDate: new Date(2024, 3, 10).toISOString(),
      completed: false,
      progress: 20
    }
  ],
  progressNotes: 'Just starting treatment plan.',
  createdAt: new Date(2024, 1, 10).toISOString(),
  updatedAt: new Date(2024, 1, 10).toISOString()
};

export const adminNotesAhmed: AdminNotes = {
  userId: 'user-002',
  adminNotes: 'First session not yet completed. Monitor for engagement.',
  doctorNotes: '',
  riskFlags: [],
  lastUpdated: new Date(2024, 1, 10).toISOString(),
  updatedBy: 'admin-001'
};

export const paymentAhmed: UserPayment = {
  id: 'payment-002',
  userId: 'user-002',
  subscriptionStatus: 'active',
  packageType: 'starter',
  amount: 199,
  currency: 'SAR',
  billingCycle: 'monthly',
  startDate: new Date(2024, 1, 10).toISOString(),
  renewalDate: new Date(2024, 2, 10).toISOString(),
  transactionHistory: []
};

// Sample User 3: Suspended
export const userFatima: UserProfile = {
  id: 'user-003',
  fullName: 'Fatima Al-Mansoori',
  email: 'fatima.a****@hotmail.com',
  phone: '+971 50 123 4567',
  country: 'UAE',
  timezone: 'UTC+4',
  language: 'Arabic',
  accountStatus: 'suspended',
  lastActivity: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  joinedAt: new Date(2023, 8, 5).toISOString()
};

// Sample User 4: Active, Completed Plan
export const userMohammed: UserProfile = {
  id: 'user-004',
  fullName: 'Mohammed Al-Rashid',
  email: 'mohammed.r****@gmail.com',
  phone: '+966 50 987 6543',
  country: 'Saudi Arabia',
  timezone: 'UTC+3',
  language: 'English',
  accountStatus: 'active',
  lastActivity: now.toISOString(),
  joinedAt: new Date(2023, 9, 1).toISOString()
};

export const intakeMohammed: UserIntake = {
  userId: 'user-004',
  primaryGoal: 'Relationship Counseling',
  symptoms: ['Communication Issues', 'Conflict Resolution'],
  urgencyLevel: 'medium',
  preferredSessionType: ['video', 'chat'],
  preferredDoctorGender: 'any',
  userMessage: 'My spouse and I want to improve our communication and resolve ongoing conflicts.',
  createdAt: new Date(2023, 9, 1).toISOString(),
  updatedAt: new Date(2023, 9, 1).toISOString()
};

// Sample User 5: High Urgency
export const userLeila: UserProfile = {
  id: 'user-005',
  fullName: 'Leila Hassan',
  email: 'leila.h****@yahoo.com',
  phone: '+961 76 123 4567',
  country: 'Lebanon',
  timezone: 'UTC+2',
  language: 'Arabic',
  accountStatus: 'active',
  lastActivity: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
  joinedAt: new Date(2024, 2, 1).toISOString(),
  emergencyContact: {
    name: 'Mariam Hassan',
    phone: '+961 76 987 6543'
  }
};

export const intakeLeila: UserIntake = {
  userId: 'user-005',
  primaryGoal: 'Depression & Grief Support',
  symptoms: ['Depression', 'Loss of Interest', 'Sleep Disturbance', 'Hopelessness'],
  urgencyLevel: 'high',
  preferredSessionType: ['chat', 'video'],
  userMessage: 'Recently lost my mother and struggling with grief. Everything feels overwhelming.',
  createdAt: new Date(2024, 2, 1).toISOString(),
  updatedAt: new Date(2024, 2, 1).toISOString()
};

export const sessionsLeila: UserSession[] = [
  {
    id: 'session-005',
    userId: 'user-005',
    doctorId: 'doc-003',
    doctorName: 'Dr. Noor Karim',
    sessionType: 'chat',
    scheduledAt: tomorrowAt2PM.toISOString(),
    duration: 60,
    timezone: 'UTC+2',
    status: 'scheduled'
  }
];

export const treatmentPlanLeila: UserTreatmentPlan = {
  id: 'plan-003',
  userId: 'user-005',
  assignedDoctorId: 'doc-003',
  assignedDoctorName: 'Dr. Noor Karim',
  status: 'active',
  startDate: new Date(2024, 2, 1).toISOString(),
  goals: [
    {
      id: 'goal-005',
      title: 'Process grief and loss',
      description: 'Work through stages of grief in healthy way',
      completed: false,
      progress: 15
    },
    {
      id: 'goal-006',
      title: 'Rebuild daily functioning',
      description: 'Establish routine and basic self-care habits',
      completed: false,
      progress: 25
    }
  ],
  progressNotes: 'Initial assessment completed. High priority case.',
  createdAt: new Date(2024, 2, 1).toISOString(),
  updatedAt: now.toISOString()
};

export const adminNotesLeila: AdminNotes = {
  userId: 'user-005',
  adminNotes: 'HIGH PRIORITY. Recent grief. Next session scheduled ASAP. Monitor for crisis signs.',
  doctorNotes: 'Initial session pending',
  riskFlags: ['grief-support-needed', 'monitor-mood'],
  lastUpdated: now.toISOString(),
  updatedBy: 'admin-001'
};

export const paymentLeila: UserPayment = {
  id: 'payment-003',
  userId: 'user-005',
  subscriptionStatus: 'active',
  packageType: 'premium',
  amount: 499,
  currency: 'LBP',
  billingCycle: 'monthly',
  startDate: new Date(2024, 2, 1).toISOString(),
  renewalDate: new Date(2024, 3, 1).toISOString(),
  transactionHistory: []
};

// ============================================
// SAMPLE ACTIVITY LOGS
// ============================================

export const activityLogsSarah: UserActivityLog[] = [
  {
    userId: 'user-001',
    timestamp: now.toISOString(),
    action: 'Session completed',
    changedBy: 'doctor',
    details: { sessionId: 'session-003', doctorId: 'doc-002' }
  },
  {
    userId: 'user-001',
    timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    action: 'Session scheduled',
    changedBy: 'user',
    details: { sessionId: 'session-002', date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString() }
  },
  {
    userId: 'user-001',
    timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    action: 'Profile updated',
    changedBy: 'user',
    details: { updatedFields: ['phone', 'emergencyContact'] }
  },
  {
    userId: 'user-001',
    timestamp: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    action: 'Treatment plan created',
    changedBy: 'doctor',
    details: { planId: 'plan-001' }
  }
];

// ============================================
// COMPILED USER DATA SETS
// ============================================

export type FullUserProfile = {
  user: UserProfile;
  intake: UserIntake;
  sessions: UserSession[];
  treatmentPlan: UserTreatmentPlan;
  adminNotes: AdminNotes;
  payment: UserPayment;
  activityLogs: UserActivityLog[];
};

export const userDataSets: FullUserProfile[] = [
  {
    user: userSampleSarah,
    intake: intakeSarah,
    sessions: sessionsSarah,
    treatmentPlan: treatmentPlanSarah,
    adminNotes: adminNotesSarah,
    payment: paymentSarah,
    activityLogs: activityLogsSarah
  },
  {
    user: userAhmed,
    intake: intakeAhmed,
    sessions: sessionsAhmed,
    treatmentPlan: treatmentPlanAhmed,
    adminNotes: adminNotesAhmed,
    payment: paymentAhmed,
    activityLogs: []
  },
  {
    user: userFatima,
    intake: {
      userId: 'user-003',
      primaryGoal: 'Insomnia',
      symptoms: ['Insomnia', 'Daytime Fatigue'],
      urgencyLevel: 'medium',
      preferredSessionType: ['chat'],
      userMessage: 'Unable to sleep for months',
      createdAt: new Date(2023, 8, 5).toISOString(),
      updatedAt: new Date(2023, 8, 5).toISOString()
    },
    sessions: [],
    treatmentPlan: {
      id: 'plan-suspended',
      userId: 'user-003',
      assignedDoctorId: '',
      assignedDoctorName: '',
      status: 'paused',
      startDate: new Date(2023, 8, 5).toISOString(),
      goals: [],
      progressNotes: 'Account suspended',
      createdAt: new Date(2023, 8, 5).toISOString(),
      updatedAt: new Date(2023, 8, 5).toISOString()
    },
    adminNotes: {
      userId: 'user-003',
      adminNotes: 'Account suspended due to terms violation. Review case on 2024-04-01.',
      doctorNotes: '',
      riskFlags: [],
      lastUpdated: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      updatedBy: 'admin-001'
    },
    payment: {
      id: 'payment-suspended',
      userId: 'user-003',
      subscriptionStatus: 'cancelled',
      packageType: 'starter',
      amount: 199,
      currency: 'AED',
      billingCycle: 'monthly',
      startDate: new Date(2023, 8, 5).toISOString(),
      renewalDate: new Date(2023, 9, 5).toISOString(),
      transactionHistory: []
    },
    activityLogs: []
  },
  {
    user: userMohammed,
    intake: intakeMohammed,
    sessions: [
      {
        id: 'session-006',
        userId: 'user-004',
        doctorId: 'doc-004',
        doctorName: 'Dr. Karim Nabil',
        sessionType: 'video',
        scheduledAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        duration: 50,
        timezone: 'UTC+3',
        status: 'completed',
        doctorNotes: 'Patient and spouse show good communication. Progress made on conflict resolution.',
        rating: 4,
        userFeedback: 'Very helpful session.'
      }
    ],
    treatmentPlan: {
      id: 'plan-004',
      userId: 'user-004',
      assignedDoctorId: 'doc-004',
      assignedDoctorName: 'Dr. Karim Nabil',
      status: 'completed',
      startDate: new Date(2023, 9, 1).toISOString(),
      expectedEndDate: new Date(2024, 1, 1).toISOString(),
      goals: [
        {
          id: 'goal-007',
          title: 'Rebuild communication',
          description: 'Establish healthy dialogue patterns',
          completed: true,
          progress: 100
        }
      ],
      progressNotes: 'Treatment plan successfully completed.',
      createdAt: new Date(2023, 9, 1).toISOString(),
      updatedAt: new Date(2024, 1, 1).toISOString()
    },
    adminNotes: {
      userId: 'user-004',
      adminNotes: 'Treatment completed successfully. User satisfied with outcome.',
      doctorNotes: 'Couple therapy completed. Both parties engaged throughout.',
      riskFlags: [],
      lastUpdated: new Date(2024, 1, 1).toISOString(),
      updatedBy: 'admin-001'
    },
    payment: {
      id: 'payment-004',
      userId: 'user-004',
      subscriptionStatus: 'expired',
      packageType: 'standard',
      amount: 299,
      currency: 'SAR',
      billingCycle: 'monthly',
      startDate: new Date(2023, 9, 1).toISOString(),
      renewalDate: new Date(2024, 1, 1).toISOString(),
      transactionHistory: [
        {
          date: new Date(2023, 9, 1).toISOString(),
          amount: 299,
          status: 'completed',
          transactionId: 'TXN-004-2023'
        },
        {
          date: new Date(2023, 10, 1).toISOString(),
          amount: 299,
          status: 'completed',
          transactionId: 'TXN-004-2023-1'
        },
        {
          date: new Date(2023, 11, 1).toISOString(),
          amount: 299,
          status: 'completed',
          transactionId: 'TXN-004-2023-2'
        }
      ]
    },
    activityLogs: []
  },
  {
    user: userLeila,
    intake: intakeLeila,
    sessions: sessionsLeila,
    treatmentPlan: treatmentPlanLeila,
    adminNotes: adminNotesLeila,
    payment: paymentLeila,
    activityLogs: [
      {
        userId: 'user-005',
        timestamp: now.toISOString(),
        action: 'Session scheduled',
        changedBy: 'admin',
        details: { sessionId: 'session-005', doctorId: 'doc-003', urgency: 'high' }
      }
    ]
  }
];

// Helper function to get full user data by ID
export function getUserDataById(userId: string): FullUserProfile | undefined {
  return userDataSets.find(data => data.user.id === userId);
}

// Helper function to get all users (for list view)
export function getAllUsers(): UserProfile[] {
  return userDataSets.map(data => data.user);
}
