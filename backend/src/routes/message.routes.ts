import { Router } from 'express';
import * as messageController from '../controllers/message.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, messageController.getMessages);
router.get('/conversation/:userId', authenticate, messageController.getConversation);
router.post('/', authenticate, messageController.sendMessage);
router.patch('/:id/read', authenticate, messageController.markMessageRead);

export default router;
