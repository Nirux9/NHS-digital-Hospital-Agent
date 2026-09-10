import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { JwtPayload } from '../types';

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'default_jwt_secret_nhs';
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '1d') as SignOptions['expiresIn'];

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
