import { beforeEach, describe, expect, it, vi } from "vitest";
import { Role } from "@prisma/client";

vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn()
}));

vi.mock("@/lib/username", () => ({
  generateUniqueUsername: vi.fn()
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }
  }
}));

import { DELETE, GET, PATCH } from "@/app/api/account/route";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateUniqueUsername } from "@/lib/username";

describe("/api/account", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("auto-generates username when missing", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      session: { user: { id: "u1", role: Role.USER, doctorId: null } }
    } as never);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "u1",
      name: "Test User",
      username: null,
      email: "user@test.com",
      role: Role.USER,
      locale: "en",
      createdAt: new Date(),
      updatedAt: new Date()
    } as never);

    vi.mocked(generateUniqueUsername).mockResolvedValue("test_user");

    vi.mocked(prisma.user.update).mockResolvedValue({
      id: "u1",
      name: "Test User",
      username: "test_user",
      email: "user@test.com",
      role: Role.USER,
      locale: "en",
      createdAt: new Date(),
      updatedAt: new Date()
    } as never);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.user.username).toBe("test_user");
  });

  it("updates account fields", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      session: { user: { id: "u1", role: Role.DOCTOR, doctorId: "d1" } }
    } as never);

    vi.mocked(prisma.user.update).mockResolvedValue({
      id: "u1",
      name: "Dr Name",
      username: "dr_name",
      email: "doctor@test.com",
      role: Role.DOCTOR,
      locale: "ar",
      createdAt: new Date(),
      updatedAt: new Date()
    } as never);

    const response = await PATCH(
      new Request("http://localhost:3000/api/account", {
        method: "PATCH",
        body: JSON.stringify({ name: "Dr Name", username: "dr_name", locale: "ar" })
      })
    );

    const json = await response.json();
    expect(response.status).toBe(200);
    expect(json.user.username).toBe("dr_name");
  });

  it("deletes own account", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      session: { user: { id: "u1", role: Role.USER, doctorId: null } }
    } as never);

    vi.mocked(prisma.user.delete).mockResolvedValue({ id: "u1" } as never);

    const response = await DELETE();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
  });
});
