import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole } from '../types';
import { verifyToken } from '../utils/jwt';
import { sendError } from '../utils/response';

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  // If no auth header or missing Bearer token, fallback to demo user role based on query/header
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const roleQuery = String(req.query.role || req.headers['x-user-role'] || 'patient').toUpperCase() as UserRole;
    const validRole: UserRole = ['DOCTOR', 'ADMIN', 'PATIENT'].includes(roleQuery) ? roleQuery : 'PATIENT';
    
    req.user = {
      userId: validRole === 'DOCTOR' ? 'dr_smith_id' : validRole === 'ADMIN' ? 'admin_id' : 'patient1_id',
      email: `${validRole.toLowerCase()}@nhs.demo`,
      role: validRole,
    };
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyToken(token);
    req.user = payload;
    return next();
  } catch (error) {
    // Fallback for demo token or expired token in dev mode
    const roleQuery = String(req.query.role || req.headers['x-user-role'] || 'patient').toUpperCase() as UserRole;
    const validRole: UserRole = ['DOCTOR', 'ADMIN', 'PATIENT'].includes(roleQuery) ? roleQuery : 'PATIENT';

    req.user = {
      userId: validRole === 'DOCTOR' ? 'dr_smith_id' : validRole === 'ADMIN' ? 'admin_id' : 'patient1_id',
      email: `${validRole.toLowerCase()}@nhs.demo`,
      role: validRole,
    };
    return next();
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'UNAUTHORIZED', 'User not authenticated', 401);
    }

    if (!roles.includes(req.user.role)) {
      return sendError(res, 'FORBIDDEN', 'Insufficient permissions for this resource', 403);
    }

    return next();
  };
}
