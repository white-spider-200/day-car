import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("bcryptjs", () => ({
  hash: vi.fn()
}));

vi.mock("@/lib/username", () => ({
  generateUniqueUsername: vi.fn()
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn()
    }
  }
}));

import { POST } from "@/app/api/auth/register/route";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateUniqueUsername } from "@/lib/username";

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("requires details confirmation", async () => {
    const response = await POST(
      new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: "User One",
          email: "one@test.com",
          password: "User12345!",
          locale: "en",
          detailsConfirmed: false
        })
      })
    );

    expect(response.status).toBe(400);
  });

  it("creates user with generated username", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null as never);
    vi.mocked(hash).mockResolvedValue("hashed_pw" as never);
    vi.mocked(generateUniqueUsername).mockResolvedValue("user_one");

    vi.mocked(prisma.user.create).mockResolvedValue({
      id: "u1",
      name: "User One",
      username: "user_one",
      email: "one@test.com",
      role: "USER",
      locale: "en"
    } as never);

    const response = await POST(
      new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: "User One",
          email: "one@test.com",
          password: "User12345!",
          locale: "en",
          detailsConfirmed: true
        })
      })
    );

    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.user.username).toBe("user_one");
  });
});
