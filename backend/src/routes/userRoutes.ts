import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { uploadAvatar } from '../utils/upload';
import * as ctrl from '../controllers/userController';

const router = Router();

router.get('/me', requireAuth, ctrl.getMe);
router.post('/me', requireAuth, ctrl.upsertMe);
router.patch('/me', requireAuth, uploadAvatar, ctrl.updateMe);
router.get('/:id', requireAuth, ctrl.getUserById);
router.get('/:id/posts', requireAuth, ctrl.getUserPosts);

export default router;
