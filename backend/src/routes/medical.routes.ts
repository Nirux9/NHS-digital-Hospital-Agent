import { Router } from 'express';
import * as medicalController from '../controllers/medical.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/records', authenticate, medicalController.getMedicalRecords);
router.post('/records', authenticate, authorize('DOCTOR'), medicalController.createMedicalRecord);

router.get('/prescriptions', authenticate, medicalController.getPrescriptions);
router.post('/prescriptions', authenticate, authorize('DOCTOR'), medicalController.createPrescription);

router.get('/test-results', authenticate, medicalController.getTestResults);
router.post('/test-results', authenticate, authorize('DOCTOR', 'ADMIN'), medicalController.createTestResult);

export default router;
