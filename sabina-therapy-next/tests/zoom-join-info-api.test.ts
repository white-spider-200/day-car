import { beforeEach, describe, expect, it, vi } from "vitest";
import { Role } from "@prisma/client";

vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn()
}));

vi.mock("@/lib/time", () => ({
  canAccessMeetingWindow: vi.fn()
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    appointment: {
      findUnique: vi.fn()
    }
  }
}));

import { POST } from "@/app/api/zoom/join-info/route";
import { requireAuth } from "@/lib/auth";
import { canAccessMeetingWindow } from "@/lib/time";
import { prisma } from "@/lib/prisma";

describe("POST /api/zoom/join-info", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns doctor start URL when doctor owns appointment and is in time window", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      session: {
        user: {
          id: "d4866471-fb08-4527-a968-0857394a3e4e",
          role: Role.DOCTOR,
          doctorId: "fef43b3e-edf4-4323-adf8-29da8dc78f0d"
        }
      }
    } as never);

    vi.mocked(prisma.appointment.findUnique).mockResolvedValue({
      id: "352f2507-f777-4d17-ad34-31dcf3fca5ac",
      doctorId: "fef43b3e-edf4-4323-adf8-29da8dc78f0d",
      patientId: "5ff26bec-2470-4f13-90a4-9e1c547f84fd",
      startAt: new Date(),
      endAt: new Date(Date.now() + 3600000),
      zoomMeeting: {
        zoomJoinUrl: "https://zoom.example/join",
        zoomStartUrl: "https://zoom.example/start"
      }
    } as never);

    vi.mocked(canAccessMeetingWindow).mockReturnValue(true);

    const response = await POST(
      new Request("http://localhost:3000/api/zoom/join-info", {
        method: "POST",
        body: JSON.stringify({ appointmentId: "352f2507-f777-4d17-ad34-31dcf3fca5ac" })
      })
    );

    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.url).toBe("https://zoom.example/start");
  });

  it("blocks user from accessing another user appointment", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      session: {
        user: {
          id: "4ad07b91-63b8-4c6b-b9e2-c1a8fdd5d3e9",
          role: Role.USER,
          doctorId: null
        }
      }
    } as never);

    vi.mocked(prisma.appointment.findUnique).mockResolvedValue({
      id: "352f2507-f777-4d17-ad34-31dcf3fca5ac",
      doctorId: "fef43b3e-edf4-4323-adf8-29da8dc78f0d",
      patientId: "someone-else",
      startAt: new Date(),
      endAt: new Date(Date.now() + 3600000),
      zoomMeeting: {
        zoomJoinUrl: "https://zoom.example/join",
        zoomStartUrl: "https://zoom.example/start"
      }
    } as never);

    vi.mocked(canAccessMeetingWindow).mockReturnValue(true);

    const response = await POST(
      new Request("http://localhost:3000/api/zoom/join-info", {
        method: "POST",
        body: JSON.stringify({ appointmentId: "352f2507-f777-4d17-ad34-31dcf3fca5ac" })
      })
    );

    expect(response.status).toBe(403);
  });
});
