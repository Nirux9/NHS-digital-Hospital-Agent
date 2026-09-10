import { z } from 'zod';

export const createAppointmentSchema = z.object({
  patientId: z.string(),
  doctorId: z.string(),
  date: z.string().or(z.date()),
  time: z.string(),
  reason: z.string(),
  room: z.string().optional(),
  triageLevel: z.number().int().min(1).max(5).optional(),
});

export const updateAppointmentSchema = createAppointmentSchema.partial();

export const rescheduleSchema = z.object({
  date: z.string().or(z.date()),
  time: z.string(),
  reason: z.string().optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
});
