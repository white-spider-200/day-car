import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireAuth([Role.DOCTOR]);
  if (auth.error) {
    return auth.error;
  }

  const doctor = await prisma.doctor.findUnique({
    where: { id: auth.session.user.doctorId ?? "__none__" },
    select: {
      id: true,
      slug: true,
      bio: true,
      fees: true,
      location: true,
      specialty: true,
      languages: true,
      isApproved: true,
      user: {
        select: { name: true, email: true }
      }
    }
  });

  if (!doctor) {
    return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });
  }

  return NextResponse.json({ doctor });
}

export async function PATCH(request: Request) {
  const auth = await requireAuth([Role.DOCTOR]);
  if (auth.error) {
    return auth.error;
  }

  try {
    const payload = (await request.json()) as {
      bio?: string;
      fees?: number;
      languages?: string[];
      location?: "AMMAN" | "IRBID" | "ZARQA" | "ONLINE";
    };

    const updated = await prisma.doctor.update({
      where: { id: auth.session.user.doctorId ?? "__none__" },
      data: {
        bio: payload.bio,
        fees: payload.fees,
        languages: payload.languages,
        location: payload.location
      },
      select: {
        id: true,
        bio: true,
        fees: true,
        languages: true,
        location: true
      }
    });

    return NextResponse.json({ doctor: updated });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to update profile"
      },
      { status: 400 }
    );
  }
}
