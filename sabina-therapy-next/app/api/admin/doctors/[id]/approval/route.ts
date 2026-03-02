import { AdminActionType, Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth([Role.ADMIN]);
  if (auth.error) {
    return auth.error;
  }

  const body = (await request.json()) as { approved: boolean; notes?: string };

  const doctor = await prisma.doctor.update({
    where: { id: params.id },
    data: {
      isApproved: body.approved,
      verification: {
        upsert: {
          create: {
            licenseNumber: `AUTO-${params.id.slice(0, 8)}`,
            verificationBadge: body.approved,
            verifiedAt: body.approved ? new Date() : null
          },
          update: {
            verificationBadge: body.approved,
            verifiedAt: body.approved ? new Date() : null
          }
        }
      }
    },
    select: {
      id: true,
      isApproved: true
    }
  });

  await prisma.adminAction.create({
    data: {
      adminId: auth.session.user.id,
      actionType: body.approved ? AdminActionType.APPROVE_DOCTOR : AdminActionType.DENY_DOCTOR,
      targetId: params.id,
      notes: body.notes ?? null
    }
  });

  return NextResponse.json({ doctor });
}
