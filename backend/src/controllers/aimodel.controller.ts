import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';
import prisma from '../config/database';
import { logAudit } from '../services/audit.service';

import fs from 'fs';
import path from 'path';

export async function getModels(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    let metadata = null;
    const metadataPath = path.join(process.cwd(), 'models', 'triage_model_metadata.json');
    if (fs.existsSync(metadataPath)) {
      metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    }

    let dbModels: any[] = [];
    try {
      dbModels = await prisma.aIModel.findMany();
    } catch {
      // Fallback if DB offline
    }

    if (metadata) {
      return sendSuccess(res, {
        models: dbModels,
        primaryModel: metadata,
      }, 'AI model metadata retrieved');
    }

    return sendSuccess(res, dbModels, 'AI models retrieved');
  } catch (error) {
    return next(error);
  }
}

export async function getModel(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const model = await prisma.aIModel.findUnique({ where: { id } });
    if (!model) return sendError(res, 'NOT_FOUND', 'AI model not found', 404);
    return sendSuccess(res, model, 'AI model details retrieved');
  } catch (error) {
    return next(error);
  }
}

export async function retrainModel(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const model = await prisma.aIModel.update({
      where: { id },
      data: {
        status: 'TRAINING',
        lastUpdated: new Date(),
      },
    });

    await logAudit({
      userId: req.user?.userId,
      action: 'RETRAIN_AI_MODEL',
      entity: 'AIModel',
      entityId: id,
      ipAddress: req.ip,
    });

    return sendSuccess(res, model, 'AI model retraining initiated');
  } catch (error) {
    return next(error);
  }
}
