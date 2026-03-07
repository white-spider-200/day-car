import { Role } from "@prisma/client";
import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  locale: z.enum(["en", "ar"]).default("en"),
  detailsConfirmed: z.boolean().optional().default(true)
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
  sessionMode: z.enum(["zoom", "vr"]).default("zoom"),
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

export const createVrScenarioSchema = z.object({
  titleEn: z.string().min(3).max(120),
  titleAr: z.string().min(3).max(120),
  descriptionEn: z.string().min(10).max(2000),
  descriptionAr: z.string().min(10).max(2000),
  youtubeUrl: z.string().url().max(300)
});

export const listVrScenariosSchema = z.object({
  mine: z.coerce.boolean().optional()
});

export const createVrSessionSchema = z.object({
  scenarioId: z.string().uuid(),
  appointmentId: z.string().uuid().optional()
});

export const updateVrScenarioSchema = z.object({
  titleEn: z.string().min(3).max(120).optional(),
  titleAr: z.string().min(3).max(120).optional(),
  descriptionEn: z.string().min(10).max(2000).optional(),
  descriptionAr: z.string().min(10).max(2000).optional(),
  youtubeUrl: z.string().url().max(300).optional()
});

export const vrControlSchema = z.object({
  type: z.enum(["PLAY", "PAUSE", "SEEK", "CHANGE_SCENARIO", "END_SESSION"]),
  time: z.number().min(0).optional(),
  scenarioId: z.string().uuid().optional()
});

export const updateAccountSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9._-]+$/)
    .optional(),
  locale: z.enum(["en", "ar"]).optional()
});
