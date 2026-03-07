import { beforeEach, describe, expect, it, vi } from "vitest";
import { Role, VrSessionStatus } from "@prisma/client";

vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn()
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    vrScenario: {
      findUnique: vi.fn(),
      create: vi.fn()
    },
    vrSession: {
      findUnique: vi.fn(),
      update: vi.fn()
    }
  }
}));

import { POST as createScenario } from "@/app/api/vr/scenarios/route";
import { POST as joinSession } from "@/app/api/vr/sessions/[sessionId]/join/route";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

describe("VR APIs", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("creates scenario from valid YouTube URL", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      session: {
        user: {
          id: "6f81ea2e-c01c-445a-a969-e100830ef9e5",
          role: Role.DOCTOR,
          doctorId: "2aaa9b04-a344-4972-999f-a1e0fd3588fc"
        }
      }
    } as never);

    vi.mocked(prisma.vrScenario.findUnique).mockResolvedValue(null as never);
    vi.mocked(prisma.vrScenario.create).mockResolvedValue({
      id: "24322c25-7088-47ad-b40d-a447347d1d16",
      titleEn: "Heights",
      titleAr: "المرتفعات",
      descriptionEn: "Exposure scenario for heights",
      descriptionAr: "سيناريو تعرض للخوف من المرتفعات",
      youtubeId: "dQw4w9WgXcQ",
      slug: "heights",
      createdById: "6f81ea2e-c01c-445a-a969-e100830ef9e5"
    } as never);

    const response = await createScenario(
      new Request("http://localhost:3000/api/vr/scenarios", {
        method: "POST",
        body: JSON.stringify({
          titleEn: "Heights",
          titleAr: "المرتفعات",
          descriptionEn: "Exposure scenario for heights",
          descriptionAr: "سيناريو تعرض للخوف من المرتفعات",
          youtubeUrl: "https://youtu.be/dQw4w9WgXcQ"
        })
      })
    );

    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.scenario.youtubeId).toBe("dQw4w9WgXcQ");
  });

  it("moves WAITING session to LIVE and assigns patient on join", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      session: {
        user: {
          id: "be141839-a16e-4967-9f5e-5771eddf23f2",
          role: Role.USER,
          doctorId: null
        }
      }
    } as never);

    vi.mocked(prisma.vrSession.findUnique).mockResolvedValue({
      id: "73b234f6-b6fc-4ec5-89cb-6f68d11ef981",
      patientId: null,
      status: VrSessionStatus.WAITING
    } as never);

    vi.mocked(prisma.vrSession.update).mockResolvedValue({
      id: "73b234f6-b6fc-4ec5-89cb-6f68d11ef981",
      patientId: "be141839-a16e-4967-9f5e-5771eddf23f2",
      status: VrSessionStatus.LIVE
    } as never);

    const response = await joinSession(new Request("http://localhost:3000/api/vr/sessions/abc/join", { method: "POST" }), {
      params: { sessionId: "73b234f6-b6fc-4ec5-89cb-6f68d11ef981" }
    });

    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.session.status).toBe("LIVE");
    expect(prisma.vrSession.update).toHaveBeenCalledTimes(1);
  });
});
