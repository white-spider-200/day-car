import { NextResponse } from "next/server";
import { doctorPublicSelect, buildDoctorWhere } from "@/lib/doctors";
import { prisma } from "@/lib/prisma";
import { doctorFilterSchema } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const parsed = doctorFilterSchema.parse({
      q: searchParams.get("q") ?? undefined,
      language: searchParams.get("language") ?? undefined,
      location: searchParams.get("location") ?? undefined,
      specialty: searchParams.get("specialty") ?? undefined,
      minPrice: searchParams.get("minPrice") ?? undefined,
      maxPrice: searchParams.get("maxPrice") ?? undefined,
      topOnly: searchParams.get("topOnly") ?? undefined
    });

    const where = buildDoctorWhere(parsed);

    const doctors = await prisma.doctor.findMany({
      where,
      select: doctorPublicSelect,
      orderBy: [{ isTopDoctor: "desc" }, { fees: "asc" }]
    });

    return NextResponse.json({ doctors });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to fetch doctors"
      },
      { status: 400 }
    );
  }
}
