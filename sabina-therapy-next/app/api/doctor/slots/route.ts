import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireAuth([Role.DOCTOR]);
  if (auth.error) {
    return auth.error;
  }

  const slots = await prisma.doctorScheduleSlot.findMany({
    where: { doctorId: auth.session.user.doctorId ?? "__none__" },
    orderBy: { startAt: "asc" },
    take: 100
  });

  return NextResponse.json({ slots });
}

export async function POST(request: Request) {
  const auth = await requireAuth([Role.DOCTOR]);
  if (auth.error) {
    return auth.error;
  }

  try {
    const payload = (await request.json()) as {
      startAt: string;
      endAt: string;
    };

    const startAt = new Date(payload.startAt);
    const endAt = new Date(payload.endAt);

    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || startAt >= endAt) {
      return NextResponse.json({ error: "Invalid slot time" }, { status: 400 });
    }

    const slot = await prisma.doctorScheduleSlot.create({
      data: {
        doctorId: auth.session.user.doctorId ?? "__none__",
        startAt,
        endAt
      }
    });

    return NextResponse.json({ slot }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to create slot"
      },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAuth([Role.DOCTOR]);
  if (auth.error) {
    return auth.error;
  }

  const { searchParams } = new URL(request.url);
  const slotId = searchParams.get("slotId");
  if (!slotId) {
    return NextResponse.json({ error: "slotId is required" }, { status: 400 });
  }

  const slot = await prisma.doctorScheduleSlot.findUnique({ where: { id: slotId } });

  if (!slot || slot.doctorId !== auth.session.user.doctorId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (slot.isBooked) {
    return NextResponse.json({ error: "Cannot delete booked slot" }, { status: 400 });
  }

  await prisma.doctorScheduleSlot.delete({ where: { id: slotId } });
  return NextResponse.json({ success: true });
}
