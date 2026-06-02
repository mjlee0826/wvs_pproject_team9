import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import * as ctrl from './chatController';

const router = Router();

router.get('/rooms', requireAuth, ctrl.getRooms);
router.get('/rooms/:id/messages', requireAuth, ctrl.getMessages);
router.post('/rooms/:id/messages', requireAuth, ctrl.sendMessage);

export default router;