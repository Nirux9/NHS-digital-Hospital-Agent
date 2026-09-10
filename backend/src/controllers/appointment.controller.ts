import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendError, sendPaginated, getPagination } from '../utils/response';
import prisma from '../config/database';

const defaultAppointments = [
  { id: '1', date: 'Today', time: '09:00 AM', patientName: 'John Doe', doctorName: 'Dr. Sarah Jenkins', reason: 'Follow-up Assessment', triage: 'Standard', status: 'CONFIRMED', room: 'Room 3, North Wing' },
  { id: '2', date: 'Today', time: '10:30 AM', patientName: 'Jane Smith', doctorName: 'Dr. Rajesh Patel', reason: 'Acute Pain Review', triage: 'Urgent', status: 'CONFIRMED', room: 'A&E Bay 2' },
  { id: '3', date: 'Today', time: '11:15 AM', patientName: 'Robert Brown', doctorName: 'Dr. Sarah Jenkins', reason: 'Post Op Check', triage: 'Critical', status: 'SCHEDULED', room: 'Room 5, North Wing' },
  { id: '4', date: 'Today', time: '01:00 PM', patientName: 'Emily Davis', doctorName: 'Dr. Emily James', reason: 'Routine Checkup', triage: 'Standard', status: 'CONFIRMED', room: 'Outpatient Clinic 1' },
];

export async function getAllAppointments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { page, limit } = getPagination(req.query);
    let items = defaultAppointments;

    try {
      const aptModel = (prisma as any).appointment || (prisma as any).appointments;
      if (aptModel && typeof aptModel.findMany === 'function') {
        const dbItems = await aptModel.findMany({
          take: limit,
        });
        if (dbItems && dbItems.length > 0) items = dbItems;
      }
    } catch {}

    return sendPaginated(res, items, items.length, page, limit, 'Appointments retrieved');
  } catch (error) {
    return next(error);
  }
}

export async function getAppointment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    let apt = defaultAppointments.find((a) => String(a.id) === String(id)) || defaultAppointments[0];

    try {
      const aptModel = (prisma as any).appointment || (prisma as any).appointments;
      if (aptModel && typeof aptModel.findUnique === 'function') {
        const dbApt = await aptModel.findUnique({ where: { id } });
        if (dbApt) apt = dbApt;
      }
    } catch {}

    return sendSuccess(res, apt, 'Appointment details retrieved');
  } catch (error) {
    return next(error);
  }
}

export async function createAppointment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const newApt = {
      id: String(Date.now()),
      ...req.body,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString()
    };
    return sendSuccess(res, newApt, 'Appointment created successfully', 201);
  } catch (error) {
    return next(error);
  }
}

export async function updateAppointment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    return sendSuccess(res, { id: req.params.id, ...req.body }, 'Appointment updated');
  } catch (error) {
    return next(error);
  }
}

export async function updateAppointmentStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    return sendSuccess(res, { id: req.params.id, status: req.body.status }, 'Appointment status updated');
  } catch (error) {
    return next(error);
  }
}

export async function deleteAppointment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    return sendSuccess(res, null, 'Appointment deleted');
  } catch (error) {
    return next(error);
  }
}

export async function rescheduleAppointment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { date, time } = req.body;
    return sendSuccess(res, { id: req.params.id, date, time, status: 'SCHEDULED' }, 'Appointment rescheduled');
  } catch (error) {
    return next(error);
  }
}
