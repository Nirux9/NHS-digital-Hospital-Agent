import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';
import prisma from '../config/database';
import { logAudit } from '../services/audit.service';

export async function getWards(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const wards = await prisma.ward.findMany({
      include: {
        beds: {
          include: {
            patient: { include: { user: { select: { name: true } } } },
          },
        },
      },
    });

    const wardsWithStats = wards.map((w) => {
      const occupied = w.beds.filter((b) => b.status === 'OCCUPIED').length;
      const available = w.beds.filter((b) => b.status === 'AVAILABLE').length;
      const maintenance = w.beds.filter((b) => b.status === 'MAINTENANCE').length;
      const occupancyRate = w.totalBeds > 0 ? Math.round((occupied / w.totalBeds) * 1000) / 10 : 0;

      return {
        ...w,
        stats: {
          occupied,
          available,
          maintenance,
          occupancyRate: `${occupancyRate}%`,
        },
      };
    });

    return sendSuccess(res, wardsWithStats, 'Wards retrieved successfully');
  } catch (error) {
    return next(error);
  }
}

export async function getWard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const ward = await prisma.ward.findUnique({
      where: { id },
      include: {
        beds: {
          include: {
            patient: { include: { user: { select: { name: true, phone: true } } } },
          },
        },
      },
    });

    if (!ward) return sendError(res, 'NOT_FOUND', 'Ward not found', 404);
    return sendSuccess(res, ward, 'Ward details retrieved');
  } catch (error) {
    return next(error);
  }
}

export async function getBeds(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { wardId, status } = req.query;
    const where: any = {};
    if (wardId) where.wardId = String(wardId);
    if (status) where.status = String(status);

    const beds = await prisma.bed.findMany({
      where,
      include: {
        ward: { select: { name: true, department: true } },
        patient: { include: { user: { select: { name: true } } } },
      },
      orderBy: { bedNumber: 'asc' },
    });

    return sendSuccess(res, beds, 'Beds retrieved');
  } catch (error) {
    return next(error);
  }
}

export async function updateBedStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const bed = await prisma.bed.update({
      where: { id },
      data: { status },
    });

    await logAudit({
      userId: req.user?.userId,
      action: `UPDATE_BED_STATUS_${status}`,
      entity: 'Bed',
      entityId: id,
      ipAddress: req.ip,
    });

    return sendSuccess(res, bed, 'Bed status updated');
  } catch (error) {
    return next(error);
  }
}

export async function assignBed(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { patientId } = req.body;

    const bed = await prisma.bed.update({
      where: { id },
      data: {
        patientId,
        status: 'OCCUPIED',
      },
      include: {
        patient: { include: { user: { select: { name: true } } } },
      },
    });

    await logAudit({
      userId: req.user?.userId,
      action: 'ASSIGN_BED',
      entity: 'Bed',
      entityId: id,
      ipAddress: req.ip,
    });

    return sendSuccess(res, bed, 'Bed assigned to patient');
  } catch (error) {
    return next(error);
  }
}

export async function releaseBed(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const bed = await prisma.bed.update({
      where: { id },
      data: {
        patientId: null,
        status: 'AVAILABLE',
      },
    });

    await logAudit({
      userId: req.user?.userId,
      action: 'RELEASE_BED',
      entity: 'Bed',
      entityId: id,
      ipAddress: req.ip,
    });

    return sendSuccess(res, bed, 'Bed released');
  } catch (error) {
    return next(error);
  }
}
