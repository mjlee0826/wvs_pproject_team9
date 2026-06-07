import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import * as ctrl from './commentController';

const router = Router();

router.post('/', requireAuth, ctrl.createComment);
router.patch('/:id', requireAuth, ctrl.updateComment);
router.delete('/:id', requireAuth, ctrl.deleteComment);

export default router;