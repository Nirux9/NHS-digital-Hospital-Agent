import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import prisma from '../config/database';

export function auditLog(action: string, entity: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.user?.userId || null;
        const ipAddress = req.ip || req.socket.remoteAddress || null;
        const entityId = req.params.id || req.body.id || null;

        prisma.auditLog.create({
          data: {
            userId,
            action,
            entity,
            entityId,
            metadata: {
              method: req.method,
              url: req.originalUrl,
              statusCode: res.statusCode,
            },
            ipAddress,
          },
        }).catch((err) => {
          console.error('[AuditLog Error]', err);
        });
      }
    });

    next();
  };
}
