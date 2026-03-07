import { hash } from "bcryptjs";
import { Prisma, Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateUniqueUsername } from "@/lib/username";
import { registerSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = registerSchema.parse(json);
    if (!payload.detailsConfirmed) {
      return NextResponse.json({ error: "Please confirm your account details" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email: payload.email.toLowerCase() }
    });

    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const passwordHash = await hash(payload.password, 10);
    const username = await generateUniqueUsername(payload.name || payload.email.split("@")[0]);

    const user = await prisma.user.create({
      data: {
        name: payload.name,
        username,
        email: payload.email.toLowerCase(),
        passwordHash,
        role: Role.USER,
        locale: payload.locale
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        locale: true
      }
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Username or email already in use" }, { status: 409 });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Registration failed"
      },
      { status: 400 }
    );
  }
}
