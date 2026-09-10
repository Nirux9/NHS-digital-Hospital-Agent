import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendError, sendPaginated, getPagination } from '../utils/response';
import prisma from '../config/database';
import { logAudit } from '../services/audit.service';

interface ClinicalReviewRecord {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  assessment: string;
  clinicalNotes: string;
  treatmentPlan: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const inMemoryReviews: ClinicalReviewRecord[] = [
  {
    id: 'rev_1',
    patientId: 'patient1',
    doctorId: 'dr_smith_id',
    assessment: 'Patient presents with persistent acute dyspnea and elevated troponin levels.',
    clinicalNotes: 'Initiated oxygen therapy and continuous telemetry monitor.',
    treatmentPlan: 'Schedule urgent coronary angiogram and continue dual antiplatelet therapy.',
    status: 'COMPLETED',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  }
];

export async function getClinicalReviews(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { page, limit } = getPagination(req.query);
    const { doctorId, patientId, status } = req.query;

    let items = [...inMemoryReviews];
    if (doctorId) items = items.filter(r => r.doctorId === String(doctorId));
    if (patientId) items = items.filter(r => r.patientId === String(patientId));
    if (status) items = items.filter(r => r.status.toUpperCase() === String(status).toUpperCase());

    return sendPaginated(res, items, items.length, page, limit, 'Clinical reviews retrieved');
  } catch (error) {
    return next(error);
  }
}

export async function getClinicalReview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const review = inMemoryReviews.find(r => r.id === id);
    if (!review) return sendError(res, 'NOT_FOUND', 'Clinical review not found', 404);
    return sendSuccess(res, review, 'Clinical review retrieved');
  } catch (error) {
    return next(error);
  }
}

export async function createClinicalReview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const body = req.body || {};
    const newReview: ClinicalReviewRecord = {
      id: `rev_${Date.now()}`,
      patientId: body.patientId || 'patient1',
      doctorId: req.user?.userId || body.doctorId || 'dr_smith_id',
      appointmentId: body.appointmentId,
      assessment: body.assessment || body.summary || '',
      clinicalNotes: body.clinicalNotes || body.findings || '',
      treatmentPlan: body.treatmentPlan || body.plan || '',
      status: body.status || 'COMPLETED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    inMemoryReviews.unshift(newReview);

    await logAudit({
      userId: req.user?.userId,
      action: 'CREATE_CLINICAL_REVIEW',
      entity: 'ClinicalReview',
      entityId: newReview.id,
      ipAddress: req.ip,
    });

    return sendSuccess(res, newReview, 'Clinical review saved successfully', 201);
  } catch (error) {
    return next(error);
  }
}

export async function updateClinicalReview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const index = inMemoryReviews.findIndex(r => r.id === id);
    
    if (index !== -1) {
      inMemoryReviews[index] = {
        ...inMemoryReviews[index],
        ...req.body,
        updatedAt: new Date().toISOString(),
      };

      await logAudit({
        userId: req.user?.userId,
        action: 'UPDATE_CLINICAL_REVIEW',
        entity: 'ClinicalReview',
        entityId: id,
        ipAddress: req.ip,
      });

      return sendSuccess(res, inMemoryReviews[index], 'Clinical review updated');
    }

    return sendError(res, 'NOT_FOUND', 'Clinical review record not found', 404);
  } catch (error) {
    return next(error);
  }
}

export async function updateClinicalReviewStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const index = inMemoryReviews.findIndex(r => r.id === id);

    if (index !== -1) {
      inMemoryReviews[index].status = status || 'COMPLETED';
      inMemoryReviews[index].updatedAt = new Date().toISOString();

      await logAudit({
        userId: req.user?.userId,
        action: 'UPDATE_CLINICAL_REVIEW_STATUS',
        entity: 'ClinicalReview',
        entityId: id,
        ipAddress: req.ip,
      });

      return sendSuccess(res, inMemoryReviews[index], 'Clinical review status updated');
    }

    return sendError(res, 'NOT_FOUND', 'Clinical review record not found', 404);
  } catch (error) {
    return next(error);
  }
}
