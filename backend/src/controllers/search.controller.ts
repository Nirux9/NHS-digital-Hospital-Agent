import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { sendSuccess } from '../utils/response';
import prisma from '../config/database';

export async function search(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) {
      return sendSuccess(res, { patients: [], doctors: [], appointments: [], resources: [] }, 'Empty search query');
    }

    const role = req.user?.role;
    const results: any = { patients: [], doctors: [], appointments: [], resources: [] };

    // Search doctors (available to all roles)
    results.doctors = await prisma.doctor.findMany({
      where: {
        OR: [
          { department: { contains: q, mode: 'insensitive' } },
          { specialization: { contains: q, mode: 'insensitive' } },
          { user: { name: { contains: q, mode: 'insensitive' } } },
        ],
      },
      include: { user: { select: { name: true, email: true } } },
      take: 5,
    });

    // Search resources (available to all roles)
    results.resources = await prisma.resource.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { category: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 5,
    });

    // Search patients (doctors & admins only)
    if (role === 'DOCTOR' || role === 'ADMIN') {
      results.patients = await prisma.patient.findMany({
        where: {
          user: {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
            ],
          },
        },
        include: { user: { select: { name: true, email: true, phone: true } } },
        take: 5,
      });

      results.appointments = await prisma.appointment.findMany({
        where: {
          OR: [
            { reason: { contains: q, mode: 'insensitive' } },
            { room: { contains: q, mode: 'insensitive' } },
          ],
        },
        include: {
          patient: { include: { user: { select: { name: true } } } },
          doctor: { include: { user: { select: { name: true } } } },
        },
        take: 5,
      });
    }

    return sendSuccess(res, results, 'Search results retrieved');
  } catch (error) {
    return next(error);
  }
}
