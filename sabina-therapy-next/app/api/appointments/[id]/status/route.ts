import { AppointmentStatus, Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { fromClientStatus, toClientStatus } from "@/lib/status";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { updateAppointmentStatus } from "@/lib/appointments";
import { updateAppointmentStatusSchema } from "@/lib/validation";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth([Role.ADMIN, Role.DOCTOR, Role.USER]);
  if (auth.error) {
    return auth.error;
  }

  try {
    const payload = updateAppointmentStatusSchema.parse(await request.json());
    const status = fromClientStatus(payload.status);

    if (auth.session.user.role === Role.USER && status !== AppointmentStatus.CANCELED) {
      return NextResponse.json({ error: "Users can only cancel appointments" }, { status: 403 });
    }

    const updated = await updateAppointmentStatus({
      appointmentId: params.id,
      actorRole: auth.session.user.role,
      actorUserId: auth.session.user.id,
      actorDoctorId: auth.session.user.doctorId,
      status
    });

    const withZoom = await prisma.appointment.findUnique({
      where: { id: updated.id },
      include: { zoomMeeting: true }
    });

    return NextResponse.json({
      appointment: {
        ...updated,
        status: toClientStatus(updated.status),
        hasZoom: Boolean(withZoom?.zoomMeeting)
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
