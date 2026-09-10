import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['DOCTOR', 'ADMIN', 'PATIENT']),
  phone: z.string().optional(),
  // Additional optional fields for profiles
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  department: z.string().optional(),
  specialization: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
