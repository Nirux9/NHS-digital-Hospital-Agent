import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/doctor', authenticate, authorize('DOCTOR', 'ADMIN'), dashboardController.getDoctorDashboard);
router.get('/patient', authenticate, authorize('PATIENT', 'ADMIN'), dashboardController.getPatientDashboard);
router.get('/admin', authenticate, authorize('ADMIN'), dashboardController.getAdminDashboard);

export default router;
