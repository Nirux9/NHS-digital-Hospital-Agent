import { Router } from 'express';
import * as doctorController from '../controllers/doctor.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, doctorController.getAllDoctors);
router.get('/:id', authenticate, doctorController.getDoctor);
router.get('/:id/schedule', authenticate, doctorController.getDoctorSchedule);
router.get('/:id/patients', authenticate, authorize('DOCTOR', 'ADMIN'), doctorController.getDoctorPatients);
router.patch('/:id/availability', authenticate, authorize('DOCTOR', 'ADMIN'), doctorController.updateDoctorAvailability);

export default router;
