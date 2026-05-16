import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { uploadPostImage } from '../utils/upload';
import * as ctrl from '../controllers/postController';

const router = Router();

router.get('/', ctrl.getPosts);
router.get('/:id', ctrl.getPostById);
router.post('/', requireAuth, uploadPostImage, ctrl.createPost);
router.patch('/:id', requireAuth, ctrl.updatePost);
router.delete('/:id', requireAuth, ctrl.deletePost);
router.post('/:id/like', requireAuth, requireAdmin, ctrl.likePost);
router.delete('/:id/like', requireAuth, requireAdmin, ctrl.unlikePost);

export default router;
