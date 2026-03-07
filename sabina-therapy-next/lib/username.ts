import { prisma } from "@/lib/prisma";

function toUsernameBase(input: string): string {
  const clean = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s._-]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[_\-.]+|[_\-.]+$/g, "");

  const base = clean || "user";
  return base.slice(0, 20);
}

export async function generateUniqueUsername(seed: string): Promise<string> {
  const base = toUsernameBase(seed);

  let attempt = base;
  let counter = 0;

  while (true) {
    const found = await prisma.user.findUnique({
      where: { username: attempt },
      select: { id: true }
    });

    if (!found) {
      return attempt;
    }

    counter += 1;
    attempt = `${base}_${counter}`.slice(0, 30);
  }
}
