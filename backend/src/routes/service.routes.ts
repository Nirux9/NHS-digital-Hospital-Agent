import { Router } from 'express';
import * as serviceController from '../controllers/service.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, serviceController.getServices);
router.get('/:id', authenticate, serviceController.getServiceById);
router.post('/', authenticate, serviceController.createService);
router.put('/:id', authenticate, serviceController.updateService);
router.patch('/:id/status', authenticate, serviceController.updateServiceStatus);
router.delete('/:id', authenticate, serviceController.deleteService);

export default router;
