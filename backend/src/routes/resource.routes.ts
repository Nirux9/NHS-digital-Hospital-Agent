import { Router } from 'express';
import * as resourceController from '../controllers/resource.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, resourceController.getResources);
router.get('/:id', authenticate, resourceController.getResource);
router.post('/', authenticate, authorize('ADMIN'), resourceController.createResource);
router.put('/:id', authenticate, authorize('ADMIN'), resourceController.updateResource);
router.delete('/:id', authenticate, authorize('ADMIN'), resourceController.deleteResource);

export default router;
