import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendError, sendPaginated, getPagination } from '../utils/response';
import prisma from '../config/database';

export async function getNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 'UNAUTHORIZED', 'Not authenticated', 401);

    const { page, limit, skip } = getPagination(req.query);

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where: { userId } }),
    ]);

    return sendPaginated(res, notifications, total, page, limit, 'Notifications retrieved');
  } catch (error) {
    return next(error);
  }
}

export async function markRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const notification = await prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });

    return sendSuccess(res, notification, 'Notification marked as read');
  } catch (error) {
    return next(error);
  }
}

export async function markAllRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 'UNAUTHORIZED', 'Not authenticated', 401);

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return sendSuccess(res, null, 'All notifications marked as read');
  } catch (error) {
    return next(error);
  }
}
