import { Router } from 'express';
import * as assistantController from '../controllers/assistant.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/message', assistantController.sendMessage);

export default router;
