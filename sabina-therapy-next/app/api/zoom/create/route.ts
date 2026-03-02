import { AppointmentStatus, Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { zoomCreateSchema } from "@/lib/validation";
import { createZoomMeetingForAppointment } from "@/lib/zoom";

export async function POST(request: Request) {
  const auth = await requireAuth([Role.DOCTOR]);
  if (auth.error) {
    return auth.error;
  }

  try {
    const payload = zoomCreateSchema.parse(await request.json());

    const appointment = await prisma.appointment.findUnique({
      where: { id: payload.appointmentId }
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    if (appointment.doctorId !== auth.session.user.doctorId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (appointment.status !== AppointmentStatus.CONFIRMED) {
      return NextResponse.json({ error: "Appointment must be confirmed first" }, { status: 400 });
    }

    const meeting = await createZoomMeetingForAppointment(appointment.id);

    return NextResponse.json({
      zoomMeeting: {
        appointmentId: meeting.appointmentId,
        zoomMeetingId: meeting.zoomMeetingId,
        provider: meeting.provider
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to create Zoom meeting"
      },
      { status: 400 }
    );
  }
}
