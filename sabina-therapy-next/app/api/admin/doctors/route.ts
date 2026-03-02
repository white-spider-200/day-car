import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireAuth([Role.ADMIN]);
  if (auth.error) {
    return auth.error;
  }

  const doctors = await prisma.doctor.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      isApproved: true,
      specialty: true,
      location: true,
      fees: true,
      user: {
        select: {
          name: true,
          email: true
        }
      },
      verification: {
        select: {
          licenseNumber: true,
          verificationBadge: true,
          verifiedAt: true
        }
      }
    }
  });

  return NextResponse.json({ doctors });
}
