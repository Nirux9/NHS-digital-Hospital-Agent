import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendError, sendPaginated, getPagination } from '../utils/response';
import prisma from '../config/database';
import { notifyPrescription, notifyTestResult } from '../services/notification.service';
import { logAudit } from '../services/audit.service';

export async function getMedicalRecords(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { patientId } = req.query;

    const where: any = {};
    if (patientId) where.patientId = String(patientId);

    if (req.user?.role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({ where: { userId: req.user.userId } });
      if (patient) where.patientId = patient.id;
    }

    const [records, total] = await Promise.all([
      prisma.medicalRecord.findMany({
        where,
        skip,
        take: limit,
        include: {
          patient: { include: { user: { select: { name: true } } } },
          doctor: { include: { user: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.medicalRecord.count({ where }),
    ]);

    return sendPaginated(res, records, total, page, limit, 'Medical records retrieved');
  } catch (error) {
    return next(error);
  }
}

export async function createMedicalRecord(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { patientId, doctorId, diagnosis, notes, medications, observations } = req.body;

    const record = await prisma.medicalRecord.create({
      data: {
        patientId,
        doctorId,
        diagnosis,
        notes,
        medications: medications || [],
        observations,
      },
    });

    await logAudit({
      userId: req.user?.userId,
      action: 'CREATE_MEDICAL_RECORD',
      entity: 'MedicalRecord',
      entityId: record.id,
      ipAddress: req.ip,
    });

    return sendSuccess(res, record, 'Medical record created', 201);
  } catch (error) {
    return next(error);
  }
}

export async function getPrescriptions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { patientId } = req.query;

    const where: any = {};
    if (patientId) where.patientId = String(patientId);

    if (req.user?.role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({ where: { userId: req.user.userId } });
      if (patient) where.patientId = patient.id;
    }

    const [prescriptions, total] = await Promise.all([
      prisma.prescription.findMany({
        where,
        skip,
        take: limit,
        include: {
          patient: { include: { user: { select: { name: true } } } },
          doctor: { include: { user: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.prescription.count({ where }),
    ]);

    return sendPaginated(res, prescriptions, total, page, limit, 'Prescriptions retrieved');
  } catch (error) {
    return next(error);
  }
}

export async function createPrescription(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { patientId, doctorId, medication, dosage, frequency, duration, instructions } = req.body;

    const prescription = await prisma.prescription.create({
      data: {
        patientId,
        doctorId,
        medication,
        dosage,
        frequency,
        duration,
        instructions,
        status: 'ACTIVE',
      },
      include: { patient: true },
    });

    await notifyPrescription(prescription.patient.userId, medication);

    await logAudit({
      userId: req.user?.userId,
      action: 'CREATE_PRESCRIPTION',
      entity: 'Prescription',
      entityId: prescription.id,
      ipAddress: req.ip,
    });

    return sendSuccess(res, prescription, 'Prescription created', 201);
  } catch (error) {
    return next(error);
  }
}

export async function getTestResults(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { patientId } = req.query;

    const where: any = {};
    if (patientId) where.patientId = String(patientId);

    if (req.user?.role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({ where: { userId: req.user.userId } });
      if (patient) where.patientId = patient.id;
    }

    const [results, total] = await Promise.all([
      prisma.testResult.findMany({
        where,
        skip,
        take: limit,
        include: {
          patient: { include: { user: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.testResult.count({ where }),
    ]);

    return sendPaginated(res, results, total, page, limit, 'Test results retrieved');
  } catch (error) {
    return next(error);
  }
}

export async function createTestResult(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { patientId, testName, result, unit, referenceRange, status } = req.body;

    const testResult = await prisma.testResult.create({
      data: {
        patientId,
        testName,
        result,
        unit,
        referenceRange,
        status: status || 'AVAILABLE',
      },
      include: { patient: true },
    });

    if (testResult.status === 'AVAILABLE') {
      await notifyTestResult(testResult.patient.userId, testName);
    }

    return sendSuccess(res, testResult, 'Test result created', 201);
  } catch (error) {
    return next(error);
  }
}
