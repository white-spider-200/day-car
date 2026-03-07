import { AppointmentStatus, Role, VrSessionStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decodeNotesAndSessionMode } from "@/lib/session-mode";
import { createVrSessionSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const auth = await requireAuth([Role.DOCTOR]);
  if (auth.error) {
    return auth.error;
  }

  if (!auth.session.user.doctorId) {
    return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });
  }

  try {
    const payload = createVrSessionSchema.parse(await request.json());
    let patientId: string | null = null;

    const scenario = await prisma.vrScenario.findUnique({ where: { id: payload.scenarioId }, select: { id: true } });
    if (!scenario) {
      return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
    }

    if (payload.appointmentId) {
      const appointment = await prisma.appointment.findUnique({
        where: { id: payload.appointmentId },
        select: {
          id: true,
          doctorId: true,
          patientId: true,
          status: true,
          notes: true
        }
      });

      if (!appointment) {
        return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
      }

      if (appointment.doctorId !== auth.session.user.doctorId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      if (appointment.status !== AppointmentStatus.CONFIRMED) {
        return NextResponse.json({ error: "Appointment must be confirmed first" }, { status: 409 });
      }

      const { sessionMode } = decodeNotesAndSessionMode(appointment.notes);
      if (sessionMode !== "vr") {
        return NextResponse.json({ error: "Only VR appointments can create VR sessions" }, { status: 409 });
      }

      patientId = appointment.patientId;
    }

    const vrSession = await prisma.vrSession.create({
      data: {
        scenarioId: payload.scenarioId,
        doctorId: auth.session.user.doctorId,
        patientId,
        status: VrSessionStatus.WAITING
      }
    });

    return NextResponse.json({ session: vrSession }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create VR session" },
      { status: 400 }
    );
  }
}
