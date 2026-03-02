import { Role } from "@prisma/client";
import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  locale: z.enum(["en", "ar"]).default("en")
});

export const doctorFilterSchema = z.object({
  q: z.string().min(1).optional(),
  language: z.enum(["Arabic", "English"]).optional(),
  location: z.enum(["AMMAN", "IRBID", "ZARQA", "ONLINE"]).optional(),
  specialty: z
    .enum(["THERAPY", "PSYCHIATRY", "COUNSELING", "CHILD_THERAPY", "FAMILY_THERAPY", "CBT"])
    .optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
  topOnly: z.coerce.boolean().optional()
});

export const createAppointmentSchema = z.object({
  doctorId: z.string().uuid(),
  slotId: z.string().uuid(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  notes: z.string().max(500).optional()
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(["requested", "confirmed", "canceled", "completed"])
});

export const zoomCreateSchema = z.object({
  appointmentId: z.string().uuid()
});

export const joinInfoSchema = z.object({
  appointmentId: z.string().uuid(),
  role: z.nativeEnum(Role)
});
