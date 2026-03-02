import { Role } from "@prisma/client";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      doctorId?: string | null;
      locale?: "en" | "ar";
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: Role;
    doctorId?: string | null;
    locale?: "en" | "ar";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    doctorId?: string | null;
    locale?: "en" | "ar";
  }
}
