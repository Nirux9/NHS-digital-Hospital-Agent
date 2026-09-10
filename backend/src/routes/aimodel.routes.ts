import { Router } from 'express';
import * as aimodelController from '../controllers/aimodel.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/models', authenticate, authorize('ADMIN', 'DOCTOR'), aimodelController.getModels);
router.get('/models/:id', authenticate, authorize('ADMIN', 'DOCTOR'), aimodelController.getModel);
router.post('/models/:id/retrain', authenticate, authorize('ADMIN'), aimodelController.retrainModel);

export default router;
