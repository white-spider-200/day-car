export type AdminDoctorStatus = 'pending' | 'accepted' | 'closed';

export type AdminDocumentStatus = 'uploaded' | 'missing';

export type AdminDocument = {
  filename: string;
  status: AdminDocumentStatus;
  previewLabel: string;
};

export type AdminEducationItem = {
  degree: string;
  university: string;
  year: number;
};

export type AdminExperienceItem = {
  role: string;
  workplace: string;
  years: string;
};

export type AdminWeeklyBlock = {
  day: string;
  start: string;
  end: string;
};

export type AdminHistoryEntry = {
  at: string;
  action: string;
};

export type AdminDoctor = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl: string;
  city: string;
  isOnline: boolean;
  specialty: string;
  subSpecialties: string[];
  languages: string[];
  bio: string;
  approach: string;
  treats: string[];
  education: AdminEducationItem[];
  experience: AdminExperienceItem[];
  sessionTypes: string[];
  availability: {
    timezone: string;
    weeklyBlocks: AdminWeeklyBlock[];
  };
  identity: {
    legalFullName: string;
    emailVerified: boolean;
    phoneVerified: boolean;
    profilePhotoQuality: 'ok' | 'needs_changes';
  };
  documents: {
    idDoc: AdminDocument;
    licenseDoc: AdminDocument;
    degreeDoc: AdminDocument;
  };
  license: {
    id: string;
    authority: string;
    country: string;
    expiry: string;
  };
  submittedAt: string;
  status: AdminDoctorStatus;
  closeReason: string;
  adminNotes: string;
  duplicateAccountFlag: boolean;
  suspiciousDataFlag: boolean;
  history: AdminHistoryEntry[];
};

type DoctorSeed = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl: string;
  city: string;
  isOnline: boolean;
  specialty: string;
  subSpecialties: string[];
  languages: string[];
  submittedAt: string;
  status: AdminDoctorStatus;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  profilePhotoQuality?: 'ok' | 'needs_changes';
  idDocStatus?: AdminDocumentStatus;
  licenseDocStatus?: AdminDocumentStatus;
  degreeDocStatus?: AdminDocumentStatus;
  timezone?: string;
  missingSchedule?: boolean;
  duplicateAccountFlag?: boolean;
  suspiciousDataFlag?: boolean;
  closeReason?: string;
  adminNotes?: string;
};

const specialtyTreats: Record<string, string[]> = {
  'Clinical Psychologist': ['Anxiety', 'Depression', 'Stress'],
  Psychotherapist: ['Burnout', 'Life transitions', 'Mood challenges'],
  'Family Therapist': ['Couples', 'Communication', 'Parenting'],
  'Trauma Specialist': ['Trauma', 'PTSD', 'Emotional regulation'],
  'Child Psychologist': ['ADHD', 'Behavior', 'School adjustment'],
  'Counseling Psychologist': ['Self-esteem', 'Work stress', 'Relationship issues'],
  'Perinatal Psychologist': ['Postpartum support', 'Maternal stress', 'Family adaptation']
};

function shiftDays(isoDate: string, days: number) {
  const date = new Date(isoDate);
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

function createHistory(seed: DoctorSeed): AdminHistoryEntry[] {
  const history: AdminHistoryEntry[] = [{ at: seed.submittedAt, action: 'Submitted application' }];

  if (seed.adminNotes) {
    history.push({ at: shiftDays(seed.submittedAt, 1), action: 'Admin note added' });
  }

  if (seed.status === 'accepted') {
    history.push({ at: shiftDays(seed.submittedAt, 2), action: 'Status changed to Accepted by Admin' });
  }

  if (seed.status === 'closed') {
    history.push({
      at: shiftDays(seed.submittedAt, 2),
      action: `Closed: ${seed.closeReason ?? 'Other'}`
    });
  }

  return history;
}

function buildDoctor(seed: DoctorSeed): AdminDoctor {
  const treats = specialtyTreats[seed.specialty] ?? ['Anxiety', 'Stress', 'Wellbeing'];

  return {
    id: seed.id,
    name: seed.name,
    email: seed.email,
    phone: seed.phone,
    avatarUrl: seed.avatarUrl,
    city: seed.city,
    isOnline: seed.isOnline,
    specialty: seed.specialty,
    subSpecialties: seed.subSpecialties,
    languages: seed.languages,
    bio: `${seed.name} provides structured support with practical tools and a calm clinical style for adults, teens, and families as appropriate.`,
    approach: 'Uses evidence-informed methods such as CBT and mindfulness with collaborative session goals and regular progress reviews.',
    treats,
    education: [
      { degree: 'MSc Clinical Psychology', university: 'University of Jordan', year: 2016 },
      { degree: 'BSc Psychology', university: 'Yarmouk University', year: 2012 }
    ],
    experience: [
      { role: 'Senior Therapist', workplace: 'Mind Health Center', years: '2019 - Present' },
      { role: 'Clinical Psychologist', workplace: 'City Counseling Clinic', years: '2016 - 2019' }
    ],
    sessionTypes: seed.isOnline ? ['Online', 'In-person', 'Individual'] : ['In-person', 'Individual', 'Couples'],
    availability: {
      timezone: seed.timezone ?? 'Asia/Amman',
      weeklyBlocks: seed.missingSchedule
        ? []
        : [
            { day: 'Mon', start: '09:00', end: '12:00' },
            { day: 'Wed', start: '15:00', end: '18:00' },
            { day: 'Fri', start: '10:00', end: '13:00' }
          ]
    },
    identity: {
      legalFullName: seed.name,
      emailVerified: seed.emailVerified ?? true,
      phoneVerified: seed.phoneVerified ?? true,
      profilePhotoQuality: seed.profilePhotoQuality ?? 'ok'
    },
    documents: {
      idDoc: {
        filename: `${seed.id}-id.pdf`,
        status: seed.idDocStatus ?? 'uploaded',
        previewLabel: 'National ID / Passport'
      },
      licenseDoc: {
        filename: `${seed.id}-license.pdf`,
        status: seed.licenseDocStatus ?? 'uploaded',
        previewLabel: 'Professional License'
      },
      degreeDoc: {
        filename: `${seed.id}-degree.pdf`,
        status: seed.degreeDocStatus ?? 'uploaded',
        previewLabel: 'Degree Certificate'
      }
    },
    license: {
      id: `MC-LIC-${seed.id.slice(-4)}`,
      authority: 'Jordan Health Council',
      country: 'Jordan',
      expiry: '2028-12-31'
    },
    submittedAt: seed.submittedAt,
    status: seed.status,
    closeReason: seed.closeReason ?? '',
    adminNotes: seed.adminNotes ?? '',
    duplicateAccountFlag: seed.duplicateAccountFlag ?? false,
    suspiciousDataFlag: seed.suspiciousDataFlag ?? false,
    history: createHistory(seed)
  };
}

const doctorSeeds: DoctorSeed[] = [
  {
    id: 'doc-1001',
    name: 'Dr. Leen Haddad',
    email: 'leen.haddad@mindcare.test',
    phone: '+962790001101',
    avatarUrl: 'https://i.pravatar.cc/120?img=32',
    city: 'Amman',
    isOnline: true,
    specialty: 'Clinical Psychologist',
    subSpecialties: ['CBT', 'Anxiety'],
    languages: ['Arabic', 'English'],
    submittedAt: '2026-02-24T09:12:00.000Z',
    status: 'pending'
  },
  {
    id: 'doc-1002',
    name: 'Dr. Sarah Khoury',
    email: 'sarah.khoury@mindcare.test',
    phone: '+962790001102',
    avatarUrl: 'https://i.pravatar.cc/120?img=47',
    city: 'Amman',
    isOnline: false,
    specialty: 'Family Therapist',
    subSpecialties: ['Couples', 'Family sessions'],
    languages: ['Arabic', 'English', 'French'],
    submittedAt: '2026-02-23T10:25:00.000Z',
    status: 'pending'
  },
  {
    id: 'doc-1003',
    name: 'Dr. Rana Al-Zein',
    email: 'rana.zein@mindcare.test',
    phone: '+962790001103',
    avatarUrl: 'https://i.pravatar.cc/120?img=24',
    city: 'Amman',
    isOnline: true,
    specialty: 'Child Psychologist',
    subSpecialties: ['ADHD', 'Parent coaching'],
    languages: ['Arabic', 'English'],
    submittedAt: '2026-02-22T08:15:00.000Z',
    status: 'pending',
    idDocStatus: 'missing',
    adminNotes: 'Identity document is still missing.'
  },
  {
    id: 'doc-1004',
    name: 'Dr. Aya Nabil',
    email: 'aya.nabil@mindcare.test',
    phone: '+962790001104',
    avatarUrl: 'https://i.pravatar.cc/120?img=36',
    city: 'Irbid',
    isOnline: true,
    specialty: 'Perinatal Psychologist',
    subSpecialties: ['Postpartum support', 'Maternal wellbeing'],
    languages: ['Arabic', 'English'],
    submittedAt: '2026-02-21T12:22:00.000Z',
    status: 'pending'
  },
  {
    id: 'doc-1005',
    name: 'Dr. Heba Rashed',
    email: 'heba.rashed@mindcare.test',
    phone: '+962790001105',
    avatarUrl: 'https://i.pravatar.cc/120?img=45',
    city: 'Salt',
    isOnline: false,
    specialty: 'Psychotherapist',
    subSpecialties: ['Mood disorders', 'Stress'],
    languages: ['Arabic', 'English'],
    submittedAt: '2026-02-20T15:12:00.000Z',
    status: 'pending',
    missingSchedule: true,
    adminNotes: 'Weekly availability is not set yet.'
  },
  {
    id: 'doc-1006',
    name: 'Dr. Lina Batayneh',
    email: 'lina.batayneh@mindcare.test',
    phone: '+962790001106',
    avatarUrl: 'https://i.pravatar.cc/120?img=52',
    city: 'Zarqa',
    isOnline: true,
    specialty: 'Family Therapist',
    subSpecialties: ['Parenting support', 'Communication'],
    languages: ['Arabic', 'English'],
    submittedAt: '2026-02-19T09:31:00.000Z',
    status: 'pending',
    phoneVerified: false
  },
  {
    id: 'doc-1007',
    name: 'Dr. Bilal Hammad',
    email: 'bilal.hammad@mindcare.test',
    phone: '+962790001107',
    avatarUrl: 'https://i.pravatar.cc/120?img=14',
    city: 'Aqaba',
    isOnline: false,
    specialty: 'Trauma Specialist',
    subSpecialties: ['Trauma recovery', 'PTSD support'],
    languages: ['Arabic', 'English'],
    submittedAt: '2026-02-18T14:17:00.000Z',
    status: 'pending'
  },
  {
    id: 'doc-1008',
    name: 'Dr. Dana Abu-Taleb',
    email: 'dana.abutaleb@mindcare.test',
    phone: '+962790001108',
    avatarUrl: 'https://i.pravatar.cc/120?img=60',
    city: 'Madaba',
    isOnline: false,
    specialty: 'Child Psychologist',
    subSpecialties: ['School concerns', 'Behavior'],
    languages: ['Arabic'],
    submittedAt: '2026-02-17T08:42:00.000Z',
    status: 'pending',
    profilePhotoQuality: 'needs_changes'
  },
  {
    id: 'doc-1009',
    name: 'Dr. Tareq Mansour',
    email: 'tareq.mansour@mindcare.test',
    phone: '+962790001109',
    avatarUrl: 'https://i.pravatar.cc/120?img=12',
    city: 'Irbid',
    isOnline: true,
    specialty: 'Psychotherapist',
    subSpecialties: ['Adult therapy', 'Burnout'],
    languages: ['Arabic', 'English'],
    submittedAt: '2026-02-16T10:05:00.000Z',
    status: 'accepted',
    adminNotes: 'All verification checks passed.'
  },
  {
    id: 'doc-1010',
    name: 'Dr. Yousef Khalil',
    email: 'yousef.khalil@mindcare.test',
    phone: '+962790001110',
    avatarUrl: 'https://i.pravatar.cc/120?img=16',
    city: 'Aqaba',
    isOnline: true,
    specialty: 'Counseling Psychologist',
    subSpecialties: ['Work stress', 'Self-esteem'],
    languages: ['Arabic', 'English'],
    submittedAt: '2026-02-15T13:25:00.000Z',
    status: 'accepted',
    adminNotes: 'Published after full review.'
  },
  {
    id: 'doc-1011',
    name: 'Dr. Sami Rbehat',
    email: 'sami.rbehat@mindcare.test',
    phone: '+962790001111',
    avatarUrl: 'https://i.pravatar.cc/120?img=8',
    city: 'Madaba',
    isOnline: false,
    specialty: 'Clinical Psychologist',
    subSpecialties: ['Anxiety', 'Stress'],
    languages: ['Arabic'],
    submittedAt: '2026-02-14T10:56:00.000Z',
    status: 'accepted'
  },
  {
    id: 'doc-1012',
    name: 'Dr. Maha Sweis',
    email: 'maha.sweis@mindcare.test',
    phone: '+962790001112',
    avatarUrl: 'https://i.pravatar.cc/120?img=41',
    city: 'Irbid',
    isOnline: true,
    specialty: 'Counseling Psychologist',
    subSpecialties: ['Student wellbeing', 'Stress'],
    languages: ['Arabic', 'English'],
    submittedAt: '2026-02-13T11:03:00.000Z',
    status: 'accepted'
  },
  {
    id: 'doc-1013',
    name: 'Dr. Omar Nasser',
    email: 'omar.nasser@mindcare.test',
    phone: '+962790001113',
    avatarUrl: 'https://i.pravatar.cc/120?img=11',
    city: 'Zarqa',
    isOnline: true,
    specialty: 'Trauma Specialist',
    subSpecialties: ['EMDR', 'PTSD'],
    languages: ['Arabic'],
    submittedAt: '2026-02-12T11:41:00.000Z',
    status: 'closed',
    closeReason: 'License invalid/expired',
    adminNotes: 'Please renew license and reapply.'
  },
  {
    id: 'doc-1014',
    name: 'Dr. Fadi Qasem',
    email: 'fadi.qasem@mindcare.test',
    phone: '+962790001114',
    avatarUrl: 'https://i.pravatar.cc/120?img=6',
    city: 'Irbid',
    isOnline: true,
    specialty: 'Psychotherapist',
    subSpecialties: ['Recovery support', 'Behavioral therapy'],
    languages: ['Arabic'],
    submittedAt: '2026-02-11T09:47:00.000Z',
    status: 'closed',
    closeReason: 'Information mismatch',
    adminNotes: 'License name does not match profile legal name.'
  },
  {
    id: 'doc-1015',
    name: 'Dr. Rami Akel',
    email: 'rami.akel@mindcare.test',
    phone: '+962790001115',
    avatarUrl: 'https://i.pravatar.cc/120?img=10',
    city: 'Amman',
    isOnline: true,
    specialty: 'Psychotherapist',
    subSpecialties: ['Individual therapy', 'Adjustment support'],
    languages: ['Arabic', 'English'],
    submittedAt: '2026-02-10T13:49:00.000Z',
    status: 'closed',
    closeReason: 'Missing documents',
    adminNotes: 'Degree certificate was not uploaded.',
    degreeDocStatus: 'missing'
  }
  ,
  {
    id: 'doc-1016',
    name: 'Dr. Nada Saleh',
    email: 'nada.saleh@mindcare.test',
    phone: '+962790001116',
    avatarUrl: 'https://i.pravatar.cc/120?img=21',
    city: 'Amman',
    isOnline: true,
    specialty: 'Clinical Psychologist',
    subSpecialties: ['Anxiety', 'Mood'],
    languages: ['Arabic', 'English'],
    submittedAt: '2026-02-09T11:12:00.000Z',
    status: 'accepted',
    adminNotes: 'Accepted after full verification.'
  },
  {
    id: 'doc-1017',
    name: 'Dr. Reem Zaid',
    email: 'reem.zaid@mindcare.test',
    phone: '+962790001117',
    avatarUrl: 'https://i.pravatar.cc/120?img=31',
    city: 'Zarqa',
    isOnline: false,
    specialty: 'Family Therapist',
    subSpecialties: ['Couples', 'Family systems'],
    languages: ['Arabic'],
    submittedAt: '2026-02-08T09:20:00.000Z',
    status: 'accepted'
  },
  {
    id: 'doc-1018',
    name: 'Dr. Kareem Odeh',
    email: 'kareem.odeh@mindcare.test',
    phone: '+962790001118',
    avatarUrl: 'https://i.pravatar.cc/120?img=56',
    city: 'Salt',
    isOnline: true,
    specialty: 'Trauma Specialist',
    subSpecialties: ['Trauma', 'PTSD'],
    languages: ['Arabic', 'English'],
    submittedAt: '2026-02-07T10:40:00.000Z',
    status: 'closed',
    closeReason: 'Incomplete profile',
    adminNotes: 'Bio and approach need substantial improvement before publishing.'
  }
];

export const adminDoctorsSeed: AdminDoctor[] = doctorSeeds.map(buildDoctor);
