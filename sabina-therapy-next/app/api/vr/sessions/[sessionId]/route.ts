import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: { sessionId: string } }
) {
  const auth = await requireAuth([Role.ADMIN, Role.DOCTOR, Role.USER]);
  if (auth.error) {
    return auth.error;
  }

  const session = await prisma.vrSession.findUnique({
    where: { id: params.sessionId },
    include: {
      scenario: true,
      doctor: {
        select: {
          id: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      },
      patient: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (
    auth.session.user.role === Role.DOCTOR &&
    session.doctorId !== auth.session.user.doctorId
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (auth.session.user.role === Role.USER && session.patientId && session.patientId !== auth.session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ session });
}
