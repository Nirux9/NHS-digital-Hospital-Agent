import { Router } from 'express';
import * as clinicalController from '../controllers/clinical.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, authorize('DOCTOR', 'ADMIN'), clinicalController.getClinicalReviews);
router.get('/:id', authenticate, authorize('DOCTOR', 'ADMIN'), clinicalController.getClinicalReview);
router.post('/', authenticate, authorize('DOCTOR'), clinicalController.createClinicalReview);
router.put('/:id', authenticate, authorize('DOCTOR'), clinicalController.updateClinicalReview);
router.patch('/:id/status', authenticate, authorize('DOCTOR'), clinicalController.updateClinicalReviewStatus);

export default router;
