import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';
import prisma from '../config/database';

export async function getAllDoctors(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { department } = req.query;
    const doctors = await prisma.doctor.findMany({
      where: department ? { department: String(department) } : {},
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, status: true } },
      },
    });
    return sendSuccess(res, doctors, 'Doctors retrieved successfully');
  } catch (error) {
    return next(error);
  }
}

export async function getDoctor(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        appointments: { take: 10, orderBy: { date: 'desc' } },
      },
    });
    if (!doctor) return sendError(res, 'NOT_FOUND', 'Doctor not found', 404);
    return sendSuccess(res, doctor, 'Doctor profile retrieved');
  } catch (error) {
    return next(error);
  }
}

export async function getDoctorSchedule(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const appointments = await prisma.appointment.findMany({
      where: { doctorId: id },
      include: { patient: { include: { user: { select: { name: true } } } } },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    });
    return sendSuccess(res, appointments, 'Doctor schedule retrieved');
  } catch (error) {
    return next(error);
  }
}

export async function getDoctorPatients(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const appointments = await prisma.appointment.findMany({
      where: { doctorId: id },
      select: { patient: { include: { user: { select: { name: true, email: true } } } } },
      distinct: ['patientId'],
    });
    const patients = appointments.map((a) => a.patient);
    return sendSuccess(res, patients, 'Doctor patients retrieved');
  } catch (error) {
    return next(error);
  }
}

export async function updateDoctorAvailability(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body;

    const doctor = await prisma.doctor.update({
      where: { id },
      data: { isAvailable: Boolean(isAvailable) },
    });

    return sendSuccess(res, doctor, 'Doctor availability updated');
  } catch (error) {
    return next(error);
  }
}
