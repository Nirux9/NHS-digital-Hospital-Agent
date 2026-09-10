import { Router } from 'express';
import * as appointmentController from '../controllers/appointment.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  rescheduleSchema,
  updateStatusSchema,
} from '../validators/appointment.validator';

const router = Router();

router.get('/', authenticate, appointmentController.getAllAppointments);
router.get('/:id', authenticate, appointmentController.getAppointment);
router.post('/', authenticate, validate(createAppointmentSchema), appointmentController.createAppointment);
router.put('/:id', authenticate, validate(updateAppointmentSchema), appointmentController.updateAppointment);
router.patch('/:id/status', authenticate, validate(updateStatusSchema), appointmentController.updateAppointmentStatus);
router.delete('/:id', authenticate, authorize('ADMIN'), appointmentController.deleteAppointment);
router.post('/:id/reschedule', authenticate, validate(rescheduleSchema), appointmentController.rescheduleAppointment);

export default router;
