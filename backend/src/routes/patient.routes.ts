import { Router } from 'express';
import * as patientController from '../controllers/patient.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createPatientSchema, updatePatientSchema } from '../validators/patient.validator';

const router = Router();

router.get('/', authenticate, authorize('ADMIN', 'DOCTOR'), patientController.getAllPatients);
router.get('/:id', authenticate, patientController.getPatient);
router.post('/', authenticate, validate(createPatientSchema), patientController.createPatient);
router.put('/:id', authenticate, validate(updatePatientSchema), patientController.updatePatient);
router.delete('/:id', authenticate, authorize('ADMIN'), patientController.deletePatient);

router.get('/:id/clinical-summary', authenticate, patientController.getPatientClinicalSummary);
router.get('/:id/appointments', authenticate, patientController.getPatientAppointments);
router.get('/:id/medical-records', authenticate, patientController.getPatientMedicalRecords);
router.get('/:id/prescriptions', authenticate, patientController.getPatientPrescriptions);
router.get('/:id/test-results', authenticate, patientController.getPatientTestResults);
router.get('/:id/notifications', authenticate, patientController.getPatientNotifications);

export default router;
