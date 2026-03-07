import { Prisma, Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugifyScenarioTitle } from "@/lib/vr";
import { extractYoutubeId } from "@/lib/youtube";
import { updateVrScenarioSchema } from "@/lib/validation";

async function buildUniqueSlugFromUpdate(scenarioId: string, titleEn: string): Promise<string> {
  const baseSlug = slugifyScenarioTitle(titleEn);
  let candidate = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.vrScenario.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing || existing.id === scenarioId) {
      return candidate;
    }

    counter += 1;
    candidate = `${baseSlug}-${counter}`;
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { scenarioId: string } }
) {
  const auth = await requireAuth([Role.ADMIN, Role.DOCTOR]);
  if (auth.error) {
    return auth.error;
  }

  try {
    const existing = await prisma.vrScenario.findUnique({ where: { id: params.scenarioId } });

    if (!existing) {
      return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
    }

    if (auth.session.user.role === Role.DOCTOR && existing.createdById !== auth.session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const payload = updateVrScenarioSchema.parse(await request.json());

    const nextTitleEn = payload.titleEn ?? existing.titleEn;
    const nextSlug = payload.titleEn ? await buildUniqueSlugFromUpdate(existing.id, nextTitleEn) : existing.slug;

    const youtubeId = payload.youtubeUrl ? extractYoutubeId(payload.youtubeUrl) : existing.youtubeId;
    if (!youtubeId) {
      return NextResponse.json({ error: "Invalid YouTube URL or ID" }, { status: 400 });
    }

    const scenario = await prisma.vrScenario.update({
      where: { id: params.scenarioId },
      data: {
        titleEn: payload.titleEn,
        titleAr: payload.titleAr,
        descriptionEn: payload.descriptionEn,
        descriptionAr: payload.descriptionAr,
        youtubeId,
        slug: nextSlug
      }
    });

    return NextResponse.json({ scenario });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Scenario slug already exists" }, { status: 409 });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to update scenario"
      },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { scenarioId: string } }
) {
  const auth = await requireAuth([Role.ADMIN, Role.DOCTOR]);
  if (auth.error) {
    return auth.error;
  }

  const existing = await prisma.vrScenario.findUnique({ where: { id: params.scenarioId } });
  if (!existing) {
    return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
  }

  if (auth.session.user.role === Role.DOCTOR && existing.createdById !== auth.session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.vrScenario.delete({ where: { id: params.scenarioId } });

  return NextResponse.json({ success: true });
}
