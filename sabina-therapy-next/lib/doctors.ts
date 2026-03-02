import { Prisma } from "@prisma/client";

export const doctorPublicSelect = {
  id: true,
  slug: true,
  specialty: true,
  bio: true,
  languages: true,
  location: true,
  fees: true,
  photoUrl: true,
  isTopDoctor: true,
  isApproved: true,
  user: {
    select: {
      name: true
    }
  },
  verification: {
    select: {
      verificationBadge: true,
      licenseNumber: true
    }
  }
} satisfies Prisma.DoctorSelect;

export function buildDoctorWhere(filters: {
  q?: string;
  language?: string;
  location?: string;
  specialty?: string;
  minPrice?: number;
  maxPrice?: number;
  topOnly?: boolean;
}) {
  const where: Prisma.DoctorWhereInput = {
    isApproved: true
  };

  if (filters.q) {
    where.OR = [
      { user: { name: { contains: filters.q, mode: "insensitive" } } },
      { bio: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  if (filters.language) {
    where.languages = {
      has: filters.language
    };
  }

  if (filters.location) {
    where.location = filters.location as never;
  }

  if (filters.specialty) {
    where.specialty = filters.specialty as never;
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.fees = {
      gte: filters.minPrice,
      lte: filters.maxPrice
    };
  }

  if (filters.topOnly) {
    where.isTopDoctor = true;
  }

  return where;
}
