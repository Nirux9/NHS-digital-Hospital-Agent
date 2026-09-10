import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';
import { chatWithAssistant } from '../services/ai.service';
import { logAudit } from '../services/audit.service';

export async function sendMessage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { message, role, history } = req.body;

    if (!message || !message.trim()) {
      return sendError(res, 'VALIDATION_ERROR', 'Message content is required', 400);
    }

    const userRole = role || req.user?.role?.toLowerCase() || 'patient';
    const responseText = await chatWithAssistant(message, userRole, history || []);

    try {
      await logAudit({
        userId: req.user?.userId,
        action: 'AI_ASSISTANT_QUERY',
        entity: 'AIAssistant',
        metadata: { queryLength: message.length, role: userRole },
        ipAddress: req.ip,
      });
    } catch {
      // Ignored if DB is offline
    }

    return sendSuccess(res, { response: responseText }, 'AI assistant response generated');
  } catch (error) {
    return next(error);
  }
}
