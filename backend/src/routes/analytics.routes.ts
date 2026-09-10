import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/overview', authenticate, authorize('ADMIN', 'DOCTOR'), analyticsController.getOverview);
router.get('/no-show-rate', authenticate, authorize('ADMIN', 'DOCTOR'), analyticsController.getNoShowRate);
router.get('/bed-occupancy', authenticate, authorize('ADMIN', 'DOCTOR'), analyticsController.getBedOccupancy);
router.get('/wait-time', authenticate, authorize('ADMIN', 'DOCTOR'), analyticsController.getWaitTime);
router.get('/appointments', authenticate, authorize('ADMIN', 'DOCTOR'), analyticsController.getAppointmentVolume);
router.get('/ai-model-health', authenticate, authorize('ADMIN'), analyticsController.getAIModelHealth);
router.get('/system-activity', authenticate, authorize('ADMIN'), analyticsController.getSystemActivity);

export default router;
