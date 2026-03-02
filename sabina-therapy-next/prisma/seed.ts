import { PrismaClient, AppointmentStatus, Location, Specialty, Role } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const doctorsSeed = [
  {
    name: "Dr. Lina Sabri",
    email: "doctor.lina@sabina.dev",
    slug: "dr-lina-sabri",
    specialty: Specialty.THERAPY,
    bio: "Trauma-informed therapist with 11 years of experience in anxiety and burnout care.",
    languages: ["Arabic", "English"],
    location: Location.AMMAN,
    fees: 60,
    photoUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2",
    isTopDoctor: true,
    isApproved: true,
    licenseNumber: "JOR-THER-1001"
  },
  {
    name: "Dr. Omar Haddad",
    email: "doctor.omar@sabina.dev",
    slug: "dr-omar-haddad",
    specialty: Specialty.PSYCHIATRY,
    bio: "Consultant psychiatrist focused on depression, ADHD, and medication plans.",
    languages: ["Arabic", "English"],
    location: Location.AMMAN,
    fees: 90,
    photoUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d",
    isTopDoctor: false,
    isApproved: true,
    licenseNumber: "JOR-PSY-2002"
  },
  {
    name: "Dr. Noor Khalaf",
    email: "doctor.noor@sabina.dev",
    slug: "dr-noor-khalaf",
    specialty: Specialty.CBT,
    bio: "CBT specialist helping adults with panic, social anxiety, and sleep struggles.",
    languages: ["Arabic"],
    location: Location.IRBID,
    fees: 45,
    photoUrl: "https://images.unsplash.com/photo-1594824475317-8d2c1fcb57f7",
    isTopDoctor: false,
    isApproved: true,
    licenseNumber: "JOR-CBT-3003"
  },
  {
    name: "Dr. Sarah Naser",
    email: "doctor.sarah@sabina.dev",
    slug: "dr-sarah-naser",
    specialty: Specialty.COUNSELING,
    bio: "Counselor for stress, grief, and relationship boundaries.",
    languages: ["English"],
    location: Location.ONLINE,
    fees: 40,
    photoUrl: "https://images.unsplash.com/photo-1651008376811-b90baee60c1f",
    isTopDoctor: false,
    isApproved: true,
    licenseNumber: "JOR-CNS-4004"
  },
  {
    name: "Dr. Yara Qasem",
    email: "doctor.yara@sabina.dev",
    slug: "dr-yara-qasem",
    specialty: Specialty.CHILD_THERAPY,
    bio: "Child therapist working with school anxiety and behavior challenges.",
    languages: ["Arabic", "English"],
    location: Location.ZARQA,
    fees: 50,
    photoUrl: "https://images.unsplash.com/photo-1594824389124-8d2f4f7b13ce",
    isTopDoctor: false,
    isApproved: true,
    licenseNumber: "JOR-CHD-5005"
  },
  {
    name: "Dr. Hani Jaber",
    email: "doctor.hani@sabina.dev",
    slug: "dr-hani-jaber",
    specialty: Specialty.FAMILY_THERAPY,
    bio: "Family systems therapist for conflict resolution and communication plans.",
    languages: ["Arabic"],
    location: Location.AMMAN,
    fees: 70,
    photoUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d",
    isTopDoctor: false,
    isApproved: true,
    licenseNumber: "JOR-FAM-6006"
  },
  {
    name: "Dr. Dana Barakat",
    email: "doctor.dana@sabina.dev",
    slug: "dr-dana-barakat",
    specialty: Specialty.THERAPY,
    bio: "Therapist focused on trauma recovery and emotional regulation.",
    languages: ["English"],
    location: Location.IRBID,
    fees: 55,
    photoUrl: "https://images.unsplash.com/photo-1584515933487-779824d29309",
    isTopDoctor: false,
    isApproved: true,
    licenseNumber: "JOR-THER-7007"
  },
  {
    name: "Dr. Ahmad Sweilem",
    email: "doctor.ahmad@sabina.dev",
    slug: "dr-ahmad-sweilem",
    specialty: Specialty.PSYCHIATRY,
    bio: "Psychiatrist covering anxiety disorders, OCD, and medication follow-up.",
    languages: ["Arabic", "English"],
    location: Location.ONLINE,
    fees: 85,
    photoUrl: "https://images.unsplash.com/photo-1537368910025-700350fe46c7",
    isTopDoctor: false,
    isApproved: false,
    licenseNumber: "JOR-PSY-8008"
  }
];

function buildSlots(baseDate: Date) {
  const slots: { startAt: Date; endAt: Date }[] = [];
  for (let dayOffset = 1; dayOffset <= 5; dayOffset += 1) {
    for (const hour of [9, 11, 15]) {
      const start = new Date(baseDate);
      start.setUTCDate(start.getUTCDate() + dayOffset);
      start.setUTCHours(hour, 0, 0, 0);
      const end = new Date(start);
      end.setUTCMinutes(end.getUTCMinutes() + 50);
      slots.push({ startAt: start, endAt: end });
    }
  }
  return slots;
}

async function main() {
  const passwordHash = await hash("Passw0rd!", 10);

  await prisma.review.deleteMany();
  await prisma.zoomMeeting.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.doctorScheduleSlot.deleteMany();
  await prisma.doctorVerification.deleteMany();
  await prisma.adminAction.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      name: "Sabina Admin",
      email: "admin@sabina.dev",
      passwordHash,
      role: Role.ADMIN,
      locale: "en"
    }
  });

  const patientA = await prisma.user.create({
    data: {
      name: "Maya User",
      email: "user.maya@sabina.dev",
      passwordHash,
      role: Role.USER,
      locale: "en"
    }
  });

  const patientB = await prisma.user.create({
    data: {
      name: "Sami User",
      email: "user.sami@sabina.dev",
      passwordHash,
      role: Role.USER,
      locale: "ar"
    }
  });

  const createdDoctors: { id: string; userId: string; slug: string }[] = [];
  const now = new Date();

  for (const doctorSeed of doctorsSeed) {
    const doctorUser = await prisma.user.create({
      data: {
        name: doctorSeed.name,
        email: doctorSeed.email,
        passwordHash,
        role: Role.DOCTOR,
        locale: "en"
      }
    });

    const doctor = await prisma.doctor.create({
      data: {
        userId: doctorUser.id,
        slug: doctorSeed.slug,
        specialty: doctorSeed.specialty,
        bio: doctorSeed.bio,
        languages: doctorSeed.languages,
        location: doctorSeed.location,
        fees: doctorSeed.fees,
        photoUrl: doctorSeed.photoUrl,
        isTopDoctor: doctorSeed.isTopDoctor,
        isApproved: doctorSeed.isApproved,
        verification: {
          create: {
            licenseNumber: doctorSeed.licenseNumber,
            verificationBadge: true,
            verifiedAt: doctorSeed.isApproved ? new Date() : null
          }
        }
      }
    });

    const slots = buildSlots(now).map((slot) => ({
      doctorId: doctor.id,
      startAt: slot.startAt,
      endAt: slot.endAt
    }));

    await prisma.doctorScheduleSlot.createMany({ data: slots });
    createdDoctors.push({ id: doctor.id, userId: doctorUser.id, slug: doctor.slug });
  }

  const topDoctor = createdDoctors[0];
  const topDoctorSlots = await prisma.doctorScheduleSlot.findMany({
    where: { doctorId: topDoctor.id },
    orderBy: { startAt: "asc" },
    take: 2
  });

  const requestedAppointment = await prisma.appointment.create({
    data: {
      patientId: patientA.id,
      doctorId: topDoctor.id,
      slotId: topDoctorSlots[0].id,
      startAt: topDoctorSlots[0].startAt,
      endAt: topDoctorSlots[0].endAt,
      status: AppointmentStatus.REQUESTED,
      contactEmail: "maya.personal@mail.com",
      notes: "First visit"
    }
  });

  await prisma.doctorScheduleSlot.update({
    where: { id: topDoctorSlots[0].id },
    data: { isBooked: true }
  });

  const confirmedAppointment = await prisma.appointment.create({
    data: {
      patientId: patientB.id,
      doctorId: topDoctor.id,
      slotId: topDoctorSlots[1].id,
      startAt: topDoctorSlots[1].startAt,
      endAt: topDoctorSlots[1].endAt,
      status: AppointmentStatus.CONFIRMED,
      notes: "Follow up"
    }
  });

  await prisma.doctorScheduleSlot.update({
    where: { id: topDoctorSlots[1].id },
    data: { isBooked: true }
  });

  await prisma.zoomMeeting.create({
    data: {
      appointmentId: confirmedAppointment.id,
      zoomMeetingId: `mock-${confirmedAppointment.id}`,
      zoomJoinUrl: `/mock-zoom/${confirmedAppointment.id}?role=patient`,
      zoomStartUrl: `/mock-zoom/${confirmedAppointment.id}?role=doctor`,
      provider: "mock"
    }
  });

  console.log("Seed complete");
  console.log({
    admin: { email: admin.email, password: "Passw0rd!" },
    doctors: ["doctor.lina@sabina.dev", "doctor.omar@sabina.dev"],
    users: [patientA.email, patientB.email],
    requestedAppointment,
    confirmedAppointment
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
