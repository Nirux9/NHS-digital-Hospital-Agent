import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';
import prisma from '../config/database';

export async function getMessages(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 'UNAUTHORIZED', 'Not authenticated', 401);

    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: { select: { id: true, name: true, role: true } },
        receiver: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, messages, 'Messages retrieved');
  } catch (error) {
    return next(error);
  }
}

export async function getConversation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    const { userId: otherUserId } = req.params;

    if (!userId) return sendError(res, 'UNAUTHORIZED', 'Not authenticated', 401);

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      include: {
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return sendSuccess(res, messages, 'Conversation retrieved');
  } catch (error) {
    return next(error);
  }
}

export async function sendMessage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const senderId = req.user?.userId;
    const { receiverId, content } = req.body;

    if (!senderId) return sendError(res, 'UNAUTHORIZED', 'Not authenticated', 401);

    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) return sendError(res, 'NOT_FOUND', 'Recipient user not found', 404);

    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
      },
      include: {
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
      },
    });

    return sendSuccess(res, message, 'Message sent successfully', 201);
  } catch (error) {
    return next(error);
  }
}

export async function markMessageRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const message = await prisma.message.updateMany({
      where: { id, receiverId: userId },
      data: { isRead: true },
    });

    return sendSuccess(res, message, 'Message marked as read');
  } catch (error) {
    return next(error);
  }
}
