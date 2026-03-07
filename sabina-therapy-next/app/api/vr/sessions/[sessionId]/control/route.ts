import { Role, VrSessionStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VR_REALTIME_ENABLED } from "@/lib/vr-realtime";
import { vrRealtimePublisher } from "@/lib/vr-realtime.server";
import { vrControlSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  const auth = await requireAuth([Role.DOCTOR]);
  if (auth.error) {
    return auth.error;
  }

  const session = await prisma.vrSession.findUnique({ where: { id: params.sessionId } });
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.doctorId !== auth.session.user.doctorId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = vrControlSchema.parse(await request.json());

  if (payload.type === "END_SESSION") {
    const updated = await prisma.vrSession.update({
      where: { id: session.id },
      data: {
        status: VrSessionStatus.ENDED,
        endedAt: new Date()
      }
    });

    return NextResponse.json({ session: updated, realtime: VR_REALTIME_ENABLED });
  }

  if (!VR_REALTIME_ENABLED) {
    return NextResponse.json(
      {
        error: "Realtime control is not enabled yet. Phase 1 is active.",
        phase: "PHASE_1"
      },
      { status: 501 }
    );
  }

  await vrRealtimePublisher.publishToSession(params.sessionId, payload);

  return NextResponse.json({ ok: true, phase: "PHASE_2" });
}
