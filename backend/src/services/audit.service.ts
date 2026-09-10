import prisma from '../config/database';
import { Prisma } from '@prisma/client';

export async function logAudit(data: {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
}) {
  try {
    if ((prisma as any).auditLog && typeof (prisma as any).auditLog.create === 'function') {
      return await (prisma as any).auditLog.create({
        data: {
          userId: data.userId || null,
          action: data.action,
          entity: data.entity,
          entityId: data.entityId || null,
          metadata: data.metadata || Prisma.JsonNull,
          ipAddress: data.ipAddress || null,
        },
      });
    }
  } catch (err) {
    console.warn('[Audit Log Warning]', err);
  }
  console.log(`[Audit Log] ${data.action} on ${data.entity} (${data.entityId || 'N/A'}) by ${data.userId || 'anonymous'}`);
  return null;
}
