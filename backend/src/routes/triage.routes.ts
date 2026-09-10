import { Router } from 'express';
import * as triageController from '../controllers/triage.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, triageController.submitTriageAssessment);
router.get('/alerts', authenticate, authorize('DOCTOR', 'ADMIN'), triageController.getTriageAlerts);
router.get('/alerts/:id', authenticate, authorize('DOCTOR', 'ADMIN'), triageController.getTriageAlert);
router.patch('/alerts/:id/acknowledge', authenticate, authorize('DOCTOR', 'ADMIN'), triageController.acknowledgeTriageAlert);

export default router;

