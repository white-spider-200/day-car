import { describe, expect, it, beforeEach, vi } from "vitest";
import { Role } from "@prisma/client";

vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn()
}));

vi.mock("@/lib/appointments", () => ({
  createAppointment: vi.fn(),
  listAppointmentsByRole: vi.fn(),
  updateAppointmentStatus: vi.fn()
}));

vi.mock("@/lib/mail", () => ({
  sendMockEmail: vi.fn()
}));

import { POST } from "@/app/api/appointments/route";
import { requireAuth } from "@/lib/auth";
import { createAppointment } from "@/lib/appointments";

describe("POST /api/appointments", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("creates appointment for authenticated user", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      session: {
        user: {
          id: "2f9f6c10-3b74-40fd-9f2d-a8c0ceab9e51",
          role: Role.USER,
          doctorId: null
        }
      }
    } as never);

    vi.mocked(createAppointment).mockResolvedValue({
      id: "d7ece76f-a1d1-49e5-9bd9-3aa86de86f95",
      status: "REQUESTED"
    } as never);

    const response = await POST(
      new Request("http://localhost:3000/api/appointments", {
        method: "POST",
        body: JSON.stringify({
          doctorId: "49700d90-ab90-46da-a451-7997de1f41ea",
          slotId: "f14b7be8-26de-4f56-a09c-dafbb17cd07c"
        })
      })
    );

    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.appointment.status).toBe("requested");
    expect(createAppointment).toHaveBeenCalledTimes(1);
  });

  it("returns 409 when slot is already unavailable", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      session: {
        user: {
          id: "2f9f6c10-3b74-40fd-9f2d-a8c0ceab9e51",
          role: Role.USER,
          doctorId: null
        }
      }
    } as never);

    vi.mocked(createAppointment).mockRejectedValue(new Error("Slot unavailable"));

    const response = await POST(
      new Request("http://localhost:3000/api/appointments", {
        method: "POST",
        body: JSON.stringify({
          doctorId: "49700d90-ab90-46da-a451-7997de1f41ea",
          slotId: "f14b7be8-26de-4f56-a09c-dafbb17cd07c"
        })
      })
    );

    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json.error).toBe("Slot unavailable");
  });
});
