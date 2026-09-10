import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.routes';
import patientRoutes from './routes/patient.routes';
import doctorRoutes from './routes/doctor.routes';
import appointmentRoutes from './routes/appointment.routes';
import dashboardRoutes from './routes/dashboard.routes';
import triageRoutes from './routes/triage.routes';
import wardRoutes from './routes/ward.routes';
import clinicalRoutes from './routes/clinical.routes';
import analyticsRoutes from './routes/analytics.routes';
import notificationRoutes from './routes/notification.routes';
import messageRoutes from './routes/message.routes';
import assistantRoutes from './routes/assistant.routes';
import aimodelRoutes from './routes/aimodel.routes';
import resourceRoutes from './routes/resource.routes';
import searchRoutes from './routes/search.routes';
import facilityRoutes from './routes/facility.routes';
import serviceRoutes from './routes/service.routes';
import medicalRoutes from './routes/medical.routes';

import { errorHandler } from './middleware/error.middleware';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));

// Logging middleware
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests, please try again later.' } },
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

import prisma from './config/database';

// Health Check
app.get('/api/health', async (_req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  let isConnected = false;
  try {
    const result: any[] = await prisma.$queryRaw`SELECT 1;`;
    if (result && result.length > 0) {
      dbStatus = 'connected';
      isConnected = true;
    }
  } catch (err: any) {
    dbStatus = `disconnected: ${err.message}`;
  }

  res.json({
    status: isConnected ? 'ok' : 'error',
    database: isConnected ? 'connected' : dbStatus,
    success: isConnected,
    api: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'NHS Hospital AI Agent Production Backend',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/triage', triageRoutes);
app.use('/api', wardRoutes); // /api/wards & /api/beds
app.use('/api/clinical-reviews', clinicalRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/ai', aimodelRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/medical', medicalRoutes);

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested API endpoint does not exist.',
    },
  });
});

// Error Handling Middleware
app.use(errorHandler);

export default app;
