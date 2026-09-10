import { z } from 'zod';

export const createPatientSchema = z.object({
  dateOfBirth: z.string().or(z.date()),
  gender: z.string(),
  bloodGroup: z.string().optional(),
  address: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
});

export const updatePatientSchema = createPatientSchema.partial();
