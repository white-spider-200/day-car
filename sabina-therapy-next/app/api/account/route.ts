import { Prisma, Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateUniqueUsername } from "@/lib/username";
import { updateAccountSchema } from "@/lib/validation";

export async function GET() {
  const auth = await requireAuth([Role.ADMIN, Role.DOCTOR, Role.USER]);
  if (auth.error) {
    return auth.error;
  }

  let user = await prisma.user.findUnique({
    where: { id: auth.session.user.id },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      locale: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!user) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  if (!user.username) {
    const generated = await generateUniqueUsername(user.name || user.email.split("@")[0]);
    user = await prisma.user.update({
      where: { id: user.id },
      data: { username: generated },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        locale: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  return NextResponse.json({ user });
}

export async function PATCH(request: Request) {
  const auth = await requireAuth([Role.ADMIN, Role.DOCTOR, Role.USER]);
  if (auth.error) {
    return auth.error;
  }

  try {
    const payload = updateAccountSchema.parse(await request.json());

    const user = await prisma.user.update({
      where: { id: auth.session.user.id },
      data: {
        name: payload.name,
        username: payload.username,
        locale: payload.locale
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        locale: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Username already exists" }, { status: 409 });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to update account"
      },
      { status: 400 }
    );
  }
}

export async function DELETE() {
  const auth = await requireAuth([Role.ADMIN, Role.DOCTOR, Role.USER]);
  if (auth.error) {
    return auth.error;
  }

  await prisma.user.delete({ where: { id: auth.session.user.id } });

  return NextResponse.json({ success: true });
}
