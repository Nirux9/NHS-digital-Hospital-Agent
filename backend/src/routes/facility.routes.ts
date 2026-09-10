import { Router } from 'express';
import * as facilityController from '../controllers/facility.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, facilityController.getFacilities);
router.get('/:id', authenticate, facilityController.getFacility);
router.post('/', authenticate, facilityController.createFacility);
router.put('/:id', authenticate, facilityController.updateFacility);
router.patch('/:id/status', authenticate, facilityController.updateFacilityStatus);
router.delete('/:id', authenticate, facilityController.deleteFacility);

export default router;
