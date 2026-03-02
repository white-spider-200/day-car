import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessMeetingWindow } from "@/lib/time";

export async function POST(request: Request) {
  const auth = await requireAuth([Role.USER, Role.DOCTOR]);
  if (auth.error) {
    return auth.error;
  }

  try {
    const { appointmentId } = (await request.json()) as { appointmentId: string };

    if (!appointmentId) {
      return NextResponse.json({ error: "appointmentId is required" }, { status: 400 });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        zoomMeeting: true
      }
    });

    if (!appointment?.zoomMeeting) {
      return NextResponse.json({ error: "Meeting not ready" }, { status: 404 });
    }

    if (auth.session.user.role === Role.USER && appointment.patientId !== auth.session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (auth.session.user.role === Role.DOCTOR && appointment.doctorId !== auth.session.user.doctorId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!canAccessMeetingWindow(appointment.startAt, appointment.endAt)) {
      return NextResponse.json(
        { error: "Meeting link available from 10 minutes before start until 10 minutes after end" },
        { status: 403 }
      );
    }

    const url =
      auth.session.user.role === Role.DOCTOR
        ? appointment.zoomMeeting.zoomStartUrl
        : appointment.zoomMeeting.zoomJoinUrl;

    return NextResponse.json({ url });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to fetch join info"
      },
      { status: 400 }
    );
  }
}
