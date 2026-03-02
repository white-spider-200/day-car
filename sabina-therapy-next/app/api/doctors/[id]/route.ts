import { NextResponse } from "next/server";
import { doctorPublicSelect } from "@/lib/doctors";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const doctor = await prisma.doctor.findFirst({
    where: {
      OR: [{ id: params.id }, { slug: params.id }],
      isApproved: true
    },
    select: {
      ...doctorPublicSelect,
      scheduleSlots: {
        where: {
          isBooked: false,
          startAt: { gte: new Date() }
        },
        orderBy: { startAt: "asc" },
        take: 25,
        select: {
          id: true,
          startAt: true,
          endAt: true,
          isBooked: true
        }
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          user: {
            select: {
              name: true
            }
          }
        }
      }
    }
  });

  if (!doctor) {
    return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
  }

  return NextResponse.json({ doctor });
}
