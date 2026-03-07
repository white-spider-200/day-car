import { Role, VrSessionStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: { sessionId: string } }
) {
  const auth = await requireAuth([Role.USER, Role.DOCTOR, Role.ADMIN]);
  if (auth.error) {
    return auth.error;
  }

  const session = await prisma.vrSession.findUnique({ where: { id: params.sessionId } });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (auth.session.user.role === Role.USER) {
    if (session.patientId && session.patientId !== auth.session.user.id) {
      return NextResponse.json({ error: "This session is already assigned to another patient" }, { status: 403 });
    }

    const updated = await prisma.vrSession.update({
      where: { id: session.id },
      data: {
        patientId: auth.session.user.id,
        status: session.status === VrSessionStatus.WAITING ? VrSessionStatus.LIVE : session.status,
        startedAt: session.status === VrSessionStatus.WAITING ? new Date() : session.startedAt
      }
    });

    return NextResponse.json({ session: updated });
  }

  if (auth.session.user.role === Role.DOCTOR && session.doctorId !== auth.session.user.doctorId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ session });
}
