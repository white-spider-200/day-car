import { AppointmentStatus, Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createZoomMeetingForAppointment } from "@/lib/zoom";

export async function createAppointment(input: {
  patientId: string;
  doctorId: string;
  slotId: string;
  contactEmail?: string;
  notes?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const slot = await tx.doctorScheduleSlot.findFirst({
      where: {
        id: input.slotId,
        doctorId: input.doctorId,
        isBooked: false
      }
    });

    if (!slot) {
      throw new Error("Slot unavailable");
    }

    const appointment = await tx.appointment.create({
      data: {
        patientId: input.patientId,
        doctorId: input.doctorId,
        slotId: input.slotId,
        startAt: slot.startAt,
        endAt: slot.endAt,
        status: AppointmentStatus.REQUESTED,
        contactEmail: input.contactEmail || null,
        notes: input.notes || null
      }
    });

    await tx.doctorScheduleSlot.update({
      where: { id: slot.id },
      data: { isBooked: true }
    });

    return appointment;
  });
}

export async function listAppointmentsByRole(input: {
  role: Role;
  userId: string;
  doctorId?: string | null;
}) {
  const where: Prisma.AppointmentWhereInput = {};

  if (input.role === Role.USER) {
    where.patientId = input.userId;
  }

  if (input.role === Role.DOCTOR) {
    where.doctorId = input.doctorId ?? "__none__";
  }

  return prisma.appointment.findMany({
    where,
    orderBy: { startAt: "asc" },
    include: {
      patient: {
        select: { id: true, name: true, email: true }
      },
      doctor: {
        select: {
          id: true,
          slug: true,
          specialty: true,
          location: true,
          user: {
            select: { name: true }
          }
        }
      },
      zoomMeeting: true,
      slot: true
    }
  });
}

export async function updateAppointmentStatus(input: {
  appointmentId: string;
  actorRole: Role;
  actorUserId: string;
  actorDoctorId?: string | null;
  status: AppointmentStatus;
}) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: input.appointmentId },
    include: {
      doctor: true,
      patient: true,
      slot: true,
      zoomMeeting: true
    }
  });

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  if (input.actorRole === Role.DOCTOR && appointment.doctorId !== input.actorDoctorId) {
    throw new Error("Forbidden");
  }

  if (input.actorRole === Role.USER && appointment.patientId !== input.actorUserId) {
    throw new Error("Forbidden");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.appointment.update({
      where: { id: input.appointmentId },
      data: { status: input.status }
    });

    if (input.status === AppointmentStatus.CANCELED) {
      await tx.doctorScheduleSlot.update({
        where: { id: appointment.slotId },
        data: { isBooked: false }
      });
    }

    return next;
  });

  if (input.status === AppointmentStatus.CONFIRMED) {
    await createZoomMeetingForAppointment(appointment.id);
  }

  return updated;
}
