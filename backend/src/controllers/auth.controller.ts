import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';
import { generateToken } from '../utils/jwt';
import { hashPassword, comparePassword, findUserByEmail, createUser, getUserById } from '../services/auth.service';
import prisma from '../config/database';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, password, role, phone, dateOfBirth, gender, department, specialization } = req.body;

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return sendError(res, 'DUPLICATE_ENTRY', 'Email address is already registered', 409);
    }

    const passwordHash = await hashPassword(password);

    const user = await createUser({
      name,
      email,
      passwordHash,
      role,
      phone,
    });

    if (role === 'PATIENT') {
      await prisma.patient.create({
        data: {
          userId: user.id,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date('1990-01-01'),
          gender: gender || 'Unspecified',
        },
      });
    } else if (role === 'DOCTOR') {
      await prisma.doctor.create({
        data: {
          userId: user.id,
          department: department || 'General Medicine',
          specialization: specialization || 'General Practitioner',
        },
      });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return sendSuccess(res, { user, token }, 'Registration successful', 201);
  } catch (error) {
    return next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    const user = await findUserByEmail(email);
    if (!user) {
      return sendError(res, 'INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return sendError(res, 'INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    if (user.status !== 'ACTIVE') {
      return sendError(res, 'ACCOUNT_DISABLED', 'Account is disabled or suspended', 403);
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const { passwordHash: _, ...userWithoutPassword } = user;

    return sendSuccess(res, { user: userWithoutPassword, token }, 'Login successful');
  } catch (error) {
    return next(error);
  }
}

export async function logout(_req: Request, res: Response) {
  return sendSuccess(res, null, 'Logged out successfully');
}

export async function me(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return sendError(res, 'UNAUTHORIZED', 'Not authenticated', 401);
    }

    const user = await getUserById(req.user.userId);
    if (!user) {
      return sendError(res, 'NOT_FOUND', 'User record not found', 404);
    }

    return sendSuccess(res, user, 'User profile retrieved');
  } catch (error) {
    return next(error);
  }
}
