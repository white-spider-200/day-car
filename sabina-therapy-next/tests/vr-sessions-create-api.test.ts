import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppointmentStatus, Role, VrSessionStatus } from "@prisma/client";

vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn()
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    vrScenario: {
      findUnique: vi.fn()
    },
    appointment: {
      findUnique: vi.fn()
    },
    vrSession: {
      create: vi.fn()
    }
  }
}));

import { POST as createVrSession } from "@/app/api/vr/sessions/route";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

describe("VR session create API", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("creates a patient-assigned session from a confirmed VR appointment", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      session: {
        user: {
          id: "a4e9505f-f04d-489c-ae5b-ac05f21130e1",
          role: Role.DOCTOR,
          doctorId: "84363838-e33a-43ab-bf74-3bf9326e86de"
        }
      }
    } as never);

    vi.mocked(prisma.vrScenario.findUnique).mockResolvedValue({ id: "85fb4856-d281-4b33-9c69-7397b9f4ada2" } as never);
    vi.mocked(prisma.appointment.findUnique).mockResolvedValue({
      id: "5c4a9f12-139d-4552-8f90-e6f6b8568117",
      doctorId: "84363838-e33a-43ab-bf74-3bf9326e86de",
      patientId: "ed8a70d7-8f58-413b-a668-a0ca31d030d9",
      status: AppointmentStatus.CONFIRMED,
      notes: "[SESSION_MODE:VR]\nReady for exposure work"
    } as never);
    vi.mocked(prisma.vrSession.create).mockResolvedValue({
      id: "7a9b5f43-8cfe-40cb-96e9-7a8fd89d0206",
      status: VrSessionStatus.WAITING,
      patientId: "ed8a70d7-8f58-413b-a668-a0ca31d030d9"
    } as never);

    const response = await createVrSession(
      new Request("http://localhost:3000/api/vr/sessions", {
        method: "POST",
        body: JSON.stringify({
          scenarioId: "85fb4856-d281-4b33-9c69-7397b9f4ada2",
          appointmentId: "5c4a9f12-139d-4552-8f90-e6f6b8568117"
        })
      })
    );
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.session.id).toBe("7a9b5f43-8cfe-40cb-96e9-7a8fd89d0206");
    expect(prisma.vrSession.create).toHaveBeenCalledWith({
      data: {
        scenarioId: "85fb4856-d281-4b33-9c69-7397b9f4ada2",
        doctorId: "84363838-e33a-43ab-bf74-3bf9326e86de",
        patientId: "ed8a70d7-8f58-413b-a668-a0ca31d030d9",
        status: VrSessionStatus.WAITING
      }
    });
  });

  it("rejects non-VR appointments", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      session: {
        user: {
          id: "d7123f65-c530-4b54-9f55-0d57e6db7b2c",
          role: Role.DOCTOR,
          doctorId: "b4406c29-e9ba-4e3b-a7d6-446d68e11978"
        }
      }
    } as never);

    vi.mocked(prisma.vrScenario.findUnique).mockResolvedValue({ id: "6f07c83f-b97a-48ab-a9de-476e1c4f9a3f" } as never);
    vi.mocked(prisma.appointment.findUnique).mockResolvedValue({
      id: "5ce5f282-db24-4d72-b341-c37e7d76769c",
      doctorId: "b4406c29-e9ba-4e3b-a7d6-446d68e11978",
      patientId: "cb08f0fc-c5fd-455e-b148-3435d1348dff",
      status: AppointmentStatus.CONFIRMED,
      notes: "[SESSION_MODE:ZOOM]"
    } as never);

    const response = await createVrSession(
      new Request("http://localhost:3000/api/vr/sessions", {
        method: "POST",
        body: JSON.stringify({
          scenarioId: "6f07c83f-b97a-48ab-a9de-476e1c4f9a3f",
          appointmentId: "5ce5f282-db24-4d72-b341-c37e7d76769c"
        })
      })
    );
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json.error).toBe("Only VR appointments can create VR sessions");
    expect(prisma.vrSession.create).not.toHaveBeenCalled();
  });
});
