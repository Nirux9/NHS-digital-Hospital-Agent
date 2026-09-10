import { Router } from 'express';
import * as wardController from '../controllers/ward.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/wards', authenticate, wardController.getWards);
router.get('/wards/:id', authenticate, wardController.getWard);
router.get('/beds', authenticate, wardController.getBeds);
router.patch('/beds/:id/status', authenticate, authorize('ADMIN', 'DOCTOR'), wardController.updateBedStatus);
router.post('/beds/:id/assign', authenticate, authorize('ADMIN', 'DOCTOR'), wardController.assignBed);
router.post('/beds/:id/release', authenticate, authorize('ADMIN', 'DOCTOR'), wardController.releaseBed);

export default router;
