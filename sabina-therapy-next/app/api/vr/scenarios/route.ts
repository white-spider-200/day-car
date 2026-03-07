import { Prisma, Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugifyScenarioTitle } from "@/lib/vr";
import { extractYoutubeId } from "@/lib/youtube";
import { createVrScenarioSchema, listVrScenariosSchema } from "@/lib/validation";

async function buildUniqueScenarioSlug(titleEn: string): Promise<string> {
  const baseSlug = slugifyScenarioTitle(titleEn);
  let candidate = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.vrScenario.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing) {
      return candidate;
    }

    counter += 1;
    candidate = `${baseSlug}-${counter}`;
  }
}

export async function GET(request: Request) {
  const auth = await requireAuth([Role.ADMIN, Role.DOCTOR, Role.USER]);
  if (auth.error) {
    return auth.error;
  }

  const { searchParams } = new URL(request.url);
  const parsed = listVrScenariosSchema.parse({ mine: searchParams.get("mine") ?? undefined });

  const scenarios = await prisma.vrScenario.findMany({
    where: parsed.mine ? { createdById: auth.session.user.id } : undefined,
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          role: true
        }
      },
      _count: {
        select: { sessions: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ scenarios });
}

export async function POST(request: Request) {
  const auth = await requireAuth([Role.ADMIN, Role.DOCTOR]);
  if (auth.error) {
    return auth.error;
  }

  try {
    const payload = createVrScenarioSchema.parse(await request.json());
    const youtubeId = extractYoutubeId(payload.youtubeUrl);

    if (!youtubeId) {
      return NextResponse.json({ error: "Invalid YouTube URL or ID" }, { status: 400 });
    }

    const slug = await buildUniqueScenarioSlug(payload.titleEn);

    const scenario = await prisma.vrScenario.create({
      data: {
        titleEn: payload.titleEn,
        titleAr: payload.titleAr,
        descriptionEn: payload.descriptionEn,
        descriptionAr: payload.descriptionAr,
        youtubeId,
        slug,
        createdById: auth.session.user.id
      }
    });

    return NextResponse.json({ scenario }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Scenario slug already exists" }, { status: 409 });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to create VR scenario"
      },
      { status: 400 }
    );
  }
}
