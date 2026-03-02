import { Prisma, Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { createAppointment, listAppointmentsByRole, updateAppointmentStatus } from "@/lib/appointments";
import { requireAuth } from "@/lib/auth";
import { sendMockEmail } from "@/lib/mail";
import { fromClientStatus, toClientStatus } from "@/lib/status";
import { createAppointmentSchema, updateAppointmentStatusSchema } from "@/lib/validation";

function serializeAppointment(appointment: {
  id: string;
  status: string;
  startAt: Date;
  endAt: Date;
  doctor: {
    id: string;
    slug: string;
    specialty: string;
    location: string;
    user: { name: string };
  };
  patient: { id: string; name: string; email: string };
  zoomMeeting: {
    provider: string;
  } | null;
}) {
  return {
    ...appointment,
    status: toClientStatus(appointment.status as never),
    doctorName: appointment.doctor.user.name,
    patientName: appointment.patient.name,
    zoomProvider: appointment.zoomMeeting?.provider ?? null
  };
}

export async function GET() {
  const auth = await requireAuth([Role.ADMIN, Role.DOCTOR, Role.USER]);
  if (auth.error) {
    return auth.error;
  }

  const appointments = await listAppointmentsByRole({
    role: auth.session.user.role,
    userId: auth.session.user.id,
    doctorId: auth.session.user.doctorId
  });

  return NextResponse.json({ appointments: appointments.map(serializeAppointment) });
}

export async function POST(request: Request) {
  const auth = await requireAuth([Role.USER]);
  if (auth.error) {
    return auth.error;
  }

  try {
    const payload = createAppointmentSchema.parse(await request.json());

    const appointment = await createAppointment({
      patientId: auth.session.user.id,
      doctorId: payload.doctorId,
      slotId: payload.slotId,
      contactEmail: payload.contactEmail,
      notes: payload.notes
    });

    if (payload.contactEmail) {
      await sendMockEmail({
        to: payload.contactEmail,
        subject: "Sabina Therapy - Booking Requested",
        body: `Your appointment request is received. Appointment ID: ${appointment.id}`
      });
    }

    return NextResponse.json(
      {
        appointment: {
          ...appointment,
          status: toClientStatus(appointment.status)
        }
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Slot already booked" }, { status: 409 });
    }

    if (error instanceof Error && error.message === "Slot unavailable") {
      return NextResponse.json({ error: "Slot unavailable" }, { status: 409 });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to create appointment"
      },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAuth([Role.ADMIN, Role.DOCTOR, Role.USER]);
  if (auth.error) {
    return auth.error;
  }

  try {
    const body = (await request.json()) as { appointmentId?: string; status?: string };

    if (!body.appointmentId) {
      return NextResponse.json({ error: "appointmentId is required" }, { status: 400 });
    }

    const parsed = updateAppointmentStatusSchema.parse({ status: body.status });
    const status = fromClientStatus(parsed.status);

    if (auth.session.user.role === Role.USER && parsed.status !== "canceled") {
      return NextResponse.json({ error: "Users can only cancel appointments" }, { status: 403 });
    }

    const updated = await updateAppointmentStatus({
      appointmentId: body.appointmentId,
      actorRole: auth.session.user.role,
      actorUserId: auth.session.user.id,
      actorDoctorId: auth.session.user.doctorId,
      status
    });

    return NextResponse.json({
      appointment: {
        ...updated,
        status: toClientStatus(updated.status)
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (error instanceof Error && error.message === "Appointment not found") {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to update appointment"
      },
      { status: 400 }
    );
  }
}
